// triage.ts — Single Azure OpenAI chat completion per item.
// JSON-mode response; strict shape validation; drop irrelevant items.
// See project-design.md §3.8.

import type { AzureOpenAI } from "openai";
import type { FeedItem, TriageResult } from "./types.js";

export const DEFAULT_TRIAGE_TEMPERATURE = 0;
export const DEFAULT_TRIAGE_MAX_TOKENS = 400;

export class MalformedTriageResponseError extends Error {
  public readonly rawPayload: string;
  public readonly issue: string;

  constructor(rawPayload: string, issue: string) {
    super(`Malformed Azure OpenAI triage response: ${issue}`);
    this.name = "MalformedTriageResponseError";
    this.rawPayload = rawPayload;
    this.issue = issue;
  }
}

/**
 * System prompt: MUST contain the literal word "JSON" (Azure JSON-mode
 * requirement; see investigation §1 gotcha 2) AND enumerate the five
 * required output fields. Source-aware: the prompt branches on the
 * `Feed:` line in the user content (see buildUserContent).
 */
export const SYSTEM_PROMPT = [
  "You are an editorial triage assistant for a Claude Code knowledge hub aimed at bank colleagues who are learning Claude Code.",
  "Decide whether each item is relevant to that audience, and how confident you are.",
  "Be strict: the hub's value is signal, not coverage. When in doubt, reject. We prefer to miss one good item than admit five mediocre ones.",
  "",
  "Source-specific rules (the `Feed:` line in the user message tells you which source):",
  "",
  '* "Anthropic news" and "Claude Code releases" — high-trust official sources, lean permissive.',
  "  ACCEPT: model launches, new features, capability announcements, agentic-platform news, official guides, security/safety milestones.",
  '  REJECT: pure infrastructure or billing patch notes ("fixed a typo in CLI help text"); regional-only launches with no product change.',
  "",
  '* "Simon Willison" — broad LLM coverage; filter to what transfers to Claude Code users.',
  "  ACCEPT: posts mentioning Claude / Anthropic / MCP / agentic patterns, OR universally applicable LLM techniques (prompt engineering, eval, RAG, tool use) a colleague can reuse.",
  "  REJECT: deep dives into competitor-specific tooling (Gemini-only, GPT-only) with no Claude analogue; meta-blogging about his own setup with no transferable lesson.",
  "",
  '* "Hacker News (Claude/Anthropic)" — judge the LINKED article, not the comment thread. High false-positive rate.',
  "  ACCEPT: significant industry news — new model releases, major moves by big tech (OpenAI / Google / Meta / Microsoft / Anthropic), breakthrough research, agentic-platform launches.",
  '  REJECT: "Claude" false positives (Claude Shannon, the French given name, products unrelated to Anthropic\'s Claude); pure Ask-HN / Show-HN / poll threads; paywalled articles a colleague cannot read.',
  "",
  '* "r/ClaudeAI" — STRICT. Accept ONLY posts that fall into one of these four categories:',
  "    (a) Tips, tricks, prompts, workflow recipes — posts with concrete reproducible steps, prompts, or commands someone else can copy and apply.",
  "    (b) Field reports / war stories — documented failure modes with root cause and fix, or hard-won patterns from real use.",
  '    (c) Platform news — factual reporting of operational changes to Claude or Anthropic (rate limits, pricing, new model availability, feature rollouts, deprecations, outage post-mortems) with enough detail to be actionable. Reddit often surfaces these before the official blog. Example accept: "Claude Code weekly limits are increasing 50%, now through July 13."',
  '    (d) Professional / enterprise use — substantive case studies or experience reports from real workplace deployments; governance / compliance / security / audit considerations; at-scale rollout patterns; comparisons grounded in actual deployment experience. Example accept: "Claude in an Enterprise Environment" if it contains real specifics, not generic thought leadership.',
  '  REJECT (regardless of category): questions / "how do I…" / help requests; promo / "look what I built" / link-in-bio; complaints, rants, model-vs-model flamewars; screenshots without prose; memes, polls, billing or account drama; vendor pitches disguised as discussion; generic LinkedIn-style thought leadership with no specifics; pure speculation about how big-company-X uses Claude with no inside source.',
  "",
  "Cross-cutting rules (apply to every source):",
  "  1. English only. Reject non-English content.",
  "  2. Substance threshold: if title + content together cannot be summarized in a useful two-sentence summary, reject.",
  "  3. No retired-model content (Claude 2, Claude 3.0 specifics) unless explicitly historical/educational.",
  "  4. When in doubt, reject.",
  "",
  "Respond with a single JSON object and nothing else. The JSON object MUST have exactly these five fields:",
  '  - "relevant": boolean — true if useful for hub readers, false otherwise.',
  '  - "audience": one of "beginner" | "advanced" | "both".',
  '  - "topics": array of short kebab-case tags (e.g., "setup", "workflow", "mcp", "claudemd", "field-report"). Non-empty if relevant.',
  '  - "summary": a two-sentence plain-English summary of the item.',
  '  - "editor_confidence": one of "high" | "medium" | "low" — your certainty about the relevance verdict. Use "high" for clear accept or clear reject; "low" when borderline.',
  "",
  'Always return well-formed JSON. If the item is irrelevant, still return a complete JSON object with "relevant": false; other fields may be defaults (audience "both", topics: [], summary: "Not relevant.", editor_confidence reflecting how sure you are about the rejection).',
].join("\n");

const ALLOWED_AUDIENCE = new Set<string>(["beginner", "advanced", "both"]);
const ALLOWED_CONFIDENCE = new Set<string>(["high", "medium", "low"]);

/**
 * Calls Azure OpenAI chat completions for one item. Returns:
 *  - TriageResult when the response is well-formed AND relevant === true
 *  - null when well-formed AND relevant === false (drop item, AC9)
 *
 * Throws MalformedTriageResponseError on shape mismatch (AC8 negative path).
 */
export async function triageItem(
  client: AzureOpenAI,
  deployment: string,
  item: FeedItem,
): Promise<TriageResult | null> {
  const userContent = buildUserContent(item);

  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: DEFAULT_TRIAGE_TEMPERATURE,
    max_tokens: DEFAULT_TRIAGE_MAX_TOKENS,
    response_format: { type: "json_object" },
  });

  const choice = response.choices?.[0];
  const rawContent = choice?.message?.content;
  if (typeof rawContent !== "string" || rawContent.length === 0) {
    throw new MalformedTriageResponseError(
      String(rawContent ?? ""),
      "empty or missing message content",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    throw new MalformedTriageResponseError(
      rawContent,
      `not valid JSON: ${String(err)}`,
    );
  }

  const validated = validate(parsed, rawContent);

  if (!validated.relevant) {
    return null;
  }

  return validated;
}

function buildUserContent(item: FeedItem): string {
  const parts: string[] = [];
  parts.push(`Feed: ${item.feedName}`);
  parts.push(`Title: ${item.title}`);
  if (item.link) parts.push(`Link: ${item.link}`);
  if (item.publishedAt) parts.push(`Published: ${item.publishedAt.toISOString()}`);
  if (item.rawContent) {
    // Truncate raw content to keep prompts cheap.
    const trimmed = item.rawContent.slice(0, 2000);
    parts.push("");
    parts.push("Content:");
    parts.push(trimmed);
  }
  return parts.join("\n");
}

function validate(parsed: unknown, raw: string): TriageResult {
  if (parsed === null || typeof parsed !== "object") {
    throw new MalformedTriageResponseError(raw, "response is not a JSON object");
  }
  const obj = parsed as Record<string, unknown>;

  const relevant = obj["relevant"];
  if (typeof relevant !== "boolean") {
    throw new MalformedTriageResponseError(raw, '"relevant" must be boolean');
  }

  const audience = obj["audience"];
  if (typeof audience !== "string" || !ALLOWED_AUDIENCE.has(audience)) {
    throw new MalformedTriageResponseError(
      raw,
      '"audience" must be one of "beginner" | "advanced" | "both"',
    );
  }

  const topics = obj["topics"];
  if (!Array.isArray(topics) || !topics.every((t) => typeof t === "string")) {
    throw new MalformedTriageResponseError(
      raw,
      '"topics" must be an array of strings',
    );
  }

  const summary = obj["summary"];
  if (typeof summary !== "string") {
    throw new MalformedTriageResponseError(raw, '"summary" must be a string');
  }

  const confidence = obj["editor_confidence"];
  if (typeof confidence !== "string" || !ALLOWED_CONFIDENCE.has(confidence)) {
    throw new MalformedTriageResponseError(
      raw,
      '"editor_confidence" must be one of "high" | "medium" | "low"',
    );
  }

  return {
    relevant,
    audience: audience as TriageResult["audience"],
    topics: topics as string[],
    summary,
    editor_confidence: confidence as TriageResult["editor_confidence"],
  };
}

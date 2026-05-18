import { describe, it, expect, vi } from "vitest";
import {
  triageItem,
  MalformedTriageResponseError,
  SYSTEM_PROMPT,
  DEFAULT_TRIAGE_TEMPERATURE,
} from "../src/triage.js";
import type { FeedItem } from "../src/types.js";
import type { AzureOpenAI } from "openai";

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    feedName: "Anthropic news",
    guid: "g1",
    link: "https://example.com/x",
    title: "Claude 4 launches",
    publishedAt: new Date("2026-05-18T09:00:00Z"),
    rawContent: "Vision and longer context.",
    ...overrides,
  };
}

function makeMockClient(content: string): {
  client: AzureOpenAI;
  create: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn(async () => ({
    choices: [{ message: { content } }],
  }));
  const client = { chat: { completions: { create } } } as unknown as AzureOpenAI;
  return { client, create };
}

describe("triage.SYSTEM_PROMPT", () => {
  it("contains the literal word JSON (Azure JSON-mode requirement)", () => {
    expect(SYSTEM_PROMPT).toContain("JSON");
  });
});

describe("triage.triageItem", () => {
  it("parses well-formed triage response and returns TriageResult", async () => {
    const payload = JSON.stringify({
      relevant: true,
      audience: "beginner",
      topics: ["setup"],
      summary: "S1. S2.",
      editor_confidence: "high",
    });
    const { client, create } = makeMockClient(payload);
    const result = await triageItem(client, "gpt-4o-mini", makeItem());
    expect(result).toEqual({
      relevant: true,
      audience: "beginner",
      topics: ["setup"],
      summary: "S1. S2.",
      editor_confidence: "high",
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("forwards correct model parameter (R-6: deployment passed as model)", async () => {
    const payload = JSON.stringify({
      relevant: true,
      audience: "both",
      topics: ["t"],
      summary: "x. y.",
      editor_confidence: "medium",
    });
    const { client, create } = makeMockClient(payload);
    await triageItem(client, "my-deployment-name", makeItem());
    const callArgs = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs.model).toBe("my-deployment-name");
    expect(callArgs.temperature).toBe(DEFAULT_TRIAGE_TEMPERATURE);
    expect(callArgs.response_format).toEqual({ type: "json_object" });
  });

  it("system prompt sent to the model contains JSON literal", async () => {
    const payload = JSON.stringify({
      relevant: true,
      audience: "both",
      topics: ["t"],
      summary: "x. y.",
      editor_confidence: "high",
    });
    const { client, create } = makeMockClient(payload);
    await triageItem(client, "dep", makeItem());
    const callArgs = create.mock.calls[0]?.[0] as { messages: { role: string; content: string }[] };
    const system = callArgs.messages.find((m) => m.role === "system");
    expect(system?.content).toContain("JSON");
  });

  it("system prompt carries source-aware rules for r/ClaudeAI and HN", () => {
    expect(SYSTEM_PROMPT).toContain("r/ClaudeAI");
    expect(SYSTEM_PROMPT).toContain("Hacker News");
    expect(SYSTEM_PROMPT).toContain("Anthropic news");
    expect(SYSTEM_PROMPT).toContain("Simon Willison");
    expect(SYSTEM_PROMPT).toContain("When in doubt, reject");
    expect(SYSTEM_PROMPT).toContain("editor_confidence");
  });

  it("r/ClaudeAI block names all four ACCEPT categories", () => {
    expect(SYSTEM_PROMPT).toContain("Tips, tricks, prompts, workflow recipes");
    expect(SYSTEM_PROMPT).toContain("Field reports / war stories");
    expect(SYSTEM_PROMPT).toContain("Platform news");
    expect(SYSTEM_PROMPT).toContain("Professional / enterprise use");
  });

  it("drops items marked irrelevant (returns null)", async () => {
    const payload = JSON.stringify({
      relevant: false,
      audience: "both",
      topics: [],
      summary: "Not relevant.",
      editor_confidence: "high",
    });
    const { client } = makeMockClient(payload);
    const result = await triageItem(client, "dep", makeItem());
    expect(result).toBeNull();
  });

  it("preserves editor_confidence verbatim on relevant items", async () => {
    const payload = JSON.stringify({
      relevant: true,
      audience: "advanced",
      topics: ["mcp"],
      summary: "S1. S2.",
      editor_confidence: "low",
    });
    const { client } = makeMockClient(payload);
    const result = await triageItem(client, "dep", makeItem());
    expect(result?.editor_confidence).toBe("low");
  });

  it("rejects malformed triage response (wrong field types)", async () => {
    const payload = JSON.stringify({
      relevant: "yes",
      audience: "expert",
      topics: "setup",
      summary: 42,
      editor_confidence: "high",
    });
    const { client } = makeMockClient(payload);
    await expect(triageItem(client, "dep", makeItem())).rejects.toBeInstanceOf(
      MalformedTriageResponseError,
    );
  });

  it("rejects response that is not valid JSON", async () => {
    const { client } = makeMockClient("not json at all");
    await expect(triageItem(client, "dep", makeItem())).rejects.toBeInstanceOf(
      MalformedTriageResponseError,
    );
  });

  it("rejects response with missing audience field", async () => {
    const payload = JSON.stringify({
      relevant: true,
      topics: [],
      summary: "x.",
      editor_confidence: "high",
    });
    const { client } = makeMockClient(payload);
    await expect(triageItem(client, "dep", makeItem())).rejects.toBeInstanceOf(
      MalformedTriageResponseError,
    );
  });

  it("rejects response with missing editor_confidence field", async () => {
    const payload = JSON.stringify({
      relevant: true,
      audience: "both",
      topics: ["t"],
      summary: "x. y.",
    });
    const { client } = makeMockClient(payload);
    await expect(triageItem(client, "dep", makeItem())).rejects.toBeInstanceOf(
      MalformedTriageResponseError,
    );
  });

  it("rejects response with editor_confidence outside the allowed set", async () => {
    const payload = JSON.stringify({
      relevant: true,
      audience: "both",
      topics: ["t"],
      summary: "x. y.",
      editor_confidence: "very-high",
    });
    const { client } = makeMockClient(payload);
    await expect(triageItem(client, "dep", makeItem())).rejects.toBeInstanceOf(
      MalformedTriageResponseError,
    );
  });
});

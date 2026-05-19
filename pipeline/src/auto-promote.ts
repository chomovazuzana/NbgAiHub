// auto-promote.ts — Variant C policy gate (DECISIONS 2026-05-19).
//
// Returns true iff a triaged item should be written directly under
// `news/published/` rather than `news/incoming/`, bypassing the editorial
// PR review. Two conjunctive criteria:
//
//   1. `triage.editor_confidence === "high"` — the model staked its
//      reputation on this verdict.
//   2. The originating feed is marked `auto_promote_eligible: true` in
//      `config/rss-sources.json` — the source is professional enough that
//      its worst output is still acceptable hub content.
//
// Everything else routes through `news/incoming/` and the existing editorial
// PR. Conservative on unknowns: an item whose feed name is not in the map
// returns false (requires review). Pure — no I/O.

import type { EmittedItem, FeedSource } from "./types.js";

/**
 * Variant C policy gate. See module header for rationale.
 *
 * Pure. Returns true iff the item meets BOTH:
 *  - `triage.editor_confidence === "high"`
 *  - the originating feed has `auto_promote_eligible === true`
 *
 * Unknown feed (not present in `feeds` map) → false. We never auto-promote
 * something whose policy we can't read.
 */
export function shouldAutoPromote(
  emitted: EmittedItem,
  feeds: ReadonlyMap<string, FeedSource>,
): boolean {
  if (emitted.triage.editor_confidence !== "high") return false;
  const feed = feeds.get(emitted.item.feedName);
  if (!feed) return false;
  return feed.auto_promote_eligible === true;
}

/**
 * Convenience: build a feedName → FeedSource lookup. Orchestrator builds this
 * once per run.
 */
export function buildFeedMap(
  feeds: readonly FeedSource[],
): Map<string, FeedSource> {
  return new Map(feeds.map((f) => [f.name, f]));
}

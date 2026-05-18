# Issues - Pending Items

Pending items first (most critical at top). Completed items after. Remove fixed entries.

## Pending

*(none)*

## Completed

3. **RSS triage tightening — source-aware prompt + editor_confidence** ✓ COMPLETED 2026-05-18.
   Replaced the one-line "relevant to bank colleagues" prompt with explicit per-source rules (Anthropic / Claude Code releases lean permissive; Simon Willison filters to transferable LLM content; HN judges the linked article and rejects "Claude" name collisions; r/ClaudeAI restricted to tips, tricks, and field-report war stories — rejects questions / promo / rants). Added four cross-cutting rules: English only, substance threshold, no retired-model content, when-in-doubt-reject. Added `editor_confidence: "high"|"medium"|"low"` to the triage JSON contract; field is propagated into frontmatter (now 13 keys) and the PR body (`[confidence: <level>]` per bullet) so the editor can skim and focus attention on borderline items. Test suite: 93/93 pass (was 88; +5 new tests). Typecheck clean. See DECISIONS.md → "RSS triage: source-aware prompt + editor_confidence field" for the full rationale, alternatives considered, and cost analysis.

2. **DoD #12 — Live end-to-end run** ✓ COMPLETED 2026-05-18.
   Real workflow_dispatch run `26047997638` on `chomovazuzana/NbgAiHub`, branch `main`, completed in 2m46s with conclusion `success`. PR #1 (`News triage 2026-05-18`) opened automatically with 43 relevant items across 4 of 5 feeds. All operator-side setup (4 Azure secrets, "Allow GH Actions to create/approve PRs" toggle) completed via `gh` CLI. SECRETS.md §3 checklist validated end-to-end. **The pipeline is operational.**

1. **DoD #8 — SCOPE.md cross-reference to refined request** ✓ COMPLETED 2026-05-18.
   `SCOPE.md` → "Open questions" section now contains: *"For full RSS pipeline context, see refined request: `docs/refined-requests/rss-pipeline.md`."* Closes the doc-polish item flagged by Phase 10 integration verifier.

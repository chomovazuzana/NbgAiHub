---
type: tip
title: What a real CLAUDE.md looks like (worked example)
audience: beginner
topics: [context, fundamentals]
internal: false
authored: "2026-05-27"
last_reviewed: "2026-05-27"
external_link: null
deeper_link: null
ai_summary: A worked example of a project-level CLAUDE.md. The file Claude reads first every session — keep it short, opinionated, and load-bearing. Don't paste your README.
---

`CLAUDE.md` is the first file Claude reads at the start of every session. Think of it as the briefing you'd give a smart colleague who joined the project this morning — what the project is, the conventions that matter, the rules that are non-obvious from the code. Keep it under two pages. Past that, Claude starts skimming and the document stops being load-bearing.

Here's a real (lightly fictionalised) example from a small internal API project:

```markdown
# project: customer-segments-api

A small Node 22 + TypeScript service that scores retail customers by
spending pattern. Backed by Postgres. Lives behind the internal API
gateway — never exposed to the public internet.

## How this project runs

- `npm run dev` — local dev server on port 3010
- `npm test` — vitest, all suites, must pass before any PR
- `npm run lint` — eslint + prettier, fixes most things automatically

## Conventions that aren't obvious from the code

- Customer IDs (`cust_*`) are PII. **Never log them in plain text.**
  Use `redactCustId()` from `src/lib/log.ts`.
- All money values are integer minor units (cents/lepta), never float.
- Database tables are singular (`Customer`, not `Customers`).
  Plural is reserved for join tables (`CustomerTransactions`).
- Migrations live in `db/migrations/` — additive only.
  We do not edit a migration after it's been applied to staging.

## Where things live

- API routes: `src/routes/`
- Business logic: `src/services/`
- Postgres queries: `src/db/` (one file per table)
- Tests: alongside the source as `*.test.ts`
```

A few things that make this load-bearing rather than decorative:

- **It names PII rules.** Claude has no way to know that `cust_*` is sensitive — the file tells it once and the rule applies forever.
- **It states the table-naming convention.** Singular vs. plural is the kind of arbitrary-but-real rule a new engineer (or Claude) would never guess and would get wrong every time without it.
- **It points at folders.** When Claude needs to add a new route, it knows where new routes go. That single line saves three turns of "where should this file live?"

What's deliberately *not* in this CLAUDE.md: the project's history, the README contents, the architecture diagram, prose about why we chose Postgres. Claude can read the README on demand. The CLAUDE.md is for what Claude needs *every session* — keep it ruthless.

When in doubt, ask: would a smart new colleague need this line in their first hour, or could they figure it out by reading the code? If the answer is "figure it out", drop it.

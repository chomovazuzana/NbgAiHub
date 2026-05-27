---
type: skill
title: database-schema-designer — robust schema design
audience: both
topics: [database, schema, design]
internal: false
authored: "2026-05-19"
last_reviewed: "2026-05-19"
external_link: "https://github.com/556LowCodeNoCode/Skills"
deeper_link: null
ai_summary: Designs SQL and NoSQL database schemas with proper normalization, indexing, migration patterns, and constraint design. Ensures data integrity and query performance, not just "tables that look right".
when_to_use: Use this at the start of any feature with persistent data — schemas you design carefully cost you an hour now, schemas you don't cost you a migration sprint later.
install_command: "/plugin install database-schema-designer@556LowCodeNoCode-skills"
skill_id: database-schema-designer
origin: community
category: code
status: active
maintainer: "@nbg-ai-team"
time_saved: "~2-3 hours on the first run"
worked_scenario: "Designing a 5-table schema for a customer-segmentation service. Without the skill: an hour of staring at draft DDL, missing a foreign-key direction, and finding it during code review. With the skill: a single `/database-schema-designer` invocation produces the schema plus the migration plan plus the indexing rationale. Review-and-tweak instead of design-from-scratch."
---

`database-schema-designer` is for when you're starting a feature that needs persistent data and you want the schema to be *right* — not just "tables that compile". Covers normalization, indexing strategies, migration patterns, constraint design, and naming conventions (the team uses singular table names — `Customer`, not `Customers`).

Use it: at the start of any feature with a non-trivial data model. Better to spend an hour up front than to migrate later.

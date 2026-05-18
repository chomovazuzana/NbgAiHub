---
type: news
title: Made claude code warn you, time before it hits usage to transfer the pending work, all dynamically
audience: advanced
topics:
  - workflow
  - rate-limits
  - usage-monitoring
  - hooks
  - agent-baton
editor_confidence: high
internal: false
authored: 2026-05-18
last_reviewed: 2026-05-18
external_link: https://www.reddit.com/r/ClaudeAI/comments/1tgel55/made_claude_code_warn_you_time_before_it_hits/
deeper_link: null
ai_summary: This post describes a custom solution called agent-baton that integrates with Claude Code to monitor API usage dynamically and warn users before hitting rate limits, preventing work interruptions. It explains three hooks that fetch usage data at session start, check usage on prompt submission, and verify usage before tool calls, enabling proactive management of usage limits.
source: r/ClaudeAI
fingerprint: d59b52ac586af2a2
---

This post describes a custom solution called agent-baton that integrates with Claude Code to monitor API usage dynamically and warn users before hitting rate limits, preventing work interruptions. It explains three hooks that fetch usage data at session start, check usage on prompt submission, and verify usage before tool calls, enabling proactive management of usage limits.

> Source: [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1tgel55/made_claude_code_warn_you_time_before_it_hits/)

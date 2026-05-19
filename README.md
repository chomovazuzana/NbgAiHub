# NbgAiHub

A curated **Claude Code knowledge hub for bank colleagues**, framed around *"what I wish I knew a year ago."*

Five content pillars: **skills catalog, tips & tricks, curated news, onboarding journeys, glossary**. All content lives as plain markdown in one private GitHub repo — single source of truth.

---

## Three operational pieces, all built

- **Website** (Astro Starlight) — beginner/advanced filter, full-text search, dark theme, with sign-in via personal access token paste so users can pin items and submit skills.

- **RSS news pipeline** — daily GitHub Action: fetches feeds → Azure OpenAI triage → opens a PR with editor-confidence scores → human approves → news goes live.

- **Claude Code plugin (`/hub-*`)** — installable with one command. Brings the hub *inside* Claude Code: eleven commands covering search, pillar browse, glossary lookup, onboarding journeys, audience filter, content refresh, and browser deep-linking. No need to leave the terminal.

---

## Mini-workflows in place

- **Anyone adds a skill** — fill in the `/submit-skill/` form on the site → it builds the markdown and redirects to GitHub's "create file" page → on PR creation, a **CI validator** checks 17 frontmatter rules and annotates the PR with errors → reviewer merges.

- **Anyone favourites a skill / tip / news / glossary entry** — paste a `gist`-scoped GitHub token → click the pin button → favourites are stored in **the user's own unlisted gist** → the `/my-pins/` page lists them. Zero server infrastructure. Same gist will be readable by the Claude plugin later.

- **News updates automatically** — daily cron triages RSS feeds and opens a review PR with one `[confidence: high|medium|low]` marker per item → editor skims and merges → site picks it up.

- **Plugin user pulls fresh content** — `/hub-refresh` does a shallow `git pull` of the latest snapshot into a per-user cache → next `/hub-*` command reflects new content.

---

**Net effect:** three surfaces (web, automated news, in-terminal Claude plugin) over one curated, PR-gated repo. Newcomers can install the plugin in one line and start exploring — no browser required.

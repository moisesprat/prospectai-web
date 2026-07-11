## Context

`index.html`'s `<head>` carries five separate copies of similar copy that must stay in sync: `<title>`, meta description, `og:title`/`og:description`, `twitter:title`/`twitter:description`, and the JSON-LD `description`. They've drifted — the meta/OG/Twitter/JSON-LD descriptions all say "5-agent," while `architecture.html`, `report.html`, and `reports.html` all describe the same pipeline as "6-agent." This change is a small, static-content-only edit — no code, JS, or build-script changes.

## Goals / Non-Goals

**Goals:**
- One consistent, accurate agent count ("6-agent") across every surface on `index.html` and matching the rest of the site.
- A title and description that read well as a Google search result snippet and include a term people actually search for ("CrewAI").
- Remove maintenance burden / dead weight (`meta keywords`) that has no SEO value.
- Keep the existing JSON-LD `SoftwareApplication` block (added previously) rather than replacing its structure — only correct its `description` and drop its `keywords` property to match.

**Non-Goals:**
- No changes to `stats.html`, `reports.html`, `report.html`, or `architecture.html` metadata — they already say "6-agent" correctly.
- No new JSON-LD types (e.g. `BreadcrumbList`, `Article`) — out of scope, could be a follow-up.
- No visual/UI changes — this only touches `<head>` tags.

## Decisions

**1. Standardize on "6-agent," not "5-agent."**
The pipeline has 6 sequential phases (Market Analyst → Technical Analyst → Fundamental Analyst → Draft Strategist → Critic → Final Strategist), even though the "Draft Strategist" and "Final Strategist" steps are the same underlying `InvestorStrategicAgent` invoked twice. "6-agent" is already the established public-facing convention on every other page (`architecture.html`'s title is literally "ProspectAI Architecture — 6-Agent Pipeline"), so aligning the homepage to it is a correction, not a new choice.

**2. New title**: `ProspectAI — Multi-Agent AI Investment Research (CrewAI)` (as specified). Shorter and keyword-forward compared to the current `ProspectAI — Agentic Portfolio Intelligence by Moises Prat`; drops the author name from the title (still present via `meta name="author"` and JSON-LD `author`) to prioritize search-relevant terms within Google's ~60-character title display truncation.

**3. New meta description, 150–160 characters, fixing the agent count**:
`"ProspectAI is a CrewAI multi-agent system: a 6-agent investment research pipeline with adversarial critic review for self-correcting portfolio reports."` (151 characters) — mentions CrewAI (searchable term), correct agent count, and keeps the "self-correcting"/"adversarial critic" differentiators from the original copy.

**4. Sync, don't fork, the OG/Twitter copy.** Rather than writing three independently-worded variants (title/description, og:title/og:description, twitter:title/twitter:description), all three now use the exact same values as the primary `<title>`/description. Simpler to keep in sync going forward, and there's no evidence a different tone is needed per surface for this site.

**5. Remove `meta keywords` and the JSON-LD `keywords` property outright, not just update them.** Google has publicly stated (and it's been long-established industry knowledge) that the meta keywords tag has not been used as a ranking signal since 2009; keeping it means one more copy of the same information to keep in sync for zero benefit. The JSON-LD `keywords` property is not a ranking factor either for `SoftwareApplication` rich results — dropped for the same reason.

## Risks / Trade-offs

- [Shorter title/description could reduce brand-name prominence in search results] → Author name remains discoverable via `meta name="author"`, JSON-LD `author.name`, and the page content itself; acceptable trade-off for better keyword targeting.
- [Manual sync across 3 surfaces (meta/OG/Twitter) + JSON-LD is still 4 places to edit by hand] → No build-time templating introduced for this (would be disproportionate for a 4-line edit); if this drifts again in the future, worth revisiting with a small templating step in the existing `scripts/build-static.mjs`, but out of scope here.

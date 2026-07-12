## Why

`architecture.html` covers ProspectAI's overall pipeline shape, but the individual architectural patterns it uses — adversarial review, parallel agent execution, output validation, and model tiering — are each independently interesting to people searching for multi-agent AI engineering practices, not just people already looking for ProspectAI specifically. A dedicated `/patterns/` content section lets each pattern rank for its own long-tail queries, gives the site a second content cluster beyond the single architecture page, and demonstrates real, verifiable engineering practice (via actual code excerpts) rather than marketing claims — which is both better for SEO (topical depth, internal linking) and better for credibility with a technical audience.

## What Changes

- Add four new static pages, each covering one architectural pattern with real code from the ProspectAI codebase:
  - `/patterns/adversarial-critic` — the Critic agent's adversarial review + revision-directive loop.
  - `/patterns/parallel-execution` — CrewAI Flow's `@listen`/`and_()` fan-out/fan-in of Technical + Fundamental analysis.
  - `/patterns/output-validation` — Pydantic schema validation (`_extract_pydantic`) plus deterministic business-rule checks (`recommendation_validator.py`).
  - `/patterns/model-tiering` — per-agent model assignment (Haiku for data-gathering, Sonnet for reasoning) via `agents.yaml` + `config.py` + `base_agent.py`.
- Each page: H1 equal to its target long-tail keyword phrase, unique `<title>`/meta description, `TechArticle` JSON-LD, a real verbatim code excerpt with file path attribution, cross-links to the other three pattern pages, and a link back to `architecture.html`.
- Add `/patterns/` — a hub/index page listing and linking to all four patterns. **New beyond the literal request**: the ask was for "four static pages" and a nav entry; a hub page is added so the nav's "Patterns" entry has a sensible landing target (a list of the four patterns) rather than pointing arbitrarily at one of them. Flagging this explicitly in case a direct link to one pattern is preferred instead.
- Add a "Patterns" entry to the main site nav on every existing page (`index.html`, `stats.html`, `reports.html`, `report.html`, `architecture.html`) — this codebase has no shared header component, so each page's nav is a hand-duplicated static block; this change edits all five in place, consistent with the existing (already duplicated) pattern.
- `architecture.html` gets a "Related patterns" section linking to all four new pages, so the cross-linking is bidirectional.
- Add each new page to `sitemap.xml` generation (`scripts/build-static.mjs`) and `vite.config.js`'s build inputs (for local dev/build parity, even though production doesn't require a build step).

## Capabilities

### New Capabilities
- `patterns-section`: the `/patterns/` hub and four pattern pages — their metadata (title/H1/description/JSON-LD), content requirements (real code + attribution), and cross-linking requirements.

### Modified Capabilities
- `site-indexability`: sitemap generation must include the five new URLs (`/patterns/`, plus the four pattern pages).

## Impact

- New files: `patterns/index.html`, `patterns/adversarial-critic.html`, `patterns/parallel-execution.html`, `patterns/output-validation.html`, `patterns/model-tiering.html`, `styles/patterns.css` (code-block styling).
- Modified files: `index.html`, `stats.html`, `reports.html`, `report.html`, `architecture.html` (nav entry), `architecture.html` (related-patterns section), `scripts/build-static.mjs` (sitemap entries), `vite.config.js` (build inputs).
- No backend/API changes — all code excerpts are static, hand-copied-and-attributed snippets from the `ProspectAI` core repo, not live-fetched.
- No JS behavior changes to existing pages beyond the added nav link markup.

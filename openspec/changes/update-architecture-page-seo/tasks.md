## 1. Title, H1, and meta description

- [x] 1.1 Update `<title>` in `architecture.html` to `Multi-Agent AI Architecture: 6-Agent CrewAI Pipeline with Adversarial Critic`
- [x] 1.2 Update the `<h1>` in `architecture.html`'s `.arch-header` to the same copy
- [x] 1.3 Update `<meta name="description">` in `architecture.html` to the new 154-character copy aligned with the new title/H1

## 2. TechArticle JSON-LD

- [x] 2.1 Add a `<script type="application/ld+json">` block to `architecture.html`'s `<head>` with `@type: TechArticle`, `headline`, `description`, `author` (matching `index.html`'s author block), and `mainEntityOfPage`

## 3. Verification

- [x] 3.1 View-source `architecture.html` locally and confirm title/H1 match exactly and no old "ProspectAI Architecture — 6-Agent Pipeline"/"ProspectAI Pipeline" copy remains
- [x] 3.2 Validate the JSON-LD block is well-formed JSON and `@type` is `TechArticle` (e.g. `python3 -c "import json; json.load(...)"` on the extracted block)
- [x] 3.3 Commit, push, and confirm Cloudflare Pages deploys the change
- [x] 3.4 Spot-check the deployed page's title/H1/meta description/JSON-LD via `curl`

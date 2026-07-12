## 1. Shared setup

- [x] 1.1 Create `patterns/` directory
- [x] 1.2 Create `styles/patterns.css` with a monospace `<pre><code>` block style (reusing the site's IBM Plex Mono font, no new font/dependency)
- [x] 1.3 Confirm the exact HTML-escaped code excerpts to embed for all four patterns (from `agents/critic_agent.py`, `prospect_ai_flow.py`, `schemas/agent_outputs.py`, `utils/recommendation_validator.py`, `config/agents.yaml`, `config/config.py`, `agents/base_agent.py` in the ProspectAI repo) — escape `<`, `>`, `&` in every excerpt

## 2. Pattern page: adversarial-critic

- [x] 2.1 Create `patterns/adversarial-critic.html`: title/H1 `Adversarial Critic Pattern: How AI Agents Challenge Their Own Output`, meta description (152 chars), canonical `https://prospect-ai.moisesprat.dev/patterns/adversarial-critic`
- [x] 2.2 Add `TechArticle` JSON-LD (headline/description/author/mainEntityOfPage matching the site's established shape)
- [x] 2.3 Add the `CriticAgent` + `critique_review`/`final_strategy` code excerpt with file/line attribution and explanatory prose
- [x] 2.4 Add cross-links to the other three pattern pages, `/patterns/`, and `architecture.html`
- [x] 2.5 Add the site nav (with "Patterns" entry) and disclaimer bar, matching existing page conventions

## 3. Pattern page: parallel-execution

- [x] 3.1 Create `patterns/parallel-execution.html`: title/H1 `Parallel Agent Execution: Running AI Agents Concurrently in a CrewAI Flow`, meta description (150 chars), canonical `https://prospect-ai.moisesprat.dev/patterns/parallel-execution`
- [x] 3.2 Add `TechArticle` JSON-LD
- [x] 3.3 Add the `@listen`/`and_()` fan-out/fan-in code excerpt (`market_analysis` → `technical_analysis`/`fundamental_analysis` → `draft_strategy`) with attribution and explanatory prose
- [x] 3.4 Add cross-links to the other three pattern pages, `/patterns/`, and `architecture.html`
- [x] 3.5 Add the site nav and disclaimer bar

## 4. Pattern page: output-validation

- [x] 4.1 Create `patterns/output-validation.html`: title/H1 `LLM Output Validation: Enforcing Structured Output with Pydantic Schemas`, meta description (151 chars), canonical `https://prospect-ai.moisesprat.dev/patterns/output-validation`
- [x] 4.2 Add `TechArticle` JSON-LD
- [x] 4.3 Add the `_extract_pydantic` + `TradeSetup` model_validator + `validate_position` code excerpts with attribution and explanatory prose (both the schema-validation and deterministic-business-rule layers)
- [x] 4.4 Add cross-links to the other three pattern pages, `/patterns/`, and `architecture.html`
- [x] 4.5 Add the site nav and disclaimer bar

## 5. Pattern page: model-tiering

- [x] 5.1 Create `patterns/model-tiering.html`: title/H1 `Model Tiering: Matching LLM Cost to Task Complexity in Multi-Agent Systems`, meta description (150 chars), canonical `https://prospect-ai.moisesprat.dev/patterns/model-tiering`
- [x] 5.2 Add `TechArticle` JSON-LD
- [x] 5.3 Add the `agents.yaml` llm blocks + `model_id_for_agent` + `_get_llm` code excerpts with attribution and explanatory prose, including an honest note on the real `fundamental_analyst` Sonnet-vs-Haiku discrepancy rather than smoothing it over
- [x] 5.4 Add cross-links to the other three pattern pages, `/patterns/`, and `architecture.html`
- [x] 5.5 Add the site nav and disclaimer bar

## 6. Hub page

- [x] 6.1 Create `patterns/index.html`: lists and links to all four pattern pages with a one-line description of each
- [x] 6.2 Add appropriate title/meta description/canonical (`https://prospect-ai.moisesprat.dev/patterns/`) for the hub itself
- [x] 6.3 Add the site nav and disclaimer bar

## 7. Integrate with existing pages

- [x] 7.1 Add a "Patterns" nav entry (linking to `/patterns/`) to `index.html`, `stats.html`, `reports.html`, `report.html`, and `architecture.html`
- [x] 7.2 Add a "Related patterns" section to `architecture.html` linking to all four pattern pages

## 8. Sitemap and build integration

- [x] 8.1 Update `scripts/build-static.mjs`'s `generateSitemap()` to include `/patterns/` and the four pattern page URLs
- [x] 8.2 Update `vite.config.js`'s `build.rollupOptions.input` to include the five new pages (for local dev/build parity)

## 9. Verification

- [x] 9.1 Run `npm run generate` locally and confirm `sitemap.xml` includes all five new URLs
- [x] 9.2 View-source each new page locally and confirm title=H1, meta description length (150-160), and JSON-LD validity (well-formed JSON, correct `@type`)
- [x] 9.3 Confirm code excerpts render correctly (no broken markup from unescaped `<`/`>`/`&`) by viewing each page in a browser
- [x] 9.4 Click through all cross-links (hub→patterns, pattern→pattern, pattern→architecture, architecture→patterns, nav "Patterns" entry from each existing page) and confirm they resolve
- [x] 9.5 Commit, push, and confirm Cloudflare Pages deploys the change
- [x] 9.6 Spot-check the deployed pages via `curl` for title/H1/canonical/JSON-LD and confirm `/patterns/*` URLs resolve without unexpected redirects

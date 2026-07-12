## Context

`prospectai-web` has no shared header/template system — every page (`index.html`, `stats.html`, `reports.html`, `report.html`, `architecture.html`) hand-duplicates the same `<nav class="site-nav">` block and disclaimer bar. There's also no build step in production (Cloudflare Pages serves the repo root as static files as-is), and Cloudflare Pages 308-redirects `foo.html` requests to the extensionless `foo` (confirmed empirically during the earlier `site-indexability` work — e.g. `/stats.html` → 308 → `/stats`). This matters for URL/canonical design below.

Source material for the four patterns' code excerpts was pulled directly from the `ProspectAI` core repo (sibling directory) by reading the actual files — not reconstructed from memory:
- **adversarial-critic**: `agents/critic_agent.py` (full file, 21 lines) + `prospect_ai_flow.py:474-508` (`critique_review`/`final_strategy` Flow methods).
- **parallel-execution**: `prospect_ai_flow.py:411-455` (`market_analysis` → `technical_analysis`/`fundamental_analysis` via `@listen`, joined by `@listen(and_(...))` into `draft_strategy`).
- **output-validation**: `prospect_ai_flow.py:190-212` (`_extract_pydantic`), `schemas/agent_outputs.py:147-178` (`TradeSetup` with a `model_validator` cross-field invariant), `utils/recommendation_validator.py:22-47` (`validate_position` deterministic checks).
- **model-tiering**: `config/agents.yaml` (per-agent `llm:` blocks), `config/config.py:65-76` (`model_id_for_agent`), `agents/base_agent.py:41-61` (`_get_llm`).

## Goals / Non-Goals

**Goals:**
- Four pattern pages + one hub page, each with unique, accurate SEO metadata and real, verbatim, correctly-attributed code.
- Bidirectional cross-linking: hub → each pattern, each pattern → other three patterns + architecture.html, architecture.html → all four patterns.
- Nav updated consistently across all existing pages plus the new ones.
- Sitemap generation extended to include the five new URLs.

**Non-Goals:**
- No shared header/templating system introduced — matches the existing all-static, hand-duplicated-nav convention. Revisit only if nav drift becomes a recurring problem (already true today, not created by this change).
- No live code-fetching from the `ProspectAI` repo at build time — excerpts are static, hand-copied text with a comment noting the source file/line range, same as any technical blog post. (A future change could explore syncing excerpts automatically, but that's meaningfully bigger scope.)
- Not fixing the pre-existing `fundamental_analyst` model config discrepancy in `ProspectAI` (its header comment says "agents 1-3 use Haiku" but the live YAML pins it to Sonnet) — the model-tiering page describes what the code actually does today, including this discrepancy, rather than the aspirational comment. That's a `ProspectAI` repo issue, out of scope for `prospectai-web`.

## Decisions

**1. URL scheme: extensionless canonical/internal links, `.html` on disk.**
Files live at `patterns/adversarial-critic.html` etc. (matching the existing per-file convention), but every canonical tag, nav link, and cross-link uses the extensionless form (`/patterns/adversarial-critic`) rather than the `.html` form, because Cloudflare Pages 308-redirects the `.html` request to the extensionless URL anyway — linking directly to the extensionless form avoids a wasted redirect hop and gives the cleaner URL the "add a /patterns/ section" framing implies. The hub page is `patterns/index.html`, served automatically at `/patterns/` with no redirect involved.

**2. Add a `/patterns/` hub page beyond the literal four-pages request**, so the nav's "Patterns" entry has a sensible landing target and the section reads as a coherent content cluster (a common "pillar page" SEO pattern: one hub linking to several deep-dive pages, with the deep-dives linking back). Flagged explicitly in the proposal in case a direct link to one pattern is preferred instead — this is the one open judgment call in this change.

**3. Title = H1 per page** (same convention established for `architecture.html`), each targeting one long-tail phrase:

| Page | Title / H1 | Length |
|---|---|---|
| adversarial-critic | `Adversarial Critic Pattern: How AI Agents Challenge Their Own Output` | 68 |
| parallel-execution | `Parallel Agent Execution: Running AI Agents Concurrently in a CrewAI Flow` | 73 |
| output-validation | `LLM Output Validation: Enforcing Structured Output with Pydantic Schemas` | 72 |
| model-tiering | `Model Tiering: Matching LLM Cost to Task Complexity in Multi-Agent Systems` | 74 |

Meta descriptions (150–160 chars each, matching the established site convention):
- adversarial-critic (152): `How ProspectAI's Critic agent adversarially reviews a draft AI investment strategy, forcing a full revision pass before any recommendation is finalized.`
- parallel-execution (150): `How ProspectAI runs Technical and Fundamental analysis agents concurrently in a CrewAI Flow, cutting pipeline latency without sacrificing correctness.`
- output-validation (151): `How ProspectAI enforces strict Pydantic schemas on every LLM output, plus deterministic business-rule checks, to guard against unreliable model output.`
- model-tiering (150): `How ProspectAI assigns cheaper, faster models to data-gathering agents and higher-reasoning models to strategy agents to balance cost against quality.`

**4. `TechArticle` JSON-LD reuses the exact shape established on `architecture.html`** (`headline`, `description`, `author`, `mainEntityOfPage`) — no new properties introduced, for consistency and because that shape already validated cleanly in production.

**5. Code excerpts are hand-embedded, HTML-escaped, and attributed.** Each excerpt is wrapped in `<pre><code>` with a one-line attribution comment above it (`# ProspectAI/prospect_ai_flow.py, lines 411-455`). All `<`, `>`, `&` characters in the Python source (e.g. `->` return-type arrows, `<`/`>` comparisons in validators) **must** be HTML-entity-escaped (`&lt;`, `&gt;`, `&amp;`) — unescaped code would corrupt the surrounding page markup. New CSS (`styles/patterns.css`) adds a monospace code-block style using the already-loaded IBM Plex Mono font — no new font/dependency.

**6. Nav updated by hand in all 5 existing files + the new pages**, matching the existing (already duplicated, no-template) convention — see Non-Goals.

**7. Sitemap generation change**: `scripts/build-static.mjs`'s `generateSitemap()` gets 5 new static entries (`/patterns/`, plus the four pattern pages) alongside the existing `/`, `/stats.html`, `/reports.html`, `/architecture.html`. This is a `site-indexability` capability change (modifies its existing sitemap-generation requirement), not a new capability.

## Risks / Trade-offs

- [Unescaped code excerpts could break page HTML] → Explicit escaping requirement (Decision 5); verified per-page during implementation by confirming the rendered page's DOM matches the intended code text, not broken markup.
- [Hand-duplicated nav across 9 files (5 existing + 4 new, hub excluded since hub is new content) risks future drift] → Accepted, matches pre-existing site convention; not a regression introduced by this change.
- [Code excerpts can go stale if the `ProspectAI` core pipeline changes] → Accepted for this change; each excerpt's attribution comment (file + line range) makes staleness detectable/fixable later, and this is normal for any blog-style code excerpt, not unique to this site.
- [Adding a hub page beyond the literal request could be undesired] → Flagged explicitly in the proposal (Decision 2) for the user to confirm or redirect before implementation.

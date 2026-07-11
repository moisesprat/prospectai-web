## Context

`prospectai-web` is a static site with **no build step today**: per `CLAUDE.md`, `index.html` and friends are served as-is on Cloudflare Pages. `vite build` exists but is optional/unused in production. There is no CI (no `.github/workflows`), no `wrangler.toml` in-repo, and `dist/` is gitignored — deploys are effectively "push static files, Cloudflare Pages serves the repo root directly." Confirmed: the Cloudflare Pages project is git-connected and auto-deploys on every push to `main`, so a bot commit from the GitHub Action described below triggers a real deploy with no extra `wrangler` call needed.

Two of the five pages (`stats.html`, `reports.html`) render their primary content entirely client-side: an HTML skeleton/loading state ships in the initial response, and `ui/stats.js` / `ui/reportsPage.js` populate the real data after `fetch()`-ing `/api/analytics`, `/api/long-buy-history`, and `/api/reports` from the Modal backend at runtime, in the visitor's browser. A crawler that doesn't execute JS (or times out before the fetch resolves) sees only the skeleton.

`sitemap.xml` is a static, hand-edited file with a single stale entry. `robots.txt` already correctly references it. Canonical tags exist on `index.html` and `reports.html` but are missing on `report.html`, `architecture.html`, and `stats.html`.

Constraint: this is a solo-maintained demo project. The design should avoid introducing a heavy SSR framework or a new hosting model — it should stay static-file-based and only add a lightweight build step.

## Goals / Non-Goals

**Goals:**
- Every deploy produces a fresh, accurate `sitemap.xml` without manual editing.
- `stats.html` and `reports.html` contain their real primary content in the HTML delivered on first response (view-source / `curl` shows actual numbers and report links, not just a skeleton).
- Every page has a correct, self-referencing `<link rel="canonical">`.
- The fix works within the existing "static files on Cloudflare Pages" deploy model — no new server/runtime, and no change to Cloudflare Pages configuration.
- Content stays fresh on a schedule, independent of code pushes, since backend report/stats data changes without any commit to this repo.

**Non-Goals:**
- No client-side framework migration (no React/Next/Astro adoption).
- No change to `report.html` (individual report detail pages) beyond what's already tracked separately — out of scope per the proposal; only `stats.html`/`reports.html` are targeted for static content.
- No change to the SSE-driven live pipeline execution flow on `index.html`.
- Not solving pagination/SEO for potentially thousands of individual report pages — `reports.html` gets a static list of recent/known reports; deep pagination indexing is an open question, not solved here.

## Decisions

**1. Introduce a single Node build script (`scripts/build-static.mjs`), run via `npm run build`, as the one new build step.**
Rationale: avoids adding a framework or new dependency footprint (project already has Node/Vite available). The script:
- Fetches `/api/analytics`, `/api/long-buy-history`, and `/api/reports` from the Modal backend (same `MODAL_URL` already defined in `vite.config.js`).
- Renders the resulting HTML fragments (stats cards, reports list) into placeholder markers in `stats.html` and `reports.html` (e.g. `<!--SSR:reports-list-->`), writing the output to `dist/`.
- Copies `robots.txt`, `sitemap.xml` output, and all other static assets into `dist/`.
- Existing `ui/stats.js` / `ui/reportsPage.js` are changed from "populate empty container" to "hydrate: if server-rendered content is already present, use it as initial state and refresh in place" (avoids duplicate rendering, keeps the page live-updating as it does today).

Alternative considered: pure static snapshot with no client refresh (simplest, but loses the "LIVE" / "updated on every page load" behavior the pages currently advertise) — rejected, hydration preserves current UX.

Alternative considered: adopt a static-site generator (Astro/11ty) — rejected as disproportionate for 5 pages and a solo-maintained repo; would also require restructuring `ui/*.js` module boundaries.

**2. Sitemap generation is part of the same build script**, not a separate tool.
It writes `sitemap.xml` listing `/`, `/stats.html`, `/reports.html`, `/architecture.html`, and `/report.html?...` entries for reports returned by `/api/reports` (using each report's timestamp as `<lastmod>`), keeping one code path responsible for both "what pages exist" and "what content they show." `robots.txt` is copied through unchanged (it already has the correct `Sitemap:` line) — no generation needed there, just verified/copied so it's always present alongside the generated sitemap.

**3. Generation happens via a GitHub Action that commits generated output back to `main`, not via a Cloudflare Pages build step.**
Cloudflare Pages continues serving the repo root as static files, exactly as it does today — no dashboard configuration change needed, and no dependency on Cloudflare's build pipeline actually being wired up (which I can't verify or configure from this repo). Instead, a workflow at `.github/workflows/generate-sitemap.yml`:
- Runs `scripts/build-static.mjs` in "in-place" mode: instead of writing to a gitignored `dist/`, it overwrites `sitemap.xml`, `stats.html`, and `reports.html` directly in the repo root.
- Triggers on `push` to `main` (so code changes regenerate immediately) **and** on a schedule (`cron: '*/15 * * * *'`, every 15 minutes) — this matters because report/stats content changes as the backend produces new analysis runs, independent of any code push. A push-only trigger would leave the site stale between deploys, defeating the point. 15 minutes was chosen over a shorter interval (e.g. 1 minute) because GitHub Actions cron has a practical floor around 5 minutes (sub-5-minute schedules are unreliable/delayed) and search crawlers don't re-visit anywhere near that frequently, so going tighter wouldn't improve indexability — it would just add commit noise. The repo is public, so Action minutes are free regardless of frequency.
- Commits the regenerated files back to `main` with a bot commit (`chore: regenerate sitemap and static content`, no message-based skip tag — see risk below) if and only if the generated content differs from what's committed.
- That commit lands on `main`, which Cloudflare Pages' existing git integration picks up and deploys automatically, same as any other commit — no new deploy mechanism, just an automated committer.

Alternative considered: Cloudflare Pages build command (`npm run build` → `dist/`) — rejected per user preference: it requires a manual, unverifiable dashboard setting, and Pages would still only rebuild on push, not on a schedule, so it wouldn't solve the "reports appear on the backend without a code push" staleness problem anyway.

**4. `stats.html` canonical + robots policy**: keep `<meta name="robots" content="noindex">` (it's a live analytics dashboard, not content worth ranking) but still add a self-referencing canonical tag — canonical and noindex are not mutually exclusive, and having a canonical tag is harmless/good practice even on noindex pages, and costs nothing if the noindex decision is revisited later.

## Risks / Trade-offs

- [Build script depends on Modal backend being reachable at scheduled-run time] → If the backend is unreachable when the Action runs, skip the commit entirely and leave the previously-committed files in place rather than committing empty/broken content; the next scheduled run retries.
- [Bot commits could loop or spam history] → Action only commits when generated content actually differs from what's on `main`; the job is additionally guarded with `if: github.actor != 'github-actions[bot]'` on `push` events so the bot's own commit doesn't re-trigger the job. **Do not** use a commit-message marker like `[skip ci]` for this: Cloudflare Pages independently treats `[CI Skip]`/`[Skip CI]`/`[CF-Pages-Skip]` (case-insensitive, anywhere in the message) as an instruction to skip deploying that commit entirely — an earlier version of this workflow used `[skip ci]` in the commit message and it silently disabled every scheduled deploy (commit landed on `main`, but Cloudflare never built/served it) until caught in production.
- [GitHub Action needs write access to `main`] → Uses the default `GITHUB_TOKEN` with `contents: write` permission scoped to this workflow only; no new secrets or external credentials required.
- [`reports.html` sitemap entries could grow unbounded as reports accumulate] → Cap sitemap to the N most recent reports (e.g. 200) for this change; full pagination strategy is an open question, not solved here.
- [Hydration bugs if stats.js assumes an always-empty container] → Existing tests (if any) and manual verification (`curl` + browser diff) before/after for both pages.
- [Scheduled bot commits between human commits could create merge noise for the maintainer] → Low risk for a solo-maintained repo; `git pull --rebase` before pushing local work avoids conflicts.
- [Every bot commit triggers a Cloudflare Pages auto-deploy, which counts against Cloudflare's free-tier 500 builds/month cap; a 15-minute schedule combined with live ROI/KPI figures changing on most runs could exceed that during market hours] → **Accepted risk**, by explicit decision: keeping the 15-minute schedule as-is rather than lengthening it or decoupling stats-only changes from commits. If Cloudflare Pages hits the cap, it queues/blocks further deploys until the next billing cycle rather than incurring surprise charges — revisit the schedule or the commit-triggering logic if this becomes a real problem in practice.

## Migration Plan

1. Add `scripts/build-static.mjs` (in-place mode: writes directly into repo-root `sitemap.xml`, `stats.html`, `reports.html`).
2. Update `ui/stats.js` and `ui/reportsPage.js` to hydrate from pre-rendered DOM instead of assuming empty containers.
3. Add canonical tags to `report.html`, `architecture.html`, `stats.html`.
4. Add `.github/workflows/generate-sitemap.yml`: triggers on push to `main` and on a schedule, runs the build script, commits changes back to `main` if content differs.
5. Push to `main`; verify the Action runs successfully, commits land, and Cloudflare Pages auto-deploys from the resulting commit.
6. Verify via `curl -s https://prospect-ai.moisesprat.dev/stats.html | grep <known-stat>` and `.../sitemap.xml` freshness.
7. Rollback: disable/delete the workflow file and revert the last bot commit — no Cloudflare configuration was touched, so rollback is a pure git operation.

## Open Questions

- Should individual `report.html?run_id=...` pages get their own sitemap entries / canonical tags in a follow-up change? (Explicitly deferred here.)

## Why

Search engines can't fully index prospectai-web today: `sitemap.xml` is a hand-edited file listing only `/` (missing `stats.html`, `reports.html`, `report.html`, `architecture.html`), `stats.html` and `reports.html` render their primary content client-side via `fetch()` calls to the Modal backend (crawlers see an empty skeleton, not the actual data), and canonical tags are inconsistently applied (`report.html` and `architecture.html` have none; `stats.html` deliberately opts out via `noindex`). Fixing this now — before more pages are added — closes an easy, low-risk SEO gap for a public demo site that depends on organic discovery.

## What Changes

- Add a sitemap generation step that runs on every deploy and writes an up-to-date `sitemap.xml` listing all public, indexable pages (home, reports, architecture; report detail pages if enumerable at build time) with accurate `lastmod` values. **BREAKING**: replaces the hand-maintained static `sitemap.xml` — manual edits to that file will be overwritten on the next deploy.
- Keep `robots.txt` pointing at `Sitemap: https://prospect-ai.moisesprat.dev/sitemap.xml` (already correct) and verify it stays in sync with the generation step.
- Make `stats.html` and `reports.html` serve their primary content (key stats figures, the reports list) as static HTML present in the initial server response, with existing client-side JS enhancing/refreshing that content after load rather than being the only source of it.
- Add a self-referencing `<link rel="canonical">` tag to every page that doesn't already have one (`report.html`, `architecture.html`, `stats.html`), and verify existing ones (`index.html`, `reports.html`) are correct and self-referencing per-URL.
- Decide and document whether `stats.html` should remain `noindex` (dashboard/analytics page, low search value) or be made indexable now that its content is static; `robots` meta and canonical tag policy must be consistent with that decision.

## Capabilities

### New Capabilities
- `site-indexability`: Deploy-time sitemap generation referenced from `robots.txt`, static (non-JS-only) primary content on `stats.html` and `reports.html`, and self-referencing canonical tags across all pages.

### Modified Capabilities
- (none — no existing specs in this repo yet)

## Impact

- Affected files: `sitemap.xml` (becomes generated, not hand-edited), `robots.txt` (verified reference), `stats.html`, `reports.html`, `report.html`, `architecture.html`, `index.html` (canonical tags), `ui/stats.js`, `ui/reportsPage.js` (must support/hydrate pre-rendered content instead of assuming an empty container).
- New: a Node script (`scripts/build-static.mjs`) that generates `sitemap.xml` and pre-renders static content fragments for `stats.html` / `reports.html` by calling the Modal backend (`/api/analytics`, `/api/long-buy-history`, `/api/reports`), plus a GitHub Action (`.github/workflows/generate-sitemap.yml`) that runs it on push and on a schedule, committing regenerated files back to `main`.
- Deploy process: unchanged — Cloudflare Pages continues serving the repo root as static files on every `main` commit, exactly as today (per `CLAUDE.md`); the new GitHub Action is just another committer, no Cloudflare configuration change required.
- No backend (`prospectai-backend`) or `ProspectAI` core pipeline changes required — this is frontend/static-site only.

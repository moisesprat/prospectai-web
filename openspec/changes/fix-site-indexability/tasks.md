## 1. Build script foundation

- [x] 1.1 Create `scripts/build-static.mjs`: reads `MODAL_URL` (reuse the constant from `vite.config.js`); runs in "in-place" mode, rewriting `sitemap.xml`, `stats.html`, and `reports.html` directly in the repo root (no `dist/` output)
- [x] 1.2 In the build script, fetch `/api/analytics`, `/api/long-buy-history`, and `/api/reports` from the Modal backend; on fetch failure, skip the write for that file (leave the currently-committed version untouched) instead of failing or emitting empty content
- [x] 1.3 Add an `npm run generate` script (`package.json`) that runs `node scripts/build-static.mjs`, for local testing

## 2. Sitemap generation

- [x] 2.1 In the build script, generate `sitemap.xml` with `<url>` entries for `/`, `/stats.html`, `/reports.html`, `/architecture.html`
- [x] 2.2 Add one `<url>` entry per report from `/api/reports` (cap at the 200 most recent), with `<lastmod>` from each report's timestamp
- [x] 2.3 Write the generated `sitemap.xml` in place at the repo root, replacing the hand-edited copy
- [x] 2.4 Leave `robots.txt` untouched by the script; verify it still declares `Sitemap: https://prospect-ai.moisesprat.dev/sitemap.xml`

## 3. Static content for stats.html

- [x] 3.1 Identify the DOM containers `ui/stats.js` currently populates client-side (activity counters, decision breakdowns, performance table/charts) and add named placeholder markers in `stats.html` for each
- [x] 3.2 In the build script, render the fetched analytics/long-buy-history data into those markers as static HTML, overwriting `stats.html` in place
- [x] 3.3 Update `ui/stats.js` to hydrate from the pre-rendered DOM (read existing content as initial state) instead of assuming an empty container, then continue refreshing via its existing fetch logic
- [x] 3.4 Add `<link rel="canonical" href="https://prospect-ai.moisesprat.dev/stats.html">` to `stats.html`, keeping the existing `noindex` meta tag

## 4. Static content for reports.html

- [x] 4.1 Identify the DOM container `ui/reportsPage.js` populates (the `#reports-loading` / report list container) and add a named placeholder marker in `reports.html`
- [x] 4.2 In the build script, render the fetched `/api/reports` data into that marker as a static list (title, sector, date, link per report), overwriting `reports.html` in place
- [x] 4.3 Update `ui/reportsPage.js` to hydrate from the pre-rendered list instead of assuming an empty container, then continue refreshing via its existing fetch logic
- [x] 4.4 Verify `reports.html`'s existing canonical tag still resolves correctly after regeneration

## 5. Canonical tags on remaining pages

- [x] 5.1 Add `<link rel="canonical" href="https://prospect-ai.moisesprat.dev/report.html">` to `report.html`
- [x] 5.2 Add `<link rel="canonical" href="https://prospect-ai.moisesprat.dev/architecture.html">` to `architecture.html`
- [x] 5.3 Verify `index.html`'s existing canonical tag (`https://prospect-ai.moisesprat.dev`) is consistent in format with the others (trailing slash / no trailing slash)

## 6. GitHub Action, deploy, and verification

- [x] 6.1 Add `.github/workflows/generate-sitemap.yml`: checkout, setup Node, run `npm run generate`, and commit-and-push any resulting diff to `main` with `contents: write` permission (job guarded by `github.actor != 'github-actions[bot]'`, not a `[skip ci]` message tag — that collides with Cloudflare Pages' own skip-deploy convention)
- [x] 6.2 Configure the workflow to trigger on `push` to `main` and on a schedule (every 15 minutes), guarding the commit step so it only runs (and only pushes) when generated content actually differs from what's committed
- [x] 6.3 Run `npm run generate` locally and inspect the regenerated `stats.html`, `reports.html`, `sitemap.xml` for correct static content before relying on the Action
- [x] 6.4 Push and confirm the Action runs successfully, commits land on `main`, and Cloudflare Pages auto-deploys from the resulting commit (no Cloudflare configuration change needed)
- [x] 6.5 Verify with `curl -s https://prospect-ai.moisesprat.dev/stats.html` and `.../reports.html` that real content (not skeletons) is present, and that `/sitemap.xml` lists current pages
- [x] 6.6 Spot-check all five pages' canonical tags in production match their own URLs

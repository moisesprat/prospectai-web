## 1. Move pattern files

- [x] 1.1 Create `architecture/patterns/` directory
- [x] 1.2 Move `patterns/index.html` → `architecture/patterns/index.html`
- [x] 1.3 Move `patterns/adversarial-critic.html` → `architecture/patterns/adversarial-critic.html`
- [x] 1.4 Move `patterns/parallel-execution.html` → `architecture/patterns/parallel-execution.html`
- [x] 1.5 Move `patterns/output-validation.html` → `architecture/patterns/output-validation.html`
- [x] 1.6 Move `patterns/model-tiering.html` → `architecture/patterns/model-tiering.html`
- [x] 1.7 Remove the now-empty `patterns/` directory

## 2. Update links and metadata inside the moved pattern pages

- [x] 2.1 In each of the 5 moved files, update `<link rel="canonical">` from `/patterns/...` to `/architecture/patterns/...`
- [x] 2.2 In each pattern page's JSON-LD block, update `mainEntityOfPage` to the new `/architecture/patterns/...` URL
- [x] 2.3 Update cross-links between the four pattern pages (e.g. `/patterns/model-tiering` → `/architecture/patterns/model-tiering`) in all 5 files
- [x] 2.4 Update each pattern page's link back to `architecture.html` if it used a `/patterns/`-relative form (verify — likely already `architecture.html`/`/architecture.html`, no change needed)

## 3. Update `architecture.html`

- [x] 3.1 Update the "Related Patterns" section's 4 links from `/patterns/*` to `/architecture/patterns/*`

## 4. Update site nav on every page

- [x] 4.1 Remove the `<a href="/patterns/" class="site-nav-link" data-navpage="patterns">Patterns</a>` nav link from `index.html`
- [x] 4.2 Remove it from `stats.html`
- [x] 4.3 Remove it from `reports.html`
- [x] 4.4 Remove it from `report.html`
- [x] 4.5 Remove it from `changelog.html`
- [x] 4.6 Remove it from `architecture.html`
- [x] 4.7 Remove it from the 5 files under `architecture/patterns/` (replace with the standard Architecture-only nav used elsewhere)
- [x] 4.8 In `ui/nav.js`, delete the `path.includes('patterns') ? 'patterns'` branch from the active-page detection (the existing `path.includes('architecture')` branch already covers `/architecture/patterns/...` paths)

## 5. Update build configuration

- [x] 5.1 In `vite.config.js`, update the 5 `patterns*` entries under `rollupOptions.build.input` to point at `architecture/patterns/*.html` paths
- [x] 5.2 In `scripts/build-static.mjs`, update the sitemap's static URL list to use `/architecture/patterns/*` instead of `/patterns/*`

## 6. Add redirects

- [x] 6.1 Create `_redirects` **at the repo root** (not `public/_redirects`) with 301 rules — corrected mid-implementation: this site's Cloudflare Pages project publishes the repo root directly with no build step (confirmed by `changelog.html` working in production despite not being a `vite.config.js` build entry, so `dist/` is never what's actually deployed), so `_redirects` must live where Cloudflare Pages will find it — the repo root:
  - `/patterns/  /architecture/patterns/  301`
  - `/patterns/adversarial-critic  /architecture/patterns/adversarial-critic  301`
  - `/patterns/parallel-execution  /architecture/patterns/parallel-execution  301`
  - `/patterns/output-validation  /architecture/patterns/output-validation  301`
  - `/patterns/model-tiering  /architecture/patterns/model-tiering  301`

## 7. Regenerate and verify

- [x] 7.1 Run `npm run generate` to regenerate `sitemap.xml` with the new URLs
- [x] 7.2 Run `npm run build` and confirm it succeeds with no missing-entry errors (local dev/preview sanity check only — production doesn't consume `dist/`)
- [x] 7.3 Run `npm run lint` and confirm no new errors/warnings
- [x] 7.4 Run `grep -rn "/patterns/" --include="*.html" --include="*.js" --include="*.mjs" .` (excluding `node_modules`, `dist`, and `_redirects`) and confirm zero remaining stale references
- [x] 7.5 Verify the moved/edited source files directly (not via `npm run preview`, which only serves `dist/` — an incomplete build list that already excludes pages like `changelog.html` and would give false negatives): confirmed `architecture/patterns/*.html` render correct titles/H1s/nav, `architecture.html`'s related-patterns links point at the new paths, and no page has a separate "Patterns" nav entry
- [x] 7.6 Verify `_redirects` is at the repo root (`/Users/Moises_Prat/Development/prospectai-web/_redirects`) with all five rules, since that's the path Cloudflare Pages actually reads for this project's no-build deployment

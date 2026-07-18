## Why

The top nav currently treats "Architecture" and "Patterns" as two unrelated sections, but the four pattern pages are really a drill-down into the architecture story (each one documents a design pattern used by the 6-agent pipeline shown on `architecture.html`). Splitting them across two top-level nav items fragments that narrative and dilutes the topical relevance signal SEO-wise (pattern pages currently live under a sibling `/patterns/` tree instead of reinforcing the `architecture` topic cluster). Folding Patterns under Architecture — both in the nav/IA and in the URL structure — makes the site hierarchy match the content hierarchy.

## What Changes

- Remove "Patterns" as a separate top-level nav item; the site nav keeps a single "Architecture" entry.
- **BREAKING**: Move the four pattern pages and hub from `/patterns/*` to `/architecture/patterns/*`:
  - `/patterns/` → `/architecture/patterns/`
  - `/patterns/adversarial-critic` → `/architecture/patterns/adversarial-critic`
  - `/patterns/parallel-execution` → `/architecture/patterns/parallel-execution`
  - `/patterns/output-validation` → `/architecture/patterns/output-validation`
  - `/patterns/model-tiering` → `/architecture/patterns/model-tiering`
- Add 301 redirects from every old `/patterns/*` URL to its new `/architecture/patterns/*` counterpart so existing inbound links/search index entries don't 404.
- Update `architecture.html`'s existing "Related Patterns" section to link to the new `/architecture/patterns/*` paths, and update all cross-links between the four pattern pages (and back to `architecture.html`) to the new paths.
- Update `vite.config.js` build inputs, `sitemap.xml` generation (`scripts/build-static.mjs`), and canonical tags on all five pages to reflect the new URLs.
- Update internal links elsewhere in the site (nav partial, any other page linking to `/patterns/...`) to the new paths.

## Capabilities

### New Capabilities
- `legacy-url-redirects`: Cloudflare Pages `_redirects` rules that 301 every old `/patterns/*` URL to its new `/architecture/patterns/*` location, preserving SEO equity and avoiding broken external links.

### Modified Capabilities
- `patterns-section`: pattern hub/page URLs move from `/patterns/*` to `/architecture/patterns/*`; cross-link requirements (including the architecture page's links to the four patterns) updated to the new paths; "Patterns" removed from the site nav as its own item.
- `site-indexability`: sitemap generation requirement updated to emit `/architecture/patterns/*` URLs instead of `/patterns/*`.

## Impact

- `ui/nav.js` — drop the `patterns` nav case as a distinct top-level entry (folded into `architecture` active-state matching); nav link markup on every page.
- `patterns/` directory — moves to `architecture/patterns/` (5 HTML files).
- `architecture.html` — related-patterns section links updated.
- `vite.config.js` — build input paths for the 5 moved pages.
- `scripts/build-static.mjs` — sitemap URL list.
- `_redirects` (new file, repo root) — Cloudflare Pages redirect rules.
- `sitemap.xml` — regenerated with new URLs.
- All pages' canonical `<link>` tags referencing `/patterns/*`.

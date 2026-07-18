## Context

Pattern pages currently live at `/patterns/*` (a sibling directory to `architecture.html`) and are wired up as a separate top-level nav item. All internal links across the site (nav partial repeated on every HTML page, `architecture.html`'s "Related Patterns" section, and the pattern pages' own cross-links to each other) use root-relative paths like `/patterns/adversarial-critic`. Other assets (CSS, fonts) are referenced with absolute root paths (`/styles/style.css`), so moving the pattern HTML files to a new directory doesn't affect asset resolution — only the link targets and the files' own location need to change.

`vite.config.js` lists every HTML entry point explicitly under `rollupOptions.build.input`, but per `CLAUDE.md` this build is only used for local dev/preview — production deploys the repo root directly with no build step ("Production files are served as-is"). Confirmed empirically: `changelog.html` isn't in `vite.config.js`'s input list at all, so it's absent from `dist/`, yet it works in production because Cloudflare Pages serves it straight from the repo root. `scripts/build-static.mjs` hand-lists sitemap URLs; there's no existing `_redirects` file, so Cloudflare Pages redirects are currently unused by this site.

## Goals / Non-Goals

**Goals:**
- Single "Architecture" entry in the site nav; no separate "Patterns" nav item.
- Pattern pages physically and topically live under Architecture: `/architecture/patterns/*`.
- Old `/patterns/*` URLs 301-redirect to their new location so no inbound link or search-indexed URL 404s.
- Every internal reference (nav, cross-links, canonical tags, sitemap, JSON-LD `mainEntityOfPage`) is updated consistently — no stale `/patterns/*` links left pointing at the old tree post-move.

**Non-Goals:**
- Redesigning the pattern pages' content or visual design.
- Changing `architecture.html`'s own title/H1/meta description (out of scope; only its outbound links to patterns change).
- Adding new patterns or removing existing ones.
- Server-side/dynamic redirect logic — this is a static site on Cloudflare Pages, so redirects are declarative rules in a root-level `_redirects` file.

## Decisions

**1. Move the directory rather than symlink or duplicate.**
`patterns/` becomes `architecture/patterns/` (a real directory move: `patterns/index.html` → `architecture/patterns/index.html`, etc.). Considered keeping `patterns/` in place and just changing nav labels, but that leaves the URL structure (and the SEO topic-clustering goal that motivated this change) unaddressed. A real move is the only way to get `/architecture/patterns/*` URLs.

**2. Redirects via a repo-root `_redirects` file, not `public/_redirects`, not client-side JS.**
Cloudflare Pages natively reads a `_redirects` file at the root of whatever directory it publishes and serves real HTTP 301s at the edge — no server code needed. Since this site's Cloudflare Pages project publishes the repo root directly (no build step — confirmed by `changelog.html` working in production despite not being a Vite build entry), the file must live at the repo root (`/_redirects`), not inside `public/` (which would only be copied into `dist/` by `vite build`, a directory this deployment never publishes). A client-side `<meta refresh>` or JS redirect was also considered and rejected: crawlers and instant-redirect expectations are both better served by an edge-level 301.

**3. One redirect rule per old pattern URL, not a single wildcard.**
`/patterns/*` → `/architecture/patterns/:splat` would work for the four pattern-name paths, but `/patterns/` (the hub, trailing slash, no splat) needs its own explicit rule. Five explicit rules (hub + 4 patterns) keeps the mapping unambiguous and avoids relying on Cloudflare's splat-matching edge cases for a static rule count that won't grow often.

**4. Nav active-state: fold `patterns` case into `architecture`.**
`ui/nav.js` currently sets `page = 'patterns'` when the path includes `patterns`, matching a nav link with `data-navpage="patterns"`. Since that link is removed, the path-includes-`patterns` check now also sets the nav to highlight `architecture` (since `/architecture/patterns/...` already contains `architecture` in the path, the existing `path.includes('architecture')` branch naturally covers it — the explicit `patterns` branch is simply deleted).

## Risks / Trade-offs

- **[Risk]** Missing a redirect rule or an internal link update leaves a 404 or a link pointing at a now-dead URL. → **Mitigation**: enumerate every reference during implementation (nav partial × every page, `architecture.html` related-patterns section, each pattern page's own cross-links, JSON-LD `mainEntityOfPage`, canonical tags, `vite.config.js`, `scripts/build-static.mjs`, `sitemap.xml`) as explicit tasks, and verify with a build + link grep afterward.
- **[Risk]** Search engines take time to re-crawl and transfer ranking signal to the new URLs even with 301s in place; some short-term ranking dip is possible. → **Mitigation**: this is inherent to any URL move and is why 301s (not just removing the old pages) are used — accepted trade-off, no further mitigation in scope.
- **[Risk]** `vite.config.js`'s `rollupOptions.input` keys reference file paths directly; forgetting to update them after the directory move breaks `npm run build`. → **Mitigation**: build is run and checked as part of implementation verification (see tasks.md).

## Migration Plan

1. Move `patterns/*.html` → `architecture/patterns/*.html`.
2. Update all internal links/canonicals/JSON-LD in the moved files and in `architecture.html`'s related-patterns section.
3. Update `ui/nav.js` (drop the `patterns` branch) and the nav markup on every page (remove the "Patterns" `<a>`; no separate link needed since "Architecture" already covers it — the nav `<a>` for Architecture keeps `data-navpage="architecture"`).
4. Update `vite.config.js` build inputs and `scripts/build-static.mjs` sitemap URLs.
5. Add `_redirects` at the repo root with the five 301 rules.
6. Regenerate `sitemap.xml` (`npm run generate`) and run `npm run build` to confirm the new paths build cleanly (a local-dev/preview sanity check only — production doesn't consume `dist/`).
7. Manually verify: old `/patterns/*` paths redirect, new `/architecture/patterns/*` paths render, nav has no separate Patterns item, and no residual `/patterns/` links remain in the codebase (`grep -r "/patterns/" --exclude-dir=node_modules`).

No rollback complexity beyond a normal git revert — this is a static-site change with no data migration.

## Open Questions

None — scope and mechanism were confirmed with the user (URL restructuring with redirects, not nav-only).

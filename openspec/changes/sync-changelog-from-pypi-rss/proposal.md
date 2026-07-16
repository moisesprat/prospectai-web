## Why

The "ProspectAI Module" entries on `changelog.html` are hand-written and go stale the moment a new version ships to PyPI — the page currently lags real releases (e.g. v1.9.0 is live on PyPI but not listed). PyPI already publishes a release RSS feed (`https://pypi.org/rss/project/prospectai/releases.xml`) with every version and its release date, so module version history can be kept accurate automatically instead of relying on someone remembering to edit HTML.

## What Changes

- Add a build-time step (alongside the existing `stats.html`/`reports.html`/`sitemap.xml` generation in `scripts/build-static.mjs`) that fetches `https://pypi.org/rss/project/prospectai/releases.xml` and renders one changelog entry per PyPI release (version number, release date, link to the PyPI release page).
- Render these RSS-sourced entries into a dedicated, SSR-marked region of `changelog.html` (`<!--SSR:pypi-releases-->...<!--/SSR-->`), tagged `ProspectAI Module`, merged in reverse-chronological order with the existing hand-authored entries.
- Keep the existing hand-authored "Frontend" entries and the hand-authored historical "ProspectAI Module" narrative entries (pre-RSS-tracking releases) as static markup — the RSS sync only owns entries for versions present in the feed, and does not delete narrative text for versions that already have a hand-written entry.
- The PyPI RSS feed has no per-release notes (its `<description>` is a static package tagline, not real release notes) — so RSS-sourced entries show version + date + a link out to the PyPI release page, not prose.
- Wire the new step into the existing `.github/workflows/generate-sitemap.yml` scheduled job (already runs `node scripts/build-static.mjs` every 15 minutes and on push) — no new workflow needed.
- Fail-soft: if the PyPI RSS feed is unreachable, leave `changelog.html`'s RSS-sourced region untouched (same safety pattern already used for stats/reports when the backend is unreachable).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `changelog-page`: adds a requirement that ProspectAI Module version entries are sourced from the PyPI releases RSS feed at build time rather than hand-authored, and that the sync is fail-soft and idempotent.

## Impact

- `scripts/build-static.mjs` — new fetch + render step for the PyPI RSS feed.
- `changelog.html` — new SSR marker region for RSS-sourced entries.
- Possibly a new `ui/changelogRender.js` (parallel to `ui/statsRender.js` / `ui/reportsRender.js`) housing the RSS-parsing and HTML-rendering logic, kept separate from fetch/IO so it's testable/reusable.
- `.github/workflows/generate-sitemap.yml` — no structural change; the existing scheduled `npm run generate`-equivalent step picks up the new logic automatically.
- No backend (`prospectai-backend`) changes — PyPI's RSS feed is fetched directly, not proxied.

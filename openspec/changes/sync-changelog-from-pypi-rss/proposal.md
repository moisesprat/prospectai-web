## Why

The "ProspectAI Module" entries on `changelog.html` are hand-written and go stale the moment a new version ships to PyPI — the page currently lags real releases (e.g. v1.9.0 is live on PyPI but not listed). The PyPI package's README also carries a real, human-written `## Release Notes` section per version (bullet points of what actually changed), which is a much better source than the bare RSS feed of version numbers — so module version history can show real release notes automatically instead of relying on someone remembering to edit HTML.

**Correction (post-initial-implementation):** the first implementation of this change used the PyPI RSS feed (`https://pypi.org/rss/project/prospectai/releases.xml`), which only exposes version, date, and link — its `<description>` is a static package tagline, not real release notes. That shipped a changelog with empty-looking entries ("Release v1.9.0" and nothing else), which defeats the purpose. The source has been switched to the PyPI project JSON API (`https://pypi.org/pypi/prospectai/json`), whose `info.description` (the package README) contains a `## Release Notes` section with real per-version bullet points, and whose `releases` map supplies accurate per-version dates.

## What Changes

- Add a build-time step (alongside the existing `stats.html`/`reports.html`/`sitemap.xml` generation in `scripts/build-static.mjs`) that fetches `https://pypi.org/pypi/prospectai/json`, parses the `## Release Notes` section of `info.description` (per-version `### v<version> — <summary>` headers with `- ` bullet lists), and renders one changelog entry per version with its real bullet points and its release date (from the `releases` map).
- Render these entries into a dedicated, SSR-marked region of `changelog.html` (`<!--SSR:pypi-releases-->...<!--/SSR-->`), tagged `ProspectAI Module`, in reverse-chronological order.
- **Remove all pre-existing hand-authored changelog entries** (both "ProspectAI Module" and "Frontend" tagged) from `changelog.html` — they were stale, generic, and now redundant with real release notes. Going forward the changelog page is composed entirely of the PyPI-sourced SSR block; frontend-only changes (not tied to a PyPI release) are out of scope until a future change reintroduces a mechanism for them.
- The README's `## Release Notes` section only retains recent version history (currently v1.7.0 through v1.9.0) — older versions with no notes in that section are simply not rendered rather than fabricated.
- Wire the new step into the existing `.github/workflows/generate-sitemap.yml` scheduled job (already runs `node scripts/build-static.mjs` every 15 minutes and on push) — no new workflow needed.
- Fail-soft: if the PyPI JSON endpoint is unreachable or the Release Notes section is missing/empty, leave `changelog.html`'s SSR-sourced region untouched (same safety pattern already used for stats/reports when the backend is unreachable).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `changelog-page`: replaces hand-authored changelog content entirely with build-time-generated entries sourced from the PyPI package README's `## Release Notes` section (real per-version bullet points), fail-soft and idempotent. Removes the prior "backfilled historical entries" and "module vs. frontend tag" requirements since all entries are now PyPI-sourced Module entries.

## Impact

- `scripts/build-static.mjs` — fetch + render step against the PyPI project JSON API.
- `changelog.html` — hand-authored entries removed; only the SSR marker region remains.
- `ui/changelogRender.js` — parses the README's Release Notes markdown section and renders bullet-list entries.
- `styles/changelog.css` — adds `.changelog-bullets` list styling.
- `.github/workflows/generate-sitemap.yml` — no structural change; the existing scheduled `npm run generate`-equivalent step picks up the new logic automatically.
- No backend (`prospectai-backend`) changes — PyPI's JSON API is fetched directly, not proxied.

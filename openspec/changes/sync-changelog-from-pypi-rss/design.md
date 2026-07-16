## Context

`changelog.html` originally listed "ProspectAI Module" and "Frontend" entries as fully hand-authored static markup (see `openspec/specs/changelog-page/spec.md`). The site already has an established pattern for keeping static pages fresh without a backend round-trip in the browser: `scripts/build-static.mjs` runs at build time (triggered by `.github/workflows/generate-sitemap.yml` on push and every 15 minutes on a schedule), fetches live data, and rewrites HTML between `<!--SSR:marker-->...<!--/SSR-->` comment pairs, committing the result back to `main`. `stats.html` and `reports.html` already use this pattern against the `prospectai-backend` API.

**Revised source (correction after initial implementation):** the first pass used `https://pypi.org/rss/project/prospectai/releases.xml` — a standard RSS 2.0 feed with `<title>` = version, `<link>` = PyPI release page, `<pubDate>` = release timestamp, `<description>` = a static package tagline. That shipped, but the resulting changelog entries were empty of real content ("Release v1.9.0" with nothing else), which the user correctly flagged as useless. Investigation found the PyPI package's README (`https://pypi.org/pypi/prospectai/json` → `info.description`) contains a maintained `## Release Notes` section, e.g.:

```
## Release Notes

### v1.9.0 — enhance LONG-BUY trade setup logic to ensure stop_loss and
- enhance LONG-BUY trade setup logic to ensure stop_loss and entry zones are anchored to current_price
- harden PositionRecommendation schema: auto-correct above-zone trade_setup invariant violations before Pydantic validation
- remove scaled_entry_setups from draft output in ProspectAIFlow
...
```

This section only retains the most recent handful of versions (currently v1.7.0–v1.9.0) — it's a maintained "recent changes" section, not a full historical archive. The same JSON response's `releases` map gives an accurate upload date per version (`releases[version][0].upload_time_iso_8601`), matching the RSS feed's dates.

## Goals / Non-Goals

**Goals:**
- Changelog entries show real, human-written release notes (bullet points of what actually changed), not just a bare version number.
- Module version entries reflect the real PyPI release history automatically, without manual edits per release.
- Reuse the existing build-static/SSR-marker/GitHub Actions pattern rather than inventing a new mechanism.
- Keep it fail-soft: an unreachable feed or missing Release Notes section must never blank out or corrupt the changelog page.

**Non-Goals:**
- Backfilling release notes for versions the README's Release Notes section no longer covers — no fabricated bullet points for older versions.
- Keeping the old hand-authored "Frontend" or historical "ProspectAI Module" entries — per explicit user decision, the changelog page is now composed entirely of real PyPI-sourced release notes; frontend-only changes are out of scope until a future change reintroduces a mechanism for them.
- Client-side (browser) fetching of PyPI data — CORS posture for arbitrary origins is not guaranteed, and the project's static-hosting model already prefers build-time fetches for exactly this reason.

## Decisions

**Fetch at build time via `scripts/build-static.mjs`, not client-side.** Consistent with `stats.html`/`reports.html`. Avoids CORS risk against `pypi.org` from the browser and keeps `changelog.html` a zero-JS-fetch static page.

**Source: PyPI project JSON API (`https://pypi.org/pypi/prospectai/json`), not the RSS feed.** The RSS feed's `<description>` is a static package tagline with no per-release information — using it produced changelog entries with no real content. The JSON API's `info.description` (package README) contains the maintained `## Release Notes` section with real bullet points per version, and its `releases` map supplies accurate dates. This is a strictly better data source for the same "no new backend needed" property.

**Parsing: extract the `## Release Notes` markdown section, split on `### v<version> — <summary>` headers, collect `- ` bullet lines per block.** The header's inline summary text is a truncated duplicate of the first bullet (a quirk of however the README is generated), so it's dropped in favor of just `v<version>` as the entry title, with the full bullet list underneath — avoids showing a truncated, cut-off sentence as a heading.

**Versions with no entry in the Release Notes section are simply not rendered — no synthetic entries.** The section is capped by the README maintainer, not by this build step; extending it to cover more history is a README change, not a frontend concern.

**All prior hand-authored entries removed from `changelog.html`; the page is now 100% the PyPI-sourced SSR block.** Explicit user decision: since real release notes are now available, the old generic/stale hand-authored entries (both Module and Frontend) add no value and were explicitly called out as "not applicable." This is a scope change from the original design, which had planned to keep hand-authored entries untouched alongside a separate RSS block — that approach produced a page with both a terse real-data block and a redundant narrative block, which is exactly the clutter being removed.

**Rendering: reuse the `renderXxxHTML(data) -> string` pure-function pattern from `ui/statsRender.js` / `ui/reportsRender.js`.** `ui/changelogRender.js` exports `parsePypiReleaseNotes(description, releases)` and `renderReleaseNotesHTML(items)`. Keeping parse/render as pure functions (no fetch) makes them testable and mirrors existing conventions.

**Markdown parsing via regex/string extraction, not a markdown library.** The README's Release Notes section has a simple, fixed structure controlled by the package maintainer (not arbitrary user input) — extracting `### v<version>` blocks and `- ` bullets with regex avoids adding a new dependency. Mirrors `build-static.mjs`'s existing lightweight, dependency-free style.

**Entry tag: reuse `changelog-tag--module` styling, label "ProspectAI Module".** New `.changelog-bullets` CSS class added for the bullet list (no prior list styling existed on this page).

**Fail-soft behavior:** if `fetch()` of the PyPI JSON endpoint fails or returns non-200, or the Release Notes section is missing/empty, or a parsed version has no matching entry in `releases`, that version is skipped; if the resulting item list is empty, the `<!--SSR:pypi-releases-->` region is left untouched (same pattern as `generateReports`/`generateStats`).

## Risks / Trade-offs

- [Risk] The README's Release Notes section is manually maintained by the package author and could be forgotten on a future release → Mitigation: accepted; this is a real editorial artifact (not a build concern), and a missed entry just means that version doesn't appear until the README is updated — no worse than the status quo before this change.
- [Risk] PyPI JSON response format changes or the endpoint becomes temporarily empty → Mitigation: fail-soft (leave existing region untouched) means a bad fetch never blanks the page; worst case is staleness until the next 15-minute run.
- [Risk] Release Notes section could theoretically grow to cover many versions over time → Mitigation: cap rendered entries to a reasonable number (30) to keep the page from growing indefinitely, same spirit as `MAX_SITEMAP_REPORTS` in `build-static.mjs`.
- [Risk] `github-actions[bot]` commit loop already exists for `sitemap.xml`/`stats.html`/`reports.html`/`changelog.html`; no change needed here since `changelog.html` was already added to the diff-check/commit list in the initial implementation.

## Migration Plan

1. Rewrite `ui/changelogRender.js`: replace RSS parsing (`parsePypiReleasesRSS`/`renderPypiReleasesHTML`) with README-section parsing (`parsePypiReleaseNotes`/`renderReleaseNotesHTML`).
2. Remove all hand-authored `<article class="changelog-entry">` blocks from `changelog.html`, leaving only the empty `<!--SSR:pypi-releases--><!--/SSR-->` marker.
3. Add `.changelog-bullets` styling to `styles/changelog.css`.
4. Update `scripts/build-static.mjs` to fetch `https://pypi.org/pypi/prospectai/json` instead of the RSS feed, and call the new parse/render functions.
5. Run `npm run generate` locally to verify real release notes render correctly, and re-verify fail-soft behavior with a broken URL.

Rollback: revert the commit to restore the RSS-sourced (data-poor) version, or further back to restore the original all-hand-authored page.

## Open Questions

- None — data source, parsing approach, and scope of entry removal are settled above per explicit user decision.

## Context

`changelog.html` currently lists "ProspectAI Module" and "Frontend" entries as fully hand-authored static markup (see `openspec/specs/changelog-page/spec.md`). The site already has an established pattern for keeping static pages fresh without a backend round-trip in the browser: `scripts/build-static.mjs` runs at build time (triggered by `.github/workflows/generate-sitemap.yml` on push and every 15 minutes on a schedule), fetches live data, and rewrites HTML between `<!--SSR:marker-->...<!--/SSR-->` comment pairs, committing the result back to `main`. `stats.html` and `reports.html` already use this pattern against the `prospectai-backend` API.

PyPI publishes `https://pypi.org/rss/project/prospectai/releases.xml`: a standard RSS 2.0 feed, one `<item>` per release, with `<title>` = version number, `<link>` = PyPI release page, `<pubDate>` = release timestamp (RFC 822, GMT), and `<description>` = a static package tagline (not real release notes — confirmed by fetching the feed directly).

## Goals / Non-Goals

**Goals:**
- Module version entries on the changelog page reflect the real PyPI release history automatically, without manual edits per release.
- Reuse the existing build-static/SSR-marker/GitHub Actions pattern rather than inventing a new mechanism.
- Keep it fail-soft: an unreachable or malformed feed must never blank out or corrupt the changelog page.

**Non-Goals:**
- Producing human-written release notes/prose per version — the feed doesn't have this data, so entries are version + date + link only.
- Replacing or migrating the existing hand-authored historical "ProspectAI Module" entries (pre-dating this sync) or any "Frontend" entries — those stay hand-authored, untouched by the new SSR region.
- Client-side (browser) fetching of the RSS feed — PyPI's RSS endpoint's CORS posture for arbitrary origins is not guaranteed, and the project's static-hosting model already prefers build-time fetches for exactly this reason.

## Decisions

**Fetch at build time via `scripts/build-static.mjs`, not client-side.** Consistent with `stats.html`/`reports.html`. Avoids CORS risk against `pypi.org` from the browser and keeps `changelog.html` a zero-JS-fetch static page, matching the existing `changelog-page` spec requirement that the page renders with no backend/API reachable.

**New dedicated SSR marker `<!--SSR:pypi-releases-->` inserted as its own block in `changelog.html`, not interleaved item-by-item with hand-authored entries.** The existing hand-authored entries are static DOM nodes with no id; the build script can't reliably interleave into arbitrary positions between them by date without a much larger rewrite of `changelog.html` into a fully generated file (which would risk clobbering hand-authored historical entries). Instead, the RSS-sourced block renders every release from the feed as its own set of `<article class="changelog-entry">` nodes, sorted newest-first, and is placed at the top of `.changelog-list` (release feed entries are almost always more recent than the hand-authored narrative history). This trades perfect global date interleaving for safety and simplicity — acceptable since the hand-authored entries are historical/narrative and the feed entries are the "raw log."

**Versions already covered by a hand-authored narrative entry are not deduplicated against the RSS block.** Cross-referencing version numbers mentioned in hand-authored prose (e.g. "v1.7.0") against feed titles is brittle text-matching. Instead the design accepts that a version may appear both as a narrative "Frontend/Module" story further down the page and as a terse version/date/link entry in the RSS block — this is the same pattern GitHub uses (release notes vs. tag list) and is not confusing to readers since the RSS block is visually distinct (see rendering decision below).

**Rendering: reuse the `renderXxxHTML(data) -> string` pure-function pattern from `ui/statsRender.js` / `ui/reportsRender.js`.** New file `ui/changelogRender.js` exports `renderPypiReleasesHTML(items)` taking parsed `{version, date, url}[]` and returning the `<article>` markup string, plus `parsePypiReleasesRSS(xmlText)` for parsing. Keeping parse/render as pure functions (no fetch) makes them testable and mirrors existing conventions exactly.

**RSS parsing via regex/string extraction, not an XML library.** The existing codebase has zero XML/RSS dependencies and this feed's structure is simple, fixed, and controlled by PyPI (not user input) — extracting `<item>...</item>` blocks and pulling `<title>`, `<link>`, `<pubDate>` with regex avoids adding a new dependency for a one-off build script. This mirrors `build-static.mjs`'s existing lightweight, dependency-free style.

**Entry tag: reuse `changelog-tag--module` styling, label "ProspectAI Module".** No new CSS class needed; `styles/changelog.css` already defines this tag style for module entries.

**Fail-soft behavior:** if `fetch()` of the RSS URL fails or returns non-200, or parsing yields zero items, leave the `<!--SSR:pypi-releases-->` region untouched (same pattern as `generateReports`/`generateStats` returning early when `analytics`/`historyData`/`reports` is null).

## Risks / Trade-offs

- [Risk] RSS block and narrative entries both mention the same version, reading as duplicated content → Mitigation: visually distinct presentation (RSS block entries are terse, no prose, just version/date/link) makes the redundancy read as "detail log vs. release notes," similar to common OSS changelog conventions; accepted rather than solved with dedup logic.
- [Risk] PyPI RSS feed format changes or the feed becomes temporarily empty → Mitigation: fail-soft (leave existing region untouched) means a bad fetch never blanks the page; worst case is staleness until the next 15-minute run.
- [Risk] Feed could theoretically grow unbounded over years → Mitigation: cap rendered entries to a reasonable number (e.g. most recent 30) to keep the page from growing indefinitely, same spirit as `MAX_SITEMAP_REPORTS` in `build-static.mjs`.
- [Risk] `github-actions[bot]` commit loop already exists for `sitemap.xml`/`stats.html`/`reports.html`; adding `changelog.html` to the diff-check/commit list must not break the existing guard in `generate-sitemap.yml` → Mitigation: add `changelog.html` to the same `git diff --quiet -- ...` and `git add` file list, nothing else changes in the workflow.

## Migration Plan

1. Add `ui/changelogRender.js` with `parsePypiReleasesRSS` and `renderPypiReleasesHTML`.
2. Add `<!--SSR:pypi-releases-->...<!--/SSR-->` marker block to `changelog.html` (empty/placeholder initially), styled with existing `.changelog-list` / `.changelog-entry` / `.changelog-tag--module` classes.
3. Add a `generateChangelog()` step to `scripts/build-static.mjs`, called from `main()` alongside the existing three generators.
4. Update `.github/workflows/generate-sitemap.yml`'s diff-check and `git add` lines to include `changelog.html`.
5. Run `npm run generate` locally once to verify output before relying on the schedule.

No rollback complexity: this only adds a new SSR-marked region; reverting the commit restores the prior static-only page.

## Open Questions

- None — feed structure, fail-soft behavior, and dedup approach are settled above.

## 1. Parsing and rendering module

- [x] 1.1 Create `ui/changelogRender.js` with `parsePypiReleasesRSS(xmlText)` — extracts `{version, url, date}` for each `<item>` (title, link, pubDate) using string/regex extraction, returns `[]` on empty/malformed input.
- [x] 1.2 Add `renderPypiReleasesHTML(items)` to `ui/changelogRender.js` — sorts items newest-first, caps to the most recent 30, and returns `<article class="changelog-entry">` markup per item using the existing `changelog-tag--module` tag styling, a `<time datetime="YYYY-MM-DD">` element, and a link to the PyPI release page. Returns `''` for an empty list.

## 2. changelog.html markup

- [x] 2.1 Add a `<!--SSR:pypi-releases--><!--/SSR-->` marker block at the top of `.changelog-list` in `changelog.html`, above the existing hand-authored entries.

## 3. Build-time generation

- [x] 3.1 In `scripts/build-static.mjs`, add `fetchPypiReleasesRSS()` (or reuse the existing `fetch`-based helper pattern) to fetch `https://pypi.org/rss/project/prospectai/releases.xml` as text, returning `null` on any fetch error or non-200 response.
- [x] 3.2 Add `generateChangelog(rssText)` following the `generateReports`/`generateStats` pattern: parse via `parsePypiReleasesRSS`, and if items is empty/null leave `changelog.html` untouched; otherwise render via `renderPypiReleasesHTML` and inject into the `pypi-releases` SSR marker with `replaceBetween`.
- [x] 3.3 Wire `fetchPypiReleasesRSS()` and `generateChangelog()` into `main()` alongside the existing `Promise.all` fetches and generator calls.

## 4. Workflow wiring

- [x] 4.1 Update `.github/workflows/generate-sitemap.yml`'s `git diff --quiet -- ...` and `git add ...` file lists to include `changelog.html`.

## 5. Verification

- [x] 5.1 Run `npm run generate` locally, confirm `changelog.html`'s PyPI-sourced region renders real release entries (including v1.9.0) and the rest of the page is untouched.
- [x] 5.2 Temporarily point the fetch at an invalid URL (or simulate a failed fetch) and confirm `changelog.html` is left unchanged rather than emptied.
- [x] 5.3 Visually check `changelog.html` in a browser: tag styling, date formatting, and link targets look correct and match the existing `changelog-tag--module` entries.

## 6. Correction — real release notes, not bare RSS metadata

The RSS feed (task group 3) shipped entries with no real content ("Release v1.9.0" and nothing else) — the feed's `<description>` is a static tagline, not release notes. Switched to parsing the PyPI package README's `## Release Notes` section instead.

- [x] 6.1 Rewrite `ui/changelogRender.js`: replace `parsePypiReleasesRSS`/`renderPypiReleasesHTML` with `parsePypiReleaseNotes(description, releases)` (parses the README's `## Release Notes` section into `{version, date, bullets}[]`) and `renderReleaseNotesHTML(items)` (renders bullet-list entries, capped at 30).
- [x] 6.2 Update `scripts/build-static.mjs` to fetch `https://pypi.org/pypi/prospectai/json` (project JSON API) instead of the RSS feed, and call the new parse/render functions with `info.description` and `releases`.
- [x] 6.3 Remove all hand-authored `<article class="changelog-entry">` entries from `changelog.html` (both "ProspectAI Module" and "Frontend" tagged) per explicit user decision — the page is now composed entirely of the PyPI-sourced SSR block.
- [x] 6.4 Add `.changelog-bullets` list styling to `styles/changelog.css`.
- [x] 6.5 Re-verify: `npm run generate` renders real bullet-point release notes matching the actual PyPI page content; idempotency (checksum unchanged across repeated runs); fail-soft behavior (broken URL leaves `changelog.html` byte-for-byte unchanged); visual check in browser.

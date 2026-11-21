# changelog-page Specification

## Purpose
TBD - created by syncing change add-changelog-page. Update Purpose after archive.

## Requirements

### Requirement: Static changelog page
The system SHALL provide a static `changelog.html` page reachable at `/changelog` that requires no backend request to render.

#### Scenario: Page loads without network dependency
- **WHEN** a user navigates to `/changelog` with no backend/API reachable
- **THEN** the page renders its full list of changelog entries from static markup, with no failed fetch or blocking spinner for entry content

### Requirement: Reverse-chronological dated entries
The changelog page SHALL list entries ordered from most recent to oldest, each with a visible date.

#### Scenario: Entries are in descending date order
- **WHEN** the changelog page renders
- **THEN** each entry displays a date (via a `<time datetime="YYYY-MM-DD">` element or equivalent) and entries appear in the DOM in descending date order, most recent first

### Requirement: Footer link on every page
Every page in the site (`index.html`, `architecture.html`, `reports.html`, `stats.html`, `report.html`) SHALL include a link to `/changelog` in its footer.

#### Scenario: Footer link present on each page
- **WHEN** any of `index.html`, `architecture.html`, `reports.html`, `stats.html`, or `report.html` is loaded
- **THEN** the page footer contains a link with visible text (e.g. "Changelog") pointing to `changelog.html` (or `/changelog`)

### Requirement: Changelog page is indexable
The changelog page SHALL be discoverable by search engines consistent with other static pages on the site.

#### Scenario: Sitemap includes the changelog URL
- **WHEN** `sitemap.xml` is generated or inspected
- **THEN** it contains an entry for the changelog page's URL

#### Scenario: Changelog page has basic SEO metadata
- **WHEN** `changelog.html` is loaded
- **THEN** it includes a `<title>` and meta description distinct from other pages, describing it as the ProspectAI release history/changelog

### Requirement: ProspectAI Module release entries are sourced from real PyPI release notes
The changelog page SHALL render one entry per version found in the `## Release Notes` section of the PyPI package README (via `https://pypi.org/pypi/prospectai/json` → `info.description`), generated at build time and committed as static markup, showing the version's actual release-note bullet points rather than just a bare version number.

#### Scenario: A release entry is rendered for each version with release notes
- **WHEN** the build-time changelog generator runs against a reachable PyPI project JSON endpoint whose README contains a `## Release Notes` section
- **THEN** `changelog.html` contains one changelog entry per `### v<version>` block in that section, each showing the version number, a dated `<time>` element derived from the matching entry in the PyPI `releases` map, and a bullet list of the version's real release-note lines

#### Scenario: Versions without release notes are not rendered
- **WHEN** a version exists in the PyPI `releases` map but has no corresponding `### v<version>` block in the README's `## Release Notes` section
- **THEN** no changelog entry is generated for that version — no fabricated or placeholder content is shown

#### Scenario: Release entries are tagged as ProspectAI Module
- **WHEN** a PyPI-sourced release entry is rendered
- **THEN** it carries `ProspectAI Module` tag styling

#### Scenario: Release entries appear newest first
- **WHEN** multiple PyPI-sourced release entries are rendered
- **THEN** they appear in descending order by release date

### Requirement: PyPI sync is fail-soft
Generating the PyPI-sourced changelog entries SHALL NOT remove or corrupt existing changelog content if the PyPI endpoint is unreachable or its content is unparseable.

#### Scenario: Endpoint unreachable during generation
- **WHEN** the build-time generator runs and the PyPI project JSON request fails or times out
- **THEN** `changelog.html`'s PyPI-sourced region is left unchanged from its last successfully generated state, and no error is thrown that aborts the rest of the static-content build

#### Scenario: Release Notes section missing or empty
- **WHEN** the PyPI endpoint responds successfully but its README has no `## Release Notes` section, or the section yields zero parseable version blocks
- **THEN** `changelog.html`'s PyPI-sourced region is left unchanged rather than being emptied

### Requirement: Changelog build step runs on the existing schedule
The PyPI release-notes sync SHALL run as part of the existing static-content generation job, without a separate workflow or schedule.

#### Scenario: Scheduled workflow regenerates changelog entries
- **WHEN** `.github/workflows/generate-sitemap.yml` runs its `node scripts/build-static.mjs` step (on push to `main` or its 15-minute schedule)
- **THEN** `changelog.html` is included among the files checked for changes and committed if the PyPI-sourced region changed

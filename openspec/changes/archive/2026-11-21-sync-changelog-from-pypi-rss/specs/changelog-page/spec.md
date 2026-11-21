## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Entries distinguish ProspectAI module changes from frontend changes
**Reason**: The changelog page no longer carries hand-authored "Frontend" entries — all entries are build-time-generated from PyPI release notes and are uniformly tagged `ProspectAI Module`. Distinguishing module vs. frontend changes is moot until a future change reintroduces a mechanism for frontend-specific entries.
**Migration**: None required; no frontend-tagged entries exist to migrate. A future change reintroducing frontend changelog entries should re-add an equivalent requirement.

### Requirement: Backfilled historical entries
**Reason**: These hand-authored historical narrative entries were removed per explicit user decision — they were stale, generic, and redundant once real PyPI release notes became available. The changelog page is now composed entirely of build-time-generated PyPI release-notes entries.
**Migration**: None — the historical narrative text is preserved in git history (this repository's commit log) if ever needed for reference; it is intentionally not carried forward into the live page.

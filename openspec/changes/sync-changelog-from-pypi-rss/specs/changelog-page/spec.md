## ADDED Requirements

### Requirement: ProspectAI Module release entries are sourced from PyPI RSS
The changelog page SHALL render one entry per release found in the PyPI releases RSS feed (`https://pypi.org/rss/project/prospectai/releases.xml`), generated at build time and committed as static markup, distinct from the hand-authored historical narrative entries.

#### Scenario: A release entry is rendered for each feed item
- **WHEN** the build-time changelog generator runs against a reachable PyPI RSS feed
- **THEN** `changelog.html` contains one changelog entry per `<item>` in the feed, each showing the release version, a dated `<time>` element derived from the item's `<pubDate>`, and a link to the release's PyPI project page

#### Scenario: Release entries are tagged as ProspectAI Module
- **WHEN** a PyPI-sourced release entry is rendered
- **THEN** it carries the same `ProspectAI Module` tag styling used by hand-authored module entries

#### Scenario: Release entries appear newest first
- **WHEN** multiple PyPI-sourced release entries are rendered
- **THEN** they appear in descending order by release date

### Requirement: PyPI sync is fail-soft
Generating the PyPI-sourced changelog entries SHALL NOT remove or corrupt existing changelog content if the feed is unreachable or unparseable.

#### Scenario: Feed unreachable during generation
- **WHEN** the build-time generator runs and the PyPI RSS feed request fails or times out
- **THEN** `changelog.html`'s PyPI-sourced region is left unchanged from its last successfully generated state, and no error is thrown that aborts the rest of the static-content build

#### Scenario: Feed returns zero parseable items
- **WHEN** the PyPI RSS feed responds successfully but contains no parseable `<item>` entries
- **THEN** `changelog.html`'s PyPI-sourced region is left unchanged rather than being emptied

### Requirement: Changelog build step runs on the existing schedule
The PyPI RSS sync SHALL run as part of the existing static-content generation job, without a separate workflow or schedule.

#### Scenario: Scheduled workflow regenerates changelog entries
- **WHEN** `.github/workflows/generate-sitemap.yml` runs its `node scripts/build-static.mjs` step (on push to `main` or its 15-minute schedule)
- **THEN** `changelog.html` is included among the files checked for changes and committed if the PyPI-sourced region changed

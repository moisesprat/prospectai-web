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

### Requirement: Entries distinguish ProspectAI module changes from frontend changes
Each changelog entry SHALL indicate whether it describes a change to the ProspectAI module (the multi-agent reasoning system — Market Analyst, Technical Analyst, Fundamental Analyst, Draft Strategist, Critic, Final Strategist) or a change to the web frontend, or both.

#### Scenario: Entry shows a category tag
- **WHEN** an entry is rendered
- **THEN** it includes a visible tag/label identifying its category (e.g. "ProspectAI Module", "Frontend", or both) and, where applicable, references the ProspectAI module explicitly in its title or body text

### Requirement: Backfilled historical entries
The changelog SHALL include at least the following historically significant releases, each dated using the git-authored date of its anchor commit (or the latest commit date when a feature spans multiple commits):
- 6-agent pipeline update (anchor: `0702b95`, 2026-04-10)
- Report persistence — viewer, history page, My Reports (anchor: `00c1576`, 2026-06-07)
- ProspectAI Stats page with analytics and track record (anchor: `27417d5`, 2026-05-30)
- Persistent nav bar and Architecture page with live pipeline animation (anchor: `eaf004f`/`fdcf78e`, 2026-06-07)
- Conservative / Aggressive risk profile selector, v1.7.0 (anchor: `554f0b9`, 2026-05-09)
- SEO and structured data improvements across pages (anchors: `d817144` 2026-04-06, `61eed5e` 2026-04-14, `21940ed`/`9c0ffa8` 2026-07-12)
- Architecture patterns for multi-agent systems section (anchor: `5d97229`, 2026-07-12)

#### Scenario: Historical entries are present at launch
- **WHEN** the changelog page ships
- **THEN** it is not empty — it contains dated entries for each historically significant release listed above, in reverse-chronological order alongside any newer entries

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

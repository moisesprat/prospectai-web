## ADDED Requirements

### Requirement: Deploy-time sitemap generation
The build SHALL generate `sitemap.xml` as part of every production build (`npm run build`), listing every publicly indexable page with an accurate `<lastmod>` value, rather than relying on a hand-maintained file.

#### Scenario: Sitemap reflects current pages after a build
- **WHEN** `npm run build` runs
- **THEN** the generated `sitemap.xml` in the build output contains `<url>` entries for `/`, `/stats.html`, `/reports.html`, and `/architecture.html`

#### Scenario: Sitemap includes recent reports
- **WHEN** `npm run build` runs and the Modal backend's `/api/reports` endpoint returns report entries
- **THEN** the generated `sitemap.xml` includes a `<url>` entry per report (up to the most recent 200), each with a `<lastmod>` derived from that report's timestamp

#### Scenario: Backend unreachable during build
- **WHEN** `npm run build` runs and the Modal backend is unreachable
- **THEN** the build SHALL still succeed, falling back to the previous build's report list rather than failing or emitting an empty sitemap

### Requirement: robots.txt references the sitemap
`robots.txt` SHALL continue to declare the sitemap location, and SHALL be present in every build output unchanged.

#### Scenario: robots.txt present and correct after build
- **WHEN** a production build completes
- **THEN** `robots.txt` in the build output contains `Sitemap: https://prospect-ai.moisesprat.dev/sitemap.xml`

### Requirement: Static primary content on stats.html
`stats.html` SHALL include its primary analytics content (activity counters, decision breakdowns, performance figures) as static HTML present in the document returned by the server, not solely populated by client-side JavaScript after the page loads.

#### Scenario: Crawler without JS sees real data
- **WHEN** a request for `/stats.html` is made without executing JavaScript (e.g. `curl`)
- **THEN** the returned HTML contains actual figures (e.g. a total run count) rather than only skeleton/loading placeholders

#### Scenario: Client-side JS still keeps the page live
- **WHEN** a browser loads `/stats.html` with JavaScript enabled
- **THEN** `ui/stats.js` hydrates using the pre-rendered content as initial state and refreshes it from `/api/analytics` and `/api/long-buy-history` as it does today, without duplicating rendered elements

### Requirement: Static primary content on reports.html
`reports.html` SHALL include its primary content (the list of reports) as static HTML present in the document returned by the server, not solely populated by client-side JavaScript after the page loads.

#### Scenario: Crawler without JS sees the report list
- **WHEN** a request for `/reports.html` is made without executing JavaScript
- **THEN** the returned HTML contains a list of report entries (title/sector/date/link) rather than only a loading skeleton

#### Scenario: Client-side JS still keeps the list live
- **WHEN** a browser loads `/reports.html` with JavaScript enabled
- **THEN** `ui/reportsPage.js` hydrates using the pre-rendered list as initial state and refreshes it from `/api/reports` as it does today, without duplicating rendered elements

### Requirement: Self-referencing canonical tags on all pages
Every page on the site SHALL include a `<link rel="canonical">` tag pointing to that page's own production URL.

#### Scenario: Page missing a canonical tag today gets one
- **WHEN** `/report.html`, `/architecture.html`, or `/stats.html` is requested
- **THEN** the returned HTML contains a `<link rel="canonical" href="https://prospect-ai.moisesprat.dev/<own-path>">` tag matching that page's own URL

#### Scenario: Existing canonical tags remain correct
- **WHEN** `/` or `/reports.html` is requested
- **THEN** the returned HTML's canonical tag continues to reference that page's own URL

#### Scenario: noindex pages still get a canonical tag
- **WHEN** `/stats.html` is requested
- **THEN** the page contains both `<meta name="robots" content="noindex">` and a self-referencing canonical tag

## MODIFIED Requirements

### Requirement: Deploy-time sitemap generation
The build SHALL generate `sitemap.xml` as part of every production build (`npm run build`), listing every publicly indexable page with an accurate `<lastmod>` value, rather than relying on a hand-maintained file.

#### Scenario: Sitemap reflects current pages after a build
- **WHEN** `npm run build` runs
- **THEN** the generated `sitemap.xml` in the build output contains `<url>` entries for `/`, `/stats.html`, `/reports.html`, `/architecture.html`, `/patterns/`, `/patterns/adversarial-critic`, `/patterns/parallel-execution`, `/patterns/output-validation`, and `/patterns/model-tiering`

#### Scenario: Sitemap includes recent reports
- **WHEN** `npm run build` runs and the Modal backend's `/api/reports` endpoint returns report entries
- **THEN** the generated `sitemap.xml` includes a `<url>` entry per report (up to the most recent 200), each with a `<lastmod>` derived from that report's timestamp

#### Scenario: Backend unreachable during build
- **WHEN** `npm run build` runs and the Modal backend is unreachable
- **THEN** the build SHALL still succeed, falling back to the previous build's report list rather than failing or emitting an empty sitemap

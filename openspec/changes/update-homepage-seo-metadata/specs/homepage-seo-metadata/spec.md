## ADDED Requirements

### Requirement: Homepage title
The homepage (`index.html`) `<title>` SHALL read exactly `ProspectAI — Multi-Agent AI Investment Research (CrewAI)`.

#### Scenario: Title matches specified copy
- **WHEN** `index.html` is requested
- **THEN** the `<title>` element's text content is exactly `ProspectAI — Multi-Agent AI Investment Research (CrewAI)`

### Requirement: Homepage meta description accuracy and length
The homepage's `<meta name="description">` SHALL be between 150 and 160 characters and SHALL describe the pipeline as having 6 agents, consistent with `architecture.html`, `report.html`, and `reports.html`.

#### Scenario: Description length within range
- **WHEN** `index.html` is requested
- **THEN** the `content` attribute of `<meta name="description">` is between 150 and 160 characters long

#### Scenario: Description states the correct agent count
- **WHEN** `index.html` is requested
- **THEN** the `content` attribute of `<meta name="description">` contains "6-agent" and does not contain "5-agent"

### Requirement: Open Graph and Twitter Card copy consistency
The homepage's `og:title`/`og:description` and `twitter:title`/`twitter:description` SHALL match the `<title>` and meta description exactly, so search, Open Graph, and Twitter/X previews show identical copy.

#### Scenario: Open Graph tags match primary title/description
- **WHEN** `index.html` is requested
- **THEN** `meta[property="og:title"]`'s content equals the `<title>` text, and `meta[property="og:description"]`'s content equals `meta[name="description"]`'s content

#### Scenario: Twitter Card tags match primary title/description
- **WHEN** `index.html` is requested
- **THEN** `meta[name="twitter:title"]`'s content equals the `<title>` text, and `meta[name="twitter:description"]`'s content equals `meta[name="description"]`'s content

### Requirement: No meta keywords tag
The homepage SHALL NOT include a `<meta name="keywords">` tag.

#### Scenario: Keywords meta tag absent
- **WHEN** `index.html` is requested
- **THEN** no `<meta name="keywords">` element is present in the document

### Requirement: JSON-LD structured data consistency
The homepage's `SoftwareApplication` JSON-LD block SHALL have a `description` consistent with the page's meta description (correct 6-agent count) and SHALL NOT include a `keywords` property.

#### Scenario: JSON-LD description matches agent count
- **WHEN** the `application/ld+json` script block on `index.html` is parsed
- **THEN** its `description` field contains "6-agent" and does not contain "5-agent"

#### Scenario: JSON-LD has no keywords property
- **WHEN** the `application/ld+json` script block on `index.html` is parsed
- **THEN** the resulting object has no `keywords` property

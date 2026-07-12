## ADDED Requirements

### Requirement: Architecture page title and H1 target long-tail queries
`architecture.html`'s `<title>` and its `<h1>` SHALL both read exactly `Multi-Agent AI Architecture: 6-Agent CrewAI Pipeline with Adversarial Critic`.

#### Scenario: Title matches specified copy
- **WHEN** `architecture.html` is requested
- **THEN** the `<title>` element's text content is exactly `Multi-Agent AI Architecture: 6-Agent CrewAI Pipeline with Adversarial Critic`

#### Scenario: H1 matches specified copy
- **WHEN** `architecture.html` is requested
- **THEN** the page's `<h1>` text content is exactly `Multi-Agent AI Architecture: 6-Agent CrewAI Pipeline with Adversarial Critic`

### Requirement: Architecture page meta description alignment
`architecture.html`'s `<meta name="description">` SHALL be between 150 and 160 characters and SHALL be consistent with the new title/H1 framing (6-agent CrewAI pipeline, adversarial critic, self-correcting strategy).

#### Scenario: Description length within range
- **WHEN** `architecture.html` is requested
- **THEN** the `content` attribute of `<meta name="description">` is between 150 and 160 characters long

#### Scenario: Description reflects the correct agent count
- **WHEN** `architecture.html` is requested
- **THEN** the `content` attribute of `<meta name="description">` contains "6-agent"

### Requirement: Architecture page TechArticle structured data
`architecture.html` SHALL include a `TechArticle` JSON-LD block with `headline` and `description` matching the page's title and meta description, an `author` matching the site's established author identity, and `mainEntityOfPage` matching the page's own canonical URL.

#### Scenario: JSON-LD block is present and well-formed
- **WHEN** the `application/ld+json` script block on `architecture.html` is parsed
- **THEN** it is valid JSON with `"@type": "TechArticle"`

#### Scenario: JSON-LD headline and description match page copy
- **WHEN** the `application/ld+json` script block on `architecture.html` is parsed
- **THEN** its `headline` field equals the page's `<title>`/`<h1>` text, and its `description` field equals the page's meta description content

#### Scenario: JSON-LD author matches site convention
- **WHEN** the `application/ld+json` script block on `architecture.html` is parsed
- **THEN** its `author` field is `{"@type": "Person", "name": "Moises Prat", "url": "https://moisesprat.dev"}`, matching the author block used in `index.html`'s JSON-LD

#### Scenario: JSON-LD mainEntityOfPage matches the canonical URL
- **WHEN** the `application/ld+json` script block on `architecture.html` is parsed
- **THEN** its `mainEntityOfPage` field equals `https://prospect-ai.moisesprat.dev/architecture.html`

## MODIFIED Requirements

### Requirement: Patterns hub page
`/architecture/patterns/` SHALL exist and SHALL link to all four pattern pages.

#### Scenario: Hub links to all four patterns
- **WHEN** `/architecture/patterns/` is requested
- **THEN** the returned HTML contains links to `/architecture/patterns/adversarial-critic`, `/architecture/patterns/parallel-execution`, `/architecture/patterns/output-validation`, and `/architecture/patterns/model-tiering`

### Requirement: Each pattern page has an H1 matching its target keyword
Each of the four pattern pages SHALL have an `<h1>` whose text content equals its `<title>` text content, per the site's established title=H1 convention.

#### Scenario: adversarial-critic H1 matches title
- **WHEN** `/architecture/patterns/adversarial-critic` is requested
- **THEN** the `<h1>` text equals the `<title>` text, both reading `Adversarial Critic Pattern: How AI Agents Challenge Their Own Output`

#### Scenario: parallel-execution H1 matches title
- **WHEN** `/architecture/patterns/parallel-execution` is requested
- **THEN** the `<h1>` text equals the `<title>` text, both reading `Parallel Agent Execution: Running AI Agents Concurrently in a CrewAI Flow`

#### Scenario: output-validation H1 matches title
- **WHEN** `/architecture/patterns/output-validation` is requested
- **THEN** the `<h1>` text equals the `<title>` text, both reading `LLM Output Validation: Enforcing Structured Output with Pydantic Schemas`

#### Scenario: model-tiering H1 matches title
- **WHEN** `/architecture/patterns/model-tiering` is requested
- **THEN** the `<h1>` text equals the `<title>` text, both reading `Model Tiering: Matching LLM Cost to Task Complexity in Multi-Agent Systems`

### Requirement: Each pattern page has a unique meta description
Each pattern page's `<meta name="description">` SHALL be between 150 and 160 characters and SHALL be unique across the four pages.

#### Scenario: Description length within range
- **WHEN** any of the four pattern pages is requested
- **THEN** the `content` attribute of `<meta name="description">` is between 150 and 160 characters long

#### Scenario: Descriptions are distinct across pages
- **WHEN** the meta descriptions of all four pattern pages are compared
- **THEN** no two pages share the same `content` value

### Requirement: Each pattern page has TechArticle JSON-LD
Each pattern page SHALL include a `TechArticle` JSON-LD block with `headline` matching the page's title, `description` matching the page's meta description, `author` matching the site's established author identity, and `mainEntityOfPage` matching the page's own canonical URL (`https://prospect-ai.moisesprat.dev/architecture/patterns/<slug>`).

#### Scenario: JSON-LD present and well-formed
- **WHEN** the `application/ld+json` script block on any pattern page is parsed
- **THEN** it is valid JSON with `"@type": "TechArticle"`, and `headline`/`description` match the page's `<title>`/meta description, and `mainEntityOfPage` equals `https://prospect-ai.moisesprat.dev/architecture/patterns/<slug>` for that page

### Requirement: Each pattern page includes a real, attributed code excerpt
Each pattern page SHALL include at least one verbatim code excerpt from the ProspectAI core repository, with a visible attribution comment identifying the source file and line range.

#### Scenario: Code excerpt is present with attribution
- **WHEN** any pattern page is requested
- **THEN** the page contains a `<pre><code>` block with a comment line identifying its ProspectAI source file (e.g. `agents/critic_agent.py`)

### Requirement: Pattern pages cross-link to each other and to the architecture page
Each pattern page SHALL link to the other three pattern pages and to `architecture.html`. `architecture.html` SHALL link to all four pattern pages using their `/architecture/patterns/*` URLs.

#### Scenario: Pattern page links to siblings and architecture
- **WHEN** `/architecture/patterns/adversarial-critic` is requested
- **THEN** the returned HTML contains links to `/architecture/patterns/parallel-execution`, `/architecture/patterns/output-validation`, `/architecture/patterns/model-tiering`, and `/architecture.html`

#### Scenario: Architecture page links to all patterns
- **WHEN** `/architecture.html` is requested
- **THEN** the returned HTML contains links to `/architecture/patterns/adversarial-critic`, `/architecture/patterns/parallel-execution`, `/architecture/patterns/output-validation`, and `/architecture/patterns/model-tiering`

### Requirement: Main navigation surfaces Patterns under Architecture
Every page on the site SHALL include an "Architecture" link in the main site navigation pointing to `architecture.html`, and SHALL NOT include a separate top-level "Patterns" nav entry. Patterns are discoverable by following the Architecture link and its in-page related-patterns section.

#### Scenario: Single Architecture nav entry, no separate Patterns entry
- **WHEN** any page on the site is requested
- **THEN** the site navigation contains exactly one link labeled "Architecture" (pointing to `architecture.html`) and contains no nav link labeled "Patterns"

#### Scenario: Architecture nav link is active on pattern pages
- **WHEN** `/architecture/patterns/` or any of the four pattern pages is requested
- **THEN** the site navigation's "Architecture" link is marked active

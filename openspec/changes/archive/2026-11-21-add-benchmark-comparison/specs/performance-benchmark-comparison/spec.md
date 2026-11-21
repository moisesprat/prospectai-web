## ADDED Requirements

### Requirement: Performance tab benchmark delta
The Performance tab "Avg Return" KPI card SHALL show one delta line under its value (element `#kpi-avg-return-delta`) comparing the average LONG-BUY buy ROI against the benchmark over the same signals. The delta value is the average buy ROI minus the average benchmark return, and its label names the benchmark: `vs SPY` when all sectors are selected, `vs {ETF}` when a single sector is selected.

#### Scenario: All sectors selected
- **WHEN** the sector filter is set to all sectors and at least one row qualifies
- **THEN** the delta line shows the signed delta followed by the label `vs SPY`

#### Scenario: One sector selected
- **WHEN** the sector filter is set to a sector whose ETF is in the `SECTORS` mapping and at least one row of that sector qualifies
- **THEN** the delta line shows the signed delta followed by the label `vs {ETF}`, where `{ETF}` is the mapped ticker for that sector

#### Scenario: No qualifying rows
- **WHEN** no visible row qualifies for the benchmark comparison
- **THEN** the delta line carries the `hidden` attribute and never shows `—` or `0.0%`

### Requirement: Benchmark tab comparison groups
The Stats page SHALL have a Benchmark tab that shows an "Overall — vs SPY" group first, followed by one group per sector sorted by sector name and titled `{Sector} — vs {ETF}`. Each group MUST contain three cards: average buy ROI, average benchmark return and their delta, computed over qualifying rows only.

#### Scenario: Card labels and subs
- **WHEN** a benchmark group is rendered
- **THEN** its cards read `Avg Buy ROI` with the sub `{N} signals` (or `1 signal`), `Avg SPY Return` (or `Avg {ETF} Return` in a sector group) with the sub `same trigger-to-current window`, and `Delta` with the sub `buy ROI minus benchmark`

#### Scenario: Qualifying rows
- **WHEN** a group's rows are evaluated for the comparison
- **THEN** a row qualifies only when its `roi_pct` is finite, both benchmark prices for that comparison are finite, and the benchmark trigger price is nonzero

#### Scenario: Benchmark window is per row
- **WHEN** two rows have different purchase dates
- **THEN** each row's benchmark return is computed from its own benchmark trigger price and benchmark current price, and the group averages those per-row returns

#### Scenario: Partial data averages only qualifying rows
- **WHEN** some rows in a group lack a finite `roi_pct` or a benchmark price
- **THEN** the group is rendered from the qualifying rows only, and the sample size on the `Avg Buy ROI` card counts only those rows

#### Scenario: One signal
- **WHEN** exactly one row qualifies for a group
- **THEN** the `Avg Buy ROI` card sub reads `1 signal`

### Requirement: Benchmark data degrades to hidden
When no row qualifies for a benchmark comparison, the system SHALL render no benchmark group, card or delta line, SHALL show the Benchmark panel empty state (`#benchmark-empty`) instead of a blank panel, and MUST keep the Benchmark tab button visible so `#benchmark` deep links and the tab bar stay stable. This applies at build time (pre-render) and at client time.

#### Scenario: Build time
- **WHEN** the static pre-render runs against history that has no benchmark fields
- **THEN** the generated `stats.html` has the `hidden` attribute on `#kpi-avg-return-delta`, contains no `.benchmark-group`, and shows `#benchmark-empty` without `hidden`, so no previously committed delta survives regeneration

#### Scenario: Client time
- **WHEN** the pre-rendered Benchmark panel has no group children and the history fetch fails or returns no qualifying rows
- **THEN** `#benchmark-empty` is visible, the panel is not blank, and the Benchmark tab button remains visible

### Requirement: Sector ETF resolution
The system SHALL resolve which sector ETF a position is benchmarked against from the SPA `SECTORS` mapping, without requiring the backend to send an explicit ETF ticker field.

#### Scenario: Known sector
- **WHEN** a history row's `sector` matches an entry in the `SECTORS` mapping
- **THEN** that sector's group title and card label use the mapped ETF ticker

#### Scenario: Unmapped sector
- **WHEN** a history row's `sector` does not match any entry in the `SECTORS` mapping
- **THEN** no group is rendered for that sector, and if no group renders at all the panel shows the empty state

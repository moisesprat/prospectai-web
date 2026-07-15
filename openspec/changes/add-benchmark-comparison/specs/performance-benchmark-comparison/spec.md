## ADDED Requirements

### Requirement: Per-position benchmark alpha
The Performance tab track-record table SHALL display, for each history row that carries benchmark price fields, the position's alpha versus SPY and versus its sector ETF, computed as `roi_pct` minus the corresponding benchmark ROI over the same trigger-to-current window.

The benchmark ROI for a row MUST be measured over that row's own purchase window: `spy_trigger_price` and `sector_etf_trigger_price` are the index/ETF price on the same date the position was recommended/purchased (`recommended_at`, the same date used for the stock's own `trigger_price`), and `spy_current_price` / `sector_etf_current_price` are the index/ETF price as of the same "as-of" date used for the stock's own `current_price`. This is a rolling, per-row window — it is NOT a fixed calendar period shared across rows — so two rows with different purchase dates are each compared against the index's move over their own respective windows, not a common date range.

#### Scenario: Row has full benchmark data
- **WHEN** a history row includes `spy_trigger_price`, `spy_current_price`, `sector_etf_trigger_price`, and `sector_etf_current_price`
- **THEN** the table shows an alpha-vs-SPY badge and an alpha-vs-sector-ETF badge for that row, computed as `roi_pct - spy_roi_pct` and `roi_pct - sector_roi_pct` respectively, where `spy_roi_pct = (spy_current_price - spy_trigger_price) / spy_trigger_price * 100` and `sector_roi_pct` is computed the same way from the sector ETF fields

#### Scenario: Benchmark window matches the position's own window
- **WHEN** a history row's `trigger_price`/`current_price` reflect the stock's price on `recommended_at` and as of today respectively
- **THEN** `spy_trigger_price`/`sector_etf_trigger_price` MUST reflect the index/ETF price on that same `recommended_at` date, and `spy_current_price`/`sector_etf_current_price` MUST reflect the index/ETF price as of that same today, so the stock's ROI and the benchmark ROI cover an identical date range for that row

#### Scenario: Row is missing benchmark data
- **WHEN** a history row is missing one or more of the four benchmark price fields
- **THEN** the table shows `—` in both benchmark columns for that row instead of a computed value, and does not throw or omit the row

#### Scenario: Positive vs negative alpha styling
- **WHEN** a row's computed alpha value is greater than zero
- **THEN** the badge renders with the existing positive (green) styling used for ROI; a negative alpha renders with the existing negative (red) styling; a null alpha renders with the existing null/neutral styling

### Requirement: Aggregate benchmark summary
The Performance tab SHALL show a benchmark summary panel comparing the average ROI of the currently filtered/visible signals against the average SPY ROI and average sector-ETF ROI over the same set, plus the percentage of those signals that outperformed SPY.

#### Scenario: Summary reflects current sector filter
- **WHEN** the user selects a specific sector in the Performance tab's sector filter
- **THEN** the benchmark summary recomputes using only the rows matching that sector (after existing data-quality rules are applied), consistent with how the KPI cards already scope to the filtered set

#### Scenario: No rows carry benchmark data
- **WHEN** none of the currently visible rows include benchmark price fields
- **THEN** the benchmark summary panel and the two benchmark table columns are hidden rather than showing placeholder/empty values

#### Scenario: Partial benchmark data
- **WHEN** some but not all visible rows include benchmark price fields
- **THEN** the summary panel is shown, and its averages are computed only from the subset of rows that have the needed fields, mirroring how `computeKpis` already excludes rows with a null `roi_pct`

### Requirement: Sector ETF resolution
The system SHALL resolve which sector ETF a position is benchmarked against using the existing sector-to-ETF mapping, without requiring the backend to send an explicit ETF ticker field.

#### Scenario: Known sector
- **WHEN** a history row's `sector` matches one of the sectors in the existing `SECTORS` mapping (e.g. "Semiconductors" → SOXX, "Real Estate" → XLRE)
- **THEN** the sector-ETF benchmark label/column for that row displays the mapped ETF ticker

#### Scenario: Unknown or missing sector
- **WHEN** a history row's `sector` does not match any entry in the `SECTORS` mapping
- **THEN** the sector-ETF benchmark column shows `—` for that row, and the row is excluded from the sector-ETF portion of the aggregate summary

## Context

The Performance tab (`ui/stats.js`, `ui/statsRender.js`, rendered into `stats.html`, and mirrored server-side by `scripts/build-static.mjs` for SSR) shows a track-record table built from `GET /api/long-buy-history`. Each row already carries `ticker`, `sector`, `recommended_at`, `trigger_price`, `current_price`, `roi_pct`, `prospectai_version`, `report_url`. `roi_pct` is computed on the backend from `trigger_price`/`current_price`.

There is no market-data source in this repo — it is a static frontend (Cloudflare Pages) with no server-side compute beyond the build-time SSR script, which only reformats data already returned by the backend. Any benchmark price (SPY, sector ETF) must come from `prospectai-backend`, a separate repository not editable as part of this change.

## Goals / Non-Goals

**Goals:**
- Define the additive backend response fields needed to compute alpha vs SPY and alpha vs sector ETF, so both repos can implement against a stable contract.
- Render per-row alpha vs SPY and alpha vs sector ETF next to the existing ROI badge.
- Render an aggregate benchmark summary (avg ROI vs avg SPY ROI vs avg sector ETF ROI, and win-rate-vs-SPY) that respects the existing sector filter.
- Degrade gracefully (hide new UI) when benchmark fields are absent, so this frontend can ship independently of backend timing.

**Non-Goals:**
- Implementing the backend price-fetch logic itself (out of repo scope).
- Historical charting/time-series of benchmark performance — this is a point-in-time (trigger → now) comparison only, matching how `roi_pct` already works.
- Benchmarking WAIT-FOR-ENTRY/MONITOR/AVOID rows — only LONG-BUY history rows are shown on this table today, so scope stays limited to those.

## Decisions

- **Contract shape**: extend each history row with prices measured on the *same two dates already used for that row's own `trigger_price`/`current_price`* — i.e. the index/ETF price on `recommended_at` (purchase date) and as of today. This is a per-row rolling window, not a fixed calendar range shared across rows: a row purchased in March and a row purchased in June each get the index's move over their own respective window.
  ```json
  {
    "spy_trigger_price": 512.30,
    "spy_current_price": 531.10,
    "sector_etf_trigger_price": 210.40,
    "sector_etf_current_price": 219.80
  }
  ```
  Frontend derives `spy_roi_pct` and `sector_roi_pct` itself (same formula as backend uses for `roi_pct`: `(current - trigger) / trigger * 100`), then `alpha_vs_spy_pct = roi_pct - spy_roi_pct` and `alpha_vs_sector_pct = roi_pct - sector_roi_pct`.
  - **Alternative considered**: have the backend send pre-computed `alpha_vs_spy_pct`/`alpha_vs_sector_pct` directly. Rejected for this change because sending raw prices lets the frontend independently verify/display the benchmark ROI figures too (useful for the aggregate summary) without a second round trip or duplicated backend field names for "SPY ROI as a standalone number." Trade-off: frontend duplicates a small formula that already exists backend-side; acceptable since it's a two-line pure function.
  - Sector ETF ticker is derived client-side from the existing `SECTORS` mapping in `ui/data.js` keyed by `row.sector`; no new field needed for "which ETF."
- **Missing-data handling**: treat absence of `spy_trigger_price` (or any of the four new fields) on a row as "benchmark unavailable for this row" — render `—` in the new columns for that row, and exclude that row from the aggregate summary's averages (mirrors the existing `roi_pct == null` handling in `computeKpis`).
- **Aggregate summary scope**: computed from whatever rows are currently visible after `applyDataRules` + sector filter, consistent with how `computeKpis` already scopes to the filtered set. New function `computeBenchmarkSummary(history)` lives alongside `computeKpis` in `statsRender.js` for symmetry and SSR reuse.
- **Table layout**: add two columns (`vs SPY`, `vs Sector`) between the existing ROI column and the version column, using the same colored-badge visual language as `roi-badge` (`roi-badge--pos`/`--neg`/`--null`), rather than an expandable per-row detail panel — keeps the table scannable and requires no new interaction pattern.
- **Column visibility**: the whole `vs SPY` / `vs Sector` column pair and the summary panel are hidden (via a `has-benchmark-data` class toggle) when zero rows in the current dataset carry benchmark fields, so the table doesn't ship a wall of `—` before the backend field lands in production.

## Risks / Trade-offs

- [Backend dependency not yet shipped] → Frontend ships defensively hidden; no visual regression while backend field rolls out. Coordinate the backend field name/shape (this design's contract) with the `prospectai-backend` maintainer before implementation lands there.
- [SSR/static build drift] → `scripts/build-static.mjs` must import the same `computeBenchmarkSummary`/row-rendering helpers from `statsRender.js` (as it already does for `computeKpis`/`renderHistoryRowsHTML`) rather than reimplementing them, to avoid the two renderers diverging.
- [Extra table width on narrow viewports] → Two new columns on an already-dense table may require horizontal scroll on mobile; reuse the table's existing responsive/overflow handling rather than introducing new breakpoints.

## Open Questions

- Exact backend field names/shape above are a proposal, not yet confirmed with `prospectai-backend` — should be validated against that repo before implementation, since this repo cannot change the backend contract unilaterally.

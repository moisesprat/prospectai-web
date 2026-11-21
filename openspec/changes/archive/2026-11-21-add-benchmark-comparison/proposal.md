## Why

The Performance tab on the stats page (`ui/stats.js` / `ui/statsRender.js`) shows each LONG-BUY signal's raw ROI in isolation. A +8% ROI looks good until you learn SPY was up 12% over the same window — the number is meaningless without a benchmark. Adding per-position comparisons against SPY and the relevant sector ETF (and an aggregate benchmark summary) lets visitors judge whether ProspectAI's picks actually beat the market, which is the core credibility question for a track-record page.

## What Changes

- Extend the `/api/long-buy-history` history rows (backend, `prospectai-backend`) to include benchmark price fields per row: SPY trigger/current price and sector-ETF trigger/current price, using the existing sector → ETF mapping (`ui/data.js` `SECTORS`).
- Compute per-row alpha in the frontend: `alpha_vs_spy_pct = roi_pct - spy_roi_pct` and `alpha_vs_sector_pct = roi_pct - sector_roi_pct`, derived from the new price fields (mirrors how `roi_pct` is already derived from trigger/current price).
- Add two new columns (or an expandable detail) to the Performance track-record table showing alpha vs SPY and alpha vs sector ETF per position, color-coded like the existing ROI badge.
- Add an aggregate "Benchmark Summary" panel on the Performance tab: average portfolio ROI vs average SPY ROI vs average sector ETF ROI across all (filtered) signals, plus a win-rate-vs-SPY metric ("% of picks that beat SPY").
- Gracefully degrade when the backend hasn't yet shipped benchmark fields: hide the new columns/panel rather than showing broken data (matches existing `applyDataRules` / SSR-placeholder patterns already used on this page).
- Sector filter and sort behavior on the existing table continue to work unchanged; benchmark figures respect the current sector filter.

## Capabilities

### New Capabilities
- `performance-benchmark-comparison`: per-signal and aggregate comparison of realized ROI against SPY and the signal's sector ETF on the stats Performance tab.

### Modified Capabilities
(none — no existing capability spec covers the stats/performance page today)

## Impact

- **Frontend (this repo):**
  - `ui/statsRender.js` — add alpha computation helpers and new table cell/column rendering, extend `computeKpis` or add a sibling `computeBenchmarkSummary`.
  - `ui/stats.js` — wire new summary panel into the Performance tab render/init flow.
  - `stats.html` — add markup for benchmark columns and the summary panel.
  - `styles/style.css` — styling for new columns/badges/panel.
  - `scripts/build-static.mjs` (SSR) — must stay in sync with `statsRender.js` since it pre-renders the same markup server-side.
- **Backend (`prospectai-backend`, separate repo, out of scope for direct edit here):** `/api/long-buy-history` response must add SPY and sector-ETF trigger/current price fields per row. This proposal treats that as an external dependency; frontend is built defensively so it still works (columns hidden) if those fields are absent.
- No breaking changes to existing fields or endpoints.

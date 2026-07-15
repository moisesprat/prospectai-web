## 1. Backend contract (implemented directly in `prospectai-backend`, sibling repo)

- [x] 1.1 `/api/long-buy-history` rows now include `spy_trigger_price`, `spy_current_price`, `sector_etf_trigger_price`, `sector_etf_current_price` — implemented in `prospectai-backend/app.py` (`SECTOR_ETF` map, `_fetch_benchmark_prices`, `_as_of_close`), covered by `tests/test_long_buy_history_benchmark.py` (5 tests, all passing)
- [x] 1.2 Verified against the field contract fixed in this repo's design.md; frontend's live regeneration test (`node scripts/build-static.mjs` against production data) already confirmed correct degrade-to-hidden behavior before the backend fields existed — once deployed, the same columns/panel will populate instead of hiding

## 2. Frontend data helpers (`ui/statsRender.js`)

- [x] 2.1 Add `computeRoiPct(triggerPrice, currentPrice)` helper (or reuse if one exists) and use it to derive `spy_roi_pct` / `sector_roi_pct` from the new price fields
- [x] 2.2 Add `computeAlpha(row)` returning `{ vsSpy, vsSector }`, each `null` when the underlying benchmark fields are missing
- [x] 2.3 Add `hasBenchmarkData(history)` helper: true if any row in the array carries all four benchmark price fields
- [x] 2.4 Add `computeBenchmarkSummary(history)`: average ROI, average SPY ROI, average sector ROI, and win-rate-vs-SPY across rows that have benchmark data (mirrors `computeKpis`' null-filtering pattern)
- [x] 2.5 Extend `renderHistoryRowsHTML` to emit the two new `<td>` cells (alpha vs SPY, alpha vs sector ETF) using the existing `roi-badge` positive/negative/null styling, showing `—` when a row lacks benchmark data
- [x] 2.6 Resolve sector → ETF ticker per row using the existing `SECTORS` mapping from `ui/data.js` (for the sector-ETF column label/tooltip), returning `—`/excluding from summary when the sector doesn't match a known entry

## 3. Performance tab wiring (`ui/stats.js`)

- [x] 3.1 After computing `cleaned` history in `init()` and on sector-filter change, call `computeBenchmarkSummary` and render it into a new summary panel
- [x] 3.2 Toggle visibility of the two new table columns and the summary panel based on `hasBenchmarkData(cleaned)`, so nothing renders until backend data is present
- [x] 3.3 Ensure sort-by-ROI / sort-by-date and the sector filter continue to work unchanged with the new columns present (no new sort criteria required by spec)

## 4. Markup and styles

- [x] 4.1 Add `<th>` headers for "vs SPY" and "vs Sector" to `#history-table` in `stats.html`, positioned between the Return and Version columns
- [x] 4.2 Add the benchmark summary panel markup to `stats.html` (near the existing KPI grid), with elements/ids matching what `ui/stats.js` will target
- [x] 4.3 Add CSS in `styles/stats.css` for the new columns/badges/summary panel, reusing existing `roi-badge`/`stats-kpi-card` classes and color tokens where possible
- [x] 4.4 Verify the table remains usable on narrow viewports (existing horizontal scroll/overflow container covers the two extra columns)

## 5. SSR / static build parity

- [x] 5.1 Update `scripts/build-static.mjs` to call the same `computeBenchmarkSummary` / updated `renderHistoryRowsHTML` from `statsRender.js` so the pre-rendered `stats.html` snapshot matches client-side rendering
- [x] 5.2 Regenerate the static snapshot and diff `stats.html` to confirm only the intended sections changed

## 6. Verification

- [x] 6.1 Test with a mocked `/api/long-buy-history` response that includes benchmark fields on some rows and not others (partial-data scenario)
- [x] 6.2 Test with no rows carrying benchmark fields — confirm columns/panel stay hidden and no console errors
- [x] 6.3 Test sector filter interaction — confirm summary numbers recompute for the filtered subset
- [x] 6.4 Confirm positive/negative/null alpha badges render with correct styling across a range of values

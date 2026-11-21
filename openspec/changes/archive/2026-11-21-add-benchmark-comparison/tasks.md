## 1. Backend contract (implemented directly in `prospectai-backend`, sibling repo)

- [x] 1.1 `/api/long-buy-history` rows now include `spy_trigger_price`, `spy_current_price`, `sector_etf_trigger_price`, `sector_etf_current_price` — implemented in `prospectai-backend/app.py` (`SECTOR_ETF` map, `_fetch_benchmark_prices`, `_as_of_close`), covered by `tests/test_long_buy_history_benchmark.py` (5 tests, all passing)
- [x] 1.2 Verified against the field contract fixed in this repo's design.md; frontend's live regeneration test (`node scripts/build-static.mjs` against production data) already confirmed correct degrade-to-hidden behavior before the backend fields existed — once deployed, the Benchmark tab and the delta line populate instead of hiding

## 2. Frontend data helpers (`ui/statsRender.js`)

- [x] 2.1 `computeRoiPct(triggerPrice, currentPrice)` returns the percent move, or `null` when either price is not finite or the trigger is zero
- [x] 2.2 `computeSpyBenchmarkGroup(history)` builds the Overall group: average buy ROI, average SPY return and their delta over qualifying rows
- [x] 2.3 `computeSectorBenchmarkGroup(history)` builds one group per sector with a mapped ETF, using the `SECTORS` mapping from `ui/data.js`
- [x] 2.4 `computeSpyDelta(history)` and `computeSectorDelta(history)` return the delta for the Performance tab line, or `null` when no row qualifies
- [x] 2.5 `renderBenchmarkSectionHTML(history)` renders the Overall group and then one group per sector sorted by sector name, each with three cards, and returns an empty string when no group qualifies

## 3. Stats page wiring (`ui/stats.js`, `stats.html`, `styles/stats.css`)

- [x] 3.1 Add the Benchmark tab and panel to `stats.html`, reusing `.stats-kpi-grid`, `.stats-kpi-card` and `.benchmark-group*` styles
- [x] 3.2 Add the delta line `#kpi-avg-return-delta` under the Avg Return KPI value, labelled `vs SPY` for all sectors and `vs {ETF}` for one sector
- [x] 3.3 Recompute the delta line and the Benchmark panel when the sector filter changes; tab switching and the `#benchmark` hash keep working

## 4. Build-time pre-render

- [x] 4.1 `scripts/build-static.mjs` pre-renders the Benchmark panel and the delta line through the same `statsRender.js` helpers, so the committed `stats.html` snapshot matches client-side rendering

## 5. Phase 5 close-out

- [x] 5.1 Degrade to hidden at build time (scripts/statsPrerender.mjs) and client time (ui/stats.js)
- [x] 5.2 Unmapped sectors render no group
- [x] 5.3 Spec and tasks reconciled to the shipped UI before archive
- [x] 5.4 Verify live in production (phase 5) — verified 2026-11-21: live stats page Technology vs XLK group (106 signals, -12.3% / -18.8% / +6.5%) equals the shipped computation and an independent Python recompute within 0.1 pp; KPI colour class and delta line match

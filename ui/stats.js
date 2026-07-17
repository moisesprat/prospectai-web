import { trackStatsPageOpen } from './saEvents.js';
import { initNav } from './nav.js';
import {
  renderSectorBarListHTML,
  renderRiskDonutWrapHTML,
  renderDecisionsDonutPieces,
  sortHistory,
  applyDataRules,
  computeKpis,
  renderHistoryRowsHTML,
  computeSpyDelta,
  computeSectorDelta,
  renderBenchmarkSectionHTML,
} from './statsRender.js';
import { getSectorEtf } from './data.js';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

const TABS = ['activity', 'decisions', 'performance', 'benchmark'];

/* ── Tab navigation ──────────────────────────────────────────── */

function activateTab(hash) {
  const target = TABS.includes(hash) ? hash : 'activity';
  document.querySelectorAll('.stats-tab').forEach(btn => {
    const isActive = btn.dataset.hash === target;
    btn.setAttribute('aria-selected', String(isActive));
    document.getElementById(btn.dataset.panel).classList.toggle('is-active', isActive);
  });
}

function initTabs() {
  const initial = (window.location.hash.slice(1) || '').toLowerCase();
  const resolved = TABS.includes(initial) ? initial : 'activity';
  activateTab(resolved);
  if (!initial || !TABS.includes(initial)) history.replaceState(null, '', `#${resolved}`);

  document.querySelectorAll('.stats-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.hash);
      history.pushState(null, '', `#${btn.dataset.hash}`);
    });
  });

  window.addEventListener('popstate', () => {
    activateTab((window.location.hash.slice(1) || 'activity').toLowerCase());
  });
}

/* ── Activity tab — sector bar chart + risk donut ────────────── */

function renderSummary(data) {
  const totalEl = document.getElementById('total-analyses');
  totalEl.textContent = (data.total ?? 0).toLocaleString();
  totalEl.dataset.ssr = '1';

  const sectorEl = document.getElementById('sector-chart');
  sectorEl.innerHTML = renderSectorBarListHTML(data.by_sector);
  sectorEl.dataset.ssr = '1';

  const riskWrap = document.getElementById('risk-donut-wrap');
  riskWrap.innerHTML = renderRiskDonutWrapHTML(data.by_risk_profile);
  riskWrap.dataset.ssr = '1';
}

/* ── Decisions tab — single donut with sector filter ─────────── */

let _actionBreakdown = {};

function renderDecisionsDonut(sectorKey) {
  const svgEl    = document.getElementById('donut-decisions');
  const centerEl = document.getElementById('donut-decisions-center');
  const legendEl = document.getElementById('legend-decisions');
  const titleEl  = document.getElementById('decisions-chart-title');

  const { label, svgInner, centerHTML, legendHTML } =
    renderDecisionsDonutPieces(_actionBreakdown, sectorKey);

  titleEl.textContent = label;
  svgEl.innerHTML      = svgInner;
  centerEl.innerHTML   = centerHTML;
  legendEl.innerHTML   = legendHTML;
  legendEl.dataset.ssr = '1';
}

function renderCharts(actionBreakdown) {
  const empty   = document.getElementById('charts-empty');
  const content = document.getElementById('charts-content');

  if (!actionBreakdown || Object.keys(actionBreakdown).length === 0) {
    empty.hidden   = false;
    content.hidden = true;
    return;
  }

  _actionBreakdown = actionBreakdown;
  empty.hidden   = true;
  content.hidden = false;

  const select  = document.getElementById('chart-sector-filter');
  const sectors = Object.keys(actionBreakdown).sort();
  select.innerHTML = '<option value="__overall__">Overall</option>';
  for (const s of sectors) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  }

  select.addEventListener('change', () => renderDecisionsDonut(select.value));

  renderDecisionsDonut('__overall__');
}

/* ── Performance tab — sort state + raw history ─────────────── */

let _allHistory   = [];
let _perfHistory  = [];
let _sort         = { col: 'roi', dir: 'desc' };
let _sortInited   = false;

function updateSortHeaders(col, dir) {
  const roiArrow  = document.querySelector('#th-roi .sort-arrow');
  const dateArrow = document.querySelector('#th-date .sort-arrow');
  if (!roiArrow || !dateArrow) return;

  if (col === 'roi') {
    roiArrow.textContent  = dir === 'desc' ? '↓' : '↑';
    roiArrow.classList.add('active');
    dateArrow.textContent = '↕';
    dateArrow.classList.remove('active');
  } else {
    dateArrow.textContent = dir === 'desc' ? '↓' : '↑';
    dateArrow.classList.add('active');
    roiArrow.textContent  = '↕';
    roiArrow.classList.remove('active');
  }
}

function initSortHeaders() {
  if (_sortInited) return;
  _sortInited = true;

  // Use event delegation on thead — avoids timing issues with hidden table
  const thead = document.querySelector('#history-table thead');
  if (!thead) return;

  thead.addEventListener('click', e => {
    const th = e.target.closest('#th-roi, #th-date');
    if (!th) return;
    const col = th.id === 'th-roi' ? 'roi' : 'date';
    _sort.dir = (_sort.col === col && _sort.dir === 'desc') ? 'asc' : 'desc';
    _sort.col = col;
    updateSortHeaders(_sort.col, _sort.dir);
    renderHistory(sortHistory(_perfHistory, _sort.col, _sort.dir), false);
  });
}

/* ── Performance tab — sector filter helpers ─────────────────── */

function getFilteredHistory(sector) {
  if (sector === '__all__') return _allHistory;
  return _allHistory.filter(r => r.sector === sector);
}

function populateSectorDropdown(raw) {
  const sectors = [...new Set(raw.map(r => r.sector).filter(Boolean))].sort();
  const select    = document.getElementById('perf-sector-filter');
  const filterRow = document.getElementById('perf-filter-row');

  select.innerHTML = '<option value="__all__">All Sectors</option>';
  for (const s of sectors) {
    const opt = document.createElement('option');
    opt.value       = s;
    opt.textContent = s;
    select.appendChild(opt);
  }

  if (sectors.length > 0) {
    filterRow.hidden = false;
    select.addEventListener('change', () => {
      const ruled = applyDataRules(getFilteredHistory(select.value));
      renderHistory(ruled);
      renderPerformanceKpis(ruled, select.value);
    });
  }
}

/* ── Performance tab — KPI cards ─────────────────────────────── */

function renderReturnDelta(history, sectorFilter) {
  const wrap = document.getElementById('kpi-avg-return-delta');

  const delta = sectorFilter === '__all__'
    ? computeSpyDelta(history)
    : computeSectorDelta(history);

  if (delta == null) {
    wrap.hidden = true;
    return;
  }

  const label = sectorFilter === '__all__'
    ? 'vs SPY'
    : `vs ${getSectorEtf(sectorFilter) ?? 'Sector'}`;

  const valEl = document.getElementById('kpi-avg-return-delta-val');
  valEl.textContent = delta.text;
  valEl.className   = `stats-kpi-delta-val ${delta.cls}`;
  document.getElementById('kpi-avg-return-delta-label').textContent = label;
  wrap.hidden = false;
}

function renderPerformanceKpis(history, sectorFilter = '__all__') {
  const { winRate, avg, best, worst } = computeKpis(history);

  const winRateEl = document.getElementById('kpi-win-rate-val');
  winRateEl.textContent = winRate;
  winRateEl.dataset.ssr = '1';

  const avgEl = document.getElementById('kpi-avg-return-val');
  avgEl.textContent = avg.text;
  avgEl.className   = `stats-kpi-value ${avg.cls}`;
  avgEl.dataset.ssr  = '1';

  const bestEl    = document.getElementById('kpi-best-pick-val');
  const bestSubEl = document.getElementById('kpi-best-pick-sub');
  bestEl.textContent    = best.ticker;
  bestEl.className      = `stats-kpi-value ${best.cls}`;
  bestSubEl.textContent = best.text;
  bestEl.dataset.ssr     = '1';

  const worstEl    = document.getElementById('kpi-worst-pick-val');
  const worstSubEl = document.getElementById('kpi-worst-pick-sub');
  worstEl.textContent    = worst.ticker;
  worstEl.className      = `stats-kpi-value ${worst.cls}`;
  worstSubEl.textContent = worst.text;
  worstEl.dataset.ssr     = '1';

  renderReturnDelta(history, sectorFilter);
}

/* ── Performance tab — track record table ────────────────────── */

function renderHistory(history, storeAndInit = true) {
  document.getElementById('history-loading').hidden = true;
  const table    = document.getElementById('history-table');
  const tbody    = document.getElementById('history-tbody');
  const emptyEl  = document.getElementById('history-empty');

  if (history.length === 0) {
    tbody.innerHTML = '';
    table.hidden   = true;
    emptyEl.hidden = false;
    document.getElementById('perf-disclaimer').hidden = false;
    document.getElementById('perf-row-count').textContent =
      ' · 0 signals · entries within 5 days and duplicates excluded';
    if (storeAndInit) {
      _perfHistory = [];
      _sort = { col: 'roi', dir: 'desc' };
    }
    return;
  }

  emptyEl.hidden = true;
  table.hidden   = false;

  if (storeAndInit) {
    _perfHistory = history;
    _sort = { col: 'roi', dir: 'desc' };
    history = sortHistory(history, 'roi', 'desc'); // apply initial sort before rendering
    initSortHeaders();
    updateSortHeaders('roi', 'desc');
  }

  tbody.innerHTML = renderHistoryRowsHTML(history);
  tbody.dataset.ssr = '1';

  document.getElementById('perf-disclaimer').hidden = false;
  document.getElementById('perf-row-count').textContent =
    ` · ${history.length} signals · entries within 5 days and duplicates excluded`;
}

/* ── Benchmark tab — overall + per-sector comparison ─────────── */

function renderBenchmarkSection(history) {
  const container = document.getElementById('benchmark-groups');
  const emptyEl    = document.getElementById('benchmark-empty');

  const html = renderBenchmarkSectionHTML(history);
  if (!html) {
    container.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;
  container.innerHTML = html;
  container.dataset.ssr = '1';
}

/* ── Init ────────────────────────────────────────────────────── */

async function init() {
  initNav();
  trackStatsPageOpen();
  initTabs();

  const [analyticsRes, historyRes] = await Promise.allSettled([
    fetch(`${BACKEND_URL}/api/analytics`),
    fetch(`${BACKEND_URL}/api/long-buy-history`),
  ]);

  // Activity + Decisions
  if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
    try {
      const data = await analyticsRes.value.json();
      renderSummary(data);
      renderCharts(data.action_breakdown ?? {});
    } catch { /* non-critical */ }
  } else {
    // Only clear placeholders that were never pre-rendered at build time —
    // leave any existing server-rendered content in place rather than wiping it.
    const totalEl = document.getElementById('total-analyses');
    if (totalEl.dataset.ssr !== '1') totalEl.textContent = '—';
    const sectorEl = document.getElementById('sector-chart');
    if (sectorEl.dataset.ssr !== '1') sectorEl.innerHTML = '';
    const riskWrap = document.getElementById('risk-donut-wrap');
    if (riskWrap.dataset.ssr !== '1') riskWrap.innerHTML = '';
  }

  // Performance
  const loadingEl = document.getElementById('history-loading');
  if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
    try {
      const data = await historyRes.value.json();
      _allHistory  = data.history ?? [];
      populateSectorDropdown(_allHistory);
      const cleaned = applyDataRules(_allHistory);
      renderHistory(cleaned);
      renderPerformanceKpis(cleaned);
      renderBenchmarkSection(cleaned);
    } catch {
      loadingEl.hidden = true;
      if (document.getElementById('history-tbody').dataset.ssr !== '1') {
        document.getElementById('history-error').hidden = false;
        renderPerformanceKpis([]);
      }
      if (document.getElementById('benchmark-groups').dataset.ssr !== '1') {
        renderBenchmarkSection([]);
      }
    }
  } else {
    loadingEl.hidden = true;
    if (document.getElementById('history-tbody').dataset.ssr !== '1') {
      document.getElementById('history-error').hidden = false;
      renderPerformanceKpis([]);
    }
    if (document.getElementById('benchmark-groups').dataset.ssr !== '1') {
      renderBenchmarkSection([]);
    }
  }
}

init();

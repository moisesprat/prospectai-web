import { trackStatsPageOpen } from './saEvents.js';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

const ACTION_COLOURS = {
  'LONG-BUY':       '#4a7c59',
  'WAIT-FOR-ENTRY': '#e0a040',
  'MONITOR':        '#8c8c8c',
  'AVOID':          '#c0392b',
};
const ACTION_ORDER = ['LONG-BUY', 'WAIT-FOR-ENTRY', 'MONITOR', 'AVOID'];

const RISK_COLOURS = {
  conservative: '#4a7c59',
  aggressive:   '#e0a040',
  moderate:     '#8c8c8c',
};
const RISK_LABELS = {
  conservative: 'Conservative',
  aggressive:   'Aggressive',
  moderate:     'Moderate',
};

const TABS = ['activity', 'decisions', 'performance'];

/* ── Formatting helpers ──────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const year  = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function utcDateStr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

function fmtPrice(v) {
  if (v == null) return '—';
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtRoi(roi) {
  if (roi == null) return { text: '—', cls: '' };
  if (roi >= 0) return { text: `+${roi.toFixed(1)}%`, cls: 'stats-kpi-value--pos' };
  return { text: `−${Math.abs(roi).toFixed(1)}%`, cls: 'stats-kpi-value--neg' };
}

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

/* ── SVG Donut ───────────────────────────────────────────────── */

function renderDonut(svgEl, slices, radius, strokeWidth) {
  svgEl.innerHTML = '';
  const cx    = svgEl.viewBox.baseVal.width / 2;
  const cy    = svgEl.viewBox.baseVal.height / 2;
  const circ  = 2 * Math.PI * radius;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return;

  let offset = 0;
  for (const sl of slices) {
    const dash   = (sl.value / total) * circ;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', sl.colour);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${dash} ${circ - dash}`);
    circle.setAttribute('stroke-dashoffset', -offset);
    svgEl.appendChild(circle);
    offset += dash;
  }
}

function buildLegend(listEl, slices, total) {
  listEl.innerHTML = '';
  for (const sl of slices) {
    const pct = total > 0 ? ((sl.value / total) * 100).toFixed(1) : '0.0';
    const li  = document.createElement('li');
    li.className = 'stats-legend-item';
    li.innerHTML = `
      <span class="stats-legend-dot" style="background:${sl.colour}"></span>
      <span class="stats-legend-label">${sl.label}</span>
      <span class="stats-legend-count">${sl.value}</span>
      <span class="stats-legend-pct">${pct}%</span>
    `;
    listEl.appendChild(li);
  }
}

function buildSlices(counts) {
  return ACTION_ORDER
    .filter(a => (counts[a] ?? 0) > 0)
    .map(a => ({ label: a, value: counts[a], colour: ACTION_COLOURS[a] }));
}

/* ── Activity tab — sector bar chart + risk donut ────────────── */

function renderSummary(data) {
  // Total runs
  document.getElementById('total-analyses').textContent =
    (data.total ?? 0).toLocaleString();

  // Sector coverage — horizontal bar chart
  const sectorEl  = document.getElementById('sector-chart');
  const sectors   = Object.entries(data.by_sector ?? {}).sort((a, b) => b[1] - a[1]);
  const maxCount  = sectors.length > 0 ? sectors[0][1] : 1;
  const barList   = document.createElement('ul');
  barList.className = 'stat-bar-list';
  for (const [name, count] of sectors) {
    const pct  = Math.round((count / maxCount) * 100);
    const li   = document.createElement('li');
    li.className = 'stat-bar-row';
    li.innerHTML = `
      <span class="stat-bar-label" title="${name}">${name}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="stat-bar-count">${count}</span>
    `;
    barList.appendChild(li);
  }
  sectorEl.innerHTML = '';
  sectorEl.appendChild(barList);

  // Risk profile — SVG donut
  const riskWrap = document.getElementById('risk-donut-wrap');
  const risks    = Object.entries(data.by_risk_profile ?? {}).sort((a, b) => b[1] - a[1]);
  const riskTotal = risks.reduce((s, [, v]) => s + v, 0);
  const riskSlices = risks.map(([key, value]) => ({
    label:  RISK_LABELS[key] ?? key,
    value,
    colour: RISK_COLOURS[key] ?? '#8c8c8c',
  }));

  const svgSize = 90;
  riskWrap.innerHTML = `
    <div style="position:relative;width:${svgSize}px;height:${svgSize}px;flex-shrink:0">
      <svg id="donut-risk" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}"
           style="transform:rotate(-90deg)"></svg>
      <div class="stats-donut-center" style="font-size:13px">
        ${riskTotal}<span style="font-size:9px">runs</span>
      </div>
    </div>
    <ul class="stats-legend" id="legend-risk"></ul>
  `;
  renderDonut(document.getElementById('donut-risk'), riskSlices, 33, 16);
  buildLegend(document.getElementById('legend-risk'), riskSlices, riskTotal);
}

/* ── Decisions tab — single donut with sector filter ─────────── */

let _actionBreakdown = {};

function renderDecisionsDonut(sectorKey) {
  const svgEl    = document.getElementById('donut-decisions');
  const centerEl = document.getElementById('donut-decisions-center');
  const legendEl = document.getElementById('legend-decisions');
  const titleEl  = document.getElementById('decisions-chart-title');

  let counts, total, label;
  if (sectorKey === '__overall__') {
    counts = {};
    for (const sd of Object.values(_actionBreakdown)) {
      for (const [a, c] of Object.entries(sd.counts ?? {})) {
        counts[a] = (counts[a] ?? 0) + c;
      }
    }
    total = Object.values(counts).reduce((s, v) => s + v, 0);
    label = 'Overall';
  } else {
    const sd = _actionBreakdown[sectorKey] ?? {};
    counts = sd.counts ?? {};
    total  = sd.total ?? 0;
    label  = sectorKey;
  }

  titleEl.textContent  = label;
  centerEl.innerHTML   = `${total}<span>signals</span>`;
  const slices = buildSlices(counts);
  renderDonut(svgEl, slices, 44, 22);
  buildLegend(legendEl, slices, total);
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

  // Populate sector dropdown — Overall + sorted sector keys
  const select  = document.getElementById('chart-sector-filter');
  const sectors = Object.keys(actionBreakdown).sort();
  // Keep existing Overall option, add sectors
  select.innerHTML = '<option value="__overall__">Overall</option>';
  for (const s of sectors) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  }

  // Wire change handler
  select.addEventListener('change', () => renderDecisionsDonut(select.value));

  // Render initial Overall donut
  renderDecisionsDonut('__overall__');
}

/* ── Performance tab — sort state ───────────────────────────── */

let _perfHistory  = [];
let _sort         = { col: 'roi', dir: 'desc' };
let _sortInited   = false;

function sortHistory(history, col, dir) {
  return [...history].sort((a, b) => {
    if (col === 'roi') {
      const nullA = a.roi_pct == null;
      const nullB = b.roi_pct == null;
      if (nullA && nullB) return 0;
      if (nullA) return 1;   // nulls always last
      if (nullB) return -1;
      return dir === 'desc' ? b.roi_pct - a.roi_pct : a.roi_pct - b.roi_pct;
    }
    // date sort
    const ta = new Date(a.recommended_at).getTime();
    const tb = new Date(b.recommended_at).getTime();
    return dir === 'desc' ? tb - ta : ta - tb;
  });
}

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

  ['roi', 'date'].forEach(col => {
    document.getElementById(`th-${col}`).addEventListener('click', () => {
      if (_sort.col === col) {
        _sort.dir = _sort.dir === 'desc' ? 'asc' : 'desc';
      } else {
        _sort.col = col;
        _sort.dir = 'desc';
      }
      updateSortHeaders(_sort.col, _sort.dir);
      renderHistory(sortHistory(_perfHistory, _sort.col, _sort.dir), false);
    });
  });
}

/* ── Performance tab — data quality helpers ──────────────────── */

function deduplicateHistory(history) {
  const seen = new Map();
  // Sort newest first so we keep latest per group
  const sorted = [...history].sort((a, b) =>
    new Date(b.recommended_at) - new Date(a.recommended_at)
  );
  for (const row of sorted) {
    const key = `${row.ticker}|${utcDateStr(row.recommended_at)}|${row.trigger_price}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
}

function excludeRecentHistory(history) {
  const now     = new Date();
  const cutoff  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cutoff.setUTCDate(cutoff.getUTCDate() - 5);
  return history.filter(r => new Date(r.recommended_at) < cutoff);
}

/* ── Performance tab — KPI cards ─────────────────────────────── */

function renderPerformanceKpis(history) {
  const valid    = history.filter(r => r.roi_pct != null);
  const positive = valid.filter(r => r.roi_pct > 0);

  const winRateEl = document.getElementById('kpi-win-rate-val');
  winRateEl.textContent = valid.length > 0
    ? `${((positive.length / valid.length) * 100).toFixed(1)}%`
    : '—';

  const avgEl = document.getElementById('kpi-avg-return-val');
  if (valid.length > 0) {
    const avg = valid.reduce((s, r) => s + r.roi_pct, 0) / valid.length;
    const { text, cls } = fmtRoi(avg);
    avgEl.textContent = text;
    avgEl.className   = `stats-kpi-value ${cls}`;
  } else {
    avgEl.textContent = '—';
  }

  const bestEl    = document.getElementById('kpi-best-pick-val');
  const bestSubEl = document.getElementById('kpi-best-pick-sub');
  if (valid.length > 0) {
    const best = valid.reduce((a, b) => b.roi_pct > a.roi_pct ? b : a);
    const { text, cls } = fmtRoi(best.roi_pct);
    bestEl.textContent    = best.ticker;
    bestEl.className      = `stats-kpi-value ${cls}`;
    bestSubEl.textContent = text;
  } else {
    bestEl.textContent = '—';
  }

  const worstEl    = document.getElementById('kpi-worst-pick-val');
  const worstSubEl = document.getElementById('kpi-worst-pick-sub');
  if (valid.length > 0) {
    const worst = valid.reduce((a, b) => b.roi_pct < a.roi_pct ? b : a);
    const { text, cls } = fmtRoi(worst.roi_pct);
    worstEl.textContent    = worst.ticker;
    worstEl.className      = `stats-kpi-value ${cls}`;
    worstSubEl.textContent = text;
  } else {
    worstEl.textContent = '—';
  }
}

/* ── Performance tab — track record table ────────────────────── */

function renderHistory(history, storeAndInit = true) {
  document.getElementById('history-loading').hidden = true;
  const table = document.getElementById('history-table');
  const tbody = document.getElementById('history-tbody');
  table.hidden    = false;
  tbody.innerHTML = '';

  if (storeAndInit) {
    _perfHistory = history;
    _sort = { col: 'roi', dir: 'desc' };
    updateSortHeaders('roi', 'desc');
    initSortHeaders();
  }

  history.forEach((row, i) => {
    const roi    = row.roi_pct;
    const isPos  = roi != null && roi > 0;
    const isNull = roi == null;

    let roiBadge, barHtml = '';
    if (isNull) {
      roiBadge = `<span class="roi-badge roi-badge--null">—</span>`;
    } else if (isPos) {
      const pct = Math.min(roi / 50, 1) * 100;
      roiBadge  = `<span class="roi-badge roi-badge--pos">+${roi.toFixed(1)}%</span>`;
      barHtml   = `<div class="roi-bar-track"><div class="roi-bar-fill" style="width:${pct}%"></div></div>`;
    } else {
      roiBadge = `<span class="roi-badge roi-badge--neg">−${Math.abs(roi).toFixed(1)}%</span>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-rank">${i + 1}</td>
      <td class="col-ticker">${row.ticker}</td>
      <td class="col-sector">${row.sector || '—'}</td>
      <td class="col-date">${fmtDate(row.recommended_at)}</td>
      <td class="col-entry">${fmtPrice(row.trigger_price)}</td>
      <td class="col-current">${fmtPrice(row.current_price)}</td>
      <td class="col-roi"><div class="roi-cell">${roiBadge}${barHtml}</div></td>
      <td class="col-version">${row.prospectai_version ?? '—'}</td>
    `;
    tbody.appendChild(tr);
  });

  // Disclaimer + row count
  document.getElementById('perf-disclaimer').hidden = false;
  document.getElementById('perf-row-count').textContent =
    ` · ${history.length} signals · entries within 5 days and duplicates excluded`;
}

/* ── Init ────────────────────────────────────────────────────── */

async function init() {
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
    // Clear skeletons on failure
    document.getElementById('total-analyses').textContent = '—';
    document.getElementById('sector-chart').innerHTML = '';
    document.getElementById('risk-donut-wrap').innerHTML = '';
  }

  // Performance
  const loadingEl = document.getElementById('history-loading');
  if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
    try {
      const data    = await historyRes.value.json();
      const raw     = data.history ?? [];
      const cleaned = excludeRecentHistory(deduplicateHistory(raw));
      renderHistory(cleaned);
      renderPerformanceKpis(cleaned);
    } catch {
      loadingEl.hidden = true;
      document.getElementById('history-error').hidden = false;
      renderPerformanceKpis([]);
    }
  } else {
    loadingEl.hidden = true;
    document.getElementById('history-error').hidden = false;
    renderPerformanceKpis([]);
  }
}

init();

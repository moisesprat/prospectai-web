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

const RISK_LABELS = {
  conservative: 'Conservative',
  aggressive:   'Aggressive',
  moderate:     'Moderate',
};

/* ── Formatting helpers ──────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const year  = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function fmtPrice(v) {
  if (v == null) return '—';
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── SVG Donut ───────────────────────────────────────────────── */

function renderDonut(svgEl, slices, radius, strokeWidth) {
  svgEl.innerHTML = '';
  const cx = svgEl.viewBox.baseVal.width / 2;
  const cy = svgEl.viewBox.baseVal.height / 2;
  const circ = 2 * Math.PI * radius;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  if (total === 0) return;

  let offset = 0;
  for (const sl of slices) {
    const pct  = sl.value / total;
    const dash = pct * circ;
    const gap  = circ - dash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', sl.colour);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', -offset);
    svgEl.appendChild(circle);
    offset += dash;
  }
}

function buildLegend(listEl, slices, total) {
  listEl.innerHTML = '';
  for (const sl of slices) {
    const pct  = total > 0 ? ((sl.value / total) * 100).toFixed(1) : '0.0';
    const li   = document.createElement('li');
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

/* ── Summary cards ───────────────────────────────────────────── */

function renderSummary(data) {
  document.getElementById('total-analyses').textContent =
    (data.total ?? 0).toLocaleString();

  // By sector — sorted descending
  const sectorList = document.getElementById('sector-list');
  sectorList.innerHTML = '';
  const sectors = Object.entries(data.by_sector ?? {})
    .sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sectors) {
    const li = document.createElement('li');
    li.className = 'stats-sector-item';
    li.innerHTML = `<span class="stats-sector-name">${name}</span><span class="stats-sector-count">${count}</span>`;
    sectorList.appendChild(li);
  }

  // By risk profile
  const riskList = document.getElementById('risk-list');
  riskList.innerHTML = '';
  const risks = Object.entries(data.by_risk_profile ?? {})
    .sort((a, b) => b[1] - a[1]);
  for (const [key, count] of risks) {
    const li = document.createElement('li');
    li.className = 'stats-risk-item';
    li.innerHTML = `<span class="stats-risk-name">${RISK_LABELS[key] ?? key}</span><span class="stats-risk-count">${count}</span>`;
    riskList.appendChild(li);
  }
}

/* ── Charts ──────────────────────────────────────────────────── */

function renderCharts(actionBreakdown) {
  if (!actionBreakdown || Object.keys(actionBreakdown).length === 0) return;

  document.getElementById('charts-section').hidden = false;

  // Aggregate overall counts
  const overall = {};
  for (const sectorData of Object.values(actionBreakdown)) {
    for (const [action, count] of Object.entries(sectorData.counts ?? {})) {
      overall[action] = (overall[action] ?? 0) + count;
    }
  }
  const overallTotal  = Object.values(overall).reduce((s, v) => s + v, 0);
  const overallSlices = buildSlices(overall);

  const svgOverall = document.getElementById('donut-overall');
  renderDonut(svgOverall, overallSlices, 44, 22);
  document.getElementById('donut-overall-center').innerHTML =
    `${overallTotal}<span>total</span>`;
  buildLegend(document.getElementById('legend-overall'), overallSlices, overallTotal);

  // Per-sector donuts
  const container = document.getElementById('sector-donuts');
  container.innerHTML = '';
  for (const [sector, sectorData] of Object.entries(actionBreakdown)) {
    const counts = sectorData.counts ?? {};
    const total  = sectorData.total ?? 0;
    const slices = buildSlices(counts);
    if (slices.length === 0) continue;

    const card = document.createElement('div');
    card.className = 'stats-chart-card stats-chart-card--sector';
    card.innerHTML = `
      <div class="stats-chart-title">${sector}</div>
      <div class="stats-donut-wrap stats-donut-wrap--sm">
        <svg class="stats-donut stats-donut--sm" viewBox="0 0 90 90" width="90" height="90"></svg>
        <div class="stats-donut-center" style="font-size:14px">${total}<span style="font-size:9px">runs</span></div>
      </div>
      <ul class="stats-legend"></ul>
    `;
    container.appendChild(card);

    const svgEl  = card.querySelector('.stats-donut');
    const legend = card.querySelector('.stats-legend');
    renderDonut(svgEl, slices, 33, 16);
    buildLegend(legend, slices, total);
  }
}

/* ── Track record table ──────────────────────────────────────── */

function renderHistory(history) {
  const loading = document.getElementById('history-loading');
  const table   = document.getElementById('history-table');
  const tbody   = document.getElementById('history-tbody');

  loading.hidden = true;
  table.hidden   = false;
  tbody.innerHTML = '';

  history.forEach((row, i) => {
    const roi   = row.roi_pct;
    const isPos = roi != null && roi > 0;
    const isNull = roi == null;

    let roiBadge;
    let barHtml = '';
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
    `;
    tbody.appendChild(tr);
  });
}

/* ── Init ────────────────────────────────────────────────────── */

async function init() {
  // Fire SA event immediately, before any data fetch
  trackStatsPageOpen();

  // Fetch analytics and history in parallel
  const [analyticsRes, historyRes] = await Promise.allSettled([
    fetch(`${BACKEND_URL}/api/analytics`),
    fetch(`${BACKEND_URL}/api/long-buy-history`),
  ]);

  // Summary cards + charts
  if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
    try {
      const data = await analyticsRes.value.json();
      renderSummary(data);
      renderCharts(data.action_breakdown ?? {});
    } catch {
      // non-critical
    }
  }

  // Track record table
  const historyEl = document.getElementById('history-loading');
  if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
    try {
      const data = await historyRes.value.json();
      renderHistory(data.history ?? []);
    } catch {
      historyEl.hidden = true;
      document.getElementById('history-error').hidden = false;
    }
  } else {
    historyEl.hidden = true;
    document.getElementById('history-error').hidden = false;
  }
}

init();

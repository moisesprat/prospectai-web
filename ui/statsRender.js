/* ============================================================
   Shared stats-page rendering logic — pure string builders,
   no DOM access. Imported by ui/stats.js (browser) and by
   scripts/build-static.mjs (Node) so both environments render
   identical markup from identical data.
   ============================================================ */

import { fmtDate, utcDateStr, fmtPrice, fmtRoi, escapeHtml } from './formatters.js';
import { getSectorEtf } from './data.js';

export const ACTION_COLOURS = {
  'LONG-BUY':       '#4a7c59',
  'WAIT-FOR-ENTRY': '#e0a040',
  'MONITOR':        '#8c8c8c',
  'AVOID':          '#c0392b',
};
export const ACTION_ORDER = ['LONG-BUY', 'WAIT-FOR-ENTRY', 'MONITOR', 'AVOID'];

export const RISK_COLOURS = {
  conservative: '#4a7c59',
  aggressive:   '#e0a040',
  moderate:     '#8c8c8c',
};
export const RISK_LABELS = {
  conservative: 'Conservative',
  aggressive:   'Aggressive',
  moderate:     'Moderate',
};

export function buildSlices(counts) {
  return ACTION_ORDER
    .filter(a => (counts[a] ?? 0) > 0)
    .map(a => ({ label: a, value: counts[a], colour: ACTION_COLOURS[a] }));
}

/* ── SVG donut (string) ─────────────────────────────────────── */

export function renderDonutSVGInner(slices, size, radius, strokeWidth) {
  const cx    = size / 2;
  const cy    = size / 2;
  const circ  = 2 * Math.PI * radius;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return '';

  let offset = 0;
  let out = '';
  for (const sl of slices) {
    const dash = (sl.value / total) * circ;
    out += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${sl.colour}" ` +
      `stroke-width="${strokeWidth}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}"></circle>`;
    offset += dash;
  }
  return out;
}

export function buildLegendHTML(slices, total) {
  return slices.map(sl => {
    const pct = total > 0 ? ((sl.value / total) * 100).toFixed(1) : '0.0';
    return `<li class="stats-legend-item">
      <span class="stats-legend-dot" style="background:${sl.colour}"></span>
      <span class="stats-legend-label">${sl.label}</span>
      <span class="stats-legend-pct">${pct}%</span>
    </li>`;
  }).join('');
}

/* ── Activity tab ────────────────────────────────────────────── */

export function renderSectorBarListHTML(bySector) {
  const sectors  = Object.entries(bySector ?? {}).sort((a, b) => b[1] - a[1]);
  const maxCount = sectors.length > 0 ? sectors[0][1] : 1;
  const rows = sectors.map(([name, count]) => {
    const pct = Math.round((count / maxCount) * 100);
    return `<li class="stat-bar-row">
      <span class="stat-bar-label" title="${name}">${name}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="stat-bar-count">${count}</span>
    </li>`;
  }).join('');
  return `<ul class="stat-bar-list">${rows}</ul>`;
}

export function renderRiskDonutWrapHTML(byRiskProfile) {
  const risks     = Object.entries(byRiskProfile ?? {}).sort((a, b) => b[1] - a[1]);
  const riskTotal = risks.reduce((s, [, v]) => s + v, 0);
  const slices    = risks.map(([key, value]) => ({
    label:  RISK_LABELS[key] ?? key,
    value,
    colour: RISK_COLOURS[key] ?? '#8c8c8c',
  }));
  const svgSize = 90;
  const donutInner = renderDonutSVGInner(slices, svgSize, 33, 16);
  const legendHTML = buildLegendHTML(slices, riskTotal);
  return `
    <div style="position:relative;width:${svgSize}px;height:${svgSize}px;flex-shrink:0">
      <svg id="donut-risk" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}"
           style="transform:rotate(-90deg)">${donutInner}</svg>
      <div class="stats-donut-center" style="font-size:9px;color:var(--text-dim)">
        profile
      </div>
    </div>
    <ul class="stats-legend" id="legend-risk">${legendHTML}</ul>
  `;
}

/* ── Decisions tab ───────────────────────────────────────────── */

export function computeDecisionsForSector(actionBreakdown, sectorKey) {
  if (sectorKey === '__overall__') {
    const counts = {};
    for (const sd of Object.values(actionBreakdown ?? {})) {
      for (const [a, c] of Object.entries(sd.counts ?? {})) {
        counts[a] = (counts[a] ?? 0) + c;
      }
    }
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    return { counts, total, label: 'Overall' };
  }
  const sd = (actionBreakdown ?? {})[sectorKey] ?? {};
  return { counts: sd.counts ?? {}, total: sd.total ?? 0, label: sectorKey };
}

export function renderDecisionsDonutPieces(actionBreakdown, sectorKey = '__overall__') {
  const { counts, total, label } = computeDecisionsForSector(actionBreakdown, sectorKey);
  const slices = buildSlices(counts);
  return {
    label,
    svgInner:   renderDonutSVGInner(slices, 120, 44, 22),
    centerHTML: `<span style="font-size:9px;color:var(--text-dim)">${label}</span>`,
    legendHTML: buildLegendHTML(slices, total),
  };
}

/* ── Performance tab — data quality helpers ──────────────────── */

export function deduplicateHistory(history) {
  const seen = new Map();
  const sorted = [...history].sort((a, b) =>
    new Date(b.recommended_at) - new Date(a.recommended_at)
  );
  for (const row of sorted) {
    const key = `${row.ticker}|${utcDateStr(row.recommended_at)}|${row.trigger_price}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
}

export function excludeRecentHistory(history, now = new Date()) {
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cutoff.setUTCDate(cutoff.getUTCDate() - 5);
  return history.filter(r => new Date(r.recommended_at) < cutoff);
}

export function applyDataRules(history) {
  return excludeRecentHistory(deduplicateHistory(history));
}

export function sortHistory(history, col, dir) {
  return [...history].sort((a, b) => {
    if (col === 'roi') {
      const nullA = a.roi_pct == null;
      const nullB = b.roi_pct == null;
      if (nullA && nullB) return 0;
      if (nullA) return 1;
      if (nullB) return -1;
      return dir === 'desc' ? b.roi_pct - a.roi_pct : a.roi_pct - b.roi_pct;
    }
    const ta = new Date(a.recommended_at).getTime();
    const tb = new Date(b.recommended_at).getTime();
    return dir === 'desc' ? tb - ta : ta - tb;
  });
}

export function computeKpis(history) {
  const valid    = history.filter(r => r.roi_pct != null);
  const positive = valid.filter(r => r.roi_pct > 0);

  const winRate = valid.length > 0
    ? `${((positive.length / valid.length) * 100).toFixed(1)}%`
    : '—';

  let avg = { text: '—', cls: '' };
  if (valid.length > 0) {
    const avgVal = valid.reduce((s, r) => s + r.roi_pct, 0) / valid.length;
    avg = fmtRoi(avgVal);
  }

  let best = { ticker: '—', text: '', cls: '' };
  if (valid.length > 0) {
    const b = valid.reduce((a, b) => b.roi_pct > a.roi_pct ? b : a);
    const { text, cls } = fmtRoi(b.roi_pct);
    best = { ticker: b.ticker, text, cls };
  }

  let worst = { ticker: '—', text: '', cls: '' };
  if (valid.length > 0) {
    const w = valid.reduce((a, b) => b.roi_pct < a.roi_pct ? b : a);
    const { text, cls } = fmtRoi(w.roi_pct);
    worst = { ticker: w.ticker, text, cls };
  }

  return { winRate, avg, best, worst };
}

/* ── Performance tab — benchmark comparison (vs SPY / vs sector ETF) ─ */

export function computeRoiPct(triggerPrice, currentPrice) {
  if (triggerPrice == null || currentPrice == null || triggerPrice === 0) return null;
  return (currentPrice - triggerPrice) / triggerPrice * 100;
}

// Average buy ROI, average benchmark ROI, and their delta — all computed
// over the same trigger-to-current window as each individual signal
// (a rolling per-row window, not one shared calendar range).
function computeBenchmarkGroup(history, triggerField, currentField) {
  const rows = (history ?? []).filter(r =>
    r.roi_pct != null && computeRoiPct(r[triggerField], r[currentField]) != null
  );
  if (rows.length === 0) return null;
  const avgPick      = rows.reduce((s, r) => s + r.roi_pct, 0) / rows.length;
  const avgBenchmark = rows.reduce((s, r) => s + computeRoiPct(r[triggerField], r[currentField]), 0) / rows.length;
  return {
    sampleSize:   rows.length,
    avgRoi:       fmtRoi(avgPick),
    avgBenchmark: fmtRoi(avgBenchmark),
    delta:        fmtRoi(avgPick - avgBenchmark),
  };
}

export function computeSpyBenchmarkGroup(history) {
  return computeBenchmarkGroup(history, 'spy_trigger_price', 'spy_current_price');
}

export function computeSectorBenchmarkGroup(history) {
  return computeBenchmarkGroup(history, 'sector_etf_trigger_price', 'sector_etf_current_price');
}

export function computeSpyDelta(history) {
  return computeSpyBenchmarkGroup(history)?.delta ?? null;
}

export function computeSectorDelta(history) {
  return computeSectorBenchmarkGroup(history)?.delta ?? null;
}

/* ── Benchmark tab — overall + per-sector three-box groups ───────── */

function renderBenchmarkGroupHTML(title, benchmarkLabel, group) {
  if (!group) return '';
  return `
    <div class="benchmark-group">
      <h3 class="benchmark-group-title">${escapeHtml(title)}</h3>
      <div class="stats-kpi-grid benchmark-kpi-grid">
        <div class="stats-kpi-card">
          <div class="stats-kpi-label">Avg Buy ROI</div>
          <div class="stats-kpi-value ${group.avgRoi.cls}">${group.avgRoi.text}</div>
          <div class="stats-kpi-sub">${group.sampleSize} signal${group.sampleSize === 1 ? '' : 's'}</div>
        </div>
        <div class="stats-kpi-card">
          <div class="stats-kpi-label">${escapeHtml(benchmarkLabel)}</div>
          <div class="stats-kpi-value ${group.avgBenchmark.cls}">${group.avgBenchmark.text}</div>
          <div class="stats-kpi-sub">same trigger-to-current window</div>
        </div>
        <div class="stats-kpi-card">
          <div class="stats-kpi-label">Delta</div>
          <div class="stats-kpi-value ${group.delta.cls}">${group.delta.text}</div>
          <div class="stats-kpi-sub">buy ROI minus benchmark</div>
        </div>
      </div>
    </div>`;
}

export function renderBenchmarkSectionHTML(history) {
  const rows = history ?? [];
  let html = renderBenchmarkGroupHTML('Overall — vs SPY', 'Avg SPY Return', computeSpyBenchmarkGroup(rows));

  const sectors = [...new Set(rows.map(r => r.sector).filter(Boolean))].sort();
  for (const sector of sectors) {
    const etf = getSectorEtf(sector);
    const sectorRows = rows.filter(r => r.sector === sector);
    html += renderBenchmarkGroupHTML(
      `${sector} — vs ${etf ?? 'Sector ETF'}`,
      `Avg ${etf ?? 'Sector'} Return`,
      computeSectorBenchmarkGroup(sectorRows)
    );
  }

  return html;
}

export function renderHistoryRowsHTML(history) {
  return history.map((row, i) => {
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

    const reportCell = row.report_url
      ? `<a href="${escapeHtml(row.report_url)}" target="_blank" rel="noopener noreferrer" class="report-link">View</a>`
      : '—';

    return `<tr>
      <td class="col-rank">${i + 1}</td>
      <td class="col-ticker">${escapeHtml(row.ticker)}</td>
      <td class="col-sector">${escapeHtml(row.sector) || '—'}</td>
      <td class="col-date">${fmtDate(row.recommended_at)}</td>
      <td class="col-entry">${fmtPrice(row.trigger_price)}</td>
      <td class="col-current">${fmtPrice(row.current_price)}</td>
      <td class="col-roi"><div class="roi-cell">${roiBadge}${barHtml}</div></td>
      <td class="col-version">${escapeHtml(row.prospectai_version) || '—'}</td>
      <td class="col-report">${reportCell}</td>
    </tr>`;
  }).join('');
}

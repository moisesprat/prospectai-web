/* ============================================================
   Pure stats.html pre-render — string in, string out.
   No DOM access, no network, no file I/O, so it is safe to
   import from scripts/build-static.mjs (Node) and from tests.

   Every opening-tag rewrite tolerates any current class list and
   attribute state, because the page committed by the 15-minute
   bot is already in a rendered state, not the pristine template.
   A regeneration must therefore be idempotent: a delta that is no
   longer available is hidden and emptied, a KPI whose sign flipped
   swaps its colour class, and the Benchmark empty state tracks
   whether any group rendered (SPEC-03).
   ============================================================ */

import {
  renderSectorBarListHTML,
  renderRiskDonutWrapHTML,
  renderDecisionsDonutPieces,
  applyDataRules,
  sortHistory,
  computeKpis,
  renderHistoryRowsHTML,
  computeSpyDelta,
  renderBenchmarkSectionHTML,
} from '../ui/statsRender.js';

export function replaceBetween(html, marker, content) {
  const re = new RegExp(`<!--SSR:${marker}-->[\\s\\S]*?<!--/SSR-->`);
  if (!re.test(html)) {
    throw new Error(`SSR marker "${marker}" not found`);
  }
  return html.replace(re, `<!--SSR:${marker}-->${content}<!--/SSR-->`);
}

// Rewrites the opening tag of a KPI value block to carry exactly one colour class.
function setKpiValueTag(html, id, cls) {
  const re = new RegExp(`<div class="stats-kpi-value[^"]*" id="${id}"[^>]*>`);
  const classes = ['stats-kpi-value', cls].filter(Boolean).join(' ');
  return html.replace(re, `<div class="${classes}" id="${id}" data-ssr="1">`);
}

export function prerenderStats(html, analytics, historyData) {
  if (analytics) {
    html = replaceBetween(html, 'total-analyses', (analytics.total ?? 0).toLocaleString());
    html = html.replace(
      '<div class="stats-card-value" id="total-analyses">',
      '<div class="stats-card-value" id="total-analyses" data-ssr="1">'
    );

    html = replaceBetween(html, 'sector-chart', renderSectorBarListHTML(analytics.by_sector));
    html = html.replace('<div id="sector-chart">', '<div id="sector-chart" data-ssr="1">');

    html = replaceBetween(html, 'risk-donut-wrap', renderRiskDonutWrapHTML(analytics.by_risk_profile));
    html = html.replace(
      '<div class="stats-risk-donut-wrap" id="risk-donut-wrap">',
      '<div class="stats-risk-donut-wrap" id="risk-donut-wrap" data-ssr="1">'
    );

    const actionBreakdown = analytics.action_breakdown ?? {};
    const { svgInner, centerHTML, legendHTML } = renderDecisionsDonutPieces(actionBreakdown, '__overall__');
    html = replaceBetween(html, 'donut-decisions', svgInner);
    html = replaceBetween(html, 'donut-decisions-center', centerHTML);
    html = replaceBetween(html, 'legend-decisions', legendHTML);
    html = html.replace(
      '<ul class="stats-legend" id="legend-decisions">',
      '<ul class="stats-legend" id="legend-decisions" data-ssr="1">'
    );
  }

  if (historyData) {
    const cleaned = applyDataRules(historyData.history ?? []);
    const sorted  = sortHistory(cleaned, 'roi', 'desc');
    const kpis    = computeKpis(cleaned);

    html = replaceBetween(html, 'kpi-win-rate-val', kpis.winRate);
    html = setKpiValueTag(html, 'kpi-win-rate-val', '');

    html = replaceBetween(html, 'kpi-avg-return-val', kpis.avg.text);
    html = setKpiValueTag(html, 'kpi-avg-return-val', kpis.avg.cls);

    html = replaceBetween(html, 'kpi-best-pick-val', kpis.best.ticker);
    html = setKpiValueTag(html, 'kpi-best-pick-val', kpis.best.cls);
    html = replaceBetween(html, 'kpi-best-pick-sub', kpis.best.text || 'highest ROI pick');

    html = replaceBetween(html, 'kpi-worst-pick-val', kpis.worst.ticker);
    html = setKpiValueTag(html, 'kpi-worst-pick-val', kpis.worst.cls);
    html = replaceBetween(html, 'kpi-worst-pick-sub', kpis.worst.text || 'lowest ROI pick');

    html = replaceBetween(html, 'history-tbody', renderHistoryRowsHTML(sorted));
    html = html.replace('<tbody id="history-tbody">', '<tbody id="history-tbody" data-ssr="1">');

    const spyDelta = computeSpyDelta(cleaned);
    const deltaWrapRe = /<div class="stats-kpi-delta" id="kpi-avg-return-delta"[^>]*>/;
    const deltaValRe  = /<span class="stats-kpi-delta-val[^"]*" id="kpi-avg-return-delta-val"[^>]*>/;
    if (spyDelta != null) {
      html = replaceBetween(html, 'kpi-avg-return-delta-val', spyDelta.text);
      html = html.replace(
        deltaValRe,
        `<span class="stats-kpi-delta-val ${spyDelta.cls}" id="kpi-avg-return-delta-val" data-ssr="1">`
      );
      html = replaceBetween(html, 'kpi-avg-return-delta-label', 'vs SPY');
      html = html.replace(
        deltaWrapRe,
        '<div class="stats-kpi-delta" id="kpi-avg-return-delta" data-ssr="1">'
      );
    } else {
      // No benchmark data: a previously committed delta must not survive.
      html = replaceBetween(html, 'kpi-avg-return-delta-val', '');
      html = html.replace(
        deltaValRe,
        '<span class="stats-kpi-delta-val" id="kpi-avg-return-delta-val" data-ssr="1">'
      );
      html = html.replace(
        deltaWrapRe,
        '<div class="stats-kpi-delta" id="kpi-avg-return-delta" hidden>'
      );
    }

    const benchmarkHtml = renderBenchmarkSectionHTML(cleaned);
    html = replaceBetween(html, 'benchmark-groups', benchmarkHtml);
    html = html.replace(
      /<div class="stats-empty" id="benchmark-empty"[^>]*>/,
      benchmarkHtml === ''
        ? '<div class="stats-empty" id="benchmark-empty">'
        : '<div class="stats-empty" id="benchmark-empty" hidden>'
    );

    html = replaceBetween(
      html,
      'perf-row-count',
      sorted.length > 0
        ? ` · ${sorted.length} signals · entries within 5 days and duplicates excluded`
        : ' · 0 signals · entries within 5 days and duplicates excluded'
    );

    if (sorted.length > 0) {
      html = html.replace(
        '<div class="stats-loading" id="history-loading">',
        '<div class="stats-loading" id="history-loading" hidden>'
      );
      html = html.replace(
        '<table class="stats-table" id="history-table" hidden>',
        '<table class="stats-table" id="history-table">'
      );
      html = html.replace(
        '<p class="stats-disclaimer" id="perf-disclaimer" hidden>',
        '<p class="stats-disclaimer" id="perf-disclaimer">'
      );
    }
  }

  return html;
}

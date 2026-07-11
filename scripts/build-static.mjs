#!/usr/bin/env node
/* ============================================================
   Regenerates sitemap.xml and pre-renders the primary content
   of stats.html / reports.html from live backend data, writing
   the results in place at the repo root.

   Run via `npm run generate`. Triggered by
   .github/workflows/generate-sitemap.yml on push and on a
   schedule, so content stays fresh even without a code change.

   Safe to run repeatedly: if the backend is unreachable, each
   affected file is left untouched rather than being overwritten
   with empty content.
   ============================================================ */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  renderSectorBarListHTML,
  renderRiskDonutWrapHTML,
  renderDecisionsDonutPieces,
  applyDataRules,
  sortHistory,
  computeKpis,
  renderHistoryRowsHTML,
} from '../ui/statsRender.js';
import { renderReportsGridHTML } from '../ui/reportsRender.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

const MODAL_URL  = 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';
const SITE_ORIGIN = 'https://prospect-ai.moisesprat.dev';
const MAX_SITEMAP_REPORTS = 200;

async function fetchJSON(path) {
  try {
    const res = await fetch(`${MODAL_URL}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function replaceBetween(html, marker, content) {
  const re = new RegExp(`<!--SSR:${marker}-->[\\s\\S]*?<!--/SSR-->`);
  if (!re.test(html)) {
    throw new Error(`SSR marker "${marker}" not found`);
  }
  return html.replace(re, `<!--SSR:${marker}-->${content}<!--/SSR-->`);
}

/* ── sitemap.xml ─────────────────────────────────────────────── */

async function generateSitemap(reports) {
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = [
    { loc: `${SITE_ORIGIN}/`, lastmod: today },
    { loc: `${SITE_ORIGIN}/stats.html`, lastmod: today },
    { loc: `${SITE_ORIGIN}/reports.html`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture.html`, lastmod: today },
  ];

  const reportUrls = (reports ?? [])
    .slice(0, MAX_SITEMAP_REPORTS)
    .map(r => ({
      loc: `${SITE_ORIGIN}/report.html?id=${r.run_id}`,
      lastmod: (r.run_at ?? today).slice(0, 10),
    }));

  const urls = [...staticUrls, ...reportUrls]
    .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');
}

/* ── stats.html ──────────────────────────────────────────────── */

async function generateStats(analytics, historyData) {
  const path = join(ROOT, 'stats.html');
  let html = await readFile(path, 'utf8');

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
    html = html.replace(
      '<div class="stats-kpi-value" id="kpi-win-rate-val">',
      '<div class="stats-kpi-value" id="kpi-win-rate-val" data-ssr="1">'
    );

    html = replaceBetween(html, 'kpi-avg-return-val', kpis.avg.text);
    html = html.replace(
      '<div class="stats-kpi-value" id="kpi-avg-return-val">',
      `<div class="stats-kpi-value ${kpis.avg.cls}" id="kpi-avg-return-val" data-ssr="1">`
    );

    html = replaceBetween(html, 'kpi-best-pick-val', kpis.best.ticker);
    html = html.replace(
      '<div class="stats-kpi-value" id="kpi-best-pick-val">',
      `<div class="stats-kpi-value ${kpis.best.cls}" id="kpi-best-pick-val" data-ssr="1">`
    );
    html = replaceBetween(html, 'kpi-best-pick-sub', kpis.best.text || 'highest ROI pick');

    html = replaceBetween(html, 'kpi-worst-pick-val', kpis.worst.ticker);
    html = html.replace(
      '<div class="stats-kpi-value" id="kpi-worst-pick-val">',
      `<div class="stats-kpi-value ${kpis.worst.cls}" id="kpi-worst-pick-val" data-ssr="1">`
    );
    html = replaceBetween(html, 'kpi-worst-pick-sub', kpis.worst.text || 'lowest ROI pick');

    html = replaceBetween(html, 'history-tbody', renderHistoryRowsHTML(sorted));
    html = html.replace('<tbody id="history-tbody">', '<tbody id="history-tbody" data-ssr="1">');

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

  await writeFile(path, html, 'utf8');
}

/* ── reports.html ────────────────────────────────────────────── */

async function generateReports(reports) {
  const path = join(ROOT, 'reports.html');
  let html = await readFile(path, 'utf8');

  if (!reports) {
    await writeFile(path, html, 'utf8');
    return;
  }

  if (reports.length === 0) {
    await writeFile(path, html, 'utf8');
    return;
  }

  html = replaceBetween(html, 'reports-grid', renderReportsGridHTML(reports, SITE_ORIGIN));
  html = html.replace(
    '<div id="reports-grid" hidden>',
    '<div id="reports-grid" data-ssr="1">'
  );
  html = html.replace(
    '<div id="reports-loading">',
    '<div id="reports-loading" hidden>'
  );

  await writeFile(path, html, 'utf8');
}

/* ── main ────────────────────────────────────────────────────── */

async function main() {
  const [analytics, historyData, reports] = await Promise.all([
    fetchJSON('/api/analytics'),
    fetchJSON('/api/long-buy-history'),
    fetchJSON('/api/reports'),
  ]);

  await generateSitemap(reports);
  await generateStats(analytics, historyData);
  await generateReports(reports);

  console.log('build-static: done', {
    analytics: !!analytics,
    history: !!historyData,
    reports: reports ? reports.length : 'unreachable',
  });
}

main();

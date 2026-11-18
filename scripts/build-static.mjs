#!/usr/bin/env node
/* ============================================================
   Regenerates sitemap.xml and pre-renders the primary content
   of stats.html / reports.html from live backend data, writing
   the results in place at the repo root.

   The stats.html transform itself lives in the pure module
   scripts/statsPrerender.mjs (prerenderStats), so tests can
   exercise it without any network or file writes.

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

import { replaceBetween, prerenderStats } from './statsPrerender.mjs';
import { renderReportsGridHTML } from '../ui/reportsRender.js';
import { parsePypiReleaseNotes, renderReleaseNotesHTML } from '../ui/changelogRender.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

const MODAL_URL  = 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';
const SITE_ORIGIN = 'https://prospect-ai.moisesprat.dev';
const MAX_SITEMAP_REPORTS = 200;
const PYPI_PROJECT_JSON_URL = 'https://pypi.org/pypi/prospectai/json';

async function fetchJSON(path) {
  try {
    const res = await fetch(`${MODAL_URL}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPypiProjectJSON() {
  try {
    const res = await fetch(PYPI_PROJECT_JSON_URL);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── sitemap.xml ─────────────────────────────────────────────── */

async function generateSitemap(reports) {
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = [
    { loc: `${SITE_ORIGIN}/`, lastmod: today },
    { loc: `${SITE_ORIGIN}/stats.html`, lastmod: today },
    { loc: `${SITE_ORIGIN}/reports.html`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture.html`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture/patterns/`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture/patterns/adversarial-critic`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture/patterns/parallel-execution`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture/patterns/output-validation`, lastmod: today },
    { loc: `${SITE_ORIGIN}/architecture/patterns/model-tiering`, lastmod: today },
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
  const html = await readFile(path, 'utf8');
  await writeFile(path, prerenderStats(html, analytics, historyData), 'utf8');
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

/* ── changelog.html ──────────────────────────────────────────── */

async function generateChangelog(pypiData) {
  const path = join(ROOT, 'changelog.html');
  let html = await readFile(path, 'utf8');

  const items = parsePypiReleaseNotes(pypiData?.info?.description, pypiData?.releases);
  if (items.length === 0) {
    await writeFile(path, html, 'utf8');
    return;
  }

  html = replaceBetween(html, 'pypi-releases', renderReleaseNotesHTML(items));
  await writeFile(path, html, 'utf8');
}

/* ── main ────────────────────────────────────────────────────── */

async function main() {
  const [analytics, historyData, reports, pypiData] = await Promise.all([
    fetchJSON('/api/analytics'),
    fetchJSON('/api/long-buy-history'),
    fetchJSON('/api/reports'),
    fetchPypiProjectJSON(),
  ]);

  await generateSitemap(reports);
  await generateStats(analytics, historyData);
  await generateReports(reports);
  await generateChangelog(pypiData);

  console.log('build-static: done', {
    analytics: !!analytics,
    history: !!historyData,
    reports: reports ? reports.length : 'unreachable',
    pypiReleases: !!pypiData,
  });
}

main();

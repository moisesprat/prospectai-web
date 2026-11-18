/* ============================================================
   SITE NAV AND REDIRECT CONTRACT TEST  (Node-only, read-only, static)
   Phase 5 SPEC-04 (UI-SPEC S3): every tracked HTML page carries one
   site nav with the five links Home, Stats, Reports, Architecture,
   Changelog in that order, exactly one Architecture entry and no
   Patterns link; _redirects holds the five legacy /patterns/ 301
   rules; nav.js marks Architecture active on architecture paths.
   Reads files only; no DOM access, no network. Run: npm test
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FALLBACK_PAGES = [
  'index.html', 'stats.html', 'reports.html', 'report.html', 'architecture.html', 'changelog.html',
  'architecture/patterns/index.html', 'architecture/patterns/adversarial-critic.html',
  'architecture/patterns/parallel-execution.html', 'architecture/patterns/output-validation.html',
  'architecture/patterns/model-tiering.html',
];

const EXPECTED_PAGES = ['home', 'stats', 'reports', 'architecture', 'changelog'];
const EXPECTED_LABELS = ['Home', 'Stats', 'Reports', 'Architecture', 'Changelog'];
const SLUGS = ['', 'adversarial-critic', 'parallel-execution', 'output-validation', 'model-tiering'];

// A new page is covered automatically when it is tracked.
function pages() {
  try {
    const out = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean);
    return out.length ? out : FALLBACK_PAGES;
  } catch {
    return FALLBACK_PAGES;
  }
}

test('every tracked page has one site nav with the five links in order', () => {
  const offenders = [];
  for (const page of pages()) {
    const html = readFileSync(join(ROOT, page), 'utf8');
    const navCount = html.split('<nav class="site-nav"').length - 1;
    if (navCount !== 1) { offenders.push(`${page}: ${navCount} site navs`); continue; }
    const block = /<nav class="site-nav"[\s\S]*?<\/nav>/.exec(html)[0];
    const links = [...block.matchAll(/<a\b[^>]*data-navpage="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    const keys = links.map((m) => m[1]);
    const labels = links.map((m) => m[2].trim());
    if (JSON.stringify(keys) !== JSON.stringify(EXPECTED_PAGES)) offenders.push(`${page}: navpage ${keys}`);
    if (JSON.stringify(labels) !== JSON.stringify(EXPECTED_LABELS)) offenders.push(`${page}: labels ${labels}`);
    if (keys.filter((k) => k === 'architecture').length !== 1) offenders.push(`${page}: architecture link count`);
    if (labels.includes('Patterns')) offenders.push(`${page}: Patterns link`);
  }
  assert.deepEqual(offenders, []);
});

test('the page list covers the eleven known pages', () => {
  const listed = pages();
  for (const p of FALLBACK_PAGES) assert.ok(listed.includes(p), `${p} is checked`);
});

test('_redirects holds exactly the five legacy /patterns/ 301 rules', () => {
  const lines = readFileSync(join(ROOT, '_redirects'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  const expected = SLUGS.map((s) => ({ from: `/patterns/${s}`, to: `/architecture/patterns/${s}`, status: '301' }));
  const actual = lines.map((l) => {
    const [from, to, status] = l.split(/\s+/);
    return { from, to, status };
  });
  assert.deepEqual(actual, expected);
});

test('nav.js marks Architecture active on every path containing architecture', () => {
  const src = readFileSync(join(ROOT, 'ui', 'nav.js'), 'utf8');
  assert.match(src, /path\.includes\('architecture'\)\s*\?\s*'architecture'/);
});

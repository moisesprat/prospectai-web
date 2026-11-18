/* ============================================================
   STATS PRE-RENDER TEST  (Node-only, node:test)
   Phase 5 SPEC-03: regenerating stats.html from history rows with
   no benchmark data hides the SPY delta and shows the empty state;
   a sign flip moves the KPI colour class; a second pass is stable.
   Run: npm test
   Imports only the pure scripts/statsPrerender.mjs (never
   build-static.mjs, which fetches live data and writes pages).
   stats.html is read, never written.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { prerenderStats } from '../scripts/statsPrerender.mjs';
import { computeSpyDelta, applyDataRules } from '../ui/statsRender.js';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(join(here, '..', 'stats.html'), 'utf8');

// Dates sit in early 2026 so the 5-day recent-row cut never drops them.
const row = (ticker, roi, extra = {}) => ({
  ticker,
  sector: 'Technology',
  recommended_at: '2026-01-05T00:00:00Z',
  trigger_price: 100,
  current_price: 100 + roi,
  roi_pct: roi,
  ...extra,
});

const BENCH = {
  spy_trigger_price: 100, spy_current_price: 101,
  sector_etf_trigger_price: 50, sector_etf_current_price: 51,
};

const withBenchmark = {
  history: [row('AAA', 10, BENCH), row('BBB', 6, { ...BENCH, recommended_at: '2026-01-06T00:00:00Z' })],
};
const withoutBenchmark = {
  history: [row('CCC', 8), row('DDD', 4, { recommended_at: '2026-01-06T00:00:00Z' })],
};
const negative = {
  history: [row('EEE', -8, BENCH), row('FFF', -4, { ...BENCH, recommended_at: '2026-01-06T00:00:00Z' })],
};

const tag = (html, id) => {
  const m = html.match(new RegExp(`<(?:div|span)[^>]*id="${id}"[^>]*>`));
  assert.ok(m, `opening tag for #${id} present`);
  return m[0];
};

const region = (html, marker) => {
  const m = html.match(new RegExp(`<!--SSR:${marker}-->([\\s\\S]*?)<!--/SSR-->`));
  assert.ok(m, `SSR region ${marker} present`);
  return m[1];
};

test('benchmark rows: delta shown, group rendered, empty state hidden', () => {
  const out = prerenderStats(TEMPLATE, null, withBenchmark);
  const cleaned = applyDataRules(withBenchmark.history);
  const delta = computeSpyDelta(cleaned);
  assert.ok(delta, 'fixture yields a SPY delta');

  assert.equal(
    tag(out, 'kpi-avg-return-delta'),
    '<div class="stats-kpi-delta" id="kpi-avg-return-delta" data-ssr="1">',
  );
  assert.equal(region(out, 'kpi-avg-return-delta-val'), delta.text);
  assert.ok(out.includes('<div class="benchmark-group">'), 'a benchmark group renders');
  assert.ok(out.includes('Technology — vs XLK'), 'sector group is titled with its ETF');
});

test('benchmark rows: #benchmark-empty carries hidden', () => {
  const out = prerenderStats(TEMPLATE, null, withBenchmark);
  assert.match(tag(out, 'benchmark-empty'), /\bhidden\b/);
});

test('no benchmark fields: delta hidden and emptied, no group, empty state shown', () => {
  const out = prerenderStats(TEMPLATE, null, withoutBenchmark);
  assert.match(tag(out, 'kpi-avg-return-delta'), /\bhidden\b/);
  assert.equal(region(out, 'kpi-avg-return-delta-val'), '');
  assert.equal(
    tag(out, 'kpi-avg-return-delta-val'),
    '<span class="stats-kpi-delta-val" id="kpi-avg-return-delta-val" data-ssr="1">',
  );
  assert.equal(region(out, 'benchmark-groups'), '');
  assert.ok(!out.includes('<div class="benchmark-group">'), 'no benchmark-group markup anywhere');
  assert.ok(!/\bhidden\b/.test(tag(out, 'benchmark-empty')), 'empty state is shown');
});

test('sign flip moves the KPI class and the pre-render is idempotent', () => {
  const pos = prerenderStats(TEMPLATE, null, withBenchmark);
  assert.match(tag(pos, 'kpi-avg-return-val'), /stats-kpi-value--pos/);

  const neg = prerenderStats(pos, null, negative);
  const t = tag(neg, 'kpi-avg-return-val');
  assert.match(t, /stats-kpi-value--neg/);
  assert.ok(!/stats-kpi-value--pos/.test(t), 'the stale pos class is gone');
  assert.equal((t.match(/stats-kpi-value--(pos|neg)/g) || []).length, 1, 'exactly one ROI class');

  // best / worst swap too
  assert.match(tag(neg, 'kpi-best-pick-val'), /stats-kpi-value--neg/);
  assert.ok(!/--pos/.test(tag(neg, 'kpi-best-pick-val')));
  assert.ok(!/--pos/.test(tag(neg, 'kpi-win-rate-val')));

  assert.equal(prerenderStats(neg, null, negative), neg, 'same input twice is stable');
});

test('toggling with and without benchmark data flips both hidden attributes', () => {
  const a = prerenderStats(TEMPLATE, null, withBenchmark);
  const b = prerenderStats(a, null, withoutBenchmark);
  assert.match(tag(b, 'kpi-avg-return-delta'), /\bhidden\b/);
  assert.ok(!/\bhidden\b/.test(tag(b, 'benchmark-empty')));
  assert.equal(region(b, 'benchmark-groups'), '');

  const c = prerenderStats(b, null, withBenchmark);
  assert.ok(!/\bhidden\b/.test(tag(c, 'kpi-avg-return-delta')));
  assert.match(tag(c, 'benchmark-empty'), /\bhidden\b/);
  assert.ok(c.includes('<div class="benchmark-group">'));
});

test('historyData null leaves the page untouched', () => {
  assert.equal(prerenderStats(TEMPLATE, null, null), TEMPLATE);
});

test('a sector with no mapped ETF renders no benchmark group', () => {
  const out = prerenderStats(TEMPLATE, null, {
    history: [row('GGG', 5, { ...BENCH, sector: 'Basket Weaving' })],
  });
  assert.ok(out.includes('Overall — vs SPY'), 'overall group still renders');
  assert.ok(!out.includes('Basket Weaving — vs'), 'no group for the unmapped sector');
  assert.ok(!out.includes('vs Sector ETF'), 'no placeholder title');
});

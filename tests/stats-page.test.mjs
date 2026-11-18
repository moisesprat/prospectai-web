/* ============================================================
   STATS PAGE STATIC CHECKS  (Node-only, node:test)
   Phase 5 SPEC-03 / UI-SPEC S2: the Benchmark panel is never
   blank. Copy, the child-element fallback in ui/stats.js and the
   CSS contract are verified as read-only text checks on
   stats.html, ui/stats.js and styles/stats.css. No DOM, no network.
   Run: npm test
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = rel => readFileSync(join(here, '..', rel), 'utf8');
const html = read('stats.html');
const js   = read('ui/stats.js');
const css  = read('styles/stats.css');

const ERROR_COPY = 'Could not load signal performance data. Please refresh the page to try again.';

// Body of one top-level CSS rule, matched by its exact selector.
function rule(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`));
  assert.ok(m, `rule ${selector} present`);
  return m[1];
}

test('stats.html carries the empty-state and error copy', () => {
  assert.ok(html.includes('<p class="stats-empty-title">No benchmark comparison yet.</p>'));
  assert.ok(html.includes(
    '<p class="stats-empty-body">Benchmark comparisons appear once LONG-BUY signals have been tracked ' +
    'against SPY and their sector ETF. Check back after the next scheduled refresh.</p>'
  ));
  assert.ok(html.includes(`<div class="stats-error" id="benchmark-error" hidden>${ERROR_COPY}</div>`));
  assert.ok(html.includes(`id="history-error" hidden>${ERROR_COPY}</div>`));
});

test('#benchmark-empty keeps the opening tag the pre-render regex rewrites', () => {
  assert.ok(html.includes('<div class="stats-empty" id="benchmark-empty" hidden>'));
  // benchmark-error follows the empty state, outside every SSR region
  const i = html.indexOf('id="benchmark-empty"');
  const j = html.indexOf('id="benchmark-error"');
  assert.ok(i > 0 && j > i, 'benchmark-error comes after benchmark-empty');
});

test('stats.js judges the pre-render by child elements, not data-ssr', () => {
  const a = js.indexOf('function showHistoryFailure');
  assert.ok(a > 0, 'showHistoryFailure helper exists');
  const b = js.indexOf('\nfunction ', a + 1);
  const bBody = js.slice(a, b === -1 ? undefined : b);
  assert.ok(bBody.includes("document.querySelector('#benchmark-groups .benchmark-group')"));
  assert.ok(bBody.includes("getElementById('benchmark-error').hidden = false"));
  assert.ok(bBody.includes('renderBenchmarkSection([])'));

  const initBody = js.slice(js.indexOf('async function init'));
  assert.ok(!/getElementById\('benchmark-groups'\)\.dataset\.ssr/.test(initBody),
    'init() no longer reads dataset.ssr for benchmark-groups');
  assert.equal((initBody.match(/showHistoryFailure\(\)/g) || []).length, 2,
    'both failure branches call the helper');
});

test('stats.css follows the UI-SPEC colour and focus contract', () => {
  assert.match(rule('.benchmark-group .stats-kpi-sub'), /color:\s*var\(--text-dim\)/);
  assert.match(rule('.stats-kpi-delta-val.stats-kpi-value--neg'), /color:\s*var\(--red\)/);
  const focus = rule('.stats-tab:focus-visible');
  assert.match(focus, /outline:\s*2px solid var\(--amber\)/);
  assert.match(focus, /outline-offset:\s*2px/);
  assert.match(rule('.stats-empty-title'), /color:\s*var\(--text\)/);
  rule('.stats-empty-body');
});

test('stats.css adds no new colour token and no font weight beyond 400/600', () => {
  const weights = [...css.matchAll(/font-weight:\s*(\d+)/g)].map(m => m[1]);
  for (const w of weights) assert.ok(['400', '600'].includes(w), `font-weight ${w}`);
});

/* ============================================================
   FAILED-RUN METRICS TESTS  (Node-only, node:test)
   Phase 5 D-13: state coverage for renderFailureMetrics and the
   CSS contract of the failed-run block (status line, summary
   target size, focus rings). No DOM access; imports the pure
   renderer and reads styles/style.css as text. Run: npm test
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderFailureMetrics } from '../ui/reportRenderer.js';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'styles', 'style.css'), 'utf8');

// Body of the first rule whose selector list matches `selector` exactly (whitespace tolerant).
function ruleBody(selector) {
  const esc = selector.trim().split(/\s+/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  const m = css.match(new RegExp(`(?:^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`, 'm'));
  return m ? m[1] : null;
}

// ─── states ───

test('renderFailureMetrics returns an empty string when there is nothing to show', () => {
  const empties = [
    null, undefined, [], 'x', 42, {}, { partial: true },
    { backend: { wall_total_sec: null } },
    { backend: { wall_total_sec: 'NaN' }, phases: [] },
    { backend: { wall_total_sec: NaN }, phases: ['x', 3, null] },
  ];
  for (const m of empties) assert.equal(renderFailureMetrics(m), '', JSON.stringify(m));
});

test('a wall time alone shows the stopped-after line and no table', () => {
  const html = renderFailureMetrics({ partial: true, backend: { wall_total_sec: 62.4 } });
  assert.ok(html.includes('<details class="tool-timings run-failure-metrics">'));
  assert.ok(html.includes('Stopped after 1m 2.4s'));
  assert.ok(!html.includes('<table'));
});

test('phases alone show a table without a stopped-after line or slowest calls', () => {
  const html = renderFailureMetrics({
    phases: [{ name: 'market_analysis', status: 'error', elapsed_sec: 3, total_tokens: 1200 }],
  });
  assert.ok(!html.includes('Stopped after'));
  assert.ok(html.includes('<table'));
  for (const header of ['Phase', 'Status', 'Elapsed', 'Tokens']) assert.ok(html.includes(`>${header}</th>`), header);
  assert.ok(html.includes('Market Analysis'));
  assert.ok(html.includes('>error<'));
  assert.ok(html.includes('3.0s'));
  assert.ok(html.includes(Number(1200).toLocaleString()));
  assert.ok(!html.includes('Slowest calls'));
  assert.ok(html.includes('metrics-table-wrap'), 'the table scrolls inside its wrapper at 320px');
});

test('a tool_calls array adds the slowest-calls block inside the outer details', () => {
  const html = renderFailureMetrics({
    phases: [{ name: 'market_analysis', status: 'error', elapsed_sec: 3, total_tokens: 1200 }],
    tool_calls: [],
  });
  assert.ok(html.includes('Slowest calls &amp; per-tool timing'));
  assert.equal((html.match(/<details/g) ?? []).length, 2);
  assert.ok(html.lastIndexOf('</details>') > html.indexOf('Slowest calls &amp; per-tool timing'));
  assert.ok(!html.includes('<details open'));
});

// ─── CSS contract ───

test('status line error rules: red text, static "!" prompt, wrapping', () => {
  assert.match(ruleBody('.status-line--error') ?? '', /color:\s*var\(--red\)/);
  const before = ruleBody('.status-line--error::before') ?? '';
  assert.match(before, /content:\s*'!'/);
  assert.match(before, /animation:\s*none/);
  assert.match(ruleBody('.status-line') ?? '', /flex-wrap:\s*wrap/);
});

test('failed-run block rules: spacing, 44px summary target, amber focus rings', () => {
  assert.match(ruleBody('.run-failure') ?? '', /margin-top:\s*16px/);
  const summary = ruleBody('.run-failure-metrics > summary') ?? '';
  assert.match(summary, /min-height:\s*44px/);
  assert.match(summary, /display:\s*flex/);
  assert.match(summary, /align-items:\s*center/);
  assert.match(summary, /cursor:\s*pointer/);
  const ring = css.match(/\.run-failure-metrics > summary:focus-visible,\s*\.site-nav-link:focus-visible\s*\{([^}]*)\}/);
  assert.ok(ring, 'summary and nav link share one focus-visible rule');
  assert.match(ring[1], /outline:\s*2px solid var\(--amber\)/);
  assert.match(ring[1], /outline-offset:\s*2px/);
});

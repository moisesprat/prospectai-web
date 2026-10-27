/* ============================================================
   METRICS RENDER CHECK  (Node-only)
   Asserts renderMetrics() output for a v2 payload, an old
   payload and a hostile payload. Stand-in for a web test
   runner until Phase 3 (TEST-02). Run: node scripts/check-metrics-render.mjs
   No DOM access; imports the pure-string renderer directly.
   ============================================================ */

import assert from 'node:assert/strict';
import { renderMetrics } from '../ui/reportRenderer.js';

const baseTotals = { input_tokens: 100, output_tokens: 50, cached_tokens: 10, total_tokens: 160 };

// (a) v2 payload: collapsed block, slowest names, wall total.
const v2 = {
  pipeline_elapsed_sec: 120.5,
  totals: baseTotals,
  by_model: {},
  metrics_version: 2,
  unattributed_sec: 1.2,
  slowest_phase: { name: 'fundamental_analysis', elapsed_sec: 70.1 },
  slowest_tool_call: { phase: 'fundamental_analysis', tool: 'FundamentalDataTool', elapsed_sec: 33.3, ok: true },
  backend: { setup_sec: 0.5, persist_sec: 0.4, wall_total_sec: 125.7, unattributed_sec: 4.2 },
  phases: [
    {
      name: 'market_analysis', status: 'completed', elapsed_sec: 20, input_tokens: 1, output_tokens: 1,
      cached_tokens: 0, total_tokens: 2, tool_call_count: 1, tool_total_sec: 5, tool_wall_sec: 5, llm_overhead_sec: 15,
      tools: [{ tool: 'PatientSerperTool', count: 1, total_sec: 5, max_sec: 5, error_count: 0, output_chars_total: 10 }],
    },
    {
      name: 'fundamental_analysis', status: 'completed', elapsed_sec: 70.1, input_tokens: 1, output_tokens: 1,
      cached_tokens: 0, total_tokens: 2, tool_call_count: 1, tool_total_sec: 33.3, tool_wall_sec: 33.3, llm_overhead_sec: 36.8,
      tools: [{ tool: 'FundamentalDataTool', count: 1, total_sec: 33.3, max_sec: 33.3, error_count: 0, output_chars_total: 99 }],
    },
  ],
  tool_calls: [
    { phase: 'market_analysis', tool: 'PatientSerperTool', start_offset_sec: 1, elapsed_sec: 5, ok: true, error: null, output_chars: 10 },
    { phase: 'fundamental_analysis', tool: 'FundamentalDataTool', start_offset_sec: 22, elapsed_sec: 33.3, ok: true, error: null, output_chars: 99 },
  ],
};
const htmlV2 = renderMetrics(v2);
assert.ok(htmlV2.includes('<details class="tool-timings">'), 'details present and collapsed (no open attribute)');
assert.ok(!/<details[^>]*\sopen/.test(htmlV2), 'details must not carry open');
assert.ok(htmlV2.includes('Slowest tool call'), 'slowest tool call label');
assert.ok(htmlV2.includes('FundamentalDataTool'), 'slowest tool name');
assert.ok(htmlV2.includes('Wall total: 2m 5.7s'), 'formatted backend wall total');
assert.ok(htmlV2.includes('Phase Breakdown'), 'existing section kept');

// Null timing renders the em-dash, never 0.
const nullPhase = renderMetrics({
  ...v2,
  phases: [{ name: 'critique_review', status: 'not_started', elapsed_sec: null, tool_call_count: 0,
    tool_total_sec: null, tool_wall_sec: null, llm_overhead_sec: null, tools: [] }],
});
const nullRow = nullPhase.slice(nullPhase.indexOf('Critic Review'));
assert.ok(/Critic Review<\/td>\s*<td class="mt-num">not_started<\/td>\s*<td class="mt-num">—<\/td>\s*<td class="mt-num">—<\/td>\s*<td class="mt-num">—<\/td>/.test(nullRow),
  'null tool_wall_sec renders as em-dash');

// (b) old payload: no new block, old sections intact.
const old = {
  pipeline_elapsed_sec: 90,
  totals: baseTotals,
  by_model: {},
  phases: [{ name: 'market_analysis', elapsed_sec: 10, input_tokens: 1, output_tokens: 1, cached_tokens: 0, total_tokens: 2 }],
};
const htmlOld = renderMetrics(old);
assert.ok(!htmlOld.includes('tool-timings'), 'old payload has no timing block');
assert.ok(htmlOld.includes('Phase Breakdown'), 'old payload keeps Phase Breakdown');

// (c) hostile payload: markup in backend strings is escaped.
const hostile = {
  ...v2,
  slowest_tool_call: { phase: 'market_analysis', tool: '<img src=x onerror=alert(1)>', elapsed_sec: 9, ok: false },
  phases: [{
    name: 'market_analysis', status: 'completed', elapsed_sec: 9, tool_call_count: 1, tool_total_sec: 9, tool_wall_sec: 9,
    llm_overhead_sec: 0, tools: [{ tool: '<img src=x onerror=alert(1)>', count: 1, total_sec: 9, max_sec: 9, error_count: 1 }],
  }],
  tool_calls: [{ phase: 'market_analysis', tool: '<img src=x onerror=alert(1)>', start_offset_sec: 0, elapsed_sec: 9, ok: false, error: '<script>', output_chars: null }],
};
const htmlHostile = renderMetrics(hostile);
assert.ok(htmlHostile.includes('&lt;img src=x onerror=alert(1)&gt;'), 'tool name escaped');
assert.ok(!htmlHostile.includes('<img src=x'), 'no raw img tag');
assert.ok(htmlHostile.includes('&lt;script&gt;'), 'error class escaped');
assert.ok(!htmlHostile.includes('<script>'), 'no raw script tag');

console.log('metrics render OK');

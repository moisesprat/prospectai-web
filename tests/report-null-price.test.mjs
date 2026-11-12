/* ============================================================
   REPORT NULL-PRICE TEST  (Node-only, node:test)
   Phase 4 CORR-05 (D-02): a position the engine downgraded to
   MONITOR for a missing price is published with current_price
   null. The report must show a dash, never a zero price.
   Run: npm test
   No DOM access; imports the pure-string renderer directly.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../ui/reportRenderer.js';

// The exact sentence the engine appends to the rationale (utils/strategy_assembly.py).
const PRICE_SENTENCE =
  ' Action set to MONITOR by policy: price unavailable (no current price): only MONITOR or AVOID are allowed.';

function report(price) {
  return renderReport({
    risk_level: 'Low',
    overall_strategy: 'Hold cash until the price feed is back.',
    positions: [{
      ticker: 'AAA', action: 'MONITOR', current_price: price,
      allocation_pct: 0, trade_setup: null,
      rationale: `AAA looks strong on momentum.${PRICE_SENTENCE}`,
      monitoring_triggers: ['AAA RSI above 75'], review_frequency: 'WEEKLY',
    }],
  });
}

test('a null current_price renders as a dash, with the price-unavailable rationale', () => {
  const html = report(null);
  assert.ok(html.includes('price unavailable'), 'rationale is shown');
  for (const bad of ['$0.00', 'NaN', 'null', 'undefined']) {
    assert.ok(!html.includes(bad), `output must not contain ${bad}`);
  }
});

test('a real current_price still renders as dollars (control)', () => {
  assert.ok(report(123.45).includes('$123.45'));
});

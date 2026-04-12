/* ============================================================
   REPORT RENDERER  (ProspectAI v1.3.x schema)
   Converts the pipeline_done JSON payload from the backend
   into the HTML string that report.show() injects into
   .report-body. All values are HTML-escaped before insertion.

   Expected data shape (InvestorStrategicOutput):
   {
     sector: string,
     positions: [{
       ticker, action, allocation_pct,
       current_price?,
       trade_setup?: { direction, entry_zone_low, entry_zone_high, stop_loss, take_profit },
       scaled_entry_setups?: [immediate_tranche, pullback_tranche],
       rationale, monitoring_triggers: string[], review_frequency
     }],
     deployed_pct, reserved_pct, total_allocated_pct, cash_reserve_pct,
     overall_strategy, risk_level
   }
   ============================================================ */

const DISCLAIMER = `
  <div class="disclaimer-box">
    <p><strong>DISCLAIMER:</strong> This report was generated autonomously by an AI
    multi-agent system for the sole purpose of demonstrating agentic pipeline
    architecture. It does NOT constitute investment advice. Always consult a licensed
    financial professional before making investment decisions.</p>
  </div>`;

const ACTION_COLOR = {
  'LONG-BUY':       'var(--green)',
  'SCALED-ENTRY':   'var(--green)',
  'WAIT-FOR-ENTRY': 'var(--amber)',
  'MONITOR':        'var(--amber)',
  'AVOID':          'var(--red)',
};

function esc(val) {
  return String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(num) {
  return num != null ? Number(num).toFixed(2) : '—';
}

/**
 * Renders the two-tranche section for SCALED-ENTRY positions.
 * Tranche 1 (IMMEDIATE · LIVE) is shown at full opacity.
 * Tranche 2 (PULLBACK · PENDING) is dimmed to signal it has not fired.
 */
function scaledEntrySetupHtml(setups) {
  if (!setups || setups.length < 2) return '';
  const [imm, plb] = setups;
  return `
    <strong class="subsection-label">Tranche 1 — IMMEDIATE · LIVE</strong>
    <div class="metric-row" style="grid-template-columns:repeat(3,1fr)">
      <div class="metric-box">
        <div class="m-label">Entry Price</div>
        <div class="m-value">$${fmt(imm.entry_zone_low)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Stop Loss</div>
        <div class="m-value">$${fmt(imm.stop_loss)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Take Profit</div>
        <div class="m-value">$${fmt(imm.take_profit)}</div>
      </div>
    </div>
    <strong class="subsection-label" style="color:var(--text-dim)">Tranche 2 — PULLBACK · PENDING</strong>
    <div class="metric-row" style="grid-template-columns:repeat(3,1fr);opacity:0.7">
      <div class="metric-box">
        <div class="m-label">Entry Zone</div>
        <div class="m-value">$${fmt(plb.entry_zone_low)} – $${fmt(plb.entry_zone_high)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Stop Loss</div>
        <div class="m-value">$${fmt(plb.stop_loss)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Take Profit</div>
        <div class="m-value">$${fmt(plb.take_profit)}</div>
      </div>
    </div>`;
}

function positionCard(pos) {
  const action      = pos.action ?? pos.recommendation ?? '—';
  const actionColor = ACTION_COLOR[action] ?? 'var(--text-dim)';

  const allocHtml = (pos.allocation_pct ?? 0) > 0
    ? `<div class="m-value up">${Number(pos.allocation_pct).toFixed(1)}%</div>`
    : `<div class="m-value" style="color:var(--text-dim)">—</div>`;

  const currentPriceHtml = pos.current_price != null
    ? `<div class="m-value">$${Number(pos.current_price).toFixed(2)}</div>`
    : `<div class="m-value" style="color:var(--text-dim)">—</div>`;

  const ts = pos.trade_setup;
  const entryZone  = ts ? `$${fmt(ts.entry_zone_low)} – $${fmt(ts.entry_zone_high)}` : (pos.entry_zone ?? '—');
  const stopLoss   = ts ? `$${fmt(ts.stop_loss)}`   : (pos.stop_loss   != null ? `$${fmt(pos.stop_loss)}` : '—');
  const takeProfit = ts ? `$${fmt(ts.take_profit)}` : '—';

  const triggers = (pos.monitoring_triggers ?? []).map(t => `<li>${esc(t)}</li>`).join('');
  const risks    = (pos.key_risks ?? []).map(r => `<li>${esc(r)}</li>`).join('');

  const reviewFreq = esc((pos.review_frequency ?? '').replace(/_/g, ' '));

  return `
    <div class="stock-card">
      <div class="stock-card-header">
        <span class="stock-ticker">${esc(pos.ticker)}</span>
        <span class="stock-rec" style="color:${actionColor}">${esc(action)}</span>
        ${reviewFreq ? `<span class="stock-score">${reviewFreq}</span>` : ''}
      </div>
      <div class="metric-row" style="grid-template-columns:repeat(5,1fr)">
        <div class="metric-box"><div class="m-label">Allocation</div>${allocHtml}</div>
        <div class="metric-box"><div class="m-label">Current Price</div>${currentPriceHtml}</div>
        <div class="metric-box"><div class="m-label">Entry Zone</div><div class="m-value">${esc(entryZone)}</div></div>
        <div class="metric-box"><div class="m-label">Stop Loss</div><div class="m-value">${esc(stopLoss)}</div></div>
        <div class="metric-box"><div class="m-label">Take Profit</div><div class="m-value">${esc(takeProfit)}</div></div>
      </div>
      ${pos.rationale ? `<p>${esc(pos.rationale)}</p>` : ''}
      ${pos.scaled_entry_setups ? scaledEntrySetupHtml(pos.scaled_entry_setups) : ''}
      ${triggers ? `<strong class="subsection-label">Monitoring Triggers</strong><ul>${triggers}</ul>` : ''}
      ${risks    ? `<strong class="subsection-label">Key Risks</strong><ul>${risks}</ul>`             : ''}
    </div>`;
}

/**
 * Renders the full pipeline JSON report to an HTML string.
 * @param {object} data — the `report` field from a `pipeline_done` SSE event
 * @returns {string} HTML safe to set as .innerHTML
 */
export function renderReport(data) {
  // Backend parse failure — surface raw output
  if (!data || data.parse_error) {
    const raw = data?.raw_output ?? data?.overall_strategy ?? data?.portfolio_summary?.portfolio_rationale ?? 'No output.';
    return `
      <h2>Analysis Output</h2>
      <pre style="white-space:pre-wrap;font-size:12px;color:var(--text)">${esc(raw)}</pre>
      ${DISCLAIMER}`;
  }

  const riskLevel = data.risk_level ?? data.overall_risk_level ?? '—';
  const riskClr   = riskLevel === 'Very High' || riskLevel === 'HIGH' ? 'var(--red)'
                  : riskLevel === 'High'      || riskLevel === 'MEDIUM' ? 'var(--red)'
                  : riskLevel === 'Medium'    ? 'var(--amber)'
                  : riskLevel === 'Low'       || riskLevel === 'LOW' ? 'var(--green)'
                  : 'var(--text-dim)';

  // Support both new schema (positions) and legacy schema (stock_recommendations)
  const positions = data.positions ?? data.stock_recommendations ?? [];
  const posHtml   = positions.map(positionCard).join('');

  const deployedPct     = data.deployed_pct      ?? null;
  const reservedPct     = data.reserved_pct      ?? null;
  const totalAllocated  = data.total_allocated_pct ?? null;
  const cashReserve     = data.cash_reserve_pct    ?? null;
  const strategy        = data.overall_strategy
                       ?? data.portfolio_summary?.portfolio_rationale
                       ?? '';

  const activeCount  = positions.filter(p => !['AVOID', 'MONITOR'].includes(p.action ?? p.recommendation)).length;
  const totalCount   = positions.length;

  // Build capital breakdown row — show deployed/reserved if available, else fall back to total/cash
  const hasThreeBuckets = deployedPct != null && reservedPct != null;
  const capitalMetrics  = hasThreeBuckets
    ? `
      <div class="metric-box">
        <div class="m-label">Deployed</div>
        <div class="m-value ${deployedPct > 0 ? 'up' : ''}">${deployedPct.toFixed(1)}%</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Reserved</div>
        <div class="m-value ${reservedPct > 0 ? 'up' : ''}">${reservedPct.toFixed(1)}%</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Cash Buffer</div>
        <div class="m-value">${cashReserve != null ? cashReserve.toFixed(1) + '%' : '—'}</div>
      </div>`
    : `
      <div class="metric-box">
        <div class="m-label">Allocated</div>
        <div class="m-value ${totalAllocated > 0 ? 'up' : ''}">${totalAllocated != null ? totalAllocated.toFixed(1) + '%' : '—'}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Cash Reserve</div>
        <div class="m-value">${cashReserve != null ? cashReserve.toFixed(1) + '%' : '—'}</div>
      </div>`;

  return `
    <h2>Executive Summary</h2>
    <div class="metric-row">
      <div class="metric-box">
        <div class="m-label">Risk Level</div>
        <div class="m-value" style="color:${riskClr}">${esc(riskLevel)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Positions</div>
        <div class="m-value up">${activeCount} / ${totalCount}</div>
      </div>
      ${capitalMetrics}
    </div>
    ${strategy ? `<p>${esc(strategy)}</p>` : ''}

    <h2>Position Recommendations</h2>
    ${posHtml || '<p>No positions available.</p>'}

    ${DISCLAIMER}`;
}

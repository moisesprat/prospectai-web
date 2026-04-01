/* ============================================================
   REPORT RENDERER
   Converts the pipeline_done JSON payload from the backend
   into the HTML string that report.show() injects into
   .report-body. All values are HTML-escaped before insertion.
   ============================================================ */

const DISCLAIMER = `
  <div class="disclaimer-box">
    <p><strong>DISCLAIMER:</strong> This report was generated autonomously by an AI
    multi-agent system for the sole purpose of demonstrating agentic pipeline
    architecture. It does NOT constitute investment advice. Always consult a licensed
    financial professional before making investment decisions.</p>
  </div>`;

const REC_COLOR = {
  STRONG_BUY: 'var(--green)',
  BUY:        'var(--green)',
  HOLD:       'var(--amber)',
  REDUCE:     'var(--red)',
  AVOID:      'var(--red)',
};

const OUTLOOK_COLOR = {
  BULLISH: 'var(--green)',
  NEUTRAL: 'var(--amber)',
  BEARISH: 'var(--red)',
};

function esc(val) {
  return String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stockCard(stock) {
  const recColor  = REC_COLOR[stock.recommendation]  ?? 'var(--text-dim)';
  const allocHtml = stock.allocation_pct > 0
    ? `<div class="m-value up">${stock.allocation_pct.toFixed(1)}%</div>`
    : `<div class="m-value" style="color:var(--text-dim)">—</div>`;

  const horizon = esc((stock.time_horizon ?? '—').replace(/_/g, ' '));

  const risks = (stock.key_risks ?? [])
    .map(r => `<li>${esc(r)}</li>`).join('');
  const catalysts = (stock.key_catalysts ?? [])
    .map(c => `<li>${esc(c)}</li>`).join('');

  return `
    <div class="stock-card">
      <div class="stock-card-header">
        <span class="stock-ticker">${esc(stock.ticker)}</span>
        <span class="stock-rec" style="color:${recColor}">${esc(stock.recommendation ?? '—')}</span>
        <span class="stock-score">score ${stock.composite_score?.toFixed(1) ?? '—'}</span>
      </div>
      <div class="metric-row" style="grid-template-columns:repeat(4,1fr)">
        <div class="metric-box"><div class="m-label">Allocation</div>${allocHtml}</div>
        <div class="metric-box"><div class="m-label">Entry Zone</div><div class="m-value">${esc(stock.entry_zone ?? '—')}</div></div>
        <div class="metric-box"><div class="m-label">Stop Loss</div><div class="m-value">${esc(stock.stop_loss ?? '—')}</div></div>
        <div class="metric-box"><div class="m-label">Horizon</div><div class="m-value">${horizon}</div></div>
      </div>
      ${stock.rationale ? `<p>${esc(stock.rationale)}</p>` : ''}
      ${risks     ? `<strong class="subsection-label">Key Risks</strong><ul>${risks}</ul>`         : ''}
      ${catalysts ? `<strong class="subsection-label">Key Catalysts</strong><ul>${catalysts}</ul>` : ''}
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
    const raw = data?.raw_output ?? data?.portfolio_summary?.portfolio_rationale ?? 'No output.';
    return `
      <h2>Analysis Output</h2>
      <pre style="white-space:pre-wrap;font-size:12px;color:var(--text)">${esc(raw)}</pre>
      ${DISCLAIMER}`;
  }

  const outlook     = data.overall_sector_outlook ?? 'NEUTRAL';
  const outlookClr  = OUTLOOK_COLOR[outlook] ?? 'var(--text-dim)';
  const riskLevel   = data.overall_risk_level ?? '—';
  const riskClr     = riskLevel === 'HIGH' ? 'var(--red)'
                    : riskLevel === 'LOW'  ? 'var(--green)'
                    : 'var(--amber)';

  const summary = data.portfolio_summary ?? {};
  const plan    = data.execution_plan    ?? {};

  const totalRecs   = (summary.stocks_recommended ?? 0) + (summary.stocks_avoided ?? 0);
  const recs        = (data.stock_recommendations ?? []).map(stockCard).join('');
  const actions     = (plan.immediate_actions    ?? []).map(a => `<li>${esc(a)}</li>`).join('');
  const triggers    = (plan.monitoring_triggers  ?? []).map(t => `<li>${esc(t)}</li>`).join('');

  return `
    <h2>Executive Summary</h2>
    <div class="metric-row">
      <div class="metric-box">
        <div class="m-label">Sector Outlook</div>
        <div class="m-value" style="color:${outlookClr}">${esc(outlook)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Risk Level</div>
        <div class="m-value" style="color:${riskClr}">${esc(riskLevel)}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Avg Score</div>
        <div class="m-value">${summary.avg_composite_score?.toFixed(1) ?? '—'}</div>
      </div>
      <div class="metric-box">
        <div class="m-label">Recommended</div>
        <div class="m-value up">${summary.stocks_recommended ?? '—'} / ${totalRecs}</div>
      </div>
    </div>
    ${summary.portfolio_rationale ? `<p>${esc(summary.portfolio_rationale)}</p>` : ''}

    <h2>Stock Recommendations</h2>
    ${recs || '<p>No recommendations available.</p>'}

    ${actions  ? `<h2>Immediate Actions</h2><ul>${actions}</ul>`              : ''}
    ${triggers ? `<h2>Monitoring Triggers</h2><ul>${triggers}</ul>`           : ''}
    ${plan.review_frequency ? `<p><strong>Review Frequency:</strong> ${esc(plan.review_frequency)}</p>` : ''}

    ${DISCLAIMER}`;
}

/* ============================================================
   Shared reports-page rendering logic — pure string builder,
   no DOM access. Imported by ui/reportsPage.js (browser) and
   scripts/build-static.mjs (Node).
   ============================================================ */

import { fmtDate } from './formatters.js';

export function renderReportCardHTML(r, origin) {
  const href = `${origin}/report.html?id=${r.run_id}`;
  return `<a class="report-card" href="${href}" target="_blank" rel="noopener noreferrer">
    <div class="report-card-top">
      <span class="report-card-sector">${r.sector || '—'}</span>
      <span class="report-card-version">${r.prospectai_version ? 'v' + r.prospectai_version : 'v—'}</span>
    </div>
    <div class="report-card-meta">
      <span>${fmtDate(r.run_at)}</span>
      <span class="report-card-sep">·</span>
      <span>${r.ticker_count ?? 0} stocks</span>
      <span class="report-card-sep">·</span>
      <span style="color:#4a7c59">${r.long_buy_count ?? 0} LONG-BUY</span>
      <span class="report-card-sep">·</span>
      <span style="color:#4a7c59">View Report →</span>
    </div></a>`;
}

export function renderReportsGridHTML(reports, origin) {
  return reports.map(r => renderReportCardHTML(r, origin)).join('');
}

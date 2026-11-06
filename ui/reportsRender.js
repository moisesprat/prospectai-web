/* ============================================================
   Shared reports-page rendering logic — pure string builder,
   no DOM access. Imported by ui/reportsPage.js (browser) and
   scripts/build-static.mjs (Node).
   ============================================================ */

import { escapeHtml, fmtDate } from './formatters.js';

// Counts come from stored data: render a finite number or 0, never raw text.
function safeCount(n) {
  return Number.isFinite(n) ? n : 0;
}

export function renderReportCardHTML(r, origin) {
  const href = `${origin}/report.html?id=${encodeURIComponent(r.run_id ?? '')}`;
  return `<a class="report-card" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
    <div class="report-card-top">
      <span class="report-card-sector">${escapeHtml(r.sector) || '—'}</span>
      <span class="report-card-version">${r.prospectai_version ? 'v' + escapeHtml(r.prospectai_version) : 'v—'}</span>
    </div>
    <div class="report-card-meta">
      <span>${escapeHtml(fmtDate(r.run_at))}</span>
      <span class="report-card-sep">·</span>
      <span>${safeCount(r.ticker_count)} stocks</span>
      <span class="report-card-sep">·</span>
      <span style="color:#4a7c59">${safeCount(r.long_buy_count)} LONG-BUY</span>
      <span class="report-card-sep">·</span>
      <span style="color:#4a7c59">View Report →</span>
    </div></a>`;
}

export function renderReportsGridHTML(reports, origin) {
  return reports.map(r => renderReportCardHTML(r, origin)).join('');
}

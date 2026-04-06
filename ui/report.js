/* ============================================================
   REPORT
   Renders the final intelligence report section.
   show() accepts either a pre-built HTML string (current dummy
   mode) or will accept structured JSON from the backend later.
   ============================================================ */

import { REPORT_TEMPLATES } from './data.js';
import { trackExportPdf } from './saEvents.js';

// DOM references — populated by render()
let section, reportSectorEl, reportMetaEl, reportBodyEl, downloadBtn;

/**
 * Triggers the browser print dialog scoped to the report only.
 * Adds a body class so @media print CSS can hide everything else.
 */
function triggerPDF() {
  trackExportPdf();
  downloadBtn.disabled = true;
  downloadBtn.querySelector('.btn-label').textContent = 'Preparing…';
  downloadBtn.querySelector('.btn-icon').style.display = 'none';
  downloadBtn.querySelector('.btn-spinner').style.display = 'inline-block';

  // Small delay lets the browser paint the "Preparing…" state before
  // the print dialog blocks the thread.
  setTimeout(() => {
    document.body.classList.add('is-printing');
    window.print();
    document.body.classList.remove('is-printing');

    downloadBtn.disabled = false;
    downloadBtn.querySelector('.btn-label').textContent = 'Download PDF';
    downloadBtn.querySelector('.btn-icon').style.display = '';
    downloadBtn.querySelector('.btn-spinner').style.display = 'none';
  }, 80);
}

/**
 * Renders the (initially hidden) report section into `container`.
 * @param {HTMLElement} container
 */
export function render(container) {
  section = document.createElement('section');
  section.id = 'report-section';

  const reportHeader = document.createElement('div');
  reportHeader.className = 'report-header';
  reportHeader.innerHTML = `
    <div>
      <div class="report-title">Intelligence Report -- <span></span></div>
      <div class="report-meta"></div>
    </div>
    <div class="report-header-right">
      <div class="report-badge">OK -- PIPELINE COMPLETE</div>
      <button class="download-btn" title="Save report as PDF">
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="btn-spinner" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style="display:none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 14" stroke-linecap="round"/>
        </svg>
        <span class="btn-label">Download PDF</span>
      </button>
    </div>`;
  reportSectorEl = reportHeader.querySelector('.report-title span');
  reportMetaEl   = reportHeader.querySelector('.report-meta');
  downloadBtn    = reportHeader.querySelector('.download-btn');
  downloadBtn.addEventListener('click', triggerPDF);

  reportBodyEl = document.createElement('div');
  reportBodyEl.className = 'report-body';

  section.append(reportHeader, reportBodyEl);
  container.appendChild(section);
}

/**
 * Populates and reveals the report section.
 * @param {string} sector
 * @param {number} startTime  — pipeline start timestamp (ms)
 * @param {string} [html]     — optional HTML override (for backend response)
 */
export function show(sector, startTime, html) {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  reportSectorEl.textContent = sector;
  reportMetaEl.innerHTML =
    'Generated: ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC' +
    `<br>Duration: ${m}m ${s}s  |  Agents: 4  |  Engine: CrewAI`;

  reportBodyEl.innerHTML = html ?? REPORT_TEMPLATES[sector] ?? REPORT_TEMPLATES.default;

  section.classList.add('visible', 'fade-in');
  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

export function hide() {
  section.classList.remove('visible', 'fade-in');
}

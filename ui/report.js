/* ============================================================
   REPORT
   Renders the final intelligence report section.
   show() accepts either a pre-built HTML string (current dummy
   mode) or will accept structured JSON from the backend later.
   ============================================================ */

import { REPORT_TEMPLATES } from './data.js';
import { trackExportPdf } from './saEvents.js';
import { exportToPdf } from './pdfExporter.js';
import { renderMetrics } from './reportRenderer.js';

// DOM references — populated by render()
let section, reportSectorEl, reportMetaEl, reportBodyEl, downloadBtn;
let twitterShareBtn, linkedinShareBtn;
let _reportData = null;
let _linkedinShareText = '';

/**
 * Triggers a direct PDF download using html2pdf.js.
 * Falls back to window.print() if structured data is unavailable.
 */
function triggerPDF() {
  trackExportPdf();
  downloadBtn.disabled = true;
  downloadBtn.querySelector('.btn-label').textContent = 'Preparing…';
  downloadBtn.querySelector('.btn-icon').style.display = 'none';
  downloadBtn.querySelector('.btn-spinner').style.display = 'inline-block';

  exportToPdf(_reportData, reportSectorEl.textContent, reportMetaEl.textContent)
    .finally(() => {
      downloadBtn.disabled = false;
      downloadBtn.querySelector('.btn-label').textContent = 'Download PDF';
      downloadBtn.querySelector('.btn-icon').style.display = '';
      downloadBtn.querySelector('.btn-spinner').style.display = 'none';
    });
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
      <div class="report-actions">
      <button class="download-btn" title="Save report as PDF">
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="btn-spinner" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style="display:none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 14" stroke-linecap="round"/>
        </svg>
        <span class="btn-label">Download PDF</span>
      </button>
      <div class="share-row">
        <a class="share-btn share-btn--twitter" target="_blank" rel="noopener noreferrer" href="#">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>Share on X</span>
        </a>
        <a class="share-btn share-btn--linkedin" target="_blank" rel="noopener noreferrer" href="#">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span>Share on LinkedIn</span>
        </a>
      </div>
      </div>
    </div>`;
  reportSectorEl  = reportHeader.querySelector('.report-title span');
  reportMetaEl    = reportHeader.querySelector('.report-meta');
  downloadBtn     = reportHeader.querySelector('.download-btn');
  twitterShareBtn  = reportHeader.querySelector('.share-btn--twitter');
  linkedinShareBtn = reportHeader.querySelector('.share-btn--linkedin');
  downloadBtn.addEventListener('click', triggerPDF);
  linkedinShareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(_linkedinShareText).catch(() => {});
    const label = linkedinShareBtn.querySelector('span');
    const orig  = label.textContent;
    label.textContent = 'Text copied!';
    setTimeout(() => { label.textContent = orig; }, 2500);
    window.open(linkedinShareBtn.dataset.href, '_blank', 'noopener,noreferrer');
  });

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
 * @param {object} [data]     — structured report data
 * @param {object} [metrics]  — execution_metrics from backend
 */
export function show(sector, startTime, html, data, metrics) {
  _reportData = data ?? null;
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  reportSectorEl.textContent = sector;
  reportMetaEl.innerHTML =
    'Generated: ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC' +
    `<br>Duration: ${m}m ${s}s  |  Agents: 6  |  Engine: CrewAI`;

  reportBodyEl.innerHTML = html ?? REPORT_TEMPLATES[sector] ?? REPORT_TEMPLATES.default;

  if (metrics) {
    reportBodyEl.insertAdjacentHTML('beforeend', renderMetrics(metrics));
  }

  section.classList.add('visible', 'fade-in');
  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

  const pageUrl   = window.location.href;
  const shareText = `Just ran a 6-agent AI pipeline analysis on ${sector} — Market → Technical → Fundamental → Adversarial Critic → Final. Try it: ${pageUrl} #ProspectAI #AI`;
  twitterShareBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  _linkedinShareText = shareText;
  linkedinShareBtn.dataset.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}`;
}

export function hide() {
  section.classList.remove('visible', 'fade-in');
}

/* ============================================================
   REPORT
   Renders the final intelligence report section.
   show() accepts either a pre-built HTML string (current dummy
   mode) or will accept structured JSON from the backend later.
   ============================================================ */

import { REPORT_TEMPLATES } from './data.js';

// DOM references — populated by render()
let section, reportSectorEl, reportMetaEl, reportBodyEl;

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
    <div class="report-badge">OK -- PIPELINE COMPLETE</div>`;
  reportSectorEl = reportHeader.querySelector('.report-title span');
  reportMetaEl   = reportHeader.querySelector('.report-meta');

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

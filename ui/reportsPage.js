/* ============================================================
   REPORTS PAGE
   Fetches the report listing from the backend and renders
   one card per entry in the report history page.
   ============================================================ */

import { initNav } from './nav.js';
import { renderReportsGridHTML } from './reportsRender.js';
initNav();

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

async function loadReports() {
  const loadingEl = document.getElementById('reports-loading');
  const emptyEl   = document.getElementById('reports-empty');
  const errorEl   = document.getElementById('reports-error');
  const gridEl    = document.getElementById('reports-grid');

  try {
    const res = await fetch(`${BACKEND_URL}/api/reports`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reports = await res.json();

    loadingEl.hidden = true;

    if (!reports || reports.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    gridEl.hidden      = false;
    gridEl.innerHTML   = renderReportsGridHTML(reports, window.location.origin);
    gridEl.dataset.ssr = '1';
  } catch {
    loadingEl.hidden = true;
    // Leave any server-rendered grid content in place rather than wiping it.
    if (gridEl.dataset.ssr !== '1') errorEl.hidden = false;
  }
}

loadReports();

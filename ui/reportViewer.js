/* ============================================================
   REPORT VIEWER
   Reads ?id={run_id} from the URL, fetches the pipeline JSON
   from the backend, and renders it using reportRenderer.js.
   ============================================================ */

import { renderReport, renderMetrics } from './reportRenderer.js';
import { initNav } from './nav.js';
initNav();

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

function showError(msg) {
  document.getElementById('viewer-loading').hidden = true;
  const el = document.getElementById('viewer-error');
  el.textContent = msg;
  el.hidden = false;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const runId  = params.get('id');

  if (!runId) {
    showError('No report ID specified.');
    return;
  }

  // Update page title once we know the run ID
  document.title = `ProspectAI Report — ${runId.slice(0, 8)}…`;

  // Each report is a distinct piece of content — point the canonical tag at
  // this specific report.html?id=... URL instead of the bare report.html
  // that ships in the static HTML, so Google indexes reports individually
  // rather than treating them all as duplicates of one generic page.
  document.querySelector('link[rel="canonical"]').href =
    `https://prospect-ai.moisesprat.dev/report.html?id=${encodeURIComponent(runId)}`;

  let data;
  try {
    const res = await fetch(`${BACKEND_URL}/api/report/${encodeURIComponent(runId)}`);
    if (!res.ok) {
      showError(res.status === 404 ? 'Report not found.' : `Could not load report (HTTP ${res.status}).`);
      return;
    }
    data = await res.json();
  } catch {
    showError('Network error — could not reach the backend.');
    return;
  }

  const report  = data.result ?? data;
  const metrics = data.execution_metrics ?? null;
  const sector  = report.sector ?? '—';
  const runAt   = metrics?.run_at ?? null;

  // Update header
  document.getElementById('viewer-sector').textContent = sector;
  document.getElementById('viewer-run-id').textContent = runId.slice(0, 8) + '…';
  document.getElementById('viewer-date').textContent   = runAt
    ? new Date(runAt).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    : '—';

  // Render body
  document.getElementById('viewer-loading').hidden = true;
  const body = document.getElementById('viewer-body');
  body.innerHTML = renderReport(report);
  if (metrics) {
    body.insertAdjacentHTML('beforeend', renderMetrics(metrics));
  }
  body.hidden = false;

  // Update page title with sector now that we have it
  document.title = `ProspectAI Report — ${sector}`;
}

init();

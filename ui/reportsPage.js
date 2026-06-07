/* ============================================================
   REPORTS PAGE
   Fetches the report listing from the backend and renders
   one card per entry in the report history page.
   ============================================================ */

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const year  = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

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

    gridEl.hidden = false;
    for (const r of reports) {
      const card = document.createElement('a');
      card.className = 'report-card';
      card.href      = `${window.location.origin}/report.html?id=${r.run_id}`;
      card.target    = '_blank';
      card.rel       = 'noopener noreferrer';
      card.innerHTML = `
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
        </div>`;
      gridEl.appendChild(card);
    }
  } catch {
    loadingEl.hidden = true;
    errorEl.hidden   = false;
  }
}

loadReports();

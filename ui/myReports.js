/* ============================================================
   MY REPORTS PANEL
   Reads prospectai_my_reports from localStorage and renders
   a panel listing the user's saved report links.
   ============================================================ */

const STORAGE_KEY = 'prospectai_my_reports';

let panelEl = null;
let listEl  = null;

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const year  = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* storage full — ignore */ }
}

/** Add a new entry. Skips if report_url already exists. */
export function addEntry({ report_url, sector, run_at }) {
  if (!report_url) return;
  const entries = loadEntries();
  if (entries.some(e => e.report_url === report_url)) return;
  entries.unshift({ report_url, sector, run_at });
  saveEntries(entries);
}

/** Re-renders the panel list from localStorage. */
export function refresh() {
  if (!listEl) return;
  const entries = loadEntries();
  listEl.innerHTML = '';

  if (entries.length === 0) {
    listEl.innerHTML = '<li class="my-reports-empty">No saved reports yet.</li>';
    return;
  }

  for (const entry of entries) {
    const li = document.createElement('li');
    li.className = 'my-reports-item';
    li.innerHTML = `
      <a href="${entry.report_url}" target="_blank" rel="noopener noreferrer" class="my-reports-link">
        <span class="my-reports-sector">${entry.sector || '—'}</span>
        <span class="my-reports-date">${fmtDate(entry.run_at)}</span>
      </a>`;
    listEl.appendChild(li);
  }
}

/** Renders the My Reports panel into `container`. */
export function render(container) {
  const entries = loadEntries();

  panelEl = document.createElement('div');
  panelEl.className = 'my-reports-panel';
  panelEl.innerHTML = `
    <div class="my-reports-header">
      <span class="my-reports-title">My Reports</span>
      <a href="reports.html" class="my-reports-history-link">All reports →</a>
    </div>
    <ul class="my-reports-list"></ul>`;

  listEl = panelEl.querySelector('.my-reports-list');
  container.appendChild(panelEl);

  // Hide panel entirely if no saved entries and no need to show the widget yet
  if (entries.length === 0) {
    panelEl.classList.add('my-reports-panel--empty');
  }

  refresh();
}

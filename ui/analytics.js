/* ============================================================
   ANALYTICS WIDGET
   Fetches total analysis count + leading sector from the backend
   and renders a small stat line inside the page header.
   Call refresh() after each completed pipeline run to update it.
   ============================================================ */

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

const SKELETON_SPAN = '<span class="skeleton" style="width:38px;height:13px;border-radius:2px;vertical-align:middle"></span>';

let countEl, leadingEl, versionEl, widgetEl;

/** Renders the analytics widget into `container` and fetches initial data. */
export function render(container) {
  widgetEl = document.createElement('div');
  widgetEl.className = 'analytics-bar';
  widgetEl.innerHTML = `
    <span class="analytics-dot" aria-hidden="true"></span>
    <span class="analytics-count">${SKELETON_SPAN}</span>
    <span class="analytics-label">analyses completed</span>
    <span class="analytics-sep" aria-hidden="true">·</span>
    <span class="analytics-leading">—</span>
    <a href="stats.html" class="stats-page-link" aria-label="View ProspectAI Stats">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor"/>
        <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor"/>
        <rect x="11" y="2" width="3" height="13" rx="1" fill="currentColor"/>
      </svg>
      ProspectAI Stats
    </a>
  `;
  countEl   = widgetEl.querySelector('.analytics-count');
  leadingEl = widgetEl.querySelector('.analytics-leading');
  versionEl = document.getElementById('version-tag');

  // Show skeleton in version tag while fetching
  if (versionEl) {
    versionEl.innerHTML = SKELETON_SPAN;
  }

  container.appendChild(widgetEl);
  refresh();
}

/** Re-fetches analytics and version from the backend and updates the widget. */
export async function refresh() {
  try {
    const [analyticsRes, versionRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/analytics`),
      fetch(`${BACKEND_URL}/api/version`),
    ]);

    if (analyticsRes.ok) {
      const data = await analyticsRes.json();
      countEl.textContent = (data.total ?? 0).toLocaleString();
      leadingEl.textContent = data.leading_sector
        ? `${data.leading_sector} leads`
        : 'No runs yet';
    } else {
      countEl.textContent = '—';
    }

    if (versionEl) {
      if (versionRes.ok) {
        const data = await versionRes.json();
        versionEl.textContent = data.version ? `v${data.version}` : 'v—';
      } else {
        versionEl.textContent = 'v—';
      }
    }

    // Brief highlight animation on update
    widgetEl.classList.remove('analytics-updated');
    void widgetEl.offsetWidth; // reflow to restart animation
    widgetEl.classList.add('analytics-updated');
  } catch {
    // Analytics is non-critical — clear skeletons on failure
    countEl.textContent = '—';
    if (versionEl) versionEl.textContent = 'v—';
  }
}

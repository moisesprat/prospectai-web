/* ============================================================
   ANALYTICS WIDGET
   Fetches total analysis count + leading sector from the backend
   and renders a small stat line inside the page header.
   Call refresh() after each completed pipeline run to update it.
   ============================================================ */

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

let countEl, leadingEl, widgetEl;

/** Renders the analytics widget into `container` and fetches initial data. */
export function render(container) {
  widgetEl = document.createElement('div');
  widgetEl.className = 'analytics-bar';
  widgetEl.innerHTML = `
    <span class="analytics-dot" aria-hidden="true"></span>
    <span class="analytics-count">—</span>
    <span class="analytics-label">analyses completed</span>
    <span class="analytics-sep" aria-hidden="true">·</span>
    <span class="analytics-leading">—</span>
  `;
  countEl   = widgetEl.querySelector('.analytics-count');
  leadingEl = widgetEl.querySelector('.analytics-leading');
  container.appendChild(widgetEl);
  refresh();
}

/** Re-fetches analytics from the backend and updates the widget. */
export async function refresh() {
  try {
    const res  = await fetch(`${BACKEND_URL}/api/analytics`);
    if (!res.ok) return;
    const data = await res.json();

    countEl.textContent = (data.total ?? 0).toLocaleString();

    if (data.leading_sector) {
      leadingEl.textContent = `${data.leading_sector} leads`;
    } else {
      leadingEl.textContent = 'No runs yet';
    }

    // Brief highlight animation on update
    widgetEl.classList.remove('analytics-updated');
    void widgetEl.offsetWidth; // reflow to restart animation
    widgetEl.classList.add('analytics-updated');
  } catch {
    // Analytics is non-critical — fail silently
  }
}

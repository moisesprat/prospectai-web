/* ============================================================
   RECENT WINS
   Fetches positive-ROI LONG-BUY picks from the backend and
   renders a compact card strip between the header and controls.
   ============================================================ */

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1w ago' : `${weeks}w ago`;
}

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

export async function render(parent, beforeEl) {
  let data;
  try {
    const res = await fetch(`${BACKEND_URL}/api/long-buy-wins`);
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return;
  }

  const wins = data?.wins;
  if (!wins || wins.length === 0) return;

  const section = document.createElement('div');
  section.className = 'recent-wins';
  section.innerHTML = `
    <div class="rw-header">
      <span class="rw-label">Recent picks performing well</span>
      <span class="rw-disclaimer">Past performance is not indicative of future results.</span>
    </div>
    <div class="rw-cards">
      ${wins.map(w => `
        <div class="rw-card">
          <div class="rw-top">
            <span class="rw-ticker">${w.ticker}</span>
            <span class="rw-tag">${w.recommended_action}</span>
          </div>
          <div class="rw-sector">${w.sector} · ${relativeTime(w.recommended_at)}</div>
          <div class="rw-roi">+${w.roi_pct.toFixed(1)}%</div>
          <div class="rw-price">${w.trigger_price != null ? `${formatPrice(w.trigger_price)} <span class="rw-arrow">→</span> ` : ''}${formatPrice(w.current_price)}</div>
        </div>
      `).join('')}
    </div>
  `;

  parent.insertBefore(section, beforeEl);
}

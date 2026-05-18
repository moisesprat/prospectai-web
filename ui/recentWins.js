/* ============================================================
   RECENT WINS
   Fetches positive-ROI LONG-BUY picks from the backend and
   renders a scrolling marquee strip between the header and controls.
   ============================================================ */

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatRecommendedDate(isoString) {
  const d = new Date(isoString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = MONTH_ABBREVIATIONS[d.getUTCMonth()];
  const year = String(d.getUTCFullYear() % 100).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

function renderCards(wins) {
  return wins.map(w => `
    <div class="rw-card">
      <div class="rw-top">
        <span class="rw-ticker">${w.ticker}</span>
        <span class="rw-tag">${w.recommended_action}</span>
        <span class="rw-date">· ${formatRecommendedDate(w.recommended_at)}</span>
      </div>
      <div class="rw-sector">${w.sector}</div>
      <div class="rw-roi">+${w.roi_pct.toFixed(1)}%</div>
      <div class="rw-price">${w.trigger_price != null ? `${formatPrice(w.trigger_price)} <span class="rw-arrow">→</span> ` : ''}${formatPrice(w.current_price)}</div>
    </div>
  `).join('');
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

  // Duplicate enough times so the track always exceeds viewport width,
  // then ×2 so the seamless loop has an identical second copy to snap back to.
  const repeatCount = Math.max(2, Math.ceil(6 / wins.length));
  const singleSet = renderCards(wins);
  const allCards = Array.from({ length: repeatCount * 2 }, () => singleSet).join('');

  const section = document.createElement('div');
  section.className = 'recent-wins';
  section.innerHTML = `
    <div class="rw-header">
      <span class="rw-label">Recent picks performing well</span>
      <span class="rw-disclaimer">Past performance is not indicative of future results.</span>
    </div>
    <div class="rw-cards">
      <div class="rw-track">
        ${allCards}
      </div>
    </div>
  `;

  parent.insertBefore(section, beforeEl);
}

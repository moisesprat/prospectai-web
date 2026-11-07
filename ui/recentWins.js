/* ============================================================
   RECENT WINS
   Fetches positive-ROI LONG-BUY picks from the backend and
   renders a scrolling marquee strip between the header and controls.
   renderCards is pure (no DOM) and escapes every backend string (SEC-06).
   ============================================================ */

import { escapeHtml } from './formatters.js';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

const TICKER_PX_PER_SECOND = 48;

const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatRecommendedDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = MONTH_ABBREVIATIONS[d.getUTCMonth()];
  const year = String(d.getUTCFullYear() % 100).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatPrice(value) {
  return isFiniteNumber(value) ? `$${value.toFixed(2)}` : '—';
}

function formatRoi(value) {
  return isFiniteNumber(value) ? `+${value.toFixed(1)}%` : '—';
}

export function renderCards(wins) {
  return wins.map(w => `
    <div class="rw-card">
      <div class="rw-top">
        <span class="rw-ticker">${escapeHtml(w.ticker)}</span>
        <span class="rw-tag">${escapeHtml(w.recommended_action)}</span>
        <span class="rw-date">· ${formatRecommendedDate(w.recommended_at)}</span>
      </div>
      <div class="rw-sector">${escapeHtml(w.sector)}</div>
      <div class="rw-roi">${formatRoi(w.roi_pct)}</div>
      <div class="rw-price">${isFiniteNumber(w.trigger_price) ? `${formatPrice(w.trigger_price)} <span class="rw-arrow">→</span> ` : ''}${formatPrice(w.current_price)}</div>
    </div>
  `).join('');
}

export async function render(parent, beforeEl) {
  // Show skeleton placeholder while fetching
  const skeleton = document.createElement('div');
  skeleton.className = 'rw-skeleton';
  skeleton.innerHTML = `
    <div class="rw-skeleton-card"></div>
    <div class="rw-skeleton-card"></div>
    <div class="rw-skeleton-card"></div>
  `;
  parent.insertBefore(skeleton, beforeEl);

  let data;
  try {
    const res = await fetch(`${BACKEND_URL}/api/long-buy-wins`);
    skeleton.remove();
    if (!res.ok) return;
    data = await res.json();
  } catch {
    skeleton.remove();
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

  // The loop scrolls half the track, so scale the duration with the track
  // width to keep the speed constant no matter how many wins there are.
  const track = section.querySelector('.rw-track');
  const scrollDistance = track.scrollWidth / 2;
  section.style.setProperty('--ticker-duration', `${scrollDistance / TICKER_PX_PER_SECOND}s`);
}

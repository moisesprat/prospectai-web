/* ============================================================
   SITE NAV — marks the active link and keeps the nav pinned
   just below the disclaimer bar regardless of its height.
   ============================================================ */

function applyHeights(h) {
  const root = document.documentElement;
  root.style.setProperty('--disclaimer-h', `${h}px`);
  root.style.setProperty('--topbar-h', `${h + 44}px`);
}

function observeDisclaimer() {
  const disclaimer = document.querySelector('.disclaimer-bar');
  if (!disclaimer) return;
  // Measure immediately so the nav snaps into place on first paint
  applyHeights(disclaimer.offsetHeight);
  // Then track every resize (text reflow, orientation change, font load)
  new ResizeObserver(entries => {
    applyHeights(Math.round(entries[0].contentRect.height + /* border+padding */ 16));
  }).observe(disclaimer);
}

export function initNav() {
  // Active link
  const path = window.location.pathname;
  const page = path.includes('patterns')     ? 'patterns'
    : path.includes('architecture')          ? 'architecture'
    : path.includes('stats')                 ? 'stats'
    : path.includes('report')                ? 'reports'
    : 'home';
  document.querySelectorAll('.site-nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.navpage === page);
  });

  // Start observing once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDisclaimer);
  } else {
    observeDisclaimer();
  }
}

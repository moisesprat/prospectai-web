/* ============================================================
   SITE NAV — marks the active link and keeps the nav pinned
   just below the disclaimer bar regardless of its height.
   ============================================================ */

function updateHeights() {
  const disclaimer = document.querySelector('.disclaimer-bar');
  if (!disclaimer) return;
  const h = disclaimer.offsetHeight;
  const root = document.documentElement;
  root.style.setProperty('--disclaimer-h', `${h}px`);
  root.style.setProperty('--topbar-h', `${h + 44}px`);
}

export function initNav() {
  // Active link
  const path = window.location.pathname;
  const page = path.includes('architecture') ? 'architecture'
    : path.includes('stats')                 ? 'stats'
    : path.includes('report')                ? 'reports'
    : 'home';
  document.querySelectorAll('.site-nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.navpage === page);
  });

  // Measure disclaimer height now and on every resize
  updateHeights();
  window.addEventListener('resize', updateHeights);
}

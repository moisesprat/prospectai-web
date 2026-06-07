/* ============================================================
   SITE NAV — marks the active link based on current pathname
   ============================================================ */

export function initNav() {
  const path = window.location.pathname;
  const page = path.includes('architecture') ? 'architecture'
    : path.includes('stats')                 ? 'stats'
    : path.includes('report')                ? 'reports'
    : 'home';
  document.querySelectorAll('.site-nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.navpage === page);
  });
}

/* ============================================================
   SIMPLE ANALYTICS — custom events (sa_event)
   https://docs.simpleanalytics.com/events
   ============================================================ */

function saEvent(name, metadata) {
  if (typeof window === 'undefined' || typeof window.sa_event !== 'function') return;
  if (metadata != null && typeof metadata === 'object') {
    window.sa_event(name, metadata);
  } else {
    window.sa_event(name);
  }
}

/** User picked a sector card (category). */
export function trackSectorSelect(sector) {
  if (!sector) return;
  saEvent('sector_select', { sector: String(sector) });
}

/** Run Analysis clicked (optional sector label for context). */
export function trackRunAnalysis(sector) {
  if (sector) saEvent('run_analysis', { sector: String(sector) });
  else saEvent('run_analysis');
}

/** User clicked Download / export PDF on the report. */
export function trackExportPdf() {
  saEvent('export_pdf');
}

/** Built by / author site link (header or footer). */
export function trackBuiltByClick() {
  saEvent('link_built_by');
}

/** GitHub repo link (header or footer). */
export function trackGithubClick() {
  saEvent('link_github');
}

/** Attach `link_built_by` / `link_github` to anchors with data-sa="built-by" | "github". */
export function initOutboundLinkTracking() {
  document.querySelectorAll('a[data-sa="built-by"]').forEach((el) => {
    el.addEventListener('click', () => trackBuiltByClick());
  });
  document.querySelectorAll('a[data-sa="github"]').forEach((el) => {
    el.addEventListener('click', () => trackGithubClick());
  });
}

/** Fires at 25%, 50%, 75%, and 100% of max vertical scroll depth (once each). */
export function initScrollDepthTracking() {
  const milestones = [25, 50, 75, 100];
  const fired = new Set();
  let maxPct = 0;

  function measure() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY ?? doc.scrollTop;
    const height = doc.scrollHeight - window.innerHeight;
    if (height <= 0) {
      if (!fired.has(100)) {
        fired.add(100);
        saEvent('page_scroll', { depth: 100 });
      }
      return;
    }
    const pct = Math.min(100, Math.round((scrollTop / height) * 100));
    maxPct = Math.max(maxPct, pct);
    for (const m of milestones) {
      if (maxPct >= m && !fired.has(m)) {
        fired.add(m);
        saEvent('page_scroll', { depth: m });
      }
    }
  }

  window.addEventListener('scroll', measure, { passive: true });
  measure();
}

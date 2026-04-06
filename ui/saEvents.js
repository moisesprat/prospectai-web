/* ============================================================
   SIMPLE ANALYTICS — custom events (sa_event)
   https://docs.simpleanalytics.com/events
   ============================================================ */

function saEvent(name, metadata) {
  if (typeof window === 'undefined') return;
  // Both the queue stub and the real SA script are functions — wait for either.
  if (typeof window.sa_event !== 'function') return;
  try {
    if (metadata != null && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
      window.sa_event(name, metadata);
    } else {
      window.sa_event(name);
    }
  } catch (e) {
    // Never let analytics errors surface to the user.
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

/** Pipeline completed successfully. durationSec is wall-clock seconds. */
export function trackAnalysisComplete(sector, durationSec) {
  const meta = {};
  if (sector) meta.sector = String(sector);
  if (durationSec != null) meta.duration_sec = Math.round(durationSec);
  saEvent('analysis_complete', meta);
}

/** Pipeline errored or connection failed. */
export function trackAnalysisError(sector, reason) {
  const meta = {};
  if (sector) meta.sector = String(sector);
  if (reason) meta.reason = String(reason).slice(0, 120);
  saEvent('analysis_error', meta);
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

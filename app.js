/* ============================================================
   ENTRY POINT
   Mounts all UI modules into #app on DOMContentLoaded.
   ============================================================ */

import { render as renderSectorSelector } from './ui/sectorSelector.js';
import { render as renderExecutionPanel } from './ui/executionPanel.js';
import { render as renderReport }         from './ui/report.js';
import { render as renderAnalytics }      from './ui/analytics.js';
import { initScrollDepthTracking, initOutboundLinkTracking } from './ui/saEvents.js';
import { runAnalysis }                    from './ui/pipeline.js';

document.addEventListener('DOMContentLoaded', () => {
  const app    = document.getElementById('app');
  const header = document.querySelector('header');

  renderAnalytics(header);
  initScrollDepthTracking();
  initOutboundLinkTracking();
  renderSectorSelector(app, { onRun: runAnalysis });
  renderExecutionPanel(app);
  renderReport(app);
});

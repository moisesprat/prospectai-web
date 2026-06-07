/* ============================================================
   ENTRY POINT
   Mounts all UI modules into #app on DOMContentLoaded.
   ============================================================ */

import { render as renderSectorSelector } from './ui/sectorSelector.js';
import { render as renderExecutionPanel } from './ui/executionPanel.js';
import { render as renderReport }         from './ui/report.js';
import { render as renderAnalytics }      from './ui/analytics.js';
import { render as renderRecentWins }     from './ui/recentWins.js';
import { initScrollDepthTracking } from './ui/saEvents.js';
import { initNav } from './ui/nav.js';
import { runAnalysis }                    from './ui/pipeline.js';

document.addEventListener('DOMContentLoaded', () => {
  const app    = document.getElementById('app');
  const header = document.querySelector('header');
  const samplePreview = document.querySelector('.sample-preview');

  initNav();
  renderAnalytics(header);
  renderRecentWins(samplePreview.parentNode, samplePreview);
  initScrollDepthTracking();
  renderSectorSelector(app, { onRun: runAnalysis });
  renderExecutionPanel(app);
  renderReport(app);
});

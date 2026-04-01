/* ============================================================
   ENTRY POINT
   Mounts all UI modules into #app on DOMContentLoaded.
   ============================================================ */

import { render as renderSectorSelector } from './ui/sectorSelector.js';
import { render as renderExecutionPanel } from './ui/executionPanel.js';
import { render as renderReport }         from './ui/report.js';
import { runAnalysis }                    from './ui/pipeline.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  renderSectorSelector(app, { onRun: runAnalysis });
  renderExecutionPanel(app);
  renderReport(app);
});

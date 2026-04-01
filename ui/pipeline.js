/* ============================================================
   PIPELINE ORCHESTRATOR
   Controls the full analysis run — currently simulated locally.

   TO CONNECT BACKEND:
   Replace the simulation block (marked below) with a fetch()
   call to the Modal endpoint. Stream agent outputs via SSE or
   poll the response object for per-agent updates.
   ============================================================ */

import { delay } from './utils.js';
import { getSelectedSector, getIsRunning, setIsRunning } from './state.js';
import { AGENT_SCRIPTS, DEFAULT_SCRIPT } from './data.js';
import * as panel from './executionPanel.js';
import * as report from './report.js';
import { disableControls, enableControls } from './sectorSelector.js';

const TOTAL_DURATION   = 55_000; // ms — used for progress bar pacing
const AGENT_TIMINGS    = [800, 13_000, 13_000, 13_000]; // stagger between agents
const AGENT_ACTIVE_MS  = 10_000; // how long each agent "thinks" before typing output

export async function runAnalysis() {
  const sector = getSelectedSector();
  if (!sector || getIsRunning()) return;
  setIsRunning(true);

  // Reset + show execution UI
  panel.reset();
  panel.show(sector);
  report.hide();
  disableControls();
  setTimeout(() => panel.scrollIntoView(), 100);

  const startTime = Date.now();
  panel.updateMeta(startTime);
  const metaInterval = setInterval(() => panel.updateMeta(startTime), 1_000);

  // ── SIMULATION BLOCK ────────────────────────────────────────
  // Replace everything between these comments with real API calls.
  // The panel.* and report.* methods below are the stable interface
  // your backend integration should drive.

  const scripts = AGENT_SCRIPTS[sector] ?? DEFAULT_SCRIPT;

  const progressStart = Date.now();
  const progressInterval = setInterval(() => {
    const pct = Math.min(95, ((Date.now() - progressStart) / TOTAL_DURATION) * 100);
    panel.setProgress(pct, panel.getStatusMessage(pct));
  }, 500);

  for (let i = 0; i < 4; i++) {
    await delay(AGENT_TIMINGS[i]);
    panel.activateAgent(i, scripts[i].active);
    await delay(AGENT_ACTIVE_MS);
    await panel.typeAgentOutput(i, scripts[i].done);
    panel.completeAgent(i);
  }

  clearInterval(progressInterval);
  panel.setProgress(100, 'Pipeline complete. Generating report...');
  await delay(1_200);

  report.show(sector, startTime);
  // ── END SIMULATION BLOCK ────────────────────────────────────

  clearInterval(metaInterval);
  setIsRunning(false);
  enableControls('Run Again');
}

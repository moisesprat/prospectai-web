/* ============================================================
   PIPELINE ORCHESTRATOR
   Connects to the prospectai-backend Modal endpoint via SSE
   and drives the execution panel + report from live events.

   SSE event types consumed:
     agent_start   — {agent_index, agent_name}
     agent_step    — {agent_index, step_type, thought, tool?, tool_input?}
     agent_done    — {agent_index, summary}
     pipeline_done — {report}
     error         — {message}
   ============================================================ */

import { getSelectedSector, getIsRunning, setIsRunning } from './state.js';
import * as panel from './executionPanel.js';
import * as report from './report.js';
import { disableControls, enableControls } from './sectorSelector.js';
import { renderReport } from './reportRenderer.js';

// ── Backend URL ─────────────────────────────────────────────
// In local dev (npm run dev) Vite proxies /api → Modal, so BACKEND_URL is ''.
// In production (static files, no Vite), import.meta.env is undefined and the
// fallback full URL is used directly.
const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

// Progress % milestones keyed by agent index
const PROGRESS_ON_START = [2,  27, 52, 77];
const PROGRESS_ON_DONE  = [25, 50, 75, 99];

/** Status line: "Initializing…" only for this long, then "Processing…". */
const INIT_STATUS_MS = 5_500;
/** Rough duration per agent segment so the bar keeps moving (~2 min). */
const SEGMENT_DURATION_MS = 120_000;
/** After the linear segment, creep slowly toward the done milestone until `agent_done`. */
const OVERTIME_MS_PER_PCT = 25_000;

const STATUS_PROCESSING = 'Processing…';
const STATUS_INIT = 'Initializing agents…';

let smoothRaf = null;
let initRaf = null;
let initStatusTimer = null;
/** Slow creep while waiting for the first SSE event after init. */
let idleTick = null;

const IDLE_CREEP_MAX = 7.5;
const IDLE_CREEP_STEP = 0.14;
const IDLE_CREEP_MS = 1_600;

function clearSmoothProgress() {
  if (smoothRaf !== null) {
    cancelAnimationFrame(smoothRaf);
    smoothRaf = null;
  }
}

function clearInitProgress() {
  if (initRaf !== null) {
    cancelAnimationFrame(initRaf);
    initRaf = null;
  }
}

function clearInitStatusTimer() {
  if (initStatusTimer !== null) {
    clearTimeout(initStatusTimer);
    initStatusTimer = null;
  }
}

function clearIdleTick() {
  if (idleTick !== null) {
    clearInterval(idleTick);
    idleTick = null;
  }
}

function startIdleCreep() {
  clearIdleTick();
  idleTick = setInterval(() => {
    const p = panel.getProgressFill();
    if (p >= IDLE_CREEP_MAX) return;
    panel.setProgressFill(Math.min(IDLE_CREEP_MAX, p + IDLE_CREEP_STEP));
  }, IDLE_CREEP_MS);
}

/** Smooth bar from PROGRESS_ON_START[idx] toward (almost) PROGRESS_ON_DONE[idx]. */
function startAgentSegmentProgress(agentIndex) {
  clearSmoothProgress();
  const from = PROGRESS_ON_START[agentIndex] ?? 0;
  const done = PROGRESS_ON_DONE[agentIndex] ?? 99;
  const softEnd = Math.max(from, done - 0.55);
  const creepCap = done - 0.1;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const span = softEnd - from;
    let pct;
    if (elapsed < SEGMENT_DURATION_MS) {
      pct = from + (elapsed / SEGMENT_DURATION_MS) * span;
    } else {
      const over = elapsed - SEGMENT_DURATION_MS;
      pct = Math.min(creepCap, softEnd + over / OVERTIME_MS_PER_PCT);
    }
    panel.setProgressFill(pct);
    smoothRaf = requestAnimationFrame(frame);
  }
  smoothRaf = requestAnimationFrame(frame);
}

/** Gentle movement on the bar during the initial status window (0 → ~2%). */
function startBootProgress() {
  clearInitProgress();
  const start = performance.now();
  const endPct = 2;

  function frame(now) {
    const elapsed = now - start;
    if (elapsed >= INIT_STATUS_MS) {
      panel.setProgressFill(endPct);
      initRaf = null;
      return;
    }
    panel.setProgressFill((elapsed / INIT_STATUS_MS) * endPct);
    initRaf = requestAnimationFrame(frame);
  }
  initRaf = requestAnimationFrame(frame);
}

/**
 * Formats a step event payload into a single display string.
 * AgentAction (step_type="action"): show thought + tool name.
 * AgentFinish (step_type="finish"): show thought only.
 */
function formatStep(event) {
  const parts = [];
  if (event.thought)    parts.push(event.thought);
  if (event.tool)       parts.push(`→ ${event.tool}`);
  return parts.join('\n') || '…';
}

export async function runAnalysis() {
  const sector = getSelectedSector();
  if (!sector || getIsRunning()) return;
  setIsRunning(true);

  panel.reset();
  panel.show(sector);
  report.hide();
  disableControls();
  setTimeout(() => panel.scrollIntoView(), 100);

  const startTime = Date.now();
  panel.updateMeta(startTime);
  const metaInterval = setInterval(() => panel.updateMeta(startTime), 1_000);

  let pastInitStatus = false;
  panel.setProgress(0, STATUS_INIT);
  startBootProgress();
  initStatusTimer = setTimeout(() => {
    pastInitStatus = true;
    panel.setStatusLine(STATUS_PROCESSING);
    startIdleCreep();
  }, INIT_STATUS_MS);

  await new Promise((resolve) => {
    const url    = `${BACKEND_URL}/api/analyze?sector=${encodeURIComponent(sector)}`;
    const source = new EventSource(url);

    /** True once `pipeline_done` or JSON `error` is handled — avoids treating normal SSE close as failure. */
    let streamSettled = false;

    function finish() {
      source.close();
      clearInterval(metaInterval);
      clearSmoothProgress();
      clearInitProgress();
      clearInitStatusTimer();
      clearIdleTick();
      setIsRunning(false);
      enableControls('Run Again');
      resolve();
    }

    source.onmessage = (e) => {
      let event;
      try { event = JSON.parse(e.data); } catch { return; }

      switch (event.type) {

        case 'agent_start': {
          const idx = event.agent_index;
          clearInitProgress();
          clearIdleTick();
          panel.activateAgent(idx, STATUS_PROCESSING);
          startAgentSegmentProgress(idx);
          if (!pastInitStatus) {
            panel.setStatusLine(STATUS_INIT);
          }
          break;
        }

        case 'agent_step': {
          panel.setAgentStep(event.agent_index, formatStep(event));
          break;
        }

        case 'agent_done': {
          const idx = event.agent_index;
          const pct = PROGRESS_ON_DONE[idx] ?? 99;
          clearSmoothProgress();
          panel.setProgress(pct, pastInitStatus ? STATUS_PROCESSING : STATUS_INIT);
          // Type the summary, then mark card green — fire-and-forget so the
          // next agent_start event can activate the next card in parallel.
          panel.typeAgentOutput(idx, event.summary || 'Analysis complete.')
               .then(() => panel.completeAgent(idx));
          break;
        }

        case 'pipeline_done': {
          streamSettled = true;
          clearSmoothProgress();
          clearIdleTick();
          panel.setProgress(100, 'Pipeline complete. Generating report…');
          const html = renderReport(event.report);
          setTimeout(() => {
            report.show(sector, startTime, html);
            finish();
          }, 800);
          break;
        }

        case 'error': {
          streamSettled = true;
          clearSmoothProgress();
          clearInitProgress();
          clearInitStatusTimer();
          clearIdleTick();
          panel.setProgress(0, `Error: ${event.message}`);
          finish();
          break;
        }
      }
    };

    source.onerror = () => {
      // End of stream after success still closes the connection and fires `error` in many browsers.
      if (streamSettled) return;
      streamSettled = true;
      clearSmoothProgress();
      clearInitProgress();
      clearInitStatusTimer();
      clearIdleTick();
      panel.setProgress(0, 'Connection failed. Check backend and try again.');
      finish();
    };
  });
}

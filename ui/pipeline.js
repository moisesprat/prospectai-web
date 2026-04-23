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
import { trackAnalysisComplete, trackAnalysisError } from './saEvents.js';
import * as panel from './executionPanel.js';
import * as report from './report.js';
import { disableControls, enableControls } from './sectorSelector.js';
import { renderReport } from './reportRenderer.js';
import { refresh as refreshAnalytics } from './analytics.js';

// ── Backend URL ─────────────────────────────────────────────
// In local dev (npm run dev) Vite proxies /api → Modal, so BACKEND_URL is ''.
// In production (static files, no Vite), import.meta.env is undefined and the
// fallback full URL is used directly.
const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

// Progress % milestones keyed by agent index
const PROGRESS_ON_START = [2,  18, 35, 52, 68, 84];
const PROGRESS_ON_DONE  = [16, 33, 50, 66, 82, 99];

/** Status line: "Initializing…" only for this long, then "Processing…". */
const INIT_STATUS_MS = 5_500;
/** Rough duration per agent segment so the bar keeps moving (~2 min). */
const SEGMENT_DURATION_MS = 120_000;
/** After the linear segment, creep slowly toward the done milestone until `agent_done`. */
const OVERTIME_MS_PER_PCT = 25_000;

const STATUS_PROCESSING = 'Processing…';
const STATUS_INIT = 'Initializing agents…';

/** Cycling status messages shown while an agent is running between step callbacks. */
const AGENT_IDLE_MESSAGES = [
  // 0 — Market Analyst
  (sector) => [
    `Scanning Reddit posts for ${sector} sector activity…`,
    `Crawling r/investing, r/stocks, r/wallstreetbets for mentions…`,
    `Falling back to SerperDev web search for additional signals…`,
    `Scoring sentiment polarity for each ticker found…`,
    `Counting mention frequency per stock…`,
    `Ranking candidates by mention count and sentiment score…`,
    `Identifying top 5 ${sector} stocks by community signals…`,
  ],
  // 1 — Technical Analyst
  (sector) => [
    `Fetching OHLCV price history for ${sector} candidates via yfinance…`,
    `Computing RSI — measuring overbought / oversold conditions…`,
    `Computing MACD — detecting momentum crossovers…`,
    `Calculating Bollinger Bands — measuring volatility envelopes…`,
    `Computing ATR — assessing average true range…`,
    `Running 13+ indicators across all candidate tickers…`,
    `Scoring momentum and trend strength per stock…`,
  ],
  // 2 — Fundamental Analyst
  (sector) => [
    `Pulling income statements and balance sheets via yfinance…`,
    `Analysing P/E, P/B, and EV/EBITDA valuation multiples…`,
    `Reviewing quarterly revenue growth rates…`,
    `Evaluating net profit margins and operating leverage…`,
    `Assessing debt-to-equity and interest coverage ratios…`,
    `Computing free cash flow yield for each ${sector} stock…`,
    `Scoring fundamental quality and competitive positioning…`,
  ],
  // 3 — Draft Strategist
  (sector) => [
    `Synthesizing sentiment, technical, and fundamental signals…`,
    `Computing composite scores (30% sentiment · 40% momentum · 30% fundamentals)…`,
    `Applying 40% single-position cap and iterative redistribution…`,
    `Determining entry zones and stop-loss levels for ${sector} positions…`,
    `Drafting initial portfolio allocation — pending critic review…`,
  ],
  // 4 — Critic
  (sector) => [
    `Cross-referencing draft positions against raw technical indicators…`,
    `Checking RSI and Stochastic for overbought signals ignored in draft…`,
    `Verifying allocation percentages match composite score ranking…`,
    `Auditing rationales for claims not backed by specific data…`,
    `Scanning for entry zone violations and concentration breaches…`,
    `Issuing revision directives for flagged positions…`,
  ],
  // 5 — Final Strategist
  (sector) => [
    `Reading Critic's revision directives…`,
    `Addressing CRITICAL and MAJOR critique findings…`,
    `Revising affected positions with corrected actions and rationales…`,
    `Re-running portfolio allocator with revised position decisions…`,
    `Finalizing ${sector} investment report…`,
  ],
];

let smoothRaf = null;
let initRaf = null;
let initStatusTimer = null;
/** Slow creep while waiting for the first SSE event after init. */
let idleTick = null;
/** Cycling contextual messages while an agent is running between step callbacks. */
let idleMessageTimer = null;
let idleMessageIdx = 0;

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

function clearIdleMessages() {
  if (idleMessageTimer !== null) {
    clearTimeout(idleMessageTimer);
    idleMessageTimer = null;
  }
}

/**
 * Starts cycling per-agent contextual messages into the card output area.
 * Messages rotate every 3.5 s until clearIdleMessages() is called.
 */
function startIdleMessages(agentIndex) {
  clearIdleMessages();
  const sector = getSelectedSector() || 'selected';
  const msgs = AGENT_IDLE_MESSAGES[agentIndex]?.(sector) ?? [];
  if (!msgs.length) return;
  idleMessageIdx = 0;

  function showNext() {
    panel.setAgentStep(agentIndex, msgs[idleMessageIdx]);
    idleMessageIdx = (idleMessageIdx + 1) % msgs.length;
    idleMessageTimer = setTimeout(showNext, 3_500);
  }
  showNext();
}

/**
 * Reveals a long text in progressively larger chunks so it doesn't appear
 * all at once. Each chunk appends ~180 chars, pausing 700 ms between chunks.
 * Calls onDone when the full text is showing.
 */
function showTextInParts(agentIndex, text, onDone) {
  const CHUNK = 180;
  const clean = text.replace(/```[a-z]*/gi, '').trim();
  let shown = 0;

  function next() {
    shown = Math.min(shown + CHUNK, clean.length);
    const partial = clean.slice(0, shown);
    const more    = shown < clean.length;
    panel.setAgentStep(agentIndex, `Finalizing output…\n${partial}${more ? '…' : ''}`);
    if (more) {
      idleMessageTimer = setTimeout(next, 700);
    } else {
      onDone?.();
    }
  }
  next();
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
 * Formats an AgentAction step into a display string (tool calls only).
 * Finish and unknown steps are handled inline in the event handler.
 */
function formatActionStep(event) {
  const tool    = event.tool    ? `Calling tool: ${event.tool}` : '';
  const thought = event.thought || '';
  return [thought, tool].filter(Boolean).join('\n') || 'Running…';
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
      clearIdleMessages();
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
          panel.setTaskProgress(idx);
          if (event.model) panel.setAgentModel(idx, event.model);
          startAgentSegmentProgress(idx);
          startIdleMessages(idx);
          if (!pastInitStatus) {
            panel.setStatusLine(STATUS_INIT);
          }
          break;
        }

        case 'agent_step': {
          const idx = event.agent_index;
          if (event.step_type === 'action') {
            // Tool call — show it, pause idle cycle briefly then resume
            clearIdleMessages();
            panel.setAgentStep(idx, formatActionStep(event));
            idleMessageTimer = setTimeout(() => startIdleMessages(idx), 4_000);
          } else if (event.step_type === 'finish') {
            // Agent wrapping up — stop idle cycle and stream the output in parts
            clearIdleMessages();
            if (event.preview) {
              showTextInParts(idx, event.preview, null);
            } else {
              panel.setAgentStep(idx, event.thought || 'Finalizing output…');
            }
          } else {
            // Unknown fallback — show raw briefly then resume idle
            clearIdleMessages();
            panel.setAgentStep(idx, event.raw ? event.raw.slice(0, 200) : '…');
            idleMessageTimer = setTimeout(() => startIdleMessages(idx), 4_000);
          }
          break;
        }

        case 'agent_done': {
          const idx = event.agent_index;
          const pct = PROGRESS_ON_DONE[idx] ?? 99;
          clearIdleMessages();
          clearSmoothProgress();
          panel.setProgress(pct, pastInitStatus ? STATUS_PROCESSING : STATUS_INIT);
          // Build display: handoff message + optional content preview
          let display = event.summary || 'Analysis complete.';
          if (event.preview) {
            const peek = event.preview.replace(/```[a-z]*/gi, '').trim().slice(0, 300);
            display += `\n\n${peek}${event.preview.length > 300 ? '…' : ''}`;
          }
          // Go green immediately when agent finishes — don't wait for typing animation.
          panel.completeAgent(idx, event.tokens_est);
          panel.typeAgentOutput(idx, display); // fire-and-forget
          break;
        }

        case 'pipeline_done': {
          streamSettled = true;
          clearSmoothProgress();
          clearIdleTick();
          panel.setProgress(100, 'Pipeline complete. Generating report…');
          trackAnalysisComplete(sector, (Date.now() - startTime) / 1000);
          refreshAnalytics();
          // Replace per-agent estimated token counts with real values from metrics.
          if (event.metrics?.phases) {
            event.metrics.phases.forEach((phase, i) => {
              panel.updateAgentTokens(i, phase.total_tokens);
            });
          }
          const html = renderReport(event.report);
          setTimeout(() => {
            report.show(sector, startTime, html, event.report, event.metrics ?? null);
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
          trackAnalysisError(sector, event.message);
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
      clearIdleMessages();
      trackAnalysisError(sector, 'connection_failed');
      panel.setProgress(0, 'Connection failed. Check backend and try again.');
      finish();
    };
  });
}

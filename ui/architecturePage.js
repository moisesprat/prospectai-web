/* ============================================================
   ARCHITECTURE PAGE — demo animation (no backend connection)
   Cycles through the 6 agent nodes automatically to illustrate
   the pipeline execution flow.
   ============================================================ */

import { initNav } from './nav.js';
initNav();

const NODE_IDS = [
  'arch-node-0',  // Market Analyst
  'arch-node-1',  // Technical Analyst
  'arch-node-2',  // Fundamental Analyst
  'arch-node-3',  // Draft Strategist
  'arch-node-4',  // Critic
  'arch-node-5',  // Final Strategist
];

const CONNECTOR_IDS = [
  'arch-conn-0',
  'arch-conn-left-bridge',
  'arch-conn-right-bridge',
  'arch-conn-join',
  'arch-conn-3',
  'arch-conn-4',
  'arch-conn-5',
];

// How long each phase stays "running" before completing (ms)
const PHASE_DURATIONS = [3000, 3500, 3500, 2500, 2500, 2500];
// Pause between full loop replays
const LOOP_PAUSE_MS = 2500;

function setNodeState(idx, state) {
  const el = document.getElementById(NODE_IDS[idx]);
  if (!el) return;
  el.classList.remove('arch-node--running', 'arch-node--done');
  if (state) el.classList.add(`arch-node--${state}`);
  const statusSpan = el.querySelector('.arch-node-status');
  if (statusSpan) {
    statusSpan.textContent = state === 'running' ? '● RUNNING'
      : state === 'done'    ? '✓ DONE'
      : '';
  }
}

function lightConnector(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('arch-connector--lit', 'arch-parallel-join--lit', 'arch-bridge-line--lit');
}

function reset() {
  NODE_IDS.forEach((_, i) => setNodeState(i, null));
  CONNECTOR_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('arch-connector--lit', 'arch-parallel-join--lit', 'arch-bridge-line--lit');
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runDemo() {
  while (true) {
    reset();
    await delay(800);

    // Phase 1 — Market Analyst
    setNodeState(0, 'running');
    await delay(PHASE_DURATIONS[0]);
    setNodeState(0, 'done');
    lightConnector('arch-conn-0');
    await delay(300);
    lightConnector('arch-conn-left-bridge');
    lightConnector('arch-conn-right-bridge');

    // Phase 2 + 3 — Technical & Fundamental in parallel
    setNodeState(1, 'running');
    setNodeState(2, 'running');
    await delay(PHASE_DURATIONS[1]);
    setNodeState(1, 'done');
    setNodeState(2, 'done');
    await delay(250);
    lightConnector('arch-conn-join');
    await delay(300);
    lightConnector('arch-conn-3');

    // Phase 4 — Draft Strategist
    setNodeState(3, 'running');
    await delay(PHASE_DURATIONS[3]);
    setNodeState(3, 'done');
    lightConnector('arch-conn-4');

    // Phase 5 — Critic
    setNodeState(4, 'running');
    await delay(PHASE_DURATIONS[4]);
    setNodeState(4, 'done');
    lightConnector('arch-conn-5');

    // Phase 6 — Final Strategist
    setNodeState(5, 'running');
    await delay(PHASE_DURATIONS[5]);
    setNodeState(5, 'done');

    // Hold completed state, then loop
    await delay(LOOP_PAUSE_MS);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Small initial delay so the page renders before animation starts
  setTimeout(runDemo, 600);
});

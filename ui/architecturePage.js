/* ============================================================
   ARCHITECTURE PAGE
   Renders the animated pipeline diagram and drives it via SSE
   when the user triggers a run.
   ============================================================ */

import { initNav } from './nav.js';
initNav();

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL
  ?? 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

/* agent index → node element id */
const NODE_IDS = [
  'arch-node-0',  // Market Analyst
  'arch-node-1',  // Technical Analyst
  'arch-node-2',  // Fundamental Analyst
  'arch-node-3',  // Draft Strategist
  'arch-node-4',  // Critic
  'arch-node-5',  // Final Strategist
];

/* connector ids that light up when an agent completes */
const CONNECTOR_IDS = [
  'arch-conn-0',  // after Market Analyst → splits to parallel
  'arch-conn-1',  // after Technical (left bridge)
  'arch-conn-2',  // after Fundamental (right bridge)
  'arch-conn-3',  // after parallel join → Draft Strategist
  'arch-conn-4',  // after Draft → Critic
  'arch-conn-5',  // after Critic → Final
];

let runBtn, statusEl, resultEl, resultLink;
let source = null;

function setNodeState(idx, state) {
  const el = document.getElementById(NODE_IDS[idx]);
  if (!el) return;
  el.classList.remove('arch-node--running', 'arch-node--done');
  if (state) el.classList.add(`arch-node--${state}`);
  const statusSpan = el.querySelector('.arch-node-status');
  if (statusSpan) {
    statusSpan.textContent = state === 'running' ? '● RUNNING'
      : state === 'done' ? '✓ DONE' : '';
  }
}

function litConnector(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('arch-connector--lit', 'arch-parallel-join--lit', 'arch-bridge-line--lit');
}

function resetAll() {
  NODE_IDS.forEach((_, i) => setNodeState(i, null));
  CONNECTOR_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('arch-connector--lit', 'arch-parallel-join--lit', 'arch-bridge-line--lit');
  });
  resultEl.classList.remove('arch-result--visible');
  resultLink.href = '#';
}

function finish(sector, runId) {
  runBtn.disabled = false;
  runBtn.textContent = 'Run Again →';
  statusEl.className = 'arch-status arch-status--done';
  statusEl.textContent = 'Pipeline complete';
  if (runId) {
    resultLink.href = `${window.location.origin}/report.html?id=${runId}`;
    resultEl.classList.add('arch-result--visible');
  }
}

function run(sector) {
  if (source) { source.close(); source = null; }
  resetAll();
  runBtn.disabled = true;
  runBtn.textContent = 'Running…';
  statusEl.className = 'arch-status arch-status--running';
  statusEl.textContent = 'Connecting…';

  const url = `${BACKEND_URL}/api/analyze?sector=${encodeURIComponent(sector)}&risk_profile=conservative`;
  source = new EventSource(url);
  let settled = false;

  source.onmessage = (e) => {
    let event;
    try { event = JSON.parse(e.data); } catch { return; }

    switch (event.type) {
      case 'agent_start': {
        const idx = event.agent_index;
        setNodeState(idx, 'running');
        statusEl.textContent = `Phase ${idx + 1} — ${event.agent_name}…`;
        break;
      }
      case 'agent_done': {
        const idx = event.agent_index;
        setNodeState(idx, 'done');
        // light up the outgoing connector(s)
        if (idx === 0) {
          // Market Analyst done → light bridge lines to parallel agents
          litConnector('arch-conn-left-bridge');
          litConnector('arch-conn-right-bridge');
        } else if (idx === 1 || idx === 2) {
          // when BOTH parallel agents are done, light the join connector
          const otherDone = document.getElementById(NODE_IDS[idx === 1 ? 2 : 1])
            ?.classList.contains('arch-node--done');
          if (otherDone) litConnector('arch-conn-join');
        } else {
          litConnector(`arch-conn-${idx}`);
        }
        break;
      }
      case 'pipeline_done': {
        settled = true;
        source.close();
        source = null;
        // ensure all nodes are marked done
        NODE_IDS.forEach((_, i) => setNodeState(i, 'done'));
        finish(sector, event.run_id ?? null);
        break;
      }
      case 'error': {
        settled = true;
        source.close();
        source = null;
        runBtn.disabled = false;
        runBtn.textContent = 'Retry →';
        statusEl.className = 'arch-status';
        statusEl.textContent = `Error: ${event.message}`;
        break;
      }
    }
  };

  source.onerror = () => {
    if (settled) return;
    source.close();
    source = null;
    runBtn.disabled = false;
    runBtn.textContent = 'Retry →';
    statusEl.className = 'arch-status';
    statusEl.textContent = 'Connection lost — try again';
  };
}

document.addEventListener('DOMContentLoaded', () => {
  runBtn    = document.getElementById('arch-run-btn');
  statusEl  = document.getElementById('arch-status');
  resultEl  = document.getElementById('arch-result');
  resultLink = document.getElementById('arch-result-link');

  const select = document.getElementById('arch-sector-select');
  runBtn.addEventListener('click', () => run(select.value));
});

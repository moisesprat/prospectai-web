/* ============================================================
   EXECUTION PANEL
   Renders the agent cards, progress bar, and status line.
   Exposes update methods called by pipeline.js during a run.
   ============================================================ */

import { typeOutput } from './utils.js';

const AGENT_DEFS = [
  { id: 'AGENT-01', name: 'Market Analyst',      role: 'macro_trends - sentiment - reddit_signals' },
  { id: 'AGENT-02', name: 'Technical Analyst',   role: 'price_action - indicators - momentum' },
  { id: 'AGENT-03', name: 'Fundamental Analyst', role: 'earnings - valuation - balance_sheet' },
  { id: 'AGENT-04', name: 'Investor Strategist', role: 'portfolio_strategy - risk - recommendations' },
];

// DOM references — populated by render()
let panel;
let execSectorEl, execMetaEl, progressFillEl, progressPctEl, statusLineEl;
const cardEls   = new Array(4);
const outputEls = new Array(4);
const modelEls  = new Array(4);

/**
 * Renders the execution panel into `container`.
 * Panel starts hidden; call show() to reveal it.
 * @param {HTMLElement} container
 */
export function render(container) {
  panel = document.createElement('section');
  panel.id = 'execution-panel';

  // Header
  const header = document.createElement('div');
  header.className = 'exec-header';
  header.innerHTML = `
    <div class="exec-title">Executing pipeline -- <span></span></div>
    <div class="exec-meta">INITIALIZING...</div>`;
  execSectorEl = header.querySelector('.exec-title span');
  execMetaEl   = header.querySelector('.exec-meta');

  // Progress
  const progressWrap = document.createElement('div');
  progressWrap.className = 'progress-wrap';
  progressWrap.innerHTML = `
    <div class="progress-top">
      <span class="progress-label">PIPELINE PROGRESS</span>
      <span class="progress-pct">0%</span>
    </div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill"></div>
    </div>
    <div class="status-line">Initializing agents...</div>`;
  progressPctEl  = progressWrap.querySelector('.progress-pct');
  progressFillEl = progressWrap.querySelector('.progress-bar-fill');
  statusLineEl   = progressWrap.querySelector('.status-line');

  // Section label
  const sectionLabel = document.createElement('div');
  sectionLabel.className = 'section-label';
  sectionLabel.textContent = '02 / Agent execution log';

  // Agent cards grid
  const grid = document.createElement('div');
  grid.className = 'agents-grid';

  AGENT_DEFS.forEach(({ id, name, role }, i) => {
    const card = document.createElement('div');
    card.className = 'agent-card pending';
    card.innerHTML = `
      <div class="card-top">
        <span class="agent-id">${id}</span>
        <span class="agent-status-dot"></span>
      </div>
      <div class="agent-name">${name}</div>
      <div class="agent-model-tag"></div>
      <div class="agent-role">${role}</div>
      <div class="agent-output">Waiting to execute...</div>`;
    grid.appendChild(card);
    cardEls[i]   = card;
    outputEls[i] = card.querySelector('.agent-output');
    modelEls[i]  = card.querySelector('.agent-model-tag');
  });

  panel.append(header, progressWrap, sectionLabel, grid);
  container.appendChild(panel);
}

export function show(sector) {
  execSectorEl.textContent = sector;
  panel.classList.add('visible');
}

export function hide() {
  panel.classList.remove('visible');
}

export function scrollIntoView() {
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function reset() {
  cardEls.forEach((card, i) => {
    card.className = 'agent-card pending';
    outputEls[i].innerHTML = 'Waiting to execute...';
    modelEls[i].textContent = '';
  });
  setProgress(0, 'Initializing agents...');
}

export function setAgentModel(i, model) {
  modelEls[i].textContent = model;
}

export function setProgress(pct, status) {
  setProgressFill(pct);
  if (status) statusLineEl.textContent = status;
}

/** Updates only the bar and % label (status line unchanged). Used for smooth in-flight progress. */
export function setProgressFill(pct) {
  progressFillEl.style.width = pct + '%';
  progressPctEl.textContent  = Math.round(pct) + '%';
}

export function getProgressFill() {
  const t = progressPctEl.textContent.replace('%', '').trim();
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

export function setStatusLine(text) {
  statusLineEl.textContent = text;
}

export function getStatusMessage(pct) {
  if (pct < 15) return 'Initializing Market Analyst agent...';
  if (pct < 30) return 'Market Analyst processing macro and sentiment data...';
  if (pct < 45) return 'Technical Analyst computing price indicators...';
  if (pct < 60) return 'Fundamental Analyst evaluating earnings and valuations...';
  if (pct < 75) return 'Investor Strategist synthesizing all signals...';
  if (pct < 90) return 'Constructing portfolio recommendations...';
  return 'Compiling final intelligence report...';
}

export function updateMeta(startTime) {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  execMetaEl.textContent = `ELAPSED: ${m}:${s}`;
}

export function activateAgent(i, text) {
  cardEls[i].className = 'agent-card active';
  outputEls[i].innerHTML = text + '<span class="typing-cursor"></span>';
  cardEls[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function completeAgent(i) {
  cardEls[i].className = 'agent-card done';
}

/**
 * Updates the active agent's output with live step text (no typing animation).
 * Called repeatedly as agent_step SSE events arrive.
 */
export function setAgentStep(i, text) {
  outputEls[i].innerHTML = text + '<span class="typing-cursor"></span>';
}

/** Animates the final output text for agent i. */
export async function typeAgentOutput(i, text) {
  await typeOutput(outputEls[i], text);
}

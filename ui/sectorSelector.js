/* ============================================================
   SECTOR SELECTOR
   Renders the sector grid and Run button, manages selection state.
   ============================================================ */

import { SECTORS } from './data.js';
import { trackRunAnalysis, trackSectorSelect } from './saEvents.js';
import { getIsRunning, getSelectedSector, setSelectedSector } from './state.js';

const DIAGRAM_NODES = [
  { id: 'AGENT-01', name: 'Market Analyst',      role: 'macro · sentiment',         critic: false },
  { id: 'AGENT-02', name: 'Technical Analyst',   role: 'price action · momentum',   critic: false },
  { id: 'AGENT-03', name: 'Fundamental Analyst', role: 'earnings · valuation',      critic: false },
  { id: 'AGENT-04', name: 'Draft Strategist',    role: 'portfolio · allocation',    critic: false },
  { id: 'AGENT-05', name: 'Critic',              role: 'adversarial · review',      critic: true  },
  { id: 'AGENT-06', name: 'Final Strategist',    role: 'revised portfolio · final', critic: false },
];

let runBtn;
let sectorBtns = [];

/**
 * Renders the sector selector section into `container`.
 * @param {HTMLElement} container
 * @param {{ onRun: Function }} callbacks
 */
export function render(container, { onRun }) {
  const section = document.createElement('section');
  section.className = 'selector-section';

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = '01 / Select a market sector to analyze';

  const grid = document.createElement('div');
  grid.className = 'sector-grid';

  SECTORS.forEach(({ ticker, name, display }) => {
    const btn = document.createElement('button');
    btn.className = 'sector-btn';
    btn.dataset.sector = name;
    btn.innerHTML = `<span class="ticker">${ticker}</span><span class="name">${display ?? name}</span>`;
    btn.addEventListener('click', () => _handleSelect(btn, section));
    grid.appendChild(btn);
    sectorBtns.push(btn);
  });

  const diagram = _buildDiagram();

  const timeHint = document.createElement('div');
  timeHint.className = 'time-hint';
  timeHint.textContent = '6 agent tasks  ·  ~5 min to results';

  runBtn = document.createElement('button');
  runBtn.className = 'run-btn';
  runBtn.id = 'runBtn';
  runBtn.disabled = true;
  runBtn.innerHTML = '<span>Run Analysis</span><span>-&gt;</span>';
  runBtn.addEventListener('click', () => {
    trackRunAnalysis(getSelectedSector());
    onRun();
  });

  section.append(label, grid, diagram, timeHint, runBtn);
  container.appendChild(section);
}

function _buildDiagram() {
  const wrap = document.createElement('div');
  wrap.className = 'pipeline-diagram';

  DIAGRAM_NODES.forEach((node, i) => {
    if (i > 0) {
      const connector = document.createElement('div');
      connector.className = 'pipeline-connector';
      connector.textContent = '→';
      wrap.appendChild(connector);
    }

    const el = document.createElement('div');
    el.className = node.critic ? 'pipeline-node pipeline-node--critic' : 'pipeline-node';
    el.innerHTML = `
      <div class="pipeline-node-id">${node.id}</div>
      <div class="pipeline-node-name">${node.name}</div>
      ${node.critic ? '<div class="pipeline-node-badge">Adversarial Quality Gate</div>' : ''}
      <div class="pipeline-node-role">${node.role}</div>`;
    wrap.appendChild(el);
  });

  return wrap;
}

function _handleSelect(btn, section) {
  if (getIsRunning()) return;
  section.querySelectorAll('.sector-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  setSelectedSector(btn.dataset.sector);
  trackSectorSelect(btn.dataset.sector);
  runBtn.disabled = false;
}

export function disableControls() {
  runBtn.disabled = true;
  sectorBtns.forEach(b => (b.disabled = true));
}

export function enableControls(label = 'Run Analysis') {
  runBtn.disabled = false;
  runBtn.querySelector('span').textContent = label;
  sectorBtns.forEach(b => (b.disabled = false));
}

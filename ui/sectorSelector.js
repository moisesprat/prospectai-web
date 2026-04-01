/* ============================================================
   SECTOR SELECTOR
   Renders the sector grid and Run button, manages selection state.
   ============================================================ */

import { SECTORS } from './data.js';
import { getIsRunning, setSelectedSector } from './state.js';

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

  runBtn = document.createElement('button');
  runBtn.className = 'run-btn';
  runBtn.id = 'runBtn';
  runBtn.disabled = true;
  runBtn.innerHTML = '<span>Run Analysis</span><span>-&gt;</span>';
  runBtn.addEventListener('click', onRun);

  section.append(label, grid, runBtn);
  container.appendChild(section);
}

function _handleSelect(btn, section) {
  if (getIsRunning()) return;
  section.querySelectorAll('.sector-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  setSelectedSector(btn.dataset.sector);
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

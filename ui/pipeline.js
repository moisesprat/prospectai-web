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

  await new Promise((resolve) => {
    const url    = `${BACKEND_URL}/api/analyze?sector=${encodeURIComponent(sector)}`;
    const source = new EventSource(url);

    function finish() {
      source.close();
      clearInterval(metaInterval);
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
          const pct = PROGRESS_ON_START[idx] ?? 0;
          panel.activateAgent(idx, 'Initializing…');
          panel.setProgress(pct, panel.getStatusMessage(pct));
          break;
        }

        case 'agent_step': {
          panel.setAgentStep(event.agent_index, formatStep(event));
          break;
        }

        case 'agent_done': {
          const idx = event.agent_index;
          const pct = PROGRESS_ON_DONE[idx] ?? 99;
          panel.setProgress(pct, panel.getStatusMessage(pct));
          // Type the summary, then mark card green — fire-and-forget so the
          // next agent_start event can activate the next card in parallel.
          panel.typeAgentOutput(idx, event.summary || 'Analysis complete.')
               .then(() => panel.completeAgent(idx));
          break;
        }

        case 'pipeline_done': {
          panel.setProgress(100, 'Pipeline complete. Generating report…');
          const html = renderReport(event.report);
          setTimeout(() => {
            report.show(sector, startTime, html);
            finish();
          }, 800);
          break;
        }

        case 'error': {
          panel.setProgress(0, `Error: ${event.message}`);
          finish();
          break;
        }
      }
    };

    source.onerror = () => {
      panel.setProgress(0, 'Connection failed. Check backend and try again.');
      finish();
    };
  });
}

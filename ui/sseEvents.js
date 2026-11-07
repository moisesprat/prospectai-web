/* ============================================================
   SSE EVENTS  (pure, DOM-free, safe in browser and Node)
   Parses and interprets the backend's SSE data events. The tables
   below mirror the backend-owned contract in
   tests/fixtures/sse_events.json (TEST-02, D-10); the web tests
   fail when they drift from the committed copy of that fixture.

   A client_run_id is minted once per click on Run (SEC-07, D-08)
   and is never reused: the server refuses a repeated id.
   ============================================================ */

// ── Contract tables (equal to the fixture) ──────────────────
export const FIXTURE_VERSION = 1;

export const EVENT_KEYS = Object.freeze({
  agent_start:   Object.freeze(['agent_index', 'agent_name', 'model']),
  agent_step:    Object.freeze(['agent_index', 'step_type']),
  agent_done:    Object.freeze(['agent_index', 'summary']),
  pipeline_done: Object.freeze(['report', 'run_id']),
  error:         Object.freeze(['message']),
});

// Error codes the server uses to refuse a run (D-07). Shown, never retried.
export const REJECTION_CODES = Object.freeze(['rate_limited', 'busy', 'budget_exhausted', 'duplicate_run']);

// ── Parsing ─────────────────────────────────────────────────

/**
 * Parses one SSE data string. Returns the event object, or null when the
 * data is not JSON, not an object, of an unknown type, or lacks a key the
 * contract requires for its type.
 */
export function parseSseEvent(raw) {
  let event;
  try { event = JSON.parse(raw); } catch { return null; }
  if (event === null || typeof event !== 'object' || Array.isArray(event)) return null;
  if (typeof event.type !== 'string' || !Object.hasOwn(EVENT_KEYS, event.type)) return null;
  for (const key of EVENT_KEYS[event.type]) {
    if (!Object.hasOwn(event, key)) return null;
  }
  return event;
}

/** True for an error event the server sent to refuse a run. */
export function isRejection(event) {
  return !!event && event.type === 'error' && REJECTION_CODES.includes(event.code);
}

/** Status-line text for an error event: refusals show the server message as is. */
export function errorStatusText(event) {
  return isRejection(event) ? event.message : `Error: ${event.message}`;
}

/**
 * Formats an AgentAction step into a display string (tool calls only).
 * Finish and unknown steps are handled inline in the event handler.
 */
export function formatActionStep(event) {
  const tool    = event.tool    ? `Calling tool: ${event.tool}` : '';
  const thought = event.thought || '';
  return [thought, tool].filter(Boolean).join('\n') || 'Running…';
}

// ── Request side ────────────────────────────────────────────

/** A fresh id for one click on Run. Global crypto.randomUUID (https browsers, Node 22). */
export function newClientRunId() {
  return crypto.randomUUID();
}

/** Builds the /api/analyze URL with every value percent-encoded. */
export function buildAnalyzeUrl(base, sector, riskProfile, clientRunId) {
  return `${base}/api/analyze?sector=${encodeURIComponent(sector)}`
    + `&risk_profile=${encodeURIComponent(riskProfile)}`
    + `&client_run_id=${encodeURIComponent(clientRunId)}`;
}

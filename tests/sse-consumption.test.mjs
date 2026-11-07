/* ============================================================
   SSE CONSUMPTION TESTS  (Node-only, node:test)
   TEST-02 / D-10: the SPA's SSE parsing is checked against the
   committed copy of the backend-owned contract fixture
   (tests/fixtures/sse_events.json). The byte comparison with the
   backend copy runs in backend CI and in scripts/check-sse-fixture.mjs.
   No DOM access; imports the pure modules directly. Run: npm test
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  FIXTURE_VERSION, EVENT_KEYS, REJECTION_CODES, parseSseEvent, isRejection,
  errorStatusText, formatActionStep, newClientRunId, buildAnalyzeUrl,
} from '../ui/sseEvents.js';
import { textWithCursorHTML } from '../ui/utils.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(here, 'fixtures', 'sse_events.json'), 'utf8'));
const pipelineSrc = readFileSync(join(here, '..', 'ui', 'pipeline.js'), 'utf8');

// ─── pinned tables equal the fixture ───

test('EVENT_KEYS, REJECTION_CODES and FIXTURE_VERSION equal the fixture', () => {
  assert.deepEqual(EVENT_KEYS, fixture.required_keys);
  assert.deepEqual([...REJECTION_CODES], fixture.rejection_codes);
  assert.equal(FIXTURE_VERSION, fixture.fixture_version);
});

test('refusal frame: one data event, no reconnection delay', () => {
  assert.equal(fixture.rejection_stream.retry_field, false);
  for (const code of fixture.rejection_codes) {
    const stream = fixture.streams[`rejected_${code}`];
    assert.ok(stream, `fixture has rejected_${code}`);
    assert.equal(stream.length, fixture.rejection_stream.data_events);
  }
});

// ─── parseSseEvent ───

test('every fixture event round-trips through parseSseEvent', () => {
  const all = [...Object.values(fixture.streams).flat(), ...fixture.hostile];
  assert.ok(all.length > 0);
  for (const ev of all) {
    assert.deepEqual(parseSseEvent(JSON.stringify(ev)), ev);
  }
});

test('malformed, non-object, unknown and incomplete data is ignored', () => {
  assert.equal(parseSseEvent('{not json'), null);
  assert.equal(parseSseEvent('42'), null);
  assert.equal(parseSseEvent('null'), null);
  assert.equal(parseSseEvent('[]'), null);
  assert.equal(parseSseEvent(undefined), null);
  assert.equal(parseSseEvent(JSON.stringify({ type: 'surprise', message: 'x' })), null);
  assert.equal(parseSseEvent(JSON.stringify({ type: 'agent_done', agent_index: 0 })), null);
  assert.equal(parseSseEvent(JSON.stringify({ agent_index: 0 })), null);
});

// ─── refusals and error text ───

test('refusals are recognised and shown with the server message unchanged', () => {
  for (const code of fixture.rejection_codes) {
    const [event] = fixture.streams[`rejected_${code}`];
    assert.equal(isRejection(event), true, code);
    assert.equal(errorStatusText(event), event.message);
  }
});

test('pipeline errors get the Error: prefix; unknown codes are not refusals', () => {
  const errorEvent = fixture.streams.pipeline_error.find((e) => e.type === 'error');
  assert.equal(isRejection(errorEvent), false);
  assert.equal(errorStatusText(errorEvent), 'Error: boom');
  const odd = { type: 'error', code: 'something_else', message: 'm' };
  assert.equal(isRejection(odd), false);
  assert.equal(errorStatusText(odd), 'Error: m');
  assert.equal(isRejection({ type: 'agent_done', code: 'busy' }), false);
});

// ─── action step text ───

test('formatActionStep joins thought and tool on separate lines', () => {
  const action = fixture.streams.success.find((e) => e.step_type === 'action');
  assert.equal(formatActionStep(action), 'Flow: fetching market data\nCalling tool: fetch_market_data');
  assert.equal(formatActionStep({}), 'Running…');
});

// ─── URL and id ───

test('buildAnalyzeUrl encodes each value and carries the run id', () => {
  const id = 'abc';
  assert.equal(
    buildAnalyzeUrl('https://b.example', 'Consumer Discretionary', 'conservative', id),
    'https://b.example/api/analyze?sector=Consumer%20Discretionary&risk_profile=conservative&client_run_id=abc',
  );
  const hostile = buildAnalyzeUrl('', 'a&b=c', 'x y', 'i/d');
  assert.ok(hostile.includes('sector=a%26b%3Dc'));
  assert.ok(hostile.includes('risk_profile=x%20y'));
  assert.ok(hostile.includes('client_run_id=i%2Fd'));
});

test('newClientRunId is a lowercase UUID4 and never repeats', () => {
  const a = newClientRunId();
  const b = newClientRunId();
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(a, b);
});

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Runs fn with globalThis.crypto replaced, then restores the original descriptor. */
function withCrypto(replacement, fn) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: replacement, configurable: true, writable: true });
  try { fn(); } finally { Object.defineProperty(globalThis, 'crypto', original); }
}

test('newClientRunId falls back to a UUID4 when crypto.randomUUID is unavailable (WR-04)', () => {
  const getRandomValues = (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; };
  for (const replacement of [{ getRandomValues }, {}, undefined]) {
    withCrypto(replacement, () => {
      const ids = new Set();
      for (let i = 0; i < 50; i++) {
        const id = newClientRunId();
        assert.match(id, UUID4);
        ids.add(id);
      }
      assert.equal(ids.size, 50);
    });
  }
});

// ─── hostile events stay inert ───

test('hostile event text is inert through the escaping renderer', () => {
  for (const ev of fixture.hostile) {
    const parsed = parseSseEvent(JSON.stringify(ev));
    const fragments = [];
    if (parsed.type === 'agent_step' && parsed.step_type === 'action') fragments.push(textWithCursorHTML(formatActionStep(parsed)));
    if (parsed.preview) fragments.push(textWithCursorHTML(parsed.preview));
    if (parsed.type === 'error') fragments.push(textWithCursorHTML(errorStatusText(parsed)));
    for (const html of fragments) {
      for (const needle of ['<img', '<script', '<svg', '<b>']) {
        assert.ok(!html.includes(needle), `${needle} survived in ${html}`);
      }
    }
  }
});

// ─── pipeline wiring (static) ───

test('pipeline.js mints the run id once, inside runAnalysis', () => {
  const calls = pipelineSrc.match(/newClientRunId\(\)/g) ?? [];
  assert.equal(calls.length, 1);
  const fnStart = pipelineSrc.indexOf('export async function runAnalysis');
  assert.ok(fnStart >= 0);
  assert.ok(pipelineSrc.indexOf('newClientRunId()') > fnStart);
  assert.equal((pipelineSrc.match(/parseSseEvent\(e\.data\)/g) ?? []).length, 1);
});

test('pipeline.js mints the run id before locking the Run button (WR-04)', () => {
  const fnStart = pipelineSrc.indexOf('export async function runAnalysis');
  const mint = pipelineSrc.indexOf('newClientRunId()', fnStart);
  const lock = pipelineSrc.indexOf('setIsRunning(true)', fnStart);
  assert.ok(mint > fnStart && lock > fnStart);
  assert.ok(mint < lock, 'newClientRunId() must run before setIsRunning(true) so a throw cannot leave the button locked');
});

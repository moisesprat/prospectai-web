/* ============================================================
   ESCAPE TESTS  (Node-only, node:test)
   SEC-06: hostile payloads through every DOM-free renderer must
   come out as literal text. Run: npm test
   No DOM access; imports the pure-string renderers directly.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, safeUrl } from '../ui/formatters.js';
import { renderReportCardHTML } from '../ui/reportsRender.js';

// Fails when a hostile fragment survives as live markup or an injected attribute.
function assertInert(html) {
  for (const needle of ['<img', '<script', '<svg', '" on', "' on"]) {
    assert.ok(!html.includes(needle), `output must not contain ${JSON.stringify(needle)}: ${html}`);
  }
}

// ─── escapeHtml ───

test('escapeHtml escapes all five characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
});

test('escapeHtml maps null and undefined to empty string', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

// ─── safeUrl ───

test('safeUrl rejects script, data, protocol-relative, http and non-string values', () => {
  for (const bad of [null, undefined, 42, '', 'javascript:alert(1)', ' JavaScript:alert(1)',
    'data:text/html,x', '//evil.example/x', 'http://example.com']) {
    assert.equal(safeUrl(bad), '#', `expected # for ${JSON.stringify(bad)}`);
  }
});

test('safeUrl keeps https URLs and same-origin paths unchanged', () => {
  for (const ok of ['https://reports.prospect-ai.moisesprat.dev/report.html?id=1',
    '/report.html?id=1', 'report.html?id=1']) {
    assert.equal(safeUrl(ok), ok);
  }
});

// ─── reportsRender ───

test('renderReportCardHTML neutralises hostile report records', () => {
  const html = renderReportCardHTML({
    run_id: 'x" onmouseover="alert(1)',
    sector: '<img src=x onerror=alert(1)>',
    prospectai_version: '<script>alert(2)</script>',
    ticker_count: '7<b>',
    long_buy_count: null,
    run_at: '2026-01-02T00:00:00Z',
  }, 'https://reports.example');
  assertInert(html);
  assert.ok(!html.includes('" onmouseover='), 'attribute injection must not survive');
  assert.ok(html.includes(encodeURIComponent('x" onmouseover="alert(1)')), 'run id is percent-encoded');
  assert.ok(html.includes('>0 stocks<'), 'non-number ticker_count renders as 0');
  assert.ok(html.includes('>0 LONG-BUY<'), 'null long_buy_count renders as 0');
});

test('renderReportCardHTML keeps normal data readable', () => {
  const html = renderReportCardHTML({
    run_id: 'abc123', sector: 'Technology', prospectai_version: '1.9.2',
    ticker_count: 8, long_buy_count: 3, run_at: '2026-01-02T00:00:00Z',
  }, 'https://reports.example');
  assert.ok(html.includes('href="https://reports.example/report.html?id=abc123"'));
  assert.ok(html.includes('Technology'));
  assert.ok(html.includes('v1.9.2'));
  assert.ok(html.includes('>8 stocks<'));
  assert.ok(html.includes('>3 LONG-BUY<'));
});

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
import {
  buildLegendHTML, renderRiskDonutWrapHTML, renderSectorBarListHTML,
  renderDecisionsDonutPieces, renderHistoryRowsHTML,
} from '../ui/statsRender.js';
import { renderReleaseNotesHTML } from '../ui/changelogRender.js';
import { renderReport } from '../ui/reportRenderer.js';

const XSS = '<img src=x onerror=alert(1)>';

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

// ─── statsRender ───

test('buildLegendHTML and the risk donut escape slice labels', () => {
  assertInert(buildLegendHTML([{ label: XSS, value: 1, colour: '#fff' }], 1));
  // The wrapper legitimately holds its own donut <svg>; only the hostile label must be inert.
  const wrap = renderRiskDonutWrapHTML({ [XSS]: 2 });
  assert.ok(!wrap.includes('<img'), 'hostile label must not become an element');
  assert.ok(wrap.includes('&lt;img'), 'label rendered as literal text');
});

test('renderSectorBarListHTML escapes the sector in text and title, counts are numbers', () => {
  const html = renderSectorBarListHTML({ '"><img src=x onerror=alert(1)>': 3, Tech: 'x<b>' });
  assertInert(html);
  assert.ok(!html.includes('title=""'), 'title attribute not broken out of');
  assert.ok(html.includes('>0</span>'), 'non-number count renders as 0');
});

test('renderDecisionsDonutPieces escapes the centre label', () => {
  const pieces = renderDecisionsDonutPieces({ '<script>x</script>': { counts: { 'LONG-BUY': 1 }, total: 1 } }, '<script>x</script>');
  assertInert(pieces.centerHTML);
});

test('renderRiskDonutWrapHTML ignores prototype keys', () => {
  const html = renderRiskDonutWrapHTML({ constructor: 1, __proto__: 1, toString: 1 });
  assert.ok(!html.includes('function'), 'no Object.prototype values leak into the markup');
});

test('renderHistoryRowsHTML links script URLs to # and keeps https URLs', () => {
  const rows = renderHistoryRowsHTML([
    { ticker: 'A', roi_pct: 1, report_url: 'javascript:alert(1)' },
    { ticker: 'B', roi_pct: 1, report_url: 'https://reports.example/report.html?id=1' },
  ]);
  assert.ok(rows.includes('href="#"'));
  assert.ok(!rows.includes('javascript:'));
  assert.ok(rows.includes('href="https://reports.example/report.html?id=1"'));
});

// ─── changelogRender ───

test('renderReleaseNotesHTML escapes version, date and bullets including the apostrophe', () => {
  const html = renderReleaseNotesHTML([{
    version: '1.0.0<script>', date: '2026-01-01"><img src=x onerror=1>', bullets: ["it's <b>"],
  }]);
  assertInert(html);
  assert.ok(html.includes('it&#39;s &lt;b&gt;'));
});

// ─── reportRenderer ───

test('renderReport escapes every position field and quotes', () => {
  const html = renderReport({
    risk_level: '<svg onload=1>',
    overall_strategy: '"><script>1</script>',
    positions: [{
      ticker: XSS, action: '__proto__', rationale: `"><script>2</script>`,
      entry_zone: '<img src=y onerror=2>',
      monitoring_triggers: ['<svg/onload=3>'], key_risks: ['" onclick="4'],
      review_frequency: 'daily"><img src=z>',
    }],
  });
  assertInert(html);
  assert.ok(!html.includes('" onclick='), 'quote escaped so attribute injection cannot survive');
  assert.ok(html.includes('color:var(--text-dim)'), '__proto__ action keeps the fallback colour');
});

/* ============================================================
   ESCAPE TESTS  (Node-only, node:test)
   SEC-06: hostile payloads through every DOM-free renderer must
   come out as literal text. Run: npm test
   No DOM access; imports the pure-string renderers directly.
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, safeUrl } from '../ui/formatters.js';
import { renderReportCardHTML, renderReportsGridHTML } from '../ui/reportsRender.js';
import {
  buildLegendHTML, renderRiskDonutWrapHTML, renderSectorBarListHTML,
  renderDecisionsDonutPieces, renderHistoryRowsHTML, renderBenchmarkSectionHTML,
} from '../ui/statsRender.js';
import { renderReleaseNotesHTML } from '../ui/changelogRender.js';
import { renderReport, renderMetrics } from '../ui/reportRenderer.js';
import { renderCards } from '../ui/recentWins.js';
import { renderEntryHTML } from '../ui/myReports.js';
import { typeOutput, textWithCursorHTML, CURSOR_HTML } from '../ui/utils.js';

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

// ─── utils (live-run agent cards, SEC-06 / T-03-22) ───

test('utils textWithCursorHTML escapes the text and appends only the cursor span', () => {
  const html = textWithCursorHTML(XSS);
  assert.equal(html, escapeHtml(XSS) + CURSOR_HTML);
  assert.ok(!html.includes('<img'), html);
  assert.equal(textWithCursorHTML(null), CURSOR_HTML);
});

test('utils typeOutput never assigns live markup in any frame and ends with the escaped text', async () => {
  const frames = [];
  const el = { set innerHTML(v) { frames.push(v); } };
  const text = '<script>alert(1)</script>\n"x" & \'y\'';
  await typeOutput(el, text, 0);
  assert.ok(frames.length > text.length);
  for (const f of frames) {
    assert.ok(!f.includes('<script'), `frame must not contain <script: ${f}`);
  }
  assert.equal(frames[frames.length - 1], escapeHtml(text));
});

test('utils typeOutput frames contain only complete entities when a slice ends mid-character', async () => {
  const frames = [];
  const el = { set innerHTML(v) { frames.push(v); } };
  await typeOutput(el, 'a&b<c', 0);
  for (const f of frames) {
    const stripped = f.replace(CURSOR_HTML, '');
    assert.ok(!/&(?!amp;|lt;|gt;|quot;|#39;)/.test(stripped), `partial entity in frame: ${f}`);
  }
});

// ─── recentWins (landing strip, SEC-06 / T-03-23) ───

test('recentWins renderCards is inert for hostile strings and non-numeric values and does not throw', () => {
  const html = renderCards([{
    ticker: XSS, recommended_action: '"><script>', sector: '<b>',
    roi_pct: 'NaN', trigger_price: null, current_price: 'x', recommended_at: 'not-a-date',
  }]);
  assertInert(html);
  assert.ok(!html.includes('<b>'), html);
  assert.ok(!html.includes('NaN'), html);
  assert.ok(html.includes('<div class="rw-roi">—</div>'), html);
  assert.ok(html.includes('<div class="rw-price">—</div>'), html);
  assert.ok(html.includes('<span class="rw-date">· —</span>'), html);
});

test('recentWins renderCards keeps a normal win readable', () => {
  const html = renderCards([{
    ticker: 'NVDA', recommended_action: 'LONG-BUY', sector: 'Technology',
    roi_pct: 12.345, trigger_price: 100, current_price: 112.5, recommended_at: '2026-03-05T10:00:00Z',
  }]);
  assert.ok(html.includes('NVDA') && html.includes('LONG-BUY') && html.includes('Technology'));
  assert.ok(html.includes('+12.3%'), html);
  assert.ok(html.includes('$100.00') && html.includes('$112.50'), html);
  assert.ok(html.includes('05-Mar-26'), html);
});

// ─── myReports (localStorage entries, SEC-06 / T-03-23) ───

test('myReports renderEntryHTML links script URLs to # and is inert', () => {
  const html = renderEntryHTML({ report_url: 'javascript:alert(1)', sector: XSS, run_at: null });
  assertInert(html);
  assert.ok(html.includes('href="#"'), html);
  assert.ok(!html.includes('javascript:'), html);
});

test('myReports renderEntryHTML keeps an https report_url and escapes quotes in it', () => {
  const ok = renderEntryHTML({ report_url: 'https://reports.prospect-ai.moisesprat.dev/report.html?id=1', sector: 'Energy', run_at: '2026-03-05T10:00:00Z' });
  assert.ok(ok.includes('href="https://reports.prospect-ai.moisesprat.dev/report.html?id=1"'), ok);
  assert.ok(ok.includes('Energy') && ok.includes('05-Mar-26'), ok);
  const quoted = renderEntryHTML({ report_url: 'https://x.example/a"onmouseover="1', sector: null, run_at: null });
  assert.ok(!quoted.includes('"onmouseover'), quoted);
});

// ─── Sink inventory hostile paths (SEC-06 / plan 03-09, named in innerhtml-inventory.test.mjs) ───

test('stats renderDecisionsDonutPieces hostile key and counts', () => {
  const key = '"><svg onload=alert(1)>';
  const pieces = renderDecisionsDonutPieces({
    [key]: { counts: { 'LONG-BUY': 2, '<img src=x onerror=1>': 3 }, total: 5 },
  }, key);
  assertInert(pieces.svgInner);
  assertInert(pieces.centerHTML);
  assertInert(pieces.legendHTML);
  assert.ok(pieces.centerHTML.includes('&lt;svg'), 'sector key rendered as literal text');
  assert.ok(!pieces.legendHTML.includes('onerror'), 'unknown action never becomes a legend label');
  assert.ok(pieces.legendHTML.includes('LONG-BUY'), 'known action keeps its label');
});

test('stats renderBenchmarkSectionHTML hostile sector', () => {
  const row = sector => ({
    sector, roi_pct: 5,
    spy_trigger_price: 100, spy_current_price: 104,
    sector_etf_trigger_price: 50, sector_etf_current_price: 52,
  });
  const html = renderBenchmarkSectionHTML([
    row('<img src=x onerror=alert(1)>'),
    row('"><script>alert(2)</script>'),
  ]);
  assertInert(html);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'), 'sector title is literal text');
  assert.ok(html.includes('benchmark-group-title'), 'groups still render');
});

test('stats renderHistoryRowsHTML hostile row', () => {
  const html = renderHistoryRowsHTML([{
    ticker: XSS, sector: '<script>alert(1)</script>', recommended_at: '2026-01-02T00:00:00Z',
    trigger_price: 10, current_price: 11, roi_pct: 10, prospectai_version: '"><img src=y>',
    report_url: 'javascript:alert(1)',
  }]);
  assertInert(html);
  assert.ok(html.includes('href="#"'), 'script URL becomes #');
  assert.ok(!html.includes('javascript:'), html);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'), 'ticker is literal text');
});

test('reports renderReportsGridHTML hostile entries', () => {
  const html = renderReportsGridHTML([
    { run_id: '"><img src=x onerror=1>', sector: 'A', prospectai_version: '1', run_at: null },
    { run_id: 'ok', sector: '<script>alert(1)</script>', prospectai_version: '1', run_at: null },
    { run_id: 'ok2', sector: 'B', prospectai_version: '<svg onload=1>', run_at: null },
  ], 'https://reports.example');
  assertInert(html);
  assert.equal(html.split('class="report-card"').length - 1, 3, 'three cards rendered');
});

test('report renderReport hostile summary fields', () => {
  const full = renderReport({
    risk_level: '<img src=x onerror=1>',
    overall_strategy: '"><script>alert(1)</script>',
    positions: [{ ticker: 'A', action: 'MONITOR', review_frequency: '<svg/onload=1>_weekly' }],
  });
  assertInert(full);
  const viaSummary = renderReport({
    positions: [],
    portfolio_summary: { portfolio_rationale: '<img src=x onerror=2>' },
  });
  assertInert(viaSummary);
  assert.ok(viaSummary.includes('&lt;img src=x onerror=2&gt;'), 'portfolio_rationale is literal text');
  const legacy = renderReport({
    stock_recommendations: [{ ticker: XSS, recommendation: '"><script>3</script>', rationale: '<img src=q onerror=4>' }],
  });
  assertInert(legacy);
  const parseError = renderReport({ parse_error: true, raw_output: '</pre><script>alert(5)</script><img src=x onerror=5>' });
  assertInert(parseError);
  assert.ok(parseError.includes('&lt;/pre&gt;'), 'raw_output cannot close the pre element');
});

test('report renderMetrics hostile names', () => {
  const html = renderMetrics({
    pipeline_elapsed_sec: 12,
    totals: { total_tokens: 10, input_tokens: 5, cached_tokens: 1 },
    phases: [{ name: XSS, status: '"><script>alert(1)</script>', elapsed_sec: 1, tools: [] }],
    by_model: { [XSS]: { input_tokens: 1, output_tokens: 1, cached_tokens: 0, total_tokens: 2 } },
    tool_calls: [],
  });
  assertInert(html);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'), 'phase and model names are literal text');
});

/* ============================================================
   INNERHTML INVENTORY  (Node-only, node:test)
   SEC-06, research Pitfall 10: ESLint cannot see template-literal
   HTML sinks, so every innerHTML / outerHTML assignment and
   insertAdjacentHTML call in app.js and ui/*.js is listed here
   with the source of each value it interpolates.

   Source tags:  static | constant | client | backend | llm | storage
   - backend, llm and storage sources must name hostileTests: exact
     titles of tests in tests/escape.test.mjs that render markup in
     those values and assert the output is inert.
   - A sink added, removed or edited without updating REVIEWED fails.
   Known limit: a sink is pinned by its own line, so a multi-line
   template whose body changes (same first line) is not detected;
   re-read the whole template whenever you touch such a site.
   No DOM access. Run: npm test
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_TAGS = ['static:', 'constant:', 'client:', 'backend:', 'llm:', 'storage:'];
const UNTRUSTED_TAGS = ['backend:', 'llm:', 'storage:'];

// Hostile-test titles (all live in tests/escape.test.mjs).
const T_DONUT_PIECES   = 'stats renderDecisionsDonutPieces hostile key and counts';
const T_BENCHMARK      = 'stats renderBenchmarkSectionHTML hostile sector';
const T_HISTORY        = 'stats renderHistoryRowsHTML hostile row';
const T_GRID           = 'reports renderReportsGridHTML hostile entries';
const T_REPORT         = 'report renderReport hostile summary fields';
const T_STATS_TYPES    = 'stats hostile types do not throw';
const T_REPORT_TYPES   = 'report hostile types do not throw';
const T_METRICS        = 'report renderMetrics hostile names';
const T_SECTOR_BARS    = 'renderSectorBarListHTML escapes the sector in text and title, counts are numbers';
const T_RISK_LEGEND    = 'buildLegendHTML and the risk donut escape slice labels';
const T_RISK_PROTO     = 'renderRiskDonutWrapHTML ignores prototype keys';
const T_REPORT_CARD    = 'renderReportCardHTML neutralises hostile report records';
const T_CURSOR         = 'utils textWithCursorHTML escapes the text and appends only the cursor span';
const T_TYPE_OUTPUT    = 'utils typeOutput never assigns live markup in any frame and ends with the escaped text';
const T_RECENT_WINS    = 'recentWins renderCards is inert for hostile strings and non-numeric values and does not throw';
const T_MY_REPORTS     = 'myReports renderEntryHTML links script URLs to # and is inert';

// Repo-relative file -> one entry per sink site (same line twice = two entries).
const REVIEWED = {
  'ui/analytics.js': [
    { sink: 'widgetEl.innerHTML = `',
      sources: ['constant: SKELETON_SPAN markup literal; the rest of the template is static'],
      hostileTests: [] },
    { sink: 'versionEl.innerHTML = SKELETON_SPAN;',
      sources: ['constant: SKELETON_SPAN markup literal'],
      hostileTests: [] },
  ],

  'ui/executionPanel.js': [
    { sink: 'header.innerHTML = `',
      sources: ['static: no interpolation'],
      hostileTests: [] },
    { sink: 'progressWrap.innerHTML = `',
      sources: ['static: no interpolation'],
      hostileTests: [] },
    { sink: 'card.innerHTML = `',
      sources: ['constant: AGENT_DEFS id, name, role from executionPanel.js'],
      hostileTests: [] },
    { sink: 'outputEls[i].innerHTML = html;',
      sources: ['llm: agent_start text via activateAgent -> textWithCursorHTML (escapeHtml + cursor span)'],
      hostileTests: [T_CURSOR] },
    { sink: 'outputEls[i].innerHTML = html;',
      sources: ['llm: agent_step thought and preview via setAgentStep -> textWithCursorHTML (escapeHtml + cursor span)'],
      hostileTests: [T_CURSOR] },
  ],

  'ui/myReports.js': [
    { sink: "listEl.innerHTML = '';",
      sources: ['static: clears the list'],
      hostileTests: [] },
    { sink: `listEl.innerHTML = '<li class="my-reports-empty">No saved reports yet.</li>';`,
      sources: ['static: no interpolation'],
      hostileTests: [] },
    { sink: 'li.innerHTML = renderEntryHTML(entry);',
      sources: ['storage: localStorage report_url, sector, run_at via renderEntryHTML (escapeHtml(safeUrl), escapeHtml, fmtDate)'],
      hostileTests: [T_MY_REPORTS] },
    { sink: 'panelEl.innerHTML = `',
      sources: ['static: no interpolation'],
      hostileTests: [] },
  ],

  'ui/recentWins.js': [
    { sink: 'skeleton.innerHTML = `',
      sources: ['static: no interpolation'],
      hostileTests: [] },
    { sink: 'section.innerHTML = `',
      sources: ['backend: GET /api/long-buy-wins ticker, action, sector, roi, prices, date via renderCards (escapeHtml, finite numbers)'],
      hostileTests: [T_RECENT_WINS] },
  ],

  'ui/report.js': [
    { sink: 'reportHeader.innerHTML = `',
      sources: ['static: no interpolation'],
      hostileTests: [] },
    { sink: 'reportMetaEl.innerHTML =',
      sources: ['client: new Date().toISOString() and integer minutes and seconds from Date.now() minus startTime'],
      hostileTests: [] },
    { sink: 'reportBodyEl.innerHTML = html ?? REPORT_TEMPLATES[sector] ?? REPORT_TEMPLATES.default;',
      sources: [
        'backend: pipeline_done.report via pipeline.js renderReport(event.report) (escapeHtml throughout)',
        'constant: REPORT_TEMPLATES fallbacks from data.js keyed by the SPA sector constant',
      ],
      hostileTests: [T_REPORT, T_REPORT_TYPES] },
    { sink: `reportBodyEl.insertAdjacentHTML('beforeend', renderMetrics(metrics));`,
      sources: ['backend: pipeline_done.metrics phase names, statuses, model keys, tool names via renderMetrics (escapeHtml)'],
      hostileTests: [T_METRICS] },
  ],

  'ui/reportViewer.js': [
    { sink: 'body.innerHTML = renderReport(report);',
      sources: ['backend: GET /api/report/{id} result (or top level) via renderReport (escapeHtml throughout)'],
      hostileTests: [T_REPORT, T_REPORT_TYPES] },
    { sink: `body.insertAdjacentHTML('beforeend', renderMetrics(metrics));`,
      sources: ['backend: GET /api/report/{id} execution_metrics via renderMetrics (escapeHtml)'],
      hostileTests: [T_METRICS] },
  ],

  'ui/reportsPage.js': [
    { sink: 'gridEl.innerHTML   = renderReportsGridHTML(reports, window.location.origin);',
      sources: ['backend: GET /api/reports run_id, sector, version, counts, run_at via renderReportCardHTML (escapeHtml, encodeURIComponent, finite counts)',
        'client: window.location.origin'],
      hostileTests: [T_GRID, T_REPORT_CARD] },
  ],

  'ui/sectorSelector.js': [
    { sink: 'btn.innerHTML = `<span class="ticker">${ticker}</span><span class="name">${display ?? name}</span>`;',
      sources: ['constant: SECTORS ticker, name, display from data.js'],
      hostileTests: [] },
    { sink: 'btn.innerHTML = `<span class="risk-btn-label">${btnLabel}</span><span class="risk-btn-hint">${hint}</span>`;',
      sources: ['constant: local risk-profile literal list (label, hint)'],
      hostileTests: [] },
    { sink: `runBtn.innerHTML = '<span>Run Analysis</span><span>-&gt;</span>';`,
      sources: ['static: no interpolation'],
      hostileTests: [] },
    { sink: 'el.innerHTML = `',
      sources: ['constant: DIAGRAM_NODES id, name, role, critic flag from sectorSelector.js'],
      hostileTests: [] },
  ],

  'ui/stats.js': [
    { sink: 'sectorEl.innerHTML = renderSectorBarListHTML(data.by_sector);',
      sources: ['backend: GET /api/analytics by_sector keys and counts via renderSectorBarListHTML (escapeHtml, finite count)'],
      hostileTests: [T_SECTOR_BARS] },
    { sink: 'riskWrap.innerHTML = renderRiskDonutWrapHTML(data.by_risk_profile);',
      sources: ['backend: GET /api/analytics by_risk_profile keys and counts via renderRiskDonutWrapHTML (escapeHtml, hasOwn label and colour tables)'],
      hostileTests: [T_RISK_LEGEND, T_RISK_PROTO, T_STATS_TYPES] },
    { sink: 'svgEl.innerHTML      = svgInner;',
      sources: ['backend: GET /api/analytics action_breakdown counts via renderDecisionsDonutPieces (numbers and ACTION_COLOURS constants only)'],
      hostileTests: [T_DONUT_PIECES, T_STATS_TYPES] },
    { sink: 'centerEl.innerHTML   = centerHTML;',
      sources: ['backend: action_breakdown sector key (the filter value) via renderDecisionsDonutPieces (escapeHtml)'],
      hostileTests: [T_DONUT_PIECES, T_STATS_TYPES] },
    { sink: 'legendEl.innerHTML   = legendHTML;',
      sources: ['backend: action_breakdown counts via buildLegendHTML (ACTION_ORDER labels, escapeHtml, numeric percentages)'],
      hostileTests: [T_DONUT_PIECES, T_STATS_TYPES] },
    { sink: `select.innerHTML = '<option value="__overall__">Overall</option>';`,
      sources: ['static: no interpolation (sector options are added through textContent)'],
      hostileTests: [] },
    { sink: `select.innerHTML = '<option value="__all__">All Sectors</option>';`,
      sources: ['static: no interpolation (sector options are added through textContent)'],
      hostileTests: [] },
    { sink: "tbody.innerHTML = '';",
      sources: ['static: clears the table body'],
      hostileTests: [] },
    { sink: 'tbody.innerHTML = renderHistoryRowsHTML(history);',
      sources: ['backend: GET /api/long-buy-history ticker, sector, date, prices, roi, version, report_url via renderHistoryRowsHTML (escapeHtml, safeUrl, fmtDate, fmtPrice)'],
      hostileTests: [T_HISTORY, T_STATS_TYPES] },
    { sink: "container.innerHTML = '';",
      sources: ['static: clears the benchmark container'],
      hostileTests: [] },
    { sink: 'container.innerHTML = html;',
      sources: ['backend: GET /api/long-buy-history sector, roi and benchmark prices via renderBenchmarkSectionHTML (escapeHtml on titles); ETF name from data.js getSectorEtf (constant)'],
      hostileTests: [T_BENCHMARK, T_STATS_TYPES] },
    { sink: "if (sectorEl.dataset.ssr !== '1') sectorEl.innerHTML = '';",
      sources: ['static: clears the sector chart'],
      hostileTests: [] },
    { sink: "if (riskWrap.dataset.ssr !== '1') riskWrap.innerHTML = '';",
      sources: ['static: clears the risk donut'],
      hostileTests: [] },
  ],

  'ui/utils.js': [
    { sink: "el.innerHTML = '';",
      sources: ['static: clears the element'],
      hostileTests: [] },
    { sink: 'el.innerHTML = escapeHtml(text.slice(0, i)) + CURSOR_HTML;',
      sources: ['llm: agent output text, escaped per frame from the raw slice, plus the CURSOR_HTML constant'],
      hostileTests: [T_TYPE_OUTPUT] },
    { sink: 'el.innerHTML = escapeHtml(text);',
      sources: ['llm: agent output text, fully escaped'],
      hostileTests: [T_TYPE_OUTPUT] },
  ],
};

// ─── helpers ───

const SINK_RE = /\.(?:innerHTML|outerHTML)\s*\+?=(?!=)|insertAdjacentHTML\(/;

function jsFiles() {
  const files = ['app.js'];
  for (const f of readdirSync(join(ROOT, 'ui')).sort()) {
    if (f.endsWith('.js')) files.push(`ui/${f}`);
  }
  return files;
}

function isCommentLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

// Sinks actually present in a file: [{ line, text }] with trimmed text.
function findSinks(file) {
  const found = [];
  readFileSync(join(ROOT, file), 'utf8').split('\n').forEach((raw, idx) => {
    const text = raw.trim();
    if (!text || isCommentLine(text)) return;
    if (SINK_RE.test(text)) found.push({ line: idx + 1, text });
  });
  return found;
}

const REVIEW_HINT = 'Review the site\'s escaping (every backend, LLM or stored value must reach the DOM through escapeHtml, safeUrl or textContent) and update REVIEWED in tests/innerhtml-inventory.test.mjs.';

// ─── tests ───

test('every HTML sink in app.js and ui/*.js has its own REVIEWED entry, and no entry is stale', () => {
  const problems = [];
  for (const file of jsFiles()) {
    const found = findSinks(file);
    const remaining = (REVIEWED[file] ?? []).map(e => e.sink);
    for (const { line, text } of found) {
      const at = remaining.indexOf(text);
      if (at === -1) {
        problems.push(`${file}:${line} has an unreviewed sink: ${text}`);
      } else {
        remaining.splice(at, 1);
      }
    }
    for (const stale of remaining) {
      problems.push(`${file} has a REVIEWED entry with no matching sink line (removed or edited?): ${stale}`);
    }
  }
  for (const file of Object.keys(REVIEWED)) {
    if (!jsFiles().includes(file)) problems.push(`REVIEWED names ${file}, which is not app.js or a ui/*.js file`);
  }
  assert.deepEqual(problems, [], `\n${problems.join('\n')}\n${REVIEW_HINT}`);
});

test('every REVIEWED entry names its sources with a known tag', () => {
  const problems = [];
  for (const [file, entries] of Object.entries(REVIEWED)) {
    for (const e of entries) {
      if (!Array.isArray(e.sources) || e.sources.length === 0) {
        problems.push(`${file}: ${e.sink} has no sources`);
        continue;
      }
      for (const s of e.sources) {
        if (!SOURCE_TAGS.some(tag => typeof s === 'string' && s.startsWith(tag))) {
          problems.push(`${file}: ${e.sink} has a source without a tag (${SOURCE_TAGS.join(' ')}): ${s}`);
        }
      }
    }
  }
  assert.deepEqual(problems, [], `\n${problems.join('\n')}\n${REVIEW_HINT}`);
});

test('every backend, llm or storage sink names hostile tests that exist in escape.test.mjs', () => {
  const escapeTests = readFileSync(join(ROOT, 'tests/escape.test.mjs'), 'utf8');
  const hasTitle = title => ["'", '"', '`'].some(q => escapeTests.includes(`test(${q}${title}${q}`));
  const problems = [];
  for (const [file, entries] of Object.entries(REVIEWED)) {
    for (const e of entries) {
      const untrusted = e.sources.some(s => UNTRUSTED_TAGS.some(tag => s.startsWith(tag)));
      const titles = e.hostileTests;
      if (!Array.isArray(titles)) {
        problems.push(`${file}: ${e.sink} has no hostileTests list`);
        continue;
      }
      if (untrusted && titles.length === 0) {
        problems.push(`${file}: ${e.sink} takes backend, llm or storage values but names no hostile test`);
      }
      if (!untrusted && titles.length > 0) {
        problems.push(`${file}: ${e.sink} has only static, constant or client sources, so hostileTests must be []`);
      }
      for (const title of titles) {
        if (!hasTitle(title)) {
          problems.push(`${file}: ${e.sink} names a hostile test missing from tests/escape.test.mjs: ${title}`);
        }
      }
    }
  }
  assert.deepEqual(problems, [], `\n${problems.join('\n')}\n${REVIEW_HINT}`);
});

test('escapeHtml in ui/formatters.js is the only HTML escape helper in the SPA', () => {
  const DEFINES = [
    /function\s+(?:escapeHtml|esc)\b/,
    /(?:const|let|var)\s+(?:escapeHtml|esc)\s*=/,
    /\.replace\(\s*\/&\/g/,
  ];
  const problems = [];
  for (const file of jsFiles()) {
    if (file === 'ui/formatters.js') continue;
    readFileSync(join(ROOT, file), 'utf8').split('\n').forEach((raw, idx) => {
      const text = raw.trim();
      if (isCommentLine(text)) return;
      if (DEFINES.some(re => re.test(text))) {
        problems.push(`${file}:${idx + 1} defines its own escaper: ${text}`);
      }
    });
  }
  const formatters = readFileSync(join(ROOT, 'ui/formatters.js'), 'utf8');
  assert.equal((formatters.match(/export function escapeHtml\b/g) ?? []).length, 1,
    'ui/formatters.js must export exactly one escapeHtml');
  assert.deepEqual(problems, [], `\n${problems.join('\n')}\nImport escapeHtml from ui/formatters.js instead of defining another escaper.`);
});

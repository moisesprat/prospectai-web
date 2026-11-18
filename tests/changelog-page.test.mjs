/* ============================================================
   CHANGELOG PAGE CONTRACT TEST  (Node-only, read-only, static, node:test)
   Phase 5 SPEC-02 (UI-SPEC S1): the changelog lists PyPI releases only,
   so its header and meta description must not promise web frontend
   entries, the date is readable (--text-dim), the title carries its
   declared line height, and the unused frontend tag rule is gone.
   Reads files only; no DOM access, no network. Run: npm test
   ============================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'changelog.html'), 'utf8');
const css = readFileSync(join(ROOT, 'styles', 'changelog.css'), 'utf8');

const META_DESCRIPTION =
  'Release history for ProspectAI, the multi-agent investment research system: ' +
  'per-version release notes for the agent pipeline, published to PyPI.';
const HEADER_PARAGRAPH =
  'Release notes for the <strong>prospectai</strong> package, the multi-agent engine behind this site ' +
  '(Market Analyst → Technical Analyst → Fundamental Analyst → Draft Strategist → Critic → Final Strategist). ' +
  'Pulled from PyPI automatically. Newest first.';

// The page with the bot-owned SSR region cut out.
function outsideSsr(text) {
  const start = text.indexOf('<!--SSR:pypi-releases-->');
  const end = text.indexOf('<!--/SSR-->');
  if (start === -1 || end === -1) return text;
  return text.slice(0, start) + text.slice(end);
}

function ruleBody(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(source);
  assert.ok(m, `rule ${selector} exists`);
  return m[1];
}

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '*.html', '*.js', '*.mjs', '*.css'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean);
  } catch {
    return ['changelog.html', 'styles/changelog.css', 'ui/changelogRender.js', 'scripts/build-static.mjs'];
  }
}

test('meta description equals the contract sentence', () => {
  const m = /<meta name="description" content="([^"]*)">/.exec(html);
  assert.ok(m, 'meta description present');
  assert.equal(m[1], META_DESCRIPTION);
});

test('header paragraph equals the contract text', () => {
  const m = /<header class="changelog-header">[\s\S]*?<p>([\s\S]*?)<\/p>/.exec(html);
  assert.ok(m, 'header paragraph present');
  assert.equal(m[1], HEADER_PARAGRAPH);
  assert.ok(m[1].includes('Pulled from PyPI automatically. Newest first.'));
});

test('no copy outside the SSR region promises the web frontend', () => {
  assert.ok(!/web frontend/i.test(outsideSsr(html)));
});

test('.changelog-date uses --text-dim and .changelog-title has line-height 1.2', () => {
  assert.match(ruleBody(css, '.changelog-date'), /color:\s*var\(--text-dim\)/);
  assert.match(ruleBody(css, '.changelog-title'), /line-height:\s*1\.2\s*;/);
});

test('no tracked file emits or styles changelog-tag--frontend', () => {
  const offenders = trackedFiles().filter((f) => {
    // This test file names the class on purpose.
    if (f.endsWith('tests/changelog-page.test.mjs')) return false;
    try {
      return readFileSync(join(ROOT, f), 'utf8').includes('changelog-tag--frontend');
    } catch {
      return false; // listed but deleted in the working tree
    }
  });
  assert.deepEqual(offenders, []);
});

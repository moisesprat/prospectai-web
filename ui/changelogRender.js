/* ============================================================
   CHANGELOG RENDER — parses the PyPI releases RSS feed and
   renders ProspectAI Module release entries as changelog markup.
   Pure functions, no fetch/IO — mirrors ui/statsRender.js.
   ============================================================ */

const MAX_RELEASES = 30;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractTag(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

export function parsePypiReleasesRSS(xmlText) {
  if (!xmlText) return [];

  const items = [];
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const version = extractTag(itemXml, 'title');
    const url = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    if (!version || !url || !pubDate) continue;

    const date = new Date(pubDate);
    if (Number.isNaN(date.getTime())) continue;

    items.push({ version, url, date: date.toISOString().slice(0, 10) });
  }

  return items;
}

export function renderPypiReleasesHTML(items) {
  if (!items || items.length === 0) return '';

  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const capped = sorted.slice(0, MAX_RELEASES);

  return capped
    .map(({ version, url, date }) => `
      <article class="changelog-entry">
        <time class="changelog-date" datetime="${date}">${date}</time>
        <div class="changelog-entry-body">
          <span class="changelog-tag changelog-tag--module">ProspectAI Module</span>
          <h2 class="changelog-title">Release <a href="${escapeHtml(url)}" target="_blank" rel="noopener">v${escapeHtml(version)}</a></h2>
        </div>
      </article>`)
    .join('');
}

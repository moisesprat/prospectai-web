/* ============================================================
   CHANGELOG RENDER — parses the "## Release Notes" section of the
   ProspectAI PyPI package README and renders real per-version
   release notes as changelog markup. Pure functions, no fetch/IO
   — mirrors ui/statsRender.js.
   ============================================================ */

const MAX_RELEASES = 30;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Extracts per-version release notes from the "## Release Notes" section
 * of the package README (PyPI `info.description`), and attaches each
 * version's upload date from PyPI's `releases` map.
 *
 * @param {string} description - PyPI `info.description` (the README).
 * @param {Record<string, {upload_time_iso_8601: string}[]>} releases - PyPI `releases` map.
 * @returns {{version: string, date: string, bullets: string[]}[]}
 */
export function parsePypiReleaseNotes(description, releases) {
  if (!description) return [];

  const sectionMatch = description.match(/## Release Notes\n([\s\S]*?)(?:\n## |$)/);
  if (!sectionMatch) return [];

  const section = sectionMatch[1];
  const versionBlocks = section.split(/(?=^### v)/m).filter(b => b.trim().startsWith('### v'));

  const items = [];
  for (const block of versionBlocks) {
    const headerMatch = block.match(/^### v(\S+)/);
    if (!headerMatch) continue;
    const version = headerMatch[1];

    const bullets = [...block.matchAll(/^- (.+)$/gm)].map(m => m[1].trim());
    if (bullets.length === 0) continue;

    const files = releases?.[version];
    if (!files || files.length === 0) continue;
    const date = files[0].upload_time_iso_8601.slice(0, 10);

    items.push({ version, date, bullets });
  }

  return items;
}

export function renderReleaseNotesHTML(items) {
  if (!items || items.length === 0) return '';

  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const capped = sorted.slice(0, MAX_RELEASES);

  return capped
    .map(({ version, date, bullets }) => `
      <article class="changelog-entry">
        <time class="changelog-date" datetime="${date}">${date}</time>
        <div class="changelog-entry-body">
          <span class="changelog-tag changelog-tag--module">ProspectAI Module</span>
          <h2 class="changelog-title">v${escapeHtml(version)}</h2>
          <ul class="changelog-bullets">
            ${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
        </div>
      </article>`)
    .join('');
}

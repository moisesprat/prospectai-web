/* ============================================================
   Shared formatting helpers — no DOM access, safe to import
   from both browser modules and the Node build script
   (scripts/build-static.mjs).
   ============================================================ */

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  const year  = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function utcDateStr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

export function fmtPrice(v) {
  if (v == null) return '—';
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtRoi(roi) {
  if (roi == null) return { text: '—', cls: '' };
  if (roi >= 0) return { text: `+${roi.toFixed(1)}%`, cls: 'stats-kpi-value--pos' };
  return { text: `−${Math.abs(roi).toFixed(1)}%`, cls: 'stats-kpi-value--neg' };
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

// Allow-list for hrefs built from backend or stored data (SEC-06): https URLs,
// same-origin absolute paths ('/x') and bare same-origin page paths
// ('report.html?id=1'). Everything else (javascript:, data:, http:,
// protocol-relative '//host') returns '#'. The result is NOT HTML-escaped:
// callers still pass it through escapeHtml when placing it inside an attribute.
const BARE_PAGE_PATH = /^[A-Za-z0-9._-]+\.html(?:[?#][^\s]*)?$/;

export function safeUrl(u) {
  if (typeof u !== 'string') return '#';
  const value = u.trim();
  if (!value) return '#';
  if (/^https:\/\//i.test(value)) {
    try {
      return new URL(value).protocol === 'https:' ? value : '#';
    } catch {
      return '#';
    }
  }
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (BARE_PAGE_PATH.test(value)) return value;
  return '#';
}

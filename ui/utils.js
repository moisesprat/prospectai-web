/* ============================================================
   UTILITIES
   DOM-free apart from the element passed to typeOutput.
   All text that reaches innerHTML is escaped (SEC-06).
   ============================================================ */

import { escapeHtml } from './formatters.js';

export const CURSOR_HTML = '<span class="typing-cursor"></span>';

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Escaped text followed by the typing cursor, safe for innerHTML. */
export function textWithCursorHTML(text) {
  return escapeHtml(text) + CURSOR_HTML;
}

/**
 * Animates text character-by-character into a DOM element.
 * Appends a blinking cursor while typing, removes it when done.
 * Each frame escapes the raw slice (never slices escaped output), so
 * LLM-written text can never become markup.
 */
export async function typeOutput(el, text, charDelay = 16) {
  el.innerHTML = '';
  for (let i = 0; i <= text.length; i++) {
    el.innerHTML = escapeHtml(text.slice(0, i)) + CURSOR_HTML;
    await delay(charDelay);
  }
  el.innerHTML = escapeHtml(text);
}

/* ============================================================
   UTILITIES
   ============================================================ */

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Animates text character-by-character into a DOM element.
 * Appends a blinking cursor while typing, removes it when done.
 */
export async function typeOutput(el, text, charDelay = 16) {
  el.innerHTML = '';
  for (let i = 0; i <= text.length; i++) {
    el.innerHTML = text.slice(0, i) + '<span class="typing-cursor"></span>';
    await delay(charDelay);
  }
  el.innerHTML = text;
}

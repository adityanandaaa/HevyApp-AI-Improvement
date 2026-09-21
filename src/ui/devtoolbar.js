import { setLocale } from '../state/store.js';
import { renderApp } from './render.js';

/**
 * @param {NodeListOf<Element>} buttons
 * @param {Element} pressed
 */
function setPressed(buttons, pressed) {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button === pressed));
  }
}

function initTextScale() {
  const buttons = document.querySelectorAll('[data-text-scale]');
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const scale = button.getAttribute('data-text-scale');
      if (!scale) return;
      document.documentElement.style.setProperty('--text-scale', scale);
      setPressed(buttons, button);
    });
  }
}

function initLocale() {
  const buttons = document.querySelectorAll('[data-locale]');
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const locale = /** @type {import('../domain/copy.js').Locale | null} */ (button.getAttribute('data-locale'));
      if (!locale) return;
      setLocale(locale);
      setPressed(buttons, button);
      renderApp();
    });
  }
}

function initReducedMotion() {
  document.getElementById('toggle-reduced-motion')?.addEventListener('change', (event) => {
    const checked = /** @type {HTMLInputElement} */ (event.target).checked;
    document.documentElement.classList.toggle('force-reduced-motion', checked);
  });
}

function initTapTargets() {
  document.getElementById('toggle-tap-targets')?.addEventListener('change', (event) => {
    const checked = /** @type {HTMLInputElement} */ (event.target).checked;
    document.documentElement.classList.toggle('show-tap-targets', checked);
  });
}

function initReset() {
  document.getElementById('dev-toolbar-reset')?.addEventListener('click', () => {
    window.location.reload();
  });
}

export function initDevToolbar() {
  initTextScale();
  initLocale();
  initReducedMotion();
  initTapTargets();
  initReset();
}

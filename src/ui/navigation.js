// Shared screen switching, so any module (main.js, ui/recap.js) can
// navigate without importing each other.

/** @param {string} name */
export function showScreen(name) {
  for (const screen of document.querySelectorAll('.screen')) {
    if (screen instanceof HTMLElement) {
      screen.hidden = screen.dataset.screen !== name;
    }
  }
  for (const tabButton of document.querySelectorAll('.tab-bar__item')) {
    if (tabButton instanceof HTMLElement) {
      if (tabButton.dataset.nav === name) {
        tabButton.setAttribute('aria-current', 'page');
      } else {
        tabButton.removeAttribute('aria-current');
      }
    }
  }
}

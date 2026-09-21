// Screen navigation and small cosmetic toggles, plus rendering Today's Focus
// and the direction lines (M3), and the signal card / rest timer / Why?
// sheet interactions (M4). Pain (M5) and a real Recap (M6) arrive later.

import { renderApp } from './ui/render.js';
import { initLogWorkoutInteractions } from './ui/log-workout.js';

renderApp();
initLogWorkoutInteractions();

/** @type {NodeListOf<HTMLElement>} */
const screens = document.querySelectorAll('.screen');

/** @param {string} name */
function showScreen(name) {
  for (const screen of screens) {
    screen.hidden = screen.dataset.screen !== name;
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

for (const button of document.querySelectorAll('[data-nav]')) {
  if (button instanceof HTMLButtonElement && !button.disabled) {
    const target = button.dataset.nav;
    if (target) {
      button.addEventListener('click', () => showScreen(target));
    }
  }
}

document.getElementById('start-push-day')?.addEventListener('click', () => showScreen('log-workout'));
document.getElementById('start-empty-workout')?.addEventListener('click', () => showScreen('log-workout'));
document.getElementById('log-workout-back')?.addEventListener('click', () => showScreen('workout'));

// Today's Focus's own Start Routine button (AC-7), rendered by ui/render.js.
for (const button of document.querySelectorAll('[data-start-routine]')) {
  button.addEventListener('click', () => showScreen('log-workout'));
}

document.getElementById('tip-banner-dismiss')?.addEventListener('click', () => {
  const banner = document.getElementById('tip-banner');
  if (banner) banner.hidden = true;
});

export {};

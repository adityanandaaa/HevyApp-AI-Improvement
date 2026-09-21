// Screen navigation and small cosmetic toggles, plus (from M3) rendering
// Today's Focus and the direction lines from the rules engine. Real
// interactivity (signals, pain, a running rest timer) arrives in later
// milestones.

import { renderApp } from './ui/render.js';

renderApp();

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

// Demo-only: toggling a set's check button shows the rest bar styled like
// Hevy's own (docs/reference/hevy-log-resting.png). The displayed time is the
// exercise's configured rest duration, not a real countdown — the rest timer
// itself is Hevy's, not something this feature builds or owns.
const restBar = document.getElementById('rest-bar');
const restBarTime = document.getElementById('rest-bar-time');

/** @param {number} totalSeconds */
function formatRestTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

for (const checkButton of document.querySelectorAll('.check-btn')) {
  checkButton.addEventListener('click', () => {
    const row = checkButton.closest('.set-row');
    const exerciseBlock = checkButton.closest('.exercise-block');
    if (!(row instanceof HTMLElement) || !(exerciseBlock instanceof HTMLElement)) return;

    const nowDone = checkButton.getAttribute('aria-pressed') !== 'true';
    checkButton.setAttribute('aria-pressed', String(nowDone));
    row.classList.toggle('set-row--done', nowDone);

    const anyChecked = document.querySelector('.check-btn[aria-pressed="true"]') !== null;
    if (restBar) restBar.hidden = !anyChecked;
    if (nowDone && restBarTime) {
      const restSeconds = Number(exerciseBlock.dataset.rest ?? '0');
      restBarTime.textContent = formatRestTime(restSeconds);
    }
  });
}

export {};

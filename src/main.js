// Screen navigation and small cosmetic toggles, plus rendering Today's Focus
// and the direction lines (M3), the signal card / rest timer / Why? sheet
// interactions (M4), Pain (M5) and the session recap (M6).

import { renderApp } from './ui/render.js';
import { initLogWorkoutInteractions } from './ui/log-workout.js';
import { initRecapInteractions } from './ui/recap.js';
import { showScreen } from './ui/navigation.js';

renderApp();
initLogWorkoutInteractions();
initRecapInteractions();

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

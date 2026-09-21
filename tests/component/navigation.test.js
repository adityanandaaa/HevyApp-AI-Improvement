import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '../../index.html'), 'utf-8');

/** @returns {Promise<void>} */
async function mountApp() {
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  document.body.innerHTML = bodyMatch?.[1] ?? '';
  document.body.querySelector('script')?.remove();
  vi.resetModules();
  await import('../../src/main.js');
}

/** @param {string} id */
function screenHidden(id) {
  return document.getElementById(id)?.hidden;
}

describe('screen navigation', () => {
  beforeEach(async () => {
    await mountApp();
  });

  it('shows Home by default and hides Workout and Log Workout', () => {
    expect(screenHidden('screen-home')).toBe(false);
    expect(screenHidden('screen-workout')).toBe(true);
    expect(screenHidden('screen-log-workout')).toBe(true);
  });

  it('switches to Workout when the Workout tab is tapped', () => {
    const workoutTab = /** @type {HTMLElement} */ (document.querySelector('[data-nav="workout"]'));
    workoutTab.click();

    expect(screenHidden('screen-home')).toBe(true);
    expect(screenHidden('screen-workout')).toBe(false);
    expect(workoutTab.getAttribute('aria-current')).toBe('page');
  });

  it('does not navigate for the inert Profile tab', () => {
    const profileTab = /** @type {HTMLButtonElement} */ (document.querySelector('[data-nav="profile"]'));
    expect(profileTab.disabled).toBe(true);
  });

  it('starts Push Day into Log Workout, and the back chevron returns to Workout', () => {
    document.querySelector('[data-nav="workout"]')?.dispatchEvent(new Event('click', { bubbles: true }));
    document.getElementById('start-push-day')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(screenHidden('screen-log-workout')).toBe(false);

    document.getElementById('log-workout-back')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(screenHidden('screen-log-workout')).toBe(true);
    expect(screenHidden('screen-workout')).toBe(false);
  });

  it('does not start a workout from the inert Leg Day or Pull Day cards', () => {
    const legDayButton = document.querySelector('.routine-card--inert .btn-primary');
    expect(legDayButton).not.toBeNull();
    expect(/** @type {HTMLButtonElement} */ (legDayButton).disabled).toBe(true);
  });

  it('shows the rest bar and marks a row done when a set is checked', () => {
    const checkButton = /** @type {HTMLButtonElement} */ (
      document.querySelector('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="1"] .check-btn')
    );
    const row = checkButton.closest('.set-row');
    const restBar = document.getElementById('rest-bar');

    expect(restBar?.hidden).toBe(true);

    checkButton.click();

    expect(checkButton.getAttribute('aria-pressed')).toBe('true');
    expect(row?.classList.contains('set-row--done')).toBe(true);
    expect(restBar?.hidden).toBe(false);
    expect(document.getElementById('rest-bar-time')?.textContent).toBe('2:00');

    checkButton.click();

    expect(checkButton.getAttribute('aria-pressed')).toBe('false');
    expect(row?.classList.contains('set-row--done')).toBe(false);
    expect(restBar?.hidden).toBe(true);
  });
});

describe('privacy (HANDOFF section 2)', () => {
  it('never reproduces the real names from the reference screenshots', () => {
    const realNames = ['t00rx', 'roshaniayu', 'patricech', 'ericv'];
    for (const name of realNames) {
      expect(html.toLowerCase()).not.toContain(name.toLowerCase());
    }
  });

  it('uses no <img> tags for feed avatars (no real photos)', () => {
    document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
    const avatarImages = document.querySelectorAll('.avatar img');
    expect(avatarImages.length).toBe(0);
  });
});

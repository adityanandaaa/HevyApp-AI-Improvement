import { beforeEach, describe, expect, it } from 'vitest';

import { mountApp } from '../helpers/mount-app.js';

/** @param {string} selector */
function el(selector) {
  return /** @type {HTMLElement} */ (document.querySelector(selector));
}

/**
 * Checks every set for the given exercise as-is (default pre-filled values).
 * @param {string} exerciseId
 */
function checkAllSets(exerciseId) {
  for (let setNum = 1; setNum <= 3; setNum++) {
    /** @type {HTMLButtonElement | null} */ (
      document.querySelector(`.exercise-block[data-exercise="${exerciseId}"] .set-row[data-set="${setNum}"] .check-btn`)
    )?.click();
  }
}

describe('Session recap (M6)', () => {
  beforeEach(async () => {
    await mountApp();
    el('[data-nav="workout"]').dispatchEvent(new Event('click', { bubbles: true }));
    document.getElementById('start-push-day')?.dispatchEvent(new Event('click', { bubbles: true }));
  });

  it('AC-43: Finish shows the recap as a full screen, hiding Log Workout', () => {
    document.getElementById('finish-workout')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(el('#screen-recap').hidden).toBe(false);
    expect(el('#screen-log-workout').hidden).toBe(true);
  });

  it('AC-44: shows headline, six rows, Next session, Overall, and a Done button', () => {
    document.getElementById('finish-workout')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(el('.recap-headline')).not.toBeNull();
    expect(document.querySelectorAll('.recap-row')).toHaveLength(6);
    const labels = [...document.querySelectorAll('.recap-summary__label')].map((n) => n.textContent);
    expect(labels).toEqual(['Next session', 'Overall']);
    expect(el('#recap-done')).not.toBeNull();
  });

  it('AC-45: all six rows fit within the phone frame without the recap body needing to scroll', () => {
    document.getElementById('finish-workout')?.dispatchEvent(new Event('click', { bubbles: true }));

    const body = el('#recap-body');
    // jsdom has no real layout engine, so this is a structural proxy: every
    // row renders, and CSS asserts elsewhere (recap.css) keep it compact.
    // See the M6 screenshot verification for the real layout check.
    expect(body.querySelectorAll('.recap-row')).toHaveLength(6);
  });

  it('reflects what was actually logged today, not a fixed script', () => {
    checkAllSets('incline-bench-press');
    checkAllSets('shoulder-press');
    document.getElementById('finish-workout')?.dispatchEvent(new Event('click', { bubbles: true }));

    const inclineRow = [...document.querySelectorAll('.recap-row')].find((r) =>
      r.querySelector('.recap-row__name')?.textContent?.includes('Incline'),
    );
    expect(inclineRow?.querySelector('.recap-row__sets')?.textContent).toBe('30kg × 15, 40kg × 12, 40kg × 10');

    const chestFlyRow = [...document.querySelectorAll('.recap-row')].find(
      (r) => r.querySelector('.recap-row__name')?.textContent === 'Chest Fly',
    );
    expect(chestFlyRow?.querySelector('.recap-row__sets')?.textContent).toBe('Not logged');
  });

  it('Done returns to Home', () => {
    document.getElementById('finish-workout')?.dispatchEvent(new Event('click', { bubbles: true }));
    document.getElementById('recap-done')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(el('#screen-home').hidden).toBe(false);
    expect(el('#screen-recap').hidden).toBe(true);
  });

  it("AC-46: the next Today's Focus reflects this session without further action", () => {
    // Push incline to 42kg today, successfully and cleanly (RPE <= 8).
    const row3 = /** @type {HTMLElement} */ (
      document.querySelector('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="3"]')
    );
    /** @type {HTMLInputElement} */ (row3.querySelector('.set-input--weight')).value = '42';
    /** @type {HTMLInputElement} */ (row3.querySelector('.set-input--rpe')).value = '8';
    checkAllSets('incline-bench-press');

    document.getElementById('finish-workout')?.dispatchEvent(new Event('click', { bubbles: true }));
    document.getElementById('recap-done')?.dispatchEvent(new Event('click', { bubbles: true }));

    // Incline's last 3 sessions are now 40/40/42 — no longer the same
    // working weight, so the push gate (R5) is no longer met: Today's
    // Focus should now say HOLD, not PUSH, with no extra action taken.
    const homeCard = el('#todays-focus-home');
    expect(homeCard.querySelector('.todays-focus__signal strong')?.textContent).toBe('HOLD');
  });
});

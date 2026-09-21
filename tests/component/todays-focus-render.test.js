import { beforeEach, describe, expect, it } from 'vitest';

import { mountApp } from '../helpers/mount-app.js';

describe('M3: Today\'s Focus and direction lines render from evaluate()', () => {
  beforeEach(async () => {
    await mountApp();
  });

  it('renders the Home (hook) variant with a PUSH signal and Incline in the headline', () => {
    const card = document.getElementById('todays-focus-home');
    expect(card?.querySelector('.todays-focus__signal strong')?.textContent).toBe('PUSH');
    expect(card?.querySelector('.todays-focus__signal use')?.getAttribute('href')).toBe('#icon-arrow-up');
    expect(card?.textContent).toContain('Your incline is ready for more.');
    expect(card?.textContent).toContain('42kg');
    expect(card?.querySelector('[data-start-routine]')).not.toBeNull();
  });

  it('renders the Workout (plan) variant with What to expect / How to tackle it', () => {
    const card = document.getElementById('todays-focus-workout');
    const text = card?.textContent ?? '';
    expect(text).toContain('What to expect');
    expect(text).toContain('How to tackle it');
    expect(text).toContain('Bodyweight Dips is still building history (2 of 3 sessions)');
    expect(card?.querySelector('[data-start-routine]')).not.toBeNull();
  });

  it("Today's Focus own Start Routine button opens Log Workout", () => {
    document.querySelector('[data-nav="workout"]')?.dispatchEvent(new Event('click', { bubbles: true }));
    const button = document.querySelector('#todays-focus-workout [data-start-routine]');
    button?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(document.getElementById('screen-log-workout')?.hidden).toBe(false);
  });

  it('renders a target and reason direction line for Incline', () => {
    const block = document.querySelector('.exercise-block[data-exercise="incline-bench-press"]');
    const target = block?.querySelector('.direction-line__target');
    const reason = block?.querySelector('.direction-line__reason');
    expect(target?.textContent).toBe('42kg × 8-10');
    expect(reason?.textContent).toContain('42kg');
  });

  it('renders only the history-building line for Dips, no target', () => {
    const block = document.querySelector('.exercise-block[data-exercise="bodyweight-dips"]');
    expect(block?.querySelector('.direction-line--building')?.textContent).toBe('History building: 2 of 3 sessions');
    expect(block?.querySelector('.direction-line__target')).toBeNull();
  });

  it('places the direction line between the rest timer line and the set table for every exercise (AC-8)', () => {
    for (const block of document.querySelectorAll('.exercise-block')) {
      const children = [...block.children];
      const restIndex = children.findIndex((el) => el.classList.contains('exercise-block__rest'));
      const directionIndex = children.findIndex(
        (el) => el.classList.contains('direction-line') || el.classList.contains('direction-line--building'),
      );
      const tableIndex = children.findIndex((el) => el.tagName === 'TABLE');

      expect(directionIndex).toBeGreaterThan(restIndex);
      expect(directionIndex).toBeLessThan(tableIndex);
    }
  });
});

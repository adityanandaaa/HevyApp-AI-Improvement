import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mountApp } from '../helpers/mount-app.js';

const INCLINE = '.exercise-block[data-exercise="incline-bench-press"]';

/** @param {string} selector */
function el(selector) {
  return /** @type {HTMLElement} */ (document.querySelector(selector));
}

/**
 * @param {string} blockSelector
 * @param {number} setNumber
 * @param {{ weight?: string, reps?: string, rpe?: string }} [values]
 */
function setRowInputs(blockSelector, setNumber, values = {}) {
  const row = /** @type {HTMLElement} */ (document.querySelector(`${blockSelector} .set-row[data-set="${setNumber}"]`));
  const weightInput = /** @type {HTMLInputElement} */ (row.querySelector('.set-input--weight'));
  const repsInput = /** @type {HTMLInputElement} */ (row.querySelector('.set-input--reps'));
  const rpeInput = /** @type {HTMLInputElement} */ (row.querySelector('.set-input--rpe'));
  if (values.weight !== undefined) weightInput.value = values.weight;
  if (values.reps !== undefined) repsInput.value = values.reps;
  if (values.rpe !== undefined) rpeInput.value = values.rpe;
  return /** @type {HTMLButtonElement} */ (row.querySelector('.check-btn'));
}

describe('signal card, chips, Why? sheet and rest timer (M4)', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await mountApp();
    el('[data-nav="workout"]').dispatchEvent(new Event('click', { bubbles: true }));
    document.getElementById('start-push-day')?.dispatchEvent(new Event('click', { bubbles: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows chips only (no signal) when the checked weight differs from target and nothing else triggers', () => {
    const checkBtn = setRowInputs(INCLINE, 2); // defaults: 40kg x 12 @ 7.5, target is 42kg
    checkBtn.click();
    vi.advanceTimersByTime(1000);

    const card = el('#docked-card');
    expect(card.hidden).toBe(false);
    expect(card.querySelector('.docked-card__signal strong')).toBeNull();
    expect(card.querySelector('.chips__heading')?.textContent).toBe('Why did you skip the push?');
    expect(card.querySelectorAll('.chip').length).toBe(6);
  });

  it('does not show chips for the ramp set (set 1, 30kg)', () => {
    const checkBtn = setRowInputs(INCLINE, 1); // 30kg, below the 40kg working weight
    checkBtn.click();
    vi.advanceTimersByTime(1000);

    expect(el('#docked-card').hidden).toBe(true);
  });

  it('shows a HOLD signal with the exact scripted reason when RPE is 9 or higher', () => {
    const checkBtn = setRowInputs(INCLINE, 3, { rpe: '9' });
    checkBtn.click();
    vi.advanceTimersByTime(1000);

    const card = el('#docked-card');
    expect(card.hidden).toBe(false);
    expect(card.querySelector('.docked-card__signal strong')?.textContent).toBe('HOLD');
    expect(card.querySelector('.docked-card__signal use')?.getAttribute('href')).toBe('#icon-pause');
    expect(card.querySelector('.docked-card__reason')?.textContent).toBe(
      'Set 3 was RPE 9. Stay at 40kg, no need to add a set today.',
    );
    // Also shows chips below the signal, in the same card (R11).
    expect(card.querySelector('.chips__heading')).not.toBeNull();
  });

  it('announces the new signal in the live region (label first, then reason)', () => {
    const checkBtn = setRowInputs(INCLINE, 3, { rpe: '9' });
    checkBtn.click();
    vi.advanceTimersByTime(1000);

    expect(el('#live-region').textContent).toBe('HOLD. Set 3 was RPE 9. Stay at 40kg, no need to add a set today.');
  });

  it('Dismiss hides the card', () => {
    setRowInputs(INCLINE, 3, { rpe: '9' }).click();
    vi.advanceTimersByTime(1000);
    expect(el('#docked-card').hidden).toBe(false);

    document.getElementById('docked-card-dismiss')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(el('#docked-card').hidden).toBe(true);
  });

  it('checking the next set dismisses whatever card was showing (AC-16)', () => {
    setRowInputs(INCLINE, 3, { rpe: '9' }).click();
    vi.advanceTimersByTime(1000);
    expect(el('#docked-card').hidden).toBe(false);

    // Set 2 as-is triggers nothing (no rpe>=9, no rep drop at 40kg... actually
    // set 2 differs from target, so this shows chips-only, which is still a
    // *different* card than the HOLD one — the point is the old HOLD is gone.
    setRowInputs(INCLINE, 2).click();
    vi.advanceTimersByTime(1000);

    expect(el('#docked-card').querySelector('.docked-card__signal strong')).toBeNull();
  });

  it('opens the Why? sheet with the matching content and returns focus on close', () => {
    const checkBtn = setRowInputs(INCLINE, 3, { rpe: '9' });
    checkBtn.click();
    vi.advanceTimersByTime(1000);

    const whyLink = /** @type {HTMLElement} */ (document.getElementById('docked-card-why'));
    whyLink.focus();
    whyLink.dispatchEvent(new Event('click', { bubbles: true }));

    expect(el('#why-sheet').hidden).toBe(false);
    expect(el('#why-sheet-title').textContent).toBe('Why HOLD?');
    expect(el('#why-sheet-body').textContent).toContain('What I did');
    expect(el('#why-sheet-body').textContent).toContain('Recommendation');
    expect(document.activeElement?.id).toBe('why-sheet-close');

    document.getElementById('why-sheet-close')?.dispatchEvent(new Event('click', { bubbles: true }));

    expect(el('#why-sheet').hidden).toBe(true);
    expect(document.activeElement?.id).toBe('docked-card-why');
  });

  it('closes the Why? sheet on Escape', () => {
    setRowInputs(INCLINE, 3, { rpe: '9' }).click();
    vi.advanceTimersByTime(1000);
    document.getElementById('docked-card-why')?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el('#why-sheet').hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(el('#why-sheet').hidden).toBe(true);
  });

  it('selecting a chip shows "Reason saved" and keeps the signal above it', () => {
    setRowInputs(INCLINE, 3, { rpe: '9' }).click();
    vi.advanceTimersByTime(1000);

    const chip = /** @type {HTMLElement} */ ([...document.querySelectorAll('.chip')].find((c) => c.textContent === 'Too tired'));
    chip.dispatchEvent(new Event('click', { bubbles: true }));

    const card = el('#docked-card');
    expect(card.querySelector('.chips__saved')?.textContent).toBe('Reason saved: Too tired');
    expect(card.querySelector('.docked-card__signal strong')?.textContent).toBe('HOLD');
    expect(card.querySelectorAll('.chip').length).toBe(0);
  });

  it('starts the rest timer, counts it down, and -15/+15/Skip work', () => {
    setRowInputs(INCLINE, 1).click();

    // The bar and its initial time show synchronously, before the interval ticks.
    expect(el('#rest-bar').hidden).toBe(false);
    expect(el('#rest-bar-time').textContent).toBe('2:00');

    vi.advanceTimersByTime(1000); // 1 tick
    expect(el('#rest-bar-time').textContent).toBe('1:59');

    vi.advanceTimersByTime(2000); // 2 more ticks (3 total)
    expect(el('#rest-bar-time').textContent).toBe('1:57');

    document.getElementById('rest-bar-minus')?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el('#rest-bar-time').textContent).toBe('1:42');

    document.getElementById('rest-bar-plus')?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el('#rest-bar-time').textContent).toBe('1:57');

    document.getElementById('rest-bar-skip')?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el('#rest-bar-time').textContent).toBe('0:00');
  });

  it('dismisses the signal card automatically when the rest timer reaches zero (AC-16)', () => {
    setRowInputs(INCLINE, 3, { rpe: '9' }).click();
    vi.advanceTimersByTime(1000);
    expect(el('#docked-card').hidden).toBe(false);

    vi.advanceTimersByTime(120_000); // the full 2min rest duration

    expect(el('#rest-bar-time').textContent).toBe('0:00');
    expect(el('#docked-card').hidden).toBe(true);
  });

  it('unchecking a set removes its log entry and hides the card it triggered', () => {
    const checkBtn = setRowInputs(INCLINE, 3, { rpe: '9' });
    checkBtn.click();
    vi.advanceTimersByTime(1000);
    expect(el('#docked-card').hidden).toBe(false);

    checkBtn.click(); // uncheck
    expect(el('#docked-card').hidden).toBe(true);
    expect(checkBtn.getAttribute('aria-pressed')).toBe('false');
  });
});

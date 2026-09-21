import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mountApp } from '../helpers/mount-app.js';

/** @param {string} selector */
function el(selector) {
  return /** @type {HTMLElement} */ (document.querySelector(selector));
}

/** @param {string} exerciseId */
function painButton(exerciseId) {
  return /** @type {HTMLButtonElement} */ (
    document.querySelector(`.exercise-block[data-exercise="${exerciseId}"] [data-pain-toggle]`)
  );
}

/** @param {string} exerciseId */
function directionReason(exerciseId) {
  return el(`.exercise-block[data-exercise="${exerciseId}"] .direction-line__reason`)?.textContent;
}

describe('Pain (M5)', () => {
  beforeEach(async () => {
    await mountApp();
    el('[data-nav="workout"]').dispatchEvent(new Event('click', { bubbles: true }));
    document.getElementById('start-push-day')?.dispatchEvent(new Event('click', { bubbles: true }));
  });

  it('AC-27: the Add Set row is split, Pain shows an alert icon and the word "Pain"', () => {
    const button = painButton('incline-bench-press');
    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent?.trim()).toBe('Pain');
    expect(button.querySelector('use')?.getAttribute('href')).toBe('#icon-alert');

    const addSetButton = document.querySelector('.exercise-block[data-exercise="incline-bench-press"] .add-set-row__add');
    expect(addSetButton).not.toBeNull();
  });

  it('AC-28: tapping Pain shows "Pain reported" with a check icon and the fixed signal card', () => {
    const button = painButton('incline-bench-press');
    button.click();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent?.trim()).toBe('Pain reported');
    expect(button.querySelector('use')?.getAttribute('href')).toBe('#icon-check');

    const card = el('#docked-card');
    expect(card.hidden).toBe(false);
    expect(card.querySelector('.docked-card__signal strong')?.textContent).toBe('HOLD');
    expect(card.querySelector('.docked-card__reason')?.textContent).toBe(
      'Pain reported. Hold or reduce the load here. Stopping is a valid choice.',
    );
    expect(card.querySelector('.docked-card__why')).not.toBeNull();
  });

  it('AC-62: announces "Pain reported" in the live region', () => {
    painButton('incline-bench-press').click();
    expect(el('#live-region').textContent).toBe('Pain reported');
  });

  it('AC-29: blocks PUSH on the same exercise for the rest of the session', () => {
    expect(directionReason('incline-bench-press')).toContain('stable at 40kg');
    painButton('incline-bench-press').click();
    expect(directionReason('incline-bench-press')).toContain('is holding at 40kg');
  });

  it('AC-30: a later exercise sharing a primary muscle gets the block wording', () => {
    painButton('incline-bench-press').click();
    expect(directionReason('chest-fly')).toBe(
      'You reported pain on Incline Bench Press (Dumbbell) earlier. Keep this one conservative and stop if it returns.',
    );
  });

  it('AC-31: a later exercise sharing only a secondary muscle gets the soft wording appended, without blocking', () => {
    painButton('incline-bench-press').click();
    const reason = directionReason('shoulder-press');
    expect(reason).toContain('This also loads shoulders, so keep an eye on it.');
    // Soft: still the normal hold reasoning underneath, not the block prefix.
    expect(reason).not.toContain('You reported pain on');
  });

  it("R4 wins over pain wording: Dips stays history-building even though pain computes as block", () => {
    painButton('incline-bench-press').click();
    expect(el('.exercise-block[data-exercise="bodyweight-dips"] .direction-line--building')?.textContent).toBe(
      'History building: 2 of 3 sessions',
    );
  });

  it('AC-32: tapping Pain again clears it, announces "Pain cleared", and restores normal evaluation', () => {
    const button = painButton('incline-bench-press');
    button.click();
    button.click();

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent?.trim()).toBe('Pain');
    expect(el('#live-region').textContent).toBe('Pain cleared');
    expect(el('#docked-card').hidden).toBe(true);
    expect(directionReason('chest-fly')).toContain('stable at 20kg');
  });

  it('AC-34: the pain Why? sheet is procedural — no diagnosis, cause, or treatment claims', () => {
    painButton('incline-bench-press').click();
    document.getElementById('docked-card-why')?.dispatchEvent(new Event('click', { bubbles: true }));

    const bodyText = el('#why-sheet-body').textContent ?? '';
    expect(el('#why-sheet-title').textContent).toBe('Why HOLD?');
    expect(bodyText).toContain('Reported pain on Incline Bench Press (Dumbbell).');
    expect(bodyText).toContain('Pain reported. Hold or reduce the load here. Stopping is a valid choice.');
    for (const forbidden of ['diagnos', 'injury', 'treatment', 'push through', 'strain', 'tear']) {
      expect(bodyText.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("checking a set after Pain dismisses the pain card immediately (AC-16)", () => {
    painButton('incline-bench-press').click();
    expect(el('#docked-card').hidden).toBe(false);

    const shoulderCheckBtn = /** @type {HTMLButtonElement} */ (
      document.querySelector('.exercise-block[data-exercise="shoulder-press"] .set-row[data-set="1"] .check-btn')
    );
    shoulderCheckBtn.click();

    // Dismissed synchronously, before the next check's own signal (if any)
    // is computed asynchronously.
    expect(el('#docked-card').hidden).toBe(true);
  });

  it('AC-41: choosing the Pain/discomfort chip has the same effect as the Pain button', () => {
    vi.useFakeTimers();
    // Trigger chips (not a signal) on Incline set 2, checked as-is (40kg != target 42kg).
    const row = /** @type {HTMLElement} */ (
      document.querySelector('.exercise-block[data-exercise="incline-bench-press"] .set-row[data-set="2"]')
    );
    /** @type {HTMLButtonElement} */ (row.querySelector('.check-btn')).click();
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    const chip = /** @type {HTMLElement} */ ([...document.querySelectorAll('.chip')].find((c) => c.textContent === 'Pain/discomfort'));
    expect(chip).toBeDefined();

    chip.dispatchEvent(new Event('click', { bubbles: true }));

    const button = painButton('incline-bench-press');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent?.trim()).toBe('Pain reported');
    expect(el('#docked-card').querySelector('.docked-card__reason')?.textContent).toBe(
      'Pain reported. Hold or reduce the load here. Stopping is a valid choice.',
    );
    expect(directionReason('chest-fly')).toContain('You reported pain on');
  });
});

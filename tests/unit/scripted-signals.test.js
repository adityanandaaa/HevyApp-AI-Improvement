import { describe, expect, it } from 'vitest';

import { LIMITS } from '../../src/domain/copy.js';
import { evaluate } from '../../src/domain/rules/evaluate.js';
import { computeTarget } from '../../src/domain/rules/target.js';
import { PUSH_DAY_EXERCISES } from '../../src/data/exercises.js';
import { PUSH_DAY_SESSIONS } from '../../src/data/sessions.js';
import { composeWhySheet, explain } from '../../src/reasoning/scripted.js';

/** @type {import('../../src/domain/rules/evaluate.js').EvaluateInput} */
const input = {
  routineExercises: PUSH_DAY_EXERCISES,
  sessions: PUSH_DAY_SESSIONS,
  todaysLogs: [],
  painReports: [],
};

const incline = /** @type {import('../../src/domain/types.js').Exercise} */ (
  PUSH_DAY_EXERCISES.find((e) => e.id === 'incline-bench-press')
);
const evaluation = evaluate(input, 'incline-bench-press');
const target = computeTarget(incline, PUSH_DAY_SESSIONS, evaluation);

/**
 * @param {number} weightKg
 * @param {number} reps
 * @param {number} rpe
 * @returns {import('../../src/domain/types.js').SetEntry}
 */
function normalSet(weightKg, reps, rpe) {
  return { type: 'normal', weightKg, reps, rpe };
}

describe('set_checked reason text (HANDOFF section 8, scenario 2)', () => {
  it('matches the exact scripted example for a high-RPE HOLD', () => {
    const lastSet = normalSet(40, 10, 9);
    const reason = explain({ trigger: 'set_checked', exercise: incline, evaluation, lastSet, target, setNumber: 3 }, 'HOLD');
    expect(reason).toBe('Set 3 was RPE 9. Stay at 40kg, no need to add a set today.');
    expect(reason.length).toBeLessThanOrEqual(LIMITS.signalReason);
  });

  it('produces a BACK_OFF reason within the signal reason limit', () => {
    const lastSet = normalSet(40, 8, 7);
    const reason = explain(
      { trigger: 'set_checked', exercise: incline, evaluation, lastSet, target, setNumber: 2 },
      'BACK_OFF',
    );
    expect(reason).toContain('Set 2');
    expect(reason.length).toBeLessThanOrEqual(LIMITS.signalReason);
  });
});

describe('AC-68: set_checked reason text respects the locale', () => {
  it('formats a decimal RPE with a comma under id-ID', () => {
    const lastSet = normalSet(40, 10, 9.5);
    const reason = explain(
      { trigger: 'set_checked', exercise: incline, evaluation, lastSet, target, setNumber: 1, locale: 'id-ID' },
      'HOLD',
    );
    expect(reason).toBe('Set 1 was RPE 9,5. Stay at 40kg, no need to add a set today.');
  });
});

describe('composeWhySheet (AC-18)', () => {
  it('matches the shape of the worked example (mockup 5) for a HOLD', () => {
    const setsToday = [normalSet(40, 12, 7.5), normalSet(40, 10, 9)];
    const copy = composeWhySheet({ trigger: 'set_checked', exercise: incline, evaluation, target }, 'HOLD', setsToday);

    expect(copy.title).toBe('Why HOLD?');
    expect(copy.whatIDid).toBe('Sets 1 to 2: 40kg × 12, 40kg × 10 at RPE 7.5 and 9.');
    expect(copy.calculated).toBe('RPE rose from 7.5 to 9 across the 2 sets.');
    expect(copy.recommendation).toBe('Hold at 40kg. No need to add a set today.');
  });

  it('produces a BACK_OFF why-sheet mentioning the exercise', () => {
    const setsToday = [normalSet(40, 10, 7), normalSet(40, 7, 7)];
    const copy = composeWhySheet({ trigger: 'set_checked', exercise: incline, evaluation, target }, 'BACK_OFF', setsToday);

    expect(copy.title).toBe('Why BACK OFF?');
    expect(copy.recommendation).toContain(incline.name);
  });
});

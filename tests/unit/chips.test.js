import { describe, expect, it } from 'vitest';

import { chipsHeadingKind, isRampSet, shouldShowChips } from '../../src/domain/rules/chips.js';
import { evaluate } from '../../src/domain/rules/evaluate.js';
import { computeTarget } from '../../src/domain/rules/target.js';
import { PUSH_DAY_EXERCISES } from '../../src/data/exercises.js';
import { PUSH_DAY_SESSIONS } from '../../src/data/sessions.js';

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
const inclineEvaluation = evaluate(input, 'incline-bench-press');
const inclineTarget = computeTarget(incline, PUSH_DAY_SESSIONS, inclineEvaluation);

describe('R11: isRampSet', () => {
  it('is a ramp set when the row\'s Previous weight is below last session\'s working weight', () => {
    expect(isRampSet(30, 40)).toBe(true);
  });

  it('is not a ramp set at or above the working weight', () => {
    expect(isRampSet(40, 40)).toBe(false);
    expect(isRampSet(45, 40)).toBe(false);
  });

  it('is never a ramp set when there is no prior working weight', () => {
    expect(isRampSet(30, null)).toBe(false);
  });
});

describe('R11: shouldShowChips (scenario 2, HANDOFF section 8)', () => {
  it('T-chips-1: set 1 (30kg ramp set) never shows chips, even though 30 != target 42', () => {
    const show = shouldShowChips({
      checkedSet: { type: 'normal', weightKg: 30, reps: 15, rpe: 6 },
      previousWeightKg: 30,
      lastSessionWorkingWeightKg: 40,
      evaluation: inclineEvaluation,
      target: inclineTarget,
    });
    expect(show).toBe(false);
  });

  it('T-chips-2: set 2 checked at 40kg (!= target 42kg) shows chips', () => {
    const show = shouldShowChips({
      checkedSet: { type: 'normal', weightKg: 40, reps: 12, rpe: 7.5 },
      previousWeightKg: 40,
      lastSessionWorkingWeightKg: 40,
      evaluation: inclineEvaluation,
      target: inclineTarget,
    });
    expect(show).toBe(true);
  });

  it('does not show chips when the checked weight matches the target exactly', () => {
    const show = shouldShowChips({
      checkedSet: { type: 'normal', weightKg: 42, reps: 8, rpe: 8 },
      previousWeightKg: 40,
      lastSessionWorkingWeightKg: 40,
      evaluation: inclineEvaluation,
      target: inclineTarget,
    });
    expect(show).toBe(false);
  });

  it('never shows chips for an exercise still building history', () => {
    const dips = /** @type {import('../../src/domain/types.js').Exercise} */ (
      PUSH_DAY_EXERCISES.find((e) => e.id === 'bodyweight-dips')
    );
    const dipsEvaluation = evaluate(input, 'bodyweight-dips');
    const dipsTarget = computeTarget(dips, PUSH_DAY_SESSIONS, dipsEvaluation);
    const show = shouldShowChips({
      checkedSet: { type: 'normal', weightKg: 5, reps: 8, rpe: 8 },
      previousWeightKg: 0,
      lastSessionWorkingWeightKg: 0,
      evaluation: dipsEvaluation,
      target: dipsTarget,
    });
    expect(show).toBe(false);
  });
});

describe('AC-38: chipsHeadingKind', () => {
  it('is "push_skipped" when a push was recommended and the checked weight is less', () => {
    const kind = chipsHeadingKind(inclineEvaluation, { type: 'normal', weightKg: 40, reps: 12, rpe: 7.5 }, /** @type {import('../../src/domain/rules/target.js').Target} */ (inclineTarget));
    expect(kind).toBe('push_skipped');
  });

  it('is "other_change" when the checked weight is more than the target', () => {
    const kind = chipsHeadingKind(inclineEvaluation, { type: 'normal', weightKg: 45, reps: 6, rpe: 9 }, /** @type {import('../../src/domain/rules/target.js').Target} */ (inclineTarget));
    expect(kind).toBe('other_change');
  });
});

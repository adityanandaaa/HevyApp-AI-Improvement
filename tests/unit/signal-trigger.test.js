import { describe, expect, it } from 'vitest';

import { reactiveSignal } from '../../src/domain/rules/signal-trigger.js';

/**
 * @param {Partial<import('../../src/domain/types.js').SetEntry>} overrides
 * @returns {import('../../src/domain/types.js').SetEntry}
 */
function set(overrides) {
  return { type: 'normal', weightKg: 40, reps: 10, rpe: 7, ...overrides };
}

/** No target/history context — the shape most tests that aren't about PROGRESS/PR need. */
const NO_CONTEXT = { target: null, allTimeMaxWeightKg: null, allTimeMaxRepsAtWeight: null };

/**
 * @param {number} weightKg
 * @param {number | null} [allTimeMaxRepsAtWeight]
 * @returns {import('../../src/domain/rules/signal-trigger.js').ReactiveSignalContext}
 */
function targetContext(weightKg, allTimeMaxRepsAtWeight = null) {
  return {
    target: { weightKg, currentWeightKg: weightKg - 2, repsMin: 8, repsMax: 10 },
    allTimeMaxWeightKg: null,
    allTimeMaxRepsAtWeight,
  };
}

describe('R12: reactive signal triggers', () => {
  it('returns HOLD when the checked set is RPE 9 or higher', () => {
    expect(reactiveSignal(set({ rpe: 9 }), [], NO_CONTEXT)).toEqual({ label: 'HOLD' });
    expect(reactiveSignal(set({ rpe: 9.5 }), [], NO_CONTEXT)).toEqual({ label: 'HOLD' });
  });

  it('returns null for RPE 8 or lower with no rep drop and no target', () => {
    expect(reactiveSignal(set({ rpe: 8 }), [], NO_CONTEXT)).toBeNull();
  });

  it('returns BACK_OFF when reps drop by 2 or more from the previous set at the same weight', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior, NO_CONTEXT)).toEqual({ label: 'BACK_OFF' });
  });

  it('does not trigger BACK_OFF for a 1-rep drop', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 9, rpe: 7 }), prior, NO_CONTEXT)).toBeNull();
  });

  it('only compares against a prior set at the same weight', () => {
    const prior = [set({ weightKg: 30, reps: 15, rpe: 6 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior, NO_CONTEXT)).toBeNull();
  });

  it('prefers HOLD over BACK_OFF when both conditions are met', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 7, rpe: 9 }), prior, NO_CONTEXT)).toEqual({ label: 'HOLD' });
  });

  it('uses the most recent prior set at that weight, not the first', () => {
    const prior = [set({ weightKg: 40, reps: 15, rpe: 6 }), set({ weightKg: 40, reps: 9, rpe: 7 })];
    // Most recent prior set at 40kg had 9 reps; dropping to 8 is only a 1-rep drop.
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior, NO_CONTEXT)).toBeNull();
  });
});

describe('R12: PROGRESS and PR (exceeding the target should celebrate, not interrogate)', () => {
  it('returns PROGRESS when the checked weight exceeds the target but not the all-time max', () => {
    const context = {
      target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 },
      allTimeMaxWeightKg: 44,
      allTimeMaxRepsAtWeight: null,
    };
    expect(reactiveSignal(set({ weightKg: 43, rpe: 7 }), [], context)).toEqual({
      label: 'PROGRESS',
      celebrationBasis: 'weight',
    });
  });

  it('returns PR when the checked weight exceeds both the target and the all-time max', () => {
    const context = {
      target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 },
      allTimeMaxWeightKg: 42,
      allTimeMaxRepsAtWeight: null,
    };
    expect(reactiveSignal(set({ weightKg: 44, rpe: 7 }), [], context)).toEqual({
      label: 'PR',
      celebrationBasis: 'weight',
    });
  });

  it('returns PROGRESS when there is no recorded all-time max yet', () => {
    const context = {
      target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 },
      allTimeMaxWeightKg: null,
      allTimeMaxRepsAtWeight: null,
    };
    expect(reactiveSignal(set({ weightKg: 43, rpe: 7 }), [], context)).toEqual({
      label: 'PROGRESS',
      celebrationBasis: 'weight',
    });
  });

  it('does not trigger for a weight at or below the target with no rep record either', () => {
    expect(reactiveSignal(set({ weightKg: 42, reps: 10, rpe: 7 }), [], targetContext(42, 10))).toBeNull();
    expect(reactiveSignal(set({ weightKg: 40, reps: 10, rpe: 7 }), [], targetContext(42, 10))).toBeNull();
  });

  it('regression: a high-RPE PR/PROGRESS keeps the celebration as primary, with HOLD as a secondary caution', () => {
    // Revises the earlier "HOLD takes priority" behaviour — a genuine PR
    // shouldn't lose its celebration just because effort was also high.
    // See docs/DECISIONS.md.
    const context = {
      target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 },
      allTimeMaxWeightKg: 42,
      allTimeMaxRepsAtWeight: null,
    };
    expect(reactiveSignal(set({ weightKg: 44, rpe: 9 }), [], context)).toEqual({
      label: 'PR',
      secondary: 'HOLD',
      celebrationBasis: 'weight',
    });
  });

  it('a high-RPE set with no target exceeded is still plain HOLD, no secondary', () => {
    expect(reactiveSignal(set({ rpe: 9, reps: 10 }), [], targetContext(42, 10))).toEqual({ label: 'HOLD' });
  });
});

describe('R12: more reps at the same weight also celebrates (docs/DECISIONS.md)', () => {
  it('returns PROGRESS when reps exceed the all-time record at this exact weight, even below target', () => {
    const context = targetContext(42, 10); // weight target 42kg; best-ever at 40kg is 10 reps
    expect(reactiveSignal(set({ weightKg: 40, reps: 11, rpe: 7 }), [], context)).toEqual({
      label: 'PROGRESS',
      celebrationBasis: 'reps',
    });
  });

  it('does not trigger for matching, not beating, the all-time rep record at this weight', () => {
    const context = targetContext(42, 10);
    expect(reactiveSignal(set({ weightKg: 40, reps: 10, rpe: 7 }), [], context)).toBeNull();
  });

  it('a rep record can never be a PR, only PROGRESS — the weight was necessarily logged before', () => {
    // allTimeMaxRepsAtWeight only has a value because this weight has history,
    // so it can't simultaneously be a new all-time-heaviest weight.
    const context = {
      target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 },
      allTimeMaxWeightKg: 40,
      allTimeMaxRepsAtWeight: 10,
    };
    expect(reactiveSignal(set({ weightKg: 40, reps: 12, rpe: 7 }), [], context)).toEqual({
      label: 'PROGRESS',
      celebrationBasis: 'reps',
    });
  });

  it('a weight increase is reported as the basis over a simultaneous rep record', () => {
    const context = {
      target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 },
      allTimeMaxWeightKg: 40,
      allTimeMaxRepsAtWeight: 5, // exceeding target weight, so this doesn't get checked
    };
    expect(reactiveSignal(set({ weightKg: 44, reps: 12, rpe: 7 }), [], context)).toEqual({
      label: 'PR',
      celebrationBasis: 'weight',
    });
  });

  it('a high-RPE rep record also gets the HOLD secondary caution', () => {
    const context = targetContext(42, 10);
    expect(reactiveSignal(set({ weightKg: 40, reps: 11, rpe: 9 }), [], context)).toEqual({
      label: 'PROGRESS',
      secondary: 'HOLD',
      celebrationBasis: 'reps',
    });
  });
});

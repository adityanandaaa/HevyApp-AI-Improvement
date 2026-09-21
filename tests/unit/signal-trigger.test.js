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
const NO_CONTEXT = { target: null, allTimeMaxWeightKg: null };

/**
 * @param {number} weightKg
 * @returns {import('../../src/domain/rules/signal-trigger.js').ReactiveSignalContext}
 */
function targetContext(weightKg) {
  return { target: { weightKg, currentWeightKg: weightKg - 2, repsMin: 8, repsMax: 10 }, allTimeMaxWeightKg: null };
}

describe('R12: reactive signal triggers', () => {
  it('returns HOLD when the checked set is RPE 9 or higher', () => {
    expect(reactiveSignal(set({ rpe: 9 }), [], NO_CONTEXT)).toBe('HOLD');
    expect(reactiveSignal(set({ rpe: 9.5 }), [], NO_CONTEXT)).toBe('HOLD');
  });

  it('returns null for RPE 8 or lower with no rep drop and no target', () => {
    expect(reactiveSignal(set({ rpe: 8 }), [], NO_CONTEXT)).toBeNull();
  });

  it('returns BACK_OFF when reps drop by 2 or more from the previous set at the same weight', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior, NO_CONTEXT)).toBe('BACK_OFF');
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
    expect(reactiveSignal(set({ weightKg: 40, reps: 7, rpe: 9 }), prior, NO_CONTEXT)).toBe('HOLD');
  });

  it('uses the most recent prior set at that weight, not the first', () => {
    const prior = [set({ weightKg: 40, reps: 15, rpe: 6 }), set({ weightKg: 40, reps: 9, rpe: 7 })];
    // Most recent prior set at 40kg had 9 reps; dropping to 8 is only a 1-rep drop.
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior, NO_CONTEXT)).toBeNull();
  });
});

describe('R12: PROGRESS and PR (exceeding the target should celebrate, not interrogate)', () => {
  it('returns PROGRESS when the checked weight exceeds the target but not the all-time max', () => {
    const context = { target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 }, allTimeMaxWeightKg: 44 };
    expect(reactiveSignal(set({ weightKg: 43, rpe: 7 }), [], context)).toBe('PROGRESS');
  });

  it('returns PR when the checked weight exceeds both the target and the all-time max', () => {
    const context = { target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 }, allTimeMaxWeightKg: 42 };
    expect(reactiveSignal(set({ weightKg: 44, rpe: 7 }), [], context)).toBe('PR');
  });

  it('returns PROGRESS when there is no recorded all-time max yet', () => {
    const context = { target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 }, allTimeMaxWeightKg: null };
    expect(reactiveSignal(set({ weightKg: 43, rpe: 7 }), [], context)).toBe('PROGRESS');
  });

  it('does not trigger for a weight at or below the target', () => {
    expect(reactiveSignal(set({ weightKg: 42, rpe: 7 }), [], targetContext(42))).toBeNull();
    expect(reactiveSignal(set({ weightKg: 40, rpe: 7 }), [], targetContext(42))).toBeNull();
  });

  it('HOLD (high RPE) still takes priority over PROGRESS/PR', () => {
    const context = { target: { weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 }, allTimeMaxWeightKg: 42 };
    expect(reactiveSignal(set({ weightKg: 44, rpe: 9 }), [], context)).toBe('HOLD');
  });
});

import { describe, expect, it } from 'vitest';

import { reactiveSignal } from '../../src/domain/rules/signal-trigger.js';

/**
 * @param {Partial<import('../../src/domain/types.js').SetEntry>} overrides
 * @returns {import('../../src/domain/types.js').SetEntry}
 */
function set(overrides) {
  return { type: 'normal', weightKg: 40, reps: 10, rpe: 7, ...overrides };
}

describe('R12: reactive signal triggers', () => {
  it('returns HOLD when the checked set is RPE 9 or higher', () => {
    expect(reactiveSignal(set({ rpe: 9 }), [])).toBe('HOLD');
    expect(reactiveSignal(set({ rpe: 9.5 }), [])).toBe('HOLD');
  });

  it('returns null for RPE 8 or lower with no rep drop', () => {
    expect(reactiveSignal(set({ rpe: 8 }), [])).toBeNull();
  });

  it('returns BACK_OFF when reps drop by 2 or more from the previous set at the same weight', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior)).toBe('BACK_OFF');
  });

  it('does not trigger BACK_OFF for a 1-rep drop', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 9, rpe: 7 }), prior)).toBeNull();
  });

  it('only compares against a prior set at the same weight', () => {
    const prior = [set({ weightKg: 30, reps: 15, rpe: 6 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior)).toBeNull();
  });

  it('prefers HOLD over BACK_OFF when both conditions are met', () => {
    const prior = [set({ weightKg: 40, reps: 10, rpe: 7 })];
    expect(reactiveSignal(set({ weightKg: 40, reps: 7, rpe: 9 }), prior)).toBe('HOLD');
  });

  it('uses the most recent prior set at that weight, not the first', () => {
    const prior = [set({ weightKg: 40, reps: 15, rpe: 6 }), set({ weightKg: 40, reps: 9, rpe: 7 })];
    // Most recent prior set at 40kg had 9 reps; dropping to 8 is only a 1-rep drop.
    expect(reactiveSignal(set({ weightKg: 40, reps: 8, rpe: 7 }), prior)).toBeNull();
  });
});

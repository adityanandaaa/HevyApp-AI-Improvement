import { describe, expect, it } from 'vitest';

import { evaluate } from '../../src/domain/rules/evaluate.js';
import { computeTarget } from '../../src/domain/rules/target.js';
import { workingWeight } from '../../src/domain/rules/working-weight.js';
import { PUSH_DAY_EXERCISES } from '../../src/data/exercises.js';
import { PUSH_DAY_SESSIONS } from '../../src/data/sessions.js';

/** @typedef {import('../../src/domain/rules/evaluate.js').EvaluateInput} EvaluateInput */

/**
 * @param {Partial<EvaluateInput>} [overrides]
 * @returns {EvaluateInput}
 */
function baseInput(overrides = {}) {
  return {
    routineExercises: PUSH_DAY_EXERCISES,
    sessions: PUSH_DAY_SESSIONS,
    todaysLogs: [],
    painReports: [],
    ...overrides,
  };
}

/** @param {string} id */
function exerciseById(id) {
  const exercise = PUSH_DAY_EXERCISES.find((e) => e.id === id);
  if (!exercise) throw new Error(`no such exercise: ${id}`);
  return exercise;
}

describe('golden tests (HANDOFF section 7)', () => {
  it('T1: Incline history, no pain -> PUSH allowed, target 42kg for 8-10 reps', () => {
    const evaluation = evaluate(baseInput(), 'incline-bench-press');
    expect(evaluation.allowed).toContain('PUSH');

    const target = computeTarget(exerciseById('incline-bench-press'), PUSH_DAY_SESSIONS, evaluation);
    expect(target).toEqual({ weightKg: 42, currentWeightKg: 40, repsMin: 8, repsMax: 10 });
  });

  it('T2: Seated Lateral Raise history -> PUSH blocked with high_rpe; only HOLD and BACK_OFF allowed', () => {
    const evaluation = evaluate(baseInput(), 'seated-lateral-raise');
    expect(evaluation.blocked).toContainEqual({ label: 'PUSH', why: 'high_rpe' });
    expect([...evaluation.allowed].sort()).toEqual(['BACK_OFF', 'HOLD']);
  });

  it('T3: Chest Fly history -> PUSH allowed', () => {
    const evaluation = evaluate(baseInput(), 'chest-fly');
    expect(evaluation.allowed).toContain('PUSH');
  });

  it('T4: Shoulder Press history -> PUSH blocked with push_gate, and not high; HOLD is allowed', () => {
    const evaluation = evaluate(baseInput(), 'shoulder-press');
    expect(evaluation.blocked).toContainEqual({ label: 'PUSH', why: 'push_gate' });
    expect(evaluation.blocked.some((b) => b.why === 'high_rpe')).toBe(false);
    expect(evaluation.allowed).toContain('HOLD');
  });

  it('T5: Single Arm Triceps Pushdown history -> PUSH blocked with push_gate; HOLD is allowed', () => {
    const evaluation = evaluate(baseInput(), 'triceps-pushdown');
    expect(evaluation.blocked).toContainEqual({ label: 'PUSH', why: 'push_gate' });
    expect(evaluation.allowed).toContain('HOLD');
  });

  it('T6: Dips history -> historyBuilding is true with count 2, no signal', () => {
    const evaluation = evaluate(baseInput(), 'bodyweight-dips');
    expect(evaluation.historyBuilding).toBe(true);
    expect(evaluation.historyCount).toBe(2);
    expect(evaluation.allowed).toEqual([]);
  });

  it('T7: pain on Incline propagates per the pain table', () => {
    const input = baseInput({ painReports: [{ exerciseId: 'incline-bench-press', atSetIndex: 1 }] });

    expect(evaluate(input, 'incline-bench-press').painEffect).toBe('block');

    const chestFly = evaluate(input, 'chest-fly');
    expect(chestFly.painEffect).toBe('block');
    expect(chestFly.painSource).toBe('Incline Bench Press (Dumbbell)');

    for (const id of ['shoulder-press', 'seated-lateral-raise', 'triceps-pushdown']) {
      const evaluation = evaluate(input, id);
      expect(evaluation.painEffect).toBe('soft');
      expect(evaluation.blocked.some((b) => b.why === 'pain')).toBe(false);
    }

    const dips = evaluate(input, 'bodyweight-dips');
    expect(dips.painEffect).toBe('block');
    expect(dips.historyBuilding).toBe(true);
  });

  it('T8: a demanding Incline set today turns Chest Fly PUSH into HOLD (cross_exercise)', () => {
    /** @type {import('../../src/domain/types.js').ExerciseLog[]} */
    const todaysLogs = [
      { exerciseId: 'incline-bench-press', sets: [{ type: 'normal', weightKg: 42, reps: 8, rpe: 9.5 }] },
    ];
    const evaluation = evaluate(baseInput({ todaysLogs }), 'chest-fly');
    expect(evaluation.blocked).toContainEqual({ label: 'PUSH', why: 'cross_exercise' });
    expect(evaluation.allowed).not.toContain('PUSH');
  });

  it('T9: a warm-up set at a different weight is ignored by working weight', () => {
    /** @type {import('../../src/domain/types.js').ExerciseLog} */
    const log = {
      exerciseId: 'incline-bench-press',
      sets: [
        { type: 'warmup', weightKg: 20, reps: 15, rpe: 5 },
        { type: 'normal', weightKg: 40, reps: 10, rpe: 7 },
        { type: 'normal', weightKg: 40, reps: 8, rpe: 7.5 },
      ],
    };
    expect(workingWeight(log)).toBe(40);
  });

  it('T10: the same input always returns the same Evaluation', () => {
    const inputA = baseInput();
    const inputB = JSON.parse(JSON.stringify(baseInput()));
    expect(evaluate(inputA, 'incline-bench-press')).toEqual(evaluate(inputB, 'incline-bench-press'));
    expect(evaluate(inputA, 'chest-fly')).toEqual(evaluate(inputB, 'chest-fly'));
  });
});

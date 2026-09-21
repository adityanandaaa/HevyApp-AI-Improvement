import { describe, expect, it } from 'vitest';

import { computeTodaysFocus } from '../../src/domain/rules/todays-focus.js';
import { composeTodaysFocusCopy, explain } from '../../src/reasoning/scripted.js';
import { LIMITS } from '../../src/domain/copy.js';
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

describe('T14: Today\'s Focus data for Push Day', () => {
  const data = computeTodaysFocus(input);

  it('leads with Incline Bench Press', () => {
    expect(data.leadExercise.id).toBe('incline-bench-press');
  });

  it('push list is Incline and Chest Fly', () => {
    expect(data.pushExercises.map((p) => p.exercise.id).sort()).toEqual(['chest-fly', 'incline-bench-press'].sort());
  });

  it('hold list is Shoulder Press, Seated Lateral Raise and Triceps Pushdown', () => {
    expect(data.holdExercises.map((p) => p.exercise.id).sort()).toEqual(
      ['shoulder-press', 'seated-lateral-raise', 'triceps-pushdown'].sort(),
    );
  });

  it('building list is Dips', () => {
    expect(data.buildingExercises.map((p) => p.exercise.id)).toEqual(['bodyweight-dips']);
  });

  it('both wordings are within the character limits', () => {
    const copy = composeTodaysFocusCopy(data);
    expect(copy.homeHeadline.length).toBeLessThanOrEqual(LIMITS.homeHook);
    expect(copy.homeTeaser.length).toBeLessThanOrEqual(LIMITS.homeTeaser);
    expect(copy.workoutExpect.length).toBeLessThanOrEqual(LIMITS.workoutExpect);
    expect(copy.workoutTackle.length).toBeLessThanOrEqual(LIMITS.workoutTackle);
  });

  it('the signal is PUSH, since the lead exercise (Incline) is push-ready', () => {
    const copy = composeTodaysFocusCopy(data);
    expect(copy.signalLabel).toBe('PUSH');
  });
});

describe('direction line reasons stay within limits for every Push Day exercise', () => {
  for (const exercise of PUSH_DAY_EXERCISES) {
    it(`${exercise.name}`, () => {
      const evaluation = evaluate(input, exercise.id);
      const target = computeTarget(exercise, input.sessions, evaluation);
      const label = evaluation.allowed.includes('PUSH') ? 'PUSH' : 'HOLD';
      const reason = explain({ trigger: 'direction', exercise, evaluation, target }, label);
      expect(reason.length).toBeLessThanOrEqual(LIMITS.directionReason);
    });
  }
});

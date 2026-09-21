/** @typedef {import('../types.js').Exercise} Exercise */
/** @typedef {import('../types.js').Evaluation} Evaluation */
/** @typedef {import('./target.js').Target} Target */
/** @typedef {import('./evaluate.js').EvaluateInput} EvaluateInput */

import { evaluate } from './evaluate.js';
import { computeTarget } from './target.js';

// R14, confirmed by Aditya: Today's Focus always leads with Incline Bench Press.
const LEAD_EXERCISE_ID = 'incline-bench-press';

/**
 * @typedef {object} ExerciseWithEvaluation
 * @property {Exercise} exercise
 * @property {Evaluation} evaluation
 */

/**
 * @typedef {object} TodaysFocusData
 * @property {Exercise} leadExercise
 * @property {Evaluation} leadEvaluation
 * @property {Target | null} leadTarget
 * @property {ExerciseWithEvaluation[]} pushExercises lifts to push
 * @property {ExerciseWithEvaluation[]} holdExercises lifts to hold steady
 * @property {ExerciseWithEvaluation[]} buildingExercises lifts still building history
 */

/**
 * R14: one data object behind both Today's Focus wordings (Home hook and
 * Workout plan card). Uses only Aditya's own history and today's routine
 * (AC-6) — the wording itself is composed elsewhere (reasoning/scripted.js).
 * @param {EvaluateInput} input
 * @returns {TodaysFocusData}
 */
export function computeTodaysFocus(input) {
  const leadExercise = input.routineExercises.find((e) => e.id === LEAD_EXERCISE_ID);
  if (!leadExercise) {
    throw new Error(`computeTodaysFocus: lead exercise "${LEAD_EXERCISE_ID}" is not in the routine`);
  }

  const leadEvaluation = evaluate(input, LEAD_EXERCISE_ID);
  const leadTarget = computeTarget(leadExercise, input.sessions, leadEvaluation);

  /** @type {ExerciseWithEvaluation[]} */
  const pushExercises = [];
  /** @type {ExerciseWithEvaluation[]} */
  const holdExercises = [];
  /** @type {ExerciseWithEvaluation[]} */
  const buildingExercises = [];

  for (const exercise of input.routineExercises) {
    const evaluation = evaluate(input, exercise.id);
    if (evaluation.historyBuilding) {
      buildingExercises.push({ exercise, evaluation });
    } else if (evaluation.allowed.includes('PUSH')) {
      pushExercises.push({ exercise, evaluation });
    } else {
      holdExercises.push({ exercise, evaluation });
    }
  }

  return { leadExercise, leadEvaluation, leadTarget, pushExercises, holdExercises, buildingExercises };
}

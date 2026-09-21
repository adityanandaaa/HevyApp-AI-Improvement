/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */
/** @typedef {import('../types.js').SetEntry} SetEntry */
/** @typedef {import('../types.js').Exercise} Exercise */

import { workingSets } from './working-sets.js';

// INTERPRETATION: see HANDOFF section 7 (R2, R3). Working weight and
// "session successful" are my technical reading of the PRD.

/**
 * R2: the working weight of a session for an exercise is the highest weight
 * among its working sets.
 * @param {ExerciseLog} log
 * @returns {number | null}
 */
export function workingWeight(log) {
  const sets = workingSets(log);
  if (sets.length === 0) return null;
  return Math.max(...sets.map((set) => set.weightKg));
}

/**
 * R2: the working sets at a session's working weight.
 * @param {ExerciseLog} log
 * @returns {SetEntry[]}
 */
export function setsAtWorkingWeight(log) {
  const weight = workingWeight(log);
  if (weight === null) return [];
  return workingSets(log).filter((set) => set.weightKg === weight);
}

/**
 * R3: a session is successful when every set at working weight reaches at
 * least the bottom of the target rep range.
 * @param {ExerciseLog} log
 * @param {Exercise} exercise
 * @returns {boolean}
 */
export function isSuccessfulSession(log, exercise) {
  const sets = setsAtWorkingWeight(log);
  if (sets.length === 0) return false;
  return sets.every((set) => set.reps >= exercise.targetReps.min);
}

/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */
/** @typedef {import('../types.js').Exercise} Exercise */

import { isSuccessfulSession, setsAtWorkingWeight, workingWeight } from './working-weight.js';

/**
 * The RPE of the final (chronologically last) set at working weight.
 * @param {ExerciseLog} log
 * @returns {number | null}
 */
export function finalWorkingSetRpe(log) {
  const sets = setsAtWorkingWeight(log);
  const lastSet = sets.at(-1);
  return lastSet ? lastSet.rpe : null;
}

/**
 * R6: if the final working set had RPE 9 or higher in each of the last three
 * sessions, PUSH is blocked (`high_rpe`), never allowed.
 * @param {ExerciseLog[]} lastThreeLogs most recent first
 * @returns {boolean}
 */
export function isConsistentlyHighRpe(lastThreeLogs) {
  if (lastThreeLogs.length < 3) return false;
  return lastThreeLogs.every((log) => {
    const rpe = finalWorkingSetRpe(log);
    return rpe !== null && rpe >= 9;
  });
}

/**
 * R5: PUSH is allowed only when the last three sessions were successful, at
 * the same working weight, and every set at working weight had RPE 8 or lower.
 * @param {ExerciseLog[]} lastThreeLogs most recent first
 * @param {Exercise} exercise
 * @returns {boolean}
 */
export function isPushGateMet(lastThreeLogs, exercise) {
  if (lastThreeLogs.length < 3) return false;

  const weights = lastThreeLogs.map((log) => workingWeight(log));
  const sameWeight = weights.every((weight) => weight !== null && weight === weights[0]);
  const allSuccessful = lastThreeLogs.every((log) => isSuccessfulSession(log, exercise));
  const allAtOrBelow8 = lastThreeLogs.every((log) => setsAtWorkingWeight(log).every((set) => set.rpe <= 8));

  return sameWeight && allSuccessful && allAtOrBelow8;
}

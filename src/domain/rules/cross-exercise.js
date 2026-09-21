/** @typedef {import('../types.js').Exercise} Exercise */
/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */

import { workingSets } from './working-sets.js';

/**
 * R7: cross-exercise context never unlocks a push, but a demanding earlier
 * compound in today's session turns an otherwise-met push gate into a hold.
 * Demanding means any working set of that compound today had RPE 9 or higher
 * (threshold confirmed by Aditya).
 * @param {Exercise[]} routineExercises in routine order
 * @param {ExerciseLog[]} todaysLogs
 * @param {number} exerciseIndex index of the exercise being evaluated
 * @returns {boolean}
 */
export function hasEarlierDemandingCompound(routineExercises, todaysLogs, exerciseIndex) {
  for (let i = 0; i < exerciseIndex; i++) {
    const earlier = routineExercises[i];
    if (!earlier?.isCompound) continue;

    const log = todaysLogs.find((l) => l.exerciseId === earlier.id);
    if (!log) continue;

    if (workingSets(log).some((set) => set.rpe >= 9)) return true;
  }
  return false;
}

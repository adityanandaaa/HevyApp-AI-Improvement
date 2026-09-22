/** @typedef {import('../types.js').Session} Session */
/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */

import { workingWeight } from './working-weight.js';
import { workingSets } from './working-sets.js';

// INTERPRETATION: see HANDOFF section 7 (R4, R5). "Last three sessions" means
// the three most recent completed sessions that include the exercise.

/**
 * @param {Session[]} sessions oldest first
 * @param {string} exerciseId
 * @returns {ExerciseLog[]} the exercise's logs, oldest first
 */
export function logsForExercise(sessions, exerciseId) {
  /** @type {ExerciseLog[]} */
  const logs = [];
  for (const session of sessions) {
    const log = session.logs.find((l) => l.exerciseId === exerciseId);
    if (log) logs.push(log);
  }
  return logs;
}

/**
 * R4: an exercise has history when at least 3 completed sessions include it.
 * @param {Session[]} sessions
 * @param {string} exerciseId
 * @returns {number}
 */
export function historyCount(sessions, exerciseId) {
  return logsForExercise(sessions, exerciseId).length;
}

/**
 * R5: the last N completed sessions that include the exercise, most recent first.
 * @param {Session[]} sessions oldest first
 * @param {string} exerciseId
 * @param {number} n
 * @returns {ExerciseLog[]}
 */
export function lastNLogs(sessions, exerciseId, n) {
  return logsForExercise(sessions, exerciseId).slice(-n).reverse();
}

/**
 * The heaviest working weight ever logged for this exercise, across every
 * completed session (not just the last three) — used to tell a genuine PR
 * apart from simply exceeding today's suggested target (PROGRESS).
 * @param {Session[]} sessions
 * @param {string} exerciseId
 * @returns {number | null}
 */
export function allTimeMaxWorkingWeight(sessions, exerciseId) {
  const weights = logsForExercise(sessions, exerciseId)
    .map((log) => workingWeight(log))
    .filter((weight) => weight !== null);
  if (weights.length === 0) return null;
  return Math.max(...weights);
}

/**
 * The most reps ever logged at one specific weight for this exercise,
 * across every completed session — lets a rep record at an existing weight
 * count as progress too, not just a weight increase (docs/DECISIONS.md:
 * "more reps at the same weight also celebrates").
 * @param {Session[]} sessions
 * @param {string} exerciseId
 * @param {number} weightKg
 * @returns {number | null}
 */
export function allTimeMaxRepsAtWeight(sessions, exerciseId, weightKg) {
  const reps = logsForExercise(sessions, exerciseId)
    .flatMap((log) => workingSets(log))
    .filter((set) => set.weightKg === weightKg)
    .map((set) => set.reps);
  if (reps.length === 0) return null;
  return Math.max(...reps);
}

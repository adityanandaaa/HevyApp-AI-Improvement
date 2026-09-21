/** @typedef {import('../types.js').Session} Session */
/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */

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

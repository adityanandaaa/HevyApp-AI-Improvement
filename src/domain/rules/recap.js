/** @typedef {import('../types.js').Exercise} Exercise */
/** @typedef {import('../types.js').SetEntry} SetEntry */
/** @typedef {import('../types.js').Session} Session */
/** @typedef {import('../types.js').Evaluation} Evaluation */
/** @typedef {import('./target.js').Target} Target */

import { evaluate } from './evaluate.js';
import { historyCount } from './history.js';
import { computeTarget } from './target.js';

/**
 * @typedef {object} RecapRow
 * @property {Exercise} exercise
 * @property {SetEntry[]} setsToday
 * @property {Evaluation} evaluation computed from sessions before today — what was recommended going in
 * @property {Target | null} target
 * @property {number} historyCountBeforeToday
 */

/**
 * @typedef {object} RecapData
 * @property {RecapRow[]} rows one per routine exercise, in routine order
 */

/**
 * R13: the data behind the recap, built from today's logs and the sessions
 * before today. Wording is composed elsewhere (reasoning/scripted.js).
 * @param {Exercise[]} routineExercises
 * @param {Session[]} sessionsBeforeToday
 * @param {Record<string, SetEntry[]>} todaysSetsByExercise exerciseId -> today's sets, in row order
 * @returns {RecapData}
 */
export function computeRecap(routineExercises, sessionsBeforeToday, todaysSetsByExercise) {
  const input = {
    routineExercises,
    sessions: sessionsBeforeToday,
    todaysLogs: [],
    painReports: [],
  };

  const rows = routineExercises.map((exercise) => {
    const evaluation = evaluate(input, exercise.id);
    const target = computeTarget(exercise, sessionsBeforeToday, evaluation);
    return {
      exercise,
      setsToday: todaysSetsByExercise[exercise.id] ?? [],
      evaluation,
      target,
      historyCountBeforeToday: historyCount(sessionsBeforeToday, exercise.id),
    };
  });

  return { rows };
}

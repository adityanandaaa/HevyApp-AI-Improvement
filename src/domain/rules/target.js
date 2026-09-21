/** @typedef {import('../types.js').Exercise} Exercise */
/** @typedef {import('../types.js').Session} Session */
/** @typedef {import('../types.js').Evaluation} Evaluation */

import { lastNLogs } from './history.js';
import { workingWeight } from './working-weight.js';

/**
 * @typedef {object} Target
 * @property {number} weightKg
 * @property {number} repsMin
 * @property {number} repsMax
 */

// INTERPRETATION: see HANDOFF section 7. HANDOFF gives no exact increment
// formula for the next push weight, only the worked example in section 9
// (stable at 40kg -> "try 42kg today?"). 2kg is read from that example.
const PUSH_INCREMENT_KG = 2;

/**
 * The suggested weight for an exercise's next working sets: +2kg when PUSH
 * is allowed, otherwise the same stable working weight.
 * @param {Exercise} exercise
 * @param {Session[]} sessions
 * @param {Evaluation} evaluation
 * @returns {Target | null} null when there is no completed session to base a target on
 */
export function computeTarget(exercise, sessions, evaluation) {
  const [mostRecentLog] = lastNLogs(sessions, exercise.id, 1);
  if (!mostRecentLog) return null;

  const currentWeight = workingWeight(mostRecentLog);
  if (currentWeight === null) return null;

  const weightKg = evaluation.allowed.includes('PUSH') ? currentWeight + PUSH_INCREMENT_KG : currentWeight;
  return { weightKg, repsMin: exercise.targetReps.min, repsMax: exercise.targetReps.max };
}

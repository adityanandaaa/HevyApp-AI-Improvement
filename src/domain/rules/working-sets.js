/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */
/** @typedef {import('../types.js').SetEntry} SetEntry */

/**
 * R1: working sets are every set not tagged warm-up. Drop and failure sets
 * count as normal sets until decided (HANDOFF section 13).
 * @param {ExerciseLog} log
 * @returns {SetEntry[]}
 */
export function workingSets(log) {
  return log.sets.filter((set) => set.type !== 'warmup');
}

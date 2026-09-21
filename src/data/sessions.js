/** @typedef {import('../domain/types.js').SetEntry} SetEntry */
/** @typedef {import('../domain/types.js').Session} Session */

/**
 * @param {number} weightKg
 * @param {number} reps
 * @param {number} rpe
 * @returns {SetEntry}
 */
function normalSet(weightKg, reps, rpe) {
  return { type: 'normal', weightKg, reps, rpe };
}

/**
 * MOCK. HANDOFF section 8: three logged Push Day sessions, oldest first.
 * S-1 (last in this array) is the most recent. All sets are normal sets;
 * RPE values and session dates are invented. Dips has no S-3 log, giving it
 * a history count of 2 (history-building).
 * @type {Session[]}
 */
export const PUSH_DAY_SESSIONS = [
  {
    id: 's-3',
    dateISO: '2026-09-08',
    logs: [
      {
        exerciseId: 'incline-bench-press',
        sets: [normalSet(30, 15, 6), normalSet(40, 11, 7.5), normalSet(40, 10, 8)],
      },
      {
        exerciseId: 'shoulder-press',
        sets: [normalSet(24, 10, 8), normalSet(24, 9, 8.5), normalSet(24, 8, 8.5)],
      },
      {
        exerciseId: 'seated-lateral-raise',
        sets: [normalSet(15, 15, 8), normalSet(15, 15, 8.5), normalSet(15, 15, 9)],
      },
      {
        exerciseId: 'chest-fly',
        sets: [normalSet(20, 12, 7), normalSet(20, 11, 7.5), normalSet(20, 10, 8)],
      },
      {
        exerciseId: 'triceps-pushdown',
        sets: [normalSet(12, 12, 8), normalSet(12, 11, 8.5), normalSet(12, 10, 8.5)],
      },
    ],
  },
  {
    id: 's-2',
    dateISO: '2026-09-13',
    logs: [
      {
        exerciseId: 'incline-bench-press',
        sets: [normalSet(30, 15, 6), normalSet(40, 12, 7), normalSet(40, 10, 8)],
      },
      {
        exerciseId: 'shoulder-press',
        sets: [normalSet(24, 10, 8), normalSet(24, 9, 8.5), normalSet(24, 8, 8.5)],
      },
      {
        exerciseId: 'seated-lateral-raise',
        sets: [normalSet(15, 15, 8), normalSet(15, 15, 9), normalSet(15, 15, 9)],
      },
      {
        exerciseId: 'chest-fly',
        sets: [normalSet(20, 12, 7), normalSet(20, 12, 7.5), normalSet(20, 11, 8)],
      },
      {
        exerciseId: 'triceps-pushdown',
        sets: [normalSet(12, 12, 8), normalSet(12, 11, 8.5), normalSet(12, 11, 8.5)],
      },
      {
        exerciseId: 'bodyweight-dips',
        sets: [normalSet(0, 10, 8), normalSet(0, 9, 8.5), normalSet(0, 8, 9)],
      },
    ],
  },
  {
    id: 's-1',
    dateISO: '2026-09-18',
    logs: [
      {
        exerciseId: 'incline-bench-press',
        sets: [normalSet(30, 15, 6), normalSet(40, 12, 7.5), normalSet(40, 10, 8)],
      },
      {
        exerciseId: 'shoulder-press',
        sets: [normalSet(24, 10, 8), normalSet(24, 9, 8.5), normalSet(24, 9, 8.5)],
      },
      {
        exerciseId: 'seated-lateral-raise',
        sets: [normalSet(15, 15, 8.5), normalSet(15, 15, 9), normalSet(15, 15, 9.5)],
      },
      {
        exerciseId: 'chest-fly',
        sets: [normalSet(20, 12, 7), normalSet(20, 12, 7.5), normalSet(20, 12, 8)],
      },
      {
        exerciseId: 'triceps-pushdown',
        sets: [normalSet(12, 12, 8), normalSet(12, 12, 8.5), normalSet(12, 11, 8.5)],
      },
      {
        exerciseId: 'bodyweight-dips',
        sets: [normalSet(0, 10, 8), normalSet(0, 10, 8.5), normalSet(0, 9, 9)],
      },
    ],
  },
];

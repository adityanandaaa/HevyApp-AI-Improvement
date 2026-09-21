/** @typedef {import('../types.js').SetEntry} SetEntry */

// R12: the prototype's default policy covers two reactive triggers, checked
// against the set just logged. Every other signal (PR, ADAPT, PROGRESS) is
// scripted in scenarios, which this prototype doesn't build yet — see
// README "Interpretations".

/** Confirmed by Aditya (also used by the push gate, R5/R6). */
const HIGH_RPE_THRESHOLD = 9;

// INTERPRETATION: see HANDOFF section 7. The BACK OFF threshold is my choice.
const REP_DROP_THRESHOLD = 2;

/**
 * @param {SetEntry} checkedSet the set just checked
 * @param {SetEntry[]} priorSetsToday this exercise's working sets logged
 *   earlier today, in order, NOT including the one just checked
 * @returns {'HOLD' | 'BACK_OFF' | null}
 */
export function reactiveSignal(checkedSet, priorSetsToday) {
  if (checkedSet.rpe >= HIGH_RPE_THRESHOLD) {
    return 'HOLD';
  }

  const previousAtSameWeight = [...priorSetsToday].reverse().find((set) => set.weightKg === checkedSet.weightKg);
  if (previousAtSameWeight && previousAtSameWeight.reps - checkedSet.reps >= REP_DROP_THRESHOLD) {
    return 'BACK_OFF';
  }

  return null;
}

/** @typedef {import('../types.js').SetEntry} SetEntry */
/** @typedef {import('../types.js').SignalLabel} SignalLabel */
/** @typedef {import('./target.js').Target} Target */

// R12: the prototype's default policy. HOLD and BACK_OFF are HANDOFF's own
// two (section 7); PROGRESS and PR were added after Aditya tried pushing
// past the suggested target and got asked "why did you change the weight?"
// instead of being congratulated — see README "Interpretations". ADAPT was
// dropped from scope entirely (not MVP) — see docs/DECISIONS.md.

/** Confirmed by Aditya (also used by the push gate, R5/R6). */
const HIGH_RPE_THRESHOLD = 9;

// INTERPRETATION: see HANDOFF section 7. The BACK OFF threshold is my choice.
const REP_DROP_THRESHOLD = 2;

/**
 * @typedef {object} ReactiveSignalContext
 * @property {Target | null} target today's suggested target for this exercise
 * @property {number | null} allTimeMaxWeightKg the heaviest working weight
 *   ever logged for this exercise, across every completed session
 * @property {number | null} allTimeMaxRepsAtWeight the most reps ever logged
 *   at the checked set's exact weight, across every completed session —
 *   lets a rep record at an existing weight celebrate too, not just a
 *   weight increase (docs/DECISIONS.md)
 */

/**
 * @typedef {object} ReactiveSignal
 * @property {SignalLabel} label the primary signal — what the card leads with
 * @property {SignalLabel} [secondary] a second signal to also convey below
 *   the primary. Currently only ever 'HOLD', for a PROGRESS/PR set that was
 *   also high-RPE (docs/DECISIONS.md): the celebration still leads, but the
 *   card also says the effort was high rather than dropping that entirely.
 * @property {'weight' | 'reps'} [celebrationBasis] only set alongside a
 *   PROGRESS/PR label — whether it triggered by exceeding the target
 *   weight, or by matching/beating it while setting a new rep record at
 *   that weight. Wording differs (docs/DECISIONS.md).
 */

/**
 * @param {SetEntry} checkedSet the set just checked
 * @param {SetEntry[]} priorSetsToday this exercise's working sets logged
 *   earlier today, in order, NOT including the one just checked
 * @param {ReactiveSignalContext} context
 * @returns {ReactiveSignal | null}
 */
export function reactiveSignal(checkedSet, priorSetsToday, context) {
  const isHighRpe = checkedSet.rpe >= HIGH_RPE_THRESHOLD;

  const exceedsTargetWeight = Boolean(context.target && checkedSet.weightKg > context.target.weightKg);
  // A weight logged before always has allTimeMaxWeightKg >= it (that
  // session's own working weight was at least this much), so this can only
  // be true for a weight that's never set a rep record before — meaning a
  // rep-based celebration is always PROGRESS, never PR.
  const exceedsRepsAtThisWeight =
    context.allTimeMaxRepsAtWeight !== null && checkedSet.reps > context.allTimeMaxRepsAtWeight;

  if (exceedsTargetWeight || exceedsRepsAtThisWeight) {
    const isAllTimeHeaviest = context.allTimeMaxWeightKg !== null && checkedSet.weightKg > context.allTimeMaxWeightKg;
    const label = isAllTimeHeaviest ? 'PR' : 'PROGRESS';
    const celebrationBasis = exceedsTargetWeight ? 'weight' : 'reps';
    return isHighRpe ? { label, secondary: 'HOLD', celebrationBasis } : { label, celebrationBasis };
  }

  if (isHighRpe) {
    return { label: 'HOLD' };
  }

  const previousAtSameWeight = [...priorSetsToday].reverse().find((set) => set.weightKg === checkedSet.weightKg);
  if (previousAtSameWeight && previousAtSameWeight.reps - checkedSet.reps >= REP_DROP_THRESHOLD) {
    return { label: 'BACK_OFF' };
  }

  return null;
}

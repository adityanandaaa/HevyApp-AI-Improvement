/** @typedef {import('../types.js').SetEntry} SetEntry */
/** @typedef {import('../types.js').Evaluation} Evaluation */
/** @typedef {import('./target.js').Target} Target */

/**
 * R11, INTERPRETATION (see HANDOFF section 7): a lighter ramp set is a set
 * whose Previous weight is below last session's working weight.
 * @param {number} previousWeightKg the row's own "Previous" weight
 * @param {number | null} lastSessionWorkingWeightKg
 * @returns {boolean}
 */
export function isRampSet(previousWeightKg, lastSessionWorkingWeightKg) {
  if (lastSessionWorkingWeightKg === null) return false;
  return previousWeightKg < lastSessionWorkingWeightKg;
}

/**
 * R11: reason chips show every time a working set is checked at a weight
 * different from the exercise's target weight (up or down), except for a
 * lighter ramp set or an exercise still building history.
 * @param {object} params
 * @param {SetEntry} params.checkedSet
 * @param {number} params.previousWeightKg
 * @param {number | null} params.lastSessionWorkingWeightKg
 * @param {Evaluation} params.evaluation
 * @param {Target | null} params.target
 * @returns {boolean}
 */
export function shouldShowChips({ checkedSet, previousWeightKg, lastSessionWorkingWeightKg, evaluation, target }) {
  if (evaluation.historyBuilding) return false;
  if (!target) return false;
  if (isRampSet(previousWeightKg, lastSessionWorkingWeightKg)) return false;
  return checkedSet.weightKg !== target.weightKg;
}

/**
 * AC-38: "Why did you skip the push?" only when a push was recommended and
 * the checked weight is less than the target; otherwise "Why did you change
 * the weight?".
 * @param {Evaluation} evaluation
 * @param {SetEntry} checkedSet
 * @param {Target} target
 * @returns {'push_skipped' | 'other_change'}
 */
export function chipsHeadingKind(evaluation, checkedSet, target) {
  const pushWasRecommended = evaluation.allowed.includes('PUSH');
  const loggedLess = checkedSet.weightKg < target.weightKg;
  return pushWasRecommended && loggedLess ? 'push_skipped' : 'other_change';
}

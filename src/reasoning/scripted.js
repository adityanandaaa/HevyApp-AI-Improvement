/** @typedef {import('../domain/types.js').ReasoningInput} ReasoningInput */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */
/** @typedef {import('../domain/rules/target.js').Target} Target */
/** @typedef {import('../domain/rules/todays-focus.js').TodaysFocusData} TodaysFocusData */

import { enforceGuardrails } from './provider.js';
import { COPY, LIMITS } from '../domain/copy.js';

// The prototype implementation of ReasoningProvider (HANDOFF section 5, rule
// 6): wording is scripted here, not model-generated, but through the same
// {choose, explain} interface a live model (M8) would implement, so the UI
// never has to change to swap one for the other.

/**
 * @param {ReasoningInput} input
 * @returns {SignalLabel | null}
 */
export function choose(input) {
  const { allowed } = input.evaluation;
  const preferred = allowed.includes('PUSH')
    ? 'PUSH'
    : allowed.includes('HOLD')
      ? 'HOLD'
      : allowed.includes('BACK_OFF')
        ? 'BACK_OFF'
        : null;
  return enforceGuardrails(input.evaluation, preferred);
}

/**
 * INTERPRETATION: see HANDOFF section 7. Reason text uses each exercise's
 * full name rather than HANDOFF's colloquial shorthand for Incline ("Your
 * incline has been stable...") — a generic short-name deriver isn't
 * specified, and hardcoding per-exercise nicknames didn't seem worth the
 * fragility for a 6-exercise prototype.
 * @param {string} exerciseName
 * @param {Target} target
 * @returns {string}
 */
function pushReason(exerciseName, target) {
  return (
    `Your ${exerciseName} has been stable at ${target.currentWeightKg}kg x ${target.repsMax} for three ` +
    `sessions at RPE 8 or lower. If the first set feels controlled, consider ${target.weightKg}kg.`
  );
}

/**
 * @param {string} exerciseName
 * @param {Target} target
 * @param {boolean} isHighRpe
 * @returns {string}
 */
function holdReason(exerciseName, target, isHighRpe) {
  if (isHighRpe) {
    return (
      `Your ${exerciseName} has felt like a high-effort lift at ${target.currentWeightKg}kg recently. ` +
      `Stay here and let it feel easier before pushing.`
    );
  }
  return (
    `Your ${exerciseName} is holding at ${target.currentWeightKg}kg. Keep chasing clean reps in the ` +
    `target range before adding weight.`
  );
}

/**
 * @param {ReasoningInput} input
 * @param {SignalLabel} label
 * @returns {string}
 */
export function explain(input, label) {
  const { evaluation, exercise, target } = input;

  if (evaluation.historyBuilding) {
    return COPY.historyBuilding(evaluation.historyCount);
  }

  if (evaluation.painEffect === 'block' && evaluation.painSource) {
    return COPY.painPrimaryOverlap(evaluation.painSource);
  }

  const isHighRpe = evaluation.blocked.some((b) => b.label === 'PUSH' && b.why === 'high_rpe');
  let reason = !target
    ? `Keep your ${exercise.name} steady today.`
    : label === 'PUSH'
      ? pushReason(exercise.name, target)
      : holdReason(exercise.name, target, isHighRpe);

  if (evaluation.painEffect === 'soft' && evaluation.sharedMuscle) {
    const withNote = `${reason} ${COPY.painSecondaryOverlap(evaluation.sharedMuscle)}`;
    if (withNote.length <= LIMITS.directionReason) reason = withNote;
  }

  return reason;
}

/**
 * @param {string[]} names
 * @returns {string}
 */
function joinNames(names) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

/**
 * @param {number} count
 * @returns {string}
 */
function countWord(count) {
  return COUNT_WORDS[count] ?? String(count);
}

/**
 * @param {TodaysFocusData} data
 * @returns {string}
 */
function composeWorkoutExpect(data) {
  /** @type {string[]} */
  const parts = [];

  if (data.pushExercises.length > 0) {
    parts.push(`Push on ${joinNames(data.pushExercises.map((p) => p.exercise.name))}.`);
  }
  if (data.holdExercises.length > 0) {
    parts.push(`Hold steady on the other ${countWord(data.holdExercises.length)}.`);
  }
  for (const { exercise, evaluation } of data.buildingExercises) {
    parts.push(`${exercise.name} is still building history (${evaluation.historyCount} of 3 sessions).`);
  }

  return parts.join(' ');
}

/**
 * R14: the lead exercise is always Incline, so "incline" can be named
 * directly here rather than derived.
 * @param {TodaysFocusData} data
 * @returns {string}
 */
function composeWorkoutTackle(data) {
  if (!data.leadTarget) {
    return `Start incline at a comfortable weight and reassess after the first set.`;
  }
  return (
    `Start incline at ${data.leadTarget.currentWeightKg}kg. If the first working set feels controlled at ` +
    `RPE 8 or lower, go to ${data.leadTarget.weightKg}kg. At RPE 9 or higher, stay put and keep the rest steady.`
  );
}

/**
 * @typedef {object} TodaysFocusCopy
 * @property {SignalLabel} signalLabel
 * @property {string} homeHeadline
 * @property {string} homeTeaser
 * @property {string} workoutExpect
 * @property {string} workoutTackle
 */

/**
 * R14: composes both Today's Focus wordings from one data object.
 * @param {TodaysFocusData} data
 * @returns {TodaysFocusCopy}
 */
export function composeTodaysFocusCopy(data) {
  const signalLabel =
    choose({
      trigger: 'today',
      exercise: data.leadExercise,
      evaluation: data.leadEvaluation,
      target: data.leadTarget,
    }) ?? 'HOLD';

  const pushing = signalLabel === 'PUSH';

  const homeHeadline = pushing ? 'Your incline is ready for more.' : `Hold steady on ${data.leadExercise.name} today.`;

  const homeTeaser =
    pushing && data.leadTarget
      ? `Three steady sessions at RPE 8 or lower. Try ${data.leadTarget.weightKg}kg today?`
      : 'Keep the weight steady and focus on clean reps today.';

  return {
    signalLabel,
    homeHeadline,
    homeTeaser,
    workoutExpect: composeWorkoutExpect(data),
    workoutTackle: composeWorkoutTackle(data),
  };
}

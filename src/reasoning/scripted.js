/** @typedef {import('../domain/types.js').ReasoningInput} ReasoningInput */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */
/** @typedef {import('../domain/rules/target.js').Target} Target */
/** @typedef {import('../domain/rules/todays-focus.js').TodaysFocusData} TodaysFocusData */

import { enforceGuardrails } from './provider.js';
import { COPY, LIMITS, displayLabel } from '../domain/copy.js';

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
 * R12/section 8 scenario 2's exact scripted example: "Set 3 was RPE 9. Stay
 * at 40kg, no need to add a set today."
 * @param {number} setNumber
 * @param {import('../domain/types.js').SetEntry} lastSet
 * @returns {string}
 */
function highRpeSetCheckedReason(setNumber, lastSet) {
  return `Set ${setNumber} was RPE ${lastSet.rpe}. Stay at ${lastSet.weightKg}kg, no need to add a set today.`;
}

/**
 * INTERPRETATION: see HANDOFF section 7 (R12). HANDOFF gives no scripted
 * example for the rep-drop trigger, only for the RPE trigger above.
 * @param {number} setNumber
 * @param {import('../domain/types.js').SetEntry} lastSet
 * @returns {string}
 */
function repDropSetCheckedReason(setNumber, lastSet) {
  return `Set ${setNumber} dropped to ${lastSet.reps} reps at ${lastSet.weightKg}kg. Consider backing off or stopping here.`;
}

/**
 * @param {ReasoningInput} input
 * @param {SignalLabel} label
 * @returns {string}
 */
export function explain(input, label) {
  const { evaluation, exercise, target, lastSet, setNumber } = input;

  if (evaluation.historyBuilding) {
    return COPY.historyBuilding(evaluation.historyCount);
  }

  if (evaluation.painEffect === 'block' && evaluation.painSource) {
    return COPY.painPrimaryOverlap(evaluation.painSource);
  }

  if (input.trigger === 'set_checked' && lastSet && setNumber) {
    return label === 'HOLD' ? highRpeSetCheckedReason(setNumber, lastSet) : repDropSetCheckedReason(setNumber, lastSet);
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

/**
 * @param {import('../domain/types.js').SetEntry[]} sets
 * @returns {string}
 */
function describeSetsToday(sets) {
  const parts = sets.map((s) => `${s.weightKg}kg × ${s.reps}`);
  const rpes = sets.map((s) => String(s.rpe));
  const setLabel = sets.length === 1 ? 'Set 1' : `Sets 1 to ${sets.length}`;
  const rpeLabel = rpes.length === 1 ? `RPE ${rpes[0]}` : `RPE ${joinNames(rpes)}`;
  return `${setLabel}: ${parts.join(', ')} at ${rpeLabel}.`;
}

/**
 * @typedef {object} WhySheetCopy
 * @property {string} title
 * @property {string} whatIDid
 * @property {string} calculated
 * @property {string} aiInterpretation
 * @property {string} recommendation
 */

/**
 * AC-18: the Why? sheet's four labelled blocks, in order: What I did
 * (recorded facts), Calculated (metrics), AI interpretation, Recommendation.
 * INTERPRETATION: see HANDOFF section 7. HANDOFF's own worked example
 * (mockup 5) covers only the RPE/HOLD case; the BACK_OFF wording is mine,
 * following the same shape.
 * @param {ReasoningInput} input
 * @param {SignalLabel} label
 * @param {import('../domain/types.js').SetEntry[]} setsToday this exercise's
 *   working sets logged today so far, in order (including the one just checked)
 * @returns {WhySheetCopy}
 */
export function composeWhySheet(input, label, setsToday) {
  const title = `Why ${displayLabel(label)}?`;
  const whatIDid = describeSetsToday(setsToday);
  const lastSet = setsToday[setsToday.length - 1];

  if (label === 'HOLD' && lastSet) {
    const first = setsToday[0]?.rpe;
    const calculated =
      setsToday.length > 1
        ? `RPE rose from ${first} to ${lastSet.rpe} across the ${setsToday.length} sets.`
        : `The set was RPE ${lastSet.rpe}.`;
    return {
      title,
      whatIDid,
      calculated,
      aiInterpretation: 'Effort is climbing within the session, so more load or sets are not advised.',
      recommendation: `Hold at ${lastSet.weightKg}kg. No need to add a set today.`,
    };
  }

  const previous = lastSet
    ? [...setsToday.slice(0, -1)].reverse().find((s) => s.weightKg === lastSet.weightKg)
    : undefined;
  return {
    title,
    whatIDid,
    calculated:
      previous && lastSet
        ? `Reps dropped from ${previous.reps} to ${lastSet.reps} at ${lastSet.weightKg}kg.`
        : 'Reps dropped from the previous set at this weight.',
    aiInterpretation: 'A rep drop like this suggests fatigue is building.',
    recommendation: `Back off the weight or stop here for ${input.exercise.name}.`,
  };
}

/**
 * AC-18, for the Pain-reported card (mockup 6, which shows it under the
 * HOLD label with its own Why? link). AC-34: no diagnosis, no cause, no
 * treatment suggestion — this stays procedural.
 * @param {import('../domain/types.js').Exercise} exercise
 * @returns {WhySheetCopy}
 */
export function composePainWhySheet(exercise) {
  return {
    title: 'Why HOLD?',
    whatIDid: `Reported pain on ${exercise.name}.`,
    calculated: 'Pain isn’t calculated from your sets — it comes directly from you.',
    aiInterpretation: 'A pain report overrides the usual recommendation for the rest of this session.',
    recommendation: COPY.painReported,
  };
}

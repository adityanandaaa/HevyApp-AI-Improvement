/** @typedef {import('../domain/types.js').ReasoningInput} ReasoningInput */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */
/** @typedef {import('../domain/rules/target.js').Target} Target */
/** @typedef {import('../domain/rules/todays-focus.js').TodaysFocusData} TodaysFocusData */

import { enforceGuardrails } from './provider.js';
import { COPY, DEFAULT_LOCALE, LIMITS, displayLabel, formatNumber } from '../domain/copy.js';

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
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function pushReason(exerciseName, target, locale) {
  return (
    `Your ${exerciseName} has been stable at ${formatNumber(target.currentWeightKg, locale)}kg x ${target.repsMax} for three ` +
    `sessions at RPE 8 or lower. If the first set feels controlled, consider ${formatNumber(target.weightKg, locale)}kg.`
  );
}

/**
 * @param {string} exerciseName
 * @param {Target} target
 * @param {boolean} isHighRpe
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function holdReason(exerciseName, target, isHighRpe, locale) {
  if (isHighRpe) {
    return (
      `Your ${exerciseName} has felt like a high-effort lift at ${formatNumber(target.currentWeightKg, locale)}kg recently. ` +
      `Stay here and let it feel easier before pushing.`
    );
  }
  return (
    `Your ${exerciseName} is holding at ${formatNumber(target.currentWeightKg, locale)}kg. Keep chasing clean reps in the ` +
    `target range before adding weight.`
  );
}

/**
 * R12/section 8 scenario 2's exact scripted example: "Set 3 was RPE 9. Stay
 * at 40kg, no need to add a set today."
 * @param {number} setNumber
 * @param {import('../domain/types.js').SetEntry} lastSet
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function highRpeSetCheckedReason(setNumber, lastSet, locale) {
  return `Set ${setNumber} was RPE ${formatNumber(lastSet.rpe, locale)}. Stay at ${formatNumber(lastSet.weightKg, locale)}kg, no need to add a set today.`;
}

/**
 * INTERPRETATION: see HANDOFF section 7 (R12). HANDOFF gives no scripted
 * example for the rep-drop trigger, only for the RPE trigger above.
 * @param {number} setNumber
 * @param {import('../domain/types.js').SetEntry} lastSet
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function repDropSetCheckedReason(setNumber, lastSet, locale) {
  return `Set ${setNumber} dropped to ${lastSet.reps} reps at ${formatNumber(lastSet.weightKg, locale)}kg. Consider backing off or stopping here.`;
}

/**
 * INTERPRETATION: see HANDOFF section 7 (R12) and README "Interpretations" —
 * added so exceeding the suggested target is celebrated, not treated like an
 * unexplained change.
 * @param {number} setNumber
 * @param {import('../domain/types.js').SetEntry} lastSet
 * @param {Target | null} target
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function progressSetCheckedReason(setNumber, lastSet, target, locale) {
  const targetText = target ? `, past the ${formatNumber(target.weightKg, locale)}kg target` : '';
  return `Set ${setNumber} was ${formatNumber(lastSet.weightKg, locale)}kg${targetText}. Nice progress!`;
}

/**
 * INTERPRETATION: see HANDOFF section 7 (R12) and README "Interpretations".
 * @param {number} setNumber
 * @param {import('../domain/types.js').SetEntry} lastSet
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function prSetCheckedReason(setNumber, lastSet, locale) {
  return `Set ${setNumber} was ${formatNumber(lastSet.weightKg, locale)}kg — your heaviest yet on this lift. Great work!`;
}

/**
 * @param {ReasoningInput} input
 * @param {SignalLabel} label
 * @returns {string}
 */
export function explain(input, label) {
  const { evaluation, exercise, target, lastSet, setNumber, locale = DEFAULT_LOCALE } = input;

  if (evaluation.historyBuilding) {
    return COPY.historyBuilding(evaluation.historyCount);
  }

  if (evaluation.painEffect === 'block' && evaluation.painSource) {
    return COPY.painPrimaryOverlap(evaluation.painSource);
  }

  if (input.trigger === 'set_checked' && lastSet && setNumber) {
    if (label === 'HOLD') return highRpeSetCheckedReason(setNumber, lastSet, locale);
    if (label === 'PROGRESS') return progressSetCheckedReason(setNumber, lastSet, target ?? null, locale);
    if (label === 'PR') return prSetCheckedReason(setNumber, lastSet, locale);
    return repDropSetCheckedReason(setNumber, lastSet, locale);
  }

  const isHighRpe = evaluation.blocked.some((b) => b.label === 'PUSH' && b.why === 'high_rpe');
  let reason = !target
    ? `Keep your ${exercise.name} steady today.`
    : label === 'PUSH'
      ? pushReason(exercise.name, target, locale)
      : holdReason(exercise.name, target, isHighRpe, locale);

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
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function composeWorkoutTackle(data, locale) {
  if (!data.leadTarget) {
    return `Start incline at a comfortable weight and reassess after the first set.`;
  }
  return (
    `Start incline at ${formatNumber(data.leadTarget.currentWeightKg, locale)}kg. If the first working set feels controlled at ` +
    `RPE 8 or lower, go to ${formatNumber(data.leadTarget.weightKg, locale)}kg. At RPE 9 or higher, stay put and keep the rest steady.`
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
 * @param {import('../domain/copy.js').Locale} [locale]
 * @returns {TodaysFocusCopy}
 */
export function composeTodaysFocusCopy(data, locale = DEFAULT_LOCALE) {
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
      ? `Three steady sessions at RPE 8 or lower. Try ${formatNumber(data.leadTarget.weightKg, locale)}kg today?`
      : 'Keep the weight steady and focus on clean reps today.';

  return {
    signalLabel,
    homeHeadline,
    homeTeaser,
    workoutExpect: composeWorkoutExpect(data),
    workoutTackle: composeWorkoutTackle(data, locale),
  };
}

/**
 * "Set 3" for one set, "Sets 1 to 3" for a contiguous run, or "Sets 1, 3" if
 * there's a gap (e.g. set 2 was never checked) — using the sets' own row
 * numbers rather than assuming they were checked in order from 1.
 * @param {number[]} setNumbers in ascending order
 * @returns {string}
 */
function setNumberLabel(setNumbers) {
  const first = setNumbers[0];
  if (first === undefined) return 'No sets'; // defensive: shouldn't happen, the Why? sheet only opens after a check
  if (setNumbers.length === 1) return `Set ${first}`;
  const last = setNumbers[setNumbers.length - 1];
  const isContiguous = setNumbers.every((n, i) => i === 0 || n === (setNumbers[i - 1] ?? n - 1) + 1);
  return isContiguous ? `Sets ${first} to ${last}` : `Sets ${setNumbers.join(', ')}`;
}

/**
 * @param {{ setNumber: number, set: import('../domain/types.js').SetEntry }[]} setsToday
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function describeSetsToday(setsToday, locale) {
  const parts = setsToday.map(({ set }) => `${formatNumber(set.weightKg, locale)}kg × ${set.reps}`);
  const rpes = setsToday.map(({ set }) => formatNumber(set.rpe, locale));
  const setLabel = setNumberLabel(setsToday.map((s) => s.setNumber));
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
 * @param {{ setNumber: number, set: import('../domain/types.js').SetEntry }[]} setsToday
 *   this exercise's working sets logged today so far, in row order
 *   (including the one just checked), each tagged with its actual row
 *   number — sets aren't always checked in order starting from 1
 * @returns {WhySheetCopy}
 */
export function composeWhySheet(input, label, setsToday) {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const title = `Why ${displayLabel(label)}?`;
  const whatIDid = describeSetsToday(setsToday, locale);
  const lastEntry = setsToday[setsToday.length - 1];
  const lastSet = lastEntry?.set;

  if (label === 'HOLD' && lastSet) {
    const first = setsToday[0]?.set.rpe;
    const calculated =
      setsToday.length > 1
        ? `RPE rose from ${formatNumber(first ?? lastSet.rpe, locale)} to ${formatNumber(lastSet.rpe, locale)} across the ${setsToday.length} sets.`
        : `The set was RPE ${formatNumber(lastSet.rpe, locale)}.`;
    return {
      title,
      whatIDid,
      calculated,
      aiInterpretation: 'Effort is climbing within the session, so more load or sets are not advised.',
      recommendation: `Hold at ${formatNumber(lastSet.weightKg, locale)}kg. No need to add a set today.`,
    };
  }

  if (label === 'PROGRESS' && lastSet) {
    const target = input.target;
    return {
      title,
      whatIDid,
      calculated: target
        ? `This set was ${formatNumber(lastSet.weightKg, locale)}kg, above the ${formatNumber(target.weightKg, locale)}kg target.`
        : `This set was ${formatNumber(lastSet.weightKg, locale)}kg.`,
      aiInterpretation: "Going past the suggested target is a good sign you're ready for more.",
      recommendation: 'Recover well, then consider pushing further next session.',
    };
  }

  if (label === 'PR' && lastSet) {
    return {
      title,
      whatIDid,
      calculated: `This set was ${formatNumber(lastSet.weightKg, locale)}kg — your heaviest yet on this lift.`,
      aiInterpretation: 'A new heaviest weight is a strong signal of progress.',
      recommendation: 'Log it and recover well before chasing another PR.',
    };
  }

  const previous = lastSet
    ? [...setsToday.slice(0, -1)].reverse().find(({ set }) => set.weightKg === lastSet.weightKg)?.set
    : undefined;
  return {
    title,
    whatIDid,
    calculated:
      previous && lastSet
        ? `Reps dropped from ${previous.reps} to ${lastSet.reps} at ${formatNumber(lastSet.weightKg, locale)}kg.`
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

/**
 * @param {number} weightKg
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function weightLabel(weightKg, locale) {
  return weightKg === 0 ? 'Bodyweight' : `${formatNumber(weightKg, locale)}kg`;
}

/**
 * AC-44: "one row per exercise (name, sets summary such as '65kg x 8 x 3',
 * and a status)". Matches mockup 7's format: a shared weight collapses to
 * "Wkg x R x N" (or "Wkg x R1, R2, R3" if reps differ), otherwise each set
 * is listed individually. Weight 0 shows as "Bodyweight" (HANDOFF section 8).
 * @param {import('../domain/types.js').SetEntry[]} setsToday
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function formatSetsSummary(setsToday, locale) {
  if (setsToday.length === 0) return 'Not logged';

  const weights = setsToday.map((s) => s.weightKg);
  const reps = setsToday.map((s) => s.reps);
  const sameWeight = weights.every((w) => w === weights[0]);

  if (sameWeight) {
    const sameReps = reps.every((r) => r === reps[0]);
    const first = weights[0];
    if (first === undefined) return 'Not logged';
    if (sameReps) {
      return `${weightLabel(first, locale)} × ${reps[0]} × ${setsToday.length}`;
    }
    return `${weightLabel(first, locale)} × ${reps.join(', ')}`;
  }

  return setsToday.map((s) => `${weightLabel(s.weightKg, locale)} × ${s.reps}`).join(', ');
}

/**
 * INTERPRETATION: see HANDOFF section 7 (R13). Mockup 7's row statuses are a
 * single fully-scripted scenario; this generalises the same shape (what
 * happened, what to do with it) to whatever was actually logged.
 * @param {import('../domain/rules/recap.js').RecapRow} row
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function composeRowStatus(row, locale) {
  const { evaluation, target, setsToday, historyCountBeforeToday } = row;

  if (evaluation.historyBuilding) {
    const newCount = historyCountBeforeToday + (setsToday.length > 0 ? 1 : 0);
    return `History building: now ${newCount} of 3 sessions.`;
  }
  if (setsToday.length === 0) {
    return 'Not logged this session.';
  }

  const maxRpe = Math.max(...setsToday.map((s) => s.rpe));
  const workingWeightToday = Math.max(...setsToday.map((s) => s.weightKg));
  const label = weightLabel(workingWeightToday, locale).toLowerCase();

  if (maxRpe >= 9) {
    return `Held at ${label}. RPE rose to ${formatNumber(maxRpe, locale)} on the last set.`;
  }
  if (evaluation.allowed.includes('PUSH') && target) {
    return workingWeightToday >= target.weightKg
      ? `Pushed to ${label}. Nice work.`
      : `Held at ${label}. Skipped the push today.`;
  }
  return `Steady. Keep ${label} next session.`;
}

/**
 * INTERPRETATION: see HANDOFF section 7. The headline is "scripted per
 * scenario" (R13) — with no scenario system built (see README), this
 * derives a 3-word-or-fewer headline from what was actually logged.
 * @param {import('../domain/rules/recap.js').RecapRow[]} rows
 * @returns {string}
 */
function composeHeadline(rows) {
  const anyLogged = rows.some((row) => row.setsToday.length > 0);
  if (!anyLogged) return 'Quiet session.';

  const anyHighRpe = rows.some((row) => row.setsToday.some((set) => set.rpe >= 9));
  if (anyHighRpe) return 'Tough session.';

  return 'Strong session.';
}

/**
 * @param {string} headline
 * @returns {string}
 */
function composeOverall(headline) {
  if (headline === 'Tough session.') return 'Solid effort. Let the lighter lifts stay easy before pushing again.';
  if (headline === 'Quiet session.') return 'No sets logged today.';
  return 'Good session. Keep the lighter lifts steady.';
}

/**
 * AC-44/section 9: the exact worked example is "Push incline to 42kg if the
 * first set stays at RPE 8 or lower." — reproduced here whenever next
 * session's evaluation (with today's session already counted) agrees.
 * @param {import('../domain/types.js').Evaluation} nextLeadEvaluation
 * @param {import('../domain/rules/target.js').Target | null} nextLeadTarget
 * @param {import('../domain/copy.js').Locale} locale
 * @returns {string}
 */
function composeNextSession(nextLeadEvaluation, nextLeadTarget, locale) {
  if (!nextLeadTarget) {
    return 'Keep building history on incline before pushing.';
  }
  if (nextLeadEvaluation.allowed.includes('PUSH')) {
    return `Push incline to ${formatNumber(nextLeadTarget.weightKg, locale)}kg if the first set stays at RPE 8 or lower.`;
  }
  return `Hold incline at ${formatNumber(nextLeadTarget.weightKg, locale)}kg and keep chasing clean reps.`;
}

/**
 * @typedef {object} RecapRowCopy
 * @property {string} exerciseName
 * @property {string} setsSummary
 * @property {string} status
 */

/**
 * @typedef {object} RecapCopy
 * @property {string} headline
 * @property {RecapRowCopy[]} rows
 * @property {string} nextSession
 * @property {string} overall
 */

/**
 * R13: composes the full recap from its data (domain/rules/recap.js) plus
 * next session's lead-exercise evaluation (computed with today's session
 * already appended to history, so it reflects AC-46).
 * @param {import('../domain/rules/recap.js').RecapData} recap
 * @param {import('../domain/types.js').Evaluation} nextLeadEvaluation
 * @param {import('../domain/rules/target.js').Target | null} nextLeadTarget
 * @param {import('../domain/copy.js').Locale} [locale]
 * @returns {RecapCopy}
 */
export function composeRecap(recap, nextLeadEvaluation, nextLeadTarget, locale = DEFAULT_LOCALE) {
  const headline = composeHeadline(recap.rows);
  return {
    headline,
    rows: recap.rows.map((row) => ({
      exerciseName: row.exercise.name,
      setsSummary: formatSetsSummary(row.setsToday, locale),
      status: composeRowStatus(row, locale),
    })),
    nextSession: composeNextSession(nextLeadEvaluation, nextLeadTarget, locale),
    overall: composeOverall(headline),
  };
}

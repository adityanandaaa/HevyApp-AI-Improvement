/** @typedef {import('../domain/types.js').SetEntry} SetEntry */
/** @typedef {import('../domain/types.js').ExerciseLog} ExerciseLog */
/** @typedef {import('../domain/types.js').Session} Session */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */
/** @typedef {import('../domain/types.js').PainState} PainState */
/** @typedef {import('../domain/copy.js').Locale} Locale */

import { PUSH_DAY_EXERCISES } from '../data/exercises.js';
import { PUSH_DAY_SESSIONS } from '../data/sessions.js';
import { DEFAULT_LOCALE } from '../domain/copy.js';

// Mutable, in-memory, session-scoped runtime state (HANDOFF file tree calls
// this "state/store"). Nothing here is persisted: a reload starts a fresh
// session, matching pain's own session scope (R10) and the rest of the
// prototype's "mock data only" premise.

/**
 * @typedef {object} SignalState
 * @property {string} exerciseId
 * @property {number} setNumber 1-based, the row that triggered it (0 for Pain, which isn't tied to a row)
 * @property {SignalLabel} label
 * @property {string} reason
 * @property {boolean} [isPain] true when this card came from the Pain button, not a rule trigger
 */

/**
 * @typedef {object} ChipsState
 * @property {string} exerciseId
 * @property {number} setNumber
 * @property {'push_skipped' | 'other_change'} headingKind
 * @property {string | null} savedReason
 */

/**
 * @typedef {object} RestTimerState
 * @property {string} exerciseId
 * @property {number} totalSeconds
 * @property {number} remainingSeconds
 */

/**
 * @typedef {object} RejectedRecommendation
 * @property {string} exerciseId
 * @property {number} setNumber
 * @property {string} reason
 */

/**
 * @typedef {object} State
 * @property {Session[]} sessions completed sessions, oldest first; grows by one each Finish (AC-46)
 * @property {Record<string, Record<number, SetEntry>>} todaysSetsByExercise exerciseId -> { setNumber: SetEntry }
 * @property {PainState[]} painReports R10: pain reports so far this session
 * @property {SignalState | null} signal
 * @property {ChipsState | null} chips
 * @property {RestTimerState | null} restTimer
 * @property {RejectedRecommendation[]} rejectedRecommendations
 * @property {Locale} locale dev-toolbar toggle (AC-68), en-GB or id-ID
 */

/** @type {State} */
export const state = {
  sessions: [...PUSH_DAY_SESSIONS],
  todaysSetsByExercise: {},
  painReports: [],
  signal: null,
  chips: null,
  restTimer: null,
  rejectedRecommendations: [],
  locale: DEFAULT_LOCALE,
};

/** @param {Locale} locale */
export function setLocale(locale) {
  state.locale = locale;
}

/**
 * The live EvaluateInput, reflecting everything logged/reported so far this
 * session. Shared by ui/render.js (direction lines) and ui/log-workout.js
 * (signals), so both react to the same pain/today's-logs state.
 * @returns {import('../domain/rules/evaluate.js').EvaluateInput}
 */
export function buildEvaluateInput() {
  return {
    routineExercises: PUSH_DAY_EXERCISES,
    sessions: state.sessions,
    todaysLogs: todaysLogs(),
    painReports: state.painReports,
  };
}

/**
 * R10: report pain on an exercise, at any point in the session. Reporting it
 * again on the same exercise is a no-op here — undo is `clearPain`.
 * @param {string} exerciseId
 * @param {number} atSetIndex
 */
export function reportPain(exerciseId, atSetIndex) {
  if (state.painReports.some((p) => p.exerciseId === exerciseId)) return;
  state.painReports.push({ exerciseId, atSetIndex });
}

/**
 * AC-32: tapping "Pain reported" again clears it and restores normal
 * evaluation for that exercise (and whatever it was propagating to later
 * exercises).
 * @param {string} exerciseId
 */
export function clearPain(exerciseId) {
  state.painReports = state.painReports.filter((p) => p.exerciseId !== exerciseId);
}

/** @param {string} exerciseId */
export function isPainReported(exerciseId) {
  return state.painReports.some((p) => p.exerciseId === exerciseId);
}

/**
 * @param {string} exerciseId
 * @param {(setNumber: number) => boolean} [predicate]
 * @returns {SetEntry[]} in row order (set 1, 2, 3, ...)
 */
function setsWhere(exerciseId, predicate) {
  const bySetNumber = state.todaysSetsByExercise[exerciseId] ?? {};
  return Object.keys(bySetNumber)
    .map(Number)
    .filter((n) => (predicate ? predicate(n) : true))
    .sort((a, b) => a - b)
    .map((n) => /** @type {SetEntry} */ (bySetNumber[n]));
}

/**
 * @param {string} exerciseId
 * @returns {SetEntry[]} every set logged today for this exercise, in row order
 */
export function setsLoggedToday(exerciseId) {
  return setsWhere(exerciseId);
}

/**
 * Like `setsLoggedToday`, but keeps each set's actual row number attached —
 * needed wherever sets might not have been checked in order (e.g. set 3
 * checked without 1/2), so "Set N" text doesn't fall back to array position.
 * @param {string} exerciseId
 * @returns {{ setNumber: number, set: SetEntry }[]} in row order
 */
export function setsLoggedTodayWithNumbers(exerciseId) {
  const bySetNumber = state.todaysSetsByExercise[exerciseId] ?? {};
  return Object.keys(bySetNumber)
    .map(Number)
    .sort((a, b) => a - b)
    .map((setNumber) => ({ setNumber, set: /** @type {SetEntry} */ (bySetNumber[setNumber]) }));
}

/**
 * @param {string} exerciseId
 * @param {number} setNumber
 * @returns {SetEntry[]} sets logged today for this exercise, at a row position before setNumber
 */
export function setsLoggedBefore(exerciseId, setNumber) {
  return setsWhere(exerciseId, (n) => n < setNumber);
}

/**
 * @returns {ExerciseLog[]} today's logs for every exercise with at least one set so far
 */
export function todaysLogs() {
  return Object.keys(state.todaysSetsByExercise)
    .map((exerciseId) => ({ exerciseId, sets: setsLoggedToday(exerciseId) }))
    .filter((log) => log.sets.length > 0);
}

/**
 * @param {string} exerciseId
 * @param {number} setNumber 1-based, matches the row's fixed position
 * @param {SetEntry} set
 */
export function logSet(exerciseId, setNumber, set) {
  const bySetNumber = state.todaysSetsByExercise[exerciseId] ?? (state.todaysSetsByExercise[exerciseId] = {});
  bySetNumber[setNumber] = set;
}

/**
 * @param {string} exerciseId
 * @param {number} setNumber
 */
export function unlogSet(exerciseId, setNumber) {
  delete state.todaysSetsByExercise[exerciseId]?.[setNumber];
}

/** @param {SignalState | null} signal */
export function setSignal(signal) {
  state.signal = signal;
}

/** @param {ChipsState | null} chips */
export function setChips(chips) {
  state.chips = chips;
}

/**
 * R11: a choice is stored as a rejected recommendation with its reason,
 * never as failed (AC-42).
 * @param {string} reason
 */
export function selectChip(reason) {
  if (!state.chips) return;
  state.chips = { ...state.chips, savedReason: reason };
  state.rejectedRecommendations.push({
    exerciseId: state.chips.exerciseId,
    setNumber: state.chips.setNumber,
    reason,
  });
}

/**
 * @param {string} exerciseId
 * @param {number} totalSeconds
 */
export function startRestTimer(exerciseId, totalSeconds) {
  state.restTimer = { exerciseId, totalSeconds, remainingSeconds: totalSeconds };
}

/** @param {number} deltaSeconds */
export function adjustRestTimer(deltaSeconds) {
  if (!state.restTimer) return;
  state.restTimer.remainingSeconds = Math.max(0, state.restTimer.remainingSeconds + deltaSeconds);
}

/** @returns {boolean} true if the timer just reached zero */
export function tickRestTimer() {
  if (!state.restTimer || state.restTimer.remainingSeconds === 0) return false;
  state.restTimer.remainingSeconds = Math.max(0, state.restTimer.remainingSeconds - 1);
  return state.restTimer.remainingSeconds === 0;
}

export function endRestTimer() {
  if (!state.restTimer) return;
  state.restTimer.remainingSeconds = 0;
}

/**
 * @typedef {object} FinishResult
 * @property {Session[]} sessionsBeforeToday
 * @property {Record<string, SetEntry[]>} todaysSetsByExercise exerciseId -> sets, snapshotted before clearing
 * @property {Session[]} sessionsAfterToday including the session just finished
 */

/**
 * AC-43/R13: ends the session — today's logs become a new completed
 * session (AC-46: the next evaluation already includes it) — and clears
 * today's in-progress state. Returns what the recap is built from; the
 * wording itself is composed by the caller (reasoning/scripted.js
 * composeRecap), keeping this module state-only.
 * @returns {FinishResult}
 */
export function finishSession() {
  const sessionsBeforeToday = state.sessions;
  /** @type {Record<string, SetEntry[]>} */
  const todaysSetsByExerciseSnapshot = {};
  for (const exercise of PUSH_DAY_EXERCISES) {
    todaysSetsByExerciseSnapshot[exercise.id] = setsLoggedToday(exercise.id);
  }

  /** @type {Session} */
  const newSession = {
    id: `today-${sessionsBeforeToday.length + 1}`,
    dateISO: new Date().toISOString().slice(0, 10),
    logs: todaysLogs(),
  };
  const sessionsAfterToday = [...sessionsBeforeToday, newSession];

  state.sessions = sessionsAfterToday;
  state.todaysSetsByExercise = {};
  state.painReports = [];
  state.signal = null;
  state.chips = null;
  state.restTimer = null;

  return { sessionsBeforeToday, todaysSetsByExercise: todaysSetsByExerciseSnapshot, sessionsAfterToday };
}

/** Test-only: returns the module to a fresh session. */
export function resetState() {
  state.sessions = [...PUSH_DAY_SESSIONS];
  state.todaysSetsByExercise = {};
  state.painReports = [];
  state.signal = null;
  state.chips = null;
  state.restTimer = null;
  state.rejectedRecommendations = [];
}

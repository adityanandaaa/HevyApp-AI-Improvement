// JSDoc type definitions matching HANDOFF section 6. No runtime code: other
// modules reference these via `@typedef {import('./types.js').X} X`.

/**
 * @typedef {'warmup'|'normal'|'drop'|'failure'} SetType
 * @typedef {'chest'|'shoulders'|'triceps'|'biceps'|'back'|'quads'|'hamstrings'|'glutes'|'calves'|'core'} Muscle
 * @typedef {'PUSH'|'HOLD'|'BACK_OFF'|'PR'|'PROGRESS'} SignalLabel
 * @typedef {'history'|'push_gate'|'high_rpe'|'cross_exercise'|'pain'} BlockReason
 */

/**
 * @typedef {object} Exercise
 * @property {string} id
 * @property {string} name Hevy style, e.g. "Incline Bench Press (Dumbbell)"
 * @property {Muscle[]} primary MOCK tags, not verified against Hevy
 * @property {Muscle[]} secondary
 * @property {boolean} isCompound MOCK tag
 * @property {{min: number, max: number}} targetReps
 * @property {number} restSeconds
 */

/**
 * @typedef {object} SetEntry
 * @property {SetType} type
 * @property {number} weightKg
 * @property {number} reps
 * @property {number} rpe always present
 */

/**
 * @typedef {object} ExerciseLog
 * @property {string} exerciseId
 * @property {SetEntry[]} sets
 */

/**
 * @typedef {object} Session
 * @property {string} id
 * @property {string} dateISO
 * @property {ExerciseLog[]} logs
 */

/**
 * @typedef {object} Routine
 * @property {string} id
 * @property {string} name
 * @property {string[]} exerciseIds
 */

/**
 * @typedef {object} PainState Session-scoped, cleared on undo or session end.
 * @property {string} exerciseId
 * @property {number} atSetIndex
 */

/**
 * @typedef {object} Evaluation
 * @property {string} exerciseId
 * @property {number} historyCount
 * @property {boolean} historyBuilding fewer than 3 logged sessions
 * @property {SignalLabel[]} allowed
 * @property {{label: SignalLabel, why: BlockReason}[]} blocked
 * @property {'none'|'soft'|'block'} painEffect
 * @property {string} [painSource] name of the exercise where pain was reported
 * @property {Muscle} [sharedMuscle] used in the soft wording
 */

/**
 * @typedef {object} ReasoningInput
 * @property {'today'|'direction'|'set_checked'|'recap'} trigger
 * @property {Exercise} exercise
 * @property {Evaluation} evaluation
 * @property {SetEntry} [lastSet]
 * @property {import('./rules/target.js').Target | null} [target] INTERPRETATION: not
 *   in HANDOFF's section 6 sketch. The scripted reason text (section 9) states
 *   concrete weight numbers ("stable at 40kg... consider 42kg"), so the
 *   scripted provider needs the computed target alongside the evaluation. A
 *   live model (M8) may not need this same field — M8 point 3 sends only the
 *   evaluation, exercise name, last set and trigger.
 * @property {number} [setNumber] INTERPRETATION: also not in section 6. The
 *   scripted `set_checked` wording states which set triggered it (section 8
 *   scenario 2: "Set 3 was RPE 9..."), which needs the set's 1-based position
 *   in today's log for this exercise.
 * @property {import('./copy.js').Locale} [locale] INTERPRETATION: also not in
 *   section 6. AC-68 requires locale-aware numbers in the scripted text
 *   itself, so the wording layer needs to know which locale to format in.
 * @property {'weight' | 'reps'} [celebrationBasis] only meaningful for a
 *   PROGRESS/PR `set_checked` trigger — whether it was exceeding the target
 *   weight or a new rep record at an existing weight (docs/DECISIONS.md).
 */

export {};

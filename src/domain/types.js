// JSDoc type definitions matching HANDOFF section 6. No runtime code: other
// modules reference these via `@typedef {import('./types.js').X} X`.

/**
 * @typedef {'warmup'|'normal'|'drop'|'failure'} SetType
 * @typedef {'chest'|'shoulders'|'triceps'|'biceps'|'back'|'quads'|'hamstrings'|'glutes'|'calves'|'core'} Muscle
 * @typedef {'PUSH'|'HOLD'|'BACK_OFF'|'PR'|'ADAPT'|'PROGRESS'} SignalLabel
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
 */

export {};

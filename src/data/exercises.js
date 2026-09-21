/** @typedef {import('../domain/types.js').Exercise} Exercise */
/** @typedef {import('../domain/types.js').Routine} Routine */

/**
 * MOCK. Push Day routine, in Aditya's own order (HANDOFF section 8). Only
 * Incline Bench Press and Seated Lateral Raise carry full Hevy names, taken
 * from the reference screenshots; the rest follow Aditya's own list. Muscle
 * tags and compound flags use general knowledge, not Hevy's own data.
 * @type {Exercise[]}
 */
export const PUSH_DAY_EXERCISES = [
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press (Dumbbell)',
    primary: ['chest'],
    secondary: ['shoulders', 'triceps'],
    isCompound: true,
    targetReps: { min: 8, max: 10 },
    restSeconds: 120,
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    primary: ['shoulders'],
    secondary: ['triceps'],
    isCompound: true,
    targetReps: { min: 8, max: 10 },
    restSeconds: 120,
  },
  {
    id: 'seated-lateral-raise',
    name: 'Seated Lateral Raise (Dumbbell)',
    primary: ['shoulders'],
    secondary: [],
    isCompound: false,
    targetReps: { min: 12, max: 15 },
    restSeconds: 90,
  },
  {
    id: 'chest-fly',
    name: 'Chest Fly',
    primary: ['chest'],
    secondary: ['shoulders'],
    isCompound: false,
    targetReps: { min: 10, max: 12 },
    restSeconds: 90,
  },
  {
    id: 'triceps-pushdown',
    name: 'Single Arm Triceps Pushdown',
    primary: ['triceps'],
    secondary: [],
    isCompound: false,
    targetReps: { min: 10, max: 12 },
    restSeconds: 60,
  },
  {
    id: 'bodyweight-dips',
    name: 'Bodyweight Dips',
    primary: ['chest', 'triceps'],
    secondary: ['shoulders'],
    isCompound: true,
    targetReps: { min: 8, max: 12 },
    restSeconds: 90,
  },
];

/** @type {Routine} */
export const PUSH_DAY_ROUTINE = {
  id: 'push-day',
  name: 'Push Day',
  exerciseIds: PUSH_DAY_EXERCISES.map((exercise) => exercise.id),
};

/** @typedef {import('../types.js').Exercise} Exercise */
/** @typedef {import('../types.js').PainState} PainState */
/** @typedef {import('../types.js').Muscle} Muscle */

/**
 * @param {Muscle[]} a
 * @param {Muscle[]} b
 * @returns {Muscle | null} the first shared muscle, or null
 */
function firstOverlap(a, b) {
  for (const muscle of a) {
    if (b.includes(muscle)) return muscle;
  }
  return null;
}

/**
 * R10: the effect of one earlier pain report (source, "E") on a target
 * exercise ("X"), per the pain table in HANDOFF section 7.
 * @param {Exercise} target
 * @param {Exercise} source
 * @returns {{ effect: 'none'|'soft'|'block', sharedMuscle: Muscle | null }}
 */
function painEffectFromSource(target, source) {
  if (target.id === source.id) {
    return { effect: 'block', sharedMuscle: null };
  }

  if (firstOverlap(target.primary, source.primary)) {
    return { effect: 'block', sharedMuscle: null };
  }

  const targetMuscles = [...target.primary, ...target.secondary];
  const sourceMuscles = [...source.primary, ...source.secondary];
  const shared = firstOverlap(targetMuscles, sourceMuscles);
  if (shared) {
    return { effect: 'soft', sharedMuscle: shared };
  }

  return { effect: 'none', sharedMuscle: null };
}

/**
 * @typedef {object} PainEffectResult
 * @property {'none'|'soft'|'block'} effect
 * @property {string} [painSource]
 * @property {Muscle} [sharedMuscle]
 */

/**
 * R10: combines every pain report at or before the target exercise (in
 * routine order) into one effect. Block beats soft beats none.
 * @param {Exercise} target
 * @param {number} targetIndex target's index in routine order
 * @param {Exercise[]} routineExercises in routine order
 * @param {PainState[]} painReports
 * @returns {PainEffectResult}
 */
export function computePainEffect(target, targetIndex, routineExercises, painReports) {
  const rank = { none: 0, soft: 1, block: 2 };
  /** @type {PainEffectResult} */
  let strongest = { effect: 'none' };

  for (const report of painReports) {
    const sourceIndex = routineExercises.findIndex((e) => e.id === report.exerciseId);
    if (sourceIndex === -1 || sourceIndex > targetIndex) continue;

    const source = routineExercises[sourceIndex];
    if (!source) continue;
    const result = painEffectFromSource(target, source);
    if (rank[result.effect] <= rank[strongest.effect]) continue;

    strongest =
      source.id === target.id
        ? { effect: result.effect }
        : {
            effect: result.effect,
            painSource: source.name,
            ...(result.sharedMuscle ? { sharedMuscle: result.sharedMuscle } : {}),
          };
  }

  return strongest;
}

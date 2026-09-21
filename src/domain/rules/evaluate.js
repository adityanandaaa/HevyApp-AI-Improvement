/** @typedef {import('../types.js').Exercise} Exercise */
/** @typedef {import('../types.js').Session} Session */
/** @typedef {import('../types.js').ExerciseLog} ExerciseLog */
/** @typedef {import('../types.js').PainState} PainState */
/** @typedef {import('../types.js').Evaluation} Evaluation */
/** @typedef {import('../types.js').SignalLabel} SignalLabel */
/** @typedef {import('../types.js').BlockReason} BlockReason */

import { historyCount, lastNLogs } from './history.js';
import { isConsistentlyHighRpe, isPushGateMet } from './push-gate.js';
import { hasEarlierDemandingCompound } from './cross-exercise.js';
import { computePainEffect } from './pain.js';

/**
 * @typedef {object} EvaluateInput
 * @property {Exercise[]} routineExercises exercises in routine order (R8: the routine boundary)
 * @property {Session[]} sessions past completed sessions, oldest first
 * @property {ExerciseLog[]} todaysLogs today's logs so far (may be partial or empty)
 * @property {PainState[]} painReports pain reports so far this session
 */

/**
 * The rules engine (R1-R10). Deterministic and pure (R9): the same input
 * always returns the same Evaluation. Wording is decided elsewhere by the
 * reasoning provider, constrained to `allowed`.
 * @param {EvaluateInput} input
 * @param {string} exerciseId
 * @returns {Evaluation}
 */
export function evaluate(input, exerciseId) {
  const exerciseIndex = input.routineExercises.findIndex((e) => e.id === exerciseId);
  const exercise = input.routineExercises[exerciseIndex];
  if (!exercise) {
    // R8: only exercises already in the routine are evaluated.
    throw new Error(`evaluate: "${exerciseId}" is not in the routine`);
  }

  const count = historyCount(input.sessions, exerciseId);
  const historyBuilding = count < 3;
  const pain = computePainEffect(exercise, exerciseIndex, input.routineExercises, input.painReports);

  if (historyBuilding) {
    return {
      exerciseId,
      historyCount: count,
      historyBuilding: true,
      allowed: [],
      blocked: [{ label: 'PUSH', why: 'history' }],
      painEffect: pain.effect,
      ...(pain.painSource ? { painSource: pain.painSource } : {}),
      ...(pain.sharedMuscle ? { sharedMuscle: pain.sharedMuscle } : {}),
    };
  }

  const lastThree = lastNLogs(input.sessions, exerciseId, 3);
  const consistentlyHighRpe = isConsistentlyHighRpe(lastThree);
  const pushGateMet = isPushGateMet(lastThree, exercise);
  const demandingCompoundToday =
    pushGateMet && hasEarlierDemandingCompound(input.routineExercises, input.todaysLogs, exerciseIndex);

  /** @type {{ label: SignalLabel, why: BlockReason }[]} */
  const blocked = [];

  if (consistentlyHighRpe) {
    blocked.push({ label: 'PUSH', why: 'high_rpe' });
  } else if (!pushGateMet) {
    blocked.push({ label: 'PUSH', why: 'push_gate' });
  } else if (demandingCompoundToday) {
    blocked.push({ label: 'PUSH', why: 'cross_exercise' });
  } else if (pain.effect === 'block') {
    blocked.push({ label: 'PUSH', why: 'pain' }, { label: 'PR', why: 'pain' });
  }

  const pushBlocked = blocked.some((b) => b.label === 'PUSH');
  /** @type {SignalLabel[]} */
  const allowed = pushBlocked ? ['HOLD', 'BACK_OFF'] : ['PUSH', 'HOLD', 'BACK_OFF'];

  return {
    exerciseId,
    historyCount: count,
    historyBuilding: false,
    allowed,
    blocked,
    painEffect: pain.effect,
    ...(pain.painSource ? { painSource: pain.painSource } : {}),
    ...(pain.sharedMuscle ? { sharedMuscle: pain.sharedMuscle } : {}),
  };
}

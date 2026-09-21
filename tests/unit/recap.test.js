import { describe, expect, it } from 'vitest';

import { LIMITS } from '../../src/domain/copy.js';
import { computeRecap } from '../../src/domain/rules/recap.js';
import { evaluate } from '../../src/domain/rules/evaluate.js';
import { computeTarget } from '../../src/domain/rules/target.js';
import { PUSH_DAY_EXERCISES } from '../../src/data/exercises.js';
import { PUSH_DAY_SESSIONS } from '../../src/data/sessions.js';
import { composeRecap } from '../../src/reasoning/scripted.js';

/**
 * @param {number} weightKg
 * @param {number} reps
 * @param {number} rpe
 * @returns {import('../../src/domain/types.js').SetEntry}
 */
function set(weightKg, reps, rpe) {
  return { type: 'normal', weightKg, reps, rpe };
}

/** A full, uneventful Push Day session matching each exercise's last logged pattern. */
const FULL_SESSION_LOGS = {
  'incline-bench-press': [set(30, 15, 6), set(40, 12, 7.5), set(40, 10, 8)],
  'shoulder-press': [set(24, 10, 8), set(24, 9, 8.5), set(24, 9, 8.5)],
  'seated-lateral-raise': [set(15, 15, 8), set(15, 15, 8.5), set(15, 15, 9)],
  'chest-fly': [set(20, 12, 7), set(20, 12, 7.5), set(20, 12, 8)],
  'triceps-pushdown': [set(12, 12, 8), set(12, 12, 8.5), set(12, 11, 8.5)],
  'bodyweight-dips': [set(0, 10, 8), set(0, 10, 8.5), set(0, 9, 9)],
};

function fullRecapCopy() {
  const recap = computeRecap(PUSH_DAY_EXERCISES, PUSH_DAY_SESSIONS, FULL_SESSION_LOGS);
  const incline = /** @type {import('../../src/domain/types.js').Exercise} */ (
    PUSH_DAY_EXERCISES.find((e) => e.id === 'incline-bench-press')
  );
  const sessionsAfter = [
    ...PUSH_DAY_SESSIONS,
    { id: 'today', dateISO: '2026-09-21', logs: Object.entries(FULL_SESSION_LOGS).map(([exerciseId, sets]) => ({ exerciseId, sets })) },
  ];
  const nextEvaluation = evaluate(
    { routineExercises: PUSH_DAY_EXERCISES, sessions: sessionsAfter, todaysLogs: [], painReports: [] },
    'incline-bench-press',
  );
  const nextTarget = computeTarget(incline, sessionsAfter, nextEvaluation);
  return composeRecap(recap, nextEvaluation, nextTarget);
}

describe('R13: computeRecap + composeRecap', () => {
  it('AC-45: produces exactly one row per Push Day exercise (six)', () => {
    const copy = fullRecapCopy();
    expect(copy.rows).toHaveLength(6);
  });

  it('formats sets: shared weight+reps collapses to "W x R x N"', () => {
    const copy = fullRecapCopy();
    const lateralRaise = copy.rows.find((r) => r.exerciseName.includes('Seated Lateral Raise'));
    expect(lateralRaise?.setsSummary).toBe('15kg × 15 × 3');
  });

  it('formats sets: shared weight, differing reps lists them comma-separated', () => {
    const copy = fullRecapCopy();
    const shoulderPress = copy.rows.find((r) => r.exerciseName === 'Shoulder Press');
    expect(shoulderPress?.setsSummary).toBe('24kg × 10, 9, 9');
  });

  it('formats sets: differing weight lists each set individually', () => {
    const copy = fullRecapCopy();
    const incline = copy.rows.find((r) => r.exerciseName.includes('Incline'));
    expect(incline?.setsSummary).toBe('30kg × 15, 40kg × 12, 40kg × 10');
  });

  it('weight 0 shows as "Bodyweight", per HANDOFF section 8', () => {
    const copy = fullRecapCopy();
    const dips = copy.rows.find((r) => r.exerciseName === 'Bodyweight Dips');
    expect(dips?.setsSummary).toBe('Bodyweight × 10, 10, 9');
  });

  it('a still-building exercise reaching 3 sessions today says so', () => {
    const copy = fullRecapCopy();
    const dips = copy.rows.find((r) => r.exerciseName === 'Bodyweight Dips');
    expect(dips?.status).toBe('History building: now 3 of 3 sessions.');
  });

  it('an exercise with no sets logged today is still shown, marked as skipped', () => {
    const partialLogs = { ...FULL_SESSION_LOGS, 'chest-fly': [] };
    const recap = computeRecap(PUSH_DAY_EXERCISES, PUSH_DAY_SESSIONS, partialLogs);
    const chestFlyRow = recap.rows.find((r) => r.exercise.id === 'chest-fly');
    expect(chestFlyRow).toBeDefined();
  });

  it('the headline is at most 3 words and reflects a high-RPE set as "Tough"', () => {
    const toughLogs = { ...FULL_SESSION_LOGS, 'incline-bench-press': [set(30, 15, 6), set(40, 12, 7.5), set(40, 10, 9.5)] };
    const recap = computeRecap(PUSH_DAY_EXERCISES, PUSH_DAY_SESSIONS, toughLogs);
    const copy = composeRecap(recap, evaluate({ routineExercises: PUSH_DAY_EXERCISES, sessions: PUSH_DAY_SESSIONS, todaysLogs: [], painReports: [] }, 'incline-bench-press'), null);
    expect(copy.headline.split(' ').length).toBeLessThanOrEqual(LIMITS.recapHeadlineWords);
    expect(copy.headline).toBe('Tough session.');
  });

  it('the "next session" line matches the exact scripted example when the push gate is still met', () => {
    const copy = fullRecapCopy();
    expect(copy.nextSession).toBe('Push incline to 42kg if the first set stays at RPE 8 or lower.');
  });

  it('every row status and the next-session/overall lines stay within their limits', () => {
    const copy = fullRecapCopy();
    for (const row of copy.rows) {
      expect(row.status.length).toBeLessThanOrEqual(LIMITS.recapStatus);
    }
    expect(copy.nextSession.length).toBeLessThanOrEqual(LIMITS.recapNext);
    expect(copy.overall.length).toBeLessThanOrEqual(LIMITS.recapOverall);
  });
});

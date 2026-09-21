import { describe, expect, it } from 'vitest';

import { CHIP_LABELS, COPY, LIMITS } from '../../src/domain/copy.js';

describe('T11: fixed copy stays within the character limits (HANDOFF section 9)', () => {
  it('the pain reported card fits the signal reason limit', () => {
    expect(COPY.painReported.length).toBeLessThanOrEqual(LIMITS.signalReason);
  });

  it('pain cleared and history building fit their limits', () => {
    expect(COPY.painCleared.length).toBeLessThanOrEqual(LIMITS.signalReason);
    expect(COPY.historyBuilding(2).length).toBeLessThanOrEqual(LIMITS.directionReason);
  });

  it('the pain propagation wording fits the direction reason limit, even for the longest exercise name', () => {
    const longestExerciseName = 'Incline Bench Press (Dumbbell)';
    expect(COPY.painPrimaryOverlap(longestExerciseName).length).toBeLessThanOrEqual(LIMITS.directionReason);
    expect(COPY.painSecondaryOverlap('shoulders').length).toBeLessThanOrEqual(LIMITS.directionReason);
  });

  it('chip labels and the chip-saved confirmation fit the signal reason limit', () => {
    for (const label of CHIP_LABELS) {
      expect(label.length).toBeLessThanOrEqual(LIMITS.signalReason);
    }
    expect(COPY.chipSaved('Pain/discomfort').length).toBeLessThanOrEqual(LIMITS.signalReason);
  });

  it('there are exactly six chips, in the required order', () => {
    expect(CHIP_LABELS).toEqual([
      'Too tired',
      'Poor sleep',
      "Didn't feel ready",
      'Pain/discomfort',
      'Changed my mind',
      'Other',
    ]);
  });

  it('the chip headings match HANDOFF exactly', () => {
    expect(COPY.chipsHeadingPushSkipped).toBe('Why did you skip the push?');
    expect(COPY.chipsHeadingOtherChange).toBe('Why did you change the weight?');
  });
});

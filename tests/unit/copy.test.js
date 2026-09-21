import { describe, expect, it } from 'vitest';

import { CHIP_LABELS, COPY, LIMITS, PUSH_SKIPPED_CHIP_LABELS, chipLabelsFor, formatNumber } from '../../src/domain/copy.js';

describe('T13: locale-aware number formatting', () => {
  it('formats 62.5 as "62,5" under id-ID', () => {
    expect(formatNumber(62.5, 'id-ID')).toBe('62,5');
  });

  it('formats 62.5 as "62.5" under en-GB (the default)', () => {
    expect(formatNumber(62.5)).toBe('62.5');
    expect(formatNumber(62.5, 'en-GB')).toBe('62.5');
  });

  it('formats whole numbers the same in both locales', () => {
    expect(formatNumber(40, 'en-GB')).toBe('40');
    expect(formatNumber(40, 'id-ID')).toBe('40');
  });
});

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
    for (const label of PUSH_SKIPPED_CHIP_LABELS) {
      expect(label.length).toBeLessThanOrEqual(LIMITS.signalReason);
    }
    expect(COPY.chipSaved('Pain/discomfort').length).toBeLessThanOrEqual(LIMITS.signalReason);
  });

  it('AC-37: there are exactly six chips, in the required order, for the general "other change" case', () => {
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

describe('"Regular weight" extra chip (docs/DECISIONS.md)', () => {
  it('only appears under the "skip the push" heading, as the 6th of 7, before "Other"', () => {
    expect(chipLabelsFor('push_skipped')).toEqual([
      'Too tired',
      'Poor sleep',
      "Didn't feel ready",
      'Pain/discomfort',
      'Changed my mind',
      'Regular weight',
      'Other',
    ]);
  });

  it('does not appear for the general "other change" heading, which keeps HANDOFF\'s original six', () => {
    expect(chipLabelsFor('other_change')).toBe(CHIP_LABELS);
    expect(chipLabelsFor('other_change')).not.toContain('Regular weight');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildEvaluateInput,
  clearPain,
  isPainReported,
  reportPain,
  resetState,
  state,
} from '../../src/state/store.js';

beforeEach(() => {
  resetState();
});

describe('pain state (R10, session-scoped)', () => {
  it('reports and clears pain on an exercise', () => {
    expect(isPainReported('incline-bench-press')).toBe(false);

    reportPain('incline-bench-press', 2);
    expect(isPainReported('incline-bench-press')).toBe(true);
    expect(state.painReports).toEqual([{ exerciseId: 'incline-bench-press', atSetIndex: 2 }]);

    clearPain('incline-bench-press');
    expect(isPainReported('incline-bench-press')).toBe(false);
    expect(state.painReports).toEqual([]);
  });

  it('reporting pain twice on the same exercise does not duplicate it', () => {
    reportPain('incline-bench-press', 1);
    reportPain('incline-bench-press', 2);
    expect(state.painReports).toHaveLength(1);
  });

  it('tracks pain independently per exercise', () => {
    reportPain('incline-bench-press', 1);
    reportPain('chest-fly', 0);
    expect(isPainReported('incline-bench-press')).toBe(true);
    expect(isPainReported('chest-fly')).toBe(true);

    clearPain('incline-bench-press');
    expect(isPainReported('incline-bench-press')).toBe(false);
    expect(isPainReported('chest-fly')).toBe(true);
  });

  it('resetState clears pain along with everything else (AC-33, session scope)', () => {
    reportPain('incline-bench-press', 1);
    resetState();
    expect(state.painReports).toEqual([]);
  });
});

describe('buildEvaluateInput', () => {
  it('reflects live pain reports and today\'s logged sets', () => {
    reportPain('incline-bench-press', 0);
    const input = buildEvaluateInput();
    expect(input.painReports).toEqual([{ exerciseId: 'incline-bench-press', atSetIndex: 0 }]);
    expect(input.routineExercises.length).toBe(6);
    expect(input.sessions.length).toBe(3);
  });
});

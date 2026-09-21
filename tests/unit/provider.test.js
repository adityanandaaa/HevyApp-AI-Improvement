import { describe, expect, it } from 'vitest';

import { enforceGuardrails } from '../../src/reasoning/provider.js';

/**
 * @param {import('../../src/domain/types.js').SignalLabel[]} allowed
 * @param {'none' | 'soft' | 'block'} [painEffect]
 */
function evaluationWith(allowed, painEffect = 'none') {
  return /** @type {import('../../src/domain/types.js').Evaluation} */ ({
    exerciseId: 'x',
    historyCount: 3,
    historyBuilding: false,
    allowed,
    blocked: [],
    painEffect,
  });
}

describe('enforceGuardrails (architecture rule 3, HANDOFF section 5)', () => {
  it('passes an allowed label through unchanged', () => {
    expect(enforceGuardrails(evaluationWith(['PUSH', 'HOLD', 'BACK_OFF']), 'PUSH')).toBe('PUSH');
  });

  it('replaces a disallowed label with HOLD when HOLD is allowed', () => {
    expect(enforceGuardrails(evaluationWith(['HOLD', 'BACK_OFF']), 'PUSH')).toBe('HOLD');
  });

  it('replaces a disallowed label with null when HOLD is not allowed either', () => {
    expect(enforceGuardrails(evaluationWith([]), 'PUSH')).toBeNull();
  });

  it('regression: null stays null even when HOLD is allowed (no signal means no signal, AC-12)', () => {
    expect(enforceGuardrails(evaluationWith(['PUSH', 'HOLD', 'BACK_OFF']), null)).toBeNull();
    expect(enforceGuardrails(evaluationWith(['HOLD']), null)).toBeNull();
  });

  it('PROGRESS and PR pass through even though evaluate() never adds them to allowed', () => {
    expect(enforceGuardrails(evaluationWith(['HOLD', 'BACK_OFF']), 'PROGRESS')).toBe('PROGRESS');
    expect(enforceGuardrails(evaluationWith(['HOLD', 'BACK_OFF']), 'PR')).toBe('PR');
  });

  it('R10/AC-34: PROGRESS and PR are suppressed when pain is reported on that exercise', () => {
    expect(enforceGuardrails(evaluationWith(['HOLD', 'BACK_OFF'], 'block'), 'PROGRESS')).toBeNull();
    expect(enforceGuardrails(evaluationWith(['HOLD', 'BACK_OFF'], 'block'), 'PR')).toBeNull();
  });

  it('a soft pain effect (secondary muscle overlap) does not suppress PROGRESS/PR', () => {
    expect(enforceGuardrails(evaluationWith(['HOLD', 'BACK_OFF'], 'soft'), 'PROGRESS')).toBe('PROGRESS');
  });
});

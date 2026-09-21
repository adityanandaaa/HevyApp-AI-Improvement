/** @typedef {import('../domain/types.js').ReasoningInput} ReasoningInput */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */
/** @typedef {import('../domain/types.js').Evaluation} Evaluation */

/**
 * @typedef {object} ReasoningProvider
 * @property {(input: ReasoningInput) => SignalLabel | null} choose must return a label from evaluation.allowed, or null
 * @property {(input: ReasoningInput, label: SignalLabel) => string} explain must respect the limits in domain/copy.js
 */

/**
 * Architecture rule 3 (HANDOFF section 5): whatever a provider returns must
 * come from evaluation.allowed. A label that isn't allowed is replaced by
 * HOLD if HOLD is allowed, otherwise by no signal (null). Applies to every
 * provider, scripted or live, so a live model (M8) can't violate the
 * guardrails computed by evaluate() either.
 * @param {Evaluation} evaluation
 * @param {SignalLabel | null} label
 * @returns {SignalLabel | null}
 */
export function enforceGuardrails(evaluation, label) {
  if (label !== null && evaluation.allowed.includes(label)) return label;
  if (evaluation.allowed.includes('HOLD')) return 'HOLD';
  return null;
}

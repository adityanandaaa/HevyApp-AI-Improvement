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
 *
 * `null` is deliberately left untouched: it means the provider chose to show
 * nothing (AC-12, "otherwise nothing appears"), which is a different case
 * from choosing a label that turned out not to be allowed. Coercing null to
 * HOLD would make a signal appear on every set checked, since HOLD is
 * allowed for almost every evaluation.
 *
 * PROGRESS and PR are exempt from the evaluation.allowed check specifically
 * (not from every guardrail): `allowed` gates *forward-looking*
 * recommendations (is it safe to suggest pushing further), but PROGRESS/PR
 * only report what already happened in a set the user already chose to do —
 * there's nothing to unlock or make unsafe by reporting it. R10 still blocks
 * PUSH and PR when pain is reported, and AC-34's spirit (never encourage
 * pushing through pain) extends that same caution to PROGRESS. R4 still
 * applies too: "no signal is shown" for an exercise with fewer than 3
 * sessions is unconditional, not just a PUSH/HOLD/BACK_OFF rule — HOLD and
 * BACK_OFF get this for free from `allowed` being empty while
 * historyBuilding, but PROGRESS/PR bypass that array, so it's checked here
 * explicitly.
 * @param {Evaluation} evaluation
 * @param {SignalLabel | null} label
 * @returns {SignalLabel | null}
 */
export function enforceGuardrails(evaluation, label) {
  if (label === null) return null;
  if (label === 'PROGRESS' || label === 'PR') {
    if (evaluation.historyBuilding) return null;
    return evaluation.painEffect === 'block' ? null : label;
  }
  if (evaluation.allowed.includes(label)) return label;
  if (evaluation.allowed.includes('HOLD')) return 'HOLD';
  return null;
}

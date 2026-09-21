/** @typedef {import('./types.js').SignalLabel} SignalLabel */

// Fixed strings, character limits and copy templates (HANDOFF section 9).
// Exact strings only — no wording invented here beyond the "my proposal"
// items HANDOFF itself calls out (chipsHeadingOtherChange).

/**
 * Section 6: "BACK_OFF displays as 'BACK OFF'".
 * @param {SignalLabel} label
 * @returns {string}
 */
export function displayLabel(label) {
  return label === 'BACK_OFF' ? 'BACK OFF' : label;
}

/** @typedef {'en-GB' | 'id-ID'} Locale */

/** The dev toolbar's default (section 10: "the toolbar toggles en-GB and id-ID"). */
export const DEFAULT_LOCALE = /** @type {Locale} */ ('en-GB');

/**
 * AC-68/T13: numbers follow the device locale — 62.5 shows as "62,5" under
 * id-ID.
 * @param {number} value
 * @param {Locale} [locale]
 * @returns {string}
 */
export function formatNumber(value, locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(locale).format(value);
}

export const LIMITS = {
  homeHook: 45,
  homeTeaser: 90,
  workoutExpect: 200,
  workoutTackle: 200,
  directionReason: 220,
  signalReason: 110,
  recapStatus: 60,
  recapNext: 150,
  recapOverall: 100,
  recapHeadlineWords: 3,
};

/** In order, per HANDOFF section 9. */
export const CHIP_LABELS = [
  'Too tired',
  'Poor sleep',
  "Didn't feel ready",
  'Pain/discomfort',
  'Changed my mind',
  'Other',
];

export const COPY = {
  startRoutine: 'Start Routine',
  cardHeading: "TODAY'S FOCUS",
  painReported: 'Pain reported. Hold or reduce the load here. Stopping is a valid choice.',
  painCleared: 'Pain cleared',
  chipsHeadingPushSkipped: 'Why did you skip the push?',
  /** HANDOFF section 9: "my proposal". */
  chipsHeadingOtherChange: 'Why did you change the weight?',

  /**
   * R10, primary overlap direction-line wording.
   * @param {string} exerciseName
   * @returns {string}
   */
  painPrimaryOverlap(exerciseName) {
    return `You reported pain on ${exerciseName} earlier. Keep this one conservative and stop if it returns.`;
  },

  /**
   * R10, secondary overlap direction-line wording.
   * @param {string} muscle
   * @returns {string}
   */
  painSecondaryOverlap(muscle) {
    return `This also loads ${muscle}, so keep an eye on it.`;
  },

  /**
   * R4, history-building direction line.
   * @param {number} sessionCount
   * @returns {string}
   */
  historyBuilding(sessionCount) {
    return `History building: ${sessionCount} of 3 sessions`;
  },

  /**
   * R11, chip selection confirmation.
   * @param {string} reason
   * @returns {string}
   */
  chipSaved(reason) {
    return `Reason saved: ${reason}`;
  },
};

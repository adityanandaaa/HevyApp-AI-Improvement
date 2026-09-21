/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */

/**
 * Sprite symbol ids for each signal (HANDOFF section 3): up arrow, pause
 * bars, down arrow, star, circular arrows, check mark.
 * @type {Record<SignalLabel, string>}
 */
export const SIGNAL_ICON_IDS = {
  PUSH: 'icon-arrow-up',
  HOLD: 'icon-pause',
  BACK_OFF: 'icon-arrow-down',
  PR: 'icon-star',
  ADAPT: 'icon-refresh',
  PROGRESS: 'icon-check',
};

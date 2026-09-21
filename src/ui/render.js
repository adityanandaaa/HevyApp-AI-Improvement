/** @typedef {import('../domain/types.js').Exercise} Exercise */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */
/** @typedef {import('../domain/rules/evaluate.js').EvaluateInput} EvaluateInput */

import { PUSH_DAY_EXERCISES } from '../data/exercises.js';
import { PUSH_DAY_SESSIONS } from '../data/sessions.js';
import { evaluate } from '../domain/rules/evaluate.js';
import { computeTarget } from '../domain/rules/target.js';
import { computeTodaysFocus } from '../domain/rules/todays-focus.js';
import { COPY, displayLabel } from '../domain/copy.js';
import { choose, composeTodaysFocusCopy, explain } from '../reasoning/scripted.js';
import { SIGNAL_ICON_IDS } from './signal-icons.js';

// The UI never decides a signal (HANDOFF section 5, rule 2): it calls
// evaluate() for the allowed signals and the reasoning provider for the
// choice and wording, then only renders the result.

// No pain or in-progress sets exist yet (Pain is M5, real set logging is
// M4+), so today's state is fixed and empty for now.
/** @type {EvaluateInput} */
const evaluateInput = {
  routineExercises: PUSH_DAY_EXERCISES,
  sessions: PUSH_DAY_SESSIONS,
  todaysLogs: [],
  painReports: [],
};

/**
 * @param {SignalLabel} label
 * @returns {string}
 */
function signalIconMarkup(label) {
  return `<svg class="icon signal-icon" aria-hidden="true"><use href="#${SIGNAL_ICON_IDS[label]}" /></svg>`;
}

/**
 * @param {'home' | 'workout'} variant
 * @returns {string}
 */
function todaysFocusMarkup(variant) {
  const data = computeTodaysFocus(evaluateInput);
  const copy = composeTodaysFocusCopy(data);

  const body =
    variant === 'home'
      ? `
        <p class="todays-focus__signal">
          ${signalIconMarkup(copy.signalLabel)}
          <strong>${displayLabel(copy.signalLabel)}</strong>
          <span>${copy.homeHeadline}</span>
        </p>
        <p class="todays-focus__teaser">${copy.homeTeaser}</p>
      `
      : `
        <p class="todays-focus__section-label">What to expect</p>
        <p class="todays-focus__block">${copy.workoutExpect}</p>
        <p class="todays-focus__section-label">How to tackle it</p>
        <p class="todays-focus__block">${copy.workoutTackle}</p>
      `;

  return `
    <p class="todays-focus__heading">${COPY.cardHeading}</p>
    <p class="todays-focus__session">Push Day</p>
    ${body}
    <button class="btn-primary btn-block" type="button" data-start-routine>${COPY.startRoutine}</button>
  `;
}

/**
 * @param {HTMLElement} container
 * @param {'home' | 'workout'} variant
 */
function renderTodaysFocusCard(container, variant) {
  container.innerHTML = todaysFocusMarkup(variant);
}

/**
 * AC-8/AC-9/AC-11: target in bold, then the reason; or, for an exercise
 * still building history, just the history-building line (no target).
 * @param {Exercise} exercise
 * @returns {string}
 */
function directionLineMarkup(exercise) {
  const evaluation = evaluate(evaluateInput, exercise.id);

  if (evaluation.historyBuilding) {
    return `<p class="direction-line direction-line--building">${COPY.historyBuilding(evaluation.historyCount)}</p>`;
  }

  const target = computeTarget(exercise, evaluateInput.sessions, evaluation);
  const label = choose({ trigger: 'direction', exercise, evaluation, target }) ?? 'HOLD';
  const reason = explain({ trigger: 'direction', exercise, evaluation, target }, label);
  const targetText = target ? `${target.weightKg}kg × ${target.repsMin}-${target.repsMax}` : '';

  return `
    <div class="direction-line">
      <p class="direction-line__row">
        <span class="direction-line__label">Target</span>
        <span class="direction-line__target">${targetText}</span>
      </p>
      <p class="direction-line__reason">${reason}</p>
    </div>
  `;
}

function renderDirectionLines() {
  for (const block of document.querySelectorAll('.exercise-block')) {
    if (!(block instanceof HTMLElement)) continue;
    const exerciseId = block.dataset.exercise;
    const exercise = PUSH_DAY_EXERCISES.find((e) => e.id === exerciseId);
    const restLine = block.querySelector('.exercise-block__rest');
    if (!exercise || !restLine) continue;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = directionLineMarkup(exercise).trim();
    const directionEl = wrapper.firstElementChild;
    if (directionEl) restLine.insertAdjacentElement('afterend', directionEl);
  }
}

export function renderApp() {
  const homeContainer = document.getElementById('todays-focus-home');
  const workoutContainer = document.getElementById('todays-focus-workout');
  if (homeContainer) renderTodaysFocusCard(homeContainer, 'home');
  if (workoutContainer) renderTodaysFocusCard(workoutContainer, 'workout');
  renderDirectionLines();
}

/** @typedef {import('../domain/types.js').Exercise} Exercise */
/** @typedef {import('../domain/types.js').SetEntry} SetEntry */
/** @typedef {import('../domain/types.js').SignalLabel} SignalLabel */

import { PUSH_DAY_EXERCISES } from '../data/exercises.js';
import { CHIP_LABELS, COPY, displayLabel } from '../domain/copy.js';
import { shouldShowChips, chipsHeadingKind } from '../domain/rules/chips.js';
import { evaluate } from '../domain/rules/evaluate.js';
import { lastNLogs } from '../domain/rules/history.js';
import { reactiveSignal } from '../domain/rules/signal-trigger.js';
import { computeTarget } from '../domain/rules/target.js';
import { workingWeight } from '../domain/rules/working-weight.js';
import { enforceGuardrails } from '../reasoning/provider.js';
import { composePainWhySheet, composeWhySheet, explain } from '../reasoning/scripted.js';
import { renderDirectionLines } from './render.js';
import { SIGNAL_ICON_IDS } from './signal-icons.js';
import { TIMING } from './timing.js';
import {
  buildEvaluateInput,
  clearPain,
  endRestTimer,
  logSet,
  reportPain,
  selectChip,
  setChips,
  setSignal,
  setsLoggedBefore,
  setsLoggedToday,
  startRestTimer,
  state,
  tickRestTimer,
  unlogSet,
  adjustRestTimer as storeAdjustRestTimer,
} from '../state/store.js';

// AC-19: checking a set is one tap and registers within 100ms
// (TIMING.checkRegisterMs) whether or not a signal is produced — the
// checkbox toggle below is synchronous; only the signal/chips computation is
// deferred, and well under TIMING.signalMs (1000ms).
const SIGNAL_DELAY_MS = Math.min(400, TIMING.signalMs);

const dockedCardEl = /** @type {HTMLElement} */ (document.getElementById('docked-card'));
const restBarEl = /** @type {HTMLElement} */ (document.getElementById('rest-bar'));
const restBarTimeEl = /** @type {HTMLElement} */ (document.getElementById('rest-bar-time'));
const whySheetEl = /** @type {HTMLElement} */ (document.getElementById('why-sheet'));
const whySheetTitleEl = /** @type {HTMLElement} */ (document.getElementById('why-sheet-title'));
const whySheetBodyEl = /** @type {HTMLElement} */ (document.getElementById('why-sheet-body'));
const liveRegionEl = /** @type {HTMLElement} */ (document.getElementById('live-region'));

/** @type {number | null} */
let restIntervalId = null;
/** @type {number} */
let checkRequestId = 0;
/** @type {HTMLElement | null} */
let whySheetTriggerEl = null;

/** @param {string} text */
function announceLive(text) {
  liveRegionEl.textContent = text;
}

/** @param {number} totalSeconds */
function formatRestTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function updateRestBarDisplay() {
  if (!state.restTimer) return;
  restBarTimeEl.textContent = formatRestTime(state.restTimer.remainingSeconds);
}

function clearRestInterval() {
  if (restIntervalId !== null) {
    window.clearInterval(restIntervalId);
    restIntervalId = null;
  }
}

/**
 * AC-16: the signal card stays until the rest timer reaches 00:00, the next
 * set is checked, or Dismiss is tapped.
 */
function handleRestTimerReachedZero() {
  clearRestInterval();
  if (state.signal) hideDockedCard();
}

/** @param {Exercise} exercise */
function startRestBar(exercise) {
  clearRestInterval();
  startRestTimer(exercise.id, exercise.restSeconds);
  updateRestBarDisplay();
  restBarEl.hidden = false;

  restIntervalId = window.setInterval(() => {
    const reachedZero = tickRestTimer();
    updateRestBarDisplay();
    if (reachedZero) handleRestTimerReachedZero();
  }, 1000);
}

/** @param {SignalLabel} label */
function signalIconMarkup(label) {
  return `<svg class="icon signal-icon" aria-hidden="true"><use href="#${SIGNAL_ICON_IDS[label]}" /></svg>`;
}

function renderDockedCard() {
  const hasContent = state.signal || state.chips;
  if (!hasContent) {
    dockedCardEl.hidden = true;
    dockedCardEl.innerHTML = '';
    return;
  }

  const signalRow = state.signal
    ? `<p class="docked-card__signal">${signalIconMarkup(state.signal.label)}<strong>${displayLabel(state.signal.label)}</strong></p>`
    : '<span></span>';

  let html = `
    <div class="docked-card__header">
      ${signalRow}
      <button class="dismiss-btn" type="button" id="docked-card-dismiss" aria-label="Dismiss">
        <svg class="icon"><use href="#icon-x" /></svg>
      </button>
    </div>
  `;

  if (state.signal) {
    html += `
      <p class="docked-card__reason">${state.signal.reason}</p>
      <button class="link docked-card__why" type="button" id="docked-card-why">
        <svg class="icon icon--sm"><use href="#icon-info" /></svg> Why?
      </button>
    `;
  }

  if (state.chips) {
    if (state.chips.savedReason) {
      html += `<p class="chips__saved">${COPY.chipSaved(state.chips.savedReason)}</p>`;
    } else {
      const heading =
        state.chips.headingKind === 'push_skipped' ? COPY.chipsHeadingPushSkipped : COPY.chipsHeadingOtherChange;
      html += `
        <p class="chips__heading">${heading}</p>
        <div class="chips__list">
          ${CHIP_LABELS.map((label) => `<button class="chip" type="button" data-chip="${label}">${label}</button>`).join('')}
        </div>
      `;
    }
  }

  dockedCardEl.innerHTML = html;
  dockedCardEl.hidden = false;
  wireDockedCardButtons();
}

function wireDockedCardButtons() {
  document.getElementById('docked-card-dismiss')?.addEventListener('click', hideDockedCard);
  document.getElementById('docked-card-why')?.addEventListener('click', openWhySheet);
  for (const chipButton of dockedCardEl.querySelectorAll('.chip')) {
    chipButton.addEventListener('click', () => {
      const reason = chipButton.getAttribute('data-chip');
      if (!reason) return;
      selectChip(reason);
      renderDockedCard();
    });
  }
}

/** AC-17: dismissing a card is not recorded as an override. */
function hideDockedCard() {
  setSignal(null);
  setChips(null);
  renderDockedCard();
}

/**
 * @param {Exercise} exercise
 * @param {SetEntry} checkedSet
 * @param {number} setNumber
 * @returns {{ label: SignalLabel; reason: string } | null}
 */
function computeSignal(exercise, checkedSet, setNumber) {
  const priorSets = setsLoggedBefore(exercise.id, setNumber);
  const candidate = reactiveSignal(checkedSet, priorSets);
  const evaluateInput = buildEvaluateInput();
  const evaluation = evaluate(evaluateInput, exercise.id);
  const label = enforceGuardrails(evaluation, candidate);
  if (!label) return null;

  const target = computeTarget(exercise, evaluateInput.sessions, evaluation);
  const reason = explain({ trigger: 'set_checked', exercise, evaluation, lastSet: checkedSet, target, setNumber }, label);
  return { label, reason };
}

/**
 * @param {Exercise} exercise
 * @param {SetEntry} checkedSet
 * @param {number} setNumber
 * @returns {{ headingKind: 'push_skipped' | 'other_change' } | null}
 */
function computeChips(exercise, checkedSet, setNumber) {
  const evaluateInput = buildEvaluateInput();
  const evaluation = evaluate(evaluateInput, exercise.id);
  const target = computeTarget(exercise, evaluateInput.sessions, evaluation);
  if (!target) return null;

  const [mostRecentLog] = lastNLogs(evaluateInput.sessions, exercise.id, 1);
  const lastSessionWorkingWeightKg = mostRecentLog ? workingWeight(mostRecentLog) : null;
  const previousWeightKg = mostRecentLog?.sets[setNumber - 1]?.weightKg ?? checkedSet.weightKg;

  const show = shouldShowChips({ checkedSet, previousWeightKg, lastSessionWorkingWeightKg, evaluation, target });
  if (!show) return null;

  return { headingKind: chipsHeadingKind(evaluation, checkedSet, target) };
}

/**
 * @param {HTMLElement} row
 * @returns {SetEntry}
 */
function readSetFromRow(row) {
  const weightInput = /** @type {HTMLInputElement} */ (row.querySelector('.set-input--weight'));
  const repsInput = /** @type {HTMLInputElement} */ (row.querySelector('.set-input--reps'));
  const rpeInput = /** @type {HTMLInputElement} */ (row.querySelector('.set-input--rpe'));
  return {
    type: 'normal',
    weightKg: Number(weightInput.value),
    reps: Number(repsInput.value),
    rpe: Number(rpeInput.value),
  };
}

/** @param {HTMLButtonElement} checkButton */
function handleCheckToggle(checkButton) {
  const row = checkButton.closest('.set-row');
  const exerciseBlock = checkButton.closest('.exercise-block');
  if (!(row instanceof HTMLElement) || !(exerciseBlock instanceof HTMLElement)) return;

  const exerciseId = exerciseBlock.dataset.exercise;
  const setNumber = Number(row.dataset.set);
  const exercise = PUSH_DAY_EXERCISES.find((e) => e.id === exerciseId);
  if (!exercise || !setNumber) return;

  // AC-19/checkRegisterMs: the tap itself registers immediately.
  const nowChecked = checkButton.getAttribute('aria-pressed') !== 'true';
  checkButton.setAttribute('aria-pressed', String(nowChecked));
  row.classList.toggle('set-row--done', nowChecked);

  if (!nowChecked) {
    unlogSet(exercise.id, setNumber);
    if (state.signal?.exerciseId === exercise.id && state.signal.setNumber === setNumber) {
      hideDockedCard();
    }
    return;
  }

  const checkedSet = readSetFromRow(row);
  logSet(exercise.id, setNumber, checkedSet);

  // AC-16: checking the next set dismisses whatever card was showing.
  hideDockedCard();
  startRestBar(exercise);

  const requestId = ++checkRequestId;
  window.setTimeout(() => {
    if (requestId !== checkRequestId) return; // superseded by a later check
    if (checkButton.getAttribute('aria-pressed') !== 'true') return; // unchecked before this ran

    try {
      const signal = computeSignal(exercise, checkedSet, setNumber);
      const chips = computeChips(exercise, checkedSet, setNumber);

      setSignal(signal ? { exerciseId: exercise.id, setNumber, ...signal } : null);
      setChips(chips ? { exerciseId: exercise.id, setNumber, savedReason: null, ...chips } : null);
      renderDockedCard();

      if (signal) announceLive(`${displayLabel(signal.label)}. ${signal.reason}`);
    } catch {
      // AC-19: if a signal is late or fails, nothing is shown and no error appears.
    }
  }, SIGNAL_DELAY_MS);
}

/**
 * R10/AC-28/AC-32: report or undo pain on an exercise. Reuses the signal
 * card (label HOLD, per mockup 6) rather than inventing a separate card type.
 * @param {HTMLButtonElement} button
 */
function handlePainToggle(button) {
  const exerciseBlock = button.closest('.exercise-block');
  if (!(exerciseBlock instanceof HTMLElement)) return;
  const exercise = PUSH_DAY_EXERCISES.find((e) => e.id === exerciseBlock.dataset.exercise);
  if (!exercise) return;

  const nowActive = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(nowActive));
  const label = button.querySelector('.add-set-row__pain-label');
  const iconUse = button.querySelector('use');
  if (label) label.textContent = nowActive ? 'Pain reported' : 'Pain';
  if (iconUse) iconUse.setAttribute('href', nowActive ? '#icon-check' : '#icon-alert');

  if (nowActive) {
    reportPain(exercise.id, setsLoggedToday(exercise.id).length);
    setSignal({ exerciseId: exercise.id, setNumber: 0, label: 'HOLD', reason: COPY.painReported, isPain: true });
    setChips(null);
    renderDockedCard();
    announceLive('Pain reported');
  } else {
    clearPain(exercise.id);
    if (state.signal?.isPain && state.signal.exerciseId === exercise.id) {
      hideDockedCard();
    }
    announceLive('Pain cleared');
  }

  // R10: propagates to this and every later exercise's direction line.
  renderDirectionLines();
}

function openWhySheet() {
  if (!state.signal) return;
  const exercise = PUSH_DAY_EXERCISES.find((e) => e.id === state.signal?.exerciseId);
  if (!exercise) return;

  whySheetTriggerEl = /** @type {HTMLElement} */ (document.activeElement);

  let copy;
  if (state.signal.isPain) {
    copy = composePainWhySheet(exercise);
  } else {
    const evaluateInput = buildEvaluateInput();
    const evaluation = evaluate(evaluateInput, exercise.id);
    const target = computeTarget(exercise, evaluateInput.sessions, evaluation);
    const setsToday = setsLoggedToday(exercise.id);
    copy = composeWhySheet({ trigger: 'set_checked', exercise, evaluation, target }, state.signal.label, setsToday);
  }

  whySheetTitleEl.textContent = copy.title;
  whySheetBodyEl.innerHTML = `
    <div class="why-sheet__block"><p class="why-sheet__label">What I did</p><p>${copy.whatIDid}</p></div>
    <div class="why-sheet__block"><p class="why-sheet__label">Calculated</p><p>${copy.calculated}</p></div>
    <div class="why-sheet__block"><p class="why-sheet__label">AI interpretation</p><p>${copy.aiInterpretation}</p></div>
    <div class="why-sheet__block"><p class="why-sheet__label">Recommendation</p><p>${copy.recommendation}</p></div>
  `;

  whySheetEl.hidden = false;
  document.addEventListener('keydown', handleSheetKeydown);
  document.getElementById('why-sheet-close')?.focus();
}

function closeWhySheet() {
  whySheetEl.hidden = true;
  document.removeEventListener('keydown', handleSheetKeydown);
  whySheetTriggerEl?.focus();
  whySheetTriggerEl = null;
}

/** @param {KeyboardEvent} event */
function handleSheetKeydown(event) {
  if (event.key === 'Escape') {
    closeWhySheet();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = /** @type {NodeListOf<HTMLElement>} */ (
    whySheetEl.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function initLogWorkoutInteractions() {
  for (const checkButton of document.querySelectorAll('.check-btn')) {
    if (checkButton instanceof HTMLButtonElement) {
      checkButton.addEventListener('click', () => handleCheckToggle(checkButton));
    }
  }

  for (const painButton of document.querySelectorAll('[data-pain-toggle]')) {
    if (painButton instanceof HTMLButtonElement) {
      painButton.addEventListener('click', () => handlePainToggle(painButton));
    }
  }

  document.getElementById('rest-bar-minus')?.addEventListener('click', () => {
    storeAdjustRestTimer(-15);
    updateRestBarDisplay();
  });
  document.getElementById('rest-bar-plus')?.addEventListener('click', () => {
    storeAdjustRestTimer(15);
    updateRestBarDisplay();
  });
  document.getElementById('rest-bar-skip')?.addEventListener('click', () => {
    endRestTimer();
    clearRestInterval();
    updateRestBarDisplay();
    handleRestTimerReachedZero();
  });

  document.getElementById('why-sheet-close')?.addEventListener('click', closeWhySheet);
  whySheetEl.addEventListener('click', (event) => {
    if (event.target === whySheetEl) closeWhySheet();
  });
}

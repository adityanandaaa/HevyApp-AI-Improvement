import { PUSH_DAY_EXERCISES } from '../data/exercises.js';
import { evaluate } from '../domain/rules/evaluate.js';
import { computeRecap } from '../domain/rules/recap.js';
import { computeTarget } from '../domain/rules/target.js';
import { composeRecap } from '../reasoning/scripted.js';
import { finishSession } from '../state/store.js';
import { renderApp } from './render.js';
import { showScreen } from './navigation.js';

const LEAD_EXERCISE_ID = 'incline-bench-press';

const recapBodyEl = /** @type {HTMLElement} */ (document.getElementById('recap-body'));

/**
 * @param {import('../reasoning/scripted.js').RecapCopy} copy
 */
function renderRecap(copy) {
  const rowsHtml = copy.rows
    .map(
      (row) => `
        <div class="recap-row">
          <p class="recap-row__name">${row.exerciseName}</p>
          <p class="recap-row__sets">${row.setsSummary}</p>
          <p class="recap-row__status">${row.status}</p>
        </div>
      `,
    )
    .join('');

  recapBodyEl.innerHTML = `
    <p class="recap-headline">${copy.headline}</p>
    <div class="recap-rows">${rowsHtml}</div>
    <div class="recap-summary">
      <p class="recap-summary__label">Next session</p>
      <p class="recap-summary__text">${copy.nextSession}</p>
      <p class="recap-summary__label">Overall</p>
      <p class="recap-summary__text">${copy.overall}</p>
    </div>
    <button class="btn-primary btn-block recap-done" type="button" id="recap-done">Done</button>
  `;

  document.getElementById('recap-done')?.addEventListener('click', () => showScreen('home'));
}

/** AC-43: ends the session and shows the recap, built from today's logs (R13). */
function handleFinish() {
  const { sessionsBeforeToday, todaysSetsByExercise, sessionsAfterToday } = finishSession();

  const recapData = computeRecap(PUSH_DAY_EXERCISES, sessionsBeforeToday, todaysSetsByExercise);

  const leadExercise = PUSH_DAY_EXERCISES.find((e) => e.id === LEAD_EXERCISE_ID);
  const nextInput = {
    routineExercises: PUSH_DAY_EXERCISES,
    sessions: sessionsAfterToday,
    todaysLogs: [],
    painReports: [],
  };
  const nextLeadEvaluation = evaluate(nextInput, LEAD_EXERCISE_ID);
  const nextLeadTarget = leadExercise ? computeTarget(leadExercise, sessionsAfterToday, nextLeadEvaluation) : null;

  const copy = composeRecap(recapData, nextLeadEvaluation, nextLeadTarget);
  renderRecap(copy);

  // AC-46: Today's Focus (and the direction lines, harmlessly) already
  // reflect this session by the time the user next sees them.
  renderApp();

  showScreen('recap');
}

export function initRecapInteractions() {
  document.getElementById('finish-workout')?.addEventListener('click', handleFinish);
}

# AI Training Coach (prototype)

Independent design-for-one concept. Not affiliated with Hevy. Owner: Aditya Nanda Tri Prakoso.

A clickable, phone-sized prototype of a coaching feature inside the Hevy workout
tracker, built for one person (Aditya) using mock data only. See `HANDOFF.md` for
the full brief, `docs/AI_Training_Coach_PRD.docx` for the build spec, and
`docs/AI_Training_Coach_Product_Discovery_v2.md` for the reasoning behind it.

## Run it

No build step. The app is plain HTML, CSS and JavaScript, served as-is by a small
static dev server so it can also be opened from a phone on the same local network.

```
npm install
npm run dev
```

Then open the printed `http://localhost:5173` URL (or `http://<your-computer's-LAN-IP>:5173`
from a phone on the same network).

## Checks

```
npm run lint        # ESLint
npm run typecheck    # tsc, checking JSDoc types in the .js source
npm test             # Vitest
```

## Project structure

```
index.html            phone frame, dev toolbar shell, and all three screens
src/
  main.js              screen navigation, cosmetic toggles, calls ui/render.js
                         and ui/log-workout.js
  ui/
    render.js            bridges evaluate()/reasoning into the DOM (no rules here)
    log-workout.js         signal card, chips, Why? sheet, rest timer (M4)
    signal-icons.js          SignalLabel -> sprite symbol id
    timing.js                  TIMING constants (section 9)
    tokens.css                  design tokens (section 10 of HANDOFF.md)
    layout.css                    phone frame and dev toolbar layout
    components.css                  shared button/card/icon/tab-bar/
                                      Today's-Focus/direction-line/docked-card/
                                      chips/sheet styles
    screens/
      home.css                         Home tab
      workout.css                        Workout tab
      log-workout.css                      Log Workout screen + signal card
    devtoolbar/            (not yet built — see Interpretations)
  domain/                pure JS, no DOM, unit tested
    types.js               JSDoc typedefs (section 6 of HANDOFF.md)
    copy.js                 fixed strings, limits, templates (section 9)
    rules/
      working-sets.js         R1
      working-weight.js        R2, R3
      history.js                 R4, R5 session selection
      push-gate.js                 R5, R6
      cross-exercise.js             R7
      pain.js                        R10
      evaluate.js                     the evaluate() entry point (R1-R10)
      target.js                        next push-weight suggestion
      todays-focus.js                   R14 (push/hold/building lists)
      signal-trigger.js                   R12 (reactive HOLD/BACK_OFF triggers)
      chips.js                             R11 (reason-chip eligibility)
  reasoning/
    provider.js            ReasoningProvider interface + enforceGuardrails()
    scripted.js              prototype implementation: choose(), explain(),
                               composeTodaysFocusCopy(), composeWhySheet()
  data/
    exercises.js            MOCK Push Day routine (section 8)
    sessions.js              MOCK S-3/S-2/S-1 sessions (section 8)
    scenarios.js               MOCK dev-toolbar scenarios (not yet built)
  state/
    store.js                 mutable session-scoped state: today's logged
                               sets, the active signal/chips, the rest timer
scripts/
  dev-server.js          zero-dependency static file server for local dev
tests/
  helpers/                 shared test setup (mount-app.js)
  unit/                    domain and reasoning tests
  component/                DOM-level checks
  e2e/                       Playwright + axe (added in M7)
```

## Interpretations

Flagging deviations from `HANDOFF.md` section 4's stack proposal, per working
agreement 9. Section 4 called itself "a proposal, change if you prefer."

- **No React, no bundler.** Decided with Aditya during M0: the prototype is
  plain HTML/CSS/vanilla JS (ES modules), not a React app, and has no build step.
  There is no Vite/webpack/esbuild bundling the app for either dev or prod; files
  are served as written.
- **`npm run dev` is a small zero-dependency Node static server**
  (`scripts/dev-server.js`), not the Vite dev server, since Vite is no longer part
  of the stack. It still supports opening the prototype from a phone on the local
  network (HANDOFF section 1, step 2).
- **`npm run typecheck` runs `tsc --checkJs`** against plain `.js` files with
  JSDoc type annotations, rather than compiling TypeScript. This keeps the
  "typecheck" gate in HANDOFF's milestone table (section 11) meaningful without
  reintroducing a build step: `tsc` here only checks types, it never emits files
  the app depends on.
- **Vitest** (unit/component tests) and, from M7, **Playwright** stay as
  proposed in section 4 — both are framework-agnostic and work the same way
  against plain HTML/CSS/JS as they would against a React app.
- **ESLint and Prettier** stay as proposed, configured for plain JS instead of
  TypeScript/JSX.

M1 additions:

- **Icons are approximated outline SVGs**, not Hevy's real icon set (HANDOFF
  section 10 notes Hevy publishes no design system or icon assets to copy).
  They live in a single `<symbol>` sprite in `index.html` and are referenced
  with `<use>`.
- **Log Workout's rest-timer bar is a visual demo, not a real countdown.**
  Checking a set shows the bar (styled like
  `docs/reference/hevy-log-resting.png`) with that exercise's configured rest
  duration as a static number; `-15`/`+15`/`Skip` are present but inert. A
  real running timer is Hevy's own behaviour to replicate and isn't required
  by any HANDOFF acceptance criterion for this feature, so it's deferred
  until an actual milestone needs it (rest-relative signal timing, in M4).
- **`Finish` is inert.** Recap (what Finish leads to) is M6; until then it's
  visually present but does nothing, same treatment as the inert Leg Day/Pull
  Day routine cards.
- **The Log Workout header's chevron acts as "back to Workout tab."** In real
  Hevy it minimises the logger to a floating bar; that floating-bar behaviour
  isn't part of this feature, so the chevron is repurposed as the prototype's
  only way back out of Log Workout.
- **Profile tab is visually present but inert** (out of scope, like Leg Day/
  Pull Day).

M2 additions (also flagged inline as `// INTERPRETATION: see HANDOFF section 7`):

- **Working weight and "successful session"** (R2, R3) are my technical
  reading of the PRD, as HANDOFF itself flags: working weight is the highest
  weight among a session's working sets, and a session is successful when
  every set at that weight reaches at least the bottom of the target rep
  range.
- **"Last three sessions"** (R5) means the three most recent completed
  sessions that include the exercise, regardless of gaps from other exercises
  in between.
- **The next push weight is current working weight + 2kg.** HANDOFF gives no
  exact increment formula, only the worked example in section 9 (stable at
  40kg → "try 42kg today?"); 2kg is read from that example
  (`src/domain/rules/target.js`).
- **History-building blocks PUSH with reason `'history'`** in `evaluate()`'s
  `blocked` array, even though `allowed` is simply empty either way (AC-11:
  "no signal is shown"). This uses the `'history'` `BlockReason` the type
  already defines, rather than leaving it never exercised.
- **Pain effect is always computed, independent of history-building.** For
  an exercise still building history (e.g. Dips), `evaluate()` returns
  `historyBuilding: true` and a fully-computed `painEffect` (e.g. `'block'`)
  at the same time; HANDOFF's own golden test T7 requires this ("Dips
  computes as block but its display stays history-building") and leaves the
  display precedence to the UI, not the rules engine.

M3 additions:

- **`ReasoningInput` gained an optional `target` field**, beyond HANDOFF
  section 6's sketch. The scripted reason text states concrete weight
  numbers ("stable at 40kg... consider 42kg"), so the scripted provider
  needs the computed target alongside the evaluation to write that sentence.
  A live model (M8) may not need the same field — M8 point 3 says to send
  only the evaluation, exercise name, last set and trigger.
- **Direction-line reason text uses each exercise's full name**, not
  HANDOFF's colloquial shorthand for Incline ("Your incline has been
  stable..."). A generic short-name deriver isn't specified, and hardcoding
  per-exercise nicknames didn't seem worth the fragility for a 6-exercise
  prototype (`src/reasoning/scripted.js`).
- **Hold-state reason wording (for Shoulder Press, Seated Lateral Raise and
  Single Arm Triceps Pushdown) is my own composition**, since HANDOFF gives
  a full scripted example only for Incline. It follows the same "current
  weight, why, what to watch for" shape as the given example and stays
  within the 220-character direction-reason limit (checked by an automated
  test across every Push Day exercise).
- **The Today's Focus signal badge and Start Routine's own click handler
  are wired generically** (`[data-start-routine]`, one per card variant)
  rather than duplicating the Workout tab's Push Day button logic.

M4 additions:

- **RPE is a plain text input pre-filled from history, not a gauge/wheel
  picker.** The screenshots only show a gauge icon before a value is
  entered; mockup 4 shows plain numerals once sets are checked, and section 9
  gives no spec for a custom control beyond that icon. A text input matching
  the KG/REPS styling is simplest to build reliably and lets a reviewer
  change RPE by hand to trigger HOLD/BACK OFF while testing.
- **No dev-toolbar scenario picker yet, and PR/ADAPT/PROGRESS are
  unreachable.** Re-reading HANDOFF section 8's five scenarios closely: all
  but "Pain" (scenario 3, needs the Pain button, M5) are reachable by hand
  through the exact rules and mock data already built — none of them
  actually requires scripted PR/ADAPT/PROGRESS overrides. Per R12, those
  three labels are "scripted in scenarios" with no scenario system built,
  so they're not reachable in this prototype yet. Building the scenario
  picker (a QA convenience that pre-checks sets to jump to an interesting
  moment, not new rules) is deferred — it doesn't block any M4 acceptance
  criterion, and section 10 groups it with the rest of the dev toolbar
  (text size, reduced motion, locale), most of which is M7's job anyway.
- **The BACK_OFF `set_checked` reason and the whole Why? sheet's BACK_OFF
  wording are my own composition.** HANDOFF's only scripted `set_checked`
  example (section 8, scenario 2) covers the RPE/HOLD case, reused verbatim;
  the rep-drop/BACK_OFF case follows the same shape.
- **The signal card always shows a Dismiss button whenever it's visible**
  (signal, chips, or both), since AC-16 lists Dismiss as one of the three
  ways the card goes away regardless of what's inside it.
- **The docked card grows from normal document flow, not a floating
  overlay + manual bottom padding.** AC-13 asks for bottom padding "so no
  set row stays hidden" — that's written for a card that floats over the
  content. This card is a flex-column sibling of the scrollable exercise
  list, so appearing shrinks the scrollable area instead of covering it;
  no row can end up hidden behind it, which satisfies the same intent
  without the padding-matching machinery the AC's literal mechanism implies.

## Milestones

Tracking `HANDOFF.md` section 11. Each milestone is reviewed before starting the
next.

- [x] M0 — Scaffold
- [x] M1 — Hevy shell
- [x] M2 — Rules engine
- [x] M3 — Today's Focus and direction line
- [x] M4 — Signals
- [ ] M5 — Pain
- [ ] M6 — Recap
- [ ] M7 — Accessibility and QA
- [ ] M8 — Live model (optional)

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
npm test             # Vitest (unit + component)
npm run test:e2e     # Playwright: axe accessibility scans, tap sizes, focus,
                      # reduced motion, locale (needs `npx playwright install
                      # chromium` once; the dev server starts automatically)
```

## Project structure

```
index.html            phone frame, dev toolbar shell, and all three screens
src/
  main.js              screen navigation, cosmetic toggles, calls ui/render.js
                         and ui/log-workout.js
  ui/
    navigation.js         showScreen(), shared by main.js and ui/recap.js
    render.js               bridges evaluate()/reasoning into the DOM (no rules here)
    log-workout.js            signal card, chips, Why? sheet, rest timer (M4),
                                the Pain toggle (M5)
    recap.js                    Finish -> recap screen -> Done (M6)
    devtoolbar.js                 text size / locale / reduced motion / tap
                                    targets / reset toggles (M7)
    signal-icons.js                  SignalLabel -> sprite symbol id
    timing.js                          TIMING constants (section 9)
    tokens.css                           design tokens (section 10 of HANDOFF.md)
    layout.css                             phone frame and dev toolbar layout
    components.css                           shared button/card/icon/tab-bar/
                                               Today's-Focus/direction-line/
                                               docked-card/chips/sheet styles
    screens/
      home.css                                  Home tab
      workout.css                                 Workout tab
      log-workout.css                               Log Workout screen + signal card
      recap.css                                       Session recap
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
      recap.js                              R13 (per-exercise recap data)
  reasoning/
    provider.js            ReasoningProvider interface + enforceGuardrails()
    scripted.js              prototype implementation: choose(), explain(),
                               composeTodaysFocusCopy(), composeWhySheet(),
                               composePainWhySheet(), composeRecap()
  data/
    exercises.js            MOCK Push Day routine (section 8)
    sessions.js              MOCK S-3/S-2/S-1 sessions (section 8)
    scenarios.js               MOCK dev-toolbar scenarios (not yet built)
  state/
    store.js                 mutable session-scoped state: completed sessions
                               (grows on Finish, AC-46), today's logged sets,
                               pain reports, the active signal/chips, the
                               rest timer
scripts/
  dev-server.js          zero-dependency static file server for local dev
tests/
  helpers/                 shared test setup (mount-app.js)
  unit/                    domain and reasoning tests
  component/                DOM-level checks
  e2e/                       Playwright: axe scans (accessibility.test.js),
                              tap sizes/reduced-motion/locale/focus trap
                              (behaviors.test.js)
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

M5 additions:

- **The Pain-reported card reuses the HOLD signal (icon + label), not a
  separate card type.** Mockup 6 shows this directly — the card under the
  Pain button reads "⏸ HOLD" — so `state.signal` just gets an `isPain`
  flag rather than a whole parallel card variant, and it goes through the
  same render/dismiss/Why? machinery as every other signal.
  AC-28 itself only specifies the reason text, not the label; the mockup
  settled it.
- **The Why? sheet for Pain is its own composer**
  (`composePainWhySheet`), not the rules-engine one, since there's no
  evaluation/metric to explain — only the fact that pain was reported. Its
  four blocks stay deliberately procedural (AC-34): no diagnosis, cause or
  treatment language, checked by a test that greps the sheet text for
  words like "diagnos", "injury", "treatment", "push through".
- **Reporting or clearing pain re-renders every direction line**
  (`ui/render.js`'s `renderDirectionLines` is now idempotent and
  re-callable), since propagation (AC-30/31) can change any later
  exercise's wording. Today's Focus is not re-rendered on pain, since it's
  a pre-workout view HANDOFF doesn't ask to update mid-session.

M6 additions:

- **The recap headline and row statuses are generated, not scripted per a
  fixed scenario.** R13 says the headline is "scripted per scenario";
  without a scenario system (see M4's interpretations), this derives a
  headline and each row's status from whatever was actually logged, using
  the same shape as mockup 7's one fully-worked example (what happened, in
  <=3 words / <=60 chars). Any real session the reviewer runs through
  produces a truthful recap rather than always replaying one fixed script.
- **Finish makes today's log a real completed session**
  (`state.sessions` is now mutable; `finishSession()` in `state/store.js`
  appends it and clears today's in-progress state). AC-46 needs the next
  Today's Focus to reflect this session "without any action from me" —
  the only way to satisfy that honestly is for the session to actually
  join history, so `evaluate()`'s "last three sessions" naturally shifts.
  Verified end to end by a test that pushes Incline to 42kg, finishes, and
  checks Today's Focus now says HOLD (the push gate needs 3 sessions at
  the *same* weight, and 42kg is new).
- **`showScreen` moved to `ui/navigation.js`.** It was a `main.js`-local
  function through M5; the recap's Done button needed to navigate from a
  different module, so it's now a small shared module instead of
  duplicating the screen-switching logic.
- **An exercise with nothing logged today still gets a row** ("Not
  logged"/"Not logged this session."), since AC-45 requires all six Push
  Day rows regardless of whether the reviewer's test run touched every
  exercise.

M7 additions:

- **No scenario picker was built.** Confirms the M4/M5 deferral: text size,
  locale, reduced motion, tap-target outline and reset are all built (the
  part of the dev toolbar M7 actually needs), but the scenario picker
  itself remains a QA convenience the reviewer doesn't strictly need —
  every state HANDOFF's five scenarios describe is reachable by hand in
  Log Workout, as M4's note explains. PR/ADAPT/PROGRESS accordingly stay
  unreachable (R12: they're "scripted in scenarios").
- **`--blue-fill`, a measured-darker shade of `--blue`, backs every
  primary-button/pill fill (white label text).** Automated axe testing
  found that white text on `--blue` at 16px is 3.4:1 — HANDOFF's own
  contrast table (section 10) calls this acceptable as "bold 16pt", but
  WCAG's actual large-text exemption needs ~18.66px bold or 24px regular
  (using true typographic points, not this file's own "1pt = 1px"
  convention) — 16px doesn't qualify at any weight. `--blue-fill` reaches
  4.5:1 with white text without touching `--blue` itself, which already
  passes everywhere else it's used (links, headings, icons on dark
  backgrounds). This is the one place the prototype knowingly diverges
  from a color HANDOFF sampled from Hevy's own screenshots, for a real
  accessibility requirement axe caught.
- **Two more axe-caught contrast fixes**, both from decorative choices
  this prototype made, not from HANDOFF's own tokens: the "inert"
  Leg Day/Pull Day cards no longer dim the whole card to 70% opacity
  (M1) — dimming `--text-muted` below 4.5:1 — and rely on the disabled
  Start Routine button alone (itself contrast-exempt) to read as inert.
  The Previous column switches to full-strength text once a row is
  checked, since `--text-muted` on `--done-row` measures 4.03:1 (a token
  pairing HANDOFF's own contrast table doesn't cover).
- **Locale threading covers every number the scripted layer writes**
  (direction lines, Today's Focus, signal/chips/Why? sheet text, and the
  recap), not just the direction line. `ReasoningInput` gained an
  optional `locale` field alongside `target`/`setNumber` (same pattern,
  same reasoning: needed for concrete numbers in scripted text).
- **VoiceOver and TalkBack were not tested.** M7's own done-criteria asks
  for this, but real screen-reader behaviour needs a human on physical
  iOS/Android hardware — outside what this build session can verify.
  Likewise AC-48 (glance a card for 3 seconds, state the label and action
  correctly in 5 of 5 scenarios) needs an actual human glancing at the
  screen. Both are called out, not silently marked done, in Appendix A
  below.

## Milestones

Tracking `HANDOFF.md` section 11. Each milestone is reviewed before starting the
next.

- [x] M0 — Scaffold
- [x] M1 — Hevy shell
- [x] M2 — Rules engine
- [x] M3 — Today's Focus and direction line
- [x] M4 — Signals
- [x] M5 — Pain
- [x] M6 — Recap
- [x] M7 — Accessibility and QA (automated checks; VoiceOver/TalkBack need Aditya — see Appendix A)
- [ ] M8 — Live model (optional)

## Appendix A tracking

Every row from HANDOFF Appendix A, ticked or noted (working agreement 12.9).
Legend: ✅ automated (a test asserts it) · 👁 verified by screenshot or code
review this session, not by an automated assertion · ⚠️ genuinely open —
needs Aditya, either on a real device or by eye.

| ID | Status | Note |
|---|---|---|
| AC-1 to AC-3 | ✅ | `todays-focus-render.test.js` — one component, both placements, in order |
| AC-4, AC-5 | ✅ | `todays-focus.test.js` — block order and character limits |
| AC-6 | ✅ | `todays-focus.test.js` (T14) — always leads with Incline |
| AC-7 | ✅ | `navigation.test.js` / `todays-focus-render.test.js` — Start Routine opens Log Workout |
| AC-8, AC-9 | ✅ | `todays-focus-render.test.js` + `scripted-signals.test.js` (length) |
| AC-10 | 👁 | By construction — `render.js` only reads `evaluate()`/`computeTarget()`, never writes to a KG/REPS/RPE input |
| AC-11 | ✅ | `todays-focus-render.test.js` — Dips shows the history-building line |
| AC-12 | ⚠️ | Only 2 of the 7 triggers are implemented (HOLD on RPE>=9, BACK_OFF on a rep drop — R12's stated default policy). PR/ADAPT/PROGRESS need a scenario system that isn't built (see Interpretations) |
| AC-13 | ✅ | `docked-card` CSS (flex-column, 40% max-height, docks above the rest bar) + axe scan |
| AC-14 | ✅ | `signals.test.js` — appears after the signal delay, well under 1s; fades over `--t-card` (200ms) |
| AC-15 | ✅ | `signals.test.js` — label+icon, reason, Why? in order |
| AC-16 | ✅ | `signals.test.js` — dismiss, next-check, and rest-timer-zero all tested |
| AC-17 | ✅ | Single `state.signal`, replaced not stacked; Dismiss never touches `rejectedRecommendations` |
| AC-18 | ✅ | `behaviors.test.js` (focus trap, Close) + `signals.test.js` (four blocks, in order) |
| AC-19 | ✅ | The checkbox toggle is synchronous; signal computation is wrapped in try/catch (nothing shown or thrown on failure) |
| AC-20 | 👁 | Reactive signals are recomputed from live `todaysLogs()` on every check, so nothing is "permanent" — not covered by a dedicated regression test |
| AC-21 to AC-24, AC-26 | ✅ | Golden tests T1-T10 (`evaluate.test.js`) |
| AC-25 | ✅ | `evaluate()` throws for an exercise outside the routine; ADAPT has no editing action anywhere in the UI |
| AC-27, AC-28 | ✅ | `pain.test.js` |
| AC-29 to AC-32 | ✅ | `pain.test.js` |
| AC-33 | ✅ | `store.test.js` (session-scoped state) — pain is never added to `rejectedRecommendations` |
| AC-34 | ✅ | `pain.test.js` greps the Why? sheet for diagnostic/treatment language |
| AC-35 | 👁 | By construction — KG/REPS/RPE are plain `<input>`s, never disabled |
| AC-36 | ✅ | `chips.test.js` + `signals.test.js` |
| AC-37 | ✅/👁 | Chip order and count are tested (`copy.test.js`); the two-row wrap at 393pt is a CSS flex-wrap, checked by screenshot, not pixel-measured |
| AC-38, AC-39, AC-40 | ✅ | `chips.test.js`, `signals.test.js`, `pain.test.js` |
| AC-41 | ✅ | `pain.test.js` — choosing the Pain/discomfort chip also reports pain (same button/card/propagation effects as tapping Pain directly) |
| AC-42 | ✅ | `selectChip()` records to `rejectedRecommendations`; there is no "failed" state anywhere in the app |
| AC-43 to AC-46 | ✅ | `recap.test.js`, including the AC-46 push-to-42kg -> next-session-says-HOLD case |
| AC-47 | 👁 | Global `button:active { opacity: 0.7 }` using `--t-press` (100ms) — not asserted by a timing test |
| AC-48 | ⚠️ | Needs a human — glancing at a card for 3 seconds and recalling it is a perception test, not something this session can run |
| AC-49 | 👁 | Reviewed by eye: only RPE and PR appear as jargon, matching Hevy's own vocabulary |
| AC-50 | 👁 | Every transition uses `--t-card` (200ms); nothing in the CSS flashes or blinks |
| AC-51 | ✅/👁 | `tokens.css` is the only colour source; `--blue-fill` is the one addition (a shade of `--blue`, used only where accessibility required it — see Interpretations). Signals are never colour-only (icon + label, checked by axe's `color-contrast`/`link-in-text-block`-style rules and `signals.test.js`) |
| AC-52, AC-53 | 👁 | `--fs-*`/`--radius-*` tokens used throughout; icons are 2px stroke, rounded caps (verified by screenshot each milestone) |
| AC-54 | 👁 | Verified against the mockups at each milestone's screenshot review |
| AC-55 | ✅ | axe `color-contrast` scan — fixed 3 real violations while building M7 (see Interpretations) |
| AC-56 | ✅ | `accessibility.test.js` — 0 axe violations across 8 screen states (Home, Workout, Log Workout x2, Why? sheet, Pain, Recap, dev toolbar) |
| AC-57 | ✅ | Every `SignalLabel` maps to a distinct icon (`signal-icons.js`); `displayLabel()` always renders text alongside it |
| AC-58 | ✅/👁 | `behaviors.test.js` doesn't assert this directly, but a manual 200% screenshot check confirmed no horizontal overflow (`scrollWidth === clientWidth === 393`) and no clipped text; fixed one real wrapping-order issue found this way (Today's Focus signal badge) |
| AC-59 | ✅ | `behaviors.test.js` — Start Routine, Pain, chips, Dismiss, Why? Close and recap Done all measure >=44pt. `.check-btn` is correctly excluded: it's Hevy's own existing control (~35-40pt, HANDOFF section 10), not a new element |
| AC-60 | ✅ | Every action is a single tap; the Why? sheet has a Close button (its overlay is also click-to-close, though swipe-to-dismiss itself isn't implemented) |
| AC-61 | 👁 | The docked card, chips, Dismiss, Why? and recap Done all sit in the lower/middle portion of the 852pt screen — not pixel-measured against an exact "lower half" line |
| AC-62 | ⚠️ | The live region is wired (`#live-region`, `aria-live="polite"`) and its text updates are unit-tested (`signals.test.js`, `pain.test.js`), but real VoiceOver/TalkBack announcement behaviour needs a physical device |
| AC-63 | ✅ | `pain.test.js` — every control's accessible name contains its visible text; Pain exposes `aria-pressed` |
| AC-64 | ✅ | `behaviors.test.js` — Tab wraps inside the sheet, Escape closes it, focus returns to the trigger |
| AC-65 | ✅ | `behaviors.test.js` (toolbar toggle) + `@media (prefers-reduced-motion: reduce)` for the OS-level case |
| AC-66 | 👁 | Every state has visible text; the prototype has no sound or vibration at all |
| AC-67 | 👁 | The rest timer is Hevy's own convention, left untouched; nothing here imposes a race against it |
| AC-68 | ✅ | `copy.test.js` (T13), `scripted-signals.test.js`, `behaviors.test.js` (live id-ID switch across direction lines, signals, Why? sheet and recap) |
| AC-69 | ✅ | `phone-frame.test.js`, `tokens.test.js` |
| AC-70 | 👁 | By construction — mock data only, Push Day only, RPE pre-filled for every set |

# AI Training Coach: build hand-off for Claude Code

Independent design-for-one concept. Not affiliated with Hevy. Owner: Aditya Nanda Tri Prakoso. Date: 21 September 2026.

## Start here (10 minutes)

1. Create a new repo folder. Copy this package into it so `HANDOFF.md` sits at the root with `docs/` next to it.
2. Open the folder in VS Code and start Claude Code in the integrated terminal.
3. Paste the first prompt from section 14.
4. Work one milestone at a time (section 11). Review each one before saying "next".

## 1. What you are building

A clickable, phone-sized prototype of a coaching feature inside the Hevy workout tracker. It looks like Hevy's Home, Workout tab and Log Workout screens and adds these new elements:

- A **Today's Focus** card at the top of Home (hook wording) and at the top of the Workout tab (plan wording). It is one component with two wordings.
- A **direction line** in each exercise block.
- A **signal card** during rest, with **reason chips** and a **Why?** sheet.
- A **Pain** button next to Add Set.
- A **session recap** screen.

The user is one person (Aditya). The prototype only shows his **Push Day** routine and uses **mock data only**. By default it makes no network calls, needs no API keys and has no Hevy connection. The real product would use a live model for the reasoning layer. In this prototype that layer is scripted so the experience can be tested first. A live-model milestone (M8) is optional.

Out of scope: a live Hevy integration, editing or creating routines, routine rotation, workout generation, wearables, smartwatch, pricing, light theme, and any multi-user feature. Leg Day and Pull Day cards on the Workout tab are static and inert.

## 2. Read these first

| Order | File | Use it for |
|---|---|---|
| 1 | `docs/AI_Training_Coach_PRD.docx` | The build spec. Sections 3 to 5 matter most. Appendix A lists defaults to confirm. |
| 2 | `docs/AI_Training_Coach_Product_Discovery_v2.md` | The reasoning behind the rules and the example wording. |
| 3 | `docs/reference/` | Four Hevy screenshots (visual truth for Hevy's own UI) and seven annotated mockups (where new elements go). |

Rules for using them:

- If Claude Code cannot open the `.docx`, run `pandoc docs/AI_Training_Coach_PRD.docx -t gfm -o docs/AI_Training_Coach_PRD.md`. The acceptance criteria are also copied into Appendix A of this file.
- The PRD wins over the discovery document when they differ. Known differences: the PRD uses outline icons plus text labels instead of emoji, and the PRD places Today's Focus on Home.
- Discovery examples such as 62.5kg bench are illustrative. The mock data in section 8 is what the prototype uses.
- Mockups 3 to 6 reuse Log Workout screenshots that show Seated Lateral Raise directly after Incline. The Push Day order in section 8 follows Aditya's own list.
- The Home screenshot shows other people's usernames and photos in the feed. The top post is Aditya's own. Do not reproduce other people's names or photos in the app. Use neutral placeholders. Keep the repo private.

## 3. Decisions already made (do not reopen)

- Design-for-one. The prototype answers three questions for Aditya: do I follow the recommendations, do I think less mid-workout, would I still pay for it.
- The feature sits inside the host tracker. Hevy does the logging. The feature reads sets, reps, weight, RPE and rest.
- The AI recommends and the user decides. The AI never edits the routine. ADAPT only flags.
- Rules set hard guardrails. The reasoning layer chooses a signal inside them. The real product uses a live model for that layer. The prototype scripts it, and M8 is an optional live-model swap.
- Dark theme only. Portrait phone screen of 393 x 852 pt. 1 pt = 1 CSS px.
- RPE is entered for every set.
- Aditya confirmed the RPE lines: 8 or lower supports a push, and 9 or higher means he is still struggling or in low condition.
- Today's Focus sits on Home and on the Workout tab. It is the same card with different wording. Home is a hook. The Workout tab says what to expect and how to tackle the goal of pushing or holding steady.
- The prototype only shows Push Day.
- The reason chips show every time a set's weight differs from the target. Lighter ramp sets and history-building exercises are excluded.
- Today's Focus always leads with Incline Bench Press.
- A demanding compound means any working set at RPE 9 or higher.
- Exercise names and order follow Aditya's list.
- A warm-up is a tag Aditya sets by pressing the set number. Set 1 is a normal set unless he tags it.
- Signals: PUSH, HOLD, BACK OFF, PR, ADAPT, PROGRESS. Each has a text label and an icon shape: up arrow, pause bars, down arrow, star, circular arrows, check mark. Colour is never the only cue.

## 4. Stack and structure (proposal, change if you prefer)

| Concern | Choice | Why |
|---|---|---|
| Build | Vite, React 18, TypeScript strict | Fast start, easy to run on a phone over the local network |
| Styling | CSS modules and CSS variables from the token file | Tokens stay in one place |
| State | `useReducer` and context | No extra library needed |
| Unit and component tests | Vitest and React Testing Library | Rules engine is pure TypeScript |
| E2E and accessibility | Playwright and `@axe-core/playwright` (add in M7) | Checks timing, sizes, focus and axe rules |
| Lint | ESLint and Prettier | Standard |

```
ai-training-coach/
  HANDOFF.md
  docs/                      (do not edit)
  src/
    domain/                  pure TypeScript, no React, no DOM
      types.ts
      rules/                 evaluate(), pain, overrides
      copy.ts                fixed strings, limits, templates
      recap.ts
    reasoning/
      provider.ts            interface and enforceGuardrails()
      scripted.ts            prototype implementation
    data/
      exercises.ts  sessions.ts  scenarios.ts     (all marked MOCK)
    state/
      store.tsx
    ui/
      tokens.css
      components/            Card, Button, Chip, IconButton, Link, Icon, Sheet, LiveRegion
      screens/               Home, LogWorkout, Recap
      devtoolbar/            outside the phone frame
  tests/
    unit/  component/  e2e/
```

## 5. Architecture rules

1. `domain/` has no React and no DOM. Everything in it is a pure function and is unit tested.
2. The UI never decides a signal. The UI calls `evaluate()` for the allowed signals and the reasoning provider for the choice.
3. Whatever the provider returns goes through `enforceGuardrails()`. A label that is not allowed is replaced by HOLD if HOLD is allowed, otherwise by no signal.
4. `evaluate()` is deterministic. The same input always gives the same allowed set. Wording may vary.
5. Every piece of invented data lives in `src/data/` and is marked `MOCK`.
6. The provider interface must let a live model replace the scripted one without touching the UI. The real product is live, so treat the scripted provider as a stand-in.

## 6. Domain types

```ts
export type SetType = 'warmup' | 'normal' | 'drop' | 'failure';
export type Muscle = 'chest' | 'shoulders' | 'triceps' | 'biceps' | 'back' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';
export type SignalLabel = 'PUSH' | 'HOLD' | 'BACK_OFF' | 'PR' | 'ADAPT' | 'PROGRESS'; // BACK_OFF displays as "BACK OFF"

export interface Exercise {
  id: string;
  name: string;                 // Hevy style, for example "Incline Bench Press (Dumbbell)"
  primary: Muscle[];            // MOCK tags, not verified against Hevy
  secondary: Muscle[];
  isCompound: boolean;          // MOCK tag
  targetReps: { min: number; max: number };
  restSeconds: number;
}
export interface SetEntry { type: SetType; weightKg: number; reps: number; rpe: number } // rpe always present
export interface ExerciseLog { exerciseId: string; sets: SetEntry[] }
export interface Session { id: string; dateISO: string; logs: ExerciseLog[] }
export interface Routine { id: string; name: string; exerciseIds: string[] }
export interface PainState { exerciseId: string; atSetIndex: number }   // session-scoped, cleared on undo or session end

export type BlockReason = 'history' | 'push_gate' | 'high_rpe' | 'cross_exercise' | 'pain';
export interface Evaluation {
  exerciseId: string;
  historyCount: number;
  historyBuilding: boolean;                     // fewer than 3 logged sessions
  allowed: SignalLabel[];
  blocked: { label: SignalLabel; why: BlockReason }[];
  painEffect: 'none' | 'soft' | 'block';
  painSource?: string;                          // name of the exercise where pain was reported
  sharedMuscle?: Muscle;                        // used in the soft wording
}

export interface ReasoningInput {
  trigger: 'today' | 'direction' | 'set_checked' | 'recap';
  exercise: Exercise;
  evaluation: Evaluation;
  lastSet?: SetEntry;
}
export interface ReasoningProvider {
  choose(input: ReasoningInput): SignalLabel | null;              // must return a label from evaluation.allowed or null
  explain(input: ReasoningInput, label: SignalLabel): string;      // must respect the character limits in section 9
}
```

## 7. Rules engine

Each rule cites the criteria it satisfies (IDs are in Appendix A). Rules marked **Interpretation** are my technical reading of the PRD. Implement them as written and add a comment `// INTERPRETATION: see HANDOFF section 7` so they are easy to change. The RPE lines in R5 and R6 are confirmed by Aditya.

| # | Rule | Criteria |
|---|---|---|
| R1 | **Working sets.** Sets tagged warm-up in Hevy are ignored everywhere. Drop and failure sets count as normal sets until decided (section 13). | AC-21 |
| R2 | **Working weight** of a session for an exercise is the highest weight among its working sets. **Sets at working weight** are the working sets at that weight. **Interpretation** | AC-21 |
| R3 | **Successful session.** Every set at working weight reaches at least the bottom of the target rep range. | AC-21 |
| R4 | **History.** An exercise has history when at least 3 completed sessions include it. Otherwise it is in the history-building state: no signal, and the direction line reads "History building: N of 3 sessions". This state wins over pain wording because no recommendation is shown to soften. **Interpretation** | AC-11, AC-30, AC-31 |
| R5 | **Push gate.** PUSH is allowed only when the last three sessions on that exercise were successful, at the same working weight, and every set at working weight had RPE 8 or lower. The last three sessions means the three most recent completed sessions that include the exercise. **Interpretation** for the session selection. | AC-22 |
| R6 | **Consistently high RPE.** If the final working set had RPE 9 or higher in each of the last three sessions, PUSH is blocked and only HOLD and BACK OFF stay allowed. | AC-23 |
| R7 | **Cross-exercise context never unlocks a push.** If the push gate is met and an earlier compound in today's session was demanding, PUSH becomes HOLD. Demanding means any working set of that compound today had RPE 9 or higher. A strong compound day only adds a confidence clause to the reason text. The RPE 9 threshold is confirmed by Aditya. | AC-24 |
| R8 | **Routine boundary.** Only exercises in the routine are evaluated. ADAPT is a flag with no action that edits the routine. | AC-25 |
| R9 | **Determinism.** `evaluate()` is pure. Same input, same allowed set. | AC-26 |
| R10 | **Pain.** See the table below. | AC-27 to AC-34 |
| R11 | **Chips.** Every time a working set is checked at a weight different from the exercise's target weight, up or down, show the reason chips. If a signal comes from the same check, the chips sit below it in the same card. Otherwise the card holds only the chips. A lighter ramp set (a set whose Previous weight is below last session's working weight) never triggers chips, and neither does an exercise still building history. Sets added with Add Set count as working sets. Ignoring the chips has no consequence and they show again on the next differing set. A choice is stored as a rejected recommendation with its reason, never as failed. "Every time" is confirmed by Aditya. The ramp-set exclusion is an **Interpretation**. | AC-35 to AC-42 |
| R12 | **Signal triggers.** A signal appears only for one of the seven meaningful changes in AC-12. The prototype's default policy covers two: HOLD when a working set has RPE 9 or higher, and BACK OFF when reps drop by 2 or more from the previous working set at the same weight. Every other signal is scripted in scenarios. The BACK OFF threshold is my choice. | AC-12, AC-20 |
| R13 | **Recap.** Built from today's logs: a headline of at most 3 words, one row per exercise (six for Push Day), a Next session line and an Overall line, all within the limits in section 9. The headline is scripted per scenario. | AC-43 to AC-46 |
| R14 | **Today's Focus.** One data object, two wordings. The **lead exercise** is always Incline Bench Press (confirmed by Aditya). Home shows a hook headline and a teaser for the lead exercise. The Workout tab shows a "What to expect" block that names the lifts to push, counts the lifts to hold steady, and names the lifts still building history, then a "How to tackle it" block: start weight for the lead exercise, when to move up (first working set controlled at RPE 8 or lower), and when to stay put (RPE 9 or higher). | AC-4, AC-5, AC-6 |

### Pain (R10)

Let E be the exercise where pain was reported and X a later exercise in the same session.

| Case | Test | Effect |
|---|---|---|
| Same exercise | X is E | Block PUSH and PR for the rest of the session. |
| Primary overlap | X.primary intersects E.primary | Block PUSH and PR. Direction line starts with "You reported pain on [E] earlier." |
| Secondary overlap | No primary overlap, but X.primary or X.secondary intersects E.primary or E.secondary | No block. Direction line adds "This also loads [muscle], so keep an eye on it." |
| No overlap | Otherwise | No effect. |
| Undo | Tapping "Pain reported" again | Clear the state, announce "Pain cleared", restore normal evaluation. |
| Scope | Session end | State is discarded. Never carried to the next session. Never logged as failed or as a normal override. |

Never diagnose, name a cause, suggest treatment, or say to push through. Use only the fixed strings in section 9.

### Golden tests (write these first, all must pass)

Use the mock data in section 8.

| # | Given | Expect |
|---|---|---|
| T1 | Incline history, no pain | PUSH allowed. Target 42kg for 8-10 reps. |
| T2 | Seated Lateral Raise history | PUSH blocked with `high_rpe`. Allowed is HOLD and BACK_OFF only. |
| T3 | Chest Fly history | PUSH allowed. |
| T4 | Shoulder Press history | PUSH blocked with `push_gate`, and not high. HOLD is allowed. |
| T5 | Single Arm Triceps Pushdown history | PUSH blocked with `push_gate`. HOLD is allowed. |
| T6 | Dips history | `historyBuilding` is true with count 2. No signal. |
| T7 | Pain on Incline | Incline `painEffect` is block. Chest Fly is block with primary wording. Shoulder Press, Seated Lateral Raise and Triceps Pushdown are soft with the shared muscle and are not blocked by pain. Dips computes as block but its display stays history-building. |
| T8 | Incline logs a working set at RPE 9.5 today | Chest Fly PUSH becomes HOLD with `cross_exercise`. |
| T9 | A set tagged warm-up at a different weight | Working weight ignores it. |
| T10 | Same input twice | Identical `Evaluation`. |
| T11 | Every string in `copy.ts` and every scripted reason | Within the character limits. |
| T12 | Token contrast function on the token pairs | Matches the PRD table: white on blue 3.4:1, secondary on raised 3.9:1. |
| T13 | Locale `id-ID` | 62.5 formats as "62,5". |
| T14 | Today's Focus data for Push Day | Push list is Incline and Chest Fly. Hold list is Shoulder Press, Seated Lateral Raise and Triceps Pushdown. Building is Dips. Both wordings are within the limits. |

## 8. Mock data (invented, all marked MOCK)

Aditya's Push Day list is: Incline Bench Press, Shoulder Press, Seated Lateral Raise, Chest Fly, Single Arm Triceps Pushdown and Bodyweight Dips. Names follow Aditya's list. Only Incline and Seated Lateral Raise carry the full Hevy names, because those come from screenshots. Rest times except two, the sessions and the RPE values are mock. Muscle tags use general knowledge and are not Hevy's own data.

Routine "Push Day", in order:

| # | Exercise | Primary | Secondary | Compound | Target reps | Rest |
|---|---|---|---|---|---|---|
| 1 | Incline Bench Press (Dumbbell) | chest | shoulders, triceps | yes | 8-10 | 120 s |
| 2 | Shoulder Press | shoulders | triceps | yes | 8-10 | 120 s |
| 3 | Seated Lateral Raise (Dumbbell) | shoulders | none | no | 12-15 | 90 s |
| 4 | Chest Fly | chest | shoulders | no | 10-12 | 90 s |
| 5 | Single Arm Triceps Pushdown | triceps | none | no | 10-12 | 60 s |
| 6 | Bodyweight Dips | chest, triceps | shoulders | yes | 8-12 | 90 s |

The rest of 120 s for Incline and 90 s for Seated Lateral Raise are read from the screenshots.

Sessions, oldest first. Format is weight x reps @ RPE. S-1 is the most recent. All sets are normal sets. Dips uses weight 0 to mean bodyweight.

| Exercise | S-3 | S-2 | S-1 |
|---|---|---|---|
| Incline | 30x15@6, 40x11@7.5, 40x10@8 | 30x15@6, 40x12@7, 40x10@8 | 30x15@6, 40x12@7.5, 40x10@8 |
| Shoulder Press | 24x10@8, 24x9@8.5, 24x8@8.5 | 24x10@8, 24x9@8.5, 24x8@8.5 | 24x10@8, 24x9@8.5, 24x9@8.5 |
| Lateral Raise | 15x15@8, 15x15@8.5, 15x15@9 | 15x15@8, 15x15@9, 15x15@9 | 15x15@8.5, 15x15@9, 15x15@9.5 |
| Chest Fly | 20x12@7, 20x11@7.5, 20x10@8 | 20x12@7, 20x12@7.5, 20x11@8 | 20x12@7, 20x12@7.5, 20x12@8 |
| Triceps Pushdown (kg per arm) | 12x12@8, 12x11@8.5, 12x10@8.5 | 12x12@8, 12x11@8.5, 12x11@8.5 | 12x12@8, 12x12@8.5, 12x11@8.5 |
| Dips | none | 0x10@8, 0x9@8.5, 0x8@9 | 0x10@8, 0x10@8.5, 0x9@9 |

The Incline S-1 row matches the PREVIOUS column in the Log Workout screenshot (30kg x 15, 40kg x 12, 40kg x 10). Set 1 is a normal set there. The RPE values are mock.

What the data produces: Incline and Chest Fly pass the push gate. Shoulder Press and Triceps Pushdown do not (RPE 8.5) and are not consistently high, so they hold steady. Lateral Raise is consistently high. Dips has only two sessions, so it is history-building.

Scenarios (selectable in the dev toolbar, each preloads today's state):

| # | Name | What it shows |
|---|---|---|
| 1 | Follow the push | Both cards say PUSH on Incline, target 42kg. Logging 42kg at RPE 8 gives no signal. RPE 9 gives HOLD. |
| 2 | Skip the push | Set 1 (30kg ramp set) shows no chips. Set 2 checked at 40kg shows the chips. Set 3 at 40kg and RPE 9 shows HOLD with the reason "Set 3 was RPE 9. Stay at 40kg, no need to add a set today." and the chips again. |
| 3 | Pain | Tap Pain after Incline set 2. Chest Fly gets the block and wording. Shoulder Press, Lateral Raise and Triceps Pushdown get the soft wording. Dips stays history-building. Tap again to clear. |
| 4 | High RPE hold | Lateral Raise shows HOLD only, with PUSH blocked. |
| 5 | Demanding compound | An Incline set at RPE 9.5 turns Chest Fly PUSH into HOLD. |

Mockup 4 in `docs/reference/` shows the chips and the signal in one frame to show every element. In the app they can appear on the same check or on separate checks.

## 9. Screens, components and copy

Placement comes from the mockups. Sizes and colours come from section 10. Every control the feature adds is at least 44 x 44 pt.

| Screen | Element | Component | Behaviour |
|---|---|---|---|
| Home | Today's Focus | `TodaysFocusCard` with `variant="home"` | First element under the Home header, above the feed. Blue heading, session name, signal label with icon and hook headline, teaser, then a full-width Start Routine button. |
| Home | Feed | static | Placeholder posts with neutral names. No real usernames or photos. |
| Workout | Today's Focus | `TodaysFocusCard` with `variant="workout"` | Same component and style. First element under the Workout header, above Start Empty Workout. Blue heading, session name, a What to expect block, a How to tackle it block, then Start Routine. |
| Workout | Rest of the tab | static | Start Empty Workout, Routines heading, New Routine, Explore, tip banner, My Routines with Leg Day, Pull Day and Push Day cards. Only Push Day starts anything. The other two are inert. |
| Log Workout | Direction line | `DirectionLine` | Directly below the Rest Timer line, above the set table header. Target in bold, then the reason. Never changes the KG, REPS or RPE fields. |
| Log Workout | Add Set and Pain | `AddSetPainRow` | Add Set about 60% and Pain about 40%, both at least 44 pt tall. Pain is a toggle with an outline alert icon. |
| Log Workout | Signal card | `DockedCard` | Docked above the rest timer bar, or at the bottom when the bar is not showing. Label and icon, reason, Why? link, Dismiss button. At most 40% of the screen height. |
| Log Workout | Reason chips | `Chip` | Inside the docked card. Six chips, two rows. |
| Log Workout | Why? sheet | `Sheet` | Bottom sheet with four labelled blocks: What I did, Calculated, AI interpretation, Recommendation. Close button. |
| Recap | Recap | `RecapScreen` | Full screen after Finish. Headline, six exercise rows, Next session, Overall, Done button fixed to the bottom. |

Interaction constants:

```ts
export const TIMING = {
  pressedMs: 100,      // visible pressed state after any tap
  signalMs: 1000,      // signal appears within 1 second of checking a set
  transitionMs: 200,   // fades and slides, none when reduced motion is on
  checkRegisterMs: 100 // checking a set never waits on the AI
};
```

Character limits:

```ts
export const LIMITS = {
  homeHook: 45, homeTeaser: 90,
  workoutExpect: 200, workoutTackle: 200,
  directionReason: 220, signalReason: 110,
  recapStatus: 60, recapNext: 150, recapOverall: 100, recapHeadlineWords: 3,
};
```

Fixed copy (exact strings):

| Use | String |
|---|---|
| Primary button on both cards | `Start Routine` |
| Card heading | `TODAY'S FOCUS` (blue, 12 pt uppercase) |
| Pain reported card | `Pain reported. Hold or reduce the load here. Stopping is a valid choice.` |
| Pain, primary overlap | `You reported pain on [exercise] earlier.` then `Keep this one conservative and stop if it returns.` |
| Pain, secondary overlap | `This also loads [muscle], so keep an eye on it.` |
| Pain cleared | `Pain cleared` |
| History building | `History building: N of 3 sessions` |
| Chips heading, push skipped | `Why did you skip the push?` |
| Chips heading, other change | `Why did you change the weight?` (my proposal) |
| Chips, in order | Too tired, Poor sleep, Didn't feel ready, Pain/discomfort, Changed my mind, Other |
| Chip saved | `Reason saved: [reason]` |

Scripted example wording (all within limits, illustrative numbers):

- Home hook headline: `Your incline is ready for more.` Teaser: `Three steady sessions at RPE 8 or lower. Try 42kg today?`
- Workout tab, What to expect: `Push on Incline Bench Press and Chest Fly. Hold steady on the other three. Dips is still building history (2 of 3 sessions).`
- Workout tab, How to tackle it: `Start incline at 40kg. If the first working set feels controlled at RPE 8 or lower, go to 42kg. At RPE 9 or higher, stay put and keep the rest steady.`
- Direction, Incline: `Your incline has been stable at 40kg x 10 for three sessions at RPE 8 or lower. If the first set feels controlled, consider 42kg.`
- HOLD after a high set: `Set 3 was RPE 9. Stay at 40kg, no need to add a set today.`
- Recap: headline `Strong session.` Next session `Push incline to 42kg if the first set stays at RPE 8 or lower.` Overall `Good session. Keep the lighter lifts steady.` Row statuses are in mockup 7.

## 10. Design tokens and accessibility

Hevy publishes no design system that I could find. These values were measured from three screenshots, so they are approximate. The typeface is most likely SF Pro, the iPhone system font. That is unconfirmed and comes from Aditya's source. Use the system font stack in the token file so Apple devices render SF natively. Do not bundle or download SF font files, because Apple's licence limits how they can be used. The mockups use Figtree only as a stand-in.

```css
:root {
  /* colour */
  --bg: #000000;  --surface: #1C1C1D;  --raised: #2C2C2D;
  --text: #FFFFFF;  --text-muted: #84888E;  --blue: #3D8AF7;
  --done-row: #1C2F0E;  --done-cell: #18290C;  --done-check: #71BA41;
  /* layout, 1pt = 1px at 393 wide */
  --margin: 16px;  --radius-card: 10px;  --radius-btn: 7px;  --radius-btn-lg: 9px;
  --tap: 44px;  --stroke: 2px;
  /* type */
  --fs-title: 24px;  --fs-exercise: 18px;  --fs-body: 16px;
  --fs-secondary: 15px;  --fs-label: 12px;  --fs-small: 11px;  --fs-timer: 28px;
  /* motion */
  --t-press: 100ms;  --t-card: 200ms;
  --text-scale: 1;
  /* font */
  --font: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
```

Component patterns to copy:

| New element | Copies | Spec |
|---|---|---|
| Card | Routine card and Suggested Athletes card | `--surface`, `--radius-card`, 16 px side margin and inner padding |
| Primary button | Start Routine and Skip | `--blue` fill, white medium 16 px, `--radius-btn-lg`, at least 44 px tall |
| Secondary button | Add Set | `--surface` fill, white 16 px, `--radius-btn` |
| Selected state | Blue active state | `--blue` fill, check icon, text "Pain reported" |
| Chip | -15 and +15 | `--raised` fill, white 15 px, `--radius-btn-lg` |
| Dismiss | Round back button | 44 px circle, `--raised`, outline X |
| Link | Blue Rest Timer line | `--blue`, outline info icon, 44 px tap area |
| Section label | Table header | 12 px uppercase `--text-muted` |
| Today's Focus heading | Blue Rest Timer line | 12 px uppercase `--blue` (5.0:1 on `--surface`) |
| Icons | Hevy outline icons | 2 px stroke, rounded ends |

Contrast rules that follow from the token pairs: never put `--text-muted` on `--raised` (3.9:1). Labels on `--blue` are bold 16 px (3.4:1 passes only as large text).

Accessibility implementation notes (target WCAG 2.2 AA):

1. One `role="status"` live region, `aria-live="polite"`, off-screen. Announce each new signal, "Pain reported" and "Pain cleared" by updating its text. Never move focus.
2. Use real `button` elements. The Why? sheet is a `role="dialog"` with `aria-modal`, traps focus, and returns focus to the trigger on close. Add a Close button as well as swipe.
3. Every control's accessible name contains its visible text. Pain exposes `aria-pressed`.
4. Signals show an icon and a text label. Never colour alone.
5. All sizes use `calc(var(--fs-x) * var(--text-scale))` so the dev toolbar can test 200% text. At 200%, nothing clips, nothing needs horizontal scroll, and the docked card scrolls inside itself when taller than 40% of the screen.
6. Honour `prefers-reduced-motion` and the toolbar toggle. With it on, cards and sheets appear with no slide or fade.
7. Format numbers with `Intl.NumberFormat` and the active locale. The toolbar toggles `en-GB` and `id-ID`.
8. Give the page bottom padding equal to the docked card height so no set row stays hidden, and keep the focused element visible.

Dev toolbar (outside the phone frame): scenario picker, reset, text size 100/150/200%, reduced motion toggle, locale toggle, a "show tap targets" outline. Label all mock data.

## 11. Milestones

Do one at a time. After each, run lint, typecheck and tests, then stop and show the user.

| # | Milestone | Done when | You review |
|---|---|---|---|
| M0 | Scaffold | Vite app runs. Empty phone frame is 393 x 852. Token file, dev toolbar shell, README with the not-affiliated line. Lint, typecheck and test scripts pass. | 5 min |
| M1 | Hevy shell | Static Home, Workout tab and Log Workout look like the screenshots, using placeholder feed data. Routine cards, set table, Add Set, rest timer bar and top bar match. | 15 min |
| M2 | Rules engine | Mock data in place. T1 to T11 pass. No UI yet. | 10 min |
| M3 | Today's Focus and direction line | Both card variants and the direction lines render from `evaluate()`. History-building line shows for Dips. | 10 min |
| M4 | Signals | Signal card, Dismiss, Why? sheet, chips, live region. Timing constants used. | 15 min |
| M5 | Pain | Split Add Set row, toggle, propagation wording, undo, session scope. | 10 min |
| M6 | Recap | Full screen after Finish. Fits all six Push Day exercises without scrolling. | 10 min |
| M7 | Accessibility and QA | axe clean. 200% text, reduced motion and locale checks pass. Manual VoiceOver and TalkBack pass. Every row in Appendix A is ticked or noted. | 20 min |
| M8 (optional) | Live model | `LiveProvider` behind the same interface, key kept server-side. The five scenarios run live. Latency measured and reported. | 20 min |

### M8 in detail (optional live model)

Do this only after M7 and only if Aditya asks. The goal is to judge real AI wording and trust, which the scripted layer cannot show.

1. Add `LiveProvider` implementing `ReasoningProvider` (section 6). Keep `ScriptedProvider`. Choose between them with an environment flag `AI_PROVIDER=scripted|live`. The default is scripted.
2. Keep the API key on a tiny local server or the Vite dev-server proxy. Never put the key in browser code. Read the key and the model name from environment variables. For latency tests start with `claude-haiku-4-5-20251001`, and compare wording quality with `claude-sonnet-5`.
3. Send only what the model needs: the `Evaluation`, the exercise name, the last set and the trigger.
4. Ask for a JSON reply with a label and a reason. Validate it. The label must be in `evaluation.allowed` and the reason must fit `LIMITS`. On failure, retry once, then fall back to the scripted text.
5. Pain wording stays as the fixed strings in section 9. The model never writes safety copy.
6. The model may only mention exercises in the routine (R8). Reject replies that name others.
7. Latency. AC-14 needs a signal within 1 second and AC-19 says a late signal shows nothing, so a live call may miss that often. Measure the median and the 95th percentile over 20 calls per scenario and report them. Then propose one option: start the call when the set starts instead of when it is checked, call during the rest timer and show the signal when ready, or relax the criteria. Do not change the criteria without Aditya's decision.
8. All golden tests still pass with the live provider mocked. Add contract tests for label, limits, routine boundary and pain copy.
9. Add a short table to the README that compares the five scenarios scripted versus live: wording within limits, guardrails respected, latency, and Aditya's trust rating (Hypothesis 3 in the discovery document).
10. Keep it dev-only. Send mock data only. Never send real Hevy data unless Aditya decides so.

## 12. Working agreements for Claude Code

1. Read this file and PRD sections 3 to 5 before writing code.
2. Do not add product decisions. If something is unspecified, ask, then record the answer in `docs/DECISIONS.md`.
3. Never edit anything in `docs/` except `docs/DECISIONS.md`.
4. No network calls, API keys, analytics or external fonts in the app. The only exception is M8, which is opt-in and keeps the key server-side.
5. Mark invented data `MOCK` in code and in the dev toolbar. Never present the prototype as a real Hevy feature.
6. Keep tokens in `tokens.css` only. No hard-coded colours or sizes in components.
7. Commit at the end of each milestone with the milestone name.
8. At each milestone, take a screenshot at 393 x 852 and compare it with the matching file in `docs/reference/`.
9. Report interpretations in the README under "Interpretations".

## 13. Open decisions

Confirmed by Aditya: the RPE lines, Push Day only, Today's Focus on Home and Workout with different wording, warm-up as a tag, the exercise list and order, Incline Bench Press as the lead exercise, RPE 9 or higher for a demanding compound, reason chips every time a set's weight differs, and that the real product uses a live model while the prototype scripts it.

Nothing blocks the build.

Can wait until after M7: how a push works for bodyweight dips. It is not built. Bodyweight Dips stays history-building in the mock.

Everything else I interpreted is flagged **Interpretation** in section 7 and needs no answer now: working weight, session selection, history building over pain wording, the ramp-set exclusion for chips, and the BACK OFF threshold. Drop and failure sets count as normal sets. Leg Day and Pull Day are inert. The typeface is the system font stack (section 10).

## 14. First prompt to paste into Claude Code

```
Read HANDOFF.md fully, then docs/AI_Training_Coach_PRD.docx sections 3 to 5
(use pandoc to convert it if you cannot open it). Skim
docs/AI_Training_Coach_Product_Discovery_v2.md sections 12 to 19, 26, 29, 30 and 33.

Then do milestone M0 only, following section 11 and the working agreements in
section 12. Ask me before making any product decision that the documents do not
cover. When M0 is done, run lint, typecheck and tests, show me the phone frame
screenshot, and stop.
```

## Appendix A. Acceptance criteria (copied from the PRD)

IDs match the PRD. "Verify with" is my suggestion for how to test each one.

| ID | Criterion | Verify with |
|---|---|---|
| **Today’s Focus** | | |
| AC-1 | Given I open the Home tab, then Today’s Focus is the first element below the Home header and above the feed. It is a full-width card with 16 pt side margins. | Component |
| AC-2 | Given I open the Workout tab, then the same card is the first element below the Workout header and above Start Empty Workout. It pushes the rest of the tab down. | Component |
| AC-3 | Both placements use one card component with the same layout, spacing and style. Only the wording differs. | Component |
| AC-4 | The Home card is a hook. It shows, in this order: a small blue “Today’s Focus” heading, the session name, the signal label with its icon and a hook headline of at most 45 characters, one teaser line of at most 90 characters, and the Start Routine button. | Component + Unit (limits) |
| AC-5 | The Workout card is a plan. It shows, in this order: the same heading and session name, a “What to expect” block of at most 200 characters that says which lifts to push, which to hold steady and which are still building history, a “How to tackle it” block of at most 200 characters that says where to start and when to move up or stay put, and the Start Routine button. | Component + Unit (limits) |
| AC-6 | Both cards lead with Incline Bench Press. They use only my own history and today’s routine. I can read them without opening any other screen. | Unit |
| AC-7 | Start Routine is a full-width blue button inside the card, at least 44 pt tall, in Hevy’s primary button style. One tap starts Push Day and opens Log Workout. | Component |
| **Exercise direction** | | |
| AC-8 | In each exercise block, one direction line sits directly below the Rest Timer line and above the set table header. | Component |
| AC-9 | The line shows the target as weight × rep range in bold 16 pt, then one reason of at most 220 characters at 15 pt. The reason wraps and is never cut off with an ellipsis. | Unit + Component |
| AC-10 | The KG, REPS, RPE and check controls keep their size and position. The AI never changes the values in them. | Unit |
| AC-11 | Given an exercise has fewer than three logged sessions, then the line reads “History building: N of 3 sessions” and no signal is shown for it. | Unit |
| **Signals: display and interaction** | | |
| AC-12 | Given I check a set, a signal appears only if one of these happened: a push opportunity, unexpected fatigue, a PR opportunity, a performance decline, excessive accumulated volume, meaningful progression, or a need to adapt. Otherwise nothing appears. | Unit |
| AC-13 | The signal is a card docked directly above the rest timer bar, or at the bottom of the screen when the bar is not showing. It is full width with 16 pt side margins and at most 40% of the screen height. It never covers the -15, +15 or Skip controls. The page gets bottom padding equal to the card height so no set row stays hidden. | E2E + Visual |
| AC-14 | The card appears within 1 second of checking the set, with a fade of at most 200 ms. | E2E |
| AC-15 | The card shows, in this order: a label (PUSH, HOLD, BACK OFF, PR, ADAPT or PROGRESS) at 16 pt bold with its icon, then a reason of at most 110 characters at 15 pt, then a “Why?” link. | Component |
| AC-16 | The card stays until the rest timer reaches 00:00, I check the next set, or I tap Dismiss (a 44 × 44 pt button). It never disappears earlier on its own. | E2E |
| AC-17 | Only one signal card is visible at a time. A new signal replaces the old one. Dismissing a card is not recorded as an override. | Component |
| AC-18 | Tapping “Why?” opens a bottom sheet with four labelled blocks in this order: What I did (recorded facts), Calculated (metrics), AI interpretation, Recommendation. A Close button (at least 44 pt) closes it and returns me to the card. | Component |
| AC-19 | Checking a set is one tap and registers within 100 ms whether or not a signal is produced. If a signal is late or fails, nothing is shown and no error appears during the workout. | E2E |
| AC-20 | A recommendation made before the workout is not permanent. Later signals use the sets I have completed. | Unit |
| **Rules and definitions** | | |
| AC-21 | A session counts as successful for an exercise when every set at that session’s working weight reaches at least the bottom of the target rep range. Sets I tag as warm-up in Hevy are ignored. | Unit |
| AC-22 | PUSH is allowed only when the last three sessions on that exercise were successful at the same working weight and every set in them had RPE 8 or lower. Otherwise the signal is HOLD, BACK OFF or none. | Unit |
| AC-23 | If the final set had RPE 9 or higher in each of the last three sessions, the signal is HOLD or BACK OFF, never PUSH. I read RPE 9 or higher as still struggling or in low condition. | Unit |
| AC-24 | Performance on another exercise or earlier in the session never makes PUSH possible. If the push rule is already met, a strong compound can be cited as extra confidence. A demanding compound changes PUSH to HOLD. | Unit |
| AC-25 | Recommendations only cover exercises already in my routine. The AI never adds, removes or reorders exercises. ADAPT only flags the routine for my review and has no button that edits it. | Unit |
| AC-26 | The same data always gives the same set of allowed signals. Only the wording may vary. | Unit |
| **Pain** | | |
| AC-27 | On each exercise, the Add Set row is split: Add Set takes about 60% of the width and Pain about 40%. Both are at least 44 pt tall, so the row grows slightly from Hevy’s current height. Pain shows an icon and the word “Pain”. | Component |
| AC-28 | One tap on Pain, at any time before, between or after sets, changes it to “Pain reported” with a check icon and a filled style, and shows a signal card within 1 second reading: “Pain reported. Hold or reduce the load here. Stopping is a valid choice.” | E2E |
| AC-29 | After pain is reported on an exercise, no PUSH or PR signal appears on it for the rest of the session. | Unit |
| AC-30 | Later exercises that share at least one primary muscle with the painful exercise, per Hevy’s muscle tags, get the same block. Their direction line starts with “You reported pain on [exercise] earlier.” | Unit |
| AC-31 | Later exercises that share only secondary muscles are not blocked. Their direction line adds “This also loads [muscle], so keep an eye on it.” | Unit |
| AC-32 | Tapping “Pain reported” again clears it, announces “Pain cleared”, and restores normal evaluation. This recovers from a mis-tap. | E2E |
| AC-33 | Pain is not logged as a failed recommendation or a normal override. It ends when the session ends and does not appear in the next session. | Unit |
| AC-34 | No pain message diagnoses, names a cause, suggests treatment, or tells me to push through. | Unit |
| **Override and reasons** | | |
| AC-35 | The KG, REPS and RPE fields stay editable at all times. Checking a set with any values always works, whatever the recommendation. | E2E |
| AC-36 | Given I check a set whose weight differs from the target weight, up or down, then reason chips appear in the docked card, below the signal if there is one. This applies to every such set. It does not apply to lighter ramp sets (sets whose Previous weight is below last session’s working weight) or to exercises still building history. | E2E |
| AC-37 | There are exactly six chips in this order: Too tired, Poor sleep, Didn’t feel ready, Pain/discomfort, Changed my mind, Other. Each has 15 pt text and is at least 44 pt tall with 8 pt gaps, and they wrap to two rows on a 393 pt wide screen. | Component |
| AC-38 | The chips heading reads “Why did you skip the push?” when a push was recommended and I logged less. For any other change it reads “Why did you change the weight?”. | Component |
| AC-39 | One tap on a chip selects it and replaces the chips with the line “Reason saved: [reason]”. No second tap or typing is needed. | E2E |
| AC-40 | Ignoring the chips has no consequence. They disappear with the card, and the next set checked at a different weight shows them again. | E2E |
| AC-41 | Choosing Pain/discomfort triggers the same effects as the Pain button. | E2E |
| AC-42 | A skipped recommendation is recorded as rejected, with the reason if given, and never as failed. | Unit |
| **Session recap** | | |
| AC-43 | The recap is a full screen shown after I confirm Finish and before I return to Home. | E2E |
| AC-44 | It shows, in this order: a headline of at most 3 words, one row per exercise (name, sets summary such as “65kg × 8 × 3”, and a status of at most 60 characters), a “Next session” line of at most 150 characters, an “Overall” line of at most 100 characters, and a Done button fixed to the bottom, full width and at least 44 pt tall. | Component |
| AC-45 | Push Day has 6 exercises. The recap fits all 6 on one screen without scrolling at the default text size. | Visual |
| AC-46 | The next session’s Today’s Focus reflects this session without any action from me. | Unit |
| **UX best practice** | | |
| AC-47 | Every tap shows a visible pressed state within 100 ms. | E2E + Manual |
| AC-48 | Given a mock scenario, when a signal card is shown for 3 seconds and then hidden, I can state its label and what to do (push, hold or back off) correctly in 5 of 5 scenarios. | Manual |
| AC-49 | Copy uses short sentences and plain words. The only jargon is RPE and PR, which Hevy already uses. | Manual |
| AC-50 | All transitions last at most 200 ms and nothing flashes more than 3 times in any second. | Unit (CSS check) + Manual |
| **Hevy design system alignment (values measured from the screenshots)** | | |
| AC-51 | New elements use only Hevy’s colour tokens: background #000000, surface #1C1C1D, raised #2C2C2D, primary text #FFFFFF, secondary text #84888E and accent blue #3D8AF7. No new colours are added. Signals are told apart by label and icon. | Unit (token check) + Visual |
| AC-52 | Text uses Hevy’s existing typeface and scale: 16 pt for values, buttons and signal labels (bold), 15 pt for reasons and secondary text, and 12 pt uppercase for small section labels. | Visual |
| AC-53 | Cards use a 10 pt corner radius (measured 8 to 12 pt) and a 16 pt side margin. Buttons and chips use a 7 to 9 pt radius. Icons are outline style with a 2 pt stroke and rounded ends. | Visual |
| AC-54 | Each new element copies an existing Hevy pattern: cards copy the routine card, the primary button copies Start Routine and Skip, the secondary button copies Add Set, chips copy the -15 and +15 buttons, the Dismiss button copies the round back button, and links copy the blue Rest Timer line. | Visual |
| AC-55 | Secondary text (#84888E) is never placed on #2C2C2D. Labels on blue buttons are 16 pt bold. Both rules follow from the contrast table under Hevy design system alignment. | Unit |
| **Accessibility (target: WCAG 2.2 Level AA)** | | |
| AC-56 | Text has a contrast ratio of at least 4.5:1 against its background, or 3:1 for text 18 pt or larger (or 14 pt bold). Icons, chip borders and focus indicators have at least 3:1. The token pairs in the contrast table meet this. | Unit + axe |
| AC-57 | Colour is never the only signal. Each signal has a text label and its own icon shape: up arrow for PUSH, pause bars for HOLD, down arrow for BACK OFF, star for PR, circular arrows for ADAPT, check mark for PROGRESS. | Component + axe |
| AC-58 | At 200% text size, no text is clipped, cut off with an ellipsis or overlapped, no horizontal scrolling is needed, and every control stays reachable. The docked card scrolls inside itself if it grows past 40% of the screen. | E2E (200% text) + Manual |
| AC-59 | Every tappable control this feature adds is at least 44 × 44 pt, with at least 8 pt between neighbouring controls. | E2E (size check) |
| AC-60 | Every action works with a single tap. No drag, long press or multi-finger gesture is required. Swiping a sheet down also has a Close button. | E2E |
| AC-61 | The docked card, its controls (Why?, Dismiss, reason chips) and the recap’s Done button sit in the lower half of the screen so they work one-handed. | Visual |
| AC-62 | With VoiceOver or TalkBack on, a new signal card is announced automatically as a polite status message, label first and then the reason. Focus does not move. “Pain reported” and “Pain cleared” are announced the same way. | Manual (VoiceOver, TalkBack) |
| AC-63 | Every control has an accessible name that contains its visible text: Pain, Dismiss, Why, Start Workout, Done, and each chip. The Pain button reports its on or off state. | axe + Component |
| AC-64 | Focus order follows the visual order from top to bottom, with the docked card after the set table and before the rest timer controls. Sheets keep focus inside and return it to the trigger on close. The focused control is always visible. | E2E + Manual |
| AC-65 | When the device has reduce motion turned on, cards and sheets appear without sliding or fading. | E2E (reduced motion) |
| AC-66 | No information is given by sound or vibration alone. Every alert also has visible text. | Manual |
| AC-67 | Nothing in this feature requires me to act before a timer runs out. The rest timer is Hevy’s own and is not changed. | E2E |
| AC-68 | Numbers and units follow the device locale. Hevy’s screenshots show a comma decimal, for example 4.994,5 kg, so 62.5 kg shows as 62,5 kg on such a device. | Unit |
| **Prototype** | | |
| AC-69 | The prototype runs on a portrait phone screen of 393 × 852 pt, the size of the screenshots. | Component |
| AC-70 | The prototype uses mock data and a scripted AI layer. It always shows Push Day, and RPE is assumed to be entered for every set. | Manual |

## Appendix B. Package contents

```
HANDOFF.md
docs/AI_Training_Coach_PRD.docx
docs/AI_Training_Coach_Product_Discovery_v2.md
docs/reference/hevy-home.png
docs/reference/hevy-workout-tab.png
docs/reference/hevy-log-resting.png
docs/reference/hevy-log-before.png
docs/reference/mockup-1-home.png
docs/reference/mockup-2-workout-tab.png
docs/reference/mockup-3-log-before.png
docs/reference/mockup-4-log-resting.png
docs/reference/mockup-5-why-sheet.png
docs/reference/mockup-6-pain-reported.png
docs/reference/mockup-7-recap.png
```

# Decisions

Product decisions made during the build that HANDOFF.md didn't cover, or that
revise something HANDOFF marked as already decided. Working agreement 2: ask
Aditya, then record the answer here.

## Celebrate exceeding the target, instead of asking why the weight changed

**Date:** 2026-09-21 (during M4+ manual testing)

**What changed:** HANDOFF section 3 lists "the reason chips show every time a
set's weight differs from the target" as confirmed and explicitly
"do not reopen." In practice, checking a set *above* the suggested target
triggered the exact same chips and heading as checking one below it —
"Why did you change the weight?" — which reads as an interrogation for
something that's actually good news.

**Decision (Aditya, live in the app):** when a checked set exceeds the
target, show a celebratory signal — PROGRESS ("Nice progress!") or PR
("your heaviest yet on this lift") if the weight is a genuine all-time high
for that exercise. Two other options were offered and declined: dropping the
chips entirely on an overshoot with no replacement, and just softening the
"Why did you change the weight?" wording without adding a signal.

**Update, same session:** the first version of this also kept the reason
chips underneath the celebration, to keep HANDOFF's "chips every time, up or
down" rule technically intact. Aditya tried it and asked for the chips to be
dropped entirely when celebrating — a card that says "PR! Great work!"
immediately followed by "why did you change the weight?" still read as an
unnecessary ask right after good news. Chips are now suppressed outright
whenever the signal is PROGRESS or PR; the "every time" rule still holds for
every other case (checking below target, or at/above it without a
PROGRESS/PR-worthy result).

**What this unlocks:** PROGRESS and PR were previously unreachable in the
prototype — R12 only names HOLD and BACK_OFF as the default reactive policy,
with everything else "scripted in scenarios" (no scenario system is built,
see README). This is the one case where a real, general rule was written
for one of the other four signals instead: exceeding today's suggested
target triggers PROGRESS, and exceeding the heaviest weight ever logged for
that exercise triggers PR instead. ADAPT still has no reactive trigger and
remains unreachable.

**Implementation:** `src/domain/rules/signal-trigger.js` (`reactiveSignal`),
`src/reasoning/provider.js` (`enforceGuardrails` now lets PROGRESS/PR
through without an `evaluate()` allow-list, since they report what already
happened rather than recommending what to do next — but still suppresses
them when pain is reported, per R10/AC-34), `src/reasoning/scripted.js`
(reason text + Why? sheet content for both labels), `src/domain/rules/
history.js` (`allTimeMaxWorkingWeight`).

## A seventh chip, "Regular weight", for the "skip the push" case only

**Date:** 2026-09-21 (same session, immediately after the above)

**What changed:** AC-37 fixes the chip list at exactly six, in order:
Too tired, Poor sleep, Didn't feel ready, Pain/discomfort, Changed my mind,
Other. None of the six covers the common, non-negative reason "I deliberately
stuck with my usual weight" — the closest fit, "Changed my mind", implies
indecision rather than a considered choice.

**Decision (Aditya, live in the app):** add "Regular weight" as a seventh
chip, positioned before "Other", but *only* when the heading is "Why did you
skip the push?" (`push_skipped`). The general "Why did you change the
weight?" heading (`other_change`) keeps HANDOFF's original six exactly — the
new chip doesn't make sense there (e.g. when the change was upward, now also
covered by the PROGRESS/PR case above rather than chips at all).

**Implementation:** `src/domain/copy.js` — `CHIP_LABELS` (six, unchanged) vs.
`PUSH_SKIPPED_CHIP_LABELS` (seven), selected by the new `chipLabelsFor()`
helper; `src/ui/log-workout.js`'s docked-card renderer calls it instead of
using `CHIP_LABELS` directly.

## ADAPT dropped from scope — not MVP

**Date:** 2026-09-22

**What changed:** HANDOFF section 3 lists all six signals (PUSH, HOLD,
BACK OFF, PR, ADAPT, PROGRESS) as confirmed, with an icon shape and a place
in AC-15/AC-25/AC-57's accessibility requirements. ADAPT was always
unreachable in this prototype — HANDOFF treats it as "scripted in
scenarios," and no scenario system was ever built (see the M4/M7 notes in
README) — but it still existed as a real value in the `SignalLabel` type,
with its own icon.

**Decision (Aditya):** remove ADAPT entirely. It's out of MVP scope per the
discovery doc's own MVP Core Capability (section 36: Push/Hold/Back Off for
exercises already in the routine) — unlike PROGRESS/PR above, this isn't a
new capability being added, it's an unused one being cut. `SignalLabel` is
now `'PUSH' | 'HOLD' | 'BACK_OFF' | 'PR' | 'PROGRESS'`, five values.

**Implementation:** `src/domain/types.js` (`SignalLabel`), `src/ui/
signal-icons.js` (`SIGNAL_ICON_IDS`, `icon-refresh` mapping removed),
`index.html` (the now-unused `#icon-refresh` sprite symbol removed),
`src/domain/rules/signal-trigger.js` (R12 comment updated). HANDOFF.md
itself is left as-is (the original spec, not edited retroactively); this
entry is the record of the deviation, along with README's Interpretations
and `docs/PRODUCT_OVERVIEW.md`.

## A high-RPE PR/PROGRESS shows both, celebration first

**Date:** 2026-09-22 (same session, after live testing on Incline Bench Press)

**What changed:** `reactiveSignal()`'s original ordering (see the first
entry above) checked RPE before the target-exceeded check, so a set that
was both a genuine PR *and* RPE 9+ returned HOLD only — the celebration was
silently lost, and since the card was no longer a celebration, the "why did
you change the weight?" chips appeared too. Aditya noticed this on Incline
Bench Press (Dumbbell): a heavy, high-effort PR produced an interrogation
card with no acknowledgment of the PR at all.

**Decision (Aditya, asked via three options — keep HOLD as-is, celebrate
with the effort folded into the wording, or show both with the celebration
first):** show both. The card leads with PR/PROGRESS (icon, label, and the
usual celebration reason), and a second, visually distinct block below it
carries the HOLD caution ("Set 3 was RPE 9. Stay at 44kg, no need to add a
set today."). Chips stay suppressed — it's still fundamentally a
celebration, per the first decision above.

**Implementation:** `src/domain/rules/signal-trigger.js` — `reactiveSignal()`
now returns `{ label, secondary? }` instead of a bare label; the
target-exceeded check runs before the RPE check, and a high-RPE PR/PROGRESS
attaches `secondary: 'HOLD'` instead of replacing the label outright. A
plain high-RPE set with no target exceeded is unaffected (`{ label: 'HOLD' }`,
no secondary). `src/ui/log-workout.js` (`computeSignal()` resolves the
secondary label through `enforceGuardrails()` too, and composes its reason
the same way as the primary; `renderDockedCard()` renders it as a second
`.docked-card__reason` block with its own icon; the live-region announcement
includes both). `src/state/store.js` (`SignalState` gained optional
`secondaryLabel`/`secondaryReason`).

## More reps at the same weight also celebrates

**Date:** 2026-09-22 (same session)

**What changed:** PROGRESS/PR only ever compared *weight* against the
target and the all-time max — two sets at an identical weight but very
different rep counts (e.g. 40kg×8 vs. 40kg×15) were treated the same,
because volume wasn't part of the check at all. Aditya pointed out that a
real rep improvement at an existing weight is progress too and deserved the
same recognition a weight increase gets.

**Decision (Aditya, asked among three options — track an all-time max reps
per weight the same way weight is tracked, use total volume as the real
measure, or require weight-PRs to not regress on reps):** track an
all-time max reps *per weight*, the same shape as the existing all-time max
weight. If the checked set's reps beat the best rep count ever logged at
that exact weight — even when the weight itself doesn't exceed today's
target — it now triggers PROGRESS. A genuine weight increase still takes
priority when both happen at once (the wording says which one it was).
This can never produce a PR by itself: a weight only has rep history once
it's been logged before, and any weight logged before is by definition
`<=` the all-time max weight, so a rep-based trigger is always PROGRESS,
never PR.

**Implementation:** `src/domain/rules/history.js` —
`allTimeMaxRepsAtWeight(sessions, exerciseId, weightKg)`, the reps
equivalent of `allTimeMaxWorkingWeight`. `src/domain/rules/
signal-trigger.js` — `reactiveSignal()`'s context gained
`allTimeMaxRepsAtWeight`; the celebration check is now `exceedsTargetWeight
|| exceedsRepsAtThisWeight`, and the result carries a new
`celebrationBasis: 'weight' | 'reps'` so the wording layer knows which
happened. `src/reasoning/scripted.js` — `progressSetCheckedReason()` and
`composeWhySheet()`'s PROGRESS branch both branch on `celebrationBasis`,
since "past the target" isn't true for a reps-only celebration.
`src/domain/types.js` (`ReasoningInput.celebrationBasis`) and
`src/state/store.js` (`SignalState.celebrationBasis`) thread it through.

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
and Appendix A.

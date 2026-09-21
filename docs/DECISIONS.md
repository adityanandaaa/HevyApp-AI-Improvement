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
target, show a celebratory signal first — PROGRESS ("Nice progress!") or PR
("your heaviest yet on this lift") if the weight is a genuine all-time high
for that exercise — with the reason chips still shown underneath in the same
card. This keeps HANDOFF's "chips every time, up or down" rule intact (the
chips still appear, and the heading logic is unchanged) while reframing the
moment as positive rather than accusatory. Two other options were offered
and declined: dropping the chips entirely on an overshoot, and just
softening the "Why did you change the weight?" wording without adding a
signal.

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

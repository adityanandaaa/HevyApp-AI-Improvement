# AI Training Coach — Product Overview

A plain-language walkthrough of where this idea came from, what it's meant to
do, and what the prototype in this repo actually does. Full detail lives in
`docs/AI_Training_Coach_Product_Discovery_v2.md` (the discovery process),
`HANDOFF.md` (the build spec) and `docs/DECISIONS.md` (decisions made live
during the build). This file doesn't repeat the acceptance-criteria checklist
— see README.md's Appendix A for that.

---

## 1. Where the idea came from

It started as a small annoyance with Hevy: workout programmes are
increasingly written or adjusted somewhere else — a note, a coach, a
generative-AI chat — and then have to be typed into Hevy by hand. The first
idea was an importer: paste an unstructured plan, get a structured routine.

Pushing on that idea with a "five whys" showed it wasn't the real problem.
Hevy already has duplication workarounds, and a Claude conversation (or a
Claude Project plus a spreadsheet) could already do rough progression
analysis on exported data. If the obvious problem is already half-solved by
existing tools, it's not the problem worth building a product around.

The deeper friction turned out to be cognitive, not administrative:

> I have workout data, but I still have to do the thinking — understand what
> it means and decide what to do next.

And underneath that, a sharper need:

> I don't want to think about programming while I'm working out. I want to
> focus on the exercise and trust something to handle the progression
> decisions.

That reframed the product from "a data-entry shortcut" to a **training
decision layer**: something that watches what you actually do and tells you,
in the moment, whether to push, hold, or back off — while you keep the final
call.

## 2. The core loop and the philosophy

**Observe → Understand → Recommend → User decides → Execute → Learn → Adapt → Repeat**

The AI is opinionated enough to make a real recommendation, but never
absolute: it says "if you're feeling recovered, I'd consider trying 65kg
today," not "lift 65kg." The user can always accept, modify, or ignore it.
Trust is meant to build the same way it would with a human coach — through
a string of recommendations that turned out to have a reason behind them,
not through gamification or blind authority.

A hard boundary from the discovery process: **the AI can optimise the
routine, but it cannot redefine it.** It manages weight, reps, sets, and
progression *inside* the exercises the user already chose. It doesn't add,
remove, or reorder exercises, and it doesn't touch which routine is run on
a given day.

## 3. Deterministic rules vs. AI judgement

The discovery process was explicit that an LLM shouldn't be asked to do
arithmetic. The split:

- **Deterministic code calculates:** volume, reps, weight progression,
  frequency, PRs, RPE trends, rest time, session stats, historical
  comparisons.
- **AI (or, in this prototype, scripted rules standing in for AI) interprets:**
  why a trend matters, how exercises interact, how to word and explain a
  recommendation.

Sitting between those two is a set of **guardrails** — hard limits nothing
downstream can cross, no matter how the interpretation layer feels about it:

1. No push without three successful sessions on that exercise at RPE ≤8.
2. A strong result on one exercise (or earlier in the session) can never by
   itself unlock a push on another.
3. Consistently high RPE across otherwise-successful sessions blocks a push.
4. Reported pain blocks push/PR recommendations on that exercise, and on
   later exercises sharing its primary muscle groups, for the rest of the
   session.
5. Recommendations never leave the exercises already in the routine.

## 4. The five signals

The discovery process originally named six signals, including 🔄 ADAPT (a
flag that the routine itself might need rethinking, never auto-applied). It
never had a trigger in this prototype and was later cut from scope entirely
as not part of the MVP (section 6 below) — the five that remain:

| Signal | Meaning |
|---|---|
| 🔥 PUSH | Evidence supports increasing the challenge today. |
| 🟢 HOLD | Current workload is appropriate — stay here. |
| ⚠️ BACK OFF | Effort or fatigue suggests reducing the load. |
| 🎯 PR | A genuine all-time-heaviest weight was just hit on this exercise. |
| 🏆 PROGRESS | Real progress happened, even without a full PR. |

In the prototype, HOLD and BACK OFF are the default reactive signals (high
RPE, or a rep count that dropped noticeably at the same weight). PROGRESS and
PR were added as a real, general trigger during live testing (section 6
below) — exceeding today's suggested target fires PROGRESS, and exceeding
the heaviest weight ever logged for that exercise fires PR instead.

## 5. What the prototype actually does

This is a clickable, phone-sized mock of the feature living inside Hevy,
built against one person's mock data, with the reasoning layer written as
scripted rules (not a live model — that's optional milestone M8, not built).

- **Home / Workout tabs** — Hevy's own shell, enough to navigate into a
  routine. Only Push Day is live; the other routine cards are visually
  present but inert.
- **Today's Focus** — before the workout, a plain-language summary of what
  to expect today (what's expected to push, what's on hold, what's still
  building history), so the user doesn't have to read their own history.
- **Exercise-level direction line** — opening an exercise shows a short,
  contextual line about today's specific goal for it (e.g. "stable at 40kg
  for three sessions, RPE staying low — consider 42kg today").
- **Real-time signal card** — after logging a set's weight, reps and RPE,
  a card can appear with a short reason and, for HOLD/BACK_OFF/PROGRESS/PR,
  a "Why?" link to a fuller explanation (what was logged, what was
  calculated, what's recommended, and why). The card only appears when
  something meaningful changed — it doesn't comment on every single set.
- **Reason chips** — when a logged set doesn't match the suggested weight,
  one-tap reasons appear ("Too tired," "Poor sleep," "Didn't feel ready,"
  "Pain/discomfort," "Changed my mind," "Other," plus "Regular weight" for
  the specific case of skipping a push — see section 6). No free-text
  survey, ever.
- **Pain reporting** — a one-tap pain report on any exercise. It blocks
  push/PR on that exercise for the rest of the session, propagates a
  conservative tone (blocking on shared primary muscles, just a softer note
  on shared secondary muscles), and never diagnoses, explains a cause, or
  suggests treatment.
- **Session recap** — on Finish, a plain summary of what happened per
  exercise and what to do next session, generated from whatever was
  actually logged (not a fixed scripted scenario), and the session joins
  history immediately so the next Today's Focus reflects it with no extra
  action from the user.
- **Dev toolbar** — a QA affordance, not a real feature: text-size scaling,
  locale switch (en-GB / id-ID, changes number formatting), reduced motion,
  a tap-target-size overlay, and a reset button.

## 6. Decisions made live, during the build

Three moments during and after hands-on testing revised something HANDOFF
had marked "confirmed" or "do not reopen." Full detail, including the
interim version that was tried and then changed again, is in
`docs/DECISIONS.md` — summarised here:

**Celebrate exceeding the target, instead of asking why the weight
changed.** HANDOFF's original rule showed the same "why did you change the
weight?" chips regardless of whether the logged weight was above or below
target — so lifting *more* than suggested triggered the same
interrogation-style prompt as lifting less. Live feedback: it should
celebrate instead. A checked set that beats the target now shows PROGRESS
("Nice progress!") or PR ("your heaviest yet on this lift," when it's a
genuine all-time high) with no chips underneath at all — an interim version
kept the chips alongside the celebration, but that still read as an
unnecessary ask right after good news, so they were dropped outright for
this case. Every other case (below target, or at/above it without a
PROGRESS/PR result) keeps the original "chips every time" behaviour.

**A seventh chip, "Regular weight," for skipping a push specifically.** The
original six chips had no good option for "I deliberately stuck with my
usual weight" — the closest one, "Changed my mind," implies indecision
rather than a considered choice. "Regular weight" was added as a seventh
option, positioned before "Other," but only on the "why did you skip the
push?" heading — the general "why did you change the weight?" heading
(used for other weight changes) keeps the original six exactly, since the
new chip doesn't apply there.

**ADAPT removed from scope entirely.** HANDOFF section 3 confirmed six
signals, ADAPT included, but it never had a trigger in this prototype (see
section 4) and, unlike PROGRESS/PR, wasn't something live testing surfaced a
need for. It's out of the discovery doc's own MVP Core Capability (Push,
Hold, Back Off — section 36), so it was cut rather than left as a permanent
"scripted in scenarios, no scenario system exists" gap.

## 7. What this deliberately isn't (yet)

Carried over from the discovery process's own scope list, and still true of
the prototype:

- Not another workout tracker, workout generator, or general chatbot.
- Not a dashboard of fitness metrics or a gamification system.
- Not a replacement for the user's judgement — every recommendation is
  meant to be overridable.
- No live AI model — the reasoning layer is scripted rules written to the
  same interface a real model would use later (M8, explicitly optional and
  not built here).
- No scenario picker — every signal state is reachable by hand through the
  real rules and mock data; the picker itself was deferred as not required
  by any acceptance criterion. ADAPT isn't on this list because it was cut
  from scope, not deferred (section 6).
- Single-user mock data. This whole exercise is a "design for one" —
  everything is tuned to and tested against one person's own training, not
  validated for other lifters.

## 8. Open questions the discovery process flagged

The discovery document is explicit that its thresholds and beliefs are
assumptions, not settled facts, to be tested on real training before
trusting them further. The main ones still open after this prototype:

- Whether three successful sessions is really the right bar before a push
  is suggested (versus some other count or a smarter signal).
- Whether real-time, after-every-relevant-set feedback actually helps focus
  during a workout, or ends up as a distraction.
- Whether the one-tap override reasons produce useful signal over time, or
  just get tapped through without being read.
- Whether personalisation (the system learning *this* person's patterns,
  not just applying generic rules) is where the long-term value actually
  is — the discovery doc calls this its least-supported assumption.
- Whether trust, once built, actually changes how much of the progression
  decision the user is willing to hand over.

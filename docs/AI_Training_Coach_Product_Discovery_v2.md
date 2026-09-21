# AI Training Coach
## Product Discovery, Concept Development & Product Requirements

> **Core thesis:** Let the AI think about progression so the user can think about training.

> **Scope:** This is a design-for-one exercise. The user in this document is me. Everything here comes from my own experience of training and tracking, and describes what I would consider a solution to my own problem. Every assumption gets tested on my own training first. Whether it generalises to other lifters is a separate question this document does not answer.

---

# 1. Executive Summary

This product concept started from a small personal frustration while using Hevy.

From the start, I was looking for a product problem that I would probably be willing to pay to solve, if the solution were a paid feature. The initial idea was my first attempt at finding one.

Workout programmes are increasingly created or adjusted outside the workout-tracking app, including with generative AI. A user may receive a programme such as:

> Bench Press — 3 × 8  
> Incline Dumbbell Press — 3 × 10  
> Lateral Raise — 3 × 15

But the user still has to manually recreate that programme inside Hevy.

The initial product idea was therefore:

> **Why can't I give Hevy a workout plan and have it automatically become a routine?**

However, challenging that idea revealed that it was probably not the deepest problem.

Hevy already provides workarounds such as duplicating workouts. Claude can already interpret workout information. A Claude Project combined with a spreadsheet could even approximate a persistent AI training assistant.

That led to a broader product discovery process.

The deeper friction is not necessarily **creating workouts**.

It is the cognitive burden of:

- understanding training data
- deciding what to do next
- continuously managing progression
- deciding when to push or hold
- interpreting fatigue
- adapting the next session

The desired experience is:

> **The AI thinks about progression so the user can think about training.**

The user remains responsible for their body and final decision. The AI provides direction based on historical performance, current-session performance, RPE, volume, rest, exercise interactions, and optionally recovery information.

The proposed product is therefore an **AI-native training decision layer** that sits on top of workout tracking.

Its core loop is:

**Observe → Understand → Recommend → User decides → Execute → Learn → Recommend again**

---

# 2. The Original Problem

## Initial observation

Hevy works well for:

- Recording exercises
- Recording weights
- Recording reps
- Recording sets
- Repeating previous workouts
- Tracking progression
- Maintaining workout history

However, workout programming increasingly happens outside Hevy.

For example, a user may use generative AI to create or modify a programme.

The workflow becomes:

**AI / Notes / Coach**

↓

Workout programme

↓

**Manually recreate programme in Hevy**

↓

Workout

This creates friction between planning and execution.

---

# 3. Initial Product Hypothesis

The first hypothesis was:

> **I would benefit from being able to paste an unstructured workout programme into Hevy and automatically convert it into a structured routine.**

For example:

### Input

> Push Day  
> Bench Press — 3 × 8  
> Incline Dumbbell Press — 3 × 10  
> Lateral Raise — 3 × 15  
> Tricep Pushdown — 3 × 12

### Desired output

A fully configured routine containing:

- Exercises
- Sets
- Rep targets
- Potentially target weights
- Exercise ordering

This seemed useful.

But product discovery requires challenging whether this is actually the most important problem.

---

# 4. Five Whys

## Problem

> **I have to manually enter an AI-generated workout programme into Hevy.**

### Why 1 — Why do I have to manually enter it?

Because Hevy does not automatically interpret a workout programme from unstructured text and convert it into a structured routine.

### Why 2 — Why does that matter?

Because the workout information already exists.

The user is effectively translating information from one format into another.

The exercise, sets, and reps are already known.

### Why 3 — Why is that re-entry a problem?

Because it creates friction between **planning a workout and actually executing it**.

Planning can happen in:

- Claude
- Notes
- A spreadsheet
- A coach conversation
- Another application

Execution happens in Hevy.

The user has to bridge the two systems manually.

### Why 4 — Why does that friction exist?

Because workout planning and workout execution are treated as separate workflows.

The planning layer produces:

> “Do these exercises for these sets and reps.”

The tracking layer expects:

> “Configure those exercises in my system.”

There is no seamless handoff.

### Why 5 — Why is that separation important?

Because the user's actual training process is not simply:

> Plan → Configure → Workout

It is:

> **Plan → Execute → Track → Understand → Adapt → Plan again**

The deeper friction may therefore be somewhere else in this loop.

---

# 5. Discovery: Challenging the Initial Idea

The first idea was deliberately challenged.

## Challenge 1 — Is importing actually important?

Hevy already provides ways to duplicate or repeat workouts.

If I only create a programme occasionally, an importer may save me only a small amount of time.

The problem exists, but it may not be sufficiently important. Through the payment lens in Section 1, it is probably not a problem I would pay to solve.

## Challenge 2 — Can AI already solve the analysis problem?

Yes.

Workout data can be copied into Claude.

Claude can:

- Read the workout
- Compare previous sessions
- Identify progression
- Identify regression
- Identify plateaus
- Suggest future training

This raises a more uncomfortable question:

> **If Claude can already do this, why build another product?**

## Challenge 3 — Could a Claude Project already approximate the product?

Potentially.

I could create a Claude Project with instructions such as:

> Track my exercises, sets, reps and weights. Compare sessions over time. Identify meaningful progression, regression and plateaus. Recommend what I should do next.

An Excel spreadsheet could provide persistent structured history.

The resulting workflow might be:

**Hevy → Excel → Claude → Analysis → Recommendation → Hevy**

This means simply adding “AI analysis” is not enough to constitute a compelling product.

The product opportunity must solve a deeper workflow problem.

---

# 6. The Reframed Problem

The superficial problem is:

> **“I don't want to manually create workouts in Hevy.”**

The deeper problem is:

> **“I have workout data, but I still have to perform the cognitive work of understanding what it means and deciding what to do next.”**

And an even deeper user need emerged:

> **“I don't want to think about programming while I'm working out. I want to focus on the exercise, build the mind-muscle connection, and trust something to handle the progression decisions.”**

The user does not necessarily need more information.

They need **direction**.

---

# 7. The Training Loop

The training experience can be represented as:

## 1. Plan

Decide:

- Exercises
- Sets
- Reps
- Weight
- Training split
- Progression strategy

## 2. Execute

Perform the workout.

## 3. Track

Record:

- Weight
- Reps
- Sets
- RPE
- Rest

## 4. Understand

Interpret:

- Progress
- Regression
- Plateaus
- Volume
- Fatigue
- Consistency

## 5. Adapt

Decide:

- Push?
- Hold?
- Reduce?
- Change target?
- Change set count?
- Deload?

## 6. Plan again

Use the result to determine the next session.

---

# 8. The Friction Hypotheses

## Hypothesis A — Plan → Execute (dropped)

> **"I have to manually recreate my programme in Hevy."**

Challenged in Section 5. The problem is real, but Hevy has duplication workarounds and I only create a programme occasionally, so it is not important enough to build around.

---

## Hypothesis B — Track → Understand

> **“I have all this workout data, but I don't want to analyse it myself.”**

The data exists, but raw history does not necessarily tell the user:

- Whether they are progressing
- Whether they are plateauing
- Whether volume is appropriate
- Whether performance is improving efficiently

The user needs interpretation rather than more data.

---

## Hypothesis C — Understand → Decide

> **“I don't want to decide what I should do next.”**

This is closer to the actual need.

The user does not want to spend their workout thinking:

- Should I increase the weight?
- Should I attempt a PR?
- Should I stay at this weight?
- Should I add another set?
- Should I change the rep range?
- Is this exercise still working?
- Am I fatigued enough to stop pushing?

They want to train.

---

## Hypothesis D — Maintaining the Loop

> **“I don't want to manage my own training programme.”**

The user can:

- Create a programme
- Track a workout
- Review data
- Analyse performance
- Make adjustments

But they have to manually connect all of these activities.

The potential opportunity is to close the loop.

---

# 9. Core User Need

> **When I'm working out, I want to focus entirely on performing the exercise rather than planning and analysing my training, so I can trust that someone or something is taking care of my progression.**

This is not about removing user control.

It is about removing unnecessary cognitive load.

The desired experience is:

> **AI handles the thinking around progression. The user handles the training.**

---

# 10. Product Philosophy and Trust

## AI gives direction. The user makes the final call.

The AI should be:

- Opinionated enough to make useful recommendations
- Transparent enough to build trust
- Flexible enough to account for uncertainty
- Adaptive enough to respond to real-time performance

The AI should not say:

> "You must lift 65kg today."

It should say:

> **"You've been performing strongly for the last three sessions. If you're feeling recovered, I'd consider trying 65kg today."**

The user may then decide "I feel good. Let's do it," or "I'm exhausted today. I'll stay at 62.5kg." Both are valid.

## Trust

Trust should develop through repeated useful recommendations. The system should explain enough of its reasoning to answer "Why are you telling me to do this?" The full example is in Today's Focus (Section 13).

The trust loop is:

**Evidence → Recommendation → User decision → Outcome → Trust**

Over time, the user learns:

> "When this system tells me to push, it usually has a reason."

---

# 11. Final Product Concept

## AI Training Coach

An AI-native training intelligence layer that continuously observes a user's workout history and current-session performance, then provides contextual recommendations about when to:

- Push
- Hold
- Back off
- Progress
- Maintain
- Deload
- Flag that the routine may need adapting

The product does not replace the user's agency.

It provides **direction without removing control**.

**Delivery:** A feature inside an existing workout tracker, Hevy in my case. This is an independent concept and is not affiliated with Hevy.

**Revenue:** This started as a search for a problem worth paying to solve (Section 1). I would probably pay for this feature inside the app, and from my own perspective it could increase the host app's revenue. That is one person's view, so it is treated as an assumption to test (Section 38).

---

# 12. Product Boundary

A critical constraint emerged during discovery:

> **The AI can optimise the routine, but it cannot redefine the routine.**

The user creates and saves the routine in Hevy.

The routine and the workout logging stay in the host tracker.

The AI can manage progression **within the exercises already planned in that routine**.

### AI can decide/recommend:

1. Weight increases
2. Rep targets
3. Set count
4. Exercise progression
5. Deload decisions

### User controls:

- Which exercises are in the routine
- Overall routine structure
- Training goals
- Whether to accept a recommendation
- Whether to physically push, hold, or stop

Future versions could recognise mid-session exercise changes and reason about muscle-group overuse or excessive volume, but this is beyond the MVP.

---

# 13. Core Experience

The product has four primary interaction moments.

## A. Before Workout — Today's Focus

Purpose:

> **Give me motivation and direction.**

Example:

### Today's Focus

**Push Day**

🔥 **Push Bench Press**

You've completed 62.5kg × 8 for your last three sessions, with RPE staying below 8. Your pressing accessories are also progressing.

**If you're feeling recovered, I'd consider trying 65kg today.**

**Start Workout**

The user does not need to analyse their history.

The app has already done that.

---

# 14. Before Exercise — Exercise-Level Direction

Purpose:

> **Tell me what we're trying to accomplish right now.**

Example:

### Bench Press

**65kg × 6–8**

You've established 62.5kg comfortably over the last three sessions.

**Goal:** 6+ clean reps.

If the first set feels ≤8 RPE, maintain the weight for the remaining sets.

For an accessory:

### Incline Dumbbell Press

**28kg × 8–10**

Your incline has been stable at 26kg × 10 for three sessions at RPE ≤8, and your bench was strong today, so there is room to challenge your secondary press.

Start with 28kg and reassess after the first set.

The explanation is contextual, but narrower than the pre-workout message.

If set 1 lands at 28kg × 10 with RPE 9.5:

> 🟢 **Hold**
>
> That's already a high-effort set. Stay at 28kg rather than increasing further.

---

# 15. After Each Set — Real-Time Adaptation

Purpose:

> **Tell me what to do next.**

Example:

### Set 1

65kg × 8 — RPE 7.5

> 🟢 **Strong.**
>
> Keep 65kg. Aim for 8 again.

### Set 2

65kg × 8 — RPE 8.5

> 🟢 **Maintain.**
>
> Good effort. Keep the same weight.

### Set 3

65kg × 6 — RPE 9.5

> ⚠️ **Stop pushing.**
>
> You've reached high effort. No need to add another set today.

Between sets, the AI should use **short reasoning** rather than detailed context.

The three sets above show how the signal changes with effort. In use, the AI stays silent on a set unless something meaningful changes (Section 24).

---

# 16. End of Session — Recap

Purpose:

> **Help me understand what happened without requiring me to analyse it.**

Example:

> **Strong session.**
>
> **Bench:** 65kg × 8 × 3  
> New working weight established.
>
> **Incline DB:** 28kg × 10  
> Progressed, but at higher RPE.
>
> **Next session:** Keep bench at 65kg and aim to make the sets feel easier before increasing again.
>
> **Overall:** Good progression. No need to add additional volume next session.

The user leaves the gym knowing:

> **What happened. What it means. What to do next.**

---

# 17. Communication Hierarchy

The amount of information should decrease as the user gets closer to physically performing the exercise.

| Moment | Communication | Purpose |
|---|---|---|
| Before workout | Contextual | Understand overall direction |
| Before exercise | Contextual, narrower | Understand today's objective |
| Between sets | Short reasoning | Know what to do next |
| Smartwatch | Minimal | Glanceable instruction |

The principle is:

> **More distance from physical action → more context.**
>
> **Closer to physical action → less context.**

A smartwatch experience is a future direction beyond MVP.

---

# 18. Cross-Exercise Intelligence

The AI should not evaluate every exercise independently.

It should understand the relationship between exercises within the session.

Example:

**Bench Press**

↓

**Incline Dumbbell Press**

↓

**Cable Fly**

↓

**Lateral Raise**

↓

**Tricep Pushdown**

If bench performance is unusually strong:

> 🔥 **Push**
>
> Your bench performance was stronger than expected today. If your incline has also been stable for three sessions and feels good, consider pushing the load.

If bench performance is unusually demanding:

> 🟢 **Hold**
>
> Bench required more effort than usual today. Keep your incline weight conservative.

Later in the session:

> **Maintain**
>
> You've accumulated significant pressing volume. Focus on quality rather than chasing another PR on triceps.

The AI therefore understands **session-level fatigue and capacity**, rather than treating every exercise as isolated.

Session context adjusts a recommendation but never unlocks one. An accessory still needs its own history before a push. A strong compound day can raise confidence in that push, and a demanding one can turn it into a hold.

Reported pain is also cross-exercise context (see Section 30).

---

# 19. Training Capacity

The system should consider that the user has a finite amount of training capacity during a session.

The question is not simply:

> “Can the user lift more?”

It is:

> **“Given everything the user has done today, where is additional effort most valuable?”**

This allows recommendations such as:

### Strong early compound performance

> 🔥 Push, on exercises whose own history already supports it (Section 18)

### High RPE after several sets

> 🟢 Hold

### High accumulated volume

> ⚠️ Don't chase additional progression

### Significant performance decline

> ⚠️ Back off

---

# 20. Inputs to the Decision Engine

## Current Exercise

- Weight
- Reps completed
- Target reps
- Sets completed
- RPE
- Previous performance
- Performance trend
- Rest time

## Current Session

- Exercises completed
- Exercise order
- Total sets
- Total volume
- RPE trend
- Rest patterns
- Performance changes
- Compound exercise performance
- Accessory performance

## Historical Training

- Previous sessions
- Weekly volume
- Exercise frequency
- Progression rate
- Plateaus
- Personal records
- Recent performance
- Programme adherence

## Cross-Exercise Context

- Related movement patterns
- Compound exercise performance
- Accessory performance
- Muscle-group volume
- Accumulated fatigue
- Exercise order
- Primary and secondary muscles per exercise, from the host tracker's exercise tags

## Optional Recovery Context

Only when voluntarily provided or connected:

- Sleep
- Subjective recovery
- Readiness
- Confidence
- Soreness
- Other recovery indicators

Recovery data should not be mandatory.

---

# 21. Hierarchy of Evidence

The recommendation engine should broadly prioritise:

### 1. What the user actually did

- Weight
- Reps
- RPE

↓

### 2. Recent training history

- Progression
- Volume
- Frequency
- Plateaus

↓

### 3. What happened earlier in today's session

- Accumulated fatigue
- Compound performance
- Exercise interactions

↓

### 4. Optional context

- Sleep
- Recovery
- Confidence
- Soreness
- Readiness

↓

### 5. Recommendation

The AI converts the evidence into an actionable recommendation.

---

# 22. Recommendation Signals

## 🔥 PUSH

Evidence suggests the user can increase the challenge.

> You've been completing your current weight comfortably for three sessions. Consider increasing today.

## 🟢 HOLD

The current workload is appropriate.

> You're already at RPE 9. Stay at this weight and complete the planned work.

## ⚠️ BACK OFF

Current effort or fatigue suggests reducing the challenge.

> Your performance has dropped across multiple sets. I'd reduce the load today.

## 🎯 PR

A meaningful personal best is being approached or achieved.

> You've never completed 65kg × 8 before.

## 🔄 ADAPT

Recent performance suggests the routine itself may need adjusting. The AI flags this for me to decide and never changes the routine itself (Section 12).

> Your bench has been stagnant for three sessions while accessory volume continues to increase.

## 🏆 PROGRESS

Progress has occurred even without a conventional PR.

> You matched last week's weight with lower RPE.

---

# 23. Motivation Philosophy

Motivation should come from **contextual feedback**, rather than generic gamification.

Instead of:

> 🎉 500 XP!

Use:

> **One more.**
>
> You're at 7 reps. Your target is 8.

Or:

> **New PR.**
>
> You've never completed this weight for 8 reps.

Or:

> **Strong session.**
>
> You matched last week's weight with lower effort.

Or:

> **Don't chase it today.**
>
> You've already reached RPE 9. Finish the planned work.

The motivation comes from feeling that the system understands the user's actual performance.

---

# 24. The AI Should Not Interrupt Constantly

The AI should not generate commentary after every set.

The principle should be:

> **Signal → action → silence → observe → signal again**

The system should surface a recommendation when something meaningful changes:

- Push opportunity
- Unexpected fatigue
- PR opportunity
- Performance decline
- Excessive accumulated volume
- Meaningful progression
- Need to adapt

The AI should be **present without becoming the workout**.

---

# 25. Adaptive Aggressiveness

The AI should not be universally conservative.

Training requires progressive overload and sometimes requires challenging the user's current limits.

The recommendation intensity should adapt to the user's current state.

## High confidence / good recovery

If the system sees:

- Several successful recent sessions
- Stable or improving performance
- Appropriate RPE
- Reasonable weekly volume
- No obvious fatigue trend
- Good sleep, if provided
- High confidence/readiness, if provided

The AI can be more aggressive:

> 🔥 **PUSH**
>
> You've been performing strongly and recovery looks good. I'd push to 65kg today.

## Low recovery / low confidence

If the system sees:

- Poor sleep
- Low confidence/readiness
- High recent RPE
- Declining performance
- High accumulated volume
- Signs of fatigue

The AI becomes more conservative:

> 🟢 **HOLD**
>
> Your recent performance is strong, but recovery looks lower today. Keep 62.5kg and focus on quality.

The goal is not to minimise risk at all times.

The goal is to make the **best next training decision given the available evidence**.

Sometimes the correct recommendation is:

> **“Let's find out.”**

---

# 26. Trust Threshold

A baseline trust rule identified during discovery is:

> **Three successful sessions can be a starting threshold for establishing that a current load is stable.**

However, three successful sessions should not automatically trigger progression.

For example:

**Three successful sessions + RPE consistently ≤8**

may support:

> 🔥 Push

Whereas:

**Three successful sessions + consistently high RPE**

may instead signal:

> 🟢 Hold

or:

> ⚠️ Back off

Therefore:

> **Successful-session count establishes consistency; RPE and contextual signals determine whether progression is appropriate.**

Specific thresholds remain an assumption to validate.

This applies to each exercise separately. Strong performance on another exercise does not count towards the three sessions.

---

# 27. Confidence as a Signal

Confidence/readiness can be user-provided.

For example:

**Sleep:** 8/10  
**Confidence:** 4/10

The AI might respond:

> 🟢 **Controlled push**
>
> Your performance and recovery look good. Start with the heavier weight and reassess after the first set.

The AI should not interpret low confidence as inability.

Instead:

> **Low confidence = increased uncertainty around willingness/readiness to push.**

The user remains the authority on how they feel.

---

# 28. When the AI Is Wrong

The AI should learn from:

1. What happened
2. What the user chose
3. Why the user chose it

If the AI recommends:

> 🔥 Push to 65kg

and the user does:

> 65kg × 8 @ RPE 8

the system records:

**Recommendation → Accepted → Successful**

If the user stays at 62.5kg, the system should not automatically assume:

> “65kg was too heavy.”

The user may have:

- Slept badly
- Felt fatigued
- Had low confidence
- Felt sore
- Had limited time
- Simply decided not to push

---

# 29. Lightweight User Feedback

When the user does not follow a recommendation, the app can ask:

> **Why did you skip the push?**

Possible one-tap answers:

- Too tired
- Poor sleep
- Didn't feel ready
- Pain/discomfort (triggers the pain rule in Section 30)
- Changed my mind
- Other

The user should not have to complete a long survey.

The principle is:

> **The AI should learn from the user without making the user work for the AI.**

---

# 30. Pain

*This is a proposed behaviour of this concept. It is not an existing feature of Hevy or any workout tracker.*

Pain can be reported with one tap at any point in a workout, not only when I skip a recommendation.

Pain is different from tiredness or low confidence. It is a safety signal, not a preference, so it is handled separately from the other override reasons in Section 29.

## When pain is reported

1. On that exercise, the AI stops recommending pushes and PRs for the rest of the session.
2. On later exercises with the same primary muscle group, the AI applies the same block. The wording also acknowledges the pain, for example: "You reported pain on bench earlier. Keep this one conservative and stop if it returns."
3. On later exercises that only share secondary muscles, nothing is blocked. The wording is softer, for example: "You reported pain on bench earlier. This one also loads your triceps, so keep an eye on it."
4. The AI recommends holding or reducing the load on the affected exercises, and says that stopping is a valid choice.
5. The AI does not diagnose, explain the cause or suggest treatment. It is not medical advice.

## What the AI never does

- Encourage pushing through pain.
- Record pain as a failed recommendation or as a normal override.

## Scope

Pain is handled for the current session only. It is not tracked across sessions, and each session starts fresh. Exercises that work different muscle groups are not affected.

---

# 31. Personalised Learning

Over time, the system can learn how I respond to different conditions.

To show why this could matter, here are two different lifters:

### User A

When sleep is below 6 hours:

> Performance usually declines.

The system becomes more conservative.

### User B

When sleep is below 6 hours:

> Performance usually remains stable.

The system does not need to apply the same rule.

The potential long-term differentiation is therefore not:

> “We have an LLM.”

It is:

> **“The system understands how you train.”**

The system can learn:

- How quickly the user progresses
- How they respond to volume
- How RPE relates to actual performance
- How sleep affects them
- How confidence affects performance
- How often they successfully push
- When they tend to plateau
- How much fatigue they tolerate
- Which progression strategies work for them

---

# 32. Core Learning Loop

**Historical data**

↓

**AI recommendation**

↓

**User accepts / rejects**

↓

**User feedback**

↓

**Workout outcome**

↓

**System learns**

↓

**Better personalised recommendation**

↓

**More trust**

↓

**More delegation**

↓

**More data**

↓

**Better recommendations**

---

# 33. Deterministic Analytics vs AI

The product should not ask an LLM to perform every calculation.

## Deterministic software should calculate:

- Total volume
- Reps
- Weight progression
- Weekly volume
- Frequency
- PRs
- RPE averages
- RPE trends
- Rest time
- Session statistics
- Historical comparisons

## AI should interpret:

- Why a trend matters
- Whether a pattern appears meaningful
- How different exercises interact
- How to communicate the recommendation
- How to explain the recommendation
- How to adapt recommendations based on context

## Guardrails

Rules set hard limits the AI cannot cross. Inside those limits, the AI analyses the wider context and chooses the signal. The starting limits are:

1. No push without three successful sessions on that exercise at RPE ≤8.
2. Performance on another exercise or earlier in the session can never unlock a push.
3. Consistently high RPE across successful sessions blocks a push.
4. Reported pain blocks push and PR recommendations on that exercise and on later exercises sharing its primary muscle groups, for the rest of that session. Shared secondary muscles only change the wording (see Section 30).
5. Recommendations stay within the exercises already in the routine.

These thresholds are starting assumptions to test on my own training (Section 38).

Architecture:

**Workout database**

↓

**Deterministic analytics**

↓

**Training state**

↓

**Guardrails**

↓

**AI reasoning**

↓

**Recommendation**

↓

**User decision**

↓

**New workout data**

↓

**Updated training state**

---

# 34. Functional Requirements

## Workout Management

The system must:

- Display the user's saved routine.
- Display Today's Focus.
- Display target weight and rep ranges.
- Preserve existing workout tracking functionality.
- Read sets, reps, weights and RPE from the host tracker.
- Read rest time from the host tracker.
- Allow the user to override recommendations.
- Record user overrides as contextual information.

## Historical Analysis

The system must:

- Maintain exercise history.
- Compare current performance against previous sessions.
- Calculate progression.
- Identify plateaus.
- Calculate weekly volume.
- Track exercise frequency.
- Track PRs.
- Track RPE trends.
- Identify meaningful changes in performance.

## Session Analysis

The system must:

- Track exercise order.
- Track accumulated session volume.
- Track RPE across the workout.
- Consider previous exercises when making recommendations.
- Consider compound exercise performance when evaluating accessories.
- Identify increasing fatigue.
- Identify unusual performance changes.

## Recommendation Engine

The system must be able to recommend:

- Push
- Hold
- Back off
- Maintain
- Progress
- Deload
- Adapt (flag that the routine may need adjusting)

Recommendations should be based on available evidence rather than arbitrary AI generation.

Rules set guardrails that cannot be crossed. Within them, the AI analyses the wider context and chooses the signal.

## AI Explanation

Significant recommendations should provide a concise explanation.

Example:

> **🔥 Push**
>
> You've completed 62.5kg × 8 for three consecutive sessions with RPE ≤8. I'd consider 65kg today.

## Real-Time Adaptation

The system must be able to update recommendations during a workout based on:

- Completed reps
- RPE
- Current weight
- Previous sets
- Rest
- Previous exercises
- Session volume
- Performance changes

A recommendation made before the workout should not be considered permanent.

## Feedback

When a user does not follow a recommendation, the system should:

- Detect the deviation
- Offer lightweight feedback
- Record the user's reason
- Distinguish recommendation rejection from recommendation failure
- Use feedback as future decision context
- Apply the pain rule when pain is reported (Section 30)

---

# 35. Non-Functional Requirements

## Low Cognitive Load

The interface should require minimal interpretation during a workout.

The user should understand a recommendation within seconds.

## Low Interruption

The AI should only surface meaningful signals.

## Explainability

Recommendations should have an understandable reason.

## User Control

Every recommendation should be overridable.

## Consistency

The same underlying data should always respect the same guardrails. Within them, the AI's judgement and wording may vary slightly.

## Personalisation

The system should adapt to the individual user's historical responses.

## Transparency

The system should distinguish:

- Recorded facts
- Calculated metrics
- AI interpretation
- Recommendation

---

# 36. MVP Scope

The MVP should not attempt to build an entire AI personal trainer.

A focused MVP should test the central hypothesis:

> **Will I trust an AI system to provide training direction while I retain final control?**

## MVP Inputs

The core inputs are read from the host tracker. The optional ones are provided or connected by me.

- Saved workout routine
- Workout history
- Weight
- Reps
- Sets
- RPE
- Exercise order
- Weekly volume
- Rest time

Optional:

- Sleep
- Recovery
- Confidence/readiness

## MVP Core Capability

Determine whether the user should:

> **Push / Hold / Back Off**

for exercises already contained in the user's saved routine.

## MVP Experience

1. Open the host app
2. See Today's Focus
3. Start workout
4. Receive exercise-level signal
5. Log set in the host tracker
6. Enter RPE in the host tracker
7. Receive updated signal when meaningful
8. Finish workout
9. Receive concise session summary
10. Future recommendations update automatically

---

# 37. Beyond MVP

Potential future capabilities:

- Mid-session exercise changes
- Muscle-group overuse detection
- Automatic routine restructuring
- Smartwatch signals
- Wearable recovery integrations
- Sleep integrations
- More sophisticated fatigue modelling
- Automatic programme periodisation
- Exercise substitution recommendations
- Voice-based coaching
- More advanced personalisation
- Long-term training strategy

These should not be allowed to obscure the core MVP.

---

# 38. Assumptions to Validate

These are assumptions, not validated facts. They come from my own experience and thinking, and each one can be tested on my own training first.

## Hypothesis 1 — I experience cognitive friction, not just data-entry friction

**Belief**

The deeper pain is not entering workouts.

It is having to interpret workout history and decide what to do next.

**Basis**

My own experience. I don't want to think about progression during a workout.

**How I'd test it on myself**

Over my next training block, note each time I catch myself deciding weight or reps mid-set, and whether it breaks my focus.

---

## Hypothesis 2 — I may want to delegate progression decisions

**Belief**

I may be comfortable delegating:

- Weight increases
- Rep targets
- Set count
- Exercise progression
- Deload decisions

within a routine they already selected.

**Basis**

My own preference for direction over making every progression decision myself.

**How I'd test it on myself**

For one training block, follow the recommended weights and rep targets, and note how often I override and why.

---

## Hypothesis 3 — Trust requires evidence

**Belief**

I need to understand why the AI recommends pushing or holding.

**Basis**

My own wish to know why before I follow a push or hold.

**How I'd test it on myself**

Get the same recommendation with and without a one-line reason, and note which one I'm more willing to follow.

---

## Hypothesis 4 — Three successful sessions may be a useful baseline

**Belief**

Three successful sessions can establish enough consistency to consider progression.

**Basis**

My own preference.

**How I'd test it on myself**

Look back through my Hevy history and check how often three consistent sessions preceded a progression that held.

---

## Hypothesis 5 — RPE is a key real-time signal

**Belief**

RPE can distinguish:

> “I completed the reps”

from:

> “I completed the reps and still had capacity.”

**Basis**

My own view that RPE tells me whether to push or hold.

**How I'd test it on myself**

Log RPE after every set for four weeks and count how often I skip it or guess.

---

## Hypothesis 6 — Cross-exercise context improves recommendations

**Belief**

Performance on compounds should influence recommendations for later accessories.

**Basis**

My own view that a strong compound session can raise confidence in an accessory push, and a demanding one can justify holding back.

**How I'd test it on myself**

Compare my accessory results on days after a strong compound session with days after a demanding one.

---

## Hypothesis 7 — Adaptive aggressiveness is preferable to universal conservatism

**Belief**

The AI should be more aggressive when performance and recovery signals are strong and more conservative when sleep, confidence, RPE or other indicators suggest fatigue.

**Basis**

My own preference for pushing when signals are strong and holding when they are not.

**How I'd test it on myself**

Track push recommendations made on high and low readiness days, and compare outcomes and how much I trusted them.

---

## Hypothesis 8 — I want direction without losing agency

**Belief**

The ideal relationship is:

> **AI recommends. User decides.**

**Basis**

My own wish to get direction while keeping the final decision.

**How I'd test it on myself**

Note each recommendation as coaching or as control, and how often I override.

---

## Hypothesis 9 — Lightweight feedback can improve personalisation

**Belief**

A one-tap reason for ignoring a recommendation can provide valuable context without increasing cognitive load.

**Basis**

The one-tap reason interaction I proposed in Section 29.

**How I'd test it on myself**

Log a one-tap reason every time I skip a recommendation for four weeks, and check whether I keep doing it.

---

## Hypothesis 10 — Personalisation may become the long-term differentiation

**Belief**

The product's long-term value may come from understanding how an individual responds to training rather than simply using a generic LLM.

**Basis**

My own reasoning from the learning loop in Section 32. This is the least supported assumption in the document.

**How I'd test it on myself**

Over several months, compare generic rule-based recommendations against ones informed by my logged overrides and outcomes. This needs far more data than one training block.

---

## Hypothesis 11 — The feature could increase revenue for the host app

**Belief**

A feature that removes the need to decide progression is valuable enough that I would pay for it inside the app, which could increase the host app's revenue.

**Basis**

My own willingness to pay. I set out to find a problem I would probably pay to solve, and I would consider paying for this feature inside the app.

**How I'd test it on myself**

After one training block using the recommendations, decide whether I would still pay for it, and note what would make me stop.

---

# 39. Discovery Experiments

Before building the full product, I would test the concept through increasingly realistic experiments, starting on my own training. Each one also lists what I would check if this were built for many users. Those checks are not part of this exercise.

## Experiment 1 — Concierge Coach

- **On me:** Have my own workout history analysed manually, for example in a Claude Project, and get recommendations before each session.
- **Goal:** Test whether I actually want and follow the recommendations.
- **If this were for masses:** Check whether other lifters want the recommendations, by running the manual service for a handful of them.

## Experiment 2 — AI-Assisted Coach

- **On me:** Use deterministic calculations plus an LLM on my own data, inside the guardrails from Section 33.
- **Goal:** Test whether the recommendations are useful and clearly explained to me.
- **If this were for masses:** Check whether the same guardrails and wording work across different experience levels and progression rates.

## Experiment 3 — Real-Time Session Prototype

- **On me:** Get signals in my own workouts, only when something meaningful changes (Section 24).
- **Goal:** Test whether real-time guidance helps me or distracts me.
- **If this were for masses:** Check whether it distracts other users, and whether logging RPE on every set is realistic for them.

## Experiment 4 — Personalised Learning

- **On me:** Record recommendations, my decisions, my reasons for overriding and the outcomes, over several months.
- **Goal:** Test whether recommendations improve as the system learns from me.
- **If this were for masses:** Check whether personalisation beats generic rules across many users, and what happens for a new user with no history.

## Experiment 5 — Full Workflow

- **On me:** Run Routine → Today's Focus → Exercise Signal → Set Feedback → Session Recap → Next Session in my own training.
- **Goal:** Test the complete loop for me.
- **If this were for masses:** Check trust and retention over time with people who did not design the product.

---

# 40. Success Metrics

I should not only measure engagement. I should measure whether the AI is actually reducing my cognitive burden and becoming something I trust. Each metric is measured on me first.

## Trust and effort

| Metric | Measured on me | If this were for masses |
|---|---|---|
| Recommendation acceptance rate | How often I follow a recommendation | Acceptance rate across users |
| Recommendation override rate | How often I reject one | Override rate across users |
| Override reason distribution | Why I reject, from the one-tap reasons | Whether reasons differ between users, and which ones point to product problems |
| Trust | My own trust in the recommendations, noted after each training block | User-reported trust, by survey |
| Cognitive load | Rating "I had to think less about what to do during my workout" after each session | The same statement asked to users |

## Outcomes

| Metric | Measured on me | If this were for masses |
|---|---|---|
| Recommendation outcome | Whether accepted recommendations gave the expected result for me | Outcome rates across users, including any link to pain reports |
| Training adherence | Whether I follow my planned sessions | Adherence across users |
| Progression | Whether I progress meaningfully over time | Progression compared with similar lifters not using the feature |
| Retention | Whether I keep relying on it | Whether users keep using it, and whether it drives paid upgrades in the host app |
| Willingness to pay | Whether I would still pay for it after a training block (Hypothesis 11) | Whether users pay for it |

---

# 41. The Core Product Loop

The final product loop is:

**OBSERVE**

The system records what happened.

↓

**UNDERSTAND**

The system interprets historical and current-session performance.

↓

**RECOMMEND**

The system gives a contextual signal.

↓

**USER DECIDES**

The user accepts, modifies or rejects the recommendation.

↓

**EXECUTE**

The user performs the workout.

↓

**LEARN**

The system records the outcome and feedback.

↓

**ADAPT**

The system updates future recommendations.

↓

**REPEAT**

This creates a continuously learning training relationship.

---

# 42. What This Product Is Not

It is not primarily:

- Another workout tracker
- Another workout generator
- A generic AI chatbot
- A dashboard full of fitness metrics
- A gamification system
- A replacement for user agency
- A system that blindly tells me what weight to lift
- A replacement for the workout tracker it sits inside

The core proposition is:

> **Continuous training decision support.**

---

# 43. What I Learned

The most valuable discovery was not the original feature idea. It was the process of challenging it.

The original idea was about removing a small piece of data-entry friction. Challenging it forced a deeper question:

> **If existing products can already solve the obvious problem, what am I actually trying to solve?**

The answer became:

> **I don't want to spend my workout thinking about what I should do next.**

I do not want to be my own coach while I am trying to train. The product would let me delegate the thinking without delegating control: "I've been watching your training. Here's what I think. You decide."

That is the product opportunity worth testing.

---

# 44. Final Product Thesis

> **An AI training coach that continuously learns from what you actually do, gives you a clear direction for what to do next, and lets you stay focused on training rather than thinking about your programme.**

---

# 45. Final Product Interaction

### User

> “I just want to train.”

### Product

> “I've been tracking your training. Here's what I think you should do.”

### User

> “Okay. I trust you.”

### Product

> “If you're feeling good, push today.”

### User

> “Let's go.”

### Product

> “Strong set. Keep going.”

### User

> “I'm getting tired.”

### Product

> “Your RPE is already high. Hold the weight. No need to chase another PR.”

### User

> “Got it.”

The user remains the athlete.

The AI becomes the **decision-support layer**.

**The product does the thinking.  
The user does the training.**

# FSRS in Recall

Recall schedules every review with **FSRS** (Free Spaced Repetition Scheduler), through the [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) library (v5.4.2). This doc explains the algorithm, then shows where it plugs into the code.

## The algorithm

FSRS is an open-source spaced repetition scheduler. It replaces the fixed multipliers of older schedulers such as SM-2 with a memory model whose parameters were fitted to millions of real reviews.

### The memory model (DSR)

FSRS tracks three values for each card:

| Value | Meaning |
|---|---|
| **Difficulty (D)** | How hard the item is for this learner, from 1 to 10. Hard items gain stability more slowly. |
| **Stability (S)** | The number of days it takes for the chance of recall to fall from 100% to 90%. A bigger S means a slower-fading memory. |
| **Retrievability (R)** | The estimated probability of recalling the item right now, from 0 to 1. It falls as time passes since the last review. |

Retrievability decays along a power-law forgetting curve based on `t / S`, where `t` is days since the last review. By definition, `R = 0.9` when `t = S`.

### Scheduling

1. After each review, the learner's **rating** updates D and S. The update uses FSRS's trained weights (19 parameters in v5).
2. The next interval is the number of days it takes R to fall to the **desired retention**. The default is 0.9, so the card comes back when you have about a 90% chance of remembering it.
3. A higher target retention gives shorter intervals and more reviews. A lower target gives longer intervals and fewer reviews.

### Ratings

FSRS accepts four ratings:

| Rating | Value | Effect |
|---|---|---|
| Again | 1 | Forgot. Stability drops sharply and the card is relearned (a lapse). |
| Hard | 2 | Recalled with difficulty. Stability grows a little. |
| Good | 3 | Recalled normally. Stability grows. |
| Easy | 4 | Recalled effortlessly. Stability grows the most. |

A successful review made when R is low, meaning the memory was close to being forgotten, raises stability more than one made when R is still high. This is why spacing works.

### Card states

`0` New, `1` Learning, `2` Review, `3` Relearning. These are stored in the `state` column.

## How Recall uses it

All FSRS logic lives in `packages/core` as pure functions with no database or network code. Routes call into it and never pick a due date themselves. The LLM agent never decides a grade or a due date.

### Code map

| Piece | Location |
|---|---|
| Scheduler wrapper (`newCard`, `reviewCard`, `retrievability`) | [packages/core/src/fsrs/scheduler.ts](../packages/core/src/fsrs/scheduler.ts) |
| Grade + confidence → rating | [packages/core/src/fsrs/rating.ts](../packages/core/src/fsrs/rating.ts) |
| DB row ↔ FSRS card, rating → grade | [packages/core/src/fsrs/card.ts](../packages/core/src/fsrs/card.ts) |
| Topic confidence score | [packages/core/src/confidence/score.ts](../packages/core/src/confidence/score.ts) |
| Applying a review (transaction) | [apps/server/src/lib/review.ts](../apps/server/src/lib/review.ts) |
| `cards` table (FSRS state columns) | [packages/db/src/schema/cards.ts](../packages/db/src/schema/cards.ts) |

### Scheduler configuration

`scheduler.ts` builds an `fsrs` instance with these settings:

| Setting | Value | Why |
|---|---|---|
| `request_retention` | `0.9` (default) | Aim to remember 90% of cards. Passed in through `ScheduleSettings.retention`. |
| `maximum_interval` | `36500` days (default) | `ScheduleSettings.maxIntervalDays` lets the interval be capped, for example to ramp up reviews before an exam. |
| `enable_short_term` | `false` | Recall sends about one text a day, so there are no same-day relearning steps. A missed card comes back the next day at the earliest. |
| `enable_fuzz` | `false` | The same answer gives the same due date, so tests and demos are predictable. |

`reviewCard` also enforces the maximum interval itself. `ts-fsrs` keeps Hard < Good < Easy even when that pushes past the cap, so Recall clamps `due` and `scheduled_days` afterwards.

### Storage

Each row in `cards` is one thing to remember, and several question variants can share a card. The FSRS columns (`due`, `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `learning_steps`, `reps`, `lapses`, `state`, `last_review`) match the field names of the `ts-fsrs` `Card` type. That means a card returned by `reviewCard()` can be saved with a plain spread. `cardFromRow` converts the other way and turns a null `last_review` into `undefined`.

Every review also stores the `ts-fsrs` log entry in `reviews.fsrsLog`. The code comment says disputes undo reviews with it.

### Review flow

Both entry points end up in `applyReview` in [review.ts](../apps/server/src/lib/review.ts):

1. **Flashcard self-rating**: `POST /flashcards/:cardId/review`. The student presses a button. The Study screen offers *Don't know* → Again (1), *Kinda* → Good (3), and *Know it* → Easy (4).
2. **Quiz answers**: `routes/quiz.ts` passes Good (3) for a correct answer and Again (1) for a wrong one.

For each review, `applyReview` does the following in one transaction:

1. Gets the student's current time from `nowFor(clockOffsetMs)`, so demo accounts can fast-forward days.
2. Locks the topic row so two quick reviews don't score from stale cards.
3. Calls `reviewCard(cardFromRow(card), rating, now)` and writes the new card state to `cards`.
4. Inserts a `reviews` row with the grade, confidence, rating and FSRS log. For self-rated flashcards, `ratingToGrade` derives the grade and confidence from the rating.
5. Updates `topics.lastStudiedAt` and recomputes the topic's confidence.

### Grade + confidence → rating

The graded-answer path uses a mapping from the product brief. FSRS only sees the rating, never the raw answer:

| Grade | Confidence | Rating |
|---|---|---|
| wrong | any | Again |
| partial | any | Hard |
| correct | 1 (unsure) | Hard |
| correct | 2 | Good |
| correct | 3 (sure) | Easy |

This path is implemented and tested as `toRating`. The quiz route currently uses only a plain correct/wrong → Good/Again rule.

### Topic confidence from retrievability

`retrievability(card, now)` returns the card's estimated recall chance right now. It powers the dashboard. A topic's confidence score (0 to 100) is the **stability-weighted mean of its cards' retrievability**:

- Each card's weight is its stability, with a floor of 1 (`MIN_WEIGHT`).
- A card that has never been reviewed (`state === 0`) counts as 0 recall.
- Suspended cards are ignored, and a topic with no cards scores 0.

A card with high stability counts for more, so well-learned cards both score higher and fade more slowly. Scores are stored once per student-local date. When confidence is read, the days where nothing happened are backfilled (up to 365) by evaluating retrievability at the end of each of those days. Decay therefore shows up in the history without a nightly job.

## Current limitations

- **Target retention** is a slider in the Settings screen, but it only changes local UI state and is not saved. The server always uses the default 0.9.
- **The exam ramp** is not wired up. `reviewCard` supports `maxIntervalDays`, but no caller passes custom settings yet.
- **The default FSRS weights** are used. They are not tuned per student.
- **The confidence-based rating** (`toRating`) exists with tests, but the live paths do not use it yet. Grading is not built.

## Tests

`packages/core/src/fsrs/*.test.ts` cover these behaviours:

- A missed card returns at least one day later.
- Better ratings wait longer.
- The max interval is respected.
- The review log records the rating.
- Retrievability decreases over time.
- Row ↔ card conversion round-trips.
- Every rating maps back to itself through `ratingToGrade` and `toRating`.

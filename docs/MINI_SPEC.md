# MINI SPEC — product loop and frozen rules

Specs are law. This file freezes the daily study loop and scoring rules. Do not redesign them.

## Product loop

A **daily session** (`sessions.kind = daily`) is retrieval only: the user answers items. No note re-reading.

Build the queue in this order:

1. **FSRS-due reviews** — every item whose `fsrs_state.due_at <= now`, ordered by `due_at` ascending.
2. **New-item quota** — after due reviews, introduce unseen items (`fsrs_state.state = new` or no `fsrs_state` row) from the weakest high-weight taxonomy **topic** nodes.
3. **Interleave** the combined queue so no two consecutive items share the same topic `concept_id`.

New-item ranking for a topic node:

```
priority = (1 - mastery(node)) * exam_weight(node)
```

Higher priority is drawn first. Unseen nodes have mastery `0.3`. Quota size lives in `sessions.config` (integer `new_item_quota`); default `8` if omitted.

Diagnostic and simulation kinds reuse the same attempt/confidence/error-class capture. They do not use the daily mix above.

## Frozen rules

### Confidence before reveal

Confidence is an integer **1–5**, captured **before** the correct answer or explanation is shown. The UI must not reveal `correct_key`, `explanation`, or `distractor_rationales` until confidence is stored on the in-progress attempt (or held in client state that is committed with the answer). Writing an attempt without `confidence` is a bug.

### Error taxonomy

On every miss (`correct = false`), `error_class` is required and must be one of:

- `content_gap`
- `reasoning`
- `misread`
- `timing`
- `trap`
- `other`

On a hit, `error_class` is null.

### Mastery (per taxonomy node)

Let `C` be the EWMA of attempt correctness (1 or 0) on items tagged to that node, **alpha = 0.3**, most-recent last. Seed EWMA at `0.3` before the first attempt.

Let `R` be the mean FSRS retrievability of that node's items that have an `fsrs_state` row. Retrievability comes from **ts-fsrs**, not a hand-rolled formula. Items with no `fsrs_state` are omitted from `R`. If no items have state, `R = 0.3`.

```
mastery = 0.6 * C + 0.4 * R
```

Unseen node (no attempts and no fsrs state): **mastery = 0.3**.

Mastery is computed for the node the item is tagged to (`items.concept_id`). Do not silently roll up to parents in v1; parent dashboards may average child mastery later.

### New-item selection

Rank **topic-level** nodes by `(1 - mastery) * exam_weight`. Skip nodes with `exam_weight = 0` (overlay skill trees: SIRS, GAMSAT reasoning-from-data). Draw new items whose `concept_id` is the chosen topic and `verified` may be false for study (unverified items are allowed in daily practice; they must never be `verified=true` without a human or official anchor).

### Interleaving

Never two consecutive items from the same **topic** node (`items.concept_id`). If the remaining queue cannot satisfy this, swap with a later item; if still impossible (single topic left), allow the clash and log a session note in `sessions.config.interleave_exceptions`.

## Out of scope for night-sprint-01

The loop above is specified here so later sprints implement it identically. This sprint ships schema, seed, health, and tests only — not the session runner.

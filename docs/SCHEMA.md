# SCHEMA — SQLite via Drizzle

Single-user local file `data/app.db`. WAL mode. `PRAGMA foreign_keys = ON` on every connection. No auth.

IDs for taxonomy nodes are stable human-readable strings. IDs for attempts, sessions, items, passages, and external scores are UUIDs (text).

Timestamps are ISO-8601 text in UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`) unless noted.

JSON columns are SQLite TEXT storing JSON. Drizzle maps them with `{ mode: "json" }`.

## Enums (CHECK constraints)

- `exam`: `mcat` | `gamsat`
- `level`: `section` | `category` | `topic`
- `item_type`: `discrete` | `passage_question`
- `item_source`: `ai_generated` | `official_entry`
- `error_class`: `content_gap` | `reasoning` | `misread` | `timing` | `trap` | `other`
- `fsrs_card_state`: `new` | `learning` | `review` | `relearning`
- `session_kind`: `daily` | `diagnostic` | `simulation`
- `confidence`: integer 1–5

## Hierarchy mapping (three levels)

AAMC's outline is four tiers (exam section → foundational concept → content category → topic). The table only has `section | category | topic`.

- `section` = Foundational Concept (`MCAT.FC1` … `MCAT.FC10`), or `MCAT.CARS`, `MCAT.SIRS`, or GAMSAT section (`GAMSAT.S1` … `GAMSAT.S3`)
- `category` = content category (`MCAT.FC1.1A`) or skill/genre/discipline bucket
- `topic` = AAMC topic heading (`MCAT.FC1.1A.t1`) or GAMSAT topic (`GAMSAT.S3.chem.t4`)

Exam section (B/B, C/P, P/S, CARS) is **not** a row. It is folded into `exam_weight` using official AAMC/ACER section shares (each MCAT section 0.25; GAMSAT S3 double-weighted at 0.50).

## `concepts`

| column | type | notes |
| --- | --- | --- |
| id | text PK | e.g. `MCAT.FC5.5D.t2`, `GAMSAT.S3.chem.t4` |
| parent_id | text null | FK → `concepts.id`; null on section roots |
| exam | text | `mcat` \| `gamsat` |
| level | text | `section` \| `category` \| `topic` |
| name | text not null | |
| description | text not null default `''` | |
| exam_weight | real not null | 0–1 inclusive; share of that exam |

Indexes: `parent_id`, `exam`, `level`.

## `passages`

| column | type | notes |
| --- | --- | --- |
| id | text PK | UUID |
| concept_id | text not null | FK → `concepts.id` |
| title | text not null | |
| body | text not null | |
| item_count | integer not null | expected question count |

Index: `concept_id`.

## `items`

| column | type | notes |
| --- | --- | --- |
| id | text PK | UUID |
| type | text not null | `discrete` \| `passage_question` |
| passage_id | text null | FK → `passages.id`; required iff type is `passage_question` |
| concept_id | text not null | FK → `concepts.id`; must be `level=topic`; untagged rejected |
| skill_tag | text null | e.g. `SIRS1` … `SIRS4` |
| stem | text not null | |
| choices | json not null | `[{ "key": "A", "text": "..." }, ...]` |
| correct_key | text not null | must match a choice key |
| explanation | text not null | |
| distractor_rationales | json not null | `{ "B": "...", ... }` keys for incorrect choices |
| difficulty_est | real not null | 0–1 |
| source | text not null | `ai_generated` \| `official_entry` |
| verified | integer/bool | default **false**; never true without human or official anchor |
| created_at | text not null | ISO UTC |

Indexes: `concept_id`, `passage_id`, `verified`.

## `sessions`

| column | type | notes |
| --- | --- | --- |
| id | text PK | UUID |
| kind | text not null | `daily` \| `diagnostic` \| `simulation` |
| started_at | text not null | ISO UTC |
| ended_at | text null | |
| config | json not null | default `{}` |

Index: `started_at`.

## `attempts`

| column | type | notes |
| --- | --- | --- |
| id | text PK | UUID |
| item_id | text not null | FK → `items.id` |
| session_id | text not null | FK → `sessions.id` |
| answered_key | text not null | |
| correct | integer/bool not null | |
| confidence | integer not null | 1–5, captured before reveal |
| seconds | real not null | time on item, >= 0 |
| error_class | text null | required when `correct=0`; enum above |
| created_at | text not null | ISO UTC |

Indexes: `item_id`, `session_id`, `created_at`.

Application invariant (enforced in tests + seed/app code; SQLite CHECK used where expressible): miss ⇒ `error_class` not null; hit ⇒ `error_class` null.

## `fsrs_state`

One row per reviewed or queued item. Scheduler is **ts-fsrs**; these columns store its card state.

| column | type | notes |
| --- | --- | --- |
| item_id | text PK | FK → `items.id` |
| stability | real not null | |
| difficulty | real not null | |
| due_at | text not null | ISO UTC |
| last_review_at | text null | |
| reps | integer not null | >= 0 |
| lapses | integer not null | >= 0 |
| state | text not null | `new` \| `learning` \| `review` \| `relearning` |
| scheduled_days | real not null | ts-fsrs Card.scheduled_days; default 0 |
| learning_steps | integer not null | ts-fsrs Card.learning_steps; default 0 |

Index: `due_at`.

## `mastery_priors`

Written when a diagnostic session first ends. One row per taxonomy node.

| column | type | notes |
| --- | --- | --- |
| concept_id | text PK | FK → `concepts.id` |
| value | real not null | 0–1 inclusive |
| source | text not null | `diagnostic` |
| session_id | text not null | FK → `sessions.id` |
| updated_at | text not null | ISO UTC |

Sampled topic nodes store EWMA(correctness, α=0.3) from that diagnostic. Unsampled siblings inherit the parent estimate shrunk toward 0.3: `0.5 * parent + 0.5 * 0.3`. Overlay `exam_weight = 0` nodes are still written.

Index: `session_id`.

## `external_scores`

Official AAMC/ACER (or other official) scores. Human-entered. Only calibration source.

| column | type | notes |
| --- | --- | --- |
| id | text PK | UUID |
| exam | text not null | `mcat` \| `gamsat` |
| source_name | text not null | e.g. `AAMC FL2` |
| section | text not null | e.g. `C/P`, `S3` |
| score | real not null | |
| percentile | real null | 0–100 |
| taken_at | text not null | ISO date or datetime |
| notes | text null | |

Index: `taken_at`, `exam`.

## File layout

- `src/db/schema.ts` — Drizzle table definitions (includes `mastery_priors`)
- `src/db/client.ts` — better-sqlite3 + drizzle, FK pragma
- `src/db/migrate.ts` — `pnpm db:migrate`
- `src/db/reset.ts` — `pnpm db:reset` (delete db file, remigrate)
- `drizzle/` — generated SQL migrations

# Project overview — where the repo is, where to go

Read NORTH_STAR.md first. Success is SCOREBOARD.md, not this file.

## What this is

A **single-user retrieval instrument** for MCAT and GAMSAT. Studying means
answering questions with confidence before reveal and an error class on every
miss. Official AAMC/ACER papers are the only percentile truth.

Two runtimes exist on purpose. Do not merge them unless the human says so.

| Surface | What it is | Bank | Ledger |
| --- | --- | --- | --- |
| **Website player** (`docs/`, github.io) | The product. Continue in the tab. | **5,466** numbered-batch items | `localStorage` |
| **Next.js app** (`src/app`, `:3000`) | Optional local engine | Same numbered batches **plus** factory/pattern SQLite | SQLite + ts-fsrs |

Factory 4.3M items stay off Pages. They made Continue slow. `HAND_BANK = 847`
is only the multiplier for factory 5000× math, not the website size.

## Layout

```
NORTH_STAR.md     law (values, invariants, ritual)
SCOREBOARD.md     the real score
STATE.md          rewrite each session (cap 150)
BLOCKERS.md       human-resolved questions (append)
DECISIONS.md      append-only
MORNING_REPORT.md append-only session log

content/taxonomy.json     376 nodes, 290 weighted topics
content/batches/          sit-able ingest JSON (see README there)
content/peers/            upstream extracts + CONVERT_MANIFEST.json
docs/                     GitHub Pages player (index, app.js, bank.json, CSS)
site/                     copy of docs/ for a possible Actions Pages source
src/web/                  website player source (exportBank, assemble, graphs)
src/app/ + src/engine/    Next sit loop, FSRS, atlas, scoreboard, /write
src/ingest/               schema + critic gate
src/peers/                convert Open-MCAT / OpenMCAT / ReadyMCAT / gamsat-trainer
src/factory/              optional 4.3M unverified generator
src/patterns/             optional 120k past-paper-move drills
```

`pnpm web:build` writes `docs/bank.json` + `docs/app.js` and copies them to
`site/`. Recapture mode PNGs with `pnpm web:shots`.

## Sit-able bank (website)

5,466 unique items, `verified=false` everywhere.

| Origin | Items |
| --- | ---: |
| Hand `01–25` (11 and 15 unused) | 847 |
| Open-MCAT | 1,294 |
| OpenMCAT | 297 |
| ReadyMCAT | 2,348 |
| gamsat-trainer | 80 |
| Depth fill `40–41` | 600 |

**290/290** weighted topics at ≥8. Families: CARS 153, B/B 1,415, C/P 1,235,
P/S 1,663, S1 200, S2 112, S3 688. S2 is craft MCQs, not ACER essays.

Item contract: `docs/SCHEMA.md` and `docs/ITEM_STRUCTURE.md`. Four choices A–D,
explanation ≥40 words, three distractor rationales, taxonomy topic `concept_id`.

Licenses: `NOTICE.md`, `docs/CONTENT_SOURCES.md`. Personal study. Do not sell.

## What we kept vs dual-stack duplication

Kept (not mess): `docs/` and `site/` copies (Pages `/docs` vs Actions `site/`);
peer source JSON plus converted batches (reproducible ingest); Next.js beside
the static player (FSRS + factory).

Removed or fixed in the cleanup: README leading with factory bootstrap;
stale DEMO 847-only counts; leftover CSS that overwrote the sit header `.bar`;
three copies of numbered-batch listing; landscape graph using upstream 300/74
instead of converted 297/80; unused `rung` lint in pattern apply helpers.

## Directions from here (score per hour)

1. **Sit.** SCOREBOARD is empty. Pick a mode at `#/modes`, retrieve, log
   official papers. A week of commits with zero study days is a failed week.
2. **QC, don’t grow.** B-013 / B-018: peer + depth + factory are unverified.
   Highest-risk hand items are listed in `DEMO.md`. Do not set `verified=true`
   in software. Do not emit more factory volume to “feel complete.”
3. **Do not build** Anki export, fake 118–132 scores, consecutive same-topic
   teach ladders, accounts, or more Pages polish unless it raises score per
   hour this month. Log temptations in BLOCKERS.md (B-020).
4. **Human-only forks:** B-001 schema levels, B-011 S2 studio, B-015 CARS
   consecutive-passage vs interleave, B-017 Pages source (`/docs` vs Actions).
5. **Next.js** is optional. Use `FACTORY_TARGET=0 pnpm bootstrap` if you want
   the 5,466 in SQLite without millions of extra items.

The next merge that matters for sitting is the 5,466-item player onto `main`
(PR that carries `docs/bank.json`). Until then sit `docs/` locally.

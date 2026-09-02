Read NORTH_STAR.md first. It governs this repo.

# Exam morning — local MCAT & GAMSAT retrieval

One user. No cloud. Studying means answering questions. Success is measured in
SCOREBOARD.md (also at `/scoreboard`), never in features shipped.

## Sit today

```bash
pnpm install
pnpm db:migrate
pnpm bootstrap
pnpm dev
```

Open **http://localhost:3000**. Next 16 also allows `http://127.0.0.1:3000`.

`pnpm bootstrap` loads taxonomy, the hand-authored batches, the 500× factory bank
(423,500 extra items), and 12,000 past-paper pattern drills. That SQLite file is
large. Smaller caps:

```bash
FACTORY_TARGET=0 pnpm bootstrap                 # hand bank + patterns only
FACTORY_TARGET=84700 PATTERN_TARGET=2400 pnpm bootstrap   # previous 100× size
```

Pattern volume defaults to 12000 (`PATTERN_TARGET`). Do not run `pnpm demo:seed`
if you are about to study — demo attempts are not study and must not be copied
into SCOREBOARD.md. `pnpm db:reset` wipes the local database.

Official percentiles: sit AAMC/ACER papers, then add a row to `SCOREBOARD.md`.
The app syncs the study log from real daily/diagnostic attempts. It never writes
a percentile.

## Surfaces

| Route | What it is |
| --- | --- |
| `/` | Today — due/new, Up Next, unfinished sittings, start daily / diagnostic / skill / mastery check / pattern entry / ladder / structure |
| `/session/[id]` | Retrieval player (confidence before reveal; error class on every miss) and session summary |
| `/progress` | Taxonomy tree, weakest topics, calibration / pacing / trend |
| `/write` | GAMSAT S2 timed studio (self-rubric, not an official score) |
| `/scoreboard` | Official table from SCOREBOARD.md + live study log |
| `/health` | SQLite path and row counts |

## Invariants the UI must keep

- Confidence 1–5 before the key or explanation is shown.
- Every miss needs an error class before Next.
- No two consecutive same-topic items in a session (structure sittings still interleave).
- `verified=true` only with a human or official anchor.

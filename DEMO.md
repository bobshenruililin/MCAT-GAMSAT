# DEMO — 5-minute morning walk (2026-09-01)

Bank is `ai_generated` / `verified=false`. This is not official AAMC/ACER content.

**[DEMO] simulated attempts are not study.** Do not copy them into SCOREBOARD.md. `pnpm db:reset` wipes the database (demo and real).

## Before you click (once)

Charts need a 14-day history. From a clean tree:

```bash
pnpm db:reset && pnpm seed
for f in content/batches/0*.json; do pnpm ingest "$f"; done
pnpm ingest --strip-placeholders
pnpm demo:seed
pnpm dev
```

Expected `demo:seed` (logged 2026-09-01 with `DEMO_SEED_NOW=2026-09-01T18:00:00.000Z`):

```
demo:seed 14 sessions, 355 attempts over 14 days
[DEMO] simulated study — not real attempts. pnpm db:reset wipes this. Do not copy into SCOREBOARD.md.
```

Health `/health`: **315** items, **3** passages, **0** verified, **14** simulation sessions, **355** attempts.

To study for real: `pnpm db:reset && pnpm seed` then ingest (skip `demo:seed`). `demo:seed` refuses if a non-demo session already exists.

## Click-path (~5 minutes)

1. Open `/` (Today). Yellow **[DEMO]** banner. Confirm **Streak = 14**, a **Weakest attempted** node with a mastery number, **Due forecast** for seven dates (today includes overdue), **Last 7 days** with ~24–26 attempts/day.
2. Click **Progress**. Same DEMO banner. Check three charts: **Calibration** (confidence 1–5 vs accuracy, dashed = confidence/5), **Pacing** histogram plus mean-vs-budget table (95s / 102s / 120s), **14-day trend** for five weakest attempted topics. Scroll to the taxonomy tree (no longer all gray) and the weakest-first table.
3. Click **Today** → **Start Session**. Due reviews should be non-zero after demo:seed (FSRS cards). Stem must **not** contain `PLACEHOLDER`. Keys: **A–D**, **1–5** confidence, **Enter**. Miss → error class → Next.
4. Optional without demo data: skip `pnpm demo:seed`, start from an empty heatmap, run one real item as in prompt 4. Charts stay flat until attempts exist.

`/health` is the row-count page.

## Top 5 things needing human review

These are the highest-risk items from `content/QC_REPORT.md`. None were auto-quarantined; all stay `verified=false`.

1. **James–Lange after spinal transection** (`05-psyc-soc.json`, `MCAT.FC6.6C.t1`)
2. **Arsenate and net ATP of anaerobic glycolysis** (`01-fc1-proteins.json`, `MCAT.FC1.1D.t3`)
3. **Compound P as “noncompetitive”** (`08-passages.json` enzyme table)
4. **CARS “archive and the street”** (`08-passages.json`)
5. **Demographic transition stage 2** (`05-psyc-soc.json`, `MCAT.FC9.9B.t1`)

Do not set `verified=true` until you or an official source sign the item.

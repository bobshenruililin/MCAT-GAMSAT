# DEMO — 5-minute morning walk (2026-09-01)

Bank is `ai_generated` / `verified=false`. This is not official AAMC/ACER content.

**[DEMO] simulated attempts are not study.** Do not copy them into SCOREBOARD.md. `pnpm db:reset` wipes the database (demo and real).

## Before you click (once)

Charts need a 14-day history. From a clean tree:

```bash
pnpm db:reset && FACTORY_TARGET=0 pnpm bootstrap
# optional display fixture only:
pnpm demo:seed
pnpm dev
```

`pnpm bootstrap` seeds taxonomy and ingests every numbered batch (hand + peer +
depth fill → **5,466** items on a `FACTORY_TARGET=0` run). It does **not** insert
PLACEHOLDER items. Factory/pattern caps add unverified volume on top. `verified`
stays 0.

The **website product** is the static player in `docs/` (same 5,466, no SQLite).
This file is the optional Next.js walk.

To study for real on Next: `pnpm db:reset && FACTORY_TARGET=0 pnpm bootstrap` and skip `demo:seed`. Prefer the website player in `docs/` if you only need to retrieve.

`demo:seed` still writes **14** marked simulation sessions. Attempt count follows the live bank and FSRS fixture; it is not a study total. Health will show `verified = 0` and a DEMO banner on Today/Progress.

`demo:seed` refuses if a non-demo session already exists.

## Click-path (~5 minutes)

1. Open `/` (Today). If you ran demo:seed, yellow **[DEMO]** banner. Confirm coverage bars (dark = topics in bank, green = attempted). **Bank vs exam map** should show every exam family with items. Pick a **section block** (Mixed, CARS, B/B, C/P, P/S, S1, S2 MCQ, S3) then **Start Session**.
2. Click **Progress**. Same coverage bars, taxonomy tree, weakest-first table, charts if demo history exists.
3. In session: stem must **not** contain `PLACEHOLDER`. Passage panes use serif. Keys: **A–D**, **1–5** confidence, **Enter**. Miss → error class → Next.
4. Click **S2 Writing** for a timed Task A/B studio (self-rubric, local drafts, quote pack rotating by UTC date). Not an official ACER score.
5. `/health` is the row-count page.

## Top 5 things needing human review

Highest-risk items from `content/QC_REPORT.md`. None were auto-quarantined; all stay `verified=false`.

1. **James–Lange after spinal transection** (`05-psyc-soc.json`, `MCAT.FC6.6C.t1`)
2. **Arsenate and net ATP of anaerobic glycolysis** (`01-fc1-proteins.json`, `MCAT.FC1.1D.t3`)
3. **Compound P as “noncompetitive”** (`08-passages.json` enzyme table)
4. **CARS “archive and the street”** (`08-passages.json`) plus new CARS inference/weaken items in `23-cars-depth.json`
5. **Demographic transition stage 2** (`05-psyc-soc.json`, `MCAT.FC9.9B.t1`)

Do not set `verified=true` until you or an official source sign the item.

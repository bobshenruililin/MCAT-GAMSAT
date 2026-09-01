# DEMO — 5-minute morning walk (2026-09-01)

Bank is `ai_generated` / `verified=false`. This is not official AAMC/ACER content.

## Before you click (once)

From the repo root, if `data/app.db` is missing or still on PLACEHOLDERS:

```bash
pnpm db:reset && pnpm seed
for f in content/batches/0*.json; do pnpm ingest "$f"; done
pnpm ingest --strip-placeholders
pnpm dev
```

Expected ingest lines (logged 2026-09-01):

```
ingest 01-fc1-proteins.json: 40 passed, 0 failed (inserted 40, skipped 0)
ingest 02-fc1-metabolism.json: 40 passed, 0 failed (inserted 40, skipped 0)
ingest 03-fc5-chem.json: 42 passed, 0 failed (inserted 42, skipped 0)
ingest 04-fc2-fc4.json: 49 passed, 0 failed (inserted 49, skipped 0)
ingest 05-psyc-soc.json: 49 passed, 0 failed (inserted 49, skipped 0)
ingest 06-gamsat-s3a.json: 40 passed, 0 failed (inserted 40, skipped 0)
ingest 07-gamsat-s3b.json: 40 passed, 0 failed (inserted 40, skipped 0)
ingest 08-passages.json: 15 passed, 0 failed (inserted 15, skipped 0)
removed 20 PLACEHOLDER items (real bank present)
```

Health `/health` should then show **315** items, **3** passages, **0** verified.

## Click-path (~5 minutes)

1. Open `/` (Today). Confirm **New items available = 315**, due reviews 0, **Progress** link in the footer.
2. Click **Progress**. Gray dots = unseen. Expand `MCAT.CARS` then a science FC. Table under **Topics, weakest first** has Mastery / Attempts / Weight; click a header to reverse sort. Click **Today**.
3. Click **Start Session**. First cards are often CARS (highest `exam_weight`). Stem must **not** contain `PLACEHOLDER`. If it is a passage question, the left pane is the passage; the stem should be unanswerable without it.
4. Keys: **A–D** choice, **1–5** confidence (required), **Enter** submit. After a miss, pick an error class before Next. Confirm the explanation is a real paragraph and “Why the others are wrong” lists the three distractors.
5. Click **Next** once so the attempt is stored. Open **Progress** again: `MCAT.CARS` (or whichever node you hit) is no longer gray; mastery is a number. Return to Today; last-7-days should show **1 attempt** for today.

Optional: **Start Diagnostic** — long; skip if you only have five minutes. `/health` is the row-count page.

## Top 5 things needing human review

These are the highest-risk items from `content/QC_REPORT.md`. None were auto-quarantined; all stay `verified=false`.

1. **James–Lange after spinal transection** (`05-psyc-soc.json`, `MCAT.FC6.6C.t1`) — intensity drop is the textbook prediction; Cannon–Bard-flavored readings can still argue.
2. **Arsenate and net ATP of anaerobic glycolysis** (`01-fc1-proteins.json`, `MCAT.FC1.1D.t3`) — PGK bypass vs pyruvate-kinase still paying ATP is easy to mis-count.
3. **Compound P as “noncompetitive”** (`08-passages.json` enzyme table) — pure noncompetitive vs mixed inhibition with α = α′ is a nomenclature fight.
4. **CARS “archive and the street”** (`08-passages.json`) — inference/function items are judgment calls; worth a human CARS pass.
5. **Demographic transition stage 2** (`05-psyc-soc.json`, `MCAT.FC9.9B.t1`) — four-stage vs five-stage textbooks number the mortality-drop stage differently.

Also in the QC ten: looking-glass vs theory of mind, Mg 24.32 u vs IUPAC mass, stenosis Bernoulli (ideal fluid), k_cat units from Vmax/site titer, pendulum T² vs L intercept.

Do not set `verified=true` until you or an official source sign the item.

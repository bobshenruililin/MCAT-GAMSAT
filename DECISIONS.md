# DECISIONS

Append-only. Date, decision, rationale, rejected alternatives. Never edited.

## 2026-09-01 — Use ts-fsrs, not a hand-rolled scheduler
- Decision: Spaced repetition is `ts-fsrs`. No custom SM-2 or FSRS implementation.
- Rationale: NORTH_STAR forbids hand-rolled algorithms where a mature library exists and names ts-fsrs as the scheduler. A maintained library is less likely to corrupt review timing than a from-scratch port.
- Rejected: Hand-rolled SM-2; a custom FSRS port.

## 2026-09-01 — Mastery formula (cold-start default; BKT/IRT later)
- Decision: mastery = 0.6 * EWMA(correctness, alpha 0.3) + 0.4 * mean FSRS retrievability. Unseen items default to 0.3.
- Rationale: BKT and IRT need more attempts than a new bank will have. EWMA plus FSRS retrievability is defined from the first review and stays compatible with later psychometric upgrades.
- Rejected: BKT or IRT as the v1 mastery model (upgrade when attempt volume supports it).

## 2026-09-01 — Next.js + Drizzle + SQLite, local-first, no auth
- Decision: The app is Next.js, persistence is Drizzle on local SQLite, no authentication.
- Rationale: One user. NORTH_STAR non-goals forbid auth, cloud, scale, and monetization. Local SQLite keeps attempt records on disk without a hosted backend.
- Rejected: Hosted Postgres/cloud; any auth layer; a different local stack for v1.

## 2026-09-01 — Generator and critic in separate conversations
- Decision: Item generation and critic review run in separate conversations.
- Rationale: A critic in the same thread as the generator anchors on the draft it just wrote and under-rejects errors. Separate context is the check on content trust.
- Rejected: Generate-then-critique in one conversation.

## 2026-09-01 — Official AAMC/ACER results are the only score calibration
- Decision: Official AAMC and ACER scores (human-entered, ingested) are the only percentile truth. The system schedules those exams and stores their results. Internal mocks never calibrate percentiles.
- Rationale: NORTH_STAR: this system never replaces official materials; they are the only percentile truth.
- Rejected: Treating in-app or unofficial mock percentiles as calibration.

## 2026-09-01 — Three-level taxonomy mapping
- Decision: `concepts.level` stays `section | category | topic`. `section` = Foundational Concept (or CARS/SIRS/GAMSAT section). `category` = content category. `topic` = AAMC topic heading. Exam sections (B/B, C/P, P/S, CARS) are not rows; their 0.25 shares live in `exam_weight`.
- Rationale: Prompt froze the three-level enum. Narrowest mapping that still uses IDs like `MCAT.FC5.5D.t2`. Logged as B-001.
- Rejected: Adding a fourth level; duplicating FC1 under both B/B and C/P.

## 2026-09-01 — exam_weight from current AAMC PDF, equal split below FC
- Decision: B/B FC1/2/3 = 55/20/25; C/P FC4/5 = 40/60; P/S FC6–10 = 25/35/20/15/5; each MCAT section 0.25 of the exam. GAMSAT (S1+S2+2×S3)/4; S3 bio/chem/phys 40/40/20. Categories split parent weight equally; topics split parent equally.
- Rationale: Current AAMC "What's on the MCAT Exam" PDF (fetched this session) superseded the prompt's ~65% B/B FC1 example. AAMC does not publish per-topic percents. Logged as B-002 and B-004.
- Rejected: Using 2015 B/B FC1 65% / C/P mixed-FC weights; inventing unequal topic priors.

## 2026-09-01 — Overlay trees have exam_weight 0
- Decision: `MCAT.SIRS` and `GAMSAT.S3.rfd` (reasoning from data) have exam_weight 0. New-item quota uses `(1-mastery)*exam_weight` on content topics. SIRS attaches via `items.skill_tag`.
- Rationale: These skills overlay every science item; a non-zero quota would steal new items from content nodes. Logged as B-003.
- Rejected: Giving SIRS/rfd a positive share of the new-item budget in v1.

## 2026-09-01 — ts-fsrs with fuzz off; persist full card extras
- Decision: Scheduler is `fsrs({ enable_fuzz: false })`. `fsrs_state` gained `scheduled_days` and `learning_steps` so `next()` is given a real ts-fsrs Card, not a reconstructed stub.
- Rationale: NORTH_STAR forbids hand-rolled FSRS. Fuzz would make tests and a single-user log non-reproducible. Dropping learning_steps would corrupt learning/relearning steps.
- Rejected: Implementing the forgetting curve ourselves; leaving fuzz on; persisting only the original seven columns.

## 2026-09-01 — Prompt 2 assembler caps and mastery roll-up
- Decision: Daily assemble uses reviewCap=50, newCap=15, max 3 new items per topic. Parent mastery is the exam_weight-weighted mean of children. Due reviews are rows with `due_at <= now` and `state != new`.
- Rationale: Newest prompt wins on scope over MINI_SPEC v1 (default quota 8, no parent roll-up). Logged as B-005. New empty cards are not due reviews.
- Rejected: MINI_SPEC v1 no-rollup; treating `state=new` rows as due.



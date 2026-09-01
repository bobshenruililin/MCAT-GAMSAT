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

# MORNING REPORT

One appended section per session. End each section with SCORE IMPACT: one sentence tying the session's work to score gained per study hour.

## PROMPT 1 — Night sprint 1/4 foundation (2026-09-01)

Shipped:
- `/docs/MINI_SPEC.md`, `/docs/SCHEMA.md`, `/docs/CURSOR_RULES.md`
- Next.js App Router + TypeScript strict + Drizzle + better-sqlite3 + Tailwind, pnpm
- Health page at `/`: DB connected, row counts per table
- Scripts: `pnpm typecheck`, `lint`, `test`, `db:migrate`, `db:reset`, `seed`
- Schema + migration for concepts, items, passages, attempts, fsrs_state, sessions, external_scores (FKs, CHECKs, indexes)
- `content/taxonomy.json` (header: AI-emitted, verify against official outline)
- Seed loader: unique IDs, parents exist, weights present; prints counts per exam/level
- Tests: schema constraints; seed valid + malformed; committed taxonomy ≥300 nodes

Failed: nothing in the DoD chain (`db:migrate` → `seed` → `test` → `typecheck` → `lint`). Session runner not in this sprint (specified out of scope).

Node counts after seed: 376 total.
- mcat: section 12, category 38, topic 175
- gamsat: section 3, category 15, topic 133

Three riskiest things to review:
1. Taxonomy accuracy vs official AAMC outline / ACER booklet (AI-emitted).
2. exam_weight mapping (current AAMC PDF FC percents; equal split below FC; SIRS and S3 reasoning-from-data at 0).
3. Three-level `section|category|topic` vs AAMC's four-tier outline (B-001).

SCORE IMPACT: This sprint does not raise score per study hour yet; it installs the taxonomy and attempt ledger so later sessions can schedule retrieval on the right nodes instead of building the wrong tree.

## PROMPT 2 — Night sprint 2/4 engine (2026-09-01)

Shipped:
- `ts-fsrs` wrapped in `src/engine/reviewEngine.ts` (schedule, getDueItems, getRetrievability). Ratings: miss→Again; hit conf 1-2→Hard; 3-4→Good; 5→Easy. Extra `fsrs_state.scheduled_days` / `learning_steps` so the library card round-trips. No hand-rolled FSRS math.
- `src/engine/mastery.ts`: EWMA α=0.3 + mean ts-fsrs retrievability; parents rolled up by exam_weight (Prompt 2; see B-005).
- `src/engine/sessionAssembler.ts` pure: reviewCap 50, newCap 15, max 3 new/topic, interleave consecutive-topic repair.
- API: POST `/api/sessions`, GET `/api/sessions/:id/next` (no answer leak), POST `/api/attempts` (transactional FSRS update, then reveal).
- Tests: FSRS interval growth / Again→relearning; 100 random interleave assemblies; 20-item API session on fresh DB; 90-day deterministic fixture (due bounded, mastery up).

Failed: nothing. `pnpm test` 24/24, typecheck, lint green. App DB still has 0 items (content generation out of scope).

Node counts unchanged: 376 taxonomy nodes.

Three riskiest things to review:
1. Mastery roll-up vs MINI_SPEC v1 “no parent roll-up” (B-005).
2. Due reviews exclude `fsrs_state.state=new` so empty cards are not mixed into reviews.
3. Fuzz disabled on ts-fsrs for determinism.

SCORE IMPACT: The scheduler and attempt API now exist, so a later UI can run real retrieval sessions instead of rereading — score per hour still waits on items and the human studying.



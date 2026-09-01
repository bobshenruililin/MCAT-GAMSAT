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

## PROMPT 3 — Night sprint 3/4 interface + diagnostic (2026-09-01)

Shipped:
- Today at `/`: due reviews + estimated minutes (45s avg), new items available, Start Session / Start Diagnostic, last-7-days attempt counts. Health moved to `/health`.
- Quiz player `/session/[id]`: one item at a time; running timer; required confidence 1–5 before reveal; then explanation + distractor rationales; required error class on miss before Next; seconds from render to submit; passage left pane (stacked on mobile); keys A–D / 1–5 / Enter. Tailwind only.
- Session summary: accuracy, mean seconds vs 95s MCAT budget, confidence-vs-correctness table, misses by error class, per-topic. Diagnostic adds weakest 10 by mastery × exam_weight.
- Diagnostic `kind=diagnostic`: up to 3 items per weighted content category, zero-attempt categories first, hard cap 90. On completion, `mastery_priors` for every taxonomy node (sampled = EWMA-from-diagnostic; unsampled siblings inherit parent shrunk toward 0.3). Diagnostic attempts skip FSRS.
- Grade-then-persist: `POST /api/sessions/:id/grade` reveals without writing; `POST /api/attempts` commits with error_class on miss (schema CHECK).
- Seed: 20 PLACEHOLDER items when the bank is empty (`source=ai_generated`, `verified=false`).
- Tests: ItemPlayer gate (no submit without confidence; no Next after miss without error class); diagnostic prior-writing on a fixture answer set. `pnpm test` 30/30, typecheck, lint green.
- Browser: headed Chrome playthrough of Today, Start Session, a 3-item daily session to summary, a 4-item diagnostic to weakest-10 summary, and a 2-item passage session (desktop + mobile viewport).

Failed: nothing in the DoD chain. Item bank is still placeholders, not exam content.

Node counts unchanged: 376 taxonomy nodes. Items: 20 placeholders.

Three riskiest things to review:
1. Diagnostic category grain = `level=category` with `exam_weight > 0` (B-006), not FC-level sections.
2. Unsampled prior shrink is `0.5 * parent + 0.5 * 0.3` (B-007).
3. Weakest-10 ranking by mastery × weight surfaces low-weight nodes at the 0.3 prior (B-008).

SCORE IMPACT: The human can now run retrieval sessions (daily or diagnostic) instead of rereading — score per hour still waits on replacing PLACEHOLDER items with real tagged content and then actually studying.



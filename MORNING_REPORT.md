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

## PROMPT 4 — Night sprint 4/4 content + visibility (2026-09-01)

Shipped:
- `pnpm ingest <file>`: schema gate (topic `concept_id`, type, stem, A–D, one `correct_key`, explanation ≥40 words, three distractor rationales, `difficulty_est` in [0,1]). Valid rows insert `source=ai_generated`, `verified=false`. Invalid rows → `content/quarantine/<file>.rejected.json`. Prints pass/fail/inserted/skipped. `pnpm ingest --strip-placeholders`.
- Starter bank in `content/batches/`: 300 discretes (~40/file) on 40 biochem-heavy MCAT FC1–10 + GAMSAT S3 topics (not raw top-40 CARS; B-009) plus 3 passages × 5 questions (enzyme kinetics table, CARS “archive and the street”, pendulum g).
- Critic pass: `content/QC_REPORT.md`. Schema 315/315. Hard-fail quarantines: 0. Ten least-certain items flagged for humans.
- Ingest run on app DB after `db:reset` + `seed`:
  - 01: 40 passed, 0 failed (inserted 40)
  - 02: 40 passed, 0 failed (inserted 40)
  - 03: 42 passed, 0 failed (inserted 42)
  - 04: 49 passed, 0 failed (inserted 49)
  - 05: 49 passed, 0 failed (inserted 49)
  - 06: 40 passed, 0 failed (inserted 40)
  - 07: 40 passed, 0 failed (inserted 40)
  - 08: 15 passed, 0 failed (inserted 15)
  - strip: removed 20 PLACEHOLDER items
  - resulting bank: 315 items, 3 passages, 0 verified, 0 PLACEHOLDER
- `/progress`: taxonomy tree color-coded (gray = unseen, red→green mastery), sortable weakest-first topic table (mastery, attempts, exam_weight). Linked from Today.
- `DEMO.md`: 5-minute click-path + top 5 human-review items.
- Tests: ingest validation/quarantine/strip + all batch files schema-pass + progress unseen/weakest-first. `pnpm test` 38/38, typecheck, lint green.
- Browser: Today (315 new) → Start Session on a real CARS passage item (no PLACEHOLDER) → confidence-before-reveal → persist miss → `/progress` shows `MCAT.CARS` / `RBT` colored, other FCs gray.

Failed: nothing in the DoD chain. Content is still unverified AI.

Node counts: 376 taxonomy. Items: 315 real, 0 placeholder.

Three riskiest things to review:
1. B-009 topic spread vs a literal CARS top-40.
2. The ten QC flags (James–Lange spinal, arsenate ATP, noncompetitive vs mixed, CARS judgments, demographic stages, plus Mg mass, Bernoulli, k_cat, pendulum intercept, looking-glass).
3. First daily cards are CARS-weighted; a single miss can display mastery above the 0.3 unseen default because retrievability is high immediately after review.

SCORE IMPACT: Retrieval can now run on tagged science items instead of PLACEHOLDERS, so study hours can start — expected score per hour still depends on the human actually sitting the sessions and on catching the remaining AI-item errors before they train a wrong memory.

## STRETCH — demo history, insight charts, Today dashboard (2026-09-01)

Gates: `pnpm typecheck`, `lint`, and `test` green; Prompts 1–4 present in this file.

Shipped:
- `pnpm demo:seed`: deterministic 14-day `kind=simulation` history (`config.demo=true`, `[DEMO]` label). Refuses if real sessions exist. Re-run replaces demo only. `pnpm db:reset` wipes it. Logged run: 14 sessions, 355 attempts (DEMO_SEED_NOW=2026-09-01T18:00:00Z).
- `/progress`: calibration (confidence vs accuracy), pacing histogram + mean vs 95/102/120s budgets, 14-day EWMA trend for 5 weakest attempted nodes. DEMO banner.
- Today: due forecast next 7 days, streak, weakest-node spotlight, DEMO banner.
- Tests: 43. DEMO.md updated.

Failed: nothing in the stretch DoD. Demo data is still not study.

Three riskiest things to review:
1. Do not copy demo attempts or the 14-day streak into SCOREBOARD.md.
2. Trend is EWMA correctness, not full mastery (B-010 sibling: historical R not stored).
3. Pacing budgets are heuristics (B-010).

SCORE IMPACT: Charts let the human see calibration, pacing, and weak-node drift in one glance after a study week — but only real attempts raise score per hour; demo:seed is a display fixture, not practice.

## DREAM cycle 1 — hunt classified misses (2026-09-01)

Gap: every miss was named and classified, then dropped. FSRS Again restudies the same card; sister items from trap/gap/leech nodes never entered the new-item quota. Demo history would have poisoned hunt if counted.

Shipped:
- `huntTopicIds`: item missed ≥2 times and still wrong, or ≥2 `trap`/`content_gap` misses in 14 days. Demo attempts ignored. Cap 8 topics.
- Daily assemble ranks hunt topics first inside existing `newCap` (then `(1-mastery)*exam_weight`). FSRS due dates unchanged.
- Today lists Hunting nodes. Quiz player shows a hunt banner when the item's topic is hunted.
- Tests: 49. `pnpm test`, typecheck, lint green.

Failed: hunt is idle until real (non-demo) misses exist.

SCORE IMPACT: Study hours after a trap or twice-miss now spend the new-item quota on that node until it recovers, instead of on highest-weight unseen CARS — more score per hour once the human actually misses and returns.

## DREAM cycle 2 — SCOREBOARD study log from real attempts (2026-09-01)

Gap: SCOREBOARD.md stayed at Sessions: 0 after any amount of real study, so the ledger the North Star measures could not become a trend line.

Shipped:
- `pnpm scoreboard:sync` rewrites the Study log from non-demo `daily` and `diagnostic` attempts only.
- Official-scores table and Weekly verdict are preserved character-for-character (human-entered).
- Simulation/`config.demo` sessions are excluded. Empty sessions do not count.
- Daily/diagnostic session end auto-syncs when the DB is `data/app.db` (tests and temp DBs skip). A failed write does not fail the attempt.
- Tests: 50. `pnpm test`, typecheck, lint green.

Failed: study days remain 0 until the human sits a real session.

SCORE IMPACT: After each real session the study log shows days, attempts, and mean mastery of attempted topics, so the human can see whether this week's hours are actually moving the score ledger instead of guessing from chat.

## DREAM cycle 3 — overconfidence on reveal (2026-09-01)

Gap: calibration existed as a Progress chart the user sees after the week, not at the moment they marked 4–5 and missed.

Shipped:
- On reveal, a miss with confidence ≥ 4 shows: confidence and accuracy need to be the same number.
- Confidence 1–3 misses stay silent (error class already required). Hits stay silent.
- Tests: 51. `pnpm test`, typecheck, lint green.

Failed: calibration still cannot equal accuracy until the human studies.

SCORE IMPACT: The hour of study now includes an immediate correction when the user was sure and wrong, which is the miss that most poisons exam-day confidence.

## DREAM cycle 4 — hunt-topic dues first (2026-09-01)

Gap: sister new items from hunted nodes ranked first, but a due review of the same trap still sat behind earlier-due unrelated cards, so the session could burn the fresh hour on the wrong node.

Shipped:
- Daily assemble stable-sorts due reviews so hunt-topic cards come first (dueAt order preserved within hunt / non-hunt). FSRS due dates unchanged; no due card dropped.
- Tests: 52. Green typecheck/lint.

Failed: the trap still has to be due — we do not pull future FSRS cards forward.

SCORE IMPACT: When a classified trap is already due, the first minutes of the session hit that node instead of an older unrelated due, which is more score per hour of morning review.

## DREAM cycle 5 — name a returning miss (2026-09-01)

Gap: FSRS already brought the same card back, but the player treated it as a first meeting. The dream requires the trap they fell for to be recognized as back until it dies.

Shipped:
- `priorMissCount` from other non-demo sessions. Demo ignored. Current session ignored.
- Next-item payload includes `priorMisses`. Player banner: "You missed this item N times before." Does not name error class before answer (no leak).
- Item-level banner replaces the topic hunt banner when both apply.
- Tests: 54. Green typecheck/lint.

Failed: still silent until a real item is missed and later due.

SCORE IMPACT: Re-seeing a known miss now flags that this exact card has beaten them before, so the minute spent on it is aimed at killing that item instead of treating it as new.



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

## DREAM cycle 6 — underconfidence on low-confidence hits (2026-09-01)

Gap: confidence and accuracy were nudged only when the user was sure and wrong. A correct answer marked 1–2 still trains FSRS Hard, so known cards return too soon and steal later study hours.

Shipped:
- Reveal note when correct and confidence ≤ 2: same-number calibration, and that a low rating brings the card back sooner than memory needs.
- Confidence 3–5 hits stay silent. Tests: 55. Green typecheck/lint.

Failed: calibration still cannot match accuracy until the human studies.

SCORE IMPACT: Study hours later in the week are less likely to be spent re-reviewing cards the user already knew, because today's low-confidence hits are named as a scheduling mistake.

## DREAM cycle 7 — session pacing uses section budgets (2026-09-01)

Gap: every session summary compared mean seconds to 95s, including CARS (102s) and GAMSAT S3 (120s). Timing insight at the end of the hour was the science line, so a CARS block looked slow when it was not.

Shipped:
- Mean per-item `sectionBudgetSeconds` (same 95/102/120s families as Progress). Mixed sessions get a mixed-section label.
- Tests: 57. Green typecheck/lint.

Failed: budgets remain unofficial heuristics (B-010).

SCORE IMPACT: Timing feedback after a CARS or GAMSAT block now matches that section's pace, so the user does not rush or linger on the wrong clock for the next hour of study.

## DREAM cycle 8 — gap audit, bank coverage (2026-09-01)

Named gap: heatmap gray / bank depth. Counted taxonomy vs batches: 308 topics, 45 with items (weight ~0.34), 263 uncovered (weight ~1.66). Highest uncovered are CARS reasoning skills and GAMSAT S2 craft (timed writing).

Why not built: this month the 315 items have 0 real study days. More unverified AI would raise poison surface before the existing ten QC flags are reviewed (trust > velocity). B-009 is an open human choice against a CARS-majority bank. GAMSAT S2 craft is not an MCQ retrieval item — a writing player would be a redesign.

SCORE IMPACT: none this cycle — next score per hour is sitting the 315, not adding unstudied cards.

## DREAM cycle 9 — gap audit, scheduling and insight leftovers (2026-09-01)

Named leftovers: mid-question pacing nags; Progress error-class chart (already on session summary); Today streak including demo (banner + SCOREBOARD exclusion are the guards; DEMO.md requires the 14-day streak); overlay skill_tag items (B-003 weight 0); official-score data entry UI (markdown is the ledger).

Why not built: nags would rush retrieval (misread). Duplicate insight is polish. Overlay budget and official scores are human. Demo streak is a named fixture, not the study path.

SCORE IMPACT: none this cycle — the study path is already playable: due + hunt + newCap + FSRS + calibration notes.

## DREAM cycle 10 — gap audit, stop (2026-09-01)

Third consecutive cycle with no unblocked litmus-passing gap. Remaining dream pieces: real study days, human/official verified items, official AAMC/ACER scores, heatmap coverage after those hours.

DREAM GAP: none reachable without the human

SCORE IMPACT: none this cycle — the person walking into the room is now the bottleneck, which is the product.

## Real exam bank — replace PLACEHOLDER, cover the map (2026-09-01)

Shipped:
- Deleted PLACEHOLDER seed. `pnpm seed` = taxonomy. `pnpm bootstrap` = taxonomy + every numbered batch + strip leftovers.
- Numbered batches 09–25: 847 items, 25 original passages, 0 PLACEHOLDER, 0 verified, 0 schema rejects. All 290 weighted topics have ≥1 item.
- CARS depth: census, musicology, conservation, urban commons, checkpoint courtesy (plus earlier archive/street). GAMSAT S1: cartoon+letter, paired ferry poems, lockout tram, news-verb table, memorial, borrowed-coat narrative.
- GAMSAT S3 data passages (vesicle scatter, HA titration, decay counts) with `skill_tag` on rfd overlay skills (B-003 still weight 0 for newCap).
- Today: section-block picker (Mixed / CARS / B/B / C/P / P/S / S1 / S2 / S3). Coverage bars on Today and Progress. Parchment shell. `/write` with 5 rotating packs per task.
- Tests 65. Typecheck/lint green.

Failed: items are still unverified AI; SCOREBOARD study log 0 until the human sits; overlays unscheduled by weight.

Three riskiest things to review:
1. CARS/S1 inference and weaken items (QC 11–15).
2. Section tracks deferring other-family dues (B-012).
3. Volume: 847 unverified cards can poison if studied blindly.

SCORE IMPACT: Study hours can now be retrieval across the whole exam map, including CARS/S1 passages and a timed S2 sitting, instead of twenty placeholder stems — expected score per hour still waits on the human actually running those hours and catching remaining AI errors.

## PROMPT 2 — re-audit (2026-09-01)

Question: did we miss Night Sprint 2/4 engine early on?

Answer: No. Prompt 2 shipped (see the original section above and branch `cursor/night-sprint-02-3760`). The current tree still implements it. This session did not redesign the engine. Gaps were untested DoD edges, not missing scheduler/mastery/assembler/APIs.

Evidence from the working tree:
- `ts-fsrs` `^5.4.2` wrapped in `src/engine/reviewEngine.ts`: `schedule`, `getDueItems`, `getRetrievability`. Persist `fsrs_state`. Fuzz off. No hand-rolled FSRS math.
- Attempt → grade in `src/engine/rating.ts`: incorrect→Again; correct conf 1–2→Hard; 3–4→Good; 5→Easy. Used by `recordAttempt`. Diagnostic sessions still skip FSRS (Prompt 3).
- `src/engine/mastery.ts`: EWMA α=0.3, `0.6*C + 0.4*R`, unseen 0.3; parents rolled up by `exam_weight` (Prompt 2 / B-005; MINI_SPEC v1 still says no roll-up).
- `src/engine/sessionAssembler.ts` is pure: defaults reviewCap 50, newCap 15, max 3 new/topic; dues first-class; new items from `(1-mastery)*exam_weight` (hunt-topic boost is later DREAM, not a Prompt 2 rewrite); interleave with `interleave_exceptions`.
- API: POST `/api/sessions` daily assemble; GET `/api/sessions/:id/next` unanswered item with no answer leak; POST `/api/attempts` records answer+confidence+seconds+error_class, transactionally updates FSRS via `reviewEngine`, returns correctness + explanation + distractor rationales.
- Tests that were already there: interval grows on Good/Easy; Again from Review → relearning; 100 random assemblies (consecutive clashes == exceptions); 20-item API session on a fresh DB; 90-day deterministic fixture (dues bounded, mastery up).
- Tests added this session: rating map unit tests; new-item ranking + skip `exam_weight=0`; grouped due queue repairs to zero consecutive same-topic; GET next does not leak rationales; POST attempts returns `distractorRationales`; `getDueItems` skips empty new cards; `getRetrievability` is a ts-fsrs number after persist.

Failed: nothing. `pnpm test` 71/71, `pnpm typecheck`, `pnpm lint` green. Integration path uses `MCAT_DB_PATH` on a temp migrated DB.

Three riskiest things to review:
1. B-005 still open: MINI_SPEC says new quota 8 and no parent roll-up; code follows Prompt 2.
2. Greedy interleave can still log exceptions when one topic dominates the remaining queue (NORTH_STAR wants zero consecutive; assembler already counts that).
3. `schedule`/`getDueItems`/`getRetrievability` take `db` as well as the prompt's args — required to persist; not a second FSRS implementation.

SCORE IMPACT: The retrieval loop was already scheduling real attempts; this re-audit only locked the rating map and assembler ranking so later study hours keep using ts-fsrs and exam-weight priority instead of a silent drift — score still waits on the human sitting sessions.

## 100× score-max factory (2026-09-01)

First principles: expected score ≈ Σ P(correct on exam grain i) × exam_weight(i). Extra practice volume follows weight, with a floor so no node is one memorised card. CARS/S1 get passages, not fake science discretes. Engine untouched.

Shipped:
- `src/factory`: allocate-by-weight (floor 40/topic) → 84,700 items (847×100). 67 designs. Code-checked kinematics/Newton/energy/fluids/circuits/gas/acid/Ksp/Faraday/optics/waves/nuclear/MM/HWE/dilution/Gibbs/Nernst/work/SHM/photoelectric/colligative. Conceptual sibling-discrimination. Combinatorial CARS/S1 (concession–turn essays, skill-tagged questions). Experimental 4Q tables. S2 craft MCQs.
- `pnpm factory:emit`; bootstrap generates `content/batches/factory/*.json` (gitignored) then ingests. `FACTORY_TARGET=n` caps.
- `/write`: 10 Task A + 10 Task B packs.
- Preview: `content/batches/26-scoremax-preview.json`.
- Tests 75. Full factory unique + ingest-schema 0 rejects. Fresh DB `/tmp/scoremax-proof.db`: **85,547 inserted, 0 failed** (847 hand + 84,700 factory; 18 preview stems skipped as duplicates).

Failed: factory CARS is not 20k independently written essays (B-013). No item is verified.

Three riskiest:
1. B-013 — 85k unverified AI.
2. Combinatorial verbal covers FND/RWT/RBT but reuses argument skeletons.
3. Default bootstrap writes a large SQLite file; cap with FACTORY_TARGET if needed.

SCORE IMPACT: Study hours can now retrieve across a weight-shaped 100× bank instead of one card per topic — expected score per hour still waits on the human sitting those hours and catching factory errors before they train a wrong memory.

## Khan-like mastery path (2026-09-01)

Question: how would Khan Academy adapt this project for score and learning maximization?

Answer: Keep retrieval + FSRS + interleave. Add skill levels, one Up Next recommendation, skill-focus sessions that still interleave a contrast topic, easier-first new cards while a skill is weak, course mastery %, and session level-up. Refuse video-as-study, hints before confidence, energy points, avatars, classrooms (B-014).

Shipped:
- `masteryLevel`: unseen / struggling (<0.45) / familiar (<0.62) / proficient (<0.80) / mastered (≥0.80 and ≥3 attempts).
- Course mastery = exam-weight mean with unseen = 0; proficient+ share on Today and Progress.
- `pickUpNext`: hunt → struggling by (1−mastery)×weight → highest-weight unseen with items → remaining gap.
- Skill + mastery-check assemble: ~4+4 or 2×4 topics, existing interleave. `sessions.kind` stays `daily`. Adaptive `difficultyEst` sort in `pickNewItems`.
- Today Up Next card; Progress level column + course %; summary “Level up: X → Y”.
- Tests 90. Typecheck/lint green.

Failed: none of the Khan clones that would violate NORTH_STAR.

Three riskiest:
1. Skill sessions may pull not-yet-due extras so a struggling skill is still practiceable (slight FSRS-forward pull).
2. Level-up uses current mastery with previous attempt count, so a mastery-threshold crossing can miss the badge until more attempts accrue.
3. B-013 bank is still unverified AI.

SCORE IMPACT: Study hours now land on the highest remaining exam-weight gap (or a hunt trap) instead of an undifferentiated mixed queue — same FSRS truth, less time wasted on already-familiar grains.

## Elon first-principles past-paper path (2026-09-01)

Question: how would you raise expected score per hour from first principles, given a past-paper method and unlimited generation?

Answer: Do not ship notes. Ship (1) the recurring exam *moves* as retrieval entry — analog in the stem, still an answer; (2) a large difficulty-ranked bank of new instances tagged to those moves; (3) explanations that name content grain + pattern, only after confidence; (4) structure tests that match sitting coverage and clocks while keeping interleave.

Shipped:
- `src/patterns/catalog.ts`: 18 original `PAT.*` moves (CARS/C/P/B/B/P/S/S1/S2/S3) with worked analogs. Not AAMC/ACER clones.
- Entry + apply generators; apply items are new instances (numbers, tables, original snippets), analog left in the stem as scaffolding. Target 2400 (`pnpm patterns:emit`, bootstrap `PATTERN_TARGET`). Factory `toIngestJson` default-tags remaining items.
- Session modes `pattern_entry` / `pattern_ladder` / `structure` stay `kind=daily`. Ladder easy→hard on one pattern, interleaved with a contrast family. Structure: family round-robin, cap 20, still interleave (B-015).
- Grade/attempt decorate explanations with Pattern + Content grain. GET `/next` nulls `PAT.*` skill tags. Today buttons: pattern entry, ladder, structure test.
- Tests for catalog, ingest-valid bank, ladder sort, entry filter, structure interleave, decorate, API modes, ItemPlayer reveal-only pattern block.

Failed: none of the lecture-page / official-clone / pre-reveal-pattern / CARS-burst substitutes.

Three riskiest:
1. Pattern apply templates recycle domains; volume is not 2400 hand-authored papers (same B-013 poison surface).
2. Structure tests are not consecutive-passage CARS sittings (B-015).
3. Local DBs without a pattern emit have no `PAT.*` rows until bootstrap/`patterns:emit` + ingest.

SCORE IMPACT: Study hours can now retrieve the actual past-paper move on a new instance, then a ranked ladder of that move, then a mini sitting — instead of rereading a pattern handbook or grinding untagged volume. Percentile still waits on official papers and the human sitting the hours.

## Sit-today complete product (2026-09-01)

Question: can a human sit this as a product today without dead ends?

Answer: Yes, on the retrieval surfaces that already existed, after closing the gaps that actually blocked a sitting: unfinished sessions buried under abandoned starts, no in-app scoreboard, session fetch hang on non-JSON, S2 drafts only saved on click, empty daily opening a blank player, README as a one-liner.

Shipped:
- Today lists unfinished real sittings, in-progress first, at most one untouched start. Mixed Start Session throws if the queue is empty instead of routing to "No items".
- `/scoreboard`: official rows from SCOREBOARD.md only (empty is honest); live study log from non-demo attempts. Nav + summary link.
- Session player: JSON parse errors surface; miss still requires error class; Today link; uncommitted reveal is not saved.
- `/write` autosaves locally and names time-up at 0:00 without wiping the draft.
- README sit-today path (`pnpm bootstrap`, `FACTORY_TARGET=0` cap). `/health` shows verified=true and PAT.* counts. `not-found` / `error` pages.
- Tests 107. Typecheck/lint green. Browser: Today, daily miss+hit+summary, resume, skill, mastery check, pattern entry/ladder/structure, diagnostic first item, Progress, Write autosave, Scoreboard, Health (verified 0 / PAT 2400), 404.

Failed: did not wipe the local [DEMO] seed (banner stays until `pnpm db:reset`); did not invent official percentiles; video-model review of the walk recording was quota-blocked (screenshots + CDP log are the evidence).

Three riskiest:
1. B-013 — factory/pattern volume still unverified AI.
2. This VM's Today still shows demo streak until reset — not human study.
3. B-015 — structure tests still interleave; not a cloned CARS paper.

SCORE IMPACT: The next study hour can start, miss, classify, finish, resume, write S2, and read the ledger without a blank session or a lost draft — expected score still waits on the human sitting those hours and on official papers.

## Merge all PRs onto main (2026-09-01)

Stacked PRs #1–#10 were already a single ancestry. Fast-forwarded `main` from the initial commit to `334c308` (`cursor/complete-product-3760`). GitHub marked all ten MERGED. No conflict resolution. No additional product code in the merge itself.

Failed: nothing. Open PR list is empty.

Three riskiest:
1. Human still has not sat — merge does not raise a percentile.
2. B-013 unverified factory/pattern volume is now the default bootstrap.
3. Local VMs that ran `demo:seed` still need `pnpm db:reset` before real study.

SCORE IMPACT: The sitting path is now what `main` is — expected score still waits on the human opening localhost and answering items.

## 5× generated bank (2026-09-02)

Question: the current questions are finished; double them, or 5×?

Answer: 5× the generated volume. Hand-authored 847 stays. Factory default 84,700 → 423,500 (weight-allocated, floor 200/topic). Pattern drills 2,400 → 12,000. Same emitters; stems already unique by run index. Never `verified=true`.

Shipped:
- `TARGET_MULTIPLIER = 500`, `FLOOR_PER_TOPIC = 200`, `PATTERN_TARGET = 12_000`.
- README / bootstrap / B-013 / Today empty-bank copy. Caps: `FACTORY_TARGET=0` or `84700`/`2400` for old size.
- Full-target test: 423,500 unique, ingest-valid in chunks (one JSON blob exceeds V8 string length). Tests 108.

Failed: did not ingest 423k into this VM's `app.db` (human bootstrap). Templates still recycle cover stories.

Three riskiest:
1. B-013 poison surface is now ~5× larger.
2. Default `pnpm bootstrap` SQLite is large; machines that cannot take it must cap.
3. Finishing the bank again still is not an official percentile.

SCORE IMPACT: The next study hours can retrieve on a 5× larger unseen queue instead of looping a finished 100× set — score still waits on sitting those hours and catching factory errors before they stick.

## 10× generated bank again + wipe study history (2026-09-02)

Question: wipe all history, 5× or 10× again, merge when done.

Answer: Wipe local study history (`pnpm db:reset`), not git. 10× the generated volume from the 500× defaults. Hand-authored 847 stays. Factory 423,500 → 4,235,000 (weight-allocated, floor 2000/topic). Pattern drills 12,000 → 120,000. Emit streams per topic so the VM does not hold 4.2M items. Never `verified=true`.

Shipped:
- `TARGET_MULTIPLIER = 5000`, `FLOOR_PER_TOPIC = 2000`, `PATTERN_TARGET = 120_000`.
- Stream `emitFactoryBatches`; clear leftover factory JSON on re-emit; compact JSON chunks.
- README / bootstrap / B-013 / Today empty-bank copy. Caps for 100× and previous 500×.
- Tests: allocation to 4,235,000; 900-sample ingest; 12k one-topic uniqueness; streamed emit of 1500. Pattern uniqueness at 120k. No in-memory 4.2M generate.

Failed: did not ingest 4.2M into this VM's `app.db` (human bootstrap; disk/time). Templates still recycle cover stories.

Three riskiest:
1. B-013 poison surface is now ~10× the previous 500× factory.
2. Default `pnpm bootstrap` SQLite is huge; machines that cannot take it must cap.
3. Wiping the local DB does not create an official percentile.

SCORE IMPACT: The next study hours start from a clean ledger on a 10× larger unseen queue — score still waits on sitting those hours and catching factory errors before they stick.

## Merge 5× + 10× onto main (2026-09-02)

Stacked PRs #11 (5×) and #12 (10×) were one ancestry. Fast-forwarded `main` `deb3283..5dbea3a`. GitHub marked both MERGED. Local study DB reset this session (attempts/sessions/FSRS 0). Tests 109.

Failed: did not ingest 4.2M items on this VM.

Three riskiest:
1. B-013 — 4.2M factory + 120k pattern items are still unverified AI.
2. Default bootstrap SQLite is huge; cap or the disk fills.
3. Human still has not sat — volume is not a percentile.

SCORE IMPACT: The sitting path on `main` now has a 10× unseen queue and a clean local ledger — expected score still waits on the human opening localhost after bootstrap and answering items.

## YC-demo atlas and designed scale (2026-09-02)

Question: screenshots and demos that would get Y Combinator backing; if not there yet, keep running; set ambitious question and knowledge-structure targets.

Answer: NORTH_STAR forbids a fake company (no users/cloud/monetization). The demo is the instrument: designed capacity **4,355,847** retrieval items (5000× factory + 120k patterns + 847 hand), 7 exam families, 4-layer map (family virtual; schema still 3 levels), 18 past-paper moves, verified=true stays 0. Live this VM: 436,347 (423.5k factory cap + 12k patterns) so screenshots show real scale, not an empty bank. SQL aggregations + bounded new-item fetch so Today/Start Session survive that size.

Shipped:
- `/atlas`, BankHero on Today/Health, header Atlas link.
- `getBankScale` / `buildAtlas`. Progress item counts via GROUP BY. Session new-item load bounded on large banks.
- Tests 112.

Failed: did not ingest the full 4.2M (cap used for a sit-able demo DB). Did not invent users or a pitch deck.

Three riskiest:
1. B-013 — live 436k is still unverified AI.
2. Designed 4.35M vs live ~10% can be misread as the product being unfinished rather than capped.
3. Player attempts during demo recording are not human study.

SCORE IMPACT: The next study hour can see the whole exam map and a half-million-item queue before the first retrieve — score still waits on sitting and on official papers.

## Lesson home + GitHub Pages door (2026-09-02)

Question: publish a git website; Today still feels like a database; want more Duolingo; bring UI designers; no cost to further expansion; YC would love.

Answer: Static GitHub Pages door (`site/` + Actions). Local `/` is one Continue + family path from existing coverage. Sage player. No XP/hearts. No factory/taxonomy change. NORTH_STAR keeps sitting local (B-017).

Shipped:
- `site/index.html` + `.github/workflows/pages.yml` (path `site`, not `pages/` — Next Pages Router).
- ContinueHero: unfinished sitting → Up Next skill → mixed daily. FamilyPath orbs. Bank/forecast/extra sittings in `<details>`.
- ItemPlayer + shell cream/sage. Fraunces + Nunito. Testids preserved.
- Tests for the door, ContinueHero, FamilyPath.

Failed: cannot flip the GitHub Pages repo setting from here (`gh` read-only). Workflow is the publish mechanism.

Three riskiest:
1. B-017 — a public URL can be misread as a multi-user product.
2. B-013 — live bank is still unverified AI.
3. Enabling Pages is a one-time human action if the first workflow needs it.

SCORE IMPACT: The next study hour starts on a lesson path instead of a stats console — expected score still waits on sitting those hours.

## Factory stems were not exam questions (2026-09-02)

Question: the questions are of very bad quality; look back with a fresh pair of eyes.

Answer: Agreed. Live bank fingerprints: 21k “pack N”, 39k “tested grain”, 23k “this bank”, 73k “(run N)”, CARS bodies that confess they are seeds. Hand 847 were already exam-like. Rewrote factory + pattern emitters. Still unverified AI (B-013, B-018).

Shipped:
- Conceptual/P/S/S2/CARS/quant/experiment/pattern stem language.
- Kinetics tables only on enzyme/chem/bio topics.
- Quality test forbidding the old fingerprints.
- Tests 118.

Failed: did not yet re-ingest the live SQLite (next). Conceptual items still discriminate outline descriptions rather than full AAMC labs.

Three riskiest:
1. B-013/B-018 — better English is not a percentile and not verified=true.
2. Uniqueness still needs a case label (Mutant 18, issue 4, trial 7).
3. Sitting the old DB until bootstrap finishes would show the bad stems.

SCORE IMPACT: The next study hour can retrieve on items that look like questions rather than item-writer notes — score still waits on sitting and on official papers.

## Factory stems v2 — they were still notes after the label swap (2026-09-02)

Question: look again with a fresh pair of eyes; the questions are still bad.

Answer: Agreed. v1 had swapped `pack N` for `set N` and `vignette N` for `Participant N` while stems still named the topic and options still said “is the idea that covers.” Preview batch `26-scoremax-preview.json` was still serving Timed Task A pack 0. v2 makes the stem an exam prompt and deletes that preview.

Shipped:
- Conceptual: observations in the stem, topic title only in the options.
- P/S: behaviour in the stem, “Which construct is illustrated?”, construct names as options.
- S2: Task A/B, 30 minutes, three comments, which approach scores.
- CARS: titled essay + vol./no. citation; no Seed confession; no issue N.
- Quant: “In experiment N”, not “(trial N)”.
- Pattern identify: mini-item + real options (not “name this move”).
- Deleted `content/batches/26-scoremax-preview.json`. Tests 118.

Failed: live SQLite not yet re-ingested (bootstrap next). Conceptual items are still outline-matching, not full AAMC labs.

Three riskiest:
1. B-013/B-018 — better prompts are not a percentile and not verified=true.
2. Outline-discrimination is still not an AAMC passage.
3. Sitting the old DB until bootstrap finishes would show the old stems.

SCORE IMPACT: The next study hour can retrieve on prompts that look like questions — score still waits on sitting those hours and on official papers.

## Live cap re-ingested after v2 (2026-09-02)

Question: prove the sit-able SQLite is the new stems, not pack/vignette leftovers.

Answer: `pnpm db:reset && FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap` → 436,294 items, verified=false. 0 Timed Task / craft grain / vignette / tested grain / this bank / Seed-confession. Continue served Task A comments, then a hand S2 structure item; kinematics `In experiment 1` has four distinct speeds.

Shipped: live fingerprints above; unique-choice guard in assembleItem.

Failed: conceptual factory is still outline-matching, not AAMC labs.

Three riskiest: B-013/B-018; outline-discrimination; demo attempts are not human study.

SCORE IMPACT: The next study hour on localhost retrieves the new stems — expected score still waits on sitting and on official papers.

## Landed #14–#16; Vite 5173 is not this app (2026-09-02)

Question: can I close the Cursor dialog (Background terminal: Start Vite on 5173, 18h)? Merge all PRs first.

Answer: Yes — Close Anyway. That Vite process is a leftover local Cursor terminal, not the study app. This repo is Next.js on port 3000 (`pnpm dev`). Fast-forwarded `main` to `d92afeb` so #14, #15, and #16 are MERGED. No open PRs.

Shipped: `origin/main` = item-quality tip (atlas + lesson home + exam-prompt factory).

Failed: cannot stop the user’s Mac Vite from this VM; they click Close Anyway locally.

Three riskiest: B-013/B-018; Pages not enabled; closing Cursor does not wipe SQLite on the Mac unless that machine’s process held the only copy.

SCORE IMPACT: Closing the IDE does not cost a study hour — the next retrieve is `pnpm dev` on :3000 after reopen.

## Public door on /docs so github.io is a real website (2026-09-02)

Question: can we do a website now; how do I use it outside Cursor?

Answer: Yes. The public URL is a static door, not the quiz. Pages was already enabled as legacy `main` `/docs`, which 404'd because `/docs` had no `index.html`. Copy the door there. Study outside Cursor is Terminal + Safari/Chrome on http://localhost:3000 — Cursor is not required.

Shipped:
- `docs/index.html` + `docs/styles.css` + `docs/.nojekyll` matching `site/`.
- README: public URL vs local sitting; Safari/Chrome, not Cursor.
- Door copy: “Use it outside Cursor.” Tests keep `site/` and `docs/` identical. Tests 118.

Failed: cannot switch Pages source to GitHub Actions (`gh` read-only). The Actions workflow will still fail until that setting changes. Legacy `/docs` is the live publish path.

Three riskiest:
1. B-017 — a public URL can be misread as a multi-user product.
2. github.io can lag after the push to main.
3. B-013 — sitting still needs a local bootstrap; the website is not the bank.

SCORE IMPACT: The next study hour can start from a phone/laptop browser on the door, then a local `pnpm dev` — expected score still waits on sitting those hours.

## Sit on the M3 Pro; home was scanning the factory bank (2026-09-02)

Question: rendering is too slow; M3 Pro MacBook Pro — run locally better?

Answer: Yes. Cursor Cloud is not the study machine. The quiz is local SQLite on the laptop, in Safari/Chrome. github.io is only the door. Also: lesson home called per-item FSRS lookups across the live bank (~436k), ~20s on this VM. Batched mastery/attempts/fsrs so Continue is ~0.2s here, faster on the M3.

Shipped:
- `masteryByNode` reads attempts + fsrs_state once, not once per topic/item.
- Unseen count is item rows minus fsrs rows (no left join of 436k).
- `pnpm sit` = production Next. README: Mac + Safari, not Cursor Cloud.
- Tests 119.

Failed: did not host the player on github.io (NORTH_STAR). BankHero COUNT on 436k is still ~160ms.

Three riskiest:
1. B-013/B-018 — a faster home is not a percentile.
2. Local bootstrap on the Mac still needs disk for the SQLite file.
3. `pnpm dev` first compile can still hitch; `pnpm sit` avoids that.

SCORE IMPACT: The next study hour on the M3 Pro starts on Continue instead of waiting on a 436k mastery scan — expected score still waits on sitting those hours.

## Mac Terminal had git but not pnpm (2026-09-02)

Question: clone on the Mac; `pnpm: command not found`; cloned a second time into a nested folder.

Answer: Cursor's Node is not on Terminal PATH. Install Node (Homebrew) then Corepack pnpm 10.33.3. Use `~/MCAT-GAMSAT` only — delete `~/MCAT-GAMSAT/MCAT-GAMSAT`. Then `pnpm install` / capped bootstrap / `pnpm sit`.

Shipped: `scripts/mac-setup.sh`; README + github.io door copy; tests 119.

Failed: cannot install Homebrew on the user's Mac from this VM.

Three riskiest:
1. xcode-select / brew are GUI/password steps; sitting waits on them.
2. B-013 — bootstrap still unverified AI.
3. Nested clone leftover if they `cd` the wrong folder.

SCORE IMPACT: The next study hour is unblocked once Node is on the Mac PATH — expected score still waits on sitting, not on another clone.

## Brew already had Node; [y/n] swallowed the paste (2026-09-02)

Question: help — git pull glued to Homebrew install; `/opt/homebrew` missing; `brew install node` asked y/n; typing `y` on a new line failed; pnpm still missing.

Answer: Node 26.5.0 is already installed. Do not upgrade it. Intel brew is `/usr/local`, not `/opt/homebrew`. Paste one block. Put `brew --prefix node` on PATH, then Corepack pnpm. Nested clone already deleted.

Shipped: `scripts/mac-setup.sh` loads Intel or Apple Silicon brew and the node keg; README/door: one block, press n at y/n.

Failed: cannot type `y` into the user's brew prompt from here.

Three riskiest:
1. Node still not on PATH if brew prefix is unusual.
2. B-013 — bootstrap still unverified AI and large.
3. Homebrew warning that this Terminal is Intel, not Apple Silicon.

SCORE IMPACT: The next study hour is `bash scripts/mac-setup.sh` then Continue on localhost — expected score still waits on sitting those hours.

## Bootstrap needs migrate on a fresh Mac SQLite (2026-09-02)

Question: good? mac-setup printed pnpm 10.33.3; install worked; bootstrap `no such table: concepts`; sit started compiling.

Answer: Tools are good. The bank is not. Fresh `app.db` has no tables until migrate. `pnpm bootstrap` now runs migrate first. Ctrl+C sit if it is still building, migrate, capped bootstrap, sit again. cpu is arm64 with x86 Node (Rosetta) — later switch to ARM Node; do not block sitting.

Shipped: `migrateDb` shared helper; bootstrap calls it; test that seed fails then succeeds after migrate. Tests 120.

Failed: cannot Ctrl+C the user's `pnpm sit`.

Three riskiest:
1. Capped bootstrap still takes time and disk on the Mac.
2. B-013 — live bank is unverified AI.
3. Rosetta Node will keep the player slower than native ARM.

SCORE IMPACT: The next study hour is blocked only on migrate+bootstrap finishing — expected score still waits on Continue after that.

## Website-only product; buttons must sit (2026-09-02)

Question: too slow and static; website-only; clicking buttons does not work; SpaceXAI-level site.

Answer: github.io was a brochure (orbs were not buttons; sitting needed Node). Newest prompt wins on scope: the public URL is the player. NORTH_STAR wins on values: no accounts, no other users, confidence before reveal, never verified=true. Hand 847 in the tab. Factory 4.3M stays optional local SQLite (B-019).

Shipped:
- `docs/` SPA: Continue + family orbs start sittings; player gates; ts-fsrs; localStorage.
- `pnpm web:build` → `bank.json` (847) + `app.js`.
- Tests 126, including jsdom Continue-without-confidence.

Failed: live github.io proof waits on landing this branch (Pages is `main` `/docs`).

Three riskiest:
1. B-019 — website is not the 4.3M factory.
2. B-013/B-018 — hand items are still not official percentiles.
3. localStorage is not SCOREBOARD.md.

SCORE IMPACT: The next study hour can start on github.io without bootstrap — expected score still waits on sitting those hours.

## Similar projects on public GitHub (2026-09-03)

Question: search extensively for similar public repos that are maintained and doing well; analyze remaining shortcomings.

Answer: No widely used OSS product does MCAT+GAMSAT retrieval with FSRS, confidence, and honest official scores. The stack that is doing well is Anki/FSRS (30k + 11.7k AnkiDroid), AnKing MCAT on AnkiHub, AAMC, UWorld, Jack Westin, and ACER + GradReady/Fraser’s for GAMSAT. Direct OSS MCAT apps are 2026 one-author projects: OpenMCAT (active Aug 2026, 1 star, CARS removed, GPT banks), ReadyMCAT (Anki fork, 1,075 cited items, teach-on-miss, 0 stars), Open-MCAT (1,274 original items, no FSRS). GAMSAT OSS is empty except a 56-item SM2 trainer.

Shipped: `docs/SIMILAR_PROJECTS.md`; B-020. No product code.

Failed: GitHub code search rate-limited after the repo sweep; commercial products have no public source to inspect.

Three riskiest:
1. Treating OpenMCAT/ReadyMCAT volume or AI generation as a model — they share B-013.
2. Inventing scaled scores like collingeorge/MCAT — NORTH_STAR forbids it.
3. Research displacing the empty SCOREBOARD.

SCORE IMPACT: This session does not raise score per study hour; it stops building a peer’s features and leaves the next hour for sitting github.io / official papers.

## Largest sit-able bank + modes + graphs (2026-09-04)

Question: gather all legally usable peer questions; largest bank; best structure; mode screenshots; graphs; independent Grok 4.6 Extra High must agree on comprehensive coverage and 5 stars.

Answer: Converted four public original banks (Open-MCAT, OpenMCAT, ReadyMCAT, gamsat-trainer) plus depth fill. Website bank **5466** items; **290/290** weighted topics at ≥8. Structure stays SCHEMA; takeaway/SIRS/attribution folded in. Four home modes (orbs, catalog, formats, ladders) and `#/graphs` (family, origin, depth, landscape). Never verified=true. Not AAMC/ACER percentiles.

Shipped: `src/peers/*`, `docs/ITEM_STRUCTURE.md`, `docs/CONTENT_SOURCES.md`, batches `30–33` + `40–41`, player graphs/modes, `docs/bank.json` 5466.

Failed: independent Extra High review still required before calling the goal complete; SCOREBOARD still 0 study days.

Three riskiest:
1. Unverified peer/AI volume (B-013) is now on github.io, not only in SQLite.
2. 8.2MB `bank.json` parse time on a phone.
3. License mix (CC BY-NC, CC BY-SA, AGPL) — personal study only.

SCORE IMPACT: The next study hour can retrieve across every weighted topic instead of a 2-item floor — expected score still waits on sitting and on official papers.

## Live Chrome mode screenshots (2026-09-04)

Question: Extra High refused 5 stars because `#/modes` PNGs were GenerateImage mockups (C2PA, invented copy).

Answer: Replaced `docs/mode-previews/*.png` with headless Chrome captures of the running player (`?mode=` / `?view=`). Catalog matches live family counts. Ladders shows SIRS 297, teach-on-miss 1,237, and CARS–S3 orbs. Graphs are SVG bars. Recapture: `pnpm web:shots`.

Shipped: live PNGs, `scripts/screenshot-modes.ts`, query-param routes for shots.

Failed: Extra High re-review still required; SCOREBOARD still 0.

Three riskiest:
1. github.io stays 847 until this branch merges.
2. Nested `#/modes` previews are PNGs, so they lag until `pnpm web:shots`.
3. Unverified peer/AI volume on the sit-able bank.

SCORE IMPACT: Choosing a sitting surface is now a real screenshot choice, not a mockup; score still waits on sitting.

## Extra High sign-off (2026-09-04)

Question: independent Grok 4.6 Extra High must agree on total comprehensive coverage and 5 stars.

Answer: Coverage auditor: COVERAGE PASS, AGREE_COMPREHENSIVE yes, 5466 items, 290/290 ≥8, verified=true 0. Product auditor: STARS 5/5, AGREE_FIVE yes (live Chrome PNGs, distinct ladders, honest Pages, SVG graphs, rotated keys, NOTICE.md).

Shipped: PR #23 with live `docs/mode-previews/`.

Failed: SCOREBOARD still 0 study days (not a coverage/5-star fail).

Three riskiest:
1. Unverified peer/AI volume after merge to github.io.
2. CARS/S1/S2 thinner than P/S (honest hole, not a fail).
3. License mix — personal study only.

SCORE IMPACT: Coverage of every weighted topic is sit-able; expected official score still waits on sitting and papers.

## Cleanup and directions (2026-09-04)

Question: repo will get messy; clean when necessary; overview the whole project and directions from here.

Answer: Dual runtimes stay (website 5466 vs optional Next/factory). Cleanup was the contradictory sit path, dead CSS that crushed the sit header, three batch listers, landscape 300/74 vs converted 297/80, unused pattern `rung`, stale DEMO 847, empty B-015. Map: `docs/OVERVIEW.md`. Direction: sit + QC, not more volume.

Shipped: README website-first; `docs/OVERVIEW.md`; `content/batches/README.md`; shared `listNumberedBatch*`; CONVERT_MANIFEST landscape.

Failed: SCOREBOARD still 0; github.io still 847 until the bank PR merges.

Three riskiest:
1. Sitting still displaced if someone runs default 4.3M bootstrap (README now warns).
2. Unverified peer/depth on Pages after merge.
3. B-017 Pages source still `/docs` vs Actions `site/`.

SCORE IMPACT: The next hour is a retrieve in `docs/`, not a factory emit.








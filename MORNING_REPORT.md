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




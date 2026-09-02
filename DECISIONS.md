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

## 2026-09-01 — Grade-then-persist so reveal can precede error_class
- Decision: `POST /api/sessions/:id/grade` returns correctness + explanation without writing. The client must send confidence 1–5 to grade (reveal). `POST /api/attempts` persists on Next, with `error_class` required on a miss. Hits and misses both persist on Next.
- Rationale: NORTH_STAR requires confidence before reveal; the SQLite CHECK requires `error_class` on the same INSERT as a miss. Reveal-before-error-class in the UI cannot use a single attempt write. Client-held confidence until commit matches MINI_SPEC.
- Rejected: Persisting a miss with placeholder `error_class=other`; splitting attempts into two tables; revealing from GET `/next`.

## 2026-09-01 — Diagnostic samples weighted content categories, cap 90
- Decision: Diagnostic queues up to 3 items per `level=category` node with `exam_weight > 0`, zero-attempt categories first, hard cap 90, then interleave. Logged as B-006.
- Rationale: Newest prompt wins on scope. Narrowest reading of “MCAT foundational-concept category” and “GAMSAT section category” that matches the three-level schema.
- Rejected: Sampling at FC/`section` grain; including overlay weight-0 categories.

## 2026-09-01 — Diagnostic priors: EWMA sampled, 0.5/0.5 shrink unsampled
- Decision: On first diagnostic end, write `mastery_priors` for every concept. Sampled topics store EWMA(correctness, α=0.3) from that session. Unsampled siblings get `0.5 * parentEst + 0.5 * 0.3`. Unseen live mastery uses the prior when the node has no attempts and no FSRS state. Logged as B-007.
- Rationale: Prompt required priors on every node and shrink toward 0.3. Equal mix is the narrowest shrink.
- Rejected: Leaving unsampled nodes at 0.3 with no parent inheritance; using 0.6C+0.4R as the stored sampled prior.

## 2026-09-01 — Diagnostic attempts do not update FSRS
- Decision: `recordAttempt` skips `ts-fsrs` when `sessions.kind = diagnostic`. Daily sessions still schedule.
- Rationale: Diagnostic is placement, not review. Scheduling ~90 cards from a placement dump would pollute the due queue. Attempts are still stored for EWMA/priors and the summary.
- Rejected: Running FSRS on diagnostic items the same as daily reviews.

## 2026-09-01 — Health moves to /health; Today is /
- Decision: `/` is the Today dashboard. The row-count health page lives at `/health`.
- Rationale: Prompt 3 assigned `/` to Today. Narrowest move of the existing health view.
- Rejected: Keeping health at `/`; deleting health.

## 2026-09-01 — Starter bank: biochem-heavy 40, not raw top-40
- Decision: Cover 40 topics as a spread across MCAT FC1–10 (FC1-heavy) plus GAMSAT S3 data-in-stem, not the literal highest-weight 40 topics. Passages add CARS + extra FC1/S3 questions. Logged as B-009.
- Rationale: Raw top-40 by `exam_weight` is almost all CARS. Prompt also required FC1–10 coverage and biochem weighting. Newest prompt on scope: both constraints; the spread is the only way to satisfy both.
- Rejected: A CARS-only top-40 bank; equal items on all 308 topics.

## 2026-09-01 — Ingest skip-duplicates; strip all PLACEHOLDERs once a real bank exists
- Decision: Duplicate `concept_id`+`stem` skips insert. `--strip-placeholders` deletes every PLACEHOLDER stem after any real item exists, not only placeholders whose topic now has a real item.
- Rationale: Prompt required covered-node stripping. Leftover CARS placeholders would rank first in the new-item queue by exam_weight and displace real retrieval (NORTH_STAR: do not study fakes). Skip-duplicates keeps re-ingest idempotent.
- Rejected: Leaving uncovered CARS PLACEHOLDERs in the bank; upsert-by-id (items have generated UUIDs).

## 2026-09-01 — Critic: no auto-quarantine; ten human flags
- Decision: Hostile re-read of all eight batch files; 0 items moved to quarantine. Residual uncertainty listed in `content/QC_REPORT.md` for human review. Items remain `verified=false`.
- Rationale: Hard-fail rubric is wrong key, two live keys, joke distractors, missing data, passage-independent passage questions, or explanations that do not reason. None met that bar on this pass. NORTH_STAR still forbids `verified=true` without a human or official anchor.
- Rejected: Quarantining the ten least-certain items automatically; marking the bank verified.

## 2026-09-01 — demo:seed is simulation-only and will not mix with real study
- Decision: `pnpm demo:seed` writes `sessions.kind=simulation` with `config.demo=true` and a `[DEMO]` label. It refuses if any non-demo session exists. `pnpm db:reset` is the wipe for real use. SCOREBOARD.md is not written.
- Rationale: NORTH_STAR treats attempt records as trusted. Mixing fake history into daily sessions would poison mastery, FSRS, and streak. A banner on Today and Progress names the source.
- Rejected: Seeding `kind=daily`; silently appending demo attempts onto a real ledger.

## 2026-09-01 — 14-day trend uses EWMA correctness, not live FSRS R
- Decision: The weakest-five chart plots EWMA(correctness, α=0.3) as of each day. Live mastery remains 0.6C+0.4R.
- Rationale: `fsrs_state` stores only the current card. Reconstructing historical retrievability would be invented math. EWMA from dated attempts is the honest historical series.
- Rejected: Snapshot tables; backdating R from the current card.

## 2026-09-01 — Pacing budgets 95 / 102 / 120 seconds
- Decision: Histogram reference budgets are MCAT science 95s, CARS 102s, GAMSAT S3 120s. Logged as B-010.
- Rationale: Stretch asked for section budgets. These are minutes-per-section divided by typical question counts, for pacing feedback only.
- Rejected: A single 95s line for every exam; claiming official ACER/AAMC scoring.

## 2026-09-01 — Hunt fills new-item quota; FSRS due dates unchanged
- Decision: Topics with a twice-missed still-wrong item, or ≥2 trap/content_gap misses in the last 14 days, rank first inside the existing daily `newCap`. Demo attempts (`config.demo=true`) are ignored. Same-card FSRS Again is untouched. Diagnostic sessions do not hunt.
- Rationale: NORTH_STAR lists error-driven remediation. The dream requires a twice-missed trap to come back until it dies. Sister new items kill the node; FSRS already restudies the card. Overriding due dates would fight the scheduler we chose not to hand-roll.
- Rejected: Changing FSRS due dates; a hunt queue outside `newCap`; hunting from demo:seed history; mixing overlay weight-0 topics into hunt ranking (they still fail `examWeight > 0`).

## 2026-09-01 — SCOREBOARD study log auto-syncs; official scores stay human
- Decision: `pnpm scoreboard:sync` and session-end auto-sync rewrite only the Study log from non-demo daily and diagnostic attempts. Official scores and the weekly verdict are never written by the app. Demo/simulation is excluded. Auto-sync runs only against `data/app.db` so tests cannot clobber the ledger.
- Rationale: NORTH_STAR measures success in SCOREBOARD.md. A ledger that stays at 0 after real study cannot be a trend line. Official percentiles are AAMC/ACER truth — software must not invent them.
- Rejected: Counting demo:seed; writing fake official scores; failing a session if the markdown write errors.

## 2026-09-01 — Overconfidence note on high-confidence misses only
- Decision: After reveal, if the answer is wrong and confidence was 4 or 5, show a one-line note that confidence and accuracy need to be the same number. Do not show it on hits or on 1–3 misses.
- Rationale: The dream is that confidence and accuracy are the same number. The Progress calibration chart is after-the-fact. The expensive miss is the sure-wrong one during the session.
- Rejected: Nagging on every miss; blocking Next behind the note; changing the 1–5 confidence scale.

## 2026-09-01 — Hunt-topic due reviews keep relative order but go first
- Decision: Inside the existing due set (up to reviewCap), hunt-topic items are sorted ahead of other dues. ts-fsrs due timestamps are not changed. Cards that are not yet due stay unscheduled.
- Rationale: Cycle 1 hunted with new items only. A trap that FSRS already marked due could still wait behind an older unrelated due. Reordering dues is error-driven remediation; pulling future cards forward would be a hand-rolled scheduler.
- Rejected: Overriding FSRS due dates; dropping non-hunt dues; a second session type for leeches.

## 2026-09-01 — Returning misses are named without leaking the trap
- Decision: Before reveal, if this item was missed in another non-demo session, show the miss count. Do not show prior error class or the correct key. Demo attempts do not count.
- Rationale: The dream is that the trap comes back until it dies. Naming "you missed this before" raises care on retrieval. Naming "trap" before answer would leak the trick.
- Rejected: Showing error class before reveal; counting demo:seed; a separate leech queue.

## 2026-09-01 — Underconfidence note on low-confidence hits
- Decision: After reveal, if the answer is right and confidence was 1 or 2, show a one-line note that a low rating brings the card back sooner than memory needs. Hits at 3–5 stay silent. FSRS mapping is unchanged (still Hard).
- Rationale: ratingFromAttempt maps correct+conf≤2 to FSRS Hard. That burns future study hours on cards already retrieved. The dream wants confidence and accuracy to be the same number in both directions.
- Rejected: Changing the FSRS mapping; forcing a confidence edit after reveal; nagging on confidence 3.

## 2026-09-01 — Session summary pacing uses section family budgets
- Decision: Session mean-seconds is compared to the mean of per-item 95/102/120s family budgets (B-010), not a hardcoded 95s for every session. Mixed sessions are labeled mixed.
- Rationale: Progress already used family budgets. The session the user just finished still taught the science clock. Wrong timing insight trains the wrong exam-day pace.
- Rejected: Keeping the 95s line for simplicity; inventing official AAMC/ACER timing rules.

## 2026-09-01 — Stop the DREAM loop at human-gated gaps
- Decision: Do not generate more AI items to cover the 263 empty topics, do not add a GAMSAT S2 writing player, and do not nag pacing mid-question. The loop stops until the human studies, reviews QC flags, and (if they want CARS-majority coverage) resolves B-009.
- Rationale: Feature litmus is score per study hour this month. Study days are 0 on a 315-item unverified bank. More AI content fails trust. S2 craft is not retrieval MCQ. Three consecutive audits found no unblocked gap.
- Rejected: Painting the heatmap with unverified CARS; treating demo streak as study; a fourth scheduling tweak that the user would not feel on exam morning.

## 2026-09-01 — Kill PLACEHOLDER seed; bootstrap the real bank
- Decision: `pnpm seed` loads taxonomy only. `pnpm bootstrap` ingests every numbered `content/batches/NN-*.json`. Leftover PLACEHOLDER stems are stripped. Study UI tells the human to bootstrap, not to live on placeholders.
- Rationale: NORTH_STAR forbids unverified=true, not real tagged items. A seed bank whose stems are `[PLACEHOLDER]` trains nothing. Newest prompt: replace placeholders with the real thing.
- Rejected: Keeping twenty PLACEHOLDER rows so Today is never empty; setting verified=true in software.

## 2026-09-01 — Expand the bank despite DREAM cycle 8–10 stop
- Decision: Cover every exam_weight>0 topic with original AI items through ingest+critic. Deepen CARS and GAMSAT S1 with additional original passages. Do not copy AAMC/ACER. Do not mark verified.
- Rationale: Conflict rule: newest prompt wins on scope; NORTH_STAR wins on values. The DREAM stop was a scope choice against more unverified cards. The human then asked for a real bank with range and depth.
- Rejected: Leaving 263 topics empty; flipping the bank to CARS-majority item count (B-009 still open); official-looking stems cloned from released papers.

## 2026-09-01 — Section-track daily and diagnostic sessions
- Decision: Today can start Mixed (exam-weight ranking) or a named family (CARS, B/B, C/P, P/S, S1, S2, S3). Assembler and diagnostic candidate lists filter by `sectionFamily`. Other-section dues wait (B-012).
- Rationale: Exam morning is a sitting, not a mixed trivia hour. CARS and S3 clocks differ. A block raises expected score per hour for the paper you are actually training.
- Rejected: A second scheduler; pulling future FSRS cards across sections; mid-question pacing nags.

## 2026-09-01 — S2 studio with rotating quote packs
- Decision: Keep S2 craft MCQs in the bank. `/write` is timed production, self-rubric, localStorage drafts, five Task A and five Task B packs rotating by UTC date (B-011).
- Rationale: The real paper is 30 minutes of writing. Retrieval of craft is not the same as producing under the clock. Rotating packs prevent one memorised quote set.
- Rejected: Auto-scoring essays; claiming ACER percentiles; forbidding the studio because NORTH_STAR says retrieval (the MCQ bank still is).

## 2026-09-01 — 100× bank via weight-allocated factory, not uniform clones
- Decision: Additional volume is `HAND_BANK × 100 = 84,700` items from `src/factory`, allocated by `exam_weight` with a floor of 40 per weighted topic. Designs: code-checked quantitative stems, sibling-discrimination conceptuals, combinatorial CARS/S1 passages (1Q, passage-locked), experimental tables (4Q), S2 craft MCQs. Output is generated at `pnpm factory:emit` / bootstrap into `content/batches/factory/` (gitignored JSON). Never `verified=true`. Engine/UI not redesigned.
- Rationale: Expected score ≈ Σ P(correct on exam grain i) × exam_weight(i). One card per topic is memorization; CARS is 12.5% of combined weight so it gets more volume as passages, not as fake science discretes. Newest prompt asked for 100× content and design range. NORTH_STAR: ingest+critic, no hand-rolled FSRS, no official clones.
- Rejected: 84,700 identical paraphrases of the 847; dumping volume only on easy science; committing ~100MB JSON to git; auto-verify; a second scheduler.

## 2026-09-01 — S2 quote packs expanded to ten per task
- Decision: `/write` now rotates ten Task A and ten Task B packs (still UTC-day index). Factory S2 MCQs remain retrieval of craft; the studio remains production.
- Rationale: Five packs were too few for a 30-minute paper trained across months. More packs raise the chance the sitting is a new quote set.
- Rejected: Auto-generated quote salad; scoring the essay with an LLM as an official mark.

## 2026-09-01 — Khan-like mastery path without cloning the Khan platform
- Decision: Map existing topic mastery + attempt counts to five levels (unseen / struggling / familiar / proficient / mastered). Mastered requires mastery ≥ 0.80 and ≥ 3 attempts. Course mastery is the exam-weight-weighted mean with unseen = 0. Today recommends one Up Next skill (hunt → struggling gap → highest-weight unseen → remaining gap). Skill sessions stay `sessions.kind = daily` with `config.mode = skill|mastery_check`; they take ~4 focus + ~4 contrast items and run the existing interleave. New items sort by `difficultyEst` (easier first if topic mastery < 0.5). No video-as-study, energy points, avatars, pre-reveal hints (B-014), or classrooms.
- Rationale: Newest prompt asked how Khan would adapt this repo for score and learning maximization. NORTH_STAR still wins: retrieval only, confidence before reveal, interleave, no unverified=true. Levels are a display/routing layer on the existing EWMA+FSRS mastery, not a second scheduler. Skill-as-daily keeps SCOREBOARD counting the hours.
- Rejected: `sessions.kind = skill` (CHECK migration); same-topic KA bursts; hints before confidence; gamification; treating unseen prior 0.3 as course mastery.

## 2026-09-01 — Past-paper pattern path: analog-in-stem retrieval, not a notes catalog
- Decision: Effectiveness is retrieve-the-move-on-a-new-instance. v1 ships an 18-pattern catalog (`PAT.*` as `items.skill_tag`). Entry items put a worked analog in the stem and still require an answer. Apply items are difficulty-ranked new instances of the same move (target 2400 via `pnpm patterns:emit`). Factory emit also default-tags untagged items with `defaultPatternId`. Explanations name pattern + content grain only after reveal. Structure tests are mixed or track-scoped mini sittings (cap 20, family round-robin) that still interleave (B-015). `sessions.kind` stays `daily`. GET `/next` nulls `PAT.*` skill tags so the move is not leaked.
- Rationale: Newest prompt: first-principles past-paper method — pattern analysis with examples, large ranked drills, explanations tied to content+pattern, overall structure tests. NORTH_STAR: retrieval only, no official clones, no pre-reveal hints, never `verified=true` in software. Unlimited generation is used for volume of original analogs, not for lecture pages.
- Rejected: A markdown pattern handbook; cloned AAMC/ACER stems; same-topic CARS bursts as "structure"; `sessions.kind` migration; showing the pattern move before confidence.

## 2026-09-01 — Sit-today: resume ranked, scoreboard display-only for official rows
- Decision: Today shows unfinished non-demo sittings, in-progress first, at most one untouched start. Empty daily/diagnostic queues throw instead of creating a blank player. `/scoreboard` displays official rows from SCOREBOARD.md and live study stats from the DB; software still must not write a percentile. S2 drafts autosave in localStorage; time-up is named and does not wipe the essay.
- Rationale: Newest prompt asked for a complete product a human can sit. Dead ends (lost session URL, hung JSON parse, unsaved S2, empty sitting) waste the scarcest resource — study hours. Official percentiles remain AAMC/ACER truth.
- Rejected: Entering official scores in a form that invents percentiles; auto-abandoning untouched starts; treating agent/browser verify attempts as human study in committed SCOREBOARD.md.

## 2026-09-01 — Merge the stacked PR series by fast-forwarding main
- Decision: Land PRs #1–#10 by fast-forwarding `main` to `cursor/complete-product-3760` (`334c308`). Every earlier PR head is an ancestor of that tip, so one push includes the whole series.
- Rationale: Newest prompt was merge all PRs. The branches were already a single stack (1 → 63 commits). A fast-forward preserves every commit SHA so GitHub marks each PR MERGED without conflict resolution or squash rewriting.
- Rejected: Merging each PR as a separate merge commit; squashing the stack (would orphan earlier PR SHAs); closing older PRs without landing their commits.

## 2026-09-02 — 5× generated bank, not a second hand-authored set
- Decision: `TARGET_MULTIPLIER` 100 → 500 (`FACTORY_TARGET` 423,500). `FLOOR_PER_TOPIC` 40 → 200. `PATTERN_TARGET` 2,400 → 12,000. Allocation still follows `exam_weight`. Software still never sets `verified=true`. Caps remain `FACTORY_TARGET` / `PATTERN_TARGET`.
- Rationale: Newest prompt: finished the current questions; double or 5×. 5× is the volume that keeps retrieval going. Engine and UI unchanged. Uniqueness still comes from a run/instance index in the stem.
- Rejected: Doubling only (narrower than the asked 5×); cloning the 847 hand items; auto-verify; a new generator architecture.

## 2026-09-02 — 10× the generated bank again; stream emit; wipe study history not git
- Decision: Newest prompt said 5× or 10× again — take 10×. `TARGET_MULTIPLIER` 500 → 5000 (`FACTORY_TARGET` 4,235,000). `FLOOR_PER_TOPIC` 200 → 2000. `PATTERN_TARGET` 12,000 → 120,000. `emitFactoryBatches` fills one topic, writes chunks, discards (no 4.2M in-memory bank; no one `JSON.stringify` of the whole set). Pad indices use `1_000_000_000 + n` so they cannot collide with real run indices. Tests prove allocation + a 12k per-topic slice + streamed emit of 1500; they do not generate 4.2M in Vitest. Study history is wiped with `pnpm db:reset` (attempts/FSRS/sessions). Git history and NORTH_STAR stay. Software still never sets `verified=true`. Caps remain `FACTORY_TARGET` / `PATTERN_TARGET`.
- Rationale: The previous 500× queue can be finished again; 10× is the larger of the two asked multipliers. Holding 4.2M items in RAM already failed at 423k via V8 max string length. Wiping study history is the local ledger, not the repo.
- Rejected: 5× only; wiping git history; generating the full 4.2M inside Vitest; auto-verify; a new generator architecture.

## 2026-09-02 — Land 5× and 10× by fast-forwarding main
- Decision: Fast-forward `main` to `cursor/bank-10x-3760` (`5dbea3a`). PR #11 (5×) is an ancestor, so one push marks #11 and #12 MERGED.
- Rationale: Newest prompt: merge when done. Same method as PRs #1–#10.
- Rejected: Squashing (would orphan PR SHAs); merging #11 and #12 as separate merge commits.

## 2026-09-02 — YC-demo is the instrument, not a multi-user company
- Decision: Newest prompt asked for YC-grade screenshots/demos and ambitious question + knowledge-structure targets. Keep designed factory at 4,235,000 and patterns at 120,000. Add a visible four-layer exam atlas (family derived from ids; no schema fourth level — B-001). Show designed vs live counts. Ingest a 423,500 factory cap on this VM so the UI has real numbers. Do not add auth, waitlists, or fake users. Do not set verified=true. Log B-016.
- Rationale: NORTH_STAR wins on values (single user, no monetization, no polish beyond clarity). Newest prompt wins on scope: the map and the scale must be screenshotable. A 4.2M ingest is optional; a sit-able 436k live bank plus designed-capacity copy is enough to photograph the ambition honestly.
- Rejected: Generating mockup images instead of the live app; raising factory to 10,000× without ingesting; a fourth taxonomy level in SQLite without human B-001; a SaaS landing page.

## 2026-09-02 — Lesson home + GitHub Pages door; Duolingo interaction, not gamification
- Decision: `/` is one Continue (unfinished sitting, else Up Next skill, else mixed daily) plus a 7-family path drawn from existing coverage. BankHero, due forecast, last-7-days, and extra sitting modes sit behind `<details>`. Player Continue chrome is sage on cream. GitHub Pages is a static door in `site/` (`pages/` would collide with Next). The player does not run on Pages. No XP, hearts, leagues, avatars, or hints. No factory, taxonomy, ingest, or schema change.
- Rationale: Newest prompt: publish a git website; Today still feels like a database; want more Duolingo; UI craft; no cost to further expansion; YC would love. NORTH_STAR: retrieval, confidence-before-reveal, no other users. Newest prompt wins on scope (public door + lesson UI). NORTH_STAR wins on values (no fake company, no gamification that is rereading). Log B-017.
- Rejected: Hosting Next+SQLite on Pages; a second study runtime; XP/streak leagues; coupling UI to bank expansion; putting static files in `pages/` (Next Pages Router); a Figma-only mock.

## 2026-09-02 — Factory stems must read as exam items, not as item-writer notes
- Decision: Newest prompt: the questions are bad; look with a fresh eye. Conceptual/P/S/S2/CARS/pattern/quant/experiment emitters were leaking factory meta (`pack N`, `tested grain`, `this bank`, `Seed N only changes the names`, `(run N)`, `Entry — identify the move`). Rewrite stems and passage bodies to AAMC/ACER-like language. Kinetics tables only on enzyme/chem/bio topics, not on every science node. Keep analog-in-stem for pattern drills, without the “Entry — identify” wrapper. Software still never sets `verified=true`. Re-ingest the sit-able cap (423.5k factory + 12k patterns) so localhost is not still serving the old stems. Hand-authored 847 unchanged.
- Rationale: Trust in content outranks volume. A 4.35M bank of meta-questions lowers expected score per hour. Newest prompt wins on scope (quality). NORTH_STAR wins on values (no auto-verify).
- Rejected: Leaving the templates and only hiding them in the UI; deleting the factory; auto-verifying rewritten items; rewriting the 847 hand items (they were already exam-like).

## 2026-09-02 — v1 label-swap was not enough; stems must be exam prompts
- Decision: Newest prompt again: look with a fresh eye; they are still bad. v1 left topic titles in the stem, “is the idea that covers” in the options, S2 “which writing move (set N)”, CARS `(issue N)` / Seed in explanations, quant `(trial N)`, pattern “solved example of the move” / “booklet N”, and a committed preview batch of pack-0 / vignette-0 items. v2: stem presents observations or a Task/passage; options are accounts or construct names; delete `26-scoremax-preview.json`; keep hand 847; never verified=true; re-ingest the sit-able cap.
- Rationale: A student sitting Continue should not be able to tell they are inside a generator. Trust in content outranks volume. Newest prompt wins on scope.
- Rejected: Another synonym pass on the same meta frames; rewriting hand items; auto-verify; keeping the preview batch “because it is only 18 rows” (those were the items sit-today actually served).

## 2026-09-02 — Land #14–#16 by fast-forwarding main; Vite 5173 is safe to kill
- Decision: Newest prompt: close Cursor; merge all PRs first. Fast-forward `main` to `cursor/item-quality-3760` (`d92afeb`). #14 and #15 are ancestors, so one push marks #14, #15, and #16 MERGED. The “Start Vite dev server on 5173” dialog is a leftover local terminal, not this app — Close Anyway.
- Rationale: Same merge method as PRs #1–#13. This repo’s player is Next on 3000. Killing Vite does not kill the bank.
- Rejected: Squashing (would orphan PR SHAs); merging #14–#16 as separate merge commits; telling the user to keep Vite running.

## 2026-09-02 — Public door from docs/ to match enabled Pages source
- Decision: Newest prompt: a website now; how to use it outside Cursor. Keep the static door (not the player) on github.io. Publish it from `docs/` because the repo Pages setting is already legacy `main` `/docs`, not GitHub Actions. Keep `site/` identical for a later Actions switch. Sitting remains `pnpm dev` → http://localhost:3000 in Safari/Chrome. Cursor is not part of the study loop.
- Rationale: github.io was 404 with no `index.html` in `/docs`. `gh` cannot flip Pages source. Newest prompt wins on scope (public door that actually loads). NORTH_STAR wins on values (no hosted quiz, no other users).
- Rejected: Hosting Next+SQLite on Pages; waiting for a human Pages-source flip before shipping a site; putting the player on github.io.

## 2026-09-02 — Sit on the Mac; batch mastery off the factory bank
- Decision: Newest prompt: rendering is too slow; M3 Pro — run locally better? Yes. The study runtime is local Next + SQLite on the laptop (Safari/Chrome, `pnpm sit`). Cursor Cloud is an editor VM. Fix `masteryByNode` so it does not SELECT every factory item / FSRS row per topic on each home/Continue load. Unseen = item count − fsrs count.
- Rationale: Home was ~20s on this VM against the 436k bank (per-item retrievability lookups). That taxes study hours even on an M3 Pro. Newest prompt wins on scope (make sitting fast locally). NORTH_STAR wins on values (no hosted player).
- Rejected: Hosting the quiz on github.io; leaving the O(items) mastery loop because “M3 is fast”; telling the user to keep studying in Cursor Cloud.

## 2026-09-02 — Mac sitting needs Node on Terminal PATH, not a second clone
- Decision: Newest prompt: Mac clone, `pnpm: command not found`, then a nested `MCAT-GAMSAT/MCAT-GAMSAT`. Document Homebrew Node + Corepack pnpm 10.33.3. Add `scripts/mac-setup.sh`. Keep one clone folder. Sitting remains local `pnpm sit`.
- Rationale: This repo's package manager is pnpm. Terminal is not Cursor. A second clone does not install tools. Newest prompt wins on scope (get the Mac sitting). NORTH_STAR wins on values (local, no hosted quiz).
- Rejected: Switching the repo to npm; telling them to study in Cursor Cloud until pnpm exists; deleting the outer clone.









# Similar projects — public GitHub landscape (2026-09-03)

This repo is a **single-user MCAT + GAMSAT retrieval system**: taxonomy-tagged items, `ts-fsrs` scheduling, confidence 1–5 before reveal, error class on every miss, interleaving, and a SCOREBOARD that only official AAMC/ACER percentiles may fill. Success is the score, not stars.

This note answers: *what public projects already occupy that space, which of them are still maintained and used, and what they still fail at.*

Search date: **2026-09-03**. Method: GitHub repository search (`MCAT`, `GAMSAT`, topics `mcat` / `premed` / `question-bank` / `medical-education` / `spaced-repetition`, plus named products), then inspection of READMEs, changelogs, and commit dates for ~35 closest repos. Commercial and Anki-community products are included because they are what students actually use; GitHub stars alone would hide them.

**Headline.** There is **no maintained, widely used open-source product** that does MCAT *and* GAMSAT as exam-style retrieval with FSRS, confidence, and official-score honesty. The stack that is “doing well” is still **AAMC/ACER + Anki (FSRS) + a paid or free QBank**. Direct OSS “MCAT apps” are almost all 2026 personal projects with 0–16 stars. They independently rediscover the same product (local player, AAMC taxonomy, AI banks, mistake tags) and then hit the same wall: **content quality, CARS/S1, writing, and official calibration.**

---

## 1. What “doing well and still maintained” means here

Stars are a poor proxy for exam-prep success, but they do mark engines people keep building on. Last push dates are as of this search.

| Project | Role | Stars | Last push | Status |
| --- | --- | --- | --- | --- |
| [ankitects/anki](https://github.com/ankitects/anki) | Spaced-repetition engine (desktop). FSRS is in-tree. | 30,238 | 2026-09-02 | Dominant. Daily commits. |
| [ankidroid/Anki-Android](https://github.com/ankidroid/Anki-Android) | Android client | 11,709 | 2026-09-03 | Dominant on phone. |
| [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki) | FSRS scheduler that landed in Anki | 4,053 | 2026-08-14 | Healthy org; algorithm is now mainstream. |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | TypeScript FSRS (this repo’s library) | 773 | 2026-09-03 | Actively maintained. |
| [open-spaced-repetition/awesome-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs) | FSRS implementations index | 677 | 2026-09-01 | Living catalog. |
| [AnKing-VIP/AnKing-Note-Types](https://github.com/AnKing-VIP/AnKing-Note-Types) | Medical Anki card templates | 77 | 2026-06-08 | Maintained. The **AnKing MCAT deck** itself lives on AnkiHub, not a public card dump. |
| [nagisanzenin/engram](https://github.com/nagisanzenin/engram) | FSRS + free-recall “receipts” (general, not MCAT) | 1,394 | 2026-08-27 | Fast-growing 2026 learning engine. |
| [trane-project/trane](https://github.com/trane-project/trane) | Deliberate-practice engine | 845 | 2026-09-02 | Maintained; skill graphs, not a QBank. |
| [thiswillbeyourgithub/AnkiAIUtils](https://github.com/thiswillbeyourgithub/AnkiAIUtils) | AI helpers on Anki (medical-school users) | 880 | 2026-06-01 | Used; last push June 2026. |
| [JuliusBrussee/revu-swift](https://github.com/JuliusBrussee/revu-swift) | Local-first macOS FSRS app | 366 | 2026-04-12 | Polished; exam-agnostic. |
| [andymatuschak/orbit](https://github.com/andymatuschak/orbit) | Embedded spaced repetition | 1,831 | 2024-10-14 | Influential, **stale**. |

**Not on GitHub as a product, but doing far better than any OSS MCAT app:**

- **AAMC Official Prep Hub** — only source of percentile-true MCAT items and FLs.
- **UWorld MCAT** — ~3,000 items; community consensus “best third-party QBank.”
- **Jack Westin** — ~6,700 free items + daily CARS; highest-volume free QBank.
- **AnKing MCAT deck via AnkiHub** — ~6,200 cards, monthly update posts (update #20 in 2026), UWorld QID + AAMC outline tags. This is the maintained *content* layer on Anki.
- **MileDown** — ~2,900 cards, still the default *free static* MCAT deck.
- **Khan Academy MCAT** — ~1,100 videos + ~3,000 review questions; still up in 2026, future past 2026 not guaranteed.
- **ACER GAMSAT** — only official GAMSAT papers. Volume is tiny. ACER publicly warns that commercial courses are unregulated.
- **GradReady / Fraser’s** — the GAMSAT commercial stack that actually has volume, mocks, and S2 marking. Not OSS.

Generic GitHub search for `MCAT` is mostly noise (terminal viewers, pathology transformers, Minecraft, USACE hydrology). Topic `mcat` has almost no exam-prep hits. **GAMSAT on GitHub is a graveyard** (see §3).

---

## 2. Direct OSS MCAT apps (closest cousins)

These are the public repos that actually try to be an MCAT practice product. Almost all were created in 2025–2026. None have a user community comparable to Anki or Jack Westin.

### 2.1 [Zushah/OpenMCAT](https://github.com/Zushah/OpenMCAT) — closest living OSS MCAT player

- **What it is:** Browser-only MCAT practice + analytics. No accounts, no telemetry, IndexedDB. Pregenerated C/P, B/B, P/S banks (100 items each, tagged to AAMC topics and **SIRS 1–4**). Optional “copy prompt → paste JSON from your AI chat” generator. Playwright tests. Live at [zushah.github.io/OpenMCAT](https://zushah.github.io/OpenMCAT/). AGPL-3.0.
- **Maintained?** Yes. Created 2026-05-10, last push **2026-08-23**, changelog through v1.8.0. Stars: **1**.
- **Overlap with this repo:** local-first, AAMC taxonomy, SIRS overlay, miss tagging. Their mistake types are almost the same set: `content_gap`, `stem_misread` / `passage_misread`, `time_pressure`, `reasoning_error`, `other` (plus math error, changed-from-correct, flawed-question).
- **Still short:**
  - **CARS was removed** (changelog v0.8.0, 2026-05-22). The hardest MCAT section has no home here.
  - Banks are **GPT-generated** (`openai/gpt-5.5-pro` in `catalog.js`). Same poison surface as this repo’s factory (B-013 / B-018).
  - **No FSRS.** Analytics and “mistake-aware recommendations,” not a memory model.
  - No GAMSAT. No official-score ledger. No confidence-before-reveal as a hard gate.
  - Volume is 300 core items + whatever the user pastes. Generator quality is the user’s chat model that day.
  - Almost no users. One maintainer.

### 2.2 [notAidven/mcat-study-engine](https://github.com/notAidven/mcat-study-engine) (ReadyMCAT) — closest *learning-science* cousin

- **What it is:** A **fork of Anki** (Rust engine + Qt + Svelte + SwiftUI iOS), not an add-on. Preloads **1,075 original, source-cited** cards (414 discrete MCQ, 410 type-in, 174 passage, 77 CARS) grounded in OpenStax/LibreTexts. FSRS is Anki’s. Core ideas (their PRD + `docs/brainlift-mcat.md`):
  1. **Teach-on-miss** — on a miss, do not show the explanation; run a guiding sub-question ladder, then re-ask the stem, then space the correction.
  2. **Points-at-stake queue** — due cards ordered by `topic_weight × weakness` (AAMC weight × FSRS weakness). Same formula family as this repo’s `(1 - mastery) * exam_weight`.
  3. **Honest scores** — memory / performance / readiness as three numbers; **no score until ≥200 reviews and ≥50% outline coverage**.
  4. One engine for recall → discrete → passage, including CARS.
- **Maintained?** Public squash 2026-07-14; no later product commits. Stars: **0**. Build cost is “compile Anki from source.”
- **Still short:**
  - **1,075 items is not an exam career.** Community Anki decks are 3–6k facts; UWorld is ~3k *application* items. Passages: 36 science + 15 CARS.
  - Teach-on-miss ablation (“does this beat reading the explanation at equal study time?”) is **explicitly unrun**.
  - iOS two-way sync still missing in the PRD.
  - Forking Anki is a maintenance cliff (30k-star upstream).
  - No GAMSAT. Runtime AI ladders re-introduce leak/quality risk they tried to avoid in the bank.
  - Zero community; cannot compete with AnKing’s 72,000+ card edits.

Their own research already names the industry’s failures (and they are right): QBanks train *platform patterns*; Anki builds recall that does not predict passage performance; every tool collapses memory/performance/readiness into one fake number; CARS and passages do not live in Anki well.

### 2.3 [mlmacdiarmada/Open-MCAT](https://github.com/mlmacdiarmada/Open-MCAT)

- **What it is:** Static GitHub Pages quizzes at **testable-idea** grain (between AAMC category and a single fact). **1,274 original questions / 284 ideas**, every distractor has a `why`. Per-choice rationales are the point. Live site. MIT code + CC BY-NC content.
- **Maintained?** Last push 2026-07-13. Stars: 0.
- **Their own architecture note** (`architecture-assessment.md`) lists the missing product: no per-attempt log, **no confidence, no error categories, no FSRS**, mastery = best-score percentage. They planned those as later phases.
- **Still short:** no scheduler; no GAMSAT; CARS coverage unknown/thin relative to science ideas; no official calibration; single HTML file; one author.

### 2.4 [collingeorge/MCAT](https://github.com/collingeorge/MCAT)

- **What it is:** Offline `index.html` app. **2,549 recall MCQs converted from MileDown clozes** plus **184 passage items / 37 passages** (12 original CARS). Handmade SM-2-ish SRS (interval doubles on hit, cap 30 days). Invents **118–132 scaled scores** from session accuracy. Live at [collingeorge.github.io/MCAT](https://collingeorge.github.io/MCAT/).
- **Maintained?** Last push 2026-03-23. Stars: 0.
- **Still short:**
  - Converting cloze facts into 4-option MCQs is **not exam practice**. It is Anki with a worse scheduler and fake percentiles — this repo’s NORTH_STAR forbids that percentile move.
  - Handmade SRS, not FSRS.
  - MileDown conversion may be a copyright/license problem (MileDown is a community deck, not a CC bank).
  - No GAMSAT.

### 2.5 Other MCAT-shaped repos (low signal)

| Repo | Last push | Stars | Why it doesn’t close the gap |
| --- | --- | --- | --- |
| [Ammaar-Alam/mkit](https://github.com/Ammaar-Alam/mkit) | 2026-08-11 | 0 | Chrome extension: **spoiler-safe re-sit of completed AAMC reviews**. Does not own content. Correct approach to official items; not a bank. |
| [crisprking/MCAT-study-app](https://github.com/crisprking/MCAT-study-app) | 2026-01-19 | **16** | Highest-star “MCAT study app” in topic search. It is a **Gemini AI Studio template**, not a bank. |
| [MukundaKatta/crammr](https://github.com/MukundaKatta/crammr) | 2026-06-13 | 2 | AI tutor for JEE/NEET/**MCAT**/CAT. Multi-exam chatbot, not a retrieval ledger. |
| [mbaffour/mcat-prep](https://github.com/mbaffour/mcat-prep) | 2026-07-06 | 0 | “Static MCAT simulator generated with Codex.” |
| [Jhn-git/mcat-practice-app](https://github.com/Jhn-git/mcat-practice-app) | 2025-05-28 | 0 | One-off; dead. |
| [ryanmockabee/mdog](https://github.com/ryanmockabee/mdog) | 2017-09-28 | 0 | “Open source MCAT aide,” abandoned. |
| [mfs780/mcatQuiz](https://github.com/mfs780/mcatQuiz) | 2014-02-06 | 1 | jQuery CBT replica. Fossil. |
| [bianshuyang/MCAT_Khan](https://github.com/bianshuyang/MCAT_Khan) | 2020-07-05 | 1 | Khan scraper from the 2021 retirement scare. Not a study loop. |
| [rigelhope/testprep](https://github.com/rigelhope/testprep) | 2015-09-26 | 8 | Generic MCQ harness naming MCAT/LSAT/USMLE. Dead. |

---

## 3. Direct OSS GAMSAT apps — almost nothing

GitHub search for `GAMSAT` returned **27** repos. This repository was one of them. The rest:

| Repo | Last push | What it is | Verdict |
| --- | --- | --- | --- |
| [Jdawg888/gamsat-trainer](https://github.com/Jdawg888/gamsat-trainer) | 2026-07-20 | Static app: SM2, three sections, AI S2 via Claude/Supabase. **20 S1 + 30 S3 + 6 essay prompts.** | Closest OSS GAMSAT *product*. Bank is a weekend’s work. SM2 not FSRS. Roadmap still wants weak-spot analytics and full mocks. Stars: 0. |
| [fedorum/GamSect](https://github.com/fedorum/GamSect) | 2025-11-26 | S2 only: Gemini prompts + timer. Double-click `index.html`. | Timer + LLM quotes. No retrieval, no S1/S3, no rubric that ACER would recognize. |
| [AbigailMcGovern/GAMSAT-S3-FlashPy](https://github.com/AbigailMcGovern/GAMSAT-S3-FlashPy) | 2021-12-20 | Intended S3 calculation MCQ generator. README: **“not yet functional.”** | Dead. |
| [nicholas-johnson/revisegamsat](https://github.com/nicholas-johnson/revisegamsat) | 2014-09-04 | Revision notes. | Dead 12 years. |
| [aussie-bzhang/biochem-wiki](https://github.com/aussie-bzhang/biochem-wiki) | 2026-05-07 | UniMelb biochem wiki + Prolog, “for GAMSAT.” | Content review, not a sitting. |
| [todd866/cohort](https://github.com/todd866/cohort) | 2026-08-13 | USMLE Step 1 engine (408 cited items) at [cohort.md](https://cohort.md). Tree also contains experimental `open-content/gamsat/` passages and `moves-v1.json`. | Public product is Step 1, not GAMSAT. Auth + Postgres, not local. GAMSAT files are not a shipped sitting. |

**There is no AnKing of GAMSAT.** No maintained open S1 passage library, no open S3 experimental-reasoning bank of real volume, no open S2 studio with a non-LLM, non-self-score that anyone trusts. Commercial GAMSAT (GradReady, Fraser’s, AceGAMSAT, Gold Standard) exists because ACER ships almost no practice volume and OSS never filled the hole.

---

## 4. Adjacent engines (not MCAT/GAMSAT, but the same job)

These are maintained products that solve *part* of the loop this repo cares about.

### 4.1 Anki + AnKing + FSRS — the de facto OSS winner

This is what high-scoring MCAT students actually run, in parallel with UWorld/AAMC.

**Doing well:** Anki 30k stars, AnkiDroid 11.7k, FSRS in core, AnKing MCAT deck updated monthly on AnkiHub with AAMC-outline and UWorld QID tags, Khan tags being refurbished in 2026.

**Still short (this is the important list):**

1. **Flashcard grain ≠ exam grain.** Anki is excellent for P/S facts and amino acids. Community guides in 2026 still say **Anki does nothing for CARS** and is weak for experimental reasoning / physics application. Students bolt Jack Westin / UWorld / AAMC on top. ReadyMCAT’s PRD is entirely about this split.
2. **No first-class exam taxonomy with weights.** Tags exist if a deck author added them. The scheduler does not know that FC1 is ~55% of B/B.
3. **No confidence-before-reveal on MCQs.** Classic cards are Show Answer → self-grade. That leaks. ReadyMCAT had to fork the reviewer to fix it.
4. **No error class.** Misses are Again/Hard. You cannot later filter “traps vs content gaps.”
5. **No official percentile ledger.** FSRS retrievability is not a 510. AnKing explicitly tells people to unsuspend from UWorld QIDs — the score still lives in AAMC FLs.
6. **Deck maintenance moved to AnkiHub** (~$5–6/month for live updates). The “free Anki deck” story is now a platform.
7. **GAMSAT decks are not a comparable ecosystem.**
8. **Interleaving** is whatever the student built with filtered decks. Not a product invariant.

### 4.2 [drpwchen/exam-practice](https://github.com/drpwchen/exam-practice) — FSRS QBank for *past papers you own*

- PMR (rehab) boards, not MCAT. FastAPI + Vue + FSRS-6. Confidence + timing → FSRS rating. Three pools (70% due / 20% new / 10% starred). Error book classified as 死穴 / 易忘 / 盲区 / 新错 (chronic lapse / forgotten / overconfident miss / new miss). **Score projection with Wilson CI**, using section weights × FSRS retention on exam day.
- Last push 2026-08-05. Stars: 5. Source-available, **non-commercial license**.
- **Still short:** needs a real past-paper PDF you are allowed to parse. Demo bank is 20 items. Score model is honest only if first-exposure happens *in this app*. No CARS-like passage product. Auth/multi-user (opposite of this repo’s non-goal).

### 4.3 [Grung-khan/MingMing-releases](https://github.com/Grung-khan/MingMing-releases)

- Offline medical QBank *player* (Windows/Android/Linux/PWA). Imports SQLite qbanks; NBME/Amboss-styled UI; 22 open issues; last push 2026-08-17. Stars: 5.
- **Still short / risk:** ships **no content**. The implied use is “import a database you have the right to use.” Community Telegram + schema compatible with leaked UWorld-shaped DBs is a **copyright trap**. Features (highlight, AI walkthrough, score prediction) do not create a legal original bank.

### 4.4 [htlin222/mcq-bank](https://github.com/htlin222/mcq-bank)

- Collaborative MCQ wiki for a Taiwan hematology exam. Cloudflare free tier. **Pushed 2026-09-03** (alive). Stars: 5, 24 issues.
- **Still short:** exam-specific; review + mock, not FSRS; needs a real imported CSV of past papers.

### 4.5 [todd866/cohort](https://github.com/todd866/cohort) and [nagisanzenin/engram](https://github.com/nagisanzenin/engram)

- **Cohort:** 408 citation-backed Step 1 items, fail-closed rights, adaptive ladder. The *content* discipline is what this repo’s `verified=true` rule is aiming at — and they only claim 408 items with diagrams. GAMSAT files in the tree are not the product.
- **Engram:** 1,394 stars in two months. Free-recall with “receipts” + FSRS. Not an MCQ exam simulator. Shows 2026 demand for *honest memory*, not another chatbot tutor.

### 4.6 [xiaohajiayou/Leetcode-Mastery-Scheduler](https://github.com/xiaohajiayou/Leetcode-Mastery-Scheduler) (536 stars)

Proof that **FSRS on application items** (not flashcards) is a winning pattern in a different exam. Same idea as this repo’s item-level FSRS; they have community, this space does not.

---

## 5. Commercial products that are actually “doing well”

OSS does not replace these. Their shortcomings are why people still stitch a stack.

### MCAT

| Product | Why it wins | Remaining shortcomings |
| --- | --- | --- |
| **AAMC** (QPacks, Section Banks, FLs, free sample/FL) | Only percentile truth. Interface = test day. | Tiny volume; explanations weaker than UWorld; no SRS; no error taxonomy; you burn FLs. |
| **UWorld MCAT** | Best third-party stems + visual distractor rationales; slightly harder than real. | $339+; no FLs in the standalone QBank; CARS logic not identical to AAMC; trains UWorld patterns (ReadyMCAT cites Larsen/Schmidmaier on this); **no FSRS**; explanations are *reading*. |
| **Jack Westin** | Best free volume; daily CARS; ~6,700 items. | Quality below AAMC/UWorld; cluttered UI; analytics thin; JW+ paywalls video/adaptive. |
| **Blueprint / Kaplan / others** | Courses, FLs, AI planners. | Expensive; pattern-train; Kaplan especially “curriculum not retrieval.” |
| **Khan Academy MCAT** | Free, AAMC-aligned videos + ~3k review Qs. | Content review, hints-before-commit (this repo’s B-014), **no FLs**, aging 2015-era emphasis, 2026+ existence not guaranteed. |
| **AnKing / MileDown on Anki** | Daily habit; FSRS; tagging into UWorld/AAMC. | See §4.1. |

The 2026 high-score stack in community writeups is still **Khan or books → Anki daily → UWorld or JW volume → AAMC late.** No OSS player has entered that sentence.

### GAMSAT

| Product | Why it wins | Remaining shortcomings |
| --- | --- | --- |
| **ACER** e-booklets + online section replicas | Only official style. Practice Test A comes with registration. | **Exhausted in weeks.** PDFs, not a scheduler. ACER tells candidates commercial courses are unregulated. |
| **GradReady / Fraser’s / AceGAMSAT** | Volume, mocks, S2 marking, LMS. | Cost; quality variance; not FSRS; incentive to over-claim. |
| **Gold Standard / older notes** | Cheap content. | Style drift vs current ACER; S2 advice ages. |

**GAMSAT-specific holes no commercial or OSS product has closed well:**

- S1 is not CARS; humanities stimulus reasoning has no Jack Westin.
- S2 marking is either expensive humans or LLMs that are not ACER.
- S3 is reasoning-from-data, not “first-year science recall,” but most banks still teach content.
- No public FSRS-tagged GAMSAT item graph with exam weights.

---

## 6. Shortcomings that *all* of these still have

Cross-cutting, ranked by how much they poison expected score per study hour.

### 6.1 Unverified AI volume is the 2026 default, and it is a trap

OpenMCAT’s banks are GPT-5.5-pro. This repo’s factory is millions of ingest-valid but `verified=false` items (B-013), and an earlier generator leaked meta-stems (B-018). Crammr, Gemini study apps, and GamSect’s quote generator are the same move. **ReadyMCAT and Open-MCAT are the rare projects that refused runtime item generation for the bank** — and they have ~1k human-shaped items, not millions.

Nobody has an open, citation-backed, *exam-style* bank at UWorld scale. Cohort’s 408 Step 1 items with figures is the honest upper bound for “original + cited + diagrams” from one team.

### 6.2 CARS / GAMSAT S1 are where OSS quietly gives up

OpenMCAT **deleted CARS**. Anki community still says Anki does not train CARS. ReadyMCAT has 77 CARS items (15 passages). collingeorge has 12 original CARS passages. Jack Westin wins *because everyone else declined the work*. GAMSAT S1 OSS is 20 questions in gamsat-trainer.

Passage products also fight this repo’s **interleave invariant** (B-015): real CARS is consecutive questions on one passage.

### 6.3 Writing (GAMSAT S2, and MCAT’s lack of an analog) is unsolved in software

GamSect: timer + Gemini quotes. gamsat-trainer: Claude vs a 2×5 homemade rubric, or self-mark in demo mode. This repo: `/write` self-rubric, not `verified`. ACER does not publish a numeric rubric. **No public project has a score-true S2 loop.** Human markers (Fraser’s etc.) remain the product.

### 6.4 Fake scaled scores are the most common lie

collingeorge maps accuracy → 118–132. MingMing and exam-practice predict equated scores. Blueprint dashboards do the same commercially. AAMC is the only MCAT percentile; ACER the only GAMSAT. This repo’s SCOREBOARD rule is the minority position and the correct one. Peers that “feel complete” almost always break it.

### 6.5 Memory ≠ performance ≠ readiness, and almost every UI merges them

ReadyMCAT’s brainlift is the clean statement. Anki FSRS = P(recall this card). QBank % = P(this platform’s item). Neither is P(AAMC FL). Khan mastery paths and energy points (B-014) make it worse. Open-MCAT still uses best-score percentage and knows it.

### 6.6 Explanations are still passive reading

UWorld’s edge is *better reading*. ReadyMCAT’s teach-on-miss is the only OSS attempt to force re-retrieval on a miss. It is unvalidated. This repo requires confidence and an error class, then still shows the explanation — closer to UWorld than to ReadyMCAT.

### 6.7 Official items cannot live in a public repo

MKit is the legally sane pattern: sit AAMC *on AAMC’s site*, hide spoilers, keep a local attempt log. MingMing’s “import a .db” is the legally insane pattern. This repo already refuses to copy AAMC/ACER (DECISIONS). That will always cap public-bank realism. The remaining product gap is **scheduling and reviewing official sittings**, not cloning stems.

### 6.8 Dual-exam (MCAT + GAMSAT) is an empty set

No maintained public project, commercial or OSS, is a first-class MCAT *and* GAMSAT retrieval graph. GAMSAT tools ignore AAMC; MCAT tools ignore ACER. Anyone sitting both is stitching two paid ecosystems. That is this repo’s only structural vacancy in the market — and it is a market of **one user** by NORTH_STAR.

### 6.9 Mobile / sync vs local-first

Anki wins because the phone works. ReadyMCAT forked Anki to get that and still lacks two-way sync. OpenMCAT, Open-MCAT, collingeorge, this repo’s github.io player: **localStorage, this browser.** exam-practice and Cohort added accounts (this repo’s non-goal). There is no maintained local-first MCAT player with a phone client except “just use Anki.”

### 6.10 Community maintenance

AnKing’s 72k card edits are the actual quality process. Every 2026 OSS MCAT app is one author, 0–1 stars, 0 issues. They will rot the moment the author sits the exam. **Unmaintained exam content is a score hazard.**

---

## 7. Feature overlap map (this repo vs the closest peers)

| Capability | This repo | OpenMCAT | ReadyMCAT | Open-MCAT | Anki+AnKing | UWorld/JW | gamsat-trainer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MCAT exam-style items | Hand 847 (+ unverified factory) | 300 GPT + generator | 1,075 cited | 1,274 original | Facts, not items | 3k–6.7k | — |
| GAMSAT | Yes (S1–S3 + S2 studio) | No | No | No | No | No | 56 original |
| FSRS | ts-fsrs | No | Anki FSRS | Planned, not shipped | Yes | No | SM2 |
| Exam-weight × weakness | Yes | Recs only | Points-at-stake | No | Tags, not scheduler | Weak | No |
| Confidence before reveal | Hard invariant | No | Attempt-first reviewers | Planned | Self-grade after leak | No | After answer |
| Error / mistake class | Required on miss | Yes (richer enum) | Teach-on-miss ladder, not a class | Planned | No | Flag only | No |
| Interleaving | Invariant | User-configured | Anki queue | Shuffle | Optional | Custom blocks | Per section |
| `verified` / citations | Never auto-true | Disclaimer only | OpenStax citations | Originality policy | Community edits | Paid editorial | Originality note |
| Official percentiles | SCOREBOARD human-only | No | Honest “no score yet” | Fake scaled (collingeorge does this; Open-MCAT does not) | No | Platform scores | No |
| CARS / S1 | Pattern drills + passages | **Removed** | 77 / 15 passages | Some ideas | Weak | JW strong | 20 S1 |
| S2 writing | Self-rubric studio | No | No | No | No | No | Claude or self |
| Phone | Browser | Browser | iOS (sync incomplete) | Browser | AnkiDroid/iOS | Apps | Browser |
| Users / maintenance | Single-user by design | 1 star, active | 0 stars, Jul 2026 | 0 stars | Huge | Huge | 0 stars |

---

## 8. What this search does *not* recommend building

NORTH_STAR: only build what raises expected score per study hour this month. The landscape’s tempting features mostly fail that test.

- **Do not chase Anki’s surface area** (sync, iOS, add-ons). Anki already exists; sitting AAMC/ACER and this bank raises score; compiling a fork does not.
- **Do not chase UWorld volume with more factory items** until a human QCs a slice (B-013). OpenMCAT and B-018 are the existence proof that volume without QC is decorative.
- **Do not invent 118–132 or GAMSAT percentiles.** collingeorge already did the attractive wrong thing.
- **Do not import pirate qbanks** (MingMing’s gravity well).
- **Do not add Khan-style hints** (B-014). Khan is the content-review product; this is retrieval.
- **Teach-on-miss** is the one peer idea with a real learning-science claim. It is also extra UI on every miss, unproven at equal time, and would compete with the error-class + explanation path already specified. Log it; do not build it unless the human amends scope.
- **MKit-style AAMC companion** (spoiler-safe re-sit) would help official papers without copying stems. Only useful after the human is actually sitting AAMC reviews.

---

## 9. Sources (primary repos and indexes)

Inspected on GitHub: `Zushah/OpenMCAT` (README + CHANGELOG + `mistakes.js` + `catalog.js`), `notAidven/mcat-study-engine` (README + PRD + brainlift), `mlmacdiarmada/Open-MCAT` (README + architecture-assessment), `collingeorge/MCAT`, `Ammaar-Alam/mkit`, `Jdawg888/gamsat-trainer`, `fedorum/GamSect`, `AbigailMcGovern/GAMSAT-S3-FlashPy`, `todd866/cohort`, `drpwchen/exam-practice`, `Grung-khan/MingMing-releases`, `htlin222/mcq-bank`, `ankitects/anki`, `ankidroid/Anki-Android`, `open-spaced-repetition/{fsrs4anki,ts-fsrs,awesome-fsrs,fsrs4anki-helper}`, `AnKing-VIP/AnKing-Note-Types`, `nagisanzenin/engram`, `trane-project/trane`, `thiswillbeyourgithub/AnkiAIUtils`, `JuliusBrussee/revu-swift`, `andymatuschak/orbit`, `crisprking/MCAT-study-app`, `MukundaKatta/crammr`, `mbaffour/mcat-prep`, `ryanmockabee/mdog`, `bianshuyang/MCAT_Khan`, `rigelhope/testprep`, `nicholas-johnson/revisegamsat`, `aussie-bzhang/biochem-wiki`.

External: AnkiHub AnKing MCAT update #20 (2026), TestPrepPal / Match Guy / MedAnkiGen 2026 QBank and Anki-deck roundups, AAMC free-prep pages, ACER GAMSAT preparation page, GradReady course pages, Khan Academy MCAT 2026 status notes.

---

## 10. Bottom line

**Maintained and doing well:** Anki/FSRS, AnKing-on-AnkiHub, AAMC, UWorld, Jack Westin (free volume/CARS), ACER + GradReady/Fraser’s for GAMSAT.

**Maintained but not “doing well” (no users):** OpenMCAT is the only OSS MCAT player still shipping in August 2026. ReadyMCAT is the only one with a serious learning-science spec. Open-MCAT has the best *original per-choice* explanations per item. None of them are a substitute for official papers.

**Shared remaining shortcomings:** unverified AI items, surrendered CARS/S1, unsolved S2, fake scores, flashcards ≠ passages, no dual MCAT+GAMSAT graph, no public UWorld-quality original bank, and no community QC process.

This repo already occupies the empty dual-exam + FSRS + confidence + error-class + honest SCOREBOARD cell. Its *own* copy of the industry’s main failure is the unverified factory and the still-empty SCOREBOARD. Peers do not have a fix for that. They either stayed small and cited (ReadyMCAT, Open-MCAT, Cohort) or generated and then deleted CARS (OpenMCAT).

# Peer question banks — extraction manifest

Extracted from public GitHub repos into `/tmp/peer-banks/` for later conversion.
Commercial stems (AAMC official, ACER, UWorld, Jack Westin, Kaplan, MileDown-derived) were **not** copied.

## Count table

| Bank | File | License | Items | Notes |
|---|---|---|---:|---|
| Open-MCAT (`mlmacdiarmada/Open-MCAT`) | `/tmp/peer-banks/open-mcat.json` | **CC BY-NC 4.0** (content); MIT (code) | **1294** | Flattened from `288` quizzes in `app.html` BANK. `index.html` is a landing page (no BANK). |
| OpenMCAT (`Zushah/OpenMCAT`) | `/tmp/peer-banks/openmcat.json` | **AGPL-3.0** | **300** Q + **30** passages | `src/data/bank/{cp,bb,ps}.json`. AI-generated original practice; `selfCheck.noOfficialMaterialCopied` on items. |
| GAMSAT Trainer (`Jdawg888/gamsat-trainer`) | `/tmp/peer-banks/gamsat-trainer.json` | Unspecified in repo (README: original, not ACER) | **74** Q + **6** S2 prompts | `js/data-seed.js`. S1=32, S2=6, S3=42. |
| ReadyMCAT (`notAidven/mcat-study-engine`) | `/tmp/peer-banks/readymcat.json` | **CC BY-SA 4.0** (ReadyMCAT items); Anki engine AGPL-3.0 | **1112** scored items | Discrete MCQ 414 (+ 948 teach-on-miss), FR 410, passage Q 251 in 51 sets, diagnostic 37. |
| **All four banks** | | | **2786** exam-style items | 1294 + 300 + 74 + 6 S2 + 1112. Excludes 948 ReadyMCAT teach-on-miss ladders and 30 OpenMCAT passage texts. |

## 1. Open-MCAT — `mlmacdiarmada/Open-MCAT`

- **Clone:** `/tmp/peer-repos/Open-MCAT`
- **Live site:** https://mlmacdiarmada.github.io/Open-MCAT/
- **Content license:** CC BY-NC 4.0 (`CONTENT-LICENSE.md`). © 2026 Makenzi L. McDermott. Original work; attribution + non-commercial required.
- **Code license:** MIT (`LICENSE`).
- **Source path:** `app.html` `const BANK=[...]` (lines ~475–2662). `index.html` has **no** BANK array.
- **Quizzes:** 288
- **Flattened questions:** 1294
- **By sectionCode:** `{'P/S': 787, 'B/B': 329, 'C/P': 158, 'CARS': 20}`
- **By AAMC categoryCode:** `{'10A': 11, '1A': 44, '1B': 54, '1C': 41, '1D': 45, '2A': 18, '2B': 14, '2C': 9, '3A': 33, '3B': 71, '4A': 29, '4B': 14, '4C': 15, '4D': 14, '4E': 16, '5A': 21, '5B': 10, '5D': 19, '5E': 16, '6A': 258, '6C': 57, '7A': 118, '7B': 151, '7C': 118, '8A': 8, '8B': 11, '8C': 17, '9A': 15, '9B': 10, 'GC': 4, 'HUM': 10, 'RM': 13, 'SS': 10}`
- **Records missing required 4-choice/why/takeaway:** 0
- **Record schema:** `{source, id, quizId, section, sectionCode, category, categoryCode, idea, tag, stem, choices[4], answerIndex, rationale, why[4], takeaway}` plus `passage` when the quiz is a CARS set.
- **ID mapping:** `id` = `{quizId}::q{n}` (1-based within the quiz). Matches the app's `questionId` convention (`idea::…`). `answerIndex` is the stored 0-based `answer` field.
- **Not extracted:** `DRILLS` (procedural formula generators, not a static item bank); resource/Anki-deck *links* (MileDown etc. are recommendations only, not stems).

## 2. OpenMCAT — `Zushah/OpenMCAT`

- **Clone:** `/tmp/peer-repos/OpenMCAT`
- **License:** GNU Affero GPL v3.0 (`LICENSE.md`).
- **Source paths:**
  - `/tmp/peer-repos/OpenMCAT/src/data/bank/cp.json`
  - `/tmp/peer-repos/OpenMCAT/src/data/bank/bb.json`
  - `/tmp/peer-repos/OpenMCAT/src/data/bank/ps.json`
- **Output:** `/tmp/peer-banks/openmcat.json` with `banks` metadata, `passages`, `questions` (full stored fields), plus aliases `correct` (= `correctChoiceId`), `topics` (= `testedTopicIds`), `skills`/`SIRS` (= `testedSkillIds`).
- **ID mapping:** stored `id` values (`q1`…`q100`) repeat across the three section files. Added `uid` = `{sectionId}:{id}` (e.g. `cp:q1`) for globally unique conversion keys. Passage `id`s (`p1`…`p10`) similarly repeat; each passage object also has `sectionId`.
- **Questions:** 300  |  **Passages:** 30
- **By section:** `{'cp': 100, 'bb': 100, 'ps': 100}`
- **By type:** `{'discrete': 150, 'passage_based': 150}`
- **SIRS skill hits:** `{'sirs_2': 220, 'sirs_1': 127, 'sirs_4': 84, 'sirs_3': 40}`
- **SIRS mapping (AAMC science inquiry skills):**
  - `sirs_1` — Knowledge of Scientific Concepts and Principles
  - `sirs_2` — Scientific Reasoning and Problem Solving
  - `sirs_3` — Reasoning about the Design and Execution of Research
  - `sirs_4` — Data-based and Statistical Reasoning
- **Note:** Banks are AI-generated OpenMCAT practice (`session.aiModel` recorded per bank). Items include `selfCheck.noOfficialMaterialCopied: true`. Not AAMC official content.

## 3. GAMSAT Trainer — `Jdawg888/gamsat-trainer`

- **Clone:** `/tmp/peer-repos/gamsat-trainer`
- **License:** no LICENSE file. README states every item is **original** (ACER papers are copyrighted and not reproduced).
- **Source path:** `/tmp/peer-repos/gamsat-trainer/js/data-seed.js` (CommonJS `module.exports`).
- **S1 (humanities reasoning):** 32 MCQs
- **S2 (written communication):** 6 essay prompts (Task A/B), including sample essays on the first prompt
- **S3 (bio/chem/phys):** 42 MCQs (standalone + clustered stimulus sets)
- **principle_explanation present:** 74 / 74
- **memory_tip present:** 74 / 74
- **Output:** `/tmp/peer-banks/gamsat-trainer.json` → `{sections, questions[], essayPrompts[]}` with full stored fields.

## 4. ReadyMCAT — `notAidven/mcat-study-engine`

- **Clone:** `/tmp/peer-repos/mcat-study-engine` (Anki fork + ReadyMCAT overlay).
- **Engine license:** AGPL-3.0 (`LICENSE`).
- **Content license:** CC BY-SA 4.0 for original ReadyMCAT items (stated in `readymcat/content/*_SOURCES.md` and `diagnostic/diagnostic_quiz.json`).
- **Authoring:** original stems grounded in OpenStax / LibreTexts / public-domain texts; AAMC outline used **only** for category IDs/names. Explicitly not UWorld/Kaplan/Blueprint/AAMC paid items. Independent of MileDown/Aidan Anki decks.
- **Anki blobs:** none under `readymcat/` (no `.apkg` / `.anki2` / `.colpkg`). JSON/markdown sources exist, so no STATUS stub was needed.
- **JSON files ingested:**
  - `readymcat/content/bio_biochem.json`
  - `readymcat/content/chem_phys.json`
  - `readymcat/content/free_response_bio_biochem.json`
  - `readymcat/content/free_response_chem_phys.json`
  - `readymcat/content/free_response_psych_soc.json`
  - `readymcat/content/passage_bio_biochem.json`
  - `readymcat/content/passage_cars.json`
  - `readymcat/content/passage_chem_phys.json`
  - `readymcat/content/passage_psych_soc.json`
  - `readymcat/content/psych_soc.json`
  - `readymcat/content/question_bank.json`
  - `readymcat/diagnostic/diagnostic_quiz.json`
- **`question_bank.json`:** merge of the three discrete MCQ files (`count` claimed 414; extracted discrete 414). Items not duplicated in the output.
- **Discrete MCQ:** 414  (`{'B/B': 152, 'C/P': 115, 'P/S': 147}`) + 948 subquestions
- **Free response:** 410  (`{'B/B': 151, 'C/P': 115, 'P/S': 144}`)
- **Passage sets:** 51  (`{'B/B': 12, 'C/P': 12, 'P/S': 12, 'CARS': 15}`) containing 251 questions
- **Diagnostic:** 37 items covering all 31 AAMC content categories
- **CARS passages:** `passage_cars.json` cites public-domain / original sources per `passage_source` (e.g. Gutenberg Russell 1912). Included as legally usable.

## AAMC category code mapping

ReadyMCAT `taxonomy.json` and Open-MCAT `categoryCode` both use the public AAMC “What’s on the MCAT Exam?” IDs (1A–10A). Names:

| Code | AAMC content category |
|---|---|
| 1A | Structure and function of proteins and their constituent amino acids |
| 1B | Transmission of genetic information from the gene to the protein |
| 1C | Transmission of heritable information from generation to generation and the processes that increase genetic diversity |
| 1D | Principles of bioenergetics and fuel molecule metabolism |
| 2A | Assemblies of molecules, cells, and groups of cells within single cellular and multicellular organisms |
| 2B | The structure, growth, physiology, and genetics of prokaryotes and viruses |
| 2C | Processes of cell division, differentiation, and specialization |
| 3A | Structure and functions of the nervous and endocrine systems and ways these systems coordinate the organ systems |
| 3B | Structure and integrative functions of the main organ systems |
| 4A | Translational motion, forces, work, energy, and equilibrium in living systems |
| 4B | Importance of fluids for the circulation of blood, gas movement, and gas exchange |
| 4C | Electrochemistry and electrical circuits and their elements |
| 4D | How light and sound interact with matter |
| 4E | Atoms, nuclear decay, electronic structure, and atomic chemical behavior |
| 5A | Unique nature of water and its solutions |
| 5B | Nature of molecules and intermolecular interactions |
| 5C | Separation and purification methods |
| 5D | Structure, function, and reactivity of biologically relevant molecules |
| 5E | Principles of chemical thermodynamics and kinetics |
| 6A | Sensing the environment |
| 6B | Making sense of the environment |
| 6C | Responding to the world |
| 7A | Individual influences on behavior |
| 7B | Social processes that influence human behavior |
| 7C | Attitude and behavior change |
| 8A | Self-identity |
| 8B | Social thinking |
| 8C | Social interactions |
| 9A | Understanding social structure |
| 9B | Demographic characteristics and processes |
| 10A | Social inequality |

Open-MCAT additionally uses `sectionCode` ∈ `{C/P, B/B, P/S, CARS}` and maps ideas onto these codes. OpenMCAT banks use topic IDs (`cp_*`, `bb_*`, `ps_*`) plus SIRS skills rather than 1A–10A codes.

### Open-MCAT codes that are not AAMC 1A–10A

| Code | Section | Meaning in this bank |
|---|---|---|
| HUM | CARS | Humanities passages |
| SS | CARS | Social Sciences passages |
| GC | C/P | Author tag “General chemistry” (stoichiometry); maps nearest to **5D/5E** conceptually |
| RM | P/S | Research methods & statistics (cross-cutting skill, not a numbered AAMC content category) |

Open-MCAT has **no items tagged 5C** (separations) or **6B** (making sense of the environment). ReadyMCAT discrete MCQs cover **all 31** AAMC content categories.

### ReadyMCAT item `aamc_category`

Every discrete MCQ, free-response item, and diagnostic item carries `aamc_category` matching the table above. Passage science sets also tag each nested question. CARS passage questions use `aamc_category: "CARS"` plus a CARS skill (`comprehension` / reasoning).

## Output paths

- `/tmp/peer-banks/open-mcat.json`
- `/tmp/peer-banks/openmcat.json`
- `/tmp/peer-banks/gamsat-trainer.json`
- `/tmp/peer-banks/readymcat.json`
- `/tmp/peer-banks/MANIFEST.md`


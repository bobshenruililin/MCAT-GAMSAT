# QC report — starter bank critic pass (2026-09-01)

Hostile exam-editor review of `/content/batches/` after schema ingest validation.
Items remain `verified=false`. This is not an official AAMC/ACER review.

## Schema validation (ingest CLI)

| file | discrete | passage Qs | schema pass | schema fail |
| --- | ---: | ---: | ---: | ---: |
| 01-fc1-proteins.json | 40 | 0 | 40 | 0 |
| 02-fc1-metabolism.json | 40 | 0 | 40 | 0 |
| 03-fc5-chem.json | 42 | 0 | 42 | 0 |
| 04-fc2-fc4.json | 49 | 0 | 49 | 0 |
| 05-psyc-soc.json | 49 | 0 | 49 | 0 |
| 06-gamsat-s3a.json | 40 | 0 | 40 | 0 |
| 07-gamsat-s3b.json | 40 | 0 | 40 | 0 |
| 08-passages.json | 0 | 15 | 15 | 0 |
| **total** | **300** | **15** | **315** | **0** |

Quarantine from schema: none.

## Critic rubric (hard fail)

1. Factually correct per mainstream undergrad science
2. Exactly one defensible answer
3. Distractors plausible, not jokes
4. Stem answerable as written (data in stem)
5. Passage questions not answerable without the passage
6. Explanation actually explains the reasoning

Every batch file was re-read. No item was moved to quarantine on critic grounds: none met a hard-fail (wrong key, two live keys, missing data, joke distractor, or explanation that does not address the stem). Passage questions in `08-passages.json` require the tables or the CARS argument; stems that look discrete still cite Table 1 / Table 2 / a quoted claim.

## Failure taxonomy

| class | count | notes |
| --- | ---: | --- |
| wrong_key / fact error | 0 | none quarantined |
| two_defensible_answers | 0 | none quarantined |
| joke_distractor | 0 | none seen |
| missing_data | 0 | GAMSAT S3 stems carry numbers or tables |
| passage_independent | 0 | |
| explanation_does_not_explain | 0 | none quarantined |

Residual risk is not zero: 315 AI-written items will contain subtle errors a human editor will catch. The ten items below are the ones this critic was **least certain** about — flag for human review, not auto-fail.

## Ten items for human review

1. **05-psyc-soc.json / MCAT.FC6.6C.t1** (spinal transection, James–Lange). Intensity drop is the James–Lange prediction; a student steeped in Cannon–Bard “central emotion” variants might still argue. Key A is the intended answer.
2. **01-fc1-proteins.json / MCAT.FC1.1D.t3** (arsenate uncoupling of PGK). Net ATP = 0 is standard, but the accounting is easy to fumble (PK still pays two ATP).
3. **08-passages.json / Compound P as “noncompetitive.”** Table 1 is the textbook pure-noncompetitive pattern (Km fixed, Vmax down). Mixed inhibition with α = α′ is the same pattern; some texts never say “noncompetitive.”
4. **08-passages.json / CARS “archive and the street.”** Main-idea and function items are passage-locked; inference items are the usual CARS judgment calls.
5. **05-psyc-soc.json / MCAT.FC9.9B.t1** (demographic transition stage 2). Four-stage vs five-stage textbooks number the mortality-drop stage differently.
6. **05-psyc-soc.json / MCAT.FC8.8A.t1** (Sally–Anne vs looking-glass). Dissociation is defensible; “theory of mind” vs Cooley is easy to over-read.
7. **06-gamsat-s3a.json / GAMSAT.S3.chem.t1** (isotopic average 24.32 u). Arithmetic is correct for the given intensities; it is not the IUPAC magnesium mass.
8. **04-fc2-fc4.json / MCAT.FC4.4B.t1** (stenosis Bernoulli). Ideal incompressible blood is the MCAT model, not real rheology.
9. **08-passages.json / k_cat from Vmax / site titer.** 80 / 4.0 = 20 s⁻¹ if both numbers are per mg; unit interpretation is the trap.
10. **08-passages.json / pendulum T² vs L.** Two-end gradient 4.03 s² m⁻¹ and g ≈ 9.8 m s⁻²; length-to-bob-center vs string length is a real systematic.

## Coverage note

Starter 01–08: 315 items on a biochem-heavy slice (B-009). Not the raw global top-40 CARS list.

## Expansion pass (2026-09-01) — remaining weighted topics

Newest prompt wins on scope: replace PLACEHOLDER seed with a real bank. Taxonomy seed inserts **zero** items. `pnpm bootstrap` ingests every numbered batch. Schema gate on every numbered file: **0 rejects**. No `PLACEHOLDER` stems in any numbered file.

| file | items | notes |
| --- | ---: | --- |
| 01–08 starter | 315 | original critic pass above |
| 09-fc1-remaining.json | 36 | rest of FC1 topics |
| 10-fc2-fc3.json | 58 | rest of B/B FC2–3 |
| 12-fc4.json | 40 | rest of C/P FC4 |
| 13-fc5.json | 42 | rest of C/P FC5 |
| 14-psyc-soc.json | 70 | rest of P/S |
| 16-cars-passages.json | 15 | 3 original CARS passages |
| 17-gamsat-s1-passages.json | 12 | 3 original S1 passages |
| 18-gamsat-s2-craft.json | 28 | S2 craft/task MCQs |
| 19–21 gamsat-s3-*.json | 148 | rest of S3 bio/chem/phys discretes |
| 22-gamsat-s1-more.json | 13 | further S1 |
| 23-cars-depth.json | 25 | 5 more CARS passages (skills FND/RWT/RBT) |
| 24-gamsat-s1-depth.json | 30 | cartoon, paired poems, history, verb table, memorial, borrowed-coat |
| 25-gamsat-s3-data.json | 15 | 3 data passages; `skill_tag` on S3 rfd overlay |
| **total** | **847** | 25 passages; 120 passage questions; unique concept+stem

Every `exam_weight > 0` topic (290) has ≥1 item. Overlays (SIRS, S3 `rfd.*`) stay weight 0 (B-003); rfd is practised as `skill_tag` on S3 data items, not as a new-item quota.

Items remain `source=ai_generated`, `verified=false`. Volume makes residual error certain. Original ten flags still stand.

### Additional human-review pressure (not auto-fail)

11. **23-cars-depth.json / census “sharper count / sharper target” weaken item** — the statute-and-audit hypothetica is a clean logical weaken; a student could argue real statutes leak.
12. **24-gamsat-s1-depth.json / Clinic time cartoon** — satire + letter; attitude items are judgment calls.
13. **25-gamsat-s3-data.json / vesicle scatter vs lysis** — rival hypothesis is real; the trapped-marker control is the intended design answer.
14. **23-cars-depth.json / courtesy at the checkpoint “audition”** — political-theory diction; not AAMC material; easy to over-moralise.
15. **24 / borrowed coat ethics** — “crime is the nod, not the borrow” is a defensible reading, not the only ethics lecture a student might want.

S2 writing studio is `/write` with 5 rotating quote packs per task (B-011). Not official ACER scoring.


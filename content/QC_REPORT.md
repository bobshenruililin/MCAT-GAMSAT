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

Forty topics were chosen as a **biochem-heavy spread across MCAT FC1–10 plus GAMSAT S3**, not the raw global top-40 by `exam_weight` (that list is almost all CARS). See `TARGET_TOPICS.json` and BLOCKERS B-009.

# Content sources — sit-able bank

Personal single-user study copy. **Never `verified=true`.** Not AAMC, not ACER, not UWorld, not Jack Westin, not Kaplan, not MileDown.

Hand-authored items in `content/batches/01-*.json` … `25-*.json` were written in this repo.

Peer items were converted through `src/peers` into `content/batches/30-peer-*.json`. Depth fill (`40-depth-*.json`) is factory-style AI to reach **8 items per weighted topic**.

| Origin | Upstream | License | What we took |
|---|---|---|---|
| Open-MCAT | [mlmacdiarmada/Open-MCAT](https://github.com/mlmacdiarmada/Open-MCAT) | Content **CC BY-NC 4.0** © 2026 Makenzi L. McDermott; code MIT | Original MCQs + CARS passages from `app.html` BANK |
| OpenMCAT | [Zushah/OpenMCAT](https://github.com/Zushah/OpenMCAT) | **AGPL-3.0** | `src/data/bank/{cp,bb,ps}.json` — AI practice, `selfCheck.noOfficialMaterialCopied` |
| ReadyMCAT | [notAidven/mcat-study-engine](https://github.com/notAidven/mcat-study-engine) | Items **CC BY-SA 4.0**; engine AGPL-3.0 | Discrete MCQ, passages (incl. public-domain CARS), diagnostic, FR→MCQ, teach-on-miss 4-choice ladders. Grounded in OpenStax / LibreTexts; AAMC codes used only as category IDs |
| GAMSAT Trainer | [Jdawg888/gamsat-trainer](https://github.com/Jdawg888/gamsat-trainer) | No LICENSE file; README: original, not ACER | S1/S3 MCQs, short-answer→MCQ, S2 quote prompts as craft MCQs |

## Share-alike / non-commercial

- **CC BY-NC (Open-MCAT):** this personal study copy is non-commercial. Do not sell the converted items.
- **CC BY-SA (ReadyMCAT items):** converted ReadyMCAT rows remain ShareAlike. Attribution is in each item's explanation and in this file.
- **AGPL (OpenMCAT):** the converted JSON is a transformed copy of AGPL-licensed data; this repo already ships the player source.

## What we did not import

AAMC Official Prep, ACER papers, UWorld, Jack Westin, Kaplan QBank, MileDown/AnKing card text, collingeorge/MCAT (MileDown-derived).

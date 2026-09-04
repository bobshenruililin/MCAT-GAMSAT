# Item structure — what we adopted from peers

Ingest schema in `docs/SCHEMA.md` is law. This note records which peer fields we **folded in** without adding columns, and which we refused.

## Keep (this repo)

| Field | Rule |
|---|---|
| `concept_id` | Must be a taxonomy **topic** |
| `type` | `discrete` or `passage_question` |
| `stem` | Non-empty; HTML stripped on import |
| `choices` | Exactly four `{key,text}` A–D |
| `correct_key` | One of A–D |
| `explanation` | ≥ 40 words; includes takeaway + attribution |
| `distractor_rationales` | The **three wrong keys only** |
| `difficulty_est` | `[0,1]` |
| `skill_tag` | Optional. SIRS1–4, `teach_on_miss`, GAMSAT `rfd.*` |
| `verified` | Always **false** in software |

## Adopted from peers (no schema change)

- **Open-MCAT `why[4]` + `takeaway`:** `why` for wrong keys → `distractor_rationales`. `takeaway` is appended to `explanation`.
- **OpenMCAT `choiceExplanations` + SIRS:** wrong-key texts → rationales; `testedSkillIds` `sirs_1`…`sirs_4` → `skill_tag` `SIRS1`…`SIRS4`. Passage tables/figures flattened into passage `body`.
- **ReadyMCAT attribution + teach-on-miss:** source name/URL folded into `explanation`. 4-choice subquestions imported as extra discretes with `skill_tag=teach_on_miss`. Free-response converted to A–D using the model answer plus three other answers from the same AAMC category (still `verified=false`).
- **gamsat-trainer `principle_explanation` + `memory_tip`:** padded into `explanation`. Short-answer items converted to A–D the same way as ReadyMCAT FR. S2 quote sets become Task A/B craft MCQs (not ACER marking).

## Refused

- Fake 118–132 or GAMSAT percentiles (NORTH_STAR: only AAMC/ACER in SCOREBOARD).
- Consecutive same-topic teach ladders (interleave invariant). Teach-on-miss is a **chooser mode** that *prefers* tagged items, then still interleaves topics.
- `verified=true` on any peer or factory row.
- Copying AAMC/ACER/UWorld/Jack Westin/Kaplan/MileDown stems.

## Session UI modes (human chooses)

Stored in `localStorage` key `exam-morning-mode-v1`:

1. **Orbs** — family path (default).
2. **Catalog** — table of families with item counts.
3. **Formats** — Discrete / Passage / S2 tiles.
4. **Ladders** — prefer `teach_on_miss` and SIRS-tagged items.

Graphs live at `#/graphs` (code-drawn SVG bars: family, origin, depth, landscape).

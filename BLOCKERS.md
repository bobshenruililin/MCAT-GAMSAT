# BLOCKERS

Open questions. Agents append; only the human resolves.

## Open

### B-001 — Three-level schema vs four-level AAMC outline
Schema `level` is only `section | category | topic`. AAMC is exam-section → FC → content category → topic. Night-sprint-01 maps `section` = FC (or CARS/SIRS/GAMSAT section), `category` = content category, `topic` = AAMC topic heading. Exam sections (B/B, C/P, P/S, CARS) are not rows; their 0.25 shares are folded into `exam_weight`. Human: confirm or add a fourth level.

### B-002 — FC weights: prompt example vs current AAMC PDF
Prompt example said B/B FC1 ~65%. Current AAMC "What's on the MCAT Exam" PDF (fetched 2026-09-01) lists B/B FC1 55% / FC2 20% / FC3 25%, and C/P as FC4 40% / FC5 60% (no FC1/FC3 on C/P). Taxonomy uses the current PDF. Human: confirm.

### B-003 — Overlay trees have exam_weight 0
SIRS 1–4 and GAMSAT S3 `reasoning_from_data` overlay every item (via `skill_tag` or extra practice). New-item ranking uses `(1-mastery)*exam_weight`, so weight 0 excludes them from the new-item quota. Human: confirm, or assign a non-zero overlay budget.

### B-004 — Category/topic weight split
AAMC publishes FC percents, not per-category or per-topic percents. v1 splits an FC's weight equally across its content categories, then equally across that category's topics. Human: replace with a better prior if you have one.


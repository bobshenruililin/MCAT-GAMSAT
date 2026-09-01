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

### B-005 — MINI_SPEC vs Prompt 2 on mastery roll-up and newCap
MINI_SPEC says do not roll up mastery to parents in v1, and default `new_item_quota` is 8. Prompt 2 requires parent mastery rolled up by `exam_weight` and assembler `newCap=15`. Prompt 2 wins on scope. Human: amend MINI_SPEC if the roll-up should become the written law.

### B-006 — Diagnostic sampling grain
Prompt 3: “up to 3 items per MCAT foundational-concept category and per GAMSAT section category.” v1 samples `concepts.level = category` with `exam_weight > 0` (content categories, not FC `section` rows; overlays with weight 0 are skipped). Hard cap 90; early-stop after 3 per category. Human: confirm, or sample at FC/section instead.

### B-007 — Unsampled prior shrink
Prompt 3: unsampled siblings inherit parent estimate shrunk toward 0.3. v1 uses `0.5 * parentEst + 0.5 * 0.3`. Human: confirm the mix, or name a different shrink.

### B-008 — Weakest-10 sort key
Diagnostic summary ranks nodes by `mastery * exam_weight` ascending, skipping weight 0. Low-weight topics at the 0.3 prior outrank higher-weight unseen FCs. Human: confirm, or rank by mastery only (weight as display).



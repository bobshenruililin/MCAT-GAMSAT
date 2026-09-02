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

### B-009 — Starter bank is not the raw global top-40
Prompt 4 asked for the 40 highest `exam_weight` topic nodes. That list is almost all CARS. v1 instead took a biochem-heavy spread: 10 FC1 topics, 6 FC5, 7 from FC2/3/4, 7 P/S (FC6–10), 10 GAMSAT S3, plus 3 passages (bio/biochem experiment, CARS, GAMSAT physics). See `content/batches/TARGET_TOPICS.json`. Human: confirm, or force a CARS-majority bank.

### B-010 — Section time budgets for pacing
Stretch pacing uses 95s (MCAT science), 102s (CARS, 90 min / 53), 120s (GAMSAT S3, 150 min / 75). These are study pacing heuristics, not official scoring rules. Human: replace with your preferred per-section budgets.

### B-011 — GAMSAT S2 is production, not only retrieval
NORTH_STAR says studying means answering questions. S2 on the real paper is timed writing. v1 keeps S2 craft as MCQs in the bank and adds `/write` as a local timed studio with a self-rubric (not an official score, not `verified` essays). Human: confirm this split, or forbid the studio as out of scope.

### B-012 — Section-track sessions defer other-section dues
Today can start a CARS / B/B / C/P / P/S / S1 / S2 / S3 block. Due cards from other families wait until a Mixed session or a matching block. That matches exam-morning sitting; it can also let a neglected section’s FSRS due pile up. Human: confirm, or force Mixed to drain all dues first.

### B-013 — 500× factory volume is still unverified AI
The score-max factory emits 423,500 additional ingest-valid items (code-checked calculations, sibling-discrimination conceptuals, combinatorial CARS/S1 passages, S2 craft, experimental tables). Pattern drills default to 12,000. NORTH_STAR still forbids `verified=true` without a human or official anchor. Volume raises poison surface. Human: study a slice and QC; do not treat factory output as AAMC/ACER; optionally cap bootstrap with `FACTORY_TARGET` / `PATTERN_TARGET` if the SQLite file is too large for this machine. Cap `FACTORY_TARGET=84700` to keep the previous 100× size.

### B-014 — No pre-reveal hints (Khan conflict)
Khan Academy often offers hints before the student commits an answer. NORTH_STAR requires confidence 1–5 before reveal; a hint is rereading and would leak the solution path. v1 refuses in-item hints, energy points, avatars, video-as-study, and classrooms. Human: keep this refusal, or name a hint format that cannot leak the key.

### B-015 — True CARS consecutive-passage sitting vs interleave
A real CARS/S1 paper is consecutive questions on one passage. NORTH_STAR forbids two consecutive same-topic items. v1 structure tests match sitting *coverage and section timing* (round-robin families, cap ~20, summary uses that family's seconds budget) and still run the existing interleave pass. They are not cloned AAMC/ACER papers and not same-topic bursts. Human: keep interleave on structure tests, or name a passage-locked sitting that still protects against rereading.





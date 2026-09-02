# STATE

Phase: 10× generated bank is on main; local study history wiped
Study days logged: 0 human. Demo is not study. SCOREBOARD official table empty.
Done: PRs #1–#12 on main. Factory default is HAND_BANK×5000 = 4,235,000; pattern drills 120,000; floor 2000/topic. Emit streams per topic (no 4.2M in-memory bank). This VM: `pnpm db:reset` (attempts/sessions/fsrs 0). Tests 109.
In flight: none.
Next: human — `pnpm db:reset && pnpm bootstrap` to ingest the 10× bank (very large SQLite). Cap `FACTORY_TARGET=84700 PATTERN_TARGET=2400` for 100×, or `423500`/`12000` for 500×. QC a slice (B-013). Sit official papers. Open: B-001–B-015.
Counts: taxonomy 376 (290 weighted topics). Full bootstrap now ~847 hand + 4,235,000 factory + 120,000 pattern. verified=true 0.
Risks: 4.35M unverified AI (B-013); templates still recycle cover stories with a run index; default bootstrap SQLite is huge; this VM did not ingest the full 4.2M

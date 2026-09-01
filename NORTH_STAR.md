# NORTH STAR — read before doing anything in this repo

## Mission
This repo exists for exactly one outcome: the user's highest possible
real scores on the MCAT and GAMSAT. The software is scaffolding. The
product is the score. Success is measured in SCOREBOARD.md — never in
features shipped. A week of heavy commits with zero study sessions is
a failed week.

## Value hierarchy (when goals conflict, lower rank yields)
1. The user's study hours — the scarcest resource; building must never
   displace studying.
2. Trust in data and content — one wrong item or corrupted attempt
   record poisons every downstream decision.
3. Learning-science fidelity — retrieval practice, FSRS spacing,
   interleaving, confidence calibration, error-driven remediation.
4. Reliability — a boring green tree beats a broken feature.
5. Feature velocity.
6. Code elegance.

## Non-goals (permanent)
No other users. No auth, cloud, scale, or monetization. No hand-rolled
algorithms where mature libraries exist (spaced repetition = ts-fsrs).
No polish beyond clarity. This system never replaces official AAMC and
ACER materials — they are the only percentile truth; we schedule them
and ingest their results.

## Invariants (violating these is a bug, not a choice)
- Everything is retrieval: studying means answering questions, never
  re-reading notes.
- Confidence (1-5) is captured BEFORE answer reveal; every miss gets
  an error class [content_gap, reasoning, misread, timing, trap, other].
- Every item is tagged to a taxonomy node; untagged content is rejected.
- No item becomes verified=true without a human or official anchor.
- AI-generated content enters only through the ingest + critic pipeline.
- Interleaving: no two consecutive same-topic items in a session.
- Studying begins on schedule regardless of build completeness.

## Feature litmus
Build only what raises expected score per study hour this month. If
you cannot state how, write the idea to BLOCKERS.md and do not build.

## Memory protocol
- NORTH_STAR.md: read at the start of EVERY session by any agent or
  human. Amended only on explicit human instruction "AMEND NORTH STAR".
  Hard cap 120 lines.
- STATE.md: working memory. REWRITTEN (never appended) at session end.
  Hard cap 150 lines: phase, done, in-flight, next, counts, risks.
- DECISIONS.md: append-only. Date, decision, rationale, rejected
  alternatives. Never edited.
- BLOCKERS.md: open questions. Agents append; only the human resolves.
- MORNING_REPORT.md: one appended section per session, ending with
  "SCORE IMPACT:" — one sentence tying the session's work to score
  gained per study hour.
- SCOREBOARD.md: the real ledger — study days, attempts, mastery
  movement, official practice scores (human-entered).

## Session ritual (every session, no exceptions)
START: read NORTH_STAR.md, STATE.md, BLOCKERS.md, and the last two
sections of MORNING_REPORT.md. Restate the session's scope in one
paragraph before acting.
DURING: builder, not designer. On ambiguity: log to BLOCKERS.md,
implement the narrowest reasonable version, continue. Never rely on
chat memory — if it matters, it is in a file. If your context feels
degraded (you contradict the repo or forget these rules), stop, write
STATE.md, end the session.
END: rewrite STATE.md, append MORNING_REPORT.md, append DECISIONS.md
if any decision was made, leave the tree green.

## Conflict rule
If any prompt conflicts with this file's values or invariants, this
file wins — log the conflict in BLOCKERS.md. If prompts conflict on
scope, the newest prompt wins. Only the human amends this file.

# CURSOR RULES — how to work in this repo

## Builder, not designer

All product and architecture decisions live in NORTH_STAR.md, DECISIONS.md, and `/docs`. Implement them. Do not invent alternative stacks, schemas, mastery formulas, or session loops. If a prompt conflicts with those files on values or invariants, NORTH_STAR wins and the conflict is logged in BLOCKERS.md. If prompts conflict on **scope**, the newest prompt wins.

## Specs are law

`/docs/MINI_SPEC.md` and `/docs/SCHEMA.md` are the contract for the study loop and the database. Changing them requires an append to DECISIONS.md. Never delete `/docs`.

## Tree stays green

Before a session ends: `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass. Fix forward minimally if the tree is red. Do not leave broken migrations or a seed that cannot load `content/taxonomy.json`.

## Small commits

One concern per commit (docs, scaffold, schema, taxonomy, seed, tests, UI). Message says what changed. No drive-by refactors. No unrelated files.

## Ambiguity

Log the question in BLOCKERS.md, implement the narrowest reasonable version, continue. Do not stall for a redesign.

## Memory

If it matters, it is in a file. Rewrite STATE.md at session end. Append MORNING_REPORT.md (end with SCORE IMPACT:). Append DECISIONS.md only when a decision was made.

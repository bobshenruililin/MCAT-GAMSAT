# Numbered ingest batches

`pnpm ingest:all` and `pnpm web:build` read every `NN-*.json` in this folder
(not `factory/`, which is gitignored emit output).

| Range | What |
| --- | --- |
| `01–25` | Hand-authored. **11 and 15 were never used** — do not invent filler files. |
| `30–33` | Converted peer banks (`pnpm peers:emit`). |
| `40–41` | Depth fill to 8 items per weighted topic. |
| `factory/` | Optional local factory/pattern JSON. Not the website bank. |

`HAND_BANK` in `src/factory/types.ts` stays **847** (hand only) so factory 5000×
math does not multiply the merged 5,466-item website bank.

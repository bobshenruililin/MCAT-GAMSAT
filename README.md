Read NORTH_STAR.md first. It governs this repo.

# Exam morning — local MCAT & GAMSAT retrieval

One user. No cloud. Studying means answering questions. Success is measured in
SCOREBOARD.md (also at `/scoreboard`), never in features shipped.

## Sit today

Paste **one block**. Wait until it finishes. Do not type `y` on a new line —
that is a new command. If brew asks `[y/n]`, press **n** (Node is already
installed on this Mac). Intel Homebrew is `/usr/local`, not `/opt/homebrew`.

```bash
cd ~/MCAT-GAMSAT
git pull origin main
bash scripts/mac-setup.sh
```

That script puts Homebrew on PATH and activates pnpm. It does not install or
upgrade Node. Then, only after it prints a pnpm version:

```bash
pnpm install
FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap
pnpm sit
```

Open **http://localhost:3000** in Safari or Chrome (not Cursor). Next 16 also
allows `http://127.0.0.1:3000`. `pnpm sit` is `build` then `start` — use
`pnpm dev` only while editing. An M3 Pro running this locally is the study
machine; Cursor Cloud is not.

`pnpm bootstrap` loads taxonomy, the hand-authored batches, the 5000× factory bank
(4,235,000 extra items), and 120,000 past-paper pattern drills. That SQLite file is
very large. Smaller caps:

```bash
FACTORY_TARGET=0 pnpm bootstrap                 # hand bank + patterns only
FACTORY_TARGET=84700 PATTERN_TARGET=2400 pnpm bootstrap   # previous 100× size
FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap # previous 500× size
```

Pattern volume defaults to 120000 (`PATTERN_TARGET`). Do not run `pnpm demo:seed`
if you are about to study — demo attempts are not study and must not be copied
into SCOREBOARD.md. `pnpm db:reset` wipes the local database.

Official percentiles: sit AAMC/ACER papers, then add a row to `SCOREBOARD.md`.
The app syncs the study log from real daily/diagnostic attempts. It never writes
a percentile.

## Surfaces

| Route | What it is |
| --- | --- |
| `/` | Lesson home — one Continue, 7-family path, Up Next. Bank/forecast/extra sittings behind details |
| `/atlas` | Exam map — family → FC → category → topic, designed vs live bank, 18 past-paper moves |
| `/session/[id]` | Retrieval player (confidence before reveal; error class on every miss) and session summary |
| `/progress` | Taxonomy tree, weakest topics, calibration / pacing / trend |
| `/write` | GAMSAT S2 timed studio (self-rubric, not an official score) |
| `/scoreboard` | Official table from SCOREBOARD.md + live study log |
| `/health` | SQLite path and row counts |

## Website (the product)

**https://bobshenruililin.github.io/MCAT-GAMSAT/**

Open in Safari or Chrome. Click **Continue** or a family orb. That is the
sitting. Ledger is `localStorage` on this device. No clone, no Node, no Cursor.

The public site ships the hand-authored bank (847 items). Factory millions stay
optional local SQLite — they made Continue slow. Software still never sets
`verified=true`.

Rebuild the site: `pnpm web:build`. GitHub Pages publishes `main` `/docs`.

## Optional local factory (not required to sit)

The Next.js app on localhost still exists for the 4.3M factory bank.

## Sit on your computer (not in Cursor)

Cursor is only an editor. Studying is Terminal + a browser.

```bash
git clone https://github.com/bobshenruililin/MCAT-GAMSAT.git
cd MCAT-GAMSAT
bash scripts/mac-setup.sh
pnpm install
FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap
pnpm sit
```

Leave that terminal running. In **Safari or Chrome** (any window, not the
Cursor Simple Browser) open **http://localhost:3000** and hit Continue.
Closing Cursor does not stop the site unless you also stop that terminal.

Paste one block and wait. Intel `brew` lives in `/usr/local` (not
`/opt/homebrew`). If brew already has Node, skip `brew install node` — press
**n** at `[y/n]`. `pnpm sit` skips Next dev compilation. github.io is the door;
the quiz is local SQLite.

## Invariants the UI must keep

- Confidence 1–5 before the key or explanation is shown.
- Every miss needs an error class before Next.
- No two consecutive same-topic items in a session (structure sittings still interleave).
- `verified=true` only with a human or official anchor.

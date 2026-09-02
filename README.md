Read NORTH_STAR.md first. It governs this repo.

# Exam morning — local MCAT & GAMSAT retrieval

One user. No cloud. Studying means answering questions. Success is measured in
SCOREBOARD.md (also at `/scoreboard`), never in features shipped.

## Sit today

First time on a Mac, Terminal does not have `pnpm` until you install Node
(Cursor's Node is not on this PATH):

```bash
xcode-select --install
brew install node
corepack enable
corepack prepare pnpm@10.33.3 --activate
```

Apple Silicon, if `brew` is still not found:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

If you already cloned, stay in **one** folder (`~/MCAT-GAMSAT`). Do not clone
again inside it. Then:

```bash
bash scripts/mac-setup.sh
pnpm install
pnpm db:migrate
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

## Website (outside Cursor)

Public door: **https://bobshenruililin.github.io/MCAT-GAMSAT/**

That URL is a normal webpage. Open it in Safari or Chrome. You do not need
Cursor to read it. It cannot run the quiz (GitHub Pages has no Node + SQLite).

The repo Pages setting currently publishes **`main` `/docs`**. The same door
lives in `docs/index.html` (with `.nojekyll`) so that setting serves a site.
`site/` stays the GitHub Actions artifact if you later switch Pages source to
**GitHub Actions**.

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

On an M3 Pro this local process is the fast path. `pnpm sit` skips Next dev
compilation. Do not study inside Cursor Cloud — that VM is slower than the
laptop. github.io is the door; the quiz is local SQLite.

## Invariants the UI must keep

- Confidence 1–5 before the key or explanation is shown.
- Every miss needs an error class before Next.
- No two consecutive same-topic items in a session (structure sittings still interleave).
- `verified=true` only with a human or official anchor.

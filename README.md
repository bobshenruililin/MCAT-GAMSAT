Read NORTH_STAR.md first. It governs this repo.

# Exam morning — local MCAT & GAMSAT retrieval

One user. No cloud. Studying means answering questions. Success is measured in
SCOREBOARD.md, never in features shipped.

Map of the repo and what to do next: **[docs/OVERVIEW.md](docs/OVERVIEW.md)**.

## Sit today (the product)

**https://bobshenruililin.github.io/MCAT-GAMSAT/**

Open in Safari or Chrome. Click **Continue** or a family. That is the sitting.
Ledger is `localStorage` on this device. No clone, no Node, no Cursor.

The public site ships the merged sit-able bank (**5,466** items: hand + peer
originals + depth fill so every weighted topic has ≥8). Factory millions stay
optional local SQLite — they made Continue slow. Software still never sets
`verified=true`. Home layouts: `#/modes` (orbs, catalog, formats, ladders).
Coverage graphs: `#/graphs`. Thumbnails on `#/modes` are live Chrome captures
(`docs/mode-previews/`). Recapture: `python3 -m http.server 4173` in `docs/`
then `pnpm web:shots`.

This branch’s player is `pnpm web:build` → `docs/`. GitHub Pages publishes
`main` `/docs` after merge. Until then, sit this folder locally:

```bash
cd docs && python3 -m http.server 4173
```

Then open http://127.0.0.1:4173/

Official percentiles: sit AAMC/ACER papers, then add a row to `SCOREBOARD.md`.
The software never writes a percentile.

## Optional: Next.js + SQLite factory

Not required to sit. Use this only if you want FSRS in SQLite, `/atlas`,
`/write`, or the 4.3M factory bank.

```bash
cd ~/MCAT-GAMSAT
git pull origin main
bash scripts/mac-setup.sh
pnpm install
FACTORY_TARGET=0 pnpm bootstrap   # numbered batches only (~5466)
pnpm sit
```

Open **http://localhost:3000** in Safari or Chrome (not Cursor). `pnpm sit` is
`next build && next start`. Intel Homebrew is `/usr/local`. If brew asks to
upgrade Node, press **n**.

Factory volume (unverified AI — B-013):

```bash
FACTORY_TARGET=423500 PATTERN_TARGET=12000 pnpm bootstrap
FACTORY_TARGET=84700 PATTERN_TARGET=2400 pnpm bootstrap    # previous 100×
```

Default `FACTORY_TARGET` is 4,235,000. `pnpm demo:seed` is not study — do not
copy it into SCOREBOARD.md. `pnpm db:reset` wipes the local database.

## Invariants the UI must keep

- Confidence 1–5 before the key or explanation is shown.
- Every miss needs an error class before Next.
- No two consecutive same-topic items in a session.
- `verified=true` only with a human or official anchor.

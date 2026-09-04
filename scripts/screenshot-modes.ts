/**
 * Live Chrome captures of the website player.
 * Requires `python3 -m http.server 4173` (or SHOT_BASE) serving `docs/`.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const chromeCandidates = [
  process.env.CHROME,
  "/usr/bin/google-chrome-stable",
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter((p): p is string => Boolean(p));

const chromeBin = chromeCandidates.find((p) => existsSync(p));
if (!chromeBin) {
  throw new Error("Chrome not found. Set CHROME=/path/to/chrome");
}
const resolvedChrome: string = chromeBin;

const base = process.env.SHOT_BASE ?? "http://127.0.0.1:4173";
const docsDir = path.join(process.cwd(), "docs/mode-previews");
const siteDir = path.join(process.cwd(), "site/mode-previews");
mkdirSync(docsDir, { recursive: true });
mkdirSync(siteDir, { recursive: true });

/** Chooser last so nested <img> previews are the shots just written. */
const shots: { file: string; url: string; width: number; height: number }[] = [
  { file: "mode-orbs.png", url: `${base}/?mode=orbs`, width: 390, height: 1500 },
  { file: "mode-catalog.png", url: `${base}/?mode=catalog`, width: 390, height: 1100 },
  { file: "mode-formats.png", url: `${base}/?mode=formats`, width: 390, height: 1100 },
  { file: "mode-ladders.png", url: `${base}/?mode=ladders`, width: 390, height: 1900 },
  { file: "graph-coverage.png", url: `${base}/?view=graphs`, width: 780, height: 1600 },
  { file: "mode-chooser.png", url: `${base}/?view=modes`, width: 390, height: 2400 },
];

function main(): void {
  for (const shot of shots) {
    const dest = path.join(docsDir, shot.file);
    execFileSync(
      resolvedChrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-sandbox",
        `--window-size=${shot.width},${shot.height}`,
        "--virtual-time-budget=25000",
        `--screenshot=${dest}`,
        shot.url,
      ],
      { stdio: "inherit" },
    );
    copyFileSync(dest, path.join(siteDir, shot.file));
    console.log("captured", shot.file, shot.url);
  }
}

main();

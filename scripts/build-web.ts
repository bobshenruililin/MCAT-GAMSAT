import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import { exportWebBank } from "../src/web/exportBank";

const root = process.cwd();
const docs = path.join(root, "docs");
const site = path.join(root, "site");

async function main(): Promise<void> {
  mkdirSync(docs, { recursive: true });
  mkdirSync(site, { recursive: true });
  const bank = exportWebBank();
  const json = `${JSON.stringify(bank)}\n`;
  writeFileSync(path.join(docs, "bank.json"), json);
  writeFileSync(path.join(site, "bank.json"), json);
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: [path.join(root, "src/web/main.ts")],
    bundle: true,
    outfile: path.join(docs, "app.js"),
    format: "iife",
    platform: "browser",
    target: ["es2020"],
    minify: true,
    logLevel: "info",
  });
  copyFileSync(path.join(docs, "app.js"), path.join(site, "app.js"));
  copyFileSync(path.join(docs, "index.html"), path.join(site, "index.html"));
  copyFileSync(path.join(docs, "styles.css"), path.join(site, "styles.css"));
  console.log(`web bank ${bank.itemCount} items`);
}

void main();

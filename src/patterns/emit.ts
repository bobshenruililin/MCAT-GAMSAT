import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { toIngestJson } from "@/factory/item";
import { generatePatternBank, PATTERN_TARGET, patternBankStats } from "./generate";

const FACTORY_DIR = path.join(process.cwd(), "content", "batches", "factory");
const CHUNK = 2000;

function clearGenerated(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    if (name.startsWith("92-pattern-drill-") || name === "PATTERN_MANIFEST.json") {
      unlinkSync(path.join(dir, name));
    }
  }
}

export function emitPatternBatches(
  target = PATTERN_TARGET,
  dir = FACTORY_DIR,
): {
  files: string[];
  questions: number;
} {
  mkdirSync(dir, { recursive: true });
  clearGenerated(dir);
  const items = generatePatternBank(target);
  const stats = patternBankStats(items);
  const files: string[] = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    const part = items.slice(i, i + CHUNK);
    const name = `92-pattern-drill-${String(i / CHUNK).padStart(4, "0")}.json`;
    const abs = path.join(dir, name);
    writeFileSync(abs, JSON.stringify({ items: part.map(toIngestJson) }));
    files.push(abs);
  }
  writeFileSync(
    path.join(dir, "PATTERN_MANIFEST.json"),
    JSON.stringify({ target, ...stats, files: files.map((f) => path.basename(f)) }),
  );
  return { files, questions: stats.n };
}

if (process.argv[1]?.includes(`${path.sep}patterns${path.sep}emit.ts`)) {
  const n = process.argv[2] ? Number(process.argv[2]) : PATTERN_TARGET;
  const result = emitPatternBatches(n);
  console.log(
    `patterns:emit ${result.questions} questions in ${result.files.length} files → ${FACTORY_DIR}`,
  );
}

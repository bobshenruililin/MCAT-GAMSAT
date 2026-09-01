import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { toIngestJson } from "@/factory/item";
import { generatePatternBank, PATTERN_TARGET, patternBankStats } from "./generate";

const FACTORY_DIR = path.join(process.cwd(), "content", "batches", "factory");

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function emitPatternBatches(target = PATTERN_TARGET): {
  files: string[];
  questions: number;
} {
  mkdirSync(FACTORY_DIR, { recursive: true });
  const items = generatePatternBank(target);
  const stats = patternBankStats(items);
  const files: string[] = [];
  chunk(items, 2000).forEach((part, i) => {
    const name = `92-pattern-drill-${String(i).padStart(3, "0")}.json`;
    const abs = path.join(FACTORY_DIR, name);
    writeFileSync(abs, JSON.stringify({ items: part.map(toIngestJson) }, null, 2));
    files.push(abs);
  });
  writeFileSync(
    path.join(FACTORY_DIR, "PATTERN_MANIFEST.json"),
    JSON.stringify({ target, ...stats, files: files.map((f) => path.basename(f)) }, null, 2),
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

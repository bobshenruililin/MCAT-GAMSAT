import { readdirSync } from "node:fs";
import path from "node:path";

const BATCH_DIR = path.join(process.cwd(), "content", "batches");
const FACTORY_DIR = path.join(BATCH_DIR, "factory");

export function listBatchFiles(): string[] {
  const numbered = readdirSync(BATCH_DIR)
    .filter((name) => /^\d+-.*\.json$/.test(name))
    .sort()
    .map((name) => path.join(BATCH_DIR, name));
  let factory: string[] = [];
  try {
    factory = readdirSync(FACTORY_DIR)
      .filter((name) => /^\d+-.*\.json$/.test(name))
      .sort()
      .map((name) => path.join(FACTORY_DIR, name));
  } catch {
    factory = [];
  }
  return [...numbered, ...factory];
}

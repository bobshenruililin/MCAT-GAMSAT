import { readdirSync } from "node:fs";
import path from "node:path";

export const BATCH_DIR = path.join(process.cwd(), "content", "batches");
export const FACTORY_DIR = path.join(BATCH_DIR, "factory");

export function listNumberedBatchNames(): string[] {
  return readdirSync(BATCH_DIR)
    .filter((name) => /^\d+-.*\.json$/.test(name))
    .sort();
}

export function listNumberedBatchFiles(): string[] {
  return listNumberedBatchNames().map((name) => path.join(BATCH_DIR, name));
}

/** Numbered git batches plus optional local factory emit under `factory/`. */
export function listBatchFiles(): string[] {
  let factory: string[] = [];
  try {
    factory = readdirSync(FACTORY_DIR)
      .filter((name) => /^\d+-.*\.json$/.test(name))
      .sort()
      .map((name) => path.join(FACTORY_DIR, name));
  } catch {
    factory = [];
  }
  return [...listNumberedBatchFiles(), ...factory];
}

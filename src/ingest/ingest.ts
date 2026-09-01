import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { and, eq, like } from "drizzle-orm";
import { openDb, type AppDb } from "@/db/client";
import { items, passages } from "@/db/schema";
import { TAXONOMY_PATH } from "@/db/paths";
import {
  validateIngestFile,
  type RejectedRow,
  type ValidatedItem,
} from "./validate";

export type IngestResult = {
  source: string;
  passed: number;
  failed: number;
  inserted: number;
  skipped: number;
  rejectedPath: string | null;
};

function isoNow(): string {
  return new Date().toISOString();
}

function alreadyExists(db: AppDb, conceptId: string, stem: string): boolean {
  const row = db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.conceptId, conceptId), eq(items.stem, stem)))
    .get();
  return Boolean(row);
}

function insertItem(
  db: AppDb,
  item: ValidatedItem,
  passageId: string | null,
  createdAt: string,
): "inserted" | "skipped" {
  if (alreadyExists(db, item.conceptId, item.stem)) return "skipped";
  db.insert(items)
    .values({
      id: crypto.randomUUID(),
      type: item.type,
      passageId,
      conceptId: item.conceptId,
      skillTag: item.skillTag,
      stem: item.stem,
      choices: item.choices,
      correctKey: item.correctKey,
      explanation: item.explanation,
      distractorRationales: item.distractorRationales,
      difficultyEst: item.difficultyEst,
      source: "ai_generated",
      verified: false,
      createdAt,
    })
    .run();
  return "inserted";
}

export function ingestFileContents(
  db: AppDb,
  raw: string,
  sourcePath: string,
  taxonomyPath = TAXONOMY_PATH,
): {
  passed: number;
  failed: number;
  inserted: number;
  skipped: number;
  rejected: RejectedRow[];
} {
  const { items: validItems, passages: validPassages, rejected } =
    validateIngestFile(raw, taxonomyPath);
  const createdAt = isoNow();
  let inserted = 0;
  let skipped = 0;

  for (const item of validItems) {
    const result = insertItem(db, item, null, createdAt);
    if (result === "inserted") inserted += 1;
    else skipped += 1;
  }

  for (const p of validPassages) {
    const passageId = crypto.randomUUID();
    db.insert(passages)
      .values({
        id: passageId,
        conceptId: p.conceptId,
        title: p.title,
        body: p.body,
        itemCount: p.questions.length,
      })
      .run();
    for (const q of p.questions) {
      const result = insertItem(db, q, passageId, createdAt);
      if (result === "inserted") inserted += 1;
      else skipped += 1;
    }
  }

  const passed = validItems.length + validPassages.reduce((s, p) => s + p.questions.length, 0);
  return {
    passed,
    failed: rejected.length,
    inserted,
    skipped,
    rejected,
  };
}

/** Delete PLACEHOLDER items whose topic now has at least one real item. */
export function removeCoveredPlaceholders(db: AppDb): number {
  const all = db.select().from(items).all();
  const realByTopic = new Set(
    all.filter((row) => !row.stem.includes("PLACEHOLDER")).map((row) => row.conceptId),
  );
  const doomed = all.filter(
    (row) => row.stem.includes("PLACEHOLDER") && realByTopic.has(row.conceptId),
  );
  const passageIds = new Set(
    doomed.map((row) => row.passageId).filter((id): id is string => Boolean(id)),
  );
  for (const row of doomed) {
    db.delete(items).where(eq(items.id, row.id)).run();
  }
  for (const pid of passageIds) {
    const remaining = db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.passageId, pid))
      .all();
    if (remaining.length === 0) {
      db.delete(passages).where(eq(passages.id, pid)).run();
    }
  }
  // leftover placeholder passages whose title is flagged and have no items
  const leftoverPassages = db
    .select()
    .from(passages)
    .where(like(passages.title, "%PLACEHOLDER%"))
    .all();
  for (const p of leftoverPassages) {
    const remaining = db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.passageId, p.id))
      .all();
    if (remaining.length === 0) {
      db.delete(passages).where(eq(passages.id, p.id)).run();
    }
  }
  return doomed.length;
}

export function writeQuarantine(
  sourcePath: string,
  rejected: RejectedRow[],
  quarantineDir = path.join(process.cwd(), "content", "quarantine"),
): string | null {
  if (rejected.length === 0) return null;
  mkdirSync(quarantineDir, { recursive: true });
  const base = path.basename(sourcePath);
  const outPath = path.join(quarantineDir, `${base}.rejected.json`);
  writeFileSync(
    outPath,
    JSON.stringify({ source: sourcePath, rejected }, null, 2) + "\n",
  );
  return outPath;
}

export function ingestPath(filePath: string): IngestResult {
  const abs = path.resolve(filePath);
  const raw = readFileSync(abs, "utf8");
  const { sqlite, db } = openDb();
  try {
    const result = ingestFileContents(db, raw, abs);
    const rejectedPath = writeQuarantine(abs, result.rejected);
    return {
      source: abs,
      passed: result.passed,
      failed: result.rejected.length,
      inserted: result.inserted,
      skipped: result.skipped,
      rejectedPath,
    };
  } finally {
    sqlite.close();
  }
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: pnpm ingest <file>");
    console.error("       pnpm ingest --strip-placeholders");
    process.exit(2);
  }
  if (file === "--strip-placeholders") {
    const { sqlite, db } = openDb();
    try {
      const n = removeCoveredPlaceholders(db);
      console.log(`removed ${n} PLACEHOLDER items whose topics now have real items`);
    } finally {
      sqlite.close();
    }
    return;
  }
  const result = ingestPath(file);
  const name = path.basename(result.source);
  console.log(
    `ingest ${name}: ${result.passed} passed, ${result.failed} failed (inserted ${result.inserted}, skipped ${result.skipped})`,
  );
  if (result.rejectedPath) {
    console.log(`quarantine: ${result.rejectedPath}`);
  }
  if (result.failed > 0) process.exitCode = 1;
}

const launched = process.argv[1]?.includes("ingest.ts");
if (launched) main();

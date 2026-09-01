import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDb, type AppDb } from "@/db/client";
import { MIGRATIONS_DIR } from "@/db/paths";
import { concepts, items } from "@/db/schema";

export function tempMigratedDb(): {
  dbPath: string;
  sqlite: ReturnType<typeof openDb>["sqlite"];
  db: AppDb;
  close: () => void;
} {
  const dir = mkdtempSync(path.join(tmpdir(), "mcat-engine-"));
  const dbPath = path.join(dir, "test.db");
  const { sqlite, db } = openDb(dbPath);
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return { dbPath, sqlite, db, close: () => sqlite.close() };
}

export function insertTopicTree(
  db: AppDb,
  topicIds: string[],
  weight = 0.05,
): void {
  const sections = new Map<string, string>();
  const categories = new Map<string, string>();
  for (const topicId of topicIds) {
    const parts = topicId.split(".");
    const sectionId = parts.slice(0, 2).join(".");
    const categoryId = parts.slice(0, 3).join(".");
    if (!sections.has(sectionId)) {
      db.insert(concepts)
        .values({
          id: sectionId,
          parentId: null,
          exam: "mcat",
          level: "section",
          name: sectionId,
          description: "",
          examWeight: weight * 4,
        })
        .run();
      sections.set(sectionId, sectionId);
    }
    if (!categories.has(categoryId)) {
      db.insert(concepts)
        .values({
          id: categoryId,
          parentId: sectionId,
          exam: "mcat",
          level: "category",
          name: categoryId,
          description: "",
          examWeight: weight * 2,
        })
        .run();
      categories.set(categoryId, categoryId);
    }
    db.insert(concepts)
      .values({
        id: topicId,
        parentId: categoryId,
        exam: "mcat",
        level: "topic",
        name: topicId,
        description: "",
        examWeight: weight,
      })
      .run();
  }
}

export function insertDiscrete(
  db: AppDb,
  id: string,
  conceptId: string,
  correctKey = "A",
  difficultyEst = 0.4,
  skillTag: string | null = null,
): void {
  db.insert(items)
    .values({
      id,
      type: "discrete",
      passageId: null,
      conceptId,
      skillTag,
      stem: `Stem ${id}`,
      choices: [
        { key: "A", text: "A" },
        { key: "B", text: "B" },
      ],
      correctKey,
      explanation: `Because ${correctKey}`,
      distractorRationales: { B: "wrong" },
      difficultyEst,
      source: "ai_generated",
      verified: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    })
    .run();
}

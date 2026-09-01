import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  attempts,
  concepts,
  items,
  schema,
  sessions,
} from "./schema";
import { MIGRATIONS_DIR } from "./paths";

function migratedDb() {
  const dir = mkdtempSync(path.join(tmpdir(), "mcat-schema-"));
  const dbPath = path.join(dir, "test.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return { sqlite, db };
}

function seedTopic(db: ReturnType<typeof migratedDb>["db"]) {
  db.insert(concepts)
    .values({
      id: "MCAT.FC1",
      parentId: null,
      exam: "mcat",
      level: "section",
      name: "FC1",
      description: "",
      examWeight: 0.1,
    })
    .run();
  db.insert(concepts)
    .values({
      id: "MCAT.FC1.1A",
      parentId: "MCAT.FC1",
      exam: "mcat",
      level: "category",
      name: "1A",
      description: "",
      examWeight: 0.05,
    })
    .run();
  db.insert(concepts)
    .values({
      id: "MCAT.FC1.1A.t1",
      parentId: "MCAT.FC1.1A",
      exam: "mcat",
      level: "topic",
      name: "Amino Acids",
      description: "",
      examWeight: 0.01,
    })
    .run();
}

function seedItem(db: ReturnType<typeof migratedDb>["db"]) {
  seedTopic(db);
  db.insert(items)
    .values({
      id: "item-1",
      type: "discrete",
      passageId: null,
      conceptId: "MCAT.FC1.1A.t1",
      skillTag: "SIRS1",
      stem: "Which amino acid is achiral?",
      choices: [
        { key: "A", text: "Glycine" },
        { key: "B", text: "Alanine" },
      ],
      correctKey: "A",
      explanation: "Glycine has two hydrogens on the alpha carbon.",
      distractorRationales: { B: "Alanine has a methyl group." },
      difficultyEst: 0.2,
      source: "ai_generated",
      verified: false,
      createdAt: "2026-09-01T00:00:00.000Z",
    })
    .run();
}

describe("schema constraints", () => {
  it("accepts a valid concept tree", () => {
    const { sqlite, db } = migratedDb();
    seedTopic(db);
    const rows = db.select().from(concepts).all();
    expect(rows).toHaveLength(3);
    sqlite.close();
  });

  it("rejects exam values outside mcat|gamsat", () => {
    const { sqlite, db } = migratedDb();
    expect(() =>
      db
        .insert(concepts)
        .values({
          id: "X",
          parentId: null,
          exam: "lsat" as "mcat",
          level: "section",
          name: "nope",
          description: "",
          examWeight: 0.1,
        })
        .run(),
    ).toThrow();
    sqlite.close();
  });

  it("rejects exam_weight outside 0–1", () => {
    const { sqlite, db } = migratedDb();
    expect(() =>
      db
        .insert(concepts)
        .values({
          id: "X",
          parentId: null,
          exam: "mcat",
          level: "section",
          name: "nope",
          description: "",
          examWeight: 1.2,
        })
        .run(),
    ).toThrow();
    sqlite.close();
  });

  it("rejects missing parent foreign key", () => {
    const { sqlite, db } = migratedDb();
    expect(() =>
      db
        .insert(concepts)
        .values({
          id: "MCAT.FC1.1A",
          parentId: "MCAT.MISSING",
          exam: "mcat",
          level: "category",
          name: "1A",
          description: "",
          examWeight: 0.1,
        })
        .run(),
    ).toThrow();
    sqlite.close();
  });

  it("rejects verified default of true only when explicitly set; default is false", () => {
    const { sqlite, db } = migratedDb();
    seedItem(db);
    const row = db.select().from(items).where(eq(items.id, "item-1")).get();
    expect(row?.verified).toBe(false);
    sqlite.close();
  });

  it("requires confidence 1–5 on attempts", () => {
    const { sqlite, db } = migratedDb();
    seedItem(db);
    db.insert(sessions)
      .values({
        id: "s1",
        kind: "daily",
        startedAt: "2026-09-01T00:00:00.000Z",
        endedAt: null,
        config: {},
      })
      .run();
    expect(() =>
      db
        .insert(attempts)
        .values({
          id: "a1",
          itemId: "item-1",
          sessionId: "s1",
          answeredKey: "A",
          correct: true,
          confidence: 0,
          seconds: 12,
          errorClass: null,
          createdAt: "2026-09-01T00:00:00.000Z",
        })
        .run(),
    ).toThrow();
    sqlite.close();
  });

  it("requires error_class on misses and forbids it on hits", () => {
    const { sqlite, db } = migratedDb();
    seedItem(db);
    db.insert(sessions)
      .values({
        id: "s1",
        kind: "daily",
        startedAt: "2026-09-01T00:00:00.000Z",
        endedAt: null,
        config: {},
      })
      .run();
    expect(() =>
      db
        .insert(attempts)
        .values({
          id: "miss-no-class",
          itemId: "item-1",
          sessionId: "s1",
          answeredKey: "B",
          correct: false,
          confidence: 3,
          seconds: 10,
          errorClass: null,
          createdAt: "2026-09-01T00:00:00.000Z",
        })
        .run(),
    ).toThrow();
    expect(() =>
      db
        .insert(attempts)
        .values({
          id: "hit-with-class",
          itemId: "item-1",
          sessionId: "s1",
          answeredKey: "A",
          correct: true,
          confidence: 4,
          seconds: 10,
          errorClass: "content_gap",
          createdAt: "2026-09-01T00:00:00.000Z",
        })
        .run(),
    ).toThrow();
    db.insert(attempts)
      .values({
        id: "ok-miss",
        itemId: "item-1",
        sessionId: "s1",
        answeredKey: "B",
        correct: false,
        confidence: 2,
        seconds: 9,
        errorClass: "misread",
        createdAt: "2026-09-01T00:00:00.000Z",
      })
      .run();
    sqlite.close();
  });

  it("requires passage_id for passage_question items", () => {
    const { sqlite, db } = migratedDb();
    seedTopic(db);
    expect(() =>
      db
        .insert(items)
        .values({
          id: "pq",
          type: "passage_question",
          passageId: null,
          conceptId: "MCAT.FC1.1A.t1",
          skillTag: null,
          stem: "From the passage...",
          choices: [{ key: "A", text: "x" }],
          correctKey: "A",
          explanation: "e",
          distractorRationales: {},
          difficultyEst: 0.5,
          source: "official_entry",
          verified: false,
          createdAt: "2026-09-01T00:00:00.000Z",
        })
        .run(),
    ).toThrow();
    sqlite.close();
  });
});

describe("migrate writes a real sqlite file", () => {
  it("creates all seven tables", () => {
    const { sqlite } = migratedDb();
    const names = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as { name: string }[];
    expect(names.map((n) => n.name)).toEqual(
      expect.arrayContaining([
        "attempts",
        "concepts",
        "external_scores",
        "fsrs_state",
        "items",
        "passages",
        "sessions",
      ]),
    );
    sqlite.close();
  });
});

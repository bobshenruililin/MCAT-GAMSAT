import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseTaxonomyJson,
  validateTaxonomy,
  TaxonomyError,
  countByExamAndLevel,
  seedFromFile,
} from "./seed-lib";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { schema, concepts, items } from "./schema";
import { MIGRATIONS_DIR, TAXONOMY_PATH } from "./paths";
import { migrateDb } from "./migrate-lib";

const HEADER = "AI-emitted, verify against official outline.";

const validFile = {
  header: HEADER,
  nodes: [
    {
      id: "MCAT.FC1",
      parent_id: null,
      exam: "mcat",
      level: "section",
      name: "FC1",
      description: "d",
      exam_weight: 0.1,
    },
    {
      id: "MCAT.FC1.1A",
      parent_id: "MCAT.FC1",
      exam: "mcat",
      level: "category",
      name: "1A",
      description: "d",
      exam_weight: 0.05,
    },
    {
      id: "MCAT.FC1.1A.t1",
      parent_id: "MCAT.FC1.1A",
      exam: "mcat",
      level: "topic",
      name: "Amino Acids",
      description: "d",
      exam_weight: 0.01,
    },
  ],
};

function parseAndValidate(raw: string) {
  return validateTaxonomy(parseTaxonomyJson(raw, "fixture.json"), "fixture.json");
}

describe("seed loader — valid", () => {
  it("accepts a unique tree with weights and existing parents", () => {
    const nodes = parseAndValidate(JSON.stringify(validFile));
    expect(nodes).toHaveLength(3);
    expect(countByExamAndLevel(nodes)["mcat/topic"]).toBe(1);
  });

  it("committed taxonomy.json is exhaustive and valid", () => {
    const raw = readFileSync(TAXONOMY_PATH, "utf8");
    const nodes = validateTaxonomy(
      parseTaxonomyJson(raw, TAXONOMY_PATH),
      TAXONOMY_PATH,
    );
    expect(nodes.length).toBeGreaterThanOrEqual(300);
    expect(countByExamAndLevel(nodes)["mcat/topic"]).toBeGreaterThanOrEqual(150);
    expect(countByExamAndLevel(nodes)["gamsat/topic"]).toBeGreaterThanOrEqual(100);
  });

  it("loads into sqlite in parent-first order", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mcat-seed-"));
    const dbPath = path.join(dir, "test.db");
    const filePath = path.join(dir, "taxonomy.json");
    writeFileSync(filePath, JSON.stringify(validFile));
    const sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    seedFromFile(db, filePath);
    expect(db.select().from(concepts).all()).toHaveLength(3);
    sqlite.close();
  });

  it("does not insert PLACEHOLDER items; taxonomy seed leaves an empty bank", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mcat-seed-ph-"));
    const dbPath = path.join(dir, "test.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    seedFromFile(db, TAXONOMY_PATH);
    expect(db.select().from(items).all()).toHaveLength(0);
    sqlite.close();
  });

  it("migrateDb creates concepts so a fresh file can seed without pnpm db:migrate first", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mcat-migrate-first-"));
    const dbPath = path.join(dir, "test.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    expect(() => seedFromFile(db, TAXONOMY_PATH)).toThrow(/no such table: concepts/);
    migrateDb(db);
    seedFromFile(db, TAXONOMY_PATH);
    expect(db.select().from(concepts).all().length).toBeGreaterThan(300);
    sqlite.close();
  });
});

describe("seed loader — malformed", () => {
  it("loud error on invalid JSON", () => {
    expect(() => parseTaxonomyJson("{not json", "fixture.json")).toThrow(TaxonomyError);
    try {
      parseTaxonomyJson("{not json", "fixture.json");
    } catch (err) {
      expect((err as Error).message).toMatch(/fixture\.json: invalid JSON/);
    }
  });

  it("loud error on duplicate ids", () => {
    const dup = structuredClone(validFile);
    dup.nodes.push({ ...dup.nodes[0], name: "copy" });
    expect(() => parseAndValidate(JSON.stringify(dup))).toThrow(/duplicate id "MCAT.FC1"/);
  });

  it("loud error when parent does not exist", () => {
    const bad = structuredClone(validFile);
    bad.nodes[1].parent_id = "MCAT.NOPE";
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow(
      /parent_id "MCAT.NOPE" does not exist/,
    );
  });

  it("loud error when exam_weight is missing", () => {
    const { exam_weight: _drop, ...rest } = validFile.nodes[0];
    const bad = {
      header: HEADER,
      nodes: [{ ...rest }, ...validFile.nodes.slice(1)],
    };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow(/exam_weight must be a number/);
    void _drop;
  });

  it("loud error when header is wrong", () => {
    expect(() =>
      parseTaxonomyJson(JSON.stringify({ header: "nope", nodes: [] }), "fixture.json"),
    ).toThrow(/header must be exactly/);
  });
});

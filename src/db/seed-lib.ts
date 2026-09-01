import { readFileSync } from "node:fs";
import { EXAMS, LEVELS, schema, type Exam, type Level } from "./schema";
import { concepts } from "./schema";
import { TAXONOMY_PATH } from "./paths";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export type TaxonomyNode = {
  id: string;
  parent_id: string | null;
  exam: Exam;
  level: Level;
  name: string;
  description: string;
  exam_weight: number;
};

export type TaxonomyFile = {
  header: string;
  nodes: TaxonomyNode[];
};

const HEADER = "AI-emitted, verify against official outline.";
const LEVEL_RANK: Record<Level, number> = {
  section: 0,
  category: 1,
  topic: 2,
};

export class TaxonomyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaxonomyError";
  }
}

function fail(where: string, message: string): never {
  throw new TaxonomyError(`${where}: ${message}`);
}

function isExam(v: unknown): v is Exam {
  return typeof v === "string" && (EXAMS as readonly string[]).includes(v);
}

function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

export function parseTaxonomyJson(raw: string, source = "taxonomy.json"): TaxonomyFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (err) {
    fail(source, `invalid JSON (${err instanceof Error ? err.message : String(err)})`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail(source, "root must be an object with header and nodes");
  }
  const root = parsed as Record<string, unknown>;
  if (root.header !== HEADER) {
    fail(source, `header must be exactly "${HEADER}"`);
  }
  if (!Array.isArray(root.nodes)) {
    fail(source, "nodes must be an array");
  }
  return { header: HEADER, nodes: root.nodes as TaxonomyNode[] };
}

export function validateTaxonomy(file: TaxonomyFile, source = "taxonomy.json"): TaxonomyNode[] {
  const nodes = file.nodes;
  const byId = new Map<string, { node: TaxonomyNode; index: number }>();

  nodes.forEach((node, i) => {
    const where = `${source} nodes[${i}]`;
    if (node === null || typeof node !== "object") {
      fail(where, "node must be an object");
    }
    if (typeof node.id !== "string" || node.id.length === 0) {
      fail(where, "id must be a non-empty string");
    }
    if (byId.has(node.id)) {
      fail(where, `duplicate id "${node.id}" (first at nodes[${byId.get(node.id)!.index}])`);
    }
    if (node.parent_id !== null && typeof node.parent_id !== "string") {
      fail(`${where} (${node.id})`, "parent_id must be a string or null");
    }
    if (!isExam(node.exam)) {
      fail(`${where} (${node.id})`, `exam must be mcat|gamsat, got ${JSON.stringify(node.exam)}`);
    }
    if (!isLevel(node.level)) {
      fail(
        `${where} (${node.id})`,
        `level must be section|category|topic, got ${JSON.stringify(node.level)}`,
      );
    }
    if (typeof node.name !== "string" || node.name.length === 0) {
      fail(`${where} (${node.id})`, "name must be a non-empty string");
    }
    if (typeof node.description !== "string") {
      fail(`${where} (${node.id})`, "description must be a string");
    }
    if (typeof node.exam_weight !== "number" || Number.isNaN(node.exam_weight)) {
      fail(`${where} (${node.id})`, "exam_weight must be a number");
    }
    if (node.exam_weight < 0 || node.exam_weight > 1) {
      fail(`${where} (${node.id})`, `exam_weight ${node.exam_weight} is outside 0–1`);
    }
    if (node.level === "section" && node.parent_id !== null) {
      fail(`${where} (${node.id})`, "section nodes must have parent_id null");
    }
    if (node.level !== "section" && (node.parent_id === null || node.parent_id === "")) {
      fail(`${where} (${node.id})`, `${node.level} nodes must have a parent_id`);
    }
    byId.set(node.id, { node, index: i });
  });

  for (const { node, index } of byId.values()) {
    const where = `${source} nodes[${index}] (${node.id})`;
    if (node.parent_id === null) continue;
    const parent = byId.get(node.parent_id);
    if (!parent) {
      fail(where, `parent_id "${node.parent_id}" does not exist`);
    }
    if (parent.node.exam !== node.exam) {
      fail(where, `exam ${node.exam} does not match parent exam ${parent.node.exam}`);
    }
    if (LEVEL_RANK[parent.node.level] !== LEVEL_RANK[node.level] - 1) {
      fail(
        where,
        `parent ${parent.node.id} is ${parent.node.level}, expected the level above ${node.level}`,
      );
    }
  }

  return [...nodes].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}

export function countByExamAndLevel(nodes: TaxonomyNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of nodes) {
    const key = `${node.exam}/${node.level}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function printCounts(nodes: TaxonomyNode[]): void {
  const counts = countByExamAndLevel(nodes);
  const keys = ["mcat/section", "mcat/category", "mcat/topic", "gamsat/section", "gamsat/category", "gamsat/topic"];
  console.log(`seeded ${nodes.length} taxonomy nodes`);
  for (const key of keys) {
    console.log(`  ${key}: ${counts[key] ?? 0}`);
  }
}

export function seedConcepts(
  db: BetterSQLite3Database<typeof schema>,
  nodes: TaxonomyNode[],
): void {
  db.delete(concepts).run();
  for (const node of nodes) {
    db.insert(concepts)
      .values({
        id: node.id,
        parentId: node.parent_id,
        exam: node.exam,
        level: node.level,
        name: node.name,
        description: node.description,
        examWeight: node.exam_weight,
      })
      .run();
  }
}

export function seedFromFile(
  db: BetterSQLite3Database<typeof schema>,
  filePath = TAXONOMY_PATH,
): TaxonomyNode[] {
  const raw = readFileSync(filePath, "utf8");
  const file = parseTaxonomyJson(raw, filePath);
  const nodes = validateTaxonomy(file, filePath);
  seedConcepts(db, nodes);
  return nodes;
}

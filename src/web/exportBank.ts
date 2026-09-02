import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { TAXONOMY_PATH } from "@/db/paths";
import { parseTaxonomyJson, validateTaxonomy } from "@/db/seed-lib";
import { sectionFamily } from "@/engine/sectionBudget";
import { validateIngestFile, type ValidatedItem } from "@/ingest/validate";
import { webItemId } from "./ids";
import type { WebBank, WebItem } from "./types";

const BATCH_DIR = path.join(process.cwd(), "content", "batches");

export function listHandBatchFiles(): string[] {
  return readdirSync(BATCH_DIR)
    .filter((name) => /^\d+-.*\.json$/.test(name))
    .sort()
    .map((name) => path.join(BATCH_DIR, name));
}

function topicWeights(taxonomyPath = TAXONOMY_PATH): Map<string, number> {
  const nodes = validateTaxonomy(
    parseTaxonomyJson(readFileSync(taxonomyPath, "utf8"), taxonomyPath),
    taxonomyPath,
  );
  const weights = new Map<string, number>();
  for (const n of nodes) {
    if (n.level === "topic") weights.set(n.id, n.exam_weight);
  }
  return weights;
}

function toWebItem(
  item: ValidatedItem,
  weights: Map<string, number>,
  passage: { title: string; body: string } | null,
): WebItem {
  const examWeight = weights.get(item.conceptId) ?? 0;
  return {
    id: webItemId(item.conceptId, item.stem),
    conceptId: item.conceptId,
    family: sectionFamily(item.conceptId),
    type: item.type,
    stem: item.stem,
    choices: item.choices,
    correctKey: item.correctKey,
    explanation: item.explanation,
    distractorRationales: item.distractorRationales,
    difficultyEst: item.difficultyEst,
    examWeight: examWeight > 0 ? examWeight : 1e-6,
    passage,
    verified: false,
  };
}

export function exportWebBank(taxonomyPath = TAXONOMY_PATH): WebBank {
  const weights = topicWeights(taxonomyPath);
  const seen = new Set<string>();
  const items: WebItem[] = [];

  for (const file of listHandBatchFiles()) {
    const raw = readFileSync(file, "utf8");
    const parsed = validateIngestFile(raw, taxonomyPath);
    for (const item of parsed.items) {
      const row = toWebItem(item, weights, null);
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      items.push(row);
    }
    for (const passage of parsed.passages) {
      const body = { title: passage.title, body: passage.body };
      for (const q of passage.questions) {
        const row = toWebItem(q, weights, body);
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        items.push(row);
      }
    }
  }

  items.sort((a, b) => a.id.localeCompare(b.id));
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
  };
}

import { readFileSync } from "node:fs";
import { TAXONOMY_PATH } from "@/db/paths";
import { parseTaxonomyJson, validateTaxonomy } from "@/db/seed-lib";
import type { TopicNode } from "./types";

export function loadWeightedTopics(taxonomyPath = TAXONOMY_PATH): TopicNode[] {
  const nodes = validateTaxonomy(
    parseTaxonomyJson(readFileSync(taxonomyPath, "utf8"), taxonomyPath),
    taxonomyPath,
  );
  const topics = nodes.filter((n) => n.level === "topic" && n.exam_weight > 0);
  const byParent = new Map<string | null, typeof topics>();
  for (const t of topics) {
    const list = byParent.get(t.parent_id) ?? [];
    list.push(t);
    byParent.set(t.parent_id, list);
  }
  return topics.map((t) => {
    const sibs = (byParent.get(t.parent_id) ?? []).filter((s) => s.id !== t.id);
    return {
      id: t.id,
      parentId: t.parent_id,
      name: t.name,
      description: t.description,
      examWeight: t.exam_weight,
      siblings: sibs.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      })),
    };
  });
}

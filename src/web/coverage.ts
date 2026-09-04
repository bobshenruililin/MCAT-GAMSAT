import { readFileSync } from "node:fs";
import { TAXONOMY_PATH } from "@/db/paths";
import { parseTaxonomyJson, validateTaxonomy } from "@/db/seed-lib";
import { COVERAGE_TRACKS, sectionFamily, type SectionFamily } from "@/engine/sectionBudget";
import { SITABLE_DEPTH } from "@/factory/types";
import { landscapePeers } from "@/peers/maps";
import type { WebCoverage, WebItem, WebOrigin } from "./types";

export function buildCoverage(
  items: WebItem[],
  taxonomyPath = TAXONOMY_PATH,
): WebCoverage {
  const nodes = validateTaxonomy(
    parseTaxonomyJson(readFileSync(taxonomyPath, "utf8"), taxonomyPath),
    taxonomyPath,
  );
  const weighted = nodes.filter((n) => n.level === "topic" && n.exam_weight > 0);
  const perTopic = new Map<string, number>();
  const origin: Record<WebOrigin, number> = { hand: 0, peer: 0, depth: 0 };
  const byFamily = new Map<SectionFamily, { items: number; topics: Set<string> }>();

  for (const item of items) {
    perTopic.set(item.conceptId, (perTopic.get(item.conceptId) ?? 0) + 1);
    origin[item.origin ?? "hand"] += 1;
    const row = byFamily.get(item.family) ?? { items: 0, topics: new Set() };
    row.items += 1;
    row.topics.add(item.conceptId);
    byFamily.set(item.family, row);
  }

  const buckets = [
    { label: "8", min: 8, max: 8 },
    { label: "9–15", min: 9, max: 15 },
    { label: "16–30", min: 16, max: 30 },
    { label: "31+", min: 31, max: 10_000 },
  ];
  const depthBuckets = buckets.map((b) => ({
    label: b.label,
    topics: weighted.filter((t) => {
      const n = perTopic.get(t.id) ?? 0;
      return n >= b.min && n <= b.max;
    }).length,
  }));

  const topicsAtOrAboveFloor = weighted.filter(
    (t) => (perTopic.get(t.id) ?? 0) >= SITABLE_DEPTH,
  ).length;

  return {
    weightedTopicCount: weighted.length,
    depthFloor: SITABLE_DEPTH,
    topicsAtOrAboveFloor,
    itemCount: items.length,
    byFamily: COVERAGE_TRACKS.map((family) => {
      const row = byFamily.get(family);
      const familyTopics = weighted.filter((t) => sectionFamily(t.id) === family);
      return {
        family,
        items: row?.items ?? 0,
        topics: familyTopics.length,
      };
    }),
    origin,
    depthBuckets,
    landscape: [
      { name: "This site (sit-able)", items: items.length },
      ...landscapePeers().map((p) => ({ name: p.name, items: p.items })),
    ],
  };
}

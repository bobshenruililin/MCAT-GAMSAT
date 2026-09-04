import { readFileSync } from "node:fs";
import { TAXONOMY_PATH } from "@/db/paths";
import { parseTaxonomyJson, validateTaxonomy } from "@/db/seed-lib";
import { AAMC_CATEGORY } from "./maps";
import { tokenize } from "./text";

export type TopicInfo = {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  examWeight: number;
  tokens: string[];
};

export function loadTopics(taxonomyPath = TAXONOMY_PATH): TopicInfo[] {
  const nodes = validateTaxonomy(
    parseTaxonomyJson(readFileSync(taxonomyPath, "utf8"), taxonomyPath),
    taxonomyPath,
  );
  return nodes
    .filter((n) => n.level === "topic")
    .map((n) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      parentId: n.parent_id,
      examWeight: n.exam_weight,
      tokens: tokenize(`${n.name} ${n.description}`),
    }));
}

export function hintScore(hint: string, topic: TopicInfo): number {
  const h = new Set(tokenize(hint));
  let n = 0;
  for (const t of topic.tokens) {
    if (h.has(t)) n += 1;
  }
  return n;
}

export class Assigner {
  readonly byId: Map<string, TopicInfo>;
  readonly byPrefix: Map<string, TopicInfo[]>;
  readonly counts: Map<string, number>;

  constructor(topics: TopicInfo[], counts: Map<string, number>) {
    this.byId = new Map(topics.map((t) => [t.id, t]));
    this.byPrefix = new Map();
    for (const t of topics) {
      const parent = t.parentId ?? t.id;
      const list = this.byPrefix.get(parent) ?? [];
      list.push(t);
      this.byPrefix.set(parent, list);
      const cat = parent;
      const fc = cat.replace(/\.[^.]+$/, "");
      const extra = this.byPrefix.get(fc) ?? [];
      extra.push(t);
      this.byPrefix.set(fc, extra);
    }
    this.counts = new Map(counts);
  }

  bump(id: string): void {
    this.counts.set(id, (this.counts.get(id) ?? 0) + 1);
  }

  pick(ids: string[], hint = ""): string {
    const unique = [...new Set(ids.filter((id) => this.byId.has(id)))];
    if (unique.length === 0) {
      throw new Error(`no mappable topics for hint="${hint}"`);
    }
    let best = unique[0];
    let bestScore = -1;
    let bestCount = Infinity;
    for (const id of unique) {
      const topic = this.byId.get(id)!;
      const score = hint ? hintScore(hint, topic) : 0;
      const count = this.counts.get(id) ?? 0;
      if (
        score > bestScore ||
        (score === bestScore && count < bestCount) ||
        (score === bestScore && count === bestCount && id < best)
      ) {
        best = id;
        bestScore = score;
        bestCount = count;
      }
    }
    return best;
  }

  pickPrefix(prefix: string, hint = ""): string {
    const pool =
      this.byPrefix.get(prefix) ??
      [...this.byId.values()].filter((t) => t.id.startsWith(`${prefix}.`) || t.id === prefix);
    if (pool.length === 0) {
      throw new Error(`no topics under ${prefix}`);
    }
    return this.pick(
      pool.filter((t) => t.examWeight > 0).map((t) => t.id),
      hint,
    );
  }

  pickAamc(code: string, hint = ""): string {
    const prefix = AAMC_CATEGORY[code] ?? AAMC_CATEGORY[code.toUpperCase()];
    if (!prefix) {
      return this.pickPrefix("MCAT.FC1.1A", hint);
    }
    return this.pickPrefix(prefix, hint);
  }
}

export function carsHint(stem: string, idea: string): string {
  const s = `${stem} ${idea}`.toLowerCase();
  if (/main idea|thesis|primary purpose|central/.test(s)) return "main idea purpose";
  if (/infer|imply|suggest/.test(s)) return "inferring meaning";
  if (/tone|rhetoric|attitude/.test(s)) return "tone rhetoric";
  if (/vocabulary|word .* mean|phrase/.test(s)) return "vocabulary context";
  if (/new context|hypothetical|analog/.test(s)) return "apply new context analogies";
  if (/weaken|strengthen|support/.test(s)) return "relevance support";
  return idea;
}

export function gamsatPrefix(sectionId: string, topic: string): string {
  if (sectionId === "section1" || sectionId === "s1") {
    const t = topic.toLowerCase();
    if (/tone|irony|literary|poetry/.test(t)) return "GAMSAT.S1.tone";
    if (/visual|cartoon|data described|table|figure/.test(t)) return "GAMSAT.S1.visual";
    if (/philosophy|ethics|humanities/.test(t)) return "GAMSAT.S1.humanities";
    if (/policy|sociolog|political|media|health &/.test(t)) return "GAMSAT.S1.social";
    if (/infer|assumption|between the lines/.test(t)) return "GAMSAT.S1.infer";
    if (/compare|paired|quote set/.test(t)) return "GAMSAT.S1.compare";
    if (/understand|main idea|paraphrase/.test(t)) return "GAMSAT.S1.understand";
    return "GAMSAT.S1.argument";
  }
  const t = topic.toLowerCase();
  if (/cell|dna|rna|mitosis|meiosis|enzyme|osmosis|mendel|selection|photo|homeostasis|circulat|immune|endocrine|gene|exercise|physiology/.test(t)) {
    return "GAMSAT.S3.bio";
  }
  if (/atom|periodic|bond|stoich|acid|redox|gas|molar|equilibrium|organic|enthalpy|rate of reaction|chem/.test(t)) {
    return "GAMSAT.S3.chem";
  }
  if (/newton|force|energy|electric|ohm|wave|pressure|pendulum|motion|phys/.test(t)) {
    return "GAMSAT.S3.phys";
  }
  return "GAMSAT.S3.bio";
}

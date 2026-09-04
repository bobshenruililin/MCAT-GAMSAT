import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TAXONOMY_PATH } from "@/db/paths";
import { fillTopic } from "@/factory/generate";
import { toIngestJson } from "@/factory/item";
import { loadWeightedTopics } from "@/factory/taxonomy";
import { SITABLE_DEPTH } from "@/factory/types";
import { validateIngestFile } from "@/ingest/validate";
import { loadTopics } from "./assign";
import {
  convertGamsat,
  convertOpenMcat,
  convertOpenmcat,
  convertReadymcat,
  countUnits,
  emptySeen,
  seedAssigner,
  type ConvertedBank,
} from "./convert";

export const PEER_DIR = path.join(process.cwd(), "content", "peers");
export const BATCH_DIR = path.join(process.cwd(), "content", "batches");

const GENERATED = [
  "30-peer-open-mcat.json",
  "31-peer-openmcat.json",
  "32-peer-gamsat.json",
  "33-peer-readymcat.json",
  "40-depth-disc.json",
  "41-depth-pass.json",
];

export function originFromFilename(name: string): "hand" | "peer" | "depth" {
  const base = path.basename(name);
  if (/^4\d-/.test(base)) return "depth";
  if (/^3\d-/.test(base)) return "peer";
  return "hand";
}

function numberedBatches(): string[] {
  return readdirSync(BATCH_DIR)
    .filter((name) => /^\d+-.*\.json$/.test(name))
    .sort();
}

export function loadExistingCounts(taxonomyPath = TAXONOMY_PATH): {
  counts: Map<string, number>;
  seen: ReturnType<typeof emptySeen>;
} {
  const counts = new Map<string, number>();
  const seen = emptySeen();
  for (const name of numberedBatches()) {
    if (GENERATED.includes(name)) continue;
    const result = validateIngestFile(readFileSync(path.join(BATCH_DIR, name), "utf8"), taxonomyPath);
    const rows = [...result.items, ...result.passages.flatMap((p) => p.questions)];
    for (const row of rows) {
      counts.set(row.conceptId, (counts.get(row.conceptId) ?? 0) + 1);
      seen.stems.add(row.stem);
      seen.pairs.add(`${row.conceptId}\n${row.stem}`);
    }
  }
  return { counts, seen };
}

function clearGenerated(): void {
  for (const name of GENERATED) {
    const abs = path.join(BATCH_DIR, name);
    try {
      unlinkSync(abs);
    } catch {
      /* missing is fine */
    }
  }
}

function writeBank(name: string, bank: ConvertedBank): string {
  const abs = path.join(BATCH_DIR, name);
  const payload: { items?: unknown[]; passages?: unknown[] } = {};
  if (bank.items.length) payload.items = bank.items;
  if (bank.passages.length) payload.passages = bank.passages;
  writeFileSync(abs, `${JSON.stringify(payload)}\n`);
  return abs;
}

function readPeer(file: string): unknown {
  return JSON.parse(readFileSync(path.join(PEER_DIR, file), "utf8")) as unknown;
}

function assertValid(file: string, taxonomyPath = TAXONOMY_PATH): void {
  const result = validateIngestFile(readFileSync(file, "utf8"), taxonomyPath);
  if (result.rejected.length > 0) {
    throw new Error(
      `${path.basename(file)} rejected ${result.rejected.length}: ${JSON.stringify(result.rejected.slice(0, 8))}`,
    );
  }
}

export function emitPeerBatches(taxonomyPath = TAXONOMY_PATH): {
  files: string[];
  questions: number;
  skipped: number;
} {
  mkdirSync(BATCH_DIR, { recursive: true });
  clearGenerated();
  const topics = loadTopics(taxonomyPath);
  const { counts, seen } = loadExistingCounts(taxonomyPath);
  const assign = seedAssigner(topics, counts);

  const openMcat = convertOpenMcat(readPeer("open-mcat.json"), assign, seen);
  const openmcat = convertOpenmcat(readPeer("openmcat.json"), assign, seen);
  const gamsat = convertGamsat(readPeer("gamsat-trainer.json"), assign, seen);
  const ready = convertReadymcat(readPeer("readymcat.json"), assign, seen);

  const files = [
    writeBank("30-peer-open-mcat.json", openMcat),
    writeBank("31-peer-openmcat.json", openmcat),
    writeBank("32-peer-gamsat.json", gamsat),
    writeBank("33-peer-readymcat.json", ready),
  ];
  for (const f of files) assertValid(f, taxonomyPath);

  const depth = emitDepthFill(assign.counts, seen, taxonomyPath);
  files.push(...depth.files);

  const questions =
    countUnits(openMcat) +
    countUnits(openmcat) +
    countUnits(gamsat) +
    countUnits(ready) +
    depth.questions;
  const skipped = openMcat.skipped + openmcat.skipped + gamsat.skipped + ready.skipped;

  writeFileSync(
    path.join(PEER_DIR, "CONVERT_MANIFEST.json"),
    `${JSON.stringify(
      {
        openMcat: { questions: countUnits(openMcat), skipped: openMcat.skipped },
        openmcat: { questions: countUnits(openmcat), skipped: openmcat.skipped },
        gamsat: { questions: countUnits(gamsat), skipped: gamsat.skipped },
        readymcat: { questions: countUnits(ready), skipped: ready.skipped },
        depth: { questions: depth.questions },
        totalNew: questions,
        skipped,
        sitableDepth: SITABLE_DEPTH,
      },
      null,
      2,
    )}\n`,
  );

  return { files, questions, skipped };
}

function emitDepthFill(
  counts: Map<string, number>,
  seen: ReturnType<typeof emptySeen>,
  taxonomyPath = TAXONOMY_PATH,
): { files: string[]; questions: number } {
  const weighted = loadWeightedTopics(taxonomyPath);
  const items: ReturnType<typeof toIngestJson>[] = [];
  const passages: {
    concept_id: string;
    title: string;
    body: string;
    questions: ReturnType<typeof toIngestJson>[];
  }[] = [];

  for (const topic of weighted) {
    let guard = 0;
    while ((counts.get(topic.id) ?? 0) < SITABLE_DEPTH && guard < 40) {
      guard += 1;
      const have = counts.get(topic.id) ?? 0;
      const part = fillTopic(topic, 1, 800_000 + have + guard);
      let added = 0;
      for (const it of part.items) {
        if (seen.stems.has(it.stem)) continue;
        seen.stems.add(it.stem);
        seen.pairs.add(`${it.concept_id}\n${it.stem}`);
        items.push(toIngestJson(it));
        counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
        added += 1;
      }
      for (const p of part.passages) {
        const qs = p.questions.filter((q) => !seen.stems.has(q.stem));
        if (qs.length === 0) continue;
        for (const q of qs) {
          seen.stems.add(q.stem);
          seen.pairs.add(`${q.concept_id}\n${q.stem}`);
        }
        passages.push({
          concept_id: p.concept_id,
          title: p.title,
          body: p.body,
          questions: qs.map(toIngestJson),
        });
        counts.set(topic.id, (counts.get(topic.id) ?? 0) + qs.length);
        added += qs.length;
      }
      if (added === 0) {
        // force a uniquely salted conceptual if generators collided
        const salt = fillTopic(topic, 1, 900_000 + have + guard * 17);
        for (const it of salt.items) {
          const stem = `${it.stem} (depth ${topic.id.split(".").pop()} #${guard})`;
          if (seen.stems.has(stem)) continue;
          it.stem = stem;
          seen.stems.add(stem);
          items.push(toIngestJson(it));
          counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
          added += 1;
        }
      }
      if (added === 0) break;
    }
  }

  const files: string[] = [];
  if (items.length) {
    const abs = path.join(BATCH_DIR, "40-depth-disc.json");
    writeFileSync(abs, `${JSON.stringify({ items })}\n`);
    assertValid(abs, taxonomyPath);
    files.push(abs);
  }
  if (passages.length) {
    const abs = path.join(BATCH_DIR, "41-depth-pass.json");
    writeFileSync(abs, `${JSON.stringify({ passages })}\n`);
    assertValid(abs, taxonomyPath);
    files.push(abs);
  }
  return {
    files,
    questions: items.length + passages.reduce((s, p) => s + p.questions.length, 0),
  };
}

if (process.argv[1]?.includes(`${path.sep}peers${path.sep}emit.ts`)) {
  const result = emitPeerBatches();
  console.log(
    `peers:emit ${result.questions} new questions, skipped ${result.skipped}, files ${result.files.length}`,
  );
}

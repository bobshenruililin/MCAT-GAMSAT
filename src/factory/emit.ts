import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateBank, bankStats } from "./generate";
import { toIngestJson } from "./item";
import { FACTORY_TARGET } from "./types";

export const FACTORY_DIR = path.join(process.cwd(), "content", "batches", "factory");

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function emitFactoryBatches(target = FACTORY_TARGET): {
  files: string[];
  questions: number;
} {
  mkdirSync(FACTORY_DIR, { recursive: true });
  const bank = generateBank(target);
  const stats = bankStats(bank);
  const files: string[] = [];

  const itemChunks = chunk(bank.items, 2000);
  itemChunks.forEach((items, i) => {
    const name = `90-scoremax-disc-${String(i).padStart(3, "0")}.json`;
    const abs = path.join(FACTORY_DIR, name);
    writeFileSync(
      abs,
      JSON.stringify({ items: items.map(toIngestJson) }, null, 2),
    );
    files.push(abs);
  });

  const passageChunks = chunk(bank.passages, 250);
  passageChunks.forEach((passages, i) => {
    const name = `91-scoremax-pass-${String(i).padStart(3, "0")}.json`;
    const abs = path.join(FACTORY_DIR, name);
    writeFileSync(
      abs,
      JSON.stringify(
        {
          passages: passages.map((p) => ({
            concept_id: p.concept_id,
            title: p.title,
            body: p.body,
            questions: p.questions.map(toIngestJson),
          })),
        },
        null,
        2,
      ),
    );
    files.push(abs);
  });

  writeFileSync(
    path.join(FACTORY_DIR, "MANIFEST.json"),
    JSON.stringify(
      {
        target,
        questions: stats.questions,
        discretes: stats.discretes,
        passageQuestions: stats.passageQuestions,
        passages: stats.passages,
        files: files.map((f) => path.basename(f)),
        designs: stats.designs,
      },
      null,
      2,
    ),
  );
  return { files, questions: stats.questions };
}

if (process.argv[1]?.includes("emit.ts")) {
  const n = process.argv[2] ? Number(process.argv[2]) : FACTORY_TARGET;
  const result = emitFactoryBatches(n);
  console.log(
    `factory:emit ${result.questions} questions in ${result.files.length} files → ${FACTORY_DIR}`,
  );
}

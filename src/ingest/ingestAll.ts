import path from "node:path";
import { ingestPath } from "@/ingest/ingest";
import { listBatchFiles } from "@/ingest/batchFiles";

export { listBatchFiles };

export function ingestAllBatches(): {
  files: number;
  passed: number;
  failed: number;
  inserted: number;
  skipped: number;
} {
  let passed = 0;
  let failed = 0;
  let inserted = 0;
  let skipped = 0;
  const files = listBatchFiles();
  for (const file of files) {
    const result = ingestPath(file);
    passed += result.passed;
    failed += result.failed;
    inserted += result.inserted;
    skipped += result.skipped;
    const name = path.basename(file);
    console.log(
      `ingest ${name}: ${result.passed} passed, ${result.failed} failed (inserted ${result.inserted}, skipped ${result.skipped})`,
    );
    if (result.rejectedPath) console.log(`quarantine: ${result.rejectedPath}`);
  }
  return { files: files.length, passed, failed, inserted, skipped };
}

if (process.argv[1]?.includes("ingestAll.ts")) {
  const stats = ingestAllBatches();
  console.log(
    `ingest:all ${stats.files} files, ${stats.passed} passed, ${stats.failed} failed, inserted ${stats.inserted}, skipped ${stats.skipped}`,
  );
  if (stats.failed > 0) process.exitCode = 1;
}

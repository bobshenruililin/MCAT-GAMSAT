import { existsSync } from "node:fs";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import { buildAtlas } from "@/engine/atlas";
import { getBankScale } from "@/engine/bankScale";
import { getProgressData } from "@/engine/progress";
import { BankHero } from "@/components/BankHero";
import { ExamAtlas } from "@/components/ExamAtlas";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadAtlas() {
  if (!existsSync(getDbPath())) {
    return {
      ok: false as const,
      error: "database file missing — run pnpm db:migrate && pnpm bootstrap",
      atlas: null,
      scale: null,
    };
  }
  try {
    const { sqlite, db } = openDb();
    const progress = getProgressData(db, new Date());
    const atlas = buildAtlas(progress);
    const scale = getBankScale(db);
    sqlite.close();
    return { ok: true as const, error: null, atlas, scale };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      atlas: null,
      scale: null,
    };
  }
}

export default function AtlasPage() {
  const loaded = loadAtlas();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs text-zinc-500">
        <Link href="/" className="underline">
          Today
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Exam atlas</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-600">
        Four-layer map: exam family → foundational concept / section → content category →
        topic. Family is derived from the outline ids (B-001: the schema still stores three
        levels). Volume follows exam_weight. Official percentiles are not this map.
      </p>
      {loaded.error ? <p className="mt-4 text-sm text-red-700">{loaded.error}</p> : null}
      {loaded.scale ? (
        <div className="mt-6">
          <BankHero scale={loaded.scale} />
        </div>
      ) : null}
      {loaded.atlas ? (
        <div className="mt-8">
          <ExamAtlas atlas={loaded.atlas} />
        </div>
      ) : null}
    </main>
  );
}

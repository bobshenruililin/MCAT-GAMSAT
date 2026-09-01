import { existsSync } from "node:fs";
import Link from "next/link";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import { getProgressData } from "@/engine/progress";
import { TaxonomyTree } from "@/components/TaxonomyTree";
import { WeakestTable } from "@/components/WeakestTable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadProgress() {
  if (!existsSync(getDbPath())) {
    return { ok: false as const, error: "database file missing", data: null };
  }
  try {
    const { sqlite, db } = openDb();
    const data = getProgressData(db, new Date());
    sqlite.close();
    return { ok: true as const, error: null, data };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      data: null,
    };
  }
}

export default function ProgressPage() {
  const loaded = loadProgress();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs text-zinc-500">
        <Link href="/" className="underline">
          Today
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Progress</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Gray dots are unseen (no attempts). Color runs red → green with mastery.
      </p>
      {loaded.error ? <p className="mt-4 text-sm text-red-700">{loaded.error}</p> : null}
      {loaded.data ? (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Taxonomy</h2>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
              <TaxonomyTree nodes={loaded.data.nodes} />
            </div>
          </section>
          <section className="mt-10">
            <h2 className="text-lg font-medium">Topics, weakest first</h2>
            <p className="text-xs text-zinc-500">Click a column header to sort.</p>
            <WeakestTable topics={loaded.data.topics} />
          </section>
        </>
      ) : null}
    </main>
  );
}

import { existsSync } from "node:fs";
import Link from "next/link";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import { getTodayStats } from "@/engine/today";
import { StartButtons } from "@/components/StartButtons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadToday() {
  if (!existsSync(getDbPath())) {
    return {
      ok: false as const,
      error: "database file missing — run pnpm db:migrate && pnpm seed",
      stats: null,
    };
  }
  try {
    const { sqlite, db } = openDb();
    const stats = getTodayStats(db, new Date());
    sqlite.close();
    return { ok: true as const, error: null, stats };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      stats: null,
    };
  }
}

export default function TodayPage() {
  const today = loadToday();
  const stats = today.stats;
  const emptyBank = stats ? stats.itemCount === 0 : true;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-semibold">Today</h1>
      <p className="mt-1 text-sm text-zinc-600">Retrieval only. Confidence before reveal.</p>

      {today.error ? (
        <p className="mt-4 text-sm text-red-700">{today.error}</p>
      ) : null}

      {stats ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Due reviews</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.dueCount}</dd>
              <p className="mt-1 text-xs text-zinc-500">
                ~{stats.estimatedMinutes} min at 45s avg
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">New items available</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.newAvailable}</dd>
            </div>
          </dl>

          <StartButtons disabled={emptyBank} />
          {emptyBank ? (
            <p className="mt-3 text-sm text-zinc-600">
              Item bank is empty. Run <span className="font-mono">pnpm seed</span>.
            </p>
          ) : null}

          <section className="mt-8">
            <h2 className="text-sm font-medium">Last 7 days</h2>
            <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
              {stats.last7Days.map((day) => (
                <li key={day.date} className="flex justify-between px-4 py-2 text-sm">
                  <span className="font-mono text-zinc-600">{day.date}</span>
                  <span>{day.count} attempt{day.count === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <p className="mt-8 text-xs text-zinc-500">
        <Link href="/health" className="underline">
          Health
        </Link>
      </p>
    </main>
  );
}

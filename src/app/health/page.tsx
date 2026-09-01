import { existsSync } from "node:fs";
import { count, eq, like } from "drizzle-orm";
import Link from "next/link";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import {
  attempts,
  concepts,
  externalScores,
  fsrsState,
  items,
  masteryPriors,
  passages,
  sessions,
} from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLES = [
  { name: "concepts", table: concepts },
  { name: "passages", table: passages },
  { name: "items", table: items },
  { name: "sessions", table: sessions },
  { name: "attempts", table: attempts },
  { name: "fsrs_state", table: fsrsState },
  { name: "mastery_priors", table: masteryPriors },
  { name: "external_scores", table: externalScores },
] as const;

function loadHealth() {
  if (!existsSync(getDbPath())) {
    return {
      ok: false as const,
      error: "database file missing — run pnpm db:migrate && pnpm bootstrap",
      path: getDbPath(),
      tables: [] as { name: string; rows: number }[],
      verified: 0,
      patternItems: 0,
    };
  }
  try {
    const { sqlite, db } = openDb();
    const tables = TABLES.map(({ name, table }) => ({
      name,
      rows: db.select({ n: count() }).from(table).get()?.n ?? 0,
    }));
    const verified =
      db.select({ n: count() }).from(items).where(eq(items.verified, true)).get()?.n ?? 0;
    const patternItems =
      db.select({ n: count() }).from(items).where(like(items.skillTag, "PAT.%")).get()?.n ?? 0;
    sqlite.close();
    return { ok: true as const, error: null, path: getDbPath(), tables, verified, patternItems };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      path: getDbPath(),
      tables: [] as { name: string; rows: number }[],
      verified: 0,
      patternItems: 0,
    };
  }
}

export default function HealthPage() {
  const health = loadHealth();
  const itemRows = health.tables.find((t) => t.name === "items")?.rows ?? 0;
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">MCAT-GAMSAT health</h1>
      <p className="mt-2 text-sm text-zinc-600">{health.path}</p>
      <p className="mt-4">
        DB:{" "}
        <span className={health.ok ? "font-medium text-green-700" : "font-medium text-red-700"}>
          {health.ok ? "connected" : "disconnected"}
        </span>
      </p>
      {health.error ? <p className="mt-2 text-sm text-red-700">{health.error}</p> : null}
      {health.ok && itemRows === 0 ? (
        <p className="mt-2 text-sm text-zinc-600">
          Bank is empty. Run <span className="font-mono">pnpm bootstrap</span>.
        </p>
      ) : null}
      {health.ok ? (
        <p className="mt-2 text-sm text-zinc-600">
          verified=true:{" "}
          <span className="font-mono" data-testid="verified-count">
            {health.verified}
          </span>
          {" · "}
          PAT.* items:{" "}
          <span className="font-mono" data-testid="pattern-count">
            {health.patternItems}
          </span>
        </p>
      ) : null}
      {health.tables.length > 0 ? (
        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-2 pr-4">table</th>
              <th className="py-2">rows</th>
            </tr>
          </thead>
          <tbody>
            {health.tables.map((row) => (
              <tr key={row.name} className="border-b border-zinc-200">
                <td className="py-2 pr-4 font-mono">{row.name}</td>
                <td className="py-2">{row.rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <p className="mt-6 text-sm">
        <Link href="/" className="underline">
          Today
        </Link>
      </p>
    </main>
  );
}

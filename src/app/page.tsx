import { existsSync } from "node:fs";
import { count } from "drizzle-orm";
import { openDb } from "@/db/client";
import { DB_PATH } from "@/db/paths";
import {
  attempts,
  concepts,
  externalScores,
  fsrsState,
  items,
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
  { name: "external_scores", table: externalScores },
] as const;

function loadHealth() {
  if (!existsSync(DB_PATH)) {
    return {
      ok: false as const,
      error: "database file missing — run pnpm db:migrate && pnpm seed",
      path: DB_PATH,
      tables: [] as { name: string; rows: number }[],
    };
  }
  try {
    const { sqlite, db } = openDb();
    const tables = TABLES.map(({ name, table }) => ({
      name,
      rows: db.select({ n: count() }).from(table).get()?.n ?? 0,
    }));
    sqlite.close();
    return { ok: true as const, error: null, path: DB_PATH, tables };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      path: DB_PATH,
      tables: [] as { name: string; rows: number }[],
    };
  }
}

export default function Home() {
  const health = loadHealth();
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
    </main>
  );
}

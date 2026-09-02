import { existsSync } from "node:fs";
import { count } from "drizzle-orm";
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
import { getBankScale } from "@/engine/bankScale";
import { BankHero } from "@/components/BankHero";

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
      scale: null,
    };
  }
  try {
    const { sqlite, db } = openDb();
    const tables = TABLES.map(({ name, table }) => ({
      name,
      rows: db.select({ n: count() }).from(table).get()?.n ?? 0,
    }));
    const scale = getBankScale(db);
    sqlite.close();
    return { ok: true as const, error: null, path: getDbPath(), tables, scale };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      path: getDbPath(),
      tables: [] as { name: string; rows: number }[],
      scale: null,
    };
  }
}

export default function HealthPage() {
  const health = loadHealth();
  const itemRows = health.tables.find((t) => t.name === "items")?.rows ?? 0;
  const verified = health.scale?.verifiedTrue ?? 0;
  const patternItems = health.scale?.patternItems ?? 0;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-3xl tracking-tight">Bank health</h1>
      <p className="mt-2 font-mono text-xs text-zinc-500">{health.path}</p>
      <p className="mt-3">
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
      {health.scale ? (
        <div className="mt-6">
          <BankHero scale={health.scale} />
        </div>
      ) : null}
      {health.ok ? (
        <p className="mt-4 text-sm text-zinc-600">
          verified=true:{" "}
          <span className="font-mono" data-testid="verified-count">
            {verified}
          </span>
          {" · "}
          PAT.* items:{" "}
          <span className="font-mono" data-testid="pattern-count">
            {patternItems}
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
                <td className="py-2 tabular-nums">{row.rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <p className="mt-6 text-sm">
        <Link href="/" className="underline">
          Today
        </Link>
        {" · "}
        <Link href="/atlas" className="underline">
          Atlas
        </Link>
      </p>
    </main>
  );
}

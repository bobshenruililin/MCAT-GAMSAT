import { existsSync } from "node:fs";
import Link from "next/link";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import { getScoreboardView } from "@/engine/scoreboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadScoreboard() {
  if (!existsSync(getDbPath())) {
    return {
      ok: false as const,
      error: "database file missing — run pnpm db:migrate && pnpm bootstrap",
      view: null,
    };
  }
  try {
    const { sqlite, db } = openDb();
    const view = getScoreboardView(db, new Date());
    sqlite.close();
    return { ok: true as const, error: null, view };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      view: null,
    };
  }
}

export default function ScoreboardPage() {
  const loaded = loadScoreboard();
  const view = loaded.view;
  const stats = view?.stats;
  const sessionTotal = stats
    ? stats.dailySessions + stats.diagnosticSessions
    : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs text-zinc-500">
        <Link href="/" className="underline">
          Today
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Scoreboard</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Official percentiles come only from AAMC and ACER papers you actually sit.
        This page never invents a score. Study log is live from non-demo attempts;
        official rows are read from <span className="font-mono">SCOREBOARD.md</span>.
      </p>
      {loaded.error ? <p className="mt-4 text-sm text-red-700">{loaded.error}</p> : null}

      <section className="mt-8">
        <h2 className="text-lg font-medium">Official scores</h2>
        {view && view.official.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600" data-testid="official-empty">
            None entered. After an official sitting, add a row to{" "}
            <span className="font-mono">SCOREBOARD.md</span>. Software must not
            write a percentile here.
          </p>
        ) : null}
        {view && view.official.length > 0 ? (
          <table
            className="mt-3 w-full border-collapse text-left text-sm"
            data-testid="official-table"
          >
            <thead>
              <tr className="border-b border-zinc-300">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Exam</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Section</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {view.official.map((row, i) => (
                <tr key={`${row.date}-${row.section}-${i}`} className="border-b border-zinc-200">
                  <td className="py-2 pr-3 font-mono text-xs">{row.date}</td>
                  <td className="py-2 pr-3">{row.exam}</td>
                  <td className="py-2 pr-3">{row.source}</td>
                  <td className="py-2 pr-3">{row.section}</td>
                  <td className="py-2 pr-3">{row.score}</td>
                  <td className="py-2">{row.percentile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {stats ? (
        <section className="mt-8" data-testid="study-log">
          <h2 className="text-lg font-medium">Study log</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Sessions</dt>
              <dd className="mt-1 text-2xl font-semibold">{sessionTotal}</dd>
              <p className="mt-1 text-xs text-zinc-500">
                {stats.dailySessions} daily · {stats.diagnosticSessions} diagnostic
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Attempts</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.attempts}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Study days</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.studyDays}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Last study day</dt>
              <dd className="mt-1 text-lg font-semibold">{stats.lastStudyDay ?? "none"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-zinc-500">
            Attempted topics: {stats.topicsAttempted}
            {stats.meanMastery === null
              ? ""
              : ` · mean mastery ${stats.meanMastery.toFixed(2)}`}
            . Demo and simulation are excluded.
          </p>
        </section>
      ) : null}

      {view ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Weekly verdict</h2>
          <pre
            className="mt-3 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 font-sans text-sm text-zinc-800"
            data-testid="weekly-verdict"
          >
            {view.weekly.replace(/^## Weekly verdict\n+/, "")}
          </pre>
        </section>
      ) : null}
    </main>
  );
}

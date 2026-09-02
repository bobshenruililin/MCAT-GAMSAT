import { existsSync } from "node:fs";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import { getTodayStats } from "@/engine/today";
import { getBankScale } from "@/engine/bankScale";
import { StartButtons } from "@/components/StartButtons";
import { CoverageBars } from "@/components/CoverageBars";
import { DemoBanner } from "@/components/DemoBanner";
import { OpenSessions } from "@/components/OpenSessions";
import { UpNextCard } from "@/components/UpNextCard";
import { BankHero } from "@/components/BankHero";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadToday() {
  if (!existsSync(getDbPath())) {
    return {
      ok: false as const,
      error: "database file missing — run pnpm db:migrate && pnpm bootstrap",
      stats: null,
      scale: null,
    };
  }
  try {
    const { sqlite, db } = openDb();
    const stats = getTodayStats(db, new Date());
    const scale = getBankScale(db);
    sqlite.close();
    return { ok: true as const, error: null, stats, scale };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      stats: null,
      scale: null,
    };
  }
}

export default function TodayPage() {
  const today = loadToday();
  const stats = today.stats;
  const emptyBank = stats ? stats.itemCount === 0 : true;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl tracking-tight">Today</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Retrieval only. Confidence before reveal. The person walking into the room is the
        product. Past-paper moves are retrieved as questions (analog in the stem), then
        ranked drills, then a structure sitting that still interleaves.
      </p>
      {today.scale ? (
        <div className="mt-6">
          <BankHero scale={today.scale} />
          <p className="mt-2 text-sm text-zinc-600">
            <Link href="/atlas" className="underline">
              Exam atlas
            </Link>
            {" — "}
            family → FC → category → topic, with live item counts and 18 past-paper moves.
          </p>
        </div>
      ) : null}
      <DemoBanner show={Boolean(stats?.demo)} />

      {today.error ? (
        <p className="mt-4 text-sm text-red-700">{today.error}</p>
      ) : null}

      {stats ? (
        <>
          <OpenSessions sessions={stats.openSessions} />

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Course mastery</dt>
              <dd className="mt-1 text-2xl font-semibold" data-testid="course-mastery">
                {stats.courseMasteryLabel}
              </dd>
              <p className="mt-1 text-xs text-zinc-500">
                exam-weight mean · {Math.round(stats.proficientPlusShare * 100)}% proficient+
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Due reviews</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.dueCount}</dd>
              <p className="mt-1 text-xs text-zinc-500">
                ~{stats.estimatedMinutes} min at 45s avg
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">New items available</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{stats.newAvailable.toLocaleString("en-US")}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Streak</dt>
              <dd className="mt-1 text-2xl font-semibold" data-testid="streak">
                {stats.streak}
              </dd>
              <p className="mt-1 text-xs text-zinc-500">consecutive UTC days with attempts</p>
            </div>
          </dl>

          {stats.upNext ? (
            <UpNextCard skill={stats.upNext} disabled={emptyBank} />
          ) : null}

          <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <dt className="text-xs text-zinc-500">Weakest attempted</dt>
              {stats.weakest ? (
                <>
                  <dd className="mt-1 text-sm font-medium leading-5" data-testid="weakest-spotlight">
                    {stats.weakest.name}
                  </dd>
                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    {stats.weakest.id} · {stats.weakest.mastery.toFixed(2)} · {stats.weakest.attempts} att
                  </p>
                </>
              ) : (
                <dd className="mt-1 text-sm text-zinc-500">None yet</dd>
              )}
            </div>
          </dl>

          {stats.huntTopics.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-medium">Hunting</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Traps, content gaps, or twice-missed items that have not recovered.
                New cards from these nodes fill today&apos;s new-item quota first.
              </p>
              <ul className="mt-3 space-y-2" data-testid="hunt-topics">
                {stats.huntTopics.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
                  >
                    {n.name}
                    <span className="mt-0.5 block font-mono text-xs font-normal text-amber-800">
                      {n.id}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {stats.coverage?.length ? (
            <section className="mt-8">
              <h2 className="text-sm font-medium">Bank vs exam map</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Dark bar: topics with items. Green: topics you have attempted.
              </p>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
                <CoverageBars coverage={stats.coverage} />
              </div>
            </section>
          ) : null}

          <StartButtons disabled={emptyBank} />
          {emptyBank ? (
            <p className="mt-3 text-sm text-zinc-600">
              Item bank is empty. Run <span className="font-mono">pnpm bootstrap</span>{" "}
              (taxonomy + real batches, no PLACEHOLDER items). Default factory is 5000×
              and large; cap with{" "}
              <span className="font-mono">FACTORY_TARGET=0</span> if the SQLite file would
              be too large.
            </p>
          ) : null}
          {stats.caughtUp ? (
            <p className="mt-3 text-sm text-zinc-600" data-testid="caught-up">
              Nothing is due and there are no unseen cards in this bank. Mixed Start
              Session would be empty. Use a mastery check, pattern path, or structure
              sitting if you still want retrieval today.
            </p>
          ) : null}

          <section className="mt-8">
            <h2 className="text-sm font-medium">Due forecast, next 7 days</h2>
            <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
              {stats.dueForecast.map((day, i) => (
                <li key={day.date} className="flex justify-between px-4 py-2 text-sm">
                  <span className="font-mono text-zinc-600">
                    {day.date}
                    {i === 0 ? " (today, incl. overdue)" : ""}
                  </span>
                  <span>
                    {day.count} due · ~{day.estimatedMinutes} min
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-medium">Last 7 days</h2>
            <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
              {stats.last7Days.map((day) => (
                <li key={day.date} className="flex justify-between px-4 py-2 text-sm">
                  <span className="font-mono text-zinc-600">{day.date}</span>
                  <span>
                    {day.count} attempt{day.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}

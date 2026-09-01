import { existsSync } from "node:fs";
import Link from "next/link";
import { openDb } from "@/db/client";
import { getDbPath } from "@/db/paths";
import { getProgressData } from "@/engine/progress";
import { getInsightData } from "@/engine/progressInsights";
import { TaxonomyTree } from "@/components/TaxonomyTree";
import { WeakestTable } from "@/components/WeakestTable";
import { CoverageBars } from "@/components/CoverageBars";
import { DemoBanner } from "@/components/DemoBanner";
import {
  CalibrationChart,
  MasteryTrendChart,
  PacingChart,
} from "@/components/InsightCharts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadProgress() {
  if (!existsSync(getDbPath())) {
    return { ok: false as const, error: "database file missing", data: null, insights: null };
  }
  try {
    const { sqlite, db } = openDb();
    const now = new Date();
    const data = getProgressData(db, now);
    const insights = getInsightData(db, now);
    sqlite.close();
    return { ok: true as const, error: null, data, insights };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
      data: null,
      insights: null,
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
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Progress</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Gray dots are unseen (no attempts). Color runs red → green with mastery.
        Topic rows show Khan-like levels: unseen, struggling, familiar, proficient,
        mastered.
      </p>
      <DemoBanner show={Boolean(loaded.insights?.demo)} />
      {loaded.error ? <p className="mt-4 text-sm text-red-700">{loaded.error}</p> : null}
      {loaded.insights ? (
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium">Calibration</h2>
            <p className="text-xs text-zinc-500">Confidence bucket vs actual accuracy.</p>
            <div className="mt-3">
              <CalibrationChart points={loaded.insights.calibration} />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium">Pacing</h2>
            <p className="text-xs text-zinc-500">Attempt duration vs section time budgets.</p>
            <div className="mt-3">
              <PacingChart
                buckets={loaded.insights.pacingBuckets}
                sections={loaded.insights.pacingSections}
              />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 lg:col-span-2">
            <h2 className="text-lg font-medium">14-day trend, 5 weakest attempted nodes</h2>
            <div className="mt-3">
              <MasteryTrendChart
                dates={loaded.insights.trendDates}
                series={loaded.insights.trendSeries}
              />
            </div>
          </div>
        </section>
      ) : null}
      {loaded.data ? (
        <>
          <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-medium">Course mastery</h2>
            <p className="mt-1 text-3xl font-semibold" data-testid="progress-course-mastery">
              {Math.round(loaded.data.courseMastery * 100)}%
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Exam-weight-weighted topic mean (unseen = 0).{" "}
              {Math.round(loaded.data.proficientPlusShare * 100)}% of weighted topics are
              proficient or mastered.
            </p>
          </section>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Bank vs exam map</h2>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
              <CoverageBars coverage={loaded.data.coverage} />
            </div>
          </section>
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

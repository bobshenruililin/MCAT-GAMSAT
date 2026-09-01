import { asc, eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { attempts, concepts, items } from "@/db/schema";
import { ewmaCorrectness } from "./mastery";
import { hasDemoData } from "./demoSeed";
import { addUtcDays, startOfUtcDay, utcDayKey } from "./rng";
import {
  sectionBudgetSeconds,
  sectionFamily,
  type SectionFamily,
} from "./sectionBudget";
import { getProgressData } from "./progress";

export const PACING_BUCKETS = [
  { label: "0–30s", min: 0, max: 30 },
  { label: "30–60s", min: 30, max: 60 },
  { label: "60–90s", min: 60, max: 90 },
  { label: "90–120s", min: 90, max: 120 },
  { label: "120–150s", min: 120, max: 150 },
  { label: "150s+", min: 150, max: Infinity },
] as const;

export type CalibrationPoint = {
  confidence: number;
  n: number;
  accuracy: number;
  implied: number;
};

export type PacingBucket = {
  label: string;
  count: number;
};

export type PacingSection = {
  family: SectionFamily;
  n: number;
  meanSeconds: number;
  budgetSeconds: number;
};

export type TrendSeries = {
  conceptId: string;
  name: string;
  values: number[];
};

export type InsightData = {
  demo: boolean;
  calibration: CalibrationPoint[];
  pacingBuckets: PacingBucket[];
  pacingSections: PacingSection[];
  trendDates: string[];
  trendSeries: TrendSeries[];
};

export function getInsightData(db: AppDb, now: Date): InsightData {
  const rows = db
    .select({
      correct: attempts.correct,
      confidence: attempts.confidence,
      seconds: attempts.seconds,
      createdAt: attempts.createdAt,
      conceptId: items.conceptId,
      name: concepts.name,
    })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .orderBy(asc(attempts.createdAt))
    .all();

  const calibration: CalibrationPoint[] = [1, 2, 3, 4, 5].map((confidence) => {
    const subset = rows.filter((r) => r.confidence === confidence);
    const n = subset.length;
    const hits = subset.filter((r) => r.correct).length;
    return {
      confidence,
      n,
      accuracy: n === 0 ? 0 : hits / n,
      implied: confidence / 5,
    };
  });

  const pacingBuckets: PacingBucket[] = PACING_BUCKETS.map((b) => ({
    label: b.label,
    count: rows.filter((r) => r.seconds >= b.min && r.seconds < b.max).length,
  }));

  const byFamily = new Map<SectionFamily, { n: number; sum: number; budget: number }>();
  for (const row of rows) {
    const family = sectionFamily(row.conceptId);
    const cur = byFamily.get(family) ?? {
      n: 0,
      sum: 0,
      budget: sectionBudgetSeconds(row.conceptId),
    };
    cur.n += 1;
    cur.sum += row.seconds;
    byFamily.set(family, cur);
  }
  const pacingSections: PacingSection[] = [...byFamily.entries()]
    .map(([family, v]) => ({
      family,
      n: v.n,
      meanSeconds: v.n === 0 ? 0 : v.sum / v.n,
      budgetSeconds: v.budget,
    }))
    .sort((a, b) => a.family.localeCompare(b.family));

  const origin = startOfUtcDay(now);
  const trendDates: string[] = [];
  for (let i = 13; i >= 0; i--) {
    trendDates.push(utcDayKey(addUtcDays(origin, -i)));
  }

  const progress = getProgressData(db, now);
  const weakest = progress.topics.filter((t) => t.attempts > 0).slice(0, 5);
  const names = new Map(weakest.map((t) => [t.id, t.name]));
  const topicAttempts = rows.map((r) => ({
    conceptId: r.conceptId,
    correct: r.correct,
    createdAt: r.createdAt,
  }));

  const trendSeries: TrendSeries[] = weakest.map((t) => ({
    conceptId: t.id,
    name: names.get(t.id) ?? t.id,
    values: trendDates.map((day) => {
      const asOf = `${day}T23:59:59.999Z`;
      return ewmaCorrectness(
        topicAttempts
          .filter((a) => a.conceptId === t.id && a.createdAt <= asOf)
          .map((a) => (a.correct ? 1 : 0)),
      );
    }),
  }));

  return {
    demo: hasDemoData(db),
    calibration,
    pacingBuckets,
    pacingSections,
    trendDates,
    trendSeries,
  };
}

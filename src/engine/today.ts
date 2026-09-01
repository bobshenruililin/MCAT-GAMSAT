import { eq, isNull } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { attempts, fsrsState, items } from "@/db/schema";
import { getDueItems } from "./reviewEngine";
import { hasDemoData } from "./demoSeed";
import { addUtcDays, utcDayKey } from "./rng";
import { huntTopicsFromDb } from "./sessionService";
import { getProgressData } from "./progress";
import { pickUpNext, type UpNextSkill } from "./upNext";
import { formatPercent } from "./masteryLevel";

const AVG_SECONDS = 45;

export type DayCount = {
  date: string;
  count: number;
};

export type DueForecastDay = {
  date: string;
  count: number;
  estimatedMinutes: number;
};

export type WeakestSpotlight = {
  id: string;
  name: string;
  mastery: number;
  attempts: number;
};

export type HuntSpotlight = {
  id: string;
  name: string;
};

export type TodayStats = {
  dueCount: number;
  estimatedMinutes: number;
  newAvailable: number;
  itemCount: number;
  last7Days: DayCount[];
  dueForecast: DueForecastDay[];
  streak: number;
  weakest: WeakestSpotlight | null;
  huntTopics: HuntSpotlight[];
  coverage: { family: string; topics: number; withItems: number; attempted: number }[];
  demo: boolean;
  courseMastery: number;
  proficientPlusShare: number;
  courseMasteryLabel: string;
  upNext: UpNextSkill | null;
};

function minutesFor(count: number): number {
  return Math.round(((count * AVG_SECONDS) / 60) * 10) / 10;
}

export function studyStreak(attemptDays: Set<string>, todayKey: string): number {
  if (!attemptDays.has(todayKey)) return 0;
  let n = 0;
  const cursor = new Date(`${todayKey}T12:00:00.000Z`);
  while (attemptDays.has(utcDayKey(cursor))) {
    n += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return n;
}

export function getTodayStats(db: AppDb, now: Date): TodayStats {
  const dueCount = getDueItems(db, now, 100_000).length;
  const itemCount = db.select({ id: items.id }).from(items).all().length;
  const unseen = db
    .select({ id: items.id })
    .from(items)
    .leftJoin(fsrsState, eq(fsrsState.itemId, items.id))
    .where(isNull(fsrsState.itemId))
    .all().length;

  const last7Days: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addUtcDays(now, -i);
    last7Days.push({ date: utcDayKey(d), count: 0 });
  }
  const byDate = new Map(last7Days.map((row) => [row.date, row]));
  const windowStart = last7Days[0]?.date;
  const rows = db.select({ createdAt: attempts.createdAt }).from(attempts).all();
  const allAttemptDays = new Set<string>();
  for (const row of rows) {
    const key = row.createdAt.slice(0, 10);
    allAttemptDays.add(key);
    if (windowStart && key < windowStart) continue;
    const bucket = byDate.get(key);
    if (bucket) bucket.count += 1;
  }

  const todayKey = utcDayKey(now);
  const dueForecast: DueForecastDay[] = [];
  const fsrsRows = db
    .select({ dueAt: fsrsState.dueAt, state: fsrsState.state })
    .from(fsrsState)
    .all()
    .filter((r) => r.state !== "new");
  for (let i = 0; i < 7; i++) {
    const date = utcDayKey(addUtcDays(now, i));
    let count = 0;
    for (const row of fsrsRows) {
      const dueDay = row.dueAt.slice(0, 10);
      if (i === 0) {
        if (row.dueAt <= now.toISOString()) count += 1;
      } else if (dueDay === date) {
        count += 1;
      }
    }
    dueForecast.push({ date, count, estimatedMinutes: minutesFor(count) });
  }

  const progress = getProgressData(db, now);
  const weakestTopic = progress.topics.find((t) => t.attempts > 0) ?? null;
  const weakest: WeakestSpotlight | null = weakestTopic
    ? {
        id: weakestTopic.id,
        name: weakestTopic.name,
        mastery: weakestTopic.mastery,
        attempts: weakestTopic.attempts,
      }
    : null;

  const huntIds = huntTopicsFromDb(db, now);
  const byId = new Map(progress.nodes.map((n) => [n.id, n]));
  const huntTopics: HuntSpotlight[] = huntIds.map((id) => ({
    id,
    name: byId.get(id)?.name ?? id,
  }));

  const upNext = pickUpNext(
    progress.topics.map((t) => ({
      id: t.id,
      name: t.name,
      mastery: t.mastery,
      attempts: t.attempts,
      examWeight: t.examWeight,
      itemCount: t.itemCount,
    })),
    huntIds,
  );

  return {
    dueCount,
    estimatedMinutes: minutesFor(dueCount),
    newAvailable: unseen,
    itemCount,
    last7Days,
    dueForecast,
    streak: studyStreak(allAttemptDays, todayKey),
    weakest,
    huntTopics,
    coverage: progress.coverage,
    demo: hasDemoData(db),
    courseMastery: progress.courseMastery,
    proficientPlusShare: progress.proficientPlusShare,
    courseMasteryLabel: formatPercent(progress.courseMastery),
    upNext,
  };
}

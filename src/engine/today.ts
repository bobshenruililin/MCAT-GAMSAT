import { eq, isNull } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { attempts, fsrsState, items } from "@/db/schema";
import { getDueItems } from "./reviewEngine";

const AVG_SECONDS = 45;

export type DayCount = {
  date: string;
  count: number;
};

export type TodayStats = {
  dueCount: number;
  estimatedMinutes: number;
  newAvailable: number;
  itemCount: number;
  last7Days: DayCount[];
};

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
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
    const d = new Date(now.getTime());
    d.setUTCDate(d.getUTCDate() - i);
    last7Days.push({ date: utcDayKey(d), count: 0 });
  }
  const byDate = new Map(last7Days.map((row) => [row.date, row]));
  const windowStart = last7Days[0]?.date;
  const rows = db.select({ createdAt: attempts.createdAt }).from(attempts).all();
  for (const row of rows) {
    const key = row.createdAt.slice(0, 10);
    if (windowStart && key < windowStart) continue;
    const bucket = byDate.get(key);
    if (bucket) bucket.count += 1;
  }

  return {
    dueCount,
    estimatedMinutes: Math.round(((dueCount * AVG_SECONDS) / 60) * 10) / 10,
    newAvailable: unseen,
    itemCount,
    last7Days,
  };
}

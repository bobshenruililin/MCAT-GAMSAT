import { eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import {
  attempts,
  fsrsState,
  items,
  masteryPriors,
  sessions,
  ERROR_CLASSES,
  type ErrorClass,
} from "@/db/schema";
import { toIso } from "./dates";
import { getDueItems } from "./reviewEngine";
import { recordAttempt } from "./sessionService";
import { addUtcDays, mulberry32, startOfUtcDay, utcDayKey } from "./rng";
import { sectionBudgetSeconds } from "./sectionBudget";
import { interleaveItems } from "./sessionAssembler";

export const DEMO_SEED = 20260901;
export const DEMO_DAYS = 14;
export const DEMO_SESSION_PREFIX = "demo-day-";
export const DEMO_LABEL =
  "[DEMO] simulated study — not real attempts. pnpm db:reset wipes this. Do not copy into SCOREBOARD.md.";

const WEAK_TOPICS = [
  "MCAT.FC1.1D.t3",
  "MCAT.FC6.6C.t1",
  "MCAT.FC9.9B.t1",
  "MCAT.FC4.4B.t1",
  "GAMSAT.S3.phys.t26",
];

const ERRORS = ERROR_CLASSES.filter((c) => c !== "other") as ErrorClass[];

export type DemoSessionConfig = {
  demo: true;
  label: string;
  itemIds: string[];
  interleave_exceptions: number;
};

export type DemoSeedResult = {
  days: number;
  sessions: number;
  attempts: number;
  demo: true;
};

type ItemRow = {
  id: string;
  conceptId: string;
  correctKey: string;
  choices: { key: string }[];
};

export function isDemoConfig(config: Record<string, unknown>): boolean {
  return config.demo === true;
}

export function hasDemoData(db: AppDb): boolean {
  return db
    .select()
    .from(sessions)
    .all()
    .some((s) => s.id.startsWith(DEMO_SESSION_PREFIX) || isDemoConfig(s.config));
}

export function hasRealStudy(db: AppDb): boolean {
  return db
    .select()
    .from(sessions)
    .all()
    .some((s) => !s.id.startsWith(DEMO_SESSION_PREFIX) && !isDemoConfig(s.config));
}

export function wipeDemoData(db: AppDb): number {
  const demoSessions = db
    .select()
    .from(sessions)
    .all()
    .filter((s) => s.id.startsWith(DEMO_SESSION_PREFIX) || isDemoConfig(s.config));
  for (const s of demoSessions) {
    db.delete(masteryPriors).where(eq(masteryPriors.sessionId, s.id)).run();
    db.delete(attempts).where(eq(attempts.sessionId, s.id)).run();
    db.delete(sessions).where(eq(sessions.id, s.id)).run();
  }
  if (!hasRealStudy(db)) {
    db.delete(fsrsState).run();
  }
  return demoSessions.length;
}

function pickWrongKey(item: ItemRow, rng: () => number): string {
  const wrong = item.choices.map((c) => c.key).filter((k) => k !== item.correctKey);
  if (wrong.length === 0) return item.correctKey === "A" ? "B" : "A";
  return wrong[Math.floor(rng() * wrong.length)] ?? wrong[0];
}

function hitProbability(isWeak: boolean, dayIndex: number): number {
  if (isWeak) return Math.min(0.55, 0.28 + dayIndex * 0.016);
  return Math.min(0.9, 0.52 + dayIndex * 0.026);
}

function buildDayQueue(
  db: AppDb,
  now: Date,
  rng: () => number,
  allItems: ItemRow[],
): { id: string; conceptId: string }[] {
  const due = getDueItems(db, now, 12).map((d) => ({
    id: d.itemId,
    conceptId: d.conceptId,
  }));
  const dueIds = new Set(due.map((d) => d.id));
  const seenFsrs = new Set(
    db
      .select({ itemId: fsrsState.itemId })
      .from(fsrsState)
      .all()
      .map((r) => r.itemId),
  );
  const unseen = allItems.filter((i) => !seenFsrs.has(i.id) && !dueIds.has(i.id));
  const byTopic = new Map<string, ItemRow[]>();
  for (const item of unseen) {
    const list = byTopic.get(item.conceptId) ?? [];
    list.push(item);
    byTopic.set(item.conceptId, list);
  }
  const topicIds = [...byTopic.keys()].sort();
  const news: { id: string; conceptId: string }[] = [];
  const wantNew = 12;
  let t = Math.floor(rng() * Math.max(topicIds.length, 1));
  let spins = 0;
  while (news.length < wantNew && topicIds.length > 0 && spins < topicIds.length * 8) {
    const topic = topicIds[t % topicIds.length];
    const pool = byTopic.get(topic);
    const item = pool?.shift();
    if (item) news.push({ id: item.id, conceptId: item.conceptId });
    t += 1;
    spins += 1;
  }
  for (const topic of WEAK_TOPICS) {
    if (news.some((n) => n.conceptId === topic)) continue;
    const extra = (byTopic.get(topic) ?? []).shift();
    if (extra) news.push({ id: extra.id, conceptId: extra.conceptId });
  }
  if (news.length < 4) {
    for (const item of allItems) {
      if (dueIds.has(item.id) || news.some((n) => n.id === item.id)) continue;
      news.push({ id: item.id, conceptId: item.conceptId });
      if (news.length >= 8) break;
    }
  }
  return interleaveItems([...due, ...news]).items;
}

export function seedDemoHistory(
  db: AppDb,
  now: Date,
  seed = DEMO_SEED,
): DemoSeedResult {
  const itemCount = db.select({ id: items.id }).from(items).all().length;
  if (itemCount === 0) {
    throw new Error("demo:seed needs items — run pnpm seed && pnpm ingest first");
  }
  if (hasRealStudy(db)) {
    throw new Error(
      "demo:seed refuses to mix with real study sessions. pnpm db:reset, seed, ingest, then demo:seed",
    );
  }
  wipeDemoData(db);

  const rng = mulberry32(seed);
  const allItems: ItemRow[] = db
    .select({
      id: items.id,
      conceptId: items.conceptId,
      correctKey: items.correctKey,
      choices: items.choices,
    })
    .from(items)
    .all();
  const presentTopics = new Set(allItems.map((i) => i.conceptId));
  const weakSet = new Set(WEAK_TOPICS.filter((t) => presentTopics.has(t)));
  const origin = startOfUtcDay(now);
  const firstDay = addUtcDays(origin, -(DEMO_DAYS - 1));
  let attemptCount = 0;
  let sessionCount = 0;

  for (let day = 0; day < DEMO_DAYS; day++) {
    const dayStart = addUtcDays(firstDay, day);
    const sessionAt = new Date(dayStart.getTime() + 16 * 60 * 60 * 1000);
    const queue = buildDayQueue(db, sessionAt, rng, allItems);
    if (queue.length === 0) continue;
    const sessionId = `${DEMO_SESSION_PREFIX}${utcDayKey(dayStart)}`;
    const config: DemoSessionConfig = {
      demo: true,
      label: DEMO_LABEL,
      itemIds: queue.map((q) => q.id),
      interleave_exceptions: 0,
    };
    db.insert(sessions)
      .values({
        id: sessionId,
        kind: "simulation",
        startedAt: toIso(sessionAt),
        endedAt: null,
        config,
      })
      .run();
    sessionCount += 1;
    const byId = new Map(allItems.map((i) => [i.id, i]));
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i];
      const item = byId.get(q.id);
      if (!item) continue;
      const isWeak = weakSet.has(item.conceptId);
      const correct = rng() < hitProbability(isWeak, day);
      const answeredKey = correct ? item.correctKey : pickWrongKey(item, rng);
      let confidence: number;
      if (correct) {
        confidence = rng() < 0.7 ? 4 : rng() < 0.5 ? 5 : 3;
      } else if (rng() < Math.max(0.15, 0.45 - day * 0.02)) {
        confidence = rng() < 0.5 ? 4 : 5;
      } else {
        confidence = rng() < 0.5 ? 2 : 3;
      }
      const budget = sectionBudgetSeconds(item.conceptId);
      const seconds = Math.max(
        8,
        budget * (isWeak ? 0.7 + rng() * 0.9 : 0.45 + rng() * 0.7),
      );
      const attemptAt = new Date(sessionAt.getTime() + i * 90 * 1000);
      recordAttempt(db, {
        sessionId,
        itemId: item.id,
        answeredKey,
        confidence,
        seconds: Math.round(seconds * 10) / 10,
        errorClass: correct
          ? null
          : ERRORS[Math.floor(rng() * ERRORS.length)] ?? "content_gap",
        now: attemptAt,
      });
      attemptCount += 1;
    }
    db.update(sessions)
      .set({
        endedAt: toIso(new Date(sessionAt.getTime() + queue.length * 90 * 1000)),
      })
      .where(eq(sessions.id, sessionId))
      .run();
  }

  return { days: DEMO_DAYS, sessions: sessionCount, attempts: attemptCount, demo: true };
}

import { describe, expect, it } from "vitest";
import { count } from "drizzle-orm";
import { attempts, sessions } from "@/db/schema";
import {
  hasDemoData,
  hasRealStudy,
  seedDemoHistory,
  wipeDemoData,
  DEMO_LABEL,
} from "./demoSeed";
import { getInsightData } from "./progressInsights";
import { getTodayStats, studyStreak } from "./today";
import { createDailySession } from "./sessionService";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";
import { sectionBudgetSeconds, sectionFamily } from "./sectionBudget";

const TOPICS = [
  "MCAT.FC1.1A.t1",
  "MCAT.FC1.1D.t3",
  "MCAT.FC4.4B.t1",
  "MCAT.FC5.5B.t1",
  "MCAT.FC6.6C.t1",
  "MCAT.CARS.FND.t1",
  "GAMSAT.S3.phys.t26",
  "MCAT.FC9.9B.t1",
];

function loadBank(db: ReturnType<typeof tempMigratedDb>["db"]) {
  insertTopicTree(db, TOPICS);
  for (const topic of TOPICS) {
    for (let i = 0; i < 6; i++) {
      insertDiscrete(db, `${topic}-q${i}`, topic, "A");
    }
  }
}

describe("section budgets", () => {
  it("maps CARS, science, and GAMSAT to distinct budgets", () => {
    expect(sectionFamily("MCAT.CARS.FND.t1")).toBe("MCAT CARS");
    expect(sectionBudgetSeconds("MCAT.CARS.FND.t1")).toBe(102);
    expect(sectionBudgetSeconds("MCAT.FC1.1A.t1")).toBe(95);
    expect(sectionBudgetSeconds("GAMSAT.S3.phys.t26")).toBe(120);
    expect(sectionFamily("GAMSAT.S1.understand.t1")).toBe("GAMSAT S1");
    expect(sectionBudgetSeconds("GAMSAT.S1.understand.t1")).toBe(97);
    expect(sectionFamily("GAMSAT.S2.craft.t1")).toBe("GAMSAT S2");
    expect(sectionBudgetSeconds("GAMSAT.S2.craft.t1")).toBe(90);
  });
});

describe("studyStreak", () => {
  it("counts consecutive days ending today and drops if today is empty", () => {
    expect(studyStreak(new Set(["2026-09-01", "2026-08-31"]), "2026-09-01")).toBe(2);
    expect(studyStreak(new Set(["2026-08-31"]), "2026-09-01")).toBe(0);
  });
});

describe("demo:seed", () => {
  const now = new Date("2026-09-01T18:00:00.000Z");

  it("writes marked simulation history, insights, streak, and forecast", () => {
    const { db, close } = tempMigratedDb();
    loadBank(db);
    const first = seedDemoHistory(db, now);
    expect(first.days).toBe(14);
    expect(first.sessions).toBe(14);
    expect(first.attempts).toBeGreaterThan(80);
    expect(hasDemoData(db)).toBe(true);
    expect(hasRealStudy(db)).toBe(false);
    const session = db.select().from(sessions).all()[0];
    expect(session.kind).toBe("simulation");
    expect(session.config).toMatchObject({ demo: true, label: DEMO_LABEL });
    expect(db.select({ n: count() }).from(attempts).get()?.n).toBe(first.attempts);

    const again = seedDemoHistory(db, now);
    expect(again.attempts).toBe(first.attempts);
    expect(db.select({ n: count() }).from(sessions).get()?.n).toBe(14);

    const insights = getInsightData(db, now);
    expect(insights.demo).toBe(true);
    expect(insights.calibration).toHaveLength(5);
    expect(insights.calibration.some((c) => c.n > 0)).toBe(true);
    expect(insights.pacingBuckets.reduce((s, b) => s + b.count, 0)).toBe(first.attempts);
    expect(insights.pacingSections.length).toBeGreaterThan(0);
    expect(insights.trendDates).toHaveLength(14);
    expect(insights.trendSeries.length).toBeGreaterThan(0);
    expect(insights.trendSeries.length).toBeLessThanOrEqual(5);

    const today = getTodayStats(db, now);
    expect(today.demo).toBe(true);
    expect(today.streak).toBe(14);
    expect(today.dueForecast).toHaveLength(7);
    expect(today.dueForecast[0]?.date).toBe("2026-09-01");
    expect(today.weakest).not.toBeNull();
    expect(today.upNext).not.toBeNull();
    expect(today.courseMastery).toBeGreaterThan(0);
    expect(today.last7Days.reduce((s, d) => s + d.count, 0)).toBeGreaterThan(0);
    close();
  });

  it("refuses to mix with a real daily session", () => {
    const { db, close } = tempMigratedDb();
    loadBank(db);
    createDailySession(db, now, { reviewCap: 2, newCap: 2 });
    expect(hasRealStudy(db)).toBe(true);
    expect(() => seedDemoHistory(db, now)).toThrow(/real study/);
    close();
  });

  it("wipeDemoData removes demo sessions", () => {
    const { db, close } = tempMigratedDb();
    loadBank(db);
    seedDemoHistory(db, now);
    expect(wipeDemoData(db)).toBe(14);
    expect(hasDemoData(db)).toBe(false);
    expect(db.select({ n: count() }).from(attempts).get()?.n).toBe(0);
    close();
  });
});

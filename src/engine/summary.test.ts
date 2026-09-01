import { describe, expect, it } from "vitest";
import { attempts, sessions } from "@/db/schema";
import { getSessionSummary, sessionBudgetLabel } from "./summary";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

describe("sessionBudgetLabel", () => {
  it("names CARS, GAMSAT, and mixed sessions distinctly", () => {
    expect(sessionBudgetLabel(["MCAT.CARS.FND.t1"])).toBe("102s MCAT CARS budget");
    expect(sessionBudgetLabel(["GAMSAT.S3.phys.t26"])).toBe("120s GAMSAT S3 budget");
    expect(sessionBudgetLabel(["MCAT.FC1.1A.t1"])).toBe("95s MCAT B/B budget");
    expect(sessionBudgetLabel(["MCAT.CARS.FND.t1", "MCAT.FC1.1A.t1"])).toMatch(
      /mixed-section/,
    );
  });
});

describe("getSessionSummary budget", () => {
  it("uses the CARS budget for a CARS-only session", () => {
    const { db, close } = tempMigratedDb();
    const now = new Date("2026-09-01T12:00:00.000Z");
    insertTopicTree(db, ["MCAT.CARS.FND.t1"]);
    insertDiscrete(db, "cars-1", "MCAT.CARS.FND.t1");
    db.insert(sessions)
      .values({
        id: "s1",
        kind: "daily",
        startedAt: "2026-09-01T12:00:00.000Z",
        endedAt: "2026-09-01T12:10:00.000Z",
        config: { itemIds: ["cars-1"] },
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a1",
        itemId: "cars-1",
        sessionId: "s1",
        answeredKey: "A",
        correct: true,
        confidence: 3,
        seconds: 80,
        errorClass: null,
        createdAt: "2026-09-01T12:01:00.000Z",
      })
      .run();
    const summary = getSessionSummary(db, "s1", now);
    expect(summary.mcatBudgetSeconds).toBe(102);
    expect(summary.budgetLabel).toBe("102s MCAT CARS budget");
    expect(summary.mode).toBe("daily");
    expect(summary.perTopic[0]?.previousLevel).toBe("unseen");
    expect(summary.perTopic[0]?.leveledUp).toBe(true);
    close();
  });
});

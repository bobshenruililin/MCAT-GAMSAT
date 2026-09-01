import { describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { attempts, concepts, masteryPriors, sessions } from "@/db/schema";
import { ewmaCorrectness } from "./mastery";
import {
  assembleDiagnostic,
  diagnosticPriors,
  writeDiagnosticPriors,
} from "./diagnostic";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

describe("assembleDiagnostic", () => {
  it("takes at most 3 per category, zeros first, and hard-caps at 90", () => {
    const candidates = [];
    for (const cat of ["C0", "C1", "C2", "C3"]) {
      for (let i = 0; i < 5; i++) {
        candidates.push({
          id: `${cat}-q${i}`,
          conceptId: `${cat}.t`,
          categoryId: cat,
        });
      }
    }
    const counts = { C0: 4, C1: 0, C2: 1, C3: 0 };
    const assembled = assembleDiagnostic(candidates, counts, {
      perCategory: 3,
      cap: 90,
    });
    expect(assembled.items).toHaveLength(12);
    const byCat = new Map<string, number>();
    for (const item of assembled.items) {
      const cat = item.id.slice(0, 2);
      byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
    }
    expect([...byCat.values()].every((n) => n <= 3)).toBe(true);

    const capped = assembleDiagnostic(candidates, counts, {
      perCategory: 3,
      cap: 7,
    });
    expect(capped.items).toHaveLength(7);
    const firstCats = capped.items.map((i) => i.id.slice(0, 2));
    // zero-attempt C1 and C3 are drawn before C2/C0
    expect(new Set(firstCats.slice(0, 6))).toEqual(new Set(["C1", "C3"]));
  });
});

describe("diagnosticPriors", () => {
  it("writes EWMA on sampled topics and shrinks unsampled siblings toward 0.3", () => {
    const nodes = [
      { id: "MCAT.FC1", parentId: null, examWeight: 0.2 },
      { id: "MCAT.FC1.1A", parentId: "MCAT.FC1", examWeight: 0.1 },
      { id: "MCAT.FC1.1B", parentId: "MCAT.FC1", examWeight: 0.1 },
      { id: "MCAT.FC1.1A.t1", parentId: "MCAT.FC1.1A", examWeight: 0.05 },
      { id: "MCAT.FC1.1A.t2", parentId: "MCAT.FC1.1A", examWeight: 0.05 },
      { id: "MCAT.FC1.1B.t1", parentId: "MCAT.FC1.1B", examWeight: 0.05 },
      { id: "MCAT.FC2", parentId: null, examWeight: 0.1 },
      { id: "MCAT.FC2.2A", parentId: "MCAT.FC2", examWeight: 0.1 },
      { id: "MCAT.FC2.2A.t1", parentId: "MCAT.FC2.2A", examWeight: 0.05 },
    ];
    const sampled = { "MCAT.FC1.1A.t1": 0.8 };
    const priors = diagnosticPriors(nodes, sampled);
    expect(priors["MCAT.FC1.1A.t1"]).toBeCloseTo(0.8, 10);
    expect(priors["MCAT.FC1.1A.t2"]).toBeCloseTo(0.5 * 0.8 + 0.5 * 0.3, 10);
    const catA = (0.8 * 0.05 + 0.55 * 0.05) / 0.1;
    expect(priors["MCAT.FC1.1A"]).toBeCloseTo(catA, 10);
    expect(priors["MCAT.FC1.1B"]).toBeCloseTo(0.5 * catA + 0.5 * 0.3, 10);
    expect(priors["MCAT.FC1.1B.t1"]).toBeCloseTo(
      0.5 * priors["MCAT.FC1.1B"] + 0.5 * 0.3,
      10,
    );
    expect(priors["MCAT.FC2"]).toBeCloseTo(0.3, 10);
    expect(priors["MCAT.FC2.2A.t1"]).toBeCloseTo(0.3, 10);
    expect(Object.keys(priors)).toHaveLength(nodes.length);
  });
});

describe("writeDiagnosticPriors fixture answers", () => {
  it("stores EWMA-from-diagnostic on sampled topics and inherited priors elsewhere", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(
      db,
      ["MCAT.FC1.1A.t1", "MCAT.FC1.1A.t2", "MCAT.FC1.1B.t1", "MCAT.FC2.2A.t1"],
      0.05,
    );
    insertDiscrete(db, "q1", "MCAT.FC1.1A.t1", "A");
    insertDiscrete(db, "q2", "MCAT.FC1.1A.t1", "A");
    insertDiscrete(db, "q3", "MCAT.FC1.1A.t2", "A");
    insertDiscrete(db, "q4", "MCAT.FC2.2A.t1", "A");

    const now = new Date("2026-09-01T12:00:00.000Z");
    db.insert(sessions)
      .values({
        id: "diag-1",
        kind: "diagnostic",
        startedAt: now.toISOString(),
        endedAt: now.toISOString(),
        config: { itemIds: ["q1", "q2"] },
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a1",
        itemId: "q1",
        sessionId: "diag-1",
        answeredKey: "A",
        correct: true,
        confidence: 4,
        seconds: 10,
        errorClass: null,
        createdAt: "2026-09-01T12:00:01.000Z",
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a2",
        itemId: "q2",
        sessionId: "diag-1",
        answeredKey: "B",
        correct: false,
        confidence: 2,
        seconds: 12,
        errorClass: "content_gap",
        createdAt: "2026-09-01T12:00:02.000Z",
      })
      .run();

    writeDiagnosticPriors(db, "diag-1", now);

    const expectedEwma = ewmaCorrectness([1, 0]);
    const sampled = db
      .select()
      .from(masteryPriors)
      .where(eq(masteryPriors.conceptId, "MCAT.FC1.1A.t1"))
      .get();
    expect(sampled?.value).toBeCloseTo(expectedEwma, 10);
    expect(sampled?.source).toBe("diagnostic");
    expect(sampled?.sessionId).toBe("diag-1");

    const sibling = db
      .select()
      .from(masteryPriors)
      .where(eq(masteryPriors.conceptId, "MCAT.FC1.1A.t2"))
      .get();
    expect(sibling?.value).toBeCloseTo(0.5 * expectedEwma + 0.5 * 0.3, 5);

    const otherBranch = db
      .select()
      .from(masteryPriors)
      .where(eq(masteryPriors.conceptId, "MCAT.FC2.2A.t1"))
      .get();
    expect(otherBranch?.value).toBeCloseTo(0.3, 10);

    const n = db.select({ n: count() }).from(masteryPriors).get()?.n;
    const conceptN = db.select({ n: count() }).from(concepts).get()?.n;
    expect(n).toBe(conceptN);
    close();
  });
});

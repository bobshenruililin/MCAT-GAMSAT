import { afterEach, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { attempts, fsrsState, items } from "@/db/schema";
import { POST as postSession } from "@/app/api/sessions/route";
import { GET as getNext } from "@/app/api/sessions/[id]/next/route";
import { POST as postGrade } from "@/app/api/sessions/[id]/grade/route";
import { POST as postAttempt } from "@/app/api/attempts/route";
import { openDb } from "@/db/client";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

const topics = [
  "MCAT.FC1.1A.t1",
  "MCAT.FC1.1B.t1",
  "MCAT.FC1.1C.t1",
  "MCAT.FC1.1D.t1",
  "MCAT.FC2.2A.t1",
  "MCAT.FC2.2B.t1",
  "MCAT.FC2.2C.t1",
  "MCAT.FC3.3A.t1",
  "MCAT.FC3.3B.t1",
  "MCAT.FC4.4A.t1",
];

describe("API 20-item session", () => {
  const prev = process.env.MCAT_DB_PATH;
  afterEach(() => {
    if (prev === undefined) delete process.env.MCAT_DB_PATH;
    else process.env.MCAT_DB_PATH = prev;
  });

  it("runs a full 20-item daily session through the API on a fresh DB", async () => {
    const { dbPath, db, close } = tempMigratedDb();
    process.env.MCAT_DB_PATH = dbPath;
    insertTopicTree(db, topics);
    for (const topic of topics) {
      for (let i = 0; i < 2; i++) {
        insertDiscrete(db, `${topic}-q${i}`, topic);
      }
    }
    close();

    const now = "2026-07-01T12:00:00.000Z";
    const created = await postSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ now, reviewCap: 50, newCap: 20 }),
      }),
    );
    expect(created.status).toBe(200);
    const session = (await created.json()) as { id: string; itemIds: string[] };
    expect(session.itemIds).toHaveLength(20);

    for (let i = 0; i < 20; i++) {
      const nextRes = await getNext(
        new Request(`http://localhost/api/sessions/${session.id}/next?now=${now}`),
        { params: Promise.resolve({ id: session.id }) },
      );
      const next = (await nextRes.json()) as {
        done: boolean;
        item: {
          id: string;
          stem: string;
          correctKey?: string;
          explanation?: string;
          distractorRationales?: Record<string, string>;
        };
      };
      expect(next.done).toBe(false);
      expect(next.item.correctKey).toBeUndefined();
      expect(next.item.explanation).toBeUndefined();
      expect(next.item.distractorRationales).toBeUndefined();

      const attemptRes = await postAttempt(
        new Request("http://localhost/api/attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            itemId: next.item.id,
            answeredKey: i % 5 === 0 ? "B" : "A",
            confidence: i % 5 === 0 ? 2 : 4,
            seconds: 8,
            errorClass: i % 5 === 0 ? "content_gap" : null,
            now,
          }),
        }),
      );
      expect(attemptRes.status).toBe(200);
      const attempt = (await attemptRes.json()) as {
        correct: boolean;
        explanation: string;
        correctKey: string;
        distractorRationales: Record<string, string>;
      };
      expect(attempt.correctKey).toBe("A");
      expect(attempt.explanation.length).toBeGreaterThan(0);
      expect(attempt.distractorRationales.B).toBe("wrong");
      expect(attempt.correct).toBe(i % 5 !== 0);
    }

    const doneRes = await getNext(
      new Request(`http://localhost/api/sessions/${session.id}/next?now=${now}`),
      { params: Promise.resolve({ id: session.id }) },
    );
    const done = (await doneRes.json()) as { done: boolean };
    expect(done.done).toBe(true);

    const reopened = openDb(dbPath);
    const attemptCount = reopened.db.select({ n: count() }).from(attempts).get()?.n;
    const fsrsCount = reopened.db.select({ n: count() }).from(fsrsState).get()?.n;
    expect(attemptCount).toBe(20);
    expect(fsrsCount).toBe(20);
    reopened.sqlite.close();
  });

  it("starts a skill session that interleaves the focus topic with a contrast topic", async () => {
    const { dbPath, db, close } = tempMigratedDb();
    process.env.MCAT_DB_PATH = dbPath;
    insertTopicTree(db, ["MCAT.FC1.1A.t1", "MCAT.CARS.FND.t1"]);
    for (let i = 0; i < 6; i++) {
      insertDiscrete(db, `bb-${i}`, "MCAT.FC1.1A.t1");
      insertDiscrete(db, `cars-${i}`, "MCAT.CARS.FND.t1");
    }
    close();

    const created = await postSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          now: "2026-07-01T12:00:00.000Z",
          mode: "skill",
          skillTopicId: "MCAT.FC1.1A.t1",
        }),
      }),
    );
    expect(created.status).toBe(200);
    const session = (await created.json()) as {
      id: string;
      kind: string;
      mode: string;
      skillTopicId: string;
      contrastTopicId: string | null;
      itemIds: string[];
      interleave_exceptions: number;
    };
    expect(session.kind).toBe("daily");
    expect(session.mode).toBe("skill");
    expect(session.skillTopicId).toBe("MCAT.FC1.1A.t1");
    expect(session.contrastTopicId).toBe("MCAT.CARS.FND.t1");
    expect(session.itemIds).toHaveLength(8);
    expect(session.interleave_exceptions).toBe(0);

    const reopened = openDb(dbPath);
    const concepts = session.itemIds.map((id) => {
      const row = reopened.db
        .select({ conceptId: items.conceptId })
        .from(items)
        .where(eq(items.id, id))
        .get();
      return row?.conceptId;
    });
    expect(concepts.filter((c) => c === "MCAT.FC1.1A.t1")).toHaveLength(4);
    expect(concepts.filter((c) => c === "MCAT.CARS.FND.t1")).toHaveLength(4);
    for (let i = 1; i < concepts.length; i++) {
      expect(concepts[i]).not.toBe(concepts[i - 1]);
    }
    reopened.sqlite.close();
  });
});

describe("API pattern path", () => {
  const prev = process.env.MCAT_DB_PATH;
  afterEach(() => {
    if (prev === undefined) delete process.env.MCAT_DB_PATH;
    else process.env.MCAT_DB_PATH = prev;
  });

  function seedPatternBank() {
    const { dbPath, db, close } = tempMigratedDb();
    process.env.MCAT_DB_PATH = dbPath;
    insertTopicTree(db, [
      "MCAT.CARS.FND.t1",
      "MCAT.FC4.4B.t1",
      "MCAT.FC1.1A.t1",
      "GAMSAT.S3.bio.t1",
    ]);
    for (let i = 0; i < 10; i++) {
      insertDiscrete(db, `cars-e-${i}`, "MCAT.CARS.FND.t1", "A", 0.2 + (i % 3) * 0.05, "PAT.CARS.main_point");
      insertDiscrete(db, `cp-e-${i}`, "MCAT.FC4.4B.t1", "A", 0.22, "PAT.CP.setup_equation");
      insertDiscrete(db, `bb-e-${i}`, "MCAT.FC1.1A.t1", "A", 0.25, "PAT.BB.control");
      insertDiscrete(db, `cars-h-${i}`, "MCAT.CARS.FND.t1", "A", 0.55 + i * 0.03, "PAT.CARS.main_point");
      insertDiscrete(db, `s3-${i}`, "GAMSAT.S3.bio.t1", "A", 0.4, "PAT.S3.control_s3");
    }
    close();
    return dbPath;
  }

  it("starts pattern entry from low-difficulty PAT items and does not leak the move on GET next", async () => {
    seedPatternBank();
    const now = "2026-07-01T12:00:00.000Z";
    const created = await postSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ now, mode: "pattern_entry" }),
      }),
    );
    expect(created.status).toBe(200);
    const session = (await created.json()) as {
      id: string;
      mode: string;
      itemIds: string[];
      interleave_exceptions: number;
    };
    expect(session.mode).toBe("pattern_entry");
    expect(session.itemIds.length).toBeGreaterThan(0);
    expect(session.itemIds.length).toBeLessThanOrEqual(12);

    const nextRes = await getNext(
      new Request(`http://localhost/api/sessions/${session.id}/next?now=${now}`),
      { params: Promise.resolve({ id: session.id }) },
    );
    const next = (await nextRes.json()) as {
      item: {
        id: string;
        skillTag?: string | null;
        explanation?: string;
        stem: string;
      };
    };
    expect(next.item.explanation).toBeUndefined();
    expect(next.item.skillTag).toBeNull();
    expect(JSON.stringify(next.item)).not.toMatch(/Pattern \(/);

    const gradeRes = await postGrade(
      new Request(`http://localhost/api/sessions/${session.id}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: next.item.id,
          answeredKey: "A",
          confidence: 3,
          now,
        }),
      }),
    );
    expect(gradeRes.status).toBe(200);
    const grade = (await gradeRes.json()) as {
      explanation: string;
      pattern: { id: string; name: string; move: string } | null;
    };
    expect(grade.pattern?.id.startsWith("PAT.")).toBe(true);
    expect(grade.explanation).toMatch(/Pattern \(/);
    expect(grade.explanation).toMatch(/Content grain \(/);
  });

  it("starts a difficulty-ranked pattern ladder interleaved with a contrast pattern", async () => {
    const dbPath = seedPatternBank();
    const created = await postSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          now: "2026-07-01T12:00:00.000Z",
          mode: "pattern_ladder",
          patternId: "PAT.CARS.main_point",
        }),
      }),
    );
    expect(created.status).toBe(200);
    const session = (await created.json()) as {
      mode: string;
      patternId: string;
      contrastPatternId: string;
      itemIds: string[];
      interleave_exceptions: number;
    };
    expect(session.mode).toBe("pattern_ladder");
    expect(session.patternId).toBe("PAT.CARS.main_point");
    expect(session.contrastPatternId).not.toBe("PAT.CARS.main_point");
    expect(session.itemIds.length).toBeGreaterThan(0);

    const reopened = openDb(dbPath);
    const tags = session.itemIds.map((id) => {
      const row = reopened.db
        .select({ skillTag: items.skillTag, difficultyEst: items.difficultyEst })
        .from(items)
        .where(eq(items.id, id))
        .get();
      return row;
    });
    const focus = tags.filter((t) => t?.skillTag === "PAT.CARS.main_point");
    expect(focus.length).toBeGreaterThan(0);
    for (let i = 1; i < focus.length; i++) {
      expect(focus[i]?.difficultyEst ?? 0).toBeGreaterThanOrEqual(
        focus[i - 1]?.difficultyEst ?? 0,
      );
    }
    reopened.sqlite.close();
  });

  it("starts a structure sitting that still interleaves topics", async () => {
    seedPatternBank();
    const created = await postSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          now: "2026-07-01T12:00:00.000Z",
          mode: "structure",
        }),
      }),
    );
    expect(created.status).toBe(200);
    const session = (await created.json()) as {
      mode: string;
      itemIds: string[];
      interleave_exceptions: number;
    };
    expect(session.mode).toBe("structure");
    expect(session.itemIds.length).toBeGreaterThan(0);
    expect(session.itemIds.length).toBeLessThanOrEqual(20);
  });
});

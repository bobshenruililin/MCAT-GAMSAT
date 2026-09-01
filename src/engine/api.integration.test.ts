import { afterEach, describe, expect, it } from "vitest";
import { count } from "drizzle-orm";
import { attempts, fsrsState } from "@/db/schema";
import { POST as postSession } from "@/app/api/sessions/route";
import { GET as getNext } from "@/app/api/sessions/[id]/next/route";
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
        item: { id: string; stem: string; correctKey?: string; explanation?: string };
      };
      expect(next.done).toBe(false);
      expect(next.item.correctKey).toBeUndefined();
      expect(next.item.explanation).toBeUndefined();

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
      };
      expect(attempt.correctKey).toBe("A");
      expect(attempt.explanation.length).toBeGreaterThan(0);
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
});

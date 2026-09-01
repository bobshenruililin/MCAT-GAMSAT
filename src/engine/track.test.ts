import { describe, expect, it } from "vitest";
import { createDailySession, createDiagnosticSession } from "./sessionService";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseTrack, matchesTrack } from "./sectionBudget";

describe("section tracks", () => {
  it("parseTrack accepts exam families and ignores junk", () => {
    expect(parseTrack("MCAT CARS")).toBe("MCAT CARS");
    expect(parseTrack("all")).toBeUndefined();
    expect(parseTrack("")).toBeUndefined();
    expect(parseTrack("not-a-track")).toBeUndefined();
    expect(matchesTrack("MCAT.CARS.FND.t1", "MCAT CARS")).toBe(true);
    expect(matchesTrack("MCAT.FC1.1A.t1", "MCAT CARS")).toBe(false);
    expect(matchesTrack("MCAT.FC1.1A.t1")).toBe(true);
  });

  it("daily session with a CARS track queues only CARS items", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.CARS.FND.t1", "MCAT.FC1.1A.t1"]);
    for (let i = 0; i < 4; i++) {
      insertDiscrete(db, `cars-${i}`, "MCAT.CARS.FND.t1", "A");
      insertDiscrete(db, `bb-${i}`, "MCAT.FC1.1A.t1", "A");
    }
    const now = new Date("2026-09-01T12:00:00.000Z");
    const created = createDailySession(db, now, { reviewCap: 50, newCap: 10, track: "MCAT CARS" });
    expect(created.config.track).toBe("MCAT CARS");
    expect(created.config.itemIds.length).toBeGreaterThan(0);
    for (const id of created.config.itemIds) {
      const row = db.select().from(items).where(eq(items.id, id)).get();
      expect(row?.conceptId.startsWith("MCAT.CARS")).toBe(true);
    }
    close();
  });

  it("diagnostic with a GAMSAT S3 track excludes CARS", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.CARS.FND.t1", "GAMSAT.S3.bio.t1"]);
    insertDiscrete(db, "cars-d", "MCAT.CARS.FND.t1", "A");
    insertDiscrete(db, "s3-d", "GAMSAT.S3.bio.t1", "A");
    const created = createDiagnosticSession(db, new Date("2026-09-01T12:00:00.000Z"), {
      perCategory: 3,
      cap: 90,
      track: "GAMSAT S3",
    });
    expect(created.config.track).toBe("GAMSAT S3");
    expect(created.config.itemIds).toEqual(["s3-d"]);
    close();
  });
});

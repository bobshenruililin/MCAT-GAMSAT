import { describe, expect, it } from "vitest";
import { seedFromFile } from "@/db/seed-lib";
import { TAXONOMY_PATH } from "@/db/paths";
import { insertDiscrete, tempMigratedDb } from "./testDb";
import { AMBITION } from "./ambition";
import { buildAtlas } from "./atlas";
import { getBankScale } from "./bankScale";
import { getProgressData } from "./progress";
import { FACTORY_TARGET, HAND_BANK, TARGET_MULTIPLIER } from "@/factory/types";
import { PATTERN_TARGET } from "@/patterns/generate";
import { PATTERNS } from "@/patterns/catalog";

describe("ambition + bank scale", () => {
  it("publishes the designed 5000× factory and 120k pattern targets", () => {
    expect(AMBITION.factoryItems).toBe(FACTORY_TARGET);
    expect(AMBITION.factoryItems).toBe(HAND_BANK * TARGET_MULTIPLIER);
    expect(AMBITION.patternDrills).toBe(PATTERN_TARGET);
    expect(AMBITION.patternMoves).toBe(PATTERNS.length);
    expect(AMBITION.examFamilies).toBe(7);
    expect(AMBITION.outlineLayers).toEqual(["family", "section", "category", "topic"]);
    expect(AMBITION.totalDesignedItems).toBe(HAND_BANK + FACTORY_TARGET + PATTERN_TARGET);
  });

  it("counts live SQLite against designed capacity without loading every item row", () => {
    const { db, close } = tempMigratedDb();
    seedFromFile(db, TAXONOMY_PATH);
    insertDiscrete(db, "q1", "MCAT.FC1.1A.t1", "A");
    insertDiscrete(db, "q2", "MCAT.CARS.FND.t1", "A");
    const scale = getBankScale(db);
    expect(scale.itemsInBank).toBe(2);
    expect(scale.verifiedTrue).toBe(0);
    expect(scale.outlineNodes).toBeGreaterThan(300);
    expect(scale.weightedTopics).toBe(290);
    expect(scale.designedTotal).toBe(AMBITION.totalDesignedItems);
    expect(scale.liveShareOfDesigned).toBeGreaterThan(0);
    expect(scale.liveShareOfDesigned).toBeLessThan(0.01);
    close();
  });
});

describe("exam atlas", () => {
  it("builds a 7-family four-layer map from the outline", () => {
    const { db, close } = tempMigratedDb();
    seedFromFile(db, TAXONOMY_PATH);
    insertDiscrete(db, "bb-1", "MCAT.FC1.1A.t1", "A");
    insertDiscrete(db, "cars-1", "MCAT.CARS.FND.t1", "A");
    insertDiscrete(db, "s3-1", "GAMSAT.S3.bio.t1", "A");
    const atlas = buildAtlas(getProgressData(db, new Date("2026-09-01T00:00:00.000Z")));
    expect(atlas.families).toHaveLength(7);
    expect(atlas.patternMoves).toHaveLength(18);
    const bb = atlas.families.find((f) => f.family === "MCAT B/B");
    const cars = atlas.families.find((f) => f.family === "MCAT CARS");
    const s3 = atlas.families.find((f) => f.family === "GAMSAT S3");
    expect(bb?.itemCount).toBeGreaterThanOrEqual(1);
    expect(bb?.sectionCount).toBeGreaterThanOrEqual(1);
    expect(bb?.categoryCount).toBeGreaterThanOrEqual(1);
    expect(bb?.topicCount).toBeGreaterThan(10);
    expect(bb?.sections.some((s) => s.id === "MCAT.FC10")).toBe(false);
    const ps = atlas.families.find((f) => f.family === "MCAT P/S");
    expect(ps?.sections.some((s) => s.id === "MCAT.FC10")).toBe(true);
    expect(cars?.topicCount).toBe(14);
    expect(s3?.topicCount).toBe(84);
    expect(cars?.itemCount).toBeGreaterThanOrEqual(1);
    expect(atlas.families.every((f) => f.examWeight > 0)).toBe(true);
    close();
  });
});

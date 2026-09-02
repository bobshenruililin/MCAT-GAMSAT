import { and, count, eq, gt, like } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { concepts, items, passages } from "@/db/schema";
import { AMBITION } from "./ambition";

export type BankScale = {
  itemsInBank: number;
  verifiedTrue: number;
  patternItems: number;
  passages: number;
  outlineNodes: number;
  weightedTopics: number;
  designedFactory: number;
  designedPatterns: number;
  designedHand: number;
  designedTotal: number;
  liveShareOfDesigned: number;
};

export function getBankScale(db: AppDb): BankScale {
  const itemsInBank = db.select({ n: count() }).from(items).get()?.n ?? 0;
  const verifiedTrue =
    db.select({ n: count() }).from(items).where(eq(items.verified, true)).get()?.n ?? 0;
  const patternItems =
    db.select({ n: count() }).from(items).where(like(items.skillTag, "PAT.%")).get()?.n ?? 0;
  const passagesN = db.select({ n: count() }).from(passages).get()?.n ?? 0;
  const outlineNodes = db.select({ n: count() }).from(concepts).get()?.n ?? 0;
  const weightedTopics =
    db
      .select({ n: count() })
      .from(concepts)
      .where(and(eq(concepts.level, "topic"), gt(concepts.examWeight, 0)))
      .get()?.n ?? 0;
  const designedTotal = AMBITION.totalDesignedItems;
  return {
    itemsInBank,
    verifiedTrue,
    patternItems,
    passages: passagesN,
    outlineNodes,
    weightedTopics,
    designedFactory: AMBITION.factoryItems,
    designedPatterns: AMBITION.patternDrills,
    designedHand: AMBITION.handItems,
    designedTotal,
    liveShareOfDesigned: designedTotal === 0 ? 0 : itemsInBank / designedTotal,
  };
}

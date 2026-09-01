import { describe, expect, it } from "vitest";
import { assembleSession, type AssemblerItem, type NewCandidate } from "./sessionAssembler";

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function consecutiveSameTopic(items: AssemblerItem[]): number {
  let n = 0;
  for (let i = 1; i < items.length; i++) {
    if (items[i].conceptId === items[i - 1].conceptId) n += 1;
  }
  return n;
}

describe("sessionAssembler", () => {
  it("keeps due reviews first-class, caps new items, and max 3 new per topic", () => {
    const due: AssemblerItem[] = [
      { id: "d1", conceptId: "t1" },
      { id: "d2", conceptId: "t1" },
    ];
    const news: NewCandidate[] = [];
    for (let t = 1; t <= 5; t++) {
      for (let i = 1; i <= 5; i++) {
        news.push({
          id: `n${t}-${i}`,
          conceptId: `t${t}`,
          mastery: 0.2 + t * 0.05,
          examWeight: 0.1,
        });
      }
    }
    const result = assembleSession(due, news, {
      reviewCap: 50,
      newCap: 15,
      maxNewPerTopic: 3,
    });
    const ids = new Set(result.items.map((i) => i.id));
    expect(ids.has("d1")).toBe(true);
    expect(ids.has("d2")).toBe(true);
    const newIds = result.items.filter((i) => i.id.startsWith("n"));
    expect(newIds.length).toBeLessThanOrEqual(15);
    const perTopic = new Map<string, number>();
    for (const item of newIds) {
      perTopic.set(item.conceptId, (perTopic.get(item.conceptId) ?? 0) + 1);
    }
    for (const n of perTopic.values()) expect(n).toBeLessThanOrEqual(3);
  });

  it("interleaving invariant holds on 100 random assemblies", () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = mulberry32(seed + 1);
      const topicCount = 3 + Math.floor(rng() * 8);
      const due: AssemblerItem[] = [];
      const dueN = Math.floor(rng() * 40);
      for (let i = 0; i < dueN; i++) {
        due.push({
          id: `d-${seed}-${i}`,
          conceptId: `topic-${Math.floor(rng() * topicCount)}`,
        });
      }
      const news: NewCandidate[] = [];
      const newN = Math.floor(rng() * 30);
      for (let i = 0; i < newN; i++) {
        const conceptId = `topic-${Math.floor(rng() * topicCount)}`;
        news.push({
          id: `n-${seed}-${i}`,
          conceptId,
          mastery: rng(),
          examWeight: rng() * 0.2,
        });
      }
      const result = assembleSession(due, news, {
        reviewCap: 50,
        newCap: 15,
        maxNewPerTopic: 3,
      });
      expect(consecutiveSameTopic(result.items)).toBe(result.interleaveExceptions);
    }
  });

  it("picks new items from highest (1-mastery)*exam_weight and skips weight 0", () => {
    const due: AssemblerItem[] = [];
    const news: NewCandidate[] = [
      { id: "weak-high-m", conceptId: "t-strong", mastery: 0.9, examWeight: 0.05 },
      { id: "gap-low-m", conceptId: "t-gap", mastery: 0.1, examWeight: 0.2 },
      { id: "mid", conceptId: "t-mid", mastery: 0.5, examWeight: 0.1 },
      { id: "overlay", conceptId: "t-overlay", mastery: 0.0, examWeight: 0 },
    ];
    const result = assembleSession(due, news, {
      reviewCap: 50,
      newCap: 15,
      maxNewPerTopic: 3,
    });
    const newIds = result.items.map((i) => i.id);
    expect(newIds[0]).toBe("gap-low-m");
    expect(newIds).toContain("mid");
    expect(newIds).toContain("weak-high-m");
    expect(newIds.indexOf("gap-low-m")).toBeLessThan(newIds.indexOf("mid"));
    expect(newIds.indexOf("mid")).toBeLessThan(newIds.indexOf("weak-high-m"));
    expect(newIds).not.toContain("overlay");
  });

  it("repairs a grouped same-topic due queue to zero consecutive clashes", () => {
    const due: AssemblerItem[] = [];
    for (let t = 0; t < 8; t++) {
      for (let i = 0; i < 3; i++) {
        due.push({ id: `d-${t}-${i}`, conceptId: `topic-${t}` });
      }
    }
    const result = assembleSession(due, [], {
      reviewCap: 50,
      newCap: 15,
      maxNewPerTopic: 3,
    });
    expect(result.items).toHaveLength(24);
    expect(consecutiveSameTopic(result.items)).toBe(0);
    expect(result.interleaveExceptions).toBe(0);
  });
});

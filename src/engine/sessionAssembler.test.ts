import { describe, expect, it } from "vitest";
import { assembleMasteryCheckSession, assemblePatternEntry, assemblePatternLadder, assembleSession, assembleSkillFocusSession, assembleStructureSession, pickContrastTopicId, type AssemblerItem, type NewCandidate, type TaggedCandidate } from "./sessionAssembler";

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

  it("picks easier new items first when topic mastery is low", () => {
    const news: NewCandidate[] = [
      { id: "hard", conceptId: "t1", mastery: 0.2, examWeight: 0.1, difficultyEst: 0.9 },
      { id: "easy", conceptId: "t1", mastery: 0.2, examWeight: 0.1, difficultyEst: 0.2 },
      { id: "mid", conceptId: "t1", mastery: 0.2, examWeight: 0.1, difficultyEst: 0.5 },
    ];
    const result = assembleSession([], news, { reviewCap: 50, newCap: 3, maxNewPerTopic: 3 });
    expect(result.items.map((i) => i.id)).toEqual(["easy", "mid", "hard"]);
  });

  it("picks harder new items first when topic mastery is high", () => {
    const news: NewCandidate[] = [
      { id: "easy", conceptId: "t1", mastery: 0.8, examWeight: 0.1, difficultyEst: 0.2 },
      { id: "hard", conceptId: "t1", mastery: 0.8, examWeight: 0.1, difficultyEst: 0.9 },
      { id: "mid", conceptId: "t1", mastery: 0.8, examWeight: 0.1, difficultyEst: 0.5 },
    ];
    const result = assembleSession([], news, { reviewCap: 50, newCap: 3, maxNewPerTopic: 3 });
    expect(result.items.map((i) => i.id)).toEqual(["hard", "mid", "easy"]);
  });
});

describe("assembleSkillFocusSession", () => {
  it("mixes focus and contrast topics and preserves interleave", () => {
    const due: AssemblerItem[] = [];
    for (let i = 0; i < 6; i++) {
      due.push({ id: `s-${i}`, conceptId: "MCAT.FC1.1A.t1" });
      due.push({ id: `c-${i}`, conceptId: "MCAT.CARS.FND.t1" });
    }
    const result = assembleSkillFocusSession(due, [], {
      skillTopicId: "MCAT.FC1.1A.t1",
      contrastTopicId: "MCAT.CARS.FND.t1",
      focusCap: 4,
      contrastCap: 4,
    });
    expect(result.items).toHaveLength(8);
    const focus = result.items.filter((i) => i.conceptId === "MCAT.FC1.1A.t1");
    const contrast = result.items.filter((i) => i.conceptId === "MCAT.CARS.FND.t1");
    expect(focus).toHaveLength(4);
    expect(contrast).toHaveLength(4);
    expect(consecutiveSameTopic(result.items)).toBe(0);
    expect(result.interleaveExceptions).toBe(0);
  });

  it("picks a different-family contrast when none is named", () => {
    const news: NewCandidate[] = [
      { id: "bb-1", conceptId: "MCAT.FC1.1A.t1", mastery: 0.2, examWeight: 0.1 },
      { id: "bb-2", conceptId: "MCAT.FC1.1A.t1", mastery: 0.2, examWeight: 0.1 },
      { id: "cars-1", conceptId: "MCAT.CARS.FND.t1", mastery: 0.3, examWeight: 0.2 },
      { id: "cars-2", conceptId: "MCAT.CARS.FND.t1", mastery: 0.3, examWeight: 0.2 },
      { id: "bb-other", conceptId: "MCAT.FC1.1B.t1", mastery: 0.3, examWeight: 0.05 },
    ];
    const contrast = pickContrastTopicId([], news, [], "MCAT.FC1.1A.t1");
    expect(contrast).toBe("MCAT.CARS.FND.t1");
  });
});

describe("assembleMasteryCheckSession", () => {
  it("takes two items from each listed topic and interleaves", () => {
    const due: AssemblerItem[] = [
      { id: "a1", conceptId: "t-a" },
      { id: "a2", conceptId: "t-a" },
      { id: "b1", conceptId: "t-b" },
      { id: "b2", conceptId: "t-b" },
      { id: "c1", conceptId: "t-c" },
      { id: "c2", conceptId: "t-c" },
      { id: "d1", conceptId: "t-d" },
      { id: "d2", conceptId: "t-d" },
    ];
    const result = assembleMasteryCheckSession(due, [], {
      topicIds: ["t-a", "t-b", "t-c", "t-d"],
      itemsPerTopic: 2,
    });
    expect(result.items).toHaveLength(8);
    const topics = new Set(result.items.map((i) => i.conceptId));
    expect(topics.size).toBe(4);
    expect(consecutiveSameTopic(result.items)).toBe(0);
  });
});

describe("assemblePatternEntry", () => {
  it("keeps only low-difficulty PAT tags and interleaves", () => {
    const items: TaggedCandidate[] = [];
    const tags = ["PAT.CARS.main_point", "PAT.CP.setup_equation", "PAT.BB.if_then"];
    const topics = ["MCAT.CARS.FND.t1", "MCAT.FC4.4B.t1", "MCAT.FC1.1D.t3"];
    for (let i = 0; i < 12; i++) {
      items.push({
        id: `easy-${i}`,
        conceptId: topics[i % 3],
        skillTag: tags[i % 3],
        difficultyEst: 0.2 + (i % 3) * 0.05,
        examWeight: 0.1,
      });
      items.push({
        id: `hard-${i}`,
        conceptId: topics[i % 3],
        skillTag: tags[i % 3],
        difficultyEst: 0.7,
        examWeight: 0.1,
      });
      items.push({
        id: `sirs-${i}`,
        conceptId: topics[i % 3],
        skillTag: "SIRS1",
        difficultyEst: 0.2,
        examWeight: 0.1,
      });
    }
    const result = assemblePatternEntry(items, 12);
    expect(result.items.length).toBe(12);
    expect(result.items.every((i) => i.id.startsWith("easy-"))).toBe(true);
    expect(result.items.every((i) => (i.difficultyEst ?? 0) <= 0.42)).toBe(true);
    expect(consecutiveSameTopic(result.items)).toBe(result.interleaveExceptions);
  });
});

describe("assemblePatternLadder", () => {
  it("sorts the focus pattern by difficulty ascending and interleaves contrast", () => {
    const items: TaggedCandidate[] = [];
    for (let i = 0; i < 8; i++) {
      items.push({
        id: `focus-${i}`,
        conceptId: "MCAT.CARS.FND.t1",
        skillTag: "PAT.CARS.main_point",
        difficultyEst: 0.9 - i * 0.08,
        examWeight: 0.1,
      });
      items.push({
        id: `contrast-${i}`,
        conceptId: "MCAT.FC4.4B.t1",
        skillTag: "PAT.CP.setup_equation",
        difficultyEst: 0.2 + i * 0.05,
        examWeight: 0.1,
      });
    }
    const result = assemblePatternLadder(
      items,
      "PAT.CARS.main_point",
      "PAT.CP.setup_equation",
      8,
    );
    expect(result.items).toHaveLength(16);
    const focus = result.items.filter((i) => i.skillTag === "PAT.CARS.main_point");
    const contrast = result.items.filter((i) => i.skillTag === "PAT.CP.setup_equation");
    expect(focus).toHaveLength(8);
    expect(contrast).toHaveLength(8);
    for (let i = 1; i < focus.length; i++) {
      expect(focus[i].difficultyEst ?? 0).toBeGreaterThanOrEqual(focus[i - 1].difficultyEst ?? 0);
    }
    expect(consecutiveSameTopic(result.items)).toBe(result.interleaveExceptions);
  });
});

describe("assembleStructureSession", () => {
  it("builds an exam-shaped mix whose consecutive same-topic count equals exceptions", () => {
    const due: AssemblerItem[] = [];
    const news: NewCandidate[] = [];
    const extras: AssemblerItem[] = [];
    const topics = [
      "MCAT.CARS.FND.t1",
      "MCAT.FC1.1A.t1",
      "MCAT.FC4.4A.t1",
      "MCAT.FC6.6C.t1",
      "GAMSAT.S3.bio.t1",
    ];
    for (const t of topics) {
      for (let i = 0; i < 4; i++) {
        news.push({
          id: `${t}-${i}`,
          conceptId: t,
          mastery: 0.3,
          examWeight: 0.1,
        });
      }
    }
    news.push({
      id: "overlay",
      conceptId: "MCAT.FC1.1A.t1",
      mastery: 0,
      examWeight: 0,
    });
    const result = assembleStructureSession(due, news, extras, 20);
    expect(result.items.length).toBe(20);
    expect(result.items.map((i) => i.id)).not.toContain("overlay");
    expect(consecutiveSameTopic(result.items)).toBe(result.interleaveExceptions);
    const families = new Set(result.items.map((i) => i.conceptId.split(".").slice(0, 2).join(".")));
    expect(families.size).toBeGreaterThan(1);
  });
});

import type { Exam } from "@/db/schema";
import { PATTERNS } from "@/patterns/catalog";
import type { ProgressData, ProgressNode } from "./progress";
import {
  COVERAGE_TRACKS,
  sectionFamily,
  type SectionFamily,
} from "./sectionBudget";

export type AtlasTopic = {
  id: string;
  name: string;
  examWeight: number;
  itemCount: number;
  attempts: number;
  mastery: number;
  unseen: boolean;
};

export type AtlasCategory = {
  id: string;
  name: string;
  examWeight: number;
  itemCount: number;
  topicCount: number;
  topics: AtlasTopic[];
};

export type AtlasSection = {
  id: string;
  name: string;
  examWeight: number;
  itemCount: number;
  topicCount: number;
  mastery: number;
  categories: AtlasCategory[];
};

export type AtlasFamily = {
  family: SectionFamily;
  exam: Exam;
  topicCount: number;
  sectionCount: number;
  categoryCount: number;
  itemCount: number;
  attemptedTopics: number;
  examWeight: number;
  mastery: number;
  sections: AtlasSection[];
};

export type AtlasData = {
  families: AtlasFamily[];
  patternMoves: { id: string; family: SectionFamily; name: string; move: string }[];
};

function examOfFamily(family: SectionFamily): Exam {
  return family.startsWith("GAMSAT") ? "gamsat" : "mcat";
}

function weightedMastery(topics: ProgressNode[]): number {
  const rows = topics.filter((t) => t.examWeight > 0);
  const tw = rows.reduce((s, t) => s + t.examWeight, 0);
  if (tw === 0) return 0;
  return rows.reduce((s, t) => s + (t.unseen ? 0 : t.mastery) * t.examWeight, 0) / tw;
}

export function buildAtlas(progress: ProgressData): AtlasData {
  const children = new Map<string | null, ProgressNode[]>();
  for (const n of progress.nodes) {
    const list = children.get(n.parentId) ?? [];
    list.push(n);
    children.set(n.parentId, list);
  }

  const families: AtlasFamily[] = COVERAGE_TRACKS.map((family) => {
    const topics = progress.topics.filter(
      (t) => sectionFamily(t.id) === family && t.examWeight > 0,
    );
    const sections = progress.nodes
      .filter((n) => n.level === "section" && sectionFamily(n.id) === family)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((section) => {
        const cats = (children.get(section.id) ?? [])
          .filter((c) => c.level === "category")
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((cat) => {
            const catTopics = (children.get(cat.id) ?? [])
              .filter((t) => t.level === "topic" && t.examWeight > 0)
              .sort((a, b) => b.examWeight - a.examWeight || a.id.localeCompare(b.id));
            return {
              id: cat.id,
              name: cat.name,
              examWeight: cat.examWeight,
              itemCount: catTopics.reduce((s, t) => s + t.itemCount, 0),
              topicCount: catTopics.length,
              topics: catTopics.map((t) => ({
                id: t.id,
                name: t.name,
                examWeight: t.examWeight,
                itemCount: t.itemCount,
                attempts: t.attempts,
                mastery: t.mastery,
                unseen: t.unseen,
              })),
            };
          });
        const sectionTopics = cats.flatMap((c) =>
          (children.get(c.id) ?? []).filter((t) => t.level === "topic"),
        );
        return {
          id: section.id,
          name: section.name,
          examWeight: section.examWeight,
          itemCount: cats.reduce((s, c) => s + c.itemCount, 0),
          topicCount: cats.reduce((s, c) => s + c.topicCount, 0),
          mastery: weightedMastery(sectionTopics),
          categories: cats,
        };
      });

    return {
      family,
      exam: examOfFamily(family),
      topicCount: topics.length,
      sectionCount: sections.length,
      categoryCount: sections.reduce((s, sec) => s + sec.categories.length, 0),
      itemCount: topics.reduce((s, t) => s + t.itemCount, 0),
      attemptedTopics: topics.filter((t) => t.attempts > 0).length,
      examWeight: topics.reduce((s, t) => s + t.examWeight, 0),
      mastery: weightedMastery(topics),
      sections,
    };
  });

  return {
    families,
    patternMoves: PATTERNS.map((p) => ({
      id: p.id,
      family: p.family,
      name: p.name,
      move: p.move,
    })),
  };
}

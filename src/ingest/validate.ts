import { readFileSync } from "node:fs";
import { TAXONOMY_PATH } from "@/db/paths";
import { parseTaxonomyJson, validateTaxonomy } from "@/db/seed-lib";
import type { ItemType } from "@/db/schema";

export type IngestChoice = { key: string; text: string };

export type IngestItemDraft = {
  concept_id?: unknown;
  type?: unknown;
  stem?: unknown;
  choices?: unknown;
  correct_key?: unknown;
  explanation?: unknown;
  distractor_rationales?: unknown;
  difficulty_est?: unknown;
  skill_tag?: unknown;
};

export type IngestPassageDraft = {
  concept_id?: unknown;
  title?: unknown;
  body?: unknown;
  questions?: unknown;
};

export type IngestFile = {
  items?: unknown;
  passages?: unknown;
};

export type ValidatedItem = {
  conceptId: string;
  type: ItemType;
  stem: string;
  choices: IngestChoice[];
  correctKey: string;
  explanation: string;
  distractorRationales: Record<string, string>;
  difficultyEst: number;
  skillTag: string | null;
};

export type ValidatedPassage = {
  conceptId: string;
  title: string;
  body: string;
  questions: ValidatedItem[];
};

export type RejectedRow = {
  kind: "item" | "passage" | "passage_question" | "file";
  index: number;
  passageIndex?: number;
  stem?: string;
  title?: string;
  reasons: string[];
};

const KEYS = ["A", "B", "C", "D"] as const;
const TYPES = new Set(["discrete", "passage_question"]);

export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function loadTopicIds(taxonomyPath = TAXONOMY_PATH): {
  topics: Set<string>;
  all: Set<string>;
} {
  const raw = readFileSync(taxonomyPath, "utf8");
  const nodes = validateTaxonomy(parseTaxonomyJson(raw, taxonomyPath), taxonomyPath);
  const topics = new Set<string>();
  const all = new Set<string>();
  for (const n of nodes) {
    all.add(n.id);
    if (n.level === "topic") topics.add(n.id);
  }
  return { topics, all };
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function validateItem(
  draft: IngestItemDraft,
  topicIds: Set<string>,
  expectedType?: ItemType,
): { ok: true; item: ValidatedItem } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  const conceptId = asString(draft.concept_id);
  if (!conceptId) reasons.push("concept_id must be a string");
  else if (!topicIds.has(conceptId)) {
    reasons.push(`concept_id "${conceptId}" is not a topic in the taxonomy`);
  }

  const type = asString(draft.type);
  if (!type || !TYPES.has(type)) {
    reasons.push("type must be discrete or passage_question");
  } else if (expectedType && type !== expectedType) {
    reasons.push(`type must be ${expectedType}`);
  }

  const stem = asString(draft.stem);
  if (!stem || stem.trim().length === 0) reasons.push("stem must be a non-empty string");

  const choicesRaw = draft.choices;
  const choices: IngestChoice[] = [];
  if (!Array.isArray(choicesRaw) || choicesRaw.length !== 4) {
    reasons.push("choices must be an array of 4 {key,text} objects");
  } else {
    const seen = new Set<string>();
    for (const c of choicesRaw) {
      if (c === null || typeof c !== "object" || Array.isArray(c)) {
        reasons.push("each choice must be an object");
        continue;
      }
      const rec = c as Record<string, unknown>;
      const key = asString(rec.key);
      const text = asString(rec.text);
      if (!key || !text || text.trim().length === 0) {
        reasons.push("each choice needs non-empty key and text");
        continue;
      }
      if (!(KEYS as readonly string[]).includes(key)) {
        reasons.push(`choice key "${key}" is not A-D`);
        continue;
      }
      if (seen.has(key)) reasons.push(`duplicate choice key ${key}`);
      seen.add(key);
      choices.push({ key, text: text.trim() });
    }
    for (const k of KEYS) {
      if (!seen.has(k)) reasons.push(`missing choice ${k}`);
    }
  }

  const correctKey = asString(draft.correct_key);
  if (!correctKey) reasons.push("correct_key must be a string");
  else if (!(KEYS as readonly string[]).includes(correctKey)) {
    reasons.push("correct_key must be A, B, C, or D");
  } else if (choices.length === 4 && !choices.some((c) => c.key === correctKey)) {
    reasons.push("correct_key must match a choice key");
  }

  const explanation = asString(draft.explanation);
  if (!explanation || explanation.trim().length === 0) {
    reasons.push("explanation must be a non-empty string");
  } else if (wordCount(explanation) < 40) {
    reasons.push(
      `explanation has ${wordCount(explanation)} words, need >= 40`,
    );
  }

  const rats = draft.distractor_rationales;
  const distractorRationales: Record<string, string> = {};
  if (rats === null || typeof rats !== "object" || Array.isArray(rats)) {
    reasons.push("distractor_rationales must be an object");
  } else if (correctKey && (KEYS as readonly string[]).includes(correctKey)) {
    const rec = rats as Record<string, unknown>;
    const wrong = KEYS.filter((k) => k !== correctKey);
    for (const k of wrong) {
      const text = asString(rec[k]);
      if (!text || text.trim().length === 0) {
        reasons.push(`distractor_rationales missing non-empty ${k}`);
      } else {
        distractorRationales[k] = text.trim();
      }
    }
    if (correctKey in rec) {
      reasons.push("distractor_rationales must not include the correct_key");
    }
  }

  const diff = draft.difficulty_est;
  if (typeof diff !== "number" || Number.isNaN(diff)) {
    reasons.push("difficulty_est must be a number");
  } else if (diff < 0 || diff > 1) {
    reasons.push("difficulty_est must be in [0,1]");
  }

  let skillTag: string | null = null;
  if (draft.skill_tag !== undefined && draft.skill_tag !== null) {
    const s = asString(draft.skill_tag);
    if (!s) reasons.push("skill_tag must be a string or null");
    else skillTag = s;
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return {
    ok: true,
    item: {
      conceptId: conceptId!,
      type: type as ItemType,
      stem: stem!.trim(),
      choices,
      correctKey: correctKey!,
      explanation: explanation!.trim(),
      distractorRationales,
      difficultyEst: diff as number,
      skillTag,
    },
  };
}

export function validateIngestFile(
  raw: string,
  taxonomyPath = TAXONOMY_PATH,
): {
  items: ValidatedItem[];
  passages: ValidatedPassage[];
  rejected: RejectedRow[];
} {
  const { topics } = loadTopicIds(taxonomyPath);
  const rejected: RejectedRow[] = [];
  const items: ValidatedItem[] = [];
  const passages: ValidatedPassage[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (err) {
    rejected.push({
      kind: "file",
      index: -1,
      reasons: [`invalid JSON (${err instanceof Error ? err.message : String(err)})`],
    });
    return { items, passages, rejected };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    rejected.push({
      kind: "file",
      index: -1,
      reasons: ["root must be an object with optional items and passages arrays"],
    });
    return { items, passages, rejected };
  }
  const file = parsed as IngestFile;

  const itemList = file.items === undefined ? [] : file.items;
  if (!Array.isArray(itemList)) {
    rejected.push({ kind: "file", index: -1, reasons: ["items must be an array"] });
  } else {
    itemList.forEach((row, index) => {
      const draft = (row ?? {}) as IngestItemDraft;
      const result = validateItem(draft, topics, "discrete");
      if (!result.ok) {
        rejected.push({
          kind: "item",
          index,
          stem: asString(draft.stem) ?? undefined,
          reasons: result.reasons,
        });
        return;
      }
      items.push(result.item);
    });
  }

  const passageList = file.passages === undefined ? [] : file.passages;
  if (!Array.isArray(passageList)) {
    rejected.push({ kind: "file", index: -1, reasons: ["passages must be an array"] });
  } else {
    passageList.forEach((row, pIndex) => {
      const draft = (row ?? {}) as IngestPassageDraft;
      const reasons: string[] = [];
      const conceptId = asString(draft.concept_id);
      if (!conceptId) reasons.push("passage concept_id must be a string");
      else if (!topics.has(conceptId)) {
        reasons.push(`passage concept_id "${conceptId}" is not a topic in the taxonomy`);
      }
      const title = asString(draft.title);
      if (!title || title.trim().length === 0) reasons.push("passage title must be non-empty");
      const body = asString(draft.body);
      if (!body || body.trim().length === 0) reasons.push("passage body must be non-empty");
      const qs = draft.questions;
      if (!Array.isArray(qs) || qs.length === 0) {
        reasons.push("passage questions must be a non-empty array");
      }
      if (reasons.length > 0 || !Array.isArray(qs)) {
        rejected.push({
          kind: "passage",
          index: pIndex,
          title: title ?? undefined,
          reasons,
        });
        return;
      }
      const questions: ValidatedItem[] = [];
      qs.forEach((q, qIndex) => {
        const qDraft = (q ?? {}) as IngestItemDraft;
        const result = validateItem(qDraft, topics, "passage_question");
        if (!result.ok) {
          rejected.push({
            kind: "passage_question",
            index: qIndex,
            passageIndex: pIndex,
            stem: asString(qDraft.stem) ?? undefined,
            reasons: result.reasons,
          });
          return;
        }
        questions.push(result.item);
      });
      if (questions.length === 0) {
        rejected.push({
          kind: "passage",
          index: pIndex,
          title: title ?? undefined,
          reasons: ["no valid questions after validation"],
        });
        return;
      }
      passages.push({
        conceptId: conceptId!,
        title: title!.trim(),
        body: body!.trim(),
        questions,
      });
    });
  }

  return { items, passages, rejected };
}

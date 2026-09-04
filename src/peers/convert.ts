import type { IngestChoice } from "@/ingest/validate";
import { Assigner, carsHint, gamsatPrefix, type TopicInfo } from "./assign";
import { ATTR, OPENMCAT_TOPIC, SIRS_TAG } from "./maps";
import {
  KEYS,
  choicesFromTexts,
  difficultyFrom,
  distractorsFor,
  formatTable,
  numericFoils,
  padExplanation,
  stripHtml,
  type Key,
} from "./text";

export type ConvertedBank = {
  items: Record<string, unknown>[];
  passages: Record<string, unknown>[];
  skipped: number;
  source: string;
};

type Seen = {
  stems: Set<string>;
  pairs: Set<string>;
};

export function emptySeen(): Seen {
  return { stems: new Set(), pairs: new Set() };
}

function pairKey(conceptId: string, stem: string): string {
  return `${conceptId}\n${stem}`;
}

function takeStem(
  seen: Seen,
  assign: Assigner,
  conceptId: string,
  stem: string,
): boolean {
  const s = stem.trim();
  if (!s || seen.stems.has(s) || seen.pairs.has(pairKey(conceptId, s))) return false;
  seen.stems.add(s);
  seen.pairs.add(pairKey(conceptId, s));
  assign.bump(conceptId);
  return true;
}

function itemRow(input: {
  conceptId: string;
  type: "discrete" | "passage_question";
  stem: string;
  texts: string[];
  correctIndex: number;
  explanationParts: string[];
  attribution: string;
  why?: (string | undefined)[];
  difficulty?: unknown;
  skillTag?: string | null;
}): Record<string, unknown> | null {
  if (input.texts.length !== 4) return null;
  if (input.correctIndex < 0 || input.correctIndex > 3) return null;
  const choices = choicesFromTexts(input.texts) as IngestChoice[];
  const correctKey = KEYS[input.correctIndex] as Key;
  const explanation = padExplanation(input.explanationParts, input.attribution);
  const why = input.why ?? [];
  const row: Record<string, unknown> = {
    concept_id: input.conceptId,
    type: input.type,
    stem: stripHtml(input.stem),
    choices,
    correct_key: correctKey,
    explanation,
    distractor_rationales: distractorsFor(
      correctKey,
      why,
      "This option names a different relation or drops a constraint in the stem.",
    ),
    difficulty_est: difficultyFrom(input.difficulty),
  };
  if (input.skillTag) row.skill_tag = input.skillTag;
  return row;
}

function indexFromKey(key: string): number {
  return KEYS.indexOf(key.toUpperCase() as Key);
}

export function convertOpenMcat(
  raw: unknown,
  assign: Assigner,
  seen: Seen,
): ConvertedBank {
  const list = Array.isArray(raw) ? raw : [];
  const items: Record<string, unknown>[] = [];
  const passageBuckets = new Map<
    string,
    { title: string; body: string; conceptId: string; questions: Record<string, unknown>[] }
  >();
  let skipped = 0;

  for (const row of list) {
    if (!row || typeof row !== "object") {
      skipped += 1;
      continue;
    }
    const q = row as Record<string, unknown>;
    const stem = typeof q.stem === "string" ? q.stem : "";
    const choices = Array.isArray(q.choices) ? q.choices.map((c) => String(c)) : [];
    const answerIndex = typeof q.answerIndex === "number" ? q.answerIndex : -1;
    const why = Array.isArray(q.why) ? q.why.map((w) => (typeof w === "string" ? w : undefined)) : [];
    const code = typeof q.categoryCode === "string" ? q.categoryCode : "1A";
    const idea = typeof q.idea === "string" ? q.idea : "";
    const tag = typeof q.tag === "string" ? q.tag : "";
    const rationale = typeof q.rationale === "string" ? q.rationale : "";
    const takeaway = typeof q.takeaway === "string" ? q.takeaway : "";
    const hint = `${idea} ${tag} ${stem}`;
    const conceptId =
      code === "CARS" || code === "HUM" || code === "SS"
        ? assign.pickPrefix("MCAT.CARS", carsHint(stem, idea))
        : assign.pickAamc(code, hint);
    const converted = itemRow({
      conceptId,
      type: q.passage ? "passage_question" : "discrete",
      stem,
      texts: choices,
      correctIndex: answerIndex,
      explanationParts: [
        rationale,
        takeaway ? `Takeaway: ${takeaway}` : "",
        why[answerIndex] ? `The keyed choice holds because: ${why[answerIndex]}` : "",
      ],
      attribution: ATTR.openMcat,
      why,
      difficulty: 0.46,
    });
    if (!converted) {
      skipped += 1;
      continue;
    }
    const cleanStem = converted.stem as string;
    if (!takeStem(seen, assign, conceptId, cleanStem)) {
      skipped += 1;
      continue;
    }
    if (q.passage) {
      const quizId = typeof q.quizId === "string" ? q.quizId : "cars";
      const paras = Array.isArray(q.passage)
        ? q.passage.map((p) => stripHtml(String(p)))
        : [stripHtml(String(q.passage))];
      const bucket = passageBuckets.get(quizId) ?? {
        title: idea || quizId,
        body: paras.join("\n\n"),
        conceptId,
        questions: [],
      };
      bucket.questions.push(converted);
      passageBuckets.set(quizId, bucket);
    } else {
      items.push(converted);
    }
  }

  return {
    source: "open-mcat",
    skipped,
    items,
    passages: [...passageBuckets.values()].map((p) => ({
      concept_id: p.conceptId,
      title: p.title,
      body: p.body,
      questions: p.questions,
    })),
  };
}

function openmcatPassageBody(p: Record<string, unknown>): string {
  const parts = [stripHtml(String(p.text ?? p.body ?? ""))];
  if (Array.isArray(p.tables)) {
    for (const t of p.tables) {
      if (t && typeof t === "object") parts.push(formatTable(t as { caption?: string; columns?: unknown; rows?: unknown }));
    }
  }
  if (Array.isArray(p.figureDescriptions)) {
    for (const f of p.figureDescriptions) {
      if (f && typeof f === "object") {
        const rec = f as Record<string, unknown>;
        parts.push(
          [rec.caption, rec.description].filter((x) => typeof x === "string").join(" — "),
        );
      }
    }
  }
  return parts.filter(Boolean).join("\n\n");
}

export function convertOpenmcat(
  raw: unknown,
  assign: Assigner,
  seen: Seen,
): ConvertedBank {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const questions = Array.isArray(root.questions) ? root.questions : [];
  const passagesIn = Array.isArray(root.passages) ? root.passages : [];
  const passageByUid = new Map<string, Record<string, unknown>>();
  for (const p of passagesIn) {
    if (!p || typeof p !== "object") continue;
    const rec = p as Record<string, unknown>;
    const sectionId = String(rec.sectionId ?? "");
    const id = String(rec.id ?? "");
    passageByUid.set(`${sectionId}:${id}`, rec);
  }

  const items: Record<string, unknown>[] = [];
  const buckets = new Map<
    string,
    { title: string; body: string; conceptId: string; questions: Record<string, unknown>[] }
  >();
  let skipped = 0;

  for (const row of questions) {
    if (!row || typeof row !== "object") {
      skipped += 1;
      continue;
    }
    const q = row as Record<string, unknown>;
    const topicIds = Array.isArray(q.testedTopicIds)
      ? q.testedTopicIds.map(String)
      : Array.isArray(q.topics)
        ? q.topics.map(String)
        : [];
    const mapped = topicIds.map((t) => OPENMCAT_TOPIC[t]).filter(Boolean);
    const conceptId =
      mapped.length > 0
        ? assign.pick(mapped, String(q.stem ?? ""))
        : assign.pickAamc("4A", String(q.stem ?? ""));
    const choiceObjs = Array.isArray(q.choices) ? q.choices : [];
    const texts = choiceObjs.map((c) => {
      if (c && typeof c === "object" && "text" in c) return String((c as { text: unknown }).text);
      return String(c);
    });
    const correctId = String(q.correctChoiceId ?? q.correct ?? "A");
    const correctIndex = choiceObjs.findIndex(
      (c) => c && typeof c === "object" && (c as { id?: unknown }).id === correctId,
    );
    const explainMap =
      q.choiceExplanations && typeof q.choiceExplanations === "object"
        ? (q.choiceExplanations as Record<string, string>)
        : {};
    const why = KEYS.map((k) => explainMap[k]);
    const skills = Array.isArray(q.testedSkillIds)
      ? q.testedSkillIds.map(String)
      : Array.isArray(q.SIRS)
        ? q.SIRS.map(String)
        : [];
    const skillTag = skills.map((s) => SIRS_TAG[s]).find(Boolean) ?? null;
    const converted = itemRow({
      conceptId,
      type: q.passageId ? "passage_question" : "discrete",
      stem: String(q.stem ?? ""),
      texts,
      correctIndex,
      explanationParts: [
        String(q.explanation ?? ""),
        typeof q.commonMistake === "string" ? `Common miss: ${q.commonMistake}` : "",
        explainMap[correctId] ?? "",
      ],
      attribution: ATTR.openmcat,
      why,
      difficulty: q.estimatedDifficulty,
      skillTag,
    });
    if (!converted) {
      skipped += 1;
      continue;
    }
    if (!takeStem(seen, assign, conceptId, converted.stem as string)) {
      skipped += 1;
      continue;
    }
    if (q.passageId) {
      const sectionId = String(q.sectionId ?? "");
      const uid = `${sectionId}:${String(q.passageId)}`;
      const src = passageByUid.get(uid) ?? {};
      const bucket = buckets.get(uid) ?? {
        title: String(src.title ?? uid),
        body: openmcatPassageBody(src),
        conceptId,
        questions: [],
      };
      bucket.questions.push(converted);
      buckets.set(uid, bucket);
    } else {
      items.push(converted);
    }
  }

  return {
    source: "openmcat",
    skipped,
    items,
    passages: [...buckets.values()]
      .filter((p) => p.questions.length > 0 && p.body.trim().length > 0)
      .map((p) => ({
        concept_id: p.conceptId,
        title: p.title,
        body: p.body,
        questions: p.questions,
      })),
  };
}

export function convertGamsat(
  raw: unknown,
  assign: Assigner,
  seen: Seen,
): ConvertedBank {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const questions = Array.isArray(root.questions) ? root.questions : [];
  const essays = Array.isArray(root.essayPrompts) ? root.essayPrompts : [];
  const items: Record<string, unknown>[] = [];
  const buckets = new Map<
    string,
    { title: string; body: string; conceptId: string; questions: Record<string, unknown>[] }
  >();
  let skipped = 0;

  for (const row of questions) {
    if (!row || typeof row !== "object") {
      skipped += 1;
      continue;
    }
    const q = row as Record<string, unknown>;
    const topic = String(q.topic ?? "");
    const sectionId = String(q.section_id ?? "");
    const conceptId = assign.pickPrefix(gamsatPrefix(sectionId, topic), `${topic} ${q.stem ?? ""}`);
    let texts: string[] = [];
    let correctIndex = 0;
    if (Array.isArray(q.options) && q.options.length === 4) {
      texts = q.options.map((o) => {
        if (o && typeof o === "object") return String((o as { text?: unknown }).text ?? "");
        return String(o);
      });
      correctIndex = Math.max(0, indexFromKey(String(q.correct_answer ?? "A")));
    } else {
      const correct = String(q.correct_answer ?? "").trim();
      if (!correct) {
        skipped += 1;
        continue;
      }
      const foils = numericFoils(correct);
      while (foils.length < 3) foils.push(`Not ${correct} (trap ${foils.length + 1})`);
      texts = [correct, foils[0], foils[1], foils[2]];
      correctIndex = 0;
    }
    const converted = itemRow({
      conceptId,
      type: q.stimulus ? "passage_question" : "discrete",
      stem: String(q.stem ?? ""),
      texts,
      correctIndex,
      explanationParts: [
        String(q.explanation ?? ""),
        String(q.principle_explanation ?? ""),
        typeof q.memory_tip === "string" ? `Memory tip: ${q.memory_tip}` : "",
      ],
      attribution: ATTR.gamsat,
      difficulty: q.difficulty,
    });
    if (!converted) {
      skipped += 1;
      continue;
    }
    if (!takeStem(seen, assign, conceptId, converted.stem as string)) {
      skipped += 1;
      continue;
    }
    const stim = typeof q.stimulus === "string" ? q.stimulus.trim() : "";
    const setId = String(q.stimulus_set_id ?? "");
    if (stim && setId) {
      const bucket = buckets.get(setId) ?? {
        title: topic || setId,
        body: stripHtml(stim),
        conceptId,
        questions: [],
      };
      converted.type = "passage_question";
      bucket.questions.push(converted);
      buckets.set(setId, bucket);
    } else {
      items.push(converted);
    }
  }

  for (const row of essays) {
    if (!row || typeof row !== "object") continue;
    const e = row as Record<string, unknown>;
    const task = String(e.task_label ?? "Task A");
    const prefix = /b/i.test(task) ? "GAMSAT.S2.task_b" : "GAMSAT.S2.task_a";
    const conceptId = assign.pickPrefix(prefix, String(e.theme ?? "quote thesis"));
    const quotes = Array.isArray(e.quotes) ? e.quotes.map(String) : [];
    const stem =
      `${task} — 30 minutes. Theme: ${e.theme ?? "unset"}.\n\n` +
      quotes.map((q) => `“${stripHtml(q)}”`).join("\n") +
      `\n\nWhich approach best engages this quote set without inventorying every line?`;
    const converted = itemRow({
      conceptId,
      type: "discrete",
      stem,
      texts: [
        "Take a clear position or a precise scene; treat the comments as pressure, not a checklist.",
        "Quote every comment in order so the marker sees completeness.",
        "Write a generic paragraph that could fit any prompt this century.",
        "Spend the first twenty minutes outlining and the last two typing.",
      ],
      correctIndex: 0,
      explanationParts: [
        String(e.instructions ?? "Plan, then write."),
        "GAMSAT S2 is production under a clock. What scores is a thesis or a particular scene that uses the comments as pressure.",
        "Inventory, generic filler, and outline-without-prose fail to raise a mark. This is craft practice, not an ACER percentile.",
      ],
      attribution: ATTR.gamsat,
      difficulty: 0.4,
    });
    if (converted && takeStem(seen, assign, conceptId, converted.stem as string)) items.push(converted);
    else skipped += 1;
  }

  return {
    source: "gamsat-trainer",
    skipped,
    items,
    passages: [...buckets.values()].map((p) => ({
      concept_id: p.conceptId,
      title: p.title,
      body: p.body,
      questions: p.questions,
    })),
  };
}

function readySourceLine(source: unknown): string {
  if (!source || typeof source !== "object") return ATTR.ready;
  const rec = source as Record<string, unknown>;
  const name = typeof rec.name === "string" ? rec.name : typeof rec.ref === "string" ? rec.ref : "";
  const url = typeof rec.url === "string" ? rec.url : "";
  return `${ATTR.ready}${name ? ` ${name}` : ""}${url ? ` ${url}` : ""}`.trim();
}

function collectFrFoils(
  items: Record<string, unknown>[],
): Map<string, string[]> {
  const byCat = new Map<string, string[]>();
  for (const row of items) {
    const cat = String(row.aamc_category ?? "");
    const ans = String(row.model_answer ?? (Array.isArray(row.accepted_answers) ? row.accepted_answers[0] : ""));
    if (!cat || !ans) continue;
    const list = byCat.get(cat) ?? [];
    if (!list.includes(ans)) list.push(ans);
    byCat.set(cat, list);
  }
  return byCat;
}

export function convertReadymcat(
  raw: unknown,
  assign: Assigner,
  seen: Seen,
): ConvertedBank {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const items: Record<string, unknown>[] = [];
  const passages: Record<string, unknown>[] = [];
  let skipped = 0;

  const pushMcq = (
    q: Record<string, unknown>,
    type: "discrete" | "passage_question",
    extraSkill?: string,
  ): Record<string, unknown> | null => {
    const cat = String(q.aamc_category ?? q.category ?? "1A");
    const hint = `${q.subtopic ?? ""} ${q.stem ?? q.prompt ?? ""}`;
    const conceptId = assign.pickAamc(cat === "CARS" ? "CARS" : cat, hint);
    let texts: string[] = [];
    let correctIndex = 0;
    if (Array.isArray(q.options) && q.options.length === 4) {
      if (typeof q.options[0] === "string") {
        texts = q.options.map(String);
        correctIndex = typeof q.correct_index === "number" ? q.correct_index : 0;
      } else {
        texts = q.options.map((o) =>
          o && typeof o === "object" ? String((o as { text?: unknown }).text ?? "") : String(o),
        );
        const ans = String(q.answer ?? q.correct_answer ?? "");
        correctIndex = Math.max(0, texts.findIndex((_, i) => {
          const o = q.options as { key?: string }[];
          return (o[i]?.key ?? KEYS[i]) === ans;
        }));
        if (ans && indexFromKey(ans) >= 0) correctIndex = indexFromKey(ans);
      }
    } else {
      return null;
    }
    const converted = itemRow({
      conceptId,
      type,
      stem: String(q.stem ?? q.prompt ?? ""),
      texts,
      correctIndex,
      explanationParts: [String(q.explanation ?? q.rationale ?? "")],
      attribution: readySourceLine(q.source),
      difficulty: q.difficulty,
      skillTag: extraSkill,
    });
    if (!converted) return null;
    if (!takeStem(seen, assign, conceptId, converted.stem as string)) return null;
    return converted;
  };

  for (const row of Array.isArray(root.discrete_mcq) ? root.discrete_mcq : []) {
    if (!row || typeof row !== "object") {
      skipped += 1;
      continue;
    }
    const q = row as Record<string, unknown>;
    const converted = pushMcq(q, "discrete");
    if (!converted) {
      skipped += 1;
      continue;
    }
    items.push(converted);
    if (Array.isArray(q.subquestions)) {
      for (const sub of q.subquestions) {
        if (!sub || typeof sub !== "object") continue;
        const s = sub as Record<string, unknown>;
        const child = pushMcq(
          {
            ...s,
            aamc_category: q.aamc_category,
            source: q.source,
            difficulty: q.difficulty,
          },
          "discrete",
          "teach_on_miss",
        );
        if (child) items.push(child);
        else skipped += 1;
      }
    }
  }

  for (const row of Array.isArray(root.diagnostic) ? root.diagnostic : []) {
    if (!row || typeof row !== "object") {
      skipped += 1;
      continue;
    }
    const converted = pushMcq(row as Record<string, unknown>, "discrete");
    if (converted) items.push(converted);
    else skipped += 1;
  }

  for (const row of Array.isArray(root.passages) ? root.passages : []) {
    if (!row || typeof row !== "object") {
      skipped += 1;
      continue;
    }
    const p = row as Record<string, unknown>;
    const qs = Array.isArray(p.questions) ? p.questions : [];
    const convertedQs: Record<string, unknown>[] = [];
    let conceptId = "MCAT.CARS.FND.t1";
    for (const qrow of qs) {
      if (!qrow || typeof qrow !== "object") {
        skipped += 1;
        continue;
      }
      const q = qrow as Record<string, unknown>;
      const converted = pushMcq(q, "passage_question");
      if (!converted) {
        skipped += 1;
        continue;
      }
      conceptId = String(converted.concept_id);
      convertedQs.push(converted);
      if (Array.isArray(q.subquestions)) {
        for (const sub of q.subquestions) {
          if (!sub || typeof sub !== "object") continue;
          const child = pushMcq(
            {
              ...(sub as Record<string, unknown>),
              aamc_category:
                q.aamc_category ?? (String(p.section) === "CARS" ? "CARS" : "1A"),
              source: p.passage_source,
            },
            "discrete",
            "teach_on_miss",
          );
          if (child) items.push(child);
        }
      }
    }
    const body = stripHtml(String(p.passage ?? ""));
    if (convertedQs.length === 0 || !body) {
      skipped += 1;
      continue;
    }
    passages.push({
      concept_id: conceptId,
      title: String(p.id ?? "Passage"),
      body,
      questions: convertedQs,
    });
  }

  const frList = Array.isArray(root.free_response) ? (root.free_response as Record<string, unknown>[]) : [];
  const foilsByCat = collectFrFoils(frList);
  for (const q of frList) {
    const cat = String(q.aamc_category ?? "1A");
    const correct = String(q.model_answer ?? (Array.isArray(q.accepted_answers) ? q.accepted_answers[0] : "")).trim();
    if (!correct) {
      skipped += 1;
      continue;
    }
    const pool = (foilsByCat.get(cat) ?? []).filter((a) => a !== correct);
    const foils = [...pool, ...numericFoils(correct), "Cannot be determined from the given information", "None of the named species", "Zero in the ideal case"];
    const uniqueFoils: string[] = [];
    for (const f of foils) {
      if (f !== correct && !uniqueFoils.includes(f)) uniqueFoils.push(f);
      if (uniqueFoils.length >= 3) break;
    }
    while (uniqueFoils.length < 3) uniqueFoils.push(`Not ${correct} (foil ${uniqueFoils.length})`);
    const conceptId = assign.pickAamc(cat, `${q.subtopic ?? ""} ${q.prompt ?? ""}`);
    const converted = itemRow({
      conceptId,
      type: "discrete",
      stem: String(q.prompt ?? q.stem ?? ""),
      texts: [correct, uniqueFoils[0], uniqueFoils[1], uniqueFoils[2]],
      correctIndex: 0,
      explanationParts: [String(q.explanation ?? "")],
      attribution: readySourceLine(q.source),
      difficulty: q.difficulty,
    });
    if (converted && takeStem(seen, assign, conceptId, converted.stem as string)) items.push(converted);
    else skipped += 1;
  }

  return { source: "readymcat", skipped, items, passages };
}

export function toFilePayload(bank: ConvertedBank): {
  items: unknown[];
  passages: unknown[];
} {
  return { items: bank.items, passages: bank.passages };
}

export function countUnits(bank: ConvertedBank): number {
  return (
    bank.items.length +
    bank.passages.reduce((s, p) => {
      const qs = (p as { questions?: unknown[] }).questions;
      return s + (Array.isArray(qs) ? qs.length : 0);
    }, 0)
  );
}

export function seedAssigner(topics: TopicInfo[], counts: Map<string, number>): Assigner {
  return new Assigner(topics, counts);
}

import { wordCount } from "@/ingest/validate";
import { KEYS, type FactoryItem, type Key } from "./types";
import { defaultPatternId } from "@/patterns/fromDesign";

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function pickN<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function ensureExplain(text: string, salt: string): string {
  const trimmed = text.trim();
  if (wordCount(trimmed) >= 40) return trimmed;
  return `${trimmed} Neighbouring options fail because they name a different relation, drop a required conversion, or contradict a number given in the stem (${salt}). Those traps are not a second live key.`;
}

export type Distractor = { text: string; why: string };

function distinctText(text: string, used: Set<string>): string {
  if (!used.has(text)) return text;
  const m = text.match(/^(-?\d+(?:\.\d+)?)([\s\S]*)$/);
  if (m) {
    const n = Number(m[1]);
    const rest = m[2];
    for (let k = 1; k <= 80; k++) {
      const cand = `${Number.isInteger(n) ? n + k : round2(n + k)}${rest}`;
      if (!used.has(cand)) return cand;
    }
  }
  for (let k = 2; k <= 20; k++) {
    const cand = `${text} — trap ${k}`;
    if (!used.has(cand)) return cand;
  }
  return `${text} — unused`;
}

export function assembleItem(input: {
  conceptId: string;
  type: FactoryItem["type"];
  stem: string;
  correct: string;
  distractors: [Distractor, Distractor, Distractor];
  explanation: string;
  difficulty: number;
  rotate: number;
  design: string;
  skillTag?: string;
  salt: string;
}): FactoryItem {
  const slot = ((input.rotate % 4) + 4) % 4;
  const texts: string[] = new Array(4);
  const why: (string | null)[] = [null, null, null, null];
  const used = new Set<string>([input.correct]);
  texts[slot] = input.correct;
  let d = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) continue;
    const raw = input.distractors[d];
    const text = distinctText(raw.text, used);
    used.add(text);
    texts[i] = text;
    why[i] =
      text === raw.text
        ? raw.why
        : `${raw.why} The numeric costume was shifted so it is not identical to the key.`;
    d += 1;
  }
  const correctKey = KEYS[slot] as Key;
  const distractor_rationales: Record<string, string> = {};
  for (let i = 0; i < 4; i++) {
    if (i === slot) continue;
    distractor_rationales[KEYS[i]] = why[i] ?? "This option is a standard trap for this grain.";
  }
  const item: FactoryItem = {
    concept_id: input.conceptId,
    type: input.type,
    stem: input.stem.trim(),
    choices: KEYS.map((key, i) => ({ key, text: texts[i] })),
    correct_key: correctKey,
    explanation: ensureExplain(input.explanation, input.salt),
    distractor_rationales,
    difficulty_est: clamp01(round2(input.difficulty)),
    design: input.design,
  };
  if (input.skillTag) item.skill_tag = input.skillTag;
  return item;
}

export function toIngestJson(item: FactoryItem): Record<string, unknown> {
  const row: Record<string, unknown> = {
    concept_id: item.concept_id,
    type: item.type,
    stem: item.stem,
    choices: item.choices,
    correct_key: item.correct_key,
    explanation: item.explanation,
    distractor_rationales: item.distractor_rationales,
    difficulty_est: item.difficulty_est,
  };
  const tag = item.skill_tag ?? defaultPatternId(item.concept_id);
  if (tag) row.skill_tag = tag;
  return row;
}

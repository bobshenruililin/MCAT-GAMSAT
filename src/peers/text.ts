import { wordCount } from "@/ingest/validate";

export const KEYS = ["A", "B", "C", "D"] as const;
export type Key = (typeof KEYS)[number];

export function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function padExplanation(parts: string[], attribution: string): string {
  const body = parts
    .map((p) => stripHtml(p).trim())
    .filter((p) => p.length > 0)
    .join(" ");
  const attr = attribution.trim();
  let text = body;
  if (attr && !text.includes(attr.slice(0, 24))) {
    text = text ? `${text} ${attr}` : attr;
  }
  if (wordCount(text) >= 40) return text;
  return `${text} Neighbouring options fail because they name a different relation, drop a required conversion, or contradict a number given in the stem. Those traps are not a second live key. This row stays unverified and is not an official percentile item.`.trim();
}

export function uniqueChoiceTexts(texts: string[]): string[] {
  const used = new Set<string>();
  return texts.map((raw) => {
    const text = stripHtml(raw).trim() || "Unspecified option";
    if (!used.has(text)) {
      used.add(text);
      return text;
    }
    for (let k = 2; k <= 30; k++) {
      const cand = `${text} (variant ${k})`;
      if (!used.has(cand)) {
        used.add(cand);
        return cand;
      }
    }
    const cand = `${text} — unused`;
    used.add(cand);
    return cand;
  });
}

export function choicesFromTexts(texts: string[]): { key: Key; text: string }[] {
  const four = uniqueChoiceTexts(texts.slice(0, 4));
  return KEYS.map((key, i) => ({ key, text: four[i] }));
}

export function distractorsFor(
  correctKey: Key,
  why: (string | undefined)[],
  fallback: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < 4; i++) {
    const key = KEYS[i];
    if (key === correctKey) continue;
    const text = (why[i] ?? "").trim();
    out[key] = stripHtml(text).trim() || fallback;
  }
  return out;
}

export function difficultyFrom(raw: unknown): number {
  if (typeof raw === "number" && !Number.isNaN(raw)) {
    if (raw >= 0 && raw <= 1) return raw;
  }
  if (typeof raw === "string") {
    const s = raw.toLowerCase();
    if (s === "easy") return 0.28;
    if (s === "medium") return 0.5;
    if (s === "hard") return 0.72;
  }
  return 0.45;
}

export function formatTable(table: {
  caption?: string;
  columns?: unknown;
  rows?: unknown;
}): string {
  const caption = typeof table.caption === "string" ? table.caption : "Table";
  const columns = Array.isArray(table.columns)
    ? table.columns.map((c) => String(c))
    : [];
  const rows = Array.isArray(table.rows)
    ? table.rows.map((r) =>
        Array.isArray(r) ? r.map((c) => String(c)).join(" | ") : String(r),
      )
    : [];
  return [caption, columns.join(" | "), ...rows].filter(Boolean).join("\n");
}

export function rotateChoices(
  texts: string[],
  correctIndex: number,
  salt: string,
): { texts: string[]; correctIndex: number } {
  const correct = texts[correctIndex] ?? texts[0];
  const others = texts.filter((_, i) => i !== correctIndex);
  let h = 2166136261;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 16777619);
  const slot = (h >>> 0) % 4;
  const out: string[] = new Array(4);
  let o = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) out[i] = correct;
    else {
      out[i] = others[o] ?? `Unspecified option ${i}`;
      o += 1;
    }
  }
  return { texts: out, correctIndex: slot };
}

export function threeFoils(correct: string, extras: string[] = []): string[] {
  const pool: string[] = [...numericFoils(correct)];
  for (const extra of extras) {
    const t = stripHtml(extra).trim();
    if (t && t !== correct && !pool.includes(t)) pool.push(t);
  }
  for (const g of [
    "Cannot be determined from the information given",
    "Zero in the ideal limiting case",
    "The reciprocal of that quantity",
    "An order-of-magnitude larger value",
  ]) {
    if (g !== correct && !pool.includes(g)) pool.push(g);
  }
  return pool.slice(0, 3);
}

export function numericFoils(correct: string): string[] {
  const m = correct.trim().match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return [];
  const n = Number(m[1]);
  const rest = m[2] ?? "";
  const candidates = [n * 2, n / 2, n + 1, n - 1, n * 10, n + 2];
  const out: string[] = [];
  for (const c of candidates) {
    if (!Number.isFinite(c) || c === n) continue;
    const text = Number.isInteger(c) ? `${c}${rest}` : `${Math.round(c * 100) / 100}${rest}`;
    if (text !== correct && !out.includes(text)) out.push(text);
    if (out.length >= 3) break;
  }
  return out;
}

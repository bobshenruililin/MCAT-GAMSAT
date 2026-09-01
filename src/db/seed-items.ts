import { count, eq } from "drizzle-orm";
import type { AppDb } from "./client";
import { concepts, items, passages } from "./schema";

const PLACEHOLDER = "PLACEHOLDER";
const KEYS = ["A", "B", "C", "D"] as const;

function isoNow(): string {
  return new Date().toISOString();
}

function choices(correctKey: string): { key: string; text: string }[] {
  return KEYS.map((key) => ({
    key,
    text:
      key === correctKey
        ? "Correct for this placeholder item."
        : `Incorrect placeholder choice ${key}.`,
  }));
}

function rationales(correctKey: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of KEYS) {
    if (key !== correctKey) {
      out[key] = `${key} is wrong on this PLACEHOLDER item.`;
    }
  }
  return out;
}

function pickTopics(db: AppDb, n: number) {
  const topics = db
    .select()
    .from(concepts)
    .where(eq(concepts.level, "topic"))
    .all()
    .filter((t) => t.examWeight > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const picked = [];
  for (const topic of topics) {
    const cat = topic.parentId ?? topic.id;
    if (seen.has(cat)) continue;
    seen.add(cat);
    picked.push(topic);
    if (picked.length >= n) break;
  }
  if (picked.length === 0) {
    throw new Error("seed placeholders: no weighted topic nodes");
  }
  const base = [...picked];
  let i = 0;
  while (picked.length < n) {
    picked.push(base[i % base.length]);
    i += 1;
  }
  return picked.slice(0, n);
}

/** Insert 20 unmistakable placeholder items when the bank is empty. */
export function seedPlaceholdersIfEmpty(db: AppDb): number {
  const existing = db.select({ n: count() }).from(items).get()?.n ?? 0;
  if (existing > 0) return 0;

  const topics = pickTopics(db, 20);
  const createdAt = isoNow();
  const discreteTopics = topics.slice(0, 18);
  const passageTopics = topics.slice(18, 20);

  for (let i = 0; i < discreteTopics.length; i++) {
    const topic = discreteTopics[i];
    const correctKey = KEYS[i % KEYS.length];
    db.insert(items)
      .values({
        id: crypto.randomUUID(),
        type: "discrete",
        passageId: null,
        conceptId: topic.id,
        skillTag: null,
        stem: `[${PLACEHOLDER}] ${topic.id} — ${topic.name}: pick the best answer.`,
        choices: choices(correctKey),
        correctKey,
        explanation: `[${PLACEHOLDER}] The keyed choice is ${correctKey} for this seeded item.`,
        distractorRationales: rationales(correctKey),
        difficultyEst: 0.4,
        source: "ai_generated",
        verified: false,
        createdAt,
      })
      .run();
  }

  const passageId = crypto.randomUUID();
  const passageConcept = passageTopics[0] ?? topics[0];
  db.insert(passages)
    .values({
      id: passageId,
      conceptId: passageConcept.id,
      title: `[${PLACEHOLDER}] Short practice passage`,
      body: `This ${PLACEHOLDER} passage exists so the quiz player can render a left pane. It is not official AAMC or ACER content. Amino acids, circuits, and arguments that follow are invented for layout only.`,
      itemCount: 2,
    })
    .run();

  for (let i = 0; i < 2; i++) {
    const topic = passageTopics[i] ?? topics[0];
    const correctKey = KEYS[i % KEYS.length];
    db.insert(items)
      .values({
        id: crypto.randomUUID(),
        type: "passage_question",
        passageId,
        conceptId: topic.id,
        skillTag: null,
        stem: `[${PLACEHOLDER}] Passage Q${i + 1} (${topic.id}): which statement matches the passage?`,
        choices: choices(correctKey),
        correctKey,
        explanation: `[${PLACEHOLDER}] Passage question ${i + 1} keys to ${correctKey}.`,
        distractorRationales: rationales(correctKey),
        difficultyEst: 0.5,
        source: "ai_generated",
        verified: false,
        createdAt,
      })
      .run();
  }

  return 20;
}

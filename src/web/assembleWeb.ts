import { assembleSession, interleaveItems } from "@/engine/sessionAssembler";
import type { SectionFamily } from "@/engine/sectionBudget";
import { isDue } from "./schedule";
import type { Ledger, WebItem } from "./types";
import { WEB_SIT } from "./types";

export function sittingItemIds(
  items: WebItem[],
  ledger: Ledger,
  track: SectionFamily | undefined,
  now: Date,
): string[] {
  const pool = track ? items.filter((it) => it.family === track) : items;
  const due = [];
  const news = [];

  for (const item of pool) {
    const card = ledger.cards[item.id];
    if (card && isDue(card, now)) {
      due.push({ id: item.id, conceptId: item.conceptId });
    } else if (!card) {
      news.push({
        id: item.id,
        conceptId: item.conceptId,
        mastery: ledger.mastery[item.conceptId] ?? 0.3,
        examWeight: item.examWeight,
        difficultyEst: item.difficultyEst,
      });
    }
  }

  let assembled = assembleSession(due, news, WEB_SIT);
  if (assembled.items.length > 0) {
    return assembled.items.map((it) => it.id);
  }

  const recycle = [...pool].sort((a, b) => {
    const ma = ledger.mastery[a.conceptId] ?? 0.3;
    const mb = ledger.mastery[b.conceptId] ?? 0.3;
    if (ma !== mb) return ma - mb;
    return a.id.localeCompare(b.id);
  });
  assembled = interleaveItems(
    recycle.slice(0, WEB_SIT.newCap).map((it) => ({
      id: it.id,
      conceptId: it.conceptId,
    })),
  );
  return assembled.items.map((it) => it.id);
}

export function familyCounts(items: WebItem[], ledger: Ledger) {
  const attemptedConcepts = new Set(
    ledger.attempts.map((a) => a.conceptId),
  );
  const byFamily = new Map<
    string,
    { topics: Set<string>; attempted: Set<string>; items: number }
  >();
  for (const item of items) {
    const row = byFamily.get(item.family) ?? {
      topics: new Set<string>(),
      attempted: new Set<string>(),
      items: 0,
    };
    row.topics.add(item.conceptId);
    row.items += 1;
    if (attemptedConcepts.has(item.conceptId)) row.attempted.add(item.conceptId);
    byFamily.set(item.family, row);
  }
  return byFamily;
}

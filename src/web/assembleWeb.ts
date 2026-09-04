import { assembleSession, interleaveItems } from "@/engine/sessionAssembler";
import type { SectionFamily } from "@/engine/sectionBudget";
import { isDue } from "./schedule";
import type { Ledger, UiMode, WebItem } from "./types";
import { WEB_SIT } from "./types";

export type SitFilter = {
  track?: SectionFamily;
  mode?: UiMode;
  format?: "discrete" | "passage" | "s2";
  skill?: "SIRS" | "teach_on_miss";
};

function tagged(item: WebItem): boolean {
  const tag = item.skillTag ?? "";
  return tag === "teach_on_miss" || tag.startsWith("SIRS");
}

export function filterPool(items: WebItem[], filter: SitFilter = {}): WebItem[] {
  let pool = filter.track ? items.filter((it) => it.family === filter.track) : items;
  if (filter.format === "discrete") {
    pool = pool.filter((it) => it.type === "discrete" && !it.conceptId.startsWith("GAMSAT.S2"));
  } else if (filter.format === "passage") {
    pool = pool.filter((it) => it.type === "passage_question");
  } else if (filter.format === "s2") {
    pool = pool.filter((it) => it.conceptId.startsWith("GAMSAT.S2"));
  }
  if (filter.skill === "SIRS") {
    pool = pool.filter((it) => (it.skillTag ?? "").startsWith("SIRS"));
  } else if (filter.skill === "teach_on_miss") {
    pool = pool.filter((it) => it.skillTag === "teach_on_miss");
  }
  if (filter.mode === "ladders") {
    const prefer = pool.filter(tagged);
    if (prefer.length >= WEB_SIT.newCap || (prefer.length > 0 && prefer.length >= pool.length / 2)) {
      pool = prefer;
    }
  }
  return pool;
}

export function sittingItemIds(
  items: WebItem[],
  ledger: Ledger,
  track: SectionFamily | undefined,
  now: Date,
  filter: SitFilter = {},
): string[] {
  const pool = filterPool(items, { ...filter, track: filter.track ?? track });
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

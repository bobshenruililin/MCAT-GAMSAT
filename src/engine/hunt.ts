export type HuntAttempt = {
  itemId: string;
  conceptId: string;
  correct: boolean;
  errorClass: string | null;
  createdAt: string;
  demo: boolean;
};

const HUNT_ERRORS = new Set(["trap", "content_gap"]);
const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
export const HUNT_TOPIC_CAP = 8;

/**
 * Topics to hunt: an item missed ≥2 times with the last attempt still wrong,
 * or ≥2 trap/content_gap misses in the last 14 days. Demo attempts are ignored.
 * Does not change FSRS due dates — sister new items from these topics are
 * drawn first inside the existing new-item quota.
 */
export function huntTopicIds(
  rows: HuntAttempt[],
  now: Date,
  cap = HUNT_TOPIC_CAP,
): string[] {
  const real = rows.filter((r) => !r.demo);
  const hunted = new Set<string>();

  const byItem = new Map<string, HuntAttempt[]>();
  for (const row of real) {
    const list = byItem.get(row.itemId) ?? [];
    list.push(row);
    byItem.set(row.itemId, list);
  }
  for (const list of byItem.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const misses = list.filter((a) => !a.correct).length;
    const last = list[list.length - 1];
    if (misses >= 2 && last && !last.correct) hunted.add(last.conceptId);
  }

  const cutoff = new Date(now.getTime() - WINDOW_MS).toISOString();
  const trapCounts = new Map<string, number>();
  for (const row of real) {
    if (row.correct) continue;
    if (row.createdAt < cutoff) continue;
    if (!row.errorClass || !HUNT_ERRORS.has(row.errorClass)) continue;
    trapCounts.set(row.conceptId, (trapCounts.get(row.conceptId) ?? 0) + 1);
  }
  for (const [topic, n] of trapCounts) {
    if (n >= 2) hunted.add(topic);
  }

  return [...hunted].sort().slice(0, cap);
}

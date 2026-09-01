import { readFileSync, writeFileSync } from "node:fs";
import type { AppDb } from "@/db/client";
import { attempts, items, sessions } from "@/db/schema";
import { getDbPath, SCOREBOARD_PATH } from "@/db/paths";
import { masteryByNode } from "./mastery";

export const DEFAULT_SCOREBOARD_PATH = SCOREBOARD_PATH;

const DEFAULT_PREAMBLE = `# SCOREBOARD

The real ledger. Success is measured here — never in features shipped.`;

const DEFAULT_OFFICIAL = `## Official scores

| date | exam | source | section | score | percentile |
|------|------|--------|---------|-------|------------|`;

const DEFAULT_WEEKLY = `## Weekly verdict

Week of ____-__-__: ____ (human fills). PASS requires 5+ study days that week regardless of code shipped.`;

export type ScoreboardStats = {
  dailySessions: number;
  diagnosticSessions: number;
  attempts: number;
  studyDays: number;
  lastStudyDay: string | null;
  topicsAttempted: number;
  meanMastery: number | null;
};

function isExcludedSession(kind: string, config: Record<string, unknown>): boolean {
  return kind === "simulation" || config.demo === true;
}

export function getScoreboardPath(): string {
  return process.env.MCAT_SCOREBOARD_PATH ?? DEFAULT_SCOREBOARD_PATH;
}

export function shouldAutoSyncScoreboard(): boolean {
  if (process.env.MCAT_SCOREBOARD_SYNC === "0") return false;
  return getDbPath().replace(/\\/g, "/").endsWith("/data/app.db");
}

export type OfficialScoreRow = {
  date: string;
  exam: string;
  source: string;
  section: string;
  score: string;
  percentile: string;
};

export function readScoreboardMarkdown(filePath = getScoreboardPath()): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

export function parseOfficialRows(markdown: string): OfficialScoreRow[] {
  const section =
    sectionBetween(markdown, "## Official scores", ["## Study log", "## Weekly verdict"]) ??
    "";
  const rows: OfficialScoreRow[] = [];
  for (const line of section.split("\n")) {
    if (!line.includes("|")) continue;
    const parts = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (parts.length < 6) continue;
    if (parts[0].toLowerCase() === "date") continue;
    if (parts.every((p) => /^[-:]+$/.test(p))) continue;
    if (parts.every((p) => p === "")) continue;
    rows.push({
      date: parts[0],
      exam: parts[1],
      source: parts[2],
      section: parts[3],
      score: parts[4],
      percentile: parts[5],
    });
  }
  return rows;
}

export function parseWeeklyVerdict(markdown: string): string {
  return (
    sectionBetween(markdown, "## Weekly verdict", []) ?? DEFAULT_WEEKLY
  ).trim();
}

export type ScoreboardView = {
  official: OfficialScoreRow[];
  weekly: string;
  stats: ScoreboardStats;
  fileMissing: boolean;
};

export function getScoreboardView(db: AppDb, now: Date): ScoreboardView {
  const existing = readScoreboardMarkdown();
  return {
    official: parseOfficialRows(existing),
    weekly: parseWeeklyVerdict(existing),
    stats: scoreboardStats(db, now),
    fileMissing: existing.trim().length === 0,
  };
}

export function scoreboardStats(db: AppDb, now: Date): ScoreboardStats {
  const sessionRows = db.select().from(sessions).all();
  const realIds = new Set<string>();
  const kindById = new Map<string, string>();
  for (const row of sessionRows) {
    if (isExcludedSession(row.kind, row.config)) continue;
    if (row.kind !== "daily" && row.kind !== "diagnostic") continue;
    realIds.add(row.id);
    kindById.set(row.id, row.kind);
  }

  const attemptRows = db
    .select({
      sessionId: attempts.sessionId,
      itemId: attempts.itemId,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .all()
    .filter((a) => realIds.has(a.sessionId));

  const usedSessions = new Set(attemptRows.map((a) => a.sessionId));
  let dailySessions = 0;
  let diagnosticSessions = 0;
  for (const id of usedSessions) {
    if (kindById.get(id) === "daily") dailySessions += 1;
    else if (kindById.get(id) === "diagnostic") diagnosticSessions += 1;
  }

  const dayKeys = new Set<string>();
  let lastStudyDay: string | null = null;
  for (const row of attemptRows) {
    const day = row.createdAt.slice(0, 10);
    dayKeys.add(day);
    if (!lastStudyDay || day > lastStudyDay) lastStudyDay = day;
  }

  const itemRows = db.select({ id: items.id, conceptId: items.conceptId }).from(items).all();
  const conceptByItem = new Map(itemRows.map((r) => [r.id, r.conceptId]));
  const topics = new Set<string>();
  for (const row of attemptRows) {
    const conceptId = conceptByItem.get(row.itemId);
    if (conceptId) topics.add(conceptId);
  }

  let meanMastery: number | null = null;
  if (topics.size > 0) {
    const mastery = masteryByNode(db, now);
    let sum = 0;
    for (const id of topics) sum += mastery[id] ?? 0.3;
    meanMastery = sum / topics.size;
  }

  return {
    dailySessions,
    diagnosticSessions,
    attempts: attemptRows.length,
    studyDays: dayKeys.size,
    lastStudyDay,
    topicsAttempted: topics.size,
    meanMastery,
  };
}

export function renderStudyLog(stats: ScoreboardStats): string {
  const sessionTotal = stats.dailySessions + stats.diagnosticSessions;
  const last = stats.lastStudyDay ?? "none";
  const mean =
    stats.meanMastery === null ? "—" : stats.meanMastery.toFixed(2);
  return `## Study log

Sessions: ${sessionTotal} (${stats.dailySessions} daily, ${stats.diagnosticSessions} diagnostic) | Attempts: ${stats.attempts} | Last study day: ${last}
Study days: ${stats.studyDays}
Attempted topics: ${stats.topicsAttempted} · mean mastery: ${mean}

_Auto-synced from non-demo daily and diagnostic attempts. Official scores stay human-entered. Simulation/demo is excluded._`;
}

function sectionBetween(text: string, header: string, nextHeaders: string[]): string | null {
  const start = text.indexOf(header);
  if (start < 0) return null;
  let end = text.length;
  for (const next of nextHeaders) {
    const idx = text.indexOf(next, start + header.length);
    if (idx >= 0 && idx < end) end = idx;
  }
  return text.slice(start, end).trim();
}

export function renderScoreboard(existing: string, stats: ScoreboardStats): string {
  const officialIdx = existing.indexOf("## Official scores");
  const preamble =
    officialIdx > 0 ? existing.slice(0, officialIdx).trim() : DEFAULT_PREAMBLE;
  const official =
    sectionBetween(existing, "## Official scores", ["## Study log", "## Weekly verdict"]) ??
    DEFAULT_OFFICIAL;
  const weekly =
    sectionBetween(existing, "## Weekly verdict", []) ?? DEFAULT_WEEKLY;
  return `${preamble}

${official}

${renderStudyLog(stats)}

${weekly}
`;
}

export function writeScoreboard(
  db: AppDb,
  now: Date,
  filePath = getScoreboardPath(),
): ScoreboardStats {
  const stats = scoreboardStats(db, now);
  let existing = "";
  try {
    existing = readFileSync(filePath, "utf8");
  } catch {
    existing = "";
  }
  writeFileSync(filePath, renderScoreboard(existing, stats), "utf8");
  return stats;
}

export function maybeSyncScoreboard(db: AppDb, now: Date): void {
  try {
    if (!shouldAutoSyncScoreboard()) return;
    writeScoreboard(db, now);
  } catch {
    // Study path stays playable if the markdown write fails.
  }
}

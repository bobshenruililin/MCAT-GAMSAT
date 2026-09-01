import { openDb } from "@/db/client";
import { createDailySession, createDiagnosticSession } from "@/engine/sessionService";
import { parseTrack } from "@/engine/sectionBudget";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    now?: string;
    kind?: string;
    mode?: string;
    skillTopicId?: string;
    reviewCap?: number;
    newCap?: number;
    perCategory?: number;
    cap?: number;
    track?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const now = body.now ? new Date(body.now) : new Date();
  const modeBody = body.mode ?? body.kind;
  const kind = body.kind === "diagnostic" || modeBody === "diagnostic" ? "diagnostic" : "daily";
  const track = parseTrack(body.track);
  const { sqlite, db } = openDb();
  try {
    if (kind === "diagnostic") {
      const caps: { perCategory?: number; cap?: number; track?: typeof track } = {};
      if (typeof body.perCategory === "number") caps.perCategory = body.perCategory;
      if (typeof body.cap === "number") caps.cap = body.cap;
      if (track) caps.track = track;
      const created = createDiagnosticSession(db, now, caps);
      return Response.json({
        id: created.sessionId,
        kind: "diagnostic",
        itemIds: created.config.itemIds,
        interleave_exceptions: created.config.interleave_exceptions,
        perCategory: created.config.perCategory,
        cap: created.config.cap,
        track: created.config.track ?? null,
      });
    }
    const mode =
      modeBody === "skill" || modeBody === "mastery_check" ? modeBody : "daily";
    const caps: {
      reviewCap?: number;
      newCap?: number;
      track?: typeof track;
      mode?: "daily" | "skill" | "mastery_check";
      skillTopicId?: string;
    } = { mode };
    if (typeof body.reviewCap === "number") caps.reviewCap = body.reviewCap;
    if (typeof body.newCap === "number") caps.newCap = body.newCap;
    if (track) caps.track = track;
    if (mode === "skill" && typeof body.skillTopicId === "string") {
      caps.skillTopicId = body.skillTopicId;
    }
    const created = createDailySession(db, now, caps);
    return Response.json({
      id: created.sessionId,
      kind: "daily",
      mode: created.config.mode ?? "daily",
      itemIds: created.config.itemIds,
      interleave_exceptions: created.config.interleave_exceptions,
      reviewCap: created.config.reviewCap,
      newCap: created.config.newCap,
      track: created.config.track ?? null,
      skillTopicId: created.config.skillTopicId ?? null,
      contrastTopicId: created.config.contrastTopicId ?? null,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  } finally {
    sqlite.close();
  }
}

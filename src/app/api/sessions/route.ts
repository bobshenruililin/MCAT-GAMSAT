import { openDb } from "@/db/client";
import { createDailySession, createDiagnosticSession } from "@/engine/sessionService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    now?: string;
    kind?: string;
    reviewCap?: number;
    newCap?: number;
    perCategory?: number;
    cap?: number;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const now = body.now ? new Date(body.now) : new Date();
  const kind = body.kind === "diagnostic" ? "diagnostic" : "daily";
  const { sqlite, db } = openDb();
  try {
    if (kind === "diagnostic") {
      const caps: { perCategory?: number; cap?: number } = {};
      if (typeof body.perCategory === "number") caps.perCategory = body.perCategory;
      if (typeof body.cap === "number") caps.cap = body.cap;
      const created = createDiagnosticSession(db, now, caps);
      return Response.json({
        id: created.sessionId,
        kind: "diagnostic",
        itemIds: created.config.itemIds,
        interleave_exceptions: created.config.interleave_exceptions,
        perCategory: created.config.perCategory,
        cap: created.config.cap,
      });
    }
    const caps: { reviewCap?: number; newCap?: number } = {};
    if (typeof body.reviewCap === "number") caps.reviewCap = body.reviewCap;
    if (typeof body.newCap === "number") caps.newCap = body.newCap;
    const created = createDailySession(db, now, caps);
    return Response.json({
      id: created.sessionId,
      kind: "daily",
      itemIds: created.config.itemIds,
      interleave_exceptions: created.config.interleave_exceptions,
      reviewCap: created.config.reviewCap,
      newCap: created.config.newCap,
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

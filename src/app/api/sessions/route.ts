import { openDb } from "@/db/client";
import { createDailySession } from "@/engine/sessionService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    now?: string;
    reviewCap?: number;
    newCap?: number;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const now = body.now ? new Date(body.now) : new Date();
  const { sqlite, db } = openDb();
  try {
    const created = createDailySession(db, now, {
      reviewCap: body.reviewCap,
      newCap: body.newCap,
    });
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

import { openDb } from "@/db/client";
import { gradeItem } from "@/engine/sessionService";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let body: {
    itemId?: string;
    answeredKey?: string;
    confidence?: number;
    now?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.itemId || !body.answeredKey) {
    return Response.json(
      { error: "itemId and answeredKey are required" },
      { status: 400 },
    );
  }
  if (typeof body.confidence !== "number") {
    return Response.json({ error: "confidence is required" }, { status: 400 });
  }
  const now = body.now ? new Date(body.now) : new Date();
  const { sqlite, db } = openDb();
  try {
    const result = gradeItem(db, {
      sessionId: id,
      itemId: body.itemId,
      answeredKey: body.answeredKey,
      confidence: body.confidence,
      now,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  } finally {
    sqlite.close();
  }
}

import { openDb } from "@/db/client";
import { nextUnanswered } from "@/engine/sessionService";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const nowParam = url.searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : new Date();
  const { sqlite, db } = openDb();
  try {
    const next = nextUnanswered(db, id, now);
    return Response.json(next);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("unknown") ? 404 : 400;
    return Response.json({ error: message }, { status });
  } finally {
    sqlite.close();
  }
}

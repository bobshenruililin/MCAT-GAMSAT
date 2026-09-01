import { openDb } from "@/db/client";
import { getSessionSummary } from "@/engine/summary";

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
    const summary = getSessionSummary(db, id, now);
    return Response.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("unknown") ? 404 : 400;
    return Response.json({ error: message }, { status });
  } finally {
    sqlite.close();
  }
}

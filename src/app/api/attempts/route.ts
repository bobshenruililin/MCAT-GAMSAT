import { openDb } from "@/db/client";
import { ERROR_CLASSES, type ErrorClass } from "@/db/schema";
import { recordAttempt } from "@/engine/sessionService";

export const runtime = "nodejs";

function isErrorClass(v: unknown): v is ErrorClass {
  return typeof v === "string" && (ERROR_CLASSES as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  let body: {
    sessionId?: string;
    itemId?: string;
    answeredKey?: string;
    confidence?: number;
    seconds?: number;
    errorClass?: ErrorClass | null;
    now?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.sessionId || !body.itemId || !body.answeredKey) {
    return Response.json(
      { error: "sessionId, itemId, and answeredKey are required" },
      { status: 400 },
    );
  }
  if (typeof body.confidence !== "number" || typeof body.seconds !== "number") {
    return Response.json(
      { error: "confidence and seconds are required numbers" },
      { status: 400 },
    );
  }
  const errorClass =
    body.errorClass === undefined || body.errorClass === null
      ? null
      : body.errorClass;
  if (errorClass !== null && !isErrorClass(errorClass)) {
    return Response.json({ error: "invalid error_class" }, { status: 400 });
  }

  const now = body.now ? new Date(body.now) : new Date();
  const { sqlite, db } = openDb();
  try {
    const result = sqlite.transaction(() =>
      recordAttempt(db, {
        sessionId: body.sessionId!,
        itemId: body.itemId!,
        answeredKey: body.answeredKey!,
        confidence: body.confidence!,
        seconds: body.seconds!,
        errorClass,
        now,
      }),
    )();
    return Response.json({
      attemptId: result.attemptId,
      correct: result.correct,
      correctKey: result.correctKey,
      explanation: result.explanation,
      distractorRationales: result.distractorRationales,
      dueAt: result.dueAt,
      fsrsState: result.fsrsState,
      pattern: result.pattern,
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

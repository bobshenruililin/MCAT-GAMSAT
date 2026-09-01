"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ItemPlayer, type GradeResult, type PlayerItem } from "@/components/ItemPlayer";
import { SessionSummaryView } from "@/components/SessionSummary";
import type { ErrorClass } from "@/db/schema";
import type { SessionSummaryData } from "@/engine/summary";

type NextResponse = {
  done: boolean;
  position: number;
  remaining: number;
  total: number;
  kind: string;
  item: PlayerItem | null;
  error?: string;
};

async function parseApi<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: (T & { error?: string }) | null = null;
  try {
    data = JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(
      res.ok
        ? "Server returned a non-JSON response"
        : `Request failed (${res.status})`,
    );
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<NextResponse | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(async (sessionId: string) => {
    try {
      const data = await parseApi<NextResponse>(
        await fetch(`/api/sessions/${sessionId}/next`),
      );
      setNext(data);
      if (data.done) {
        const sum = await parseApi<SessionSummaryData>(
          await fetch(`/api/sessions/${sessionId}/summary`),
        );
        setSummary(sum);
      }
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await parseApi<NextResponse>(
          await fetch(`/api/sessions/${id}/next`),
        );
        if (cancelled) return;
        setNext(data);
        if (data.done) {
          const sum = await parseApi<SessionSummaryData>(
            await fetch(`/api/sessions/${id}/summary`),
          );
          if (cancelled) return;
          setSummary(sum);
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onGrade(input: {
    answeredKey: string;
    confidence: number;
    seconds: number;
  }): Promise<GradeResult> {
    if (!next?.item) throw new Error("no session");
    const data = await parseApi<GradeResult>(
      await fetch(`/api/sessions/${id}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: next.item.id,
          answeredKey: input.answeredKey,
          confidence: input.confidence,
        }),
      }),
    );
    return data;
  }

  async function onCommit(input: {
    answeredKey: string;
    confidence: number;
    seconds: number;
    errorClass: ErrorClass | null;
  }): Promise<void> {
    if (!next?.item) throw new Error("no session");
    await parseApi<{ attemptId?: string }>(
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          itemId: next.item.id,
          answeredKey: input.answeredKey,
          confidence: input.confidence,
          seconds: input.seconds,
          errorClass: input.errorClass,
        }),
      }),
    );
    setLoading(true);
    await loadNext(id);
  }

  if (error) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p className="text-red-700">{error}</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to Today
        </Link>
      </main>
    );
  }

  if (loading || !next) {
    return (
      <main className="mx-auto max-w-lg p-8 text-sm text-zinc-600">Loading session…</main>
    );
  }

  if (next.done && summary) {
    return <SessionSummaryView summary={summary} />;
  }

  if (next.done) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p>Session is finished, but the summary could not be loaded.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to Today
        </Link>
      </main>
    );
  }

  if (!next.item || next.total === 0) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <p>No items in this session.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to Today
        </Link>
      </main>
    );
  }

  return (
    <ItemPlayer
      key={next.item.id}
      item={next.item}
      position={next.position}
      remaining={next.remaining}
      total={next.total}
      onGrade={onGrade}
      onCommit={onCommit}
    />
  );
}

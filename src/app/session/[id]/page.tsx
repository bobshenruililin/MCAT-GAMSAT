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
    const res = await fetch(`/api/sessions/${sessionId}/next`);
    const data = (await res.json()) as NextResponse;
    if (!res.ok) {
      setError(data.error ?? "Failed to load item");
      setLoading(false);
      return;
    }
    setNext(data);
    if (data.done) {
      const sumRes = await fetch(`/api/sessions/${sessionId}/summary`);
      const sum = (await sumRes.json()) as SessionSummaryData & { error?: string };
      if (!sumRes.ok) {
        setError(sum.error ?? "Failed to load summary");
        setLoading(false);
        return;
      }
      setSummary(sum);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/sessions/${id}/next`);
      const data = (await res.json()) as NextResponse;
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error ?? "Failed to load item");
        setLoading(false);
        return;
      }
      setNext(data);
      if (data.done) {
        const sumRes = await fetch(`/api/sessions/${id}/summary`);
        const sum = (await sumRes.json()) as SessionSummaryData & {
          error?: string;
        };
        if (cancelled) return;
        if (!sumRes.ok) {
          setError(sum.error ?? "Failed to load summary");
          setLoading(false);
          return;
        }
        setSummary(sum);
      }
      setLoading(false);
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
    const res = await fetch(`/api/sessions/${id}/grade`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId: next.item.id,
        answeredKey: input.answeredKey,
        confidence: input.confidence,
      }),
    });
    const data = (await res.json()) as GradeResult & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "grade failed");
    return data;
  }

  async function onCommit(input: {
    answeredKey: string;
    confidence: number;
    seconds: number;
    errorClass: ErrorClass | null;
  }): Promise<void> {
    if (!next?.item) throw new Error("no session");
    const res = await fetch("/api/attempts", {
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
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "attempt failed");
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

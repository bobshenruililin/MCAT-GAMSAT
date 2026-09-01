"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartButtons({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"daily" | "diagnostic" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(kind: "daily" | "diagnostic") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Could not start session");
        setBusy(null);
        return;
      }
      router.push(`/session/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={disabled || busy !== null}
          onClick={() => void start("daily")}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {busy === "daily" ? "Starting…" : "Start Session"}
        </button>
        <button
          type="button"
          disabled={disabled || busy !== null}
          onClick={() => void start("diagnostic")}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          {busy === "diagnostic" ? "Starting…" : "Start Diagnostic"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

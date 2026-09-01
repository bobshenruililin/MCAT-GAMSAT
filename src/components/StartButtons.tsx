"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COVERAGE_TRACKS, type SectionFamily } from "@/engine/sectionBudget";

const TRACK_LABELS: Record<SectionFamily, string> = {
  "MCAT CARS": "CARS",
  "MCAT B/B": "B/B",
  "MCAT C/P": "C/P",
  "MCAT P/S": "P/S",
  "GAMSAT S1": "S1",
  "GAMSAT S2": "S2 MCQ",
  "GAMSAT S3": "S3",
  Other: "Other",
};

type Busy = "daily" | "diagnostic" | "mastery_check" | null;

export function StartButtons({
  disabled,
}: {
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<SectionFamily | "">("");

  async function start(kind: "daily" | "diagnostic" | "mastery_check") {
    setBusy(kind);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (kind === "diagnostic") {
        body.kind = "diagnostic";
        if (track) body.track = track;
      } else if (kind === "mastery_check") {
        body.kind = "daily";
        body.mode = "mastery_check";
        if (track) body.track = track;
      } else {
        body.kind = "daily";
        if (track) body.track = track;
      }
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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
      <p className="text-sm font-medium">Section block</p>
      <p className="mt-1 text-xs text-zinc-500">
        Mixed follows exam weights. A named block is a CARS sitting, a science sitting, or a
        GAMSAT paper — the hour matches the clock you will walk into. Skill sessions ignore
        the block so Up Next can always start.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" data-testid="track-picker">
        <button
          type="button"
          data-testid="track-mixed"
          disabled={disabled || busy !== null}
          onClick={() => setTrack("")}
          className={`rounded-full border px-3 py-1 text-xs ${
            track === ""
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 bg-white text-zinc-800"
          }`}
        >
          Mixed
        </button>
        {COVERAGE_TRACKS.map((id) => (
          <button
            key={id}
            type="button"
            data-testid={`track-${id}`}
            disabled={disabled || busy !== null}
            onClick={() => setTrack(id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              track === id
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-800"
            }`}
          >
            {TRACK_LABELS[id]}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          data-testid="start-mastery-check"
          disabled={disabled || busy !== null}
          onClick={() => void start("mastery_check")}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          {busy === "mastery_check" ? "Starting…" : "Mastery check"}
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

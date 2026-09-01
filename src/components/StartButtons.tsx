"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COVERAGE_TRACKS, type SectionFamily } from "@/engine/sectionBudget";
import { PATTERNS } from "@/patterns/catalog";

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

type Busy =
  | "daily"
  | "diagnostic"
  | "mastery_check"
  | "pattern_entry"
  | "pattern_ladder"
  | "structure"
  | null;

export function StartButtons({
  disabled,
}: {
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<SectionFamily | "">("");
  const [patternId, setPatternId] = useState(PATTERNS[0].id);

  async function start(kind: NonNullable<Busy>) {
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
      } else if (kind === "pattern_entry") {
        body.kind = "daily";
        body.mode = "pattern_entry";
        if (track) body.track = track;
      } else if (kind === "pattern_ladder") {
        body.kind = "daily";
        body.mode = "pattern_ladder";
        body.patternId = patternId;
      } else if (kind === "structure") {
        body.kind = "daily";
        body.mode = "structure";
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
        the block so Up Next can always start. Pattern ladder also ignores the block so the
        contrast pattern can come from another family. Structure tests use the block.
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
          data-testid="start-daily"
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
          data-testid="start-diagnostic"
          disabled={disabled || busy !== null}
          onClick={() => void start("diagnostic")}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          {busy === "diagnostic" ? "Starting…" : "Start Diagnostic"}
        </button>
      </div>

      <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium">Past-paper pattern path</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Entry puts a worked analog in the stem and asks you to retrieve the move.
          Ladder ranks one pattern easy → hard, interleaved with a contrast pattern.
          Structure is a mini sitting (coverage + section clock) that still interleaves
          topics — not a cloned CARS paper.
        </p>
        <label className="mt-3 block text-xs font-medium text-zinc-600">
          Ladder pattern
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            data-testid="pattern-picker"
            disabled={disabled || busy !== null}
            value={patternId}
            onChange={(e) => setPatternId(e.target.value)}
          >
            {PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.family} · {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            data-testid="start-pattern-entry"
            disabled={disabled || busy !== null}
            onClick={() => void start("pattern_entry")}
            className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {busy === "pattern_entry" ? "Starting…" : "Start pattern entry"}
          </button>
          <button
            type="button"
            data-testid="start-pattern-ladder"
            disabled={disabled || busy !== null}
            onClick={() => void start("pattern_ladder")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            {busy === "pattern_ladder" ? "Starting…" : "Start pattern ladder"}
          </button>
          <button
            type="button"
            data-testid="start-structure"
            disabled={disabled || busy !== null}
            onClick={() => void start("structure")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            {busy === "structure" ? "Starting…" : "Start structure test"}
          </button>
        </div>
      </section>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

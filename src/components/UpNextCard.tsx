"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEVEL_LABELS } from "@/engine/masteryLevel";
import type { UpNextSkill } from "@/engine/upNext";

export function UpNextCard({
  skill,
  disabled,
}: {
  skill: UpNextSkill;
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "daily",
          mode: "skill",
          skillTopicId: skill.id,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Could not start skill session");
        setBusy(false);
        return;
      }
      router.push(`/session/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <section
      className="mt-6 rounded-lg border border-zinc-900 bg-white p-4"
      data-testid="up-next"
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">Up Next</p>
      <h2 className="mt-1 text-lg font-medium">{skill.name}</h2>
      <p className="mt-1 font-mono text-xs text-zinc-500">{skill.id}</p>
      <p className="mt-2 text-sm text-zinc-700">{skill.reasonText}</p>
      <p className="mt-2 text-xs text-zinc-500">
        <span data-testid="up-next-level">{LEVEL_LABELS[skill.level]}</span>
        {" · "}
        mastery {skill.attempts === 0 ? "—" : skill.mastery.toFixed(2)}
        {" · "}
        {skill.attempts} attempt{skill.attempts === 1 ? "" : "s"}
        {" · "}
        weight {skill.examWeight.toFixed(4)}
      </p>
      <button
        type="button"
        data-testid="start-skill"
        disabled={disabled || busy}
        onClick={() => void start()}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {busy ? "Starting…" : "Start skill session"}
      </button>
      <p className="mt-2 text-xs text-zinc-500">
        Four items on this skill, interleaved with a contrast topic. No two
        consecutive same-topic items.
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}

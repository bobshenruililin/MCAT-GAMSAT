"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { OpenSession } from "@/engine/sessionService";
import type { UpNextSkill } from "@/engine/upNext";
import { sessionModeLabel } from "./OpenSessions";

const continueClass =
  "flex w-full flex-col items-center justify-center rounded-[28px] bg-[#2f6b4f] px-6 py-5 text-center text-[#fffdf6] shadow-[0_8px_0_#1f4a36] transition-[transform,box-shadow] hover:bg-[#275c44] active:translate-y-1 active:shadow-[0_4px_0_#1f4a36] disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none";

export function ContinueHero({
  openSession,
  skill,
  emptyBank,
  caughtUp,
}: {
  openSession: OpenSession | null;
  skill: UpNextSkill | null;
  emptyBank: boolean;
  caughtUp: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(body: Record<string, string>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Could not start session");
        setBusy(false);
        return;
      }
      router.push(`/session/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  let action: ReactNode;

  if (openSession) {
    action = (
      <Link
        href={`/session/${openSession.id}`}
        data-testid="continue-session"
        className={continueClass}
      >
        <span className="text-2xl font-extrabold tracking-tight">Continue</span>
        <span className="mt-1 text-sm font-semibold text-emerald-100">
          {sessionModeLabel(openSession.mode, openSession.kind)} · {openSession.answered}/
          {openSession.total} committed · {openSession.remaining} left
        </span>
      </Link>
    );
  } else if (skill) {
    action = (
      <button
        type="button"
        data-testid="start-skill"
        disabled={emptyBank || busy}
        onClick={() =>
          void start({
            kind: "daily",
            mode: "skill",
            skillTopicId: skill.id,
          })
        }
        className={continueClass}
      >
        <span className="text-2xl font-extrabold tracking-tight">
          {busy ? "Starting…" : "Continue"}
        </span>
        <span className="mt-1 text-sm font-semibold text-emerald-100">{skill.name}</span>
      </button>
    );
  } else {
    action = (
      <button
        type="button"
        data-testid="start-daily"
        disabled={emptyBank || caughtUp || busy}
        onClick={() => void start({ kind: "daily" })}
        className={continueClass}
      >
        <span className="text-2xl font-extrabold tracking-tight">
          {busy ? "Starting…" : "Continue"}
        </span>
        <span className="mt-1 text-sm font-semibold text-emerald-100">
          Mixed retrieval · exam weights
        </span>
      </button>
    );
  }

  return (
    <div data-testid="lesson-continue">
      {action}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

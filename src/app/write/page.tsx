"use client";

import { useEffect, useMemo, useState } from "react";
import { RUBRIC, taskFor, type WritingTask } from "@/write/prompts";

export function WritingStudio() {
  const [task, setTask] = useState<"A" | "B">("A");
  const spec = taskFor(task);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-zinc-300 bg-[#faf7f0] p-4">
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="task-a"
            className={`rounded-md px-3 py-1.5 text-sm ${task === "A" ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white"}`}
            onClick={() => setTask("A")}
          >
            Task A
          </button>
          <button
            type="button"
            data-testid="task-b"
            className={`rounded-md px-3 py-1.5 text-sm ${task === "B" ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white"}`}
            onClick={() => setTask("B")}
          >
            Task B
          </button>
        </div>
        <h2 className="mt-4 font-serif text-xl">{spec.title}</h2>
        <p className="mt-1 font-mono text-xs text-zinc-500" data-testid="prompt-pack">
          Pack {spec.id} · rotates by UTC date · 5 packs per task
        </p>
        <p className="mt-2 text-sm text-zinc-600">{spec.prompt}</p>
        <ul className="mt-4 space-y-3 font-serif text-[15px] leading-7 text-zinc-800">
          {spec.quotes.map((q) => (
            <li key={q} className="border-l-2 border-zinc-400 pl-3 italic">
              {q}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-zinc-500">
          Original quote set for practice. Not ACER materials. Self-score with the rubric;
          official percentiles live only on SCOREBOARD.md after you sit ACER papers.
        </p>
      </section>
      <WritingPane key={spec.id} spec={spec} task={task} />
    </div>
  );
}

function WritingPane({ spec, task }: { spec: WritingTask; task: "A" | "B" }) {
  const storageKey = `gamsat-s2-${task}-${spec.id}`;
  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(storageKey) ?? "";
  });
  const [secondsLeft, setSecondsLeft] = useState(spec.minutes * 60);
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const words = useMemo(
    () => draft.trim().split(/\s+/).filter(Boolean).length,
    [draft],
  );
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  function save() {
    window.localStorage.setItem(storageKey, draft);
  }

  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-mono tabular-nums" data-testid="write-timer">
          {mm}:{ss}
        </p>
        <p className="text-zinc-500">{words} words</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-1.5"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Pause" : "Start timer"}
          </button>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white"
            onClick={save}
          >
            Save draft
          </button>
        </div>
      </div>
      <textarea
        className="mt-3 min-h-[320px] w-full resize-y rounded-md border border-zinc-300 p-3 font-serif text-[16px] leading-7"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write here. Retrieval of craft is the MCQs; this pane is the timed production."
      />
      <h3 className="mt-4 text-sm font-medium">Self-rubric (not a score)</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {RUBRIC.map((row) => (
          <li key={row.id}>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={Boolean(checks[row.id])}
                onChange={(e) =>
                  setChecks((c) => ({ ...c, [row.id]: e.target.checked }))
                }
              />
              <span>{row.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function WritePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl tracking-tight">Section 2, on the clock</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        ACER S2 is produced writing, not an MCQ. Craft retrieval still lives in the daily
        bank. This studio is timed production with a self-rubric so the first real paper
        is not the first time you sit for thirty minutes. Quote packs rotate by UTC date.
      </p>
      <WritingStudio />
    </main>
  );
}

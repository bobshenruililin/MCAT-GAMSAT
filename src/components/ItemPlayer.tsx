"use client";

import { useEffect, useRef, useState } from "react";
import { ERROR_CLASSES, type ErrorClass } from "@/db/schema";
import { canProceedAfterReveal, canSubmit } from "@/engine/quizGate";

export type GradeResult = {
  correct: boolean;
  correctKey: string;
  explanation: string;
  distractorRationales: Record<string, string>;
};

export type PlayerItem = {
  id: string;
  type: string;
  stem: string;
  choices: { key: string; text: string }[];
  conceptId: string;
  passage: { title: string; body: string } | null;
  hunting?: boolean;
};

const ERROR_LABELS: Record<ErrorClass, string> = {
  content_gap: "Content gap",
  reasoning: "Reasoning",
  misread: "Misread",
  timing: "Timing",
  trap: "Trap",
  other: "Other",
};

export function ItemPlayer({
  item,
  position,
  remaining,
  total,
  onGrade,
  onCommit,
}: {
  item: PlayerItem;
  position: number;
  remaining: number;
  total: number;
  onGrade: (input: {
    answeredKey: string;
    confidence: number;
    seconds: number;
  }) => Promise<GradeResult>;
  onCommit: (input: {
    answeredKey: string;
    confidence: number;
    seconds: number;
    errorClass: ErrorClass | null;
  }) => Promise<void>;
}) {
  const startedAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [answeredKey, setAnsweredKey] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [errorClass, setErrorClass] = useState<ErrorClass | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (revealed) return;
    startedAt.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - startedAt.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [revealed]);

  const displaySeconds = revealed ? seconds : elapsed;
  const submitReady = canSubmit(answeredKey, confidence);
  const nextReady = canProceedAfterReveal({
    revealed,
    correct: grade?.correct ?? null,
    errorClass,
  });

  async function submit() {
    if (!submitReady || answeredKey === null || confidence === null || busy) return;
    const elapsedSeconds = Math.max(0, (Date.now() - startedAt.current) / 1000);
    setBusy(true);
    setError(null);
    try {
      const result = await onGrade({
        answeredKey,
        confidence,
        seconds: elapsedSeconds,
      });
      setSeconds(elapsedSeconds);
      setGrade(result);
      setRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (!nextReady || answeredKey === null || confidence === null || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCommit({
        answeredKey,
        confidence,
        seconds,
        errorClass: grade?.correct ? null : errorClass,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (!revealed && ["A", "B", "C", "D"].includes(key)) {
        const match = item.choices.find((c) => c.key.toUpperCase() === key);
        if (match) {
          e.preventDefault();
          setAnsweredKey(match.key);
        }
        return;
      }
      if (!revealed && ["1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        setConfidence(Number(e.key));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!revealed) void submit();
        else void next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // submit/next close over the same gate state listed above.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyboard uses current gate fields
  }, [item, revealed, answeredKey, confidence, grade, errorClass, busy, seconds]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 text-sm text-zinc-600">
        <p>
          Item {position + 1} of {total}
          <span className="ml-2 text-zinc-400">({remaining} left)</span>
        </p>
        <p className="font-mono tabular-nums" data-testid="timer">
          {Math.floor(displaySeconds)}s
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {item.passage ? (
          <aside className="rounded-lg border border-zinc-200 bg-white p-4 md:w-1/2">
            <h2 className="text-sm font-semibold text-zinc-500">Passage</h2>
            <h3 className="mt-1 text-base font-medium">{item.passage.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {item.passage.body}
            </p>
          </aside>
        ) : null}

        <section className={item.passage ? "md:w-1/2" : "w-full"}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {item.type === "passage_question" ? "Passage question" : "Discrete"} ·{" "}
            {item.conceptId}
          </p>
          {item.hunting ? (
            <p
              className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              data-testid="hunt-banner"
            >
              Hunting this node — recent trap, content-gap, or twice-missed item. It
              comes back until it dies.
            </p>
          ) : null}
          <h1 className="mt-2 text-lg font-medium leading-7">{item.stem}</h1>

          <ul className="mt-4 space-y-2">
            {item.choices.map((choice) => {
              const selected = answeredKey === choice.key;
              const showMark = revealed && grade;
              const isCorrect = showMark && choice.key === grade.correctKey;
              const isWrongPick =
                showMark && selected && choice.key !== grade.correctKey;
              return (
                <li key={choice.key}>
                  <button
                    type="button"
                    data-testid={`choice-${choice.key}`}
                    disabled={revealed || busy}
                    onClick={() => setAnsweredKey(choice.key)}
                    className={[
                      "flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left text-sm",
                      selected && !revealed
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-200 bg-white",
                      isCorrect ? "border-green-700 bg-green-50" : "",
                      isWrongPick ? "border-red-700 bg-red-50" : "",
                      revealed || busy ? "cursor-default" : "hover:border-zinc-400",
                    ].join(" ")}
                  >
                    <span className="font-mono font-semibold">{choice.key}</span>
                    <span>{choice.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <p className="text-sm font-medium">Confidence</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  data-testid={`confidence-${n}`}
                  disabled={revealed || busy}
                  onClick={() => setConfidence(n)}
                  className={[
                    "h-10 w-10 rounded-md border text-sm font-medium",
                    confidence === n
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500">Required before reveal. Keys 1–5.</p>
          </div>

          {!revealed ? (
            <button
              type="button"
              data-testid="submit-answer"
              disabled={!submitReady || busy}
              onClick={() => void submit()}
              className="mt-6 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {busy ? "Checking…" : "Submit"}
            </button>
          ) : null}

          {revealed && grade ? (
            <div className="mt-6 space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
              <p
                className={
                  grade.correct
                    ? "font-medium text-green-800"
                    : "font-medium text-red-800"
                }
                data-testid="reveal-verdict"
              >
                {grade.correct ? "Correct" : "Incorrect"} · answer {grade.correctKey}
              </p>
              <p className="text-sm leading-6">{grade.explanation}</p>
              {Object.keys(grade.distractorRationales).length > 0 ? (
                <div>
                  <p className="text-sm font-medium">Why the others are wrong</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    {Object.entries(grade.distractorRationales).map(([key, text]) => (
                      <li key={key}>
                        <span className="font-mono">{key}</span>: {text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!grade.correct ? (
                <div>
                  <p className="text-sm font-medium">Why did you miss this?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ERROR_CLASSES.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        data-testid={`error-${cls}`}
                        onClick={() => setErrorClass(cls)}
                        className={[
                          "rounded-md border px-3 py-1.5 text-sm",
                          errorClass === cls
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300 bg-white",
                        ].join(" ")}
                      >
                        {ERROR_LABELS[cls]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                data-testid="next-item"
                disabled={!nextReady || busy}
                onClick={() => void next()}
                className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {busy ? "Saving…" : "Next"}
              </button>
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <p className="mt-4 text-xs text-zinc-500">
            Keys: A–D answer, 1–5 confidence, Enter submit/next.
          </p>
        </section>
      </div>
    </div>
  );
}

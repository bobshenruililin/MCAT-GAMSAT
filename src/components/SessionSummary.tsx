import Link from "next/link";
import type { SessionSummaryData } from "@/engine/summary";

function pct(n: number): string {
  return `${Math.round(n * 1000) / 10}%`;
}

export function SessionSummaryView({
  summary,
}: {
  summary: SessionSummaryData;
}) {
  const vsBudget = summary.meanSeconds - summary.mcatBudgetSeconds;
  const label = summary.budgetLabel ?? `${summary.mcatBudgetSeconds}s budget`;
  const vsLabel =
    summary.total === 0
      ? "—"
      : vsBudget === 0
        ? `on the ${label}`
        : vsBudget > 0
          ? `${vsBudget.toFixed(1)}s over the ${label}`
          : `${Math.abs(vsBudget).toFixed(1)}s under the ${label}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {summary.mode === "skill"
          ? "skill session"
          : summary.mode === "mastery_check"
            ? "mastery check"
            : summary.mode === "pattern_entry"
              ? "pattern entry"
              : summary.mode === "pattern_ladder"
                ? "pattern ladder"
                : summary.mode === "structure"
                  ? "structure test"
                  : `${summary.kind} session`}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Session summary</h1>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <dt className="text-xs text-zinc-500">Accuracy</dt>
          <dd className="mt-1 text-xl font-semibold">
            {summary.correctCount}/{summary.total} ({pct(summary.accuracy)})
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <dt className="text-xs text-zinc-500">Mean seconds</dt>
          <dd className="mt-1 text-xl font-semibold">
            {summary.meanSeconds.toFixed(1)}s
          </dd>
          <p className="mt-1 text-xs text-zinc-500">{vsLabel}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <dt className="text-xs text-zinc-500">Items</dt>
          <dd className="mt-1 text-xl font-semibold">{summary.total}</dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Confidence vs correctness</h2>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-2 pr-3">Confidence</th>
              <th className="py-2 pr-3">Correct</th>
              <th className="py-2">Incorrect</th>
            </tr>
          </thead>
          <tbody>
            {summary.calibration.map((row) => (
              <tr key={row.confidence} className="border-b border-zinc-200">
                <td className="py-2 pr-3 font-mono">{row.confidence}</td>
                <td className="py-2 pr-3">{row.correct}</td>
                <td className="py-2">{row.incorrect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Misses by error class</h2>
        <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {Object.entries(summary.missesByErrorClass).map(([cls, n]) => (
            <li key={cls} className="flex justify-between px-4 py-2 text-sm">
              <span className="font-mono">{cls}</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Per-topic</h2>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-2 pr-3">Topic</th>
              <th className="py-2 pr-3">Correct</th>
              <th className="py-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {summary.perTopic.map((row) => (
              <tr key={row.conceptId} className="border-b border-zinc-200">
                <td className="py-2 pr-3">
                  <span className="font-mono text-xs">{row.conceptId}</span>
                  <span className="ml-2 text-zinc-600">{row.name}</span>
                </td>
                <td className="py-2 pr-3">
                  {row.correct}/{row.total}
                </td>
                <td className="py-2" data-testid="topic-level">
                  {row.leveledUp ? (
                    <span className="text-emerald-800">
                      Level up: {row.previousLevelLabel} → {row.levelLabel}
                    </span>
                  ) : (
                    row.levelLabel
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {summary.weakest ? (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Weakest 10 (mastery × weight)</h2>
          <table className="mt-3 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-300">
                <th className="py-2 pr-3">Node</th>
                <th className="py-2 pr-3">Mastery</th>
                <th className="py-2 pr-3">Weight</th>
                <th className="py-2">Product</th>
              </tr>
            </thead>
            <tbody>
              {summary.weakest.map((row) => (
                <tr key={row.conceptId} className="border-b border-zinc-200">
                  <td className="py-2 pr-3">
                    <span className="font-mono text-xs">{row.conceptId}</span>
                    <span className="ml-2 text-zinc-600">{row.name}</span>
                  </td>
                  <td className="py-2 pr-3">{row.mastery.toFixed(3)}</td>
                  <td className="py-2 pr-3">{row.examWeight.toFixed(4)}</td>
                  <td className="py-2">{row.product.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <p className="mt-8 flex gap-4">
        <Link href="/" className="text-sm text-zinc-700 underline">
          Back to Today
        </Link>
        <Link href="/scoreboard" className="text-sm text-zinc-700 underline">
          Scoreboard
        </Link>
      </p>
    </main>
  );
}

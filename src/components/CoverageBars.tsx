export function CoverageBars({
  coverage,
}: {
  coverage: { family: string; topics: number; withItems: number; attempted: number }[];
}) {
  return (
    <ul className="space-y-3" data-testid="coverage-bars">
      {coverage
        .filter((row) => row.topics > 0)
        .map((row) => {
          const pct = row.topics === 0 ? 0 : Math.round((100 * row.withItems) / row.topics);
          const att = row.topics === 0 ? 0 : Math.round((100 * row.attempted) / row.topics);
          return (
            <li key={row.family}>
              <div className="flex justify-between text-xs">
                <span className="font-medium">{row.family}</span>
                <span className="tabular-nums text-zinc-500">
                  {row.withItems}/{row.topics} in bank · {row.attempted} attempted
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full bg-zinc-900"
                  style={{ width: `${pct}%` }}
                  title={`${pct}% of topics have items`}
                />
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-emerald-700"
                  style={{ width: `${att}%` }}
                  title={`${att}% of topics attempted`}
                />
              </div>
            </li>
          );
        })}
    </ul>
  );
}

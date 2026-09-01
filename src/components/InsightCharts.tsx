import type {
  CalibrationPoint,
  PacingBucket,
  PacingSection,
  TrendSeries,
} from "@/engine/progressInsights";

const COLORS = ["#b45309", "#b91c1c", "#7c3aed", "#0369a1", "#047857"];

export function CalibrationChart({ points }: { points: CalibrationPoint[] }) {
  const w = 360;
  const h = 220;
  const pad = 36;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  function x(c: number) {
    return pad + ((c - 1) / 4) * innerW;
  }
  function y(p: number) {
    return pad + (1 - p) * innerH;
  }
  const line = points
    .filter((p) => p.n > 0)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.confidence)} ${y(p.accuracy)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" role="img" aria-label="Calibration curve">
      <rect x="0" y="0" width={w} height={h} fill="white" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#d4d4d8" />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#d4d4d8" />
      <line
        x1={x(1)}
        y1={y(0.2)}
        x2={x(5)}
        y2={y(1)}
        stroke="#a1a1aa"
        strokeDasharray="4 4"
      />
      {line ? <path d={line} fill="none" stroke="#18181b" strokeWidth="2" /> : null}
      {points.map((p) => (
        <g key={p.confidence}>
          <circle
            cx={x(p.confidence)}
            cy={y(p.n === 0 ? p.implied : p.accuracy)}
            r={p.n === 0 ? 3 : 5}
            fill={p.n === 0 ? "#d4d4d8" : "#18181b"}
          />
          <text x={x(p.confidence)} y={h - 12} textAnchor="middle" className="fill-zinc-500" fontSize="10">
            {p.confidence}
          </text>
        </g>
      ))}
      <text x={12} y={14} className="fill-zinc-500" fontSize="10">
        accuracy
      </text>
      <text x={w / 2} y={h - 2} textAnchor="middle" className="fill-zinc-500" fontSize="10">
        confidence (dashed = confidence/5)
      </text>
    </svg>
  );
}

export function PacingChart({
  buckets,
  sections,
}: {
  buckets: PacingBucket[];
  sections: PacingSection[];
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div>
      <div className="flex h-40 items-end gap-2">
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-1 flex-col items-center justify-end">
            <span className="mb-1 font-mono text-[10px] text-zinc-500">{b.count}</span>
            <div
              className="w-full rounded-t bg-zinc-800"
              style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count ? 4 : 0 }}
            />
            <span className="mt-1 text-center text-[10px] text-zinc-500">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Budgets: MCAT science 95s · CARS 102s · GAMSAT S3 120s. Bars are all attempts.
      </p>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500">
            <th className="py-1">Section</th>
            <th className="py-1">n</th>
            <th className="py-1">Mean s</th>
            <th className="py-1">Budget s</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.family} className="border-b border-zinc-100">
              <td className="py-1">{s.family}</td>
              <td className="py-1 font-mono">{s.n}</td>
              <td className="py-1 font-mono">{s.meanSeconds.toFixed(0)}</td>
              <td className="py-1 font-mono">{s.budgetSeconds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MasteryTrendChart({
  dates,
  series,
}: {
  dates: string[];
  series: TrendSeries[];
}) {
  const w = 560;
  const h = 240;
  const pad = 40;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  function x(i: number) {
    return pad + (dates.length <= 1 ? 0 : (i / (dates.length - 1)) * innerW);
  }
  function y(v: number) {
    return pad + (1 - v) * innerH;
  }
  if (series.length === 0) {
    return <p className="text-sm text-zinc-500">No attempted topics yet — trend is empty.</p>;
  }
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="14-day mastery trend">
        <rect x="0" y="0" width={w} height={h} fill="white" />
        {[0.3, 0.5, 0.7, 1].map((tick) => (
          <g key={tick}>
            <line x1={pad} y1={y(tick)} x2={w - pad} y2={y(tick)} stroke="#f4f4f5" />
            <text x={8} y={y(tick) + 3} className="fill-zinc-400" fontSize="10">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        {series.map((s, si) => {
          const d = s.values
            .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
            .join(" ");
          return (
            <path key={s.conceptId} d={d} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth="2" />
          );
        })}
        {dates.filter((_, i) => i % 3 === 0 || i === dates.length - 1).map((day) => {
          const i = dates.indexOf(day);
          return (
            <text key={day} x={x(i)} y={h - 8} textAnchor="middle" className="fill-zinc-500" fontSize="9">
              {day.slice(5)}
            </text>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s, si) => (
          <li key={s.conceptId} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: COLORS[si % COLORS.length] }}
            />
            <span className="font-mono">{s.conceptId}</span>
            <span className="text-zinc-500">{s.name}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-zinc-500">
        EWMA of correctness (α=0.3) as of each day. Live mastery also mixes FSRS retrievability;
        that term is omitted from history because cards only store current state.
      </p>
    </div>
  );
}

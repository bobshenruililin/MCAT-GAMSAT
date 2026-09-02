import { COVERAGE_TRACKS, sectionFamily } from "@/engine/sectionBudget";

const SHORT: Record<string, string> = {
  "MCAT CARS": "CARS",
  "MCAT B/B": "B/B",
  "MCAT C/P": "C/P",
  "MCAT P/S": "P/S",
  "GAMSAT S1": "S1",
  "GAMSAT S2": "S2",
  "GAMSAT S3": "S3",
};

export type FamilyCoverage = {
  family: string;
  topics: number;
  withItems: number;
  attempted: number;
};

function fillPct(row: FamilyCoverage | undefined): number {
  if (!row || row.topics === 0) return 0;
  return Math.round((100 * row.attempted) / row.topics);
}

export function FamilyPath({
  coverage,
  currentId,
}: {
  coverage: FamilyCoverage[];
  currentId?: string | null;
}) {
  const byFamily = new Map(coverage.map((row) => [row.family, row]));
  const highlighted = currentId ? sectionFamily(currentId) : null;

  return (
    <ol className="family-path mx-auto flex max-w-xs flex-col items-center" data-testid="family-path">
      {COVERAGE_TRACKS.map((family, i) => {
        const row = byFamily.get(family);
        const fill = fillPct(row);
        const current = highlighted === family;
        return (
          <li
            key={family}
            className="flex flex-col items-center"
            data-testid={`family-orb-${family}`}
          >
            {i > 0 ? (
              <div className="h-4 w-1 rounded-full bg-[#d7eadc]" aria-hidden="true" />
            ) : null}
            <div
              className={[
                "relative grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border-[4px] text-sm font-extrabold",
                current
                  ? "border-[#2f6b4f] bg-[#2f6b4f] text-[#fffdf6] shadow-[0_6px_0_#1f4a36]"
                  : "border-[#2f6b4f] bg-[#fffdf6] text-[#2f6b4f] shadow-[0_6px_0_#d7eadc]",
              ].join(" ")}
              title={`${family}: ${row?.attempted ?? 0}/${row?.topics ?? 0} topics attempted`}
            >
              {!current ? (
                <span
                  className="absolute inset-1 overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <span
                    className="absolute bottom-0 left-0 right-0 bg-[#d7eadc]"
                    style={{ height: `${fill}%` }}
                  />
                </span>
              ) : null}
              <span className="relative">{SHORT[family] ?? family}</span>
            </div>
            <p className="mt-1 text-[11px] font-extrabold tracking-wide text-zinc-600">
              {family.replace("MCAT ", "").replace("GAMSAT ", "")}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

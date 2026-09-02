import Link from "next/link";
import type { OpenSession } from "@/engine/sessionService";

const MODE_LABELS: Record<string, string> = {
  daily: "Daily session",
  diagnostic: "Diagnostic",
  skill: "Skill session",
  mastery_check: "Mastery check",
  pattern_entry: "Pattern entry",
  pattern_ladder: "Pattern ladder",
  structure: "Structure test",
};

export function sessionModeLabel(mode: string, kind: string): string {
  return MODE_LABELS[mode] ?? MODE_LABELS[kind] ?? kind;
}

export function OpenSessions({
  sessions,
  skipFirst = false,
}: {
  sessions: OpenSession[];
  skipFirst?: boolean;
}) {
  const list = skipFirst ? sessions.slice(1) : sessions;
  if (list.length === 0) return null;
  return (
    <section className="mt-6" data-testid="open-sessions">
      <h2 className="text-sm font-medium">Unfinished sittings</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Committed answers are already on disk. Uncommitted reveal is not — hit Next
        before you leave an item.
      </p>
      <ul className="mt-3 space-y-2">
        {list.map((s) => (
          <li key={s.id}>
            <Link
              href={`/session/${s.id}`}
              data-testid="continue-session"
              className="block rounded-lg border border-zinc-900 bg-white px-4 py-3 text-sm hover:bg-zinc-50"
            >
              <span className="font-medium">{sessionModeLabel(s.mode, s.kind)}</span>
              {s.track ? (
                <span className="ml-2 text-xs text-zinc-500">{s.track}</span>
              ) : null}
              <span className="mt-0.5 block text-xs text-zinc-600">
                {s.answered}/{s.total} committed · {s.remaining} left
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

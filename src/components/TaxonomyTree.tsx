import type { ProgressNode } from "@/engine/progressTypes";
import { masterySwatch } from "@/engine/masteryColor";

export function TaxonomyTree({ nodes }: { nodes: ProgressNode[] }) {
  const byParent = new Map<string | null, ProgressNode[]>();
  for (const n of nodes) {
    const list = byParent.get(n.parentId) ?? [];
    list.push(n);
    byParent.set(n.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }

  function Branch({
    parentId,
    exam,
  }: {
    parentId: string | null;
    exam: ProgressNode["exam"];
  }) {
    const kids = (byParent.get(parentId) ?? []).filter((n) => n.exam === exam);
    if (kids.length === 0) return null;
    return (
      <ul className={parentId ? "ml-4 border-l border-zinc-200 pl-3" : "space-y-1"}>
        {kids.map((n) => {
          const hasKids = (byParent.get(n.id) ?? []).some((c) => c.exam === exam);
          const label = (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: masterySwatch(n.unseen, n.mastery) }}
                title={n.unseen ? "unseen" : `mastery ${n.mastery.toFixed(3)}`}
              />
              <span className="font-mono text-xs text-zinc-500">{n.id}</span>
              <span>{n.name}</span>
              {!n.unseen ? (
                <span className="font-mono text-xs text-zinc-500">
                  {n.mastery.toFixed(2)}
                  {n.level === "topic" ? ` · ${n.masteryLevel}` : ""}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">unseen</span>
              )}
            </span>
          );
          return (
            <li key={n.id} className="py-0.5">
              {hasKids ? (
                <details open={n.level === "section"}>
                  <summary className="cursor-pointer text-sm">{label}</summary>
                  <Branch parentId={n.id} exam={exam} />
                </details>
              ) : (
                <div className="text-sm">{label}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      {(["mcat", "gamsat"] as const).map((exam) => (
        <section key={exam}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {exam}
          </h3>
          <Branch parentId={null} exam={exam} />
        </section>
      ))}
    </div>
  );
}

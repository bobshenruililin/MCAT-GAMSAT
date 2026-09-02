import { formatCount } from "@/engine/ambition";
import type { AtlasData, AtlasFamily } from "@/engine/atlas";

function FamilyCard({ family }: { family: AtlasFamily }) {
  const attemptedPct =
    family.topicCount === 0 ? 0 : Math.round((100 * family.attemptedTopics) / family.topicCount);
  return (
    <article
      className="rounded-lg border border-zinc-200 bg-white p-4"
      data-testid={`atlas-family-${family.family}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl tracking-tight">{family.family}</h3>
        <span className="text-xs font-mono uppercase text-zinc-500">{family.exam}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-zinc-500">Exam weight</dt>
          <dd className="tabular-nums">{(family.examWeight * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Items</dt>
          <dd className="tabular-nums" data-testid={`atlas-items-${family.family}`}>
            {formatCount(family.itemCount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Structure</dt>
          <dd className="tabular-nums">
            {family.sectionCount} FC · {family.categoryCount} cat · {family.topicCount} topics
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Mastery (unseen=0)</dt>
          <dd className="tabular-nums">{Math.round(family.mastery * 100)}%</dd>
        </div>
      </dl>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full bg-emerald-800"
          style={{ width: `${attemptedPct}%` }}
          title={`${attemptedPct}% of weighted topics attempted`}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {family.attemptedTopics}/{family.topicCount} topics attempted
      </p>
      <ul className="mt-3 space-y-1.5">
        {family.sections.map((section) => (
          <li key={section.id} className="flex justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-zinc-700">{section.name}</span>
            <span className="shrink-0 font-mono text-zinc-500">
              {formatCount(section.itemCount)} · {section.topicCount}t
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ExamAtlas({ atlas }: { atlas: AtlasData }) {
  const mcat = atlas.families.filter((f) => f.exam === "mcat");
  const gamsat = atlas.families.filter((f) => f.exam === "gamsat");
  return (
    <div data-testid="exam-atlas">
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">MCAT map</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {mcat.map((f) => (
            <FamilyCard key={f.family} family={f} />
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">GAMSAT map</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gamsat.map((f) => (
            <FamilyCard key={f.family} family={f} />
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Past-paper moves
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Original analogs of the exam move, never cloned stems. Retrieved as questions.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {atlas.patternMoves.map((p) => (
            <li key={p.id} className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
              <p className="text-xs font-mono text-zinc-500">
                {p.id} · {p.family}
              </p>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{p.move}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

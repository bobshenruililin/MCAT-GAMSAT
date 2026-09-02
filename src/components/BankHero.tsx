import { AMBITION, formatCount } from "@/engine/ambition";
import type { BankScale } from "@/engine/bankScale";

export function BankHero({ scale }: { scale: BankScale }) {
  const share = Math.round(scale.liveShareOfDesigned * 1000) / 10;
  return (
    <section
      className="rounded-lg border border-zinc-800 bg-[#1c1917] px-5 py-5 text-[#f4f1ea]"
      data-testid="bank-hero"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Designed retrieval bank</p>
      <p className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl" data-testid="designed-total">
        {formatCount(scale.designedTotal)}
      </p>
      <p className="mt-2 max-w-2xl text-sm text-zinc-300">
        {formatCount(AMBITION.factoryMultiplier)}× factory ({formatCount(scale.designedFactory)}) +{" "}
        {formatCount(scale.designedPatterns)} pattern drills + {formatCount(scale.designedHand)}{" "}
        hand-authored. Allocated by exam_weight with a {formatCount(AMBITION.floorPerWeightedTopic)}{" "}
        item floor per weighted topic. Never verified=true without a human or official paper.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-400">In this SQLite</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums" data-testid="live-items">
            {formatCount(scale.itemsInBank)}
          </dd>
          <p className="mt-1 text-xs text-zinc-500">{share}% of designed capacity</p>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">Outline nodes</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatCount(scale.outlineNodes)}</dd>
          <p className="mt-1 text-xs text-zinc-500">
            {AMBITION.examFamilies} families · {formatCount(scale.weightedTopics)} weighted topics
          </p>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">Past-paper moves</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatCount(AMBITION.patternMoves)}</dd>
          <p className="mt-1 text-xs text-zinc-500">
            {formatCount(scale.patternItems)} PAT.* items live
          </p>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">verified=true</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums" data-testid="hero-verified">
            {formatCount(scale.verifiedTrue)}
          </dd>
          <p className="mt-1 text-xs text-zinc-500">official papers only</p>
        </div>
      </dl>
    </section>
  );
}

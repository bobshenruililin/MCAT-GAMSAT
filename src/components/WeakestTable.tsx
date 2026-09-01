"use client";

import { useMemo, useState } from "react";
import type { ProgressNode } from "@/engine/progressTypes";
import { masterySwatch } from "@/engine/masteryColor";
import { LEVEL_ORDER } from "@/engine/masteryLevel";

type SortKey = "mastery" | "attempts" | "examWeight" | "id" | "masteryLevel";

export function WeakestTable({ topics }: { topics: ProgressNode[] }) {
  const [sort, setSort] = useState<SortKey>("mastery");
  const [dir, setDir] = useState<1 | -1>(1);

  const rows = useMemo(() => {
    const copy = [...topics];
    copy.sort((a, b) => {
      if (sort === "masteryLevel") {
        return (LEVEL_ORDER[a.masteryLevel] - LEVEL_ORDER[b.masteryLevel]) * dir;
      }
      const av = a[sort];
      const bv = b[sort];
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
    return copy;
  }, [topics, sort, dir]);

  function click(key: SortKey) {
    if (sort === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(key === "id" ? 1 : 1);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="mt-3 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300">
            <th className="py-2 pr-3">
              <button type="button" className="underline" onClick={() => click("id")}>
                Topic
              </button>
            </th>
            <th className="py-2 pr-3">
              <button type="button" className="underline" onClick={() => click("mastery")}>
                Mastery {sort === "mastery" ? (dir === 1 ? "↑" : "↓") : ""}
              </button>
            </th>
            <th className="py-2 pr-3">
              <button type="button" className="underline" onClick={() => click("masteryLevel")}>
                Level
              </button>
            </th>
            <th className="py-2 pr-3">
              <button type="button" className="underline" onClick={() => click("attempts")}>
                Attempts
              </button>
            </th>
            <th className="py-2">
              <button type="button" className="underline" onClick={() => click("examWeight")}>
                Weight
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-zinc-200">
              <td className="py-2 pr-3">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: masterySwatch(row.unseen, row.mastery) }}
                />
                <span className="font-mono text-xs">{row.id}</span>
                <span className="ml-2 text-zinc-600">{row.name}</span>
              </td>
              <td className="py-2 pr-3 font-mono">
                {row.unseen ? "—" : row.mastery.toFixed(3)}
              </td>
              <td className="py-2 pr-3" data-testid="mastery-level">
                {row.masteryLevel}
              </td>
              <td className="py-2 pr-3">{row.attempts}</td>
              <td className="py-2 font-mono">{row.examWeight.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

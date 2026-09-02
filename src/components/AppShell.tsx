import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/atlas", label: "Atlas" },
  { href: "/progress", label: "Progress" },
  { href: "/write", label: "S2 Writing" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/health", label: "Health" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#f7f3e8] text-zinc-900">
      <header className="border-b border-[#e4ddd0] bg-[#fffdf6]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-serif text-lg tracking-tight text-[#2f6b4f]">
            Exam morning
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-600">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#2f6b4f]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/progress", label: "Progress" },
  { href: "/write", label: "S2 Writing" },
  { href: "/health", label: "Health" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#f4f1ea] text-zinc-900">
      <header className="border-b border-zinc-800 bg-[#1c1917] text-[#f4f1ea]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-serif text-lg tracking-tight">
            Exam morning
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-300">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
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

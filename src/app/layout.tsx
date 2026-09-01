import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCAT-GAMSAT",
  description: "Local-first retrieval practice. Read NORTH_STAR.md.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}

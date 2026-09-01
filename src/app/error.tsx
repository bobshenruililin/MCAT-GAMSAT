"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-serif text-2xl">Something broke</h1>
      <p className="mt-2 text-sm text-red-700">{error.message}</p>
      <div className="mt-6 flex gap-4 text-sm">
        <button type="button" className="underline" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="underline">
          Back to Today
        </Link>
      </div>
    </main>
  );
}

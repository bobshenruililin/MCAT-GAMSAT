import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-serif text-2xl">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-600">
        That route is not a study surface. Today, Progress, S2 Writing, Health, and
        Scoreboard are in the header.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-sm underline">
          Back to Today
        </Link>
      </p>
    </main>
  );
}

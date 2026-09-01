export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p
      className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      data-testid="demo-banner"
    >
      <span className="font-semibold">[DEMO]</span> Simulated attempts from{" "}
      <span className="font-mono">pnpm demo:seed</span>. Not real study. Do not copy
      into SCOREBOARD.md. <span className="font-mono">pnpm db:reset</span> wipes them.
    </p>
  );
}

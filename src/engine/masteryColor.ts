/** Unseen nodes stay gray. Seen mastery maps low→red to high→green. */
export function masterySwatch(unseen: boolean, mastery: number): string {
  if (unseen) return "#d4d4d8";
  const t = Math.min(1, Math.max(0, (mastery - 0.2) / 0.7));
  const h = 8 + t * 112;
  return `hsl(${h.toFixed(0)} 70% 42%)`;
}

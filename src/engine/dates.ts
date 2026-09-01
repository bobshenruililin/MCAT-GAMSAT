export function toIso(date: Date): string {
  return date.toISOString();
}

export function fromIso(iso: string): Date {
  return new Date(iso);
}

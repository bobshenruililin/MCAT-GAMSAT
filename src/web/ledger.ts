import type { Ledger } from "./types";
import { LEDGER_KEY } from "./types";

export function emptyLedger(): Ledger {
  return {
    version: 1,
    attempts: [],
    cards: {},
    mastery: {},
    session: null,
    lastSummary: null,
  };
}

export function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

export function loadLedger(storage: Storage, key = LEDGER_KEY): Ledger {
  const raw = storage.getItem(key);
  if (!raw) return emptyLedger();
  try {
    const parsed = JSON.parse(raw) as Ledger;
    if (parsed.version !== 1 || !Array.isArray(parsed.attempts)) return emptyLedger();
    return {
      version: 1,
      attempts: parsed.attempts ?? [],
      cards: parsed.cards ?? {},
      mastery: parsed.mastery ?? {},
      session: parsed.session ?? null,
      lastSummary: parsed.lastSummary ?? null,
    };
  } catch {
    return emptyLedger();
  }
}

export function saveLedger(storage: Storage, ledger: Ledger, key = LEDGER_KEY): void {
  storage.setItem(key, JSON.stringify(ledger));
}

import type { LearnCard } from "@/features/learn/types";

// localStorage keys for the Learn feed — kept together so the client and the
// session hook reference the same strings and never drift.
export const SEEN_KEY = "learn-seen";
export const TOPICS_KEY = "learn-topics";
export const SETS_KEY = "learn-sets";
export const HISTORY_KEY = "learn-history";
export const CURRENT_KEY = "learn-current";
export const CARD_TYPES_KEY = "learn-card-types";

// Tunables: cards per set, and the history ring-buffer cap.
export const SESSION_N = 5;
export const HISTORY_CAP = 80;

// ---- small localStorage helpers (guarded for SSR) ----
export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// Keep the first occurrence of each card id (used when folding a finished set
// into history so a re-dealt card never appears twice).
export function dedupeById(cards: LearnCard[]): LearnCard[] {
  const seen = new Set<string>();
  const out: LearnCard[] = [];
  for (const c of cards) {
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

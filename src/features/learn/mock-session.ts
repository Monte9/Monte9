// Shared mock deck builder — used by both the client (learn-client.ts, as the
// graceful fallback) and the server (/api/learn, when there's no key / a limit
// is hit / generation fails). Kept in one place so the two decks never drift.
// NOTE: not a "use client" module, so the server route can import it too.
import { LEARN_FIXTURES } from "@/features/learn/data/learn-fixtures";
import type { LearnSession } from "@/features/learn/types";

export function buildMockSession(
  n: number,
  seen: string[] = [],
  types?: string[]
): LearnSession {
  const byType =
    types && types.length
      ? LEARN_FIXTURES.filter((c) => types.includes(c.type))
      : LEARN_FIXTURES;
  const base = byType.length ? byType : LEARN_FIXTURES;
  const fresh = base.filter((c) => !seen.includes(c.id));
  // If the fresh pool is too small (deck exhausted), fall back to the full set.
  const pool = fresh.length >= n ? fresh : base;
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return {
    cards: a.slice(0, Math.min(n, a.length)),
    generatedAt: new Date().toISOString(),
    mode: "mock",
  };
}

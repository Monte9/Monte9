"use client";

// Source seam for the Learn feed. Mock now (Sprint 3); the live serverless
// function is wired in Sprint 4 by flipping LIVE on and shipping /api/learn —
// the UI never changes because both paths return a LearnSession.
import { LEARN_FIXTURES } from "@/data/learn-fixtures";
import type { LearnCard, LearnSession } from "@/lib/learn-types";

// Sprint 4 flips this to true (and adds /api/learn). Until then, always mock.
const LIVE = false;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mockSession(n: number, seen: string[] = []): LearnSession {
  const fresh = LEARN_FIXTURES.filter((c) => !seen.includes(c.id));
  // If we've exhausted the deck, fall back to the full set so it never empties.
  const pool = fresh.length >= n ? fresh : LEARN_FIXTURES;
  const cards = shuffle(pool).slice(0, Math.min(n, pool.length));
  return { cards, generatedAt: new Date().toISOString(), mode: "mock" };
}

export type SessionOpts = {
  n?: number;
  topics?: string[];
  seen?: string[];
  mock?: boolean;
};

export async function getSession(opts: SessionOpts = {}): Promise<LearnSession> {
  const n = opts.n ?? 5;
  const seen = opts.seen ?? [];
  if (opts.mock || !LIVE) return mockSession(n, seen);
  try {
    const qs = new URLSearchParams({ n: String(n) });
    if (opts.topics?.length) qs.set("topics", opts.topics.join(","));
    if (seen.length) qs.set("seen", seen.join(","));
    const res = await fetch(`/api/learn/?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as LearnSession;
    if (!data?.cards?.length) throw new Error("empty session");
    return data;
  } catch {
    // Never blank: degrade to the mock deck on any error.
    return mockSession(n, seen);
  }
}

"use client";

// Source seam for the Learn feed. Mock now (Sprint 3); the live serverless
// function is wired in Sprint 4 by flipping LIVE on and shipping /api/learn —
// the UI never changes because both paths return a LearnSession.
import type { CardType, LearnSession } from "@/features/learn/types";
import { buildMockSession } from "@/features/learn/mock-session";

// Selectable card types (the chips in the "New set" setup sheet). Passed to
// /api/learn as the `types` filter.
export const CARD_TYPES: { key: CardType; label: string }[] = [
  { key: "quiz", label: "Quiz" },
  { key: "trivia", label: "Trivia" },
  { key: "news", label: "News" },
  { key: "flashcard", label: "Flashcard" },
  { key: "thisday", label: "On this day" },
];

// Monte's selectable topics (the chips in the Learn topic picker). Passed to
// /api/learn as the `topics` filter; the route adds a discover lane on top.
export const TOPICS = [
  "Porsche",
  "Roman history",
  "Indian mythology",
  "Systems engineering",
  "Algorithms",
  "Data structures",
  "Pickleball",
  "Geography",
  "The Moon",
  "Mars",
  "Startups",
  "AI",
];

// Live as of Sprint 4: the client hits /api/learn (which itself returns mock
// cards when ANTHROPIC_API_KEY isn't set, so the feed works key or no key).
const LIVE = true;

export type SessionOpts = {
  n?: number;
  topics?: string[];
  types?: string[];
  seen?: string[];
  mock?: boolean;
};

export async function getSession(opts: SessionOpts = {}): Promise<LearnSession> {
  const n = opts.n ?? 5;
  const seen = opts.seen ?? [];
  if (opts.mock || !LIVE) return buildMockSession(n, seen, opts.types);
  try {
    const qs = new URLSearchParams({ n: String(n) });
    if (opts.topics?.length) qs.set("topics", opts.topics.join(","));
    if (opts.types?.length) qs.set("types", opts.types.join(","));
    if (seen.length) qs.set("seen", seen.join(","));
    const res = await fetch(`/api/learn/?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as LearnSession;
    if (!data?.cards?.length) throw new Error("empty session");
    return data;
  } catch {
    // Never blank: degrade to the mock deck on any error, flagged so the UI can
    // show an "offline sample" note.
    return { ...buildMockSession(n, seen, opts.types), degraded: true };
  }
}

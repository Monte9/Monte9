import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { LEARN_FIXTURES } from "@/data/learn-fixtures";
import type { LearnCard, LearnSession } from "@/lib/learn-types";
import { clientIp, withinIpLimit, withinDailyCap } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_TOPICS = [
  "Porsche / cars",
  "Roman history",
  "Indian mythology",
  "Systems engineering",
  "Data structures (interview / L5)",
  "Algorithms (interview / L5)",
  "Pickleball",
  "Geography",
  "The Moon",
  "Mars",
  "Startups & product",
  "AI",
];

const Difficulty = z.enum(["easy", "medium", "hard"]).catch("medium");
const Quiz = z.object({
  type: z.literal("quiz"),
  topic: z.string(),
  difficulty: Difficulty,
  question: z.string().min(8),
  options: z.array(z.string().min(1)).min(2).max(4),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(10),
});
const Trivia = z.object({
  type: z.literal("trivia"),
  topic: z.string(),
  difficulty: Difficulty,
  fact: z.string().min(10),
  why: z.string().min(10),
});
const News = z.object({
  type: z.literal("news"),
  topic: z.string(),
  difficulty: Difficulty,
  headline: z.string().min(8),
  summary: z.string().min(10),
  why: z.string().min(10),
  source: z.object({ name: z.string(), url: z.string().url() }),
});
const Flashcard = z.object({
  type: z.literal("flashcard"),
  topic: z.string(),
  difficulty: Difficulty,
  term: z.string().min(2),
  definition: z.string().min(10),
});
const ThisDay = z.object({
  type: z.literal("thisday"),
  topic: z.string(),
  difficulty: Difficulty,
  year: z.coerce.string(),
  event: z.string().min(8),
  why: z.string().min(10),
});
const GenCard = z.discriminatedUnion("type", [
  Quiz,
  Trivia,
  News,
  Flashcard,
  ThisDay,
]);

// Fresh, real headlines from the public Hacker News API (no key). Returns a few
// {title,url} so the model can summarize them into grounded news cards.
async function fetchHeadlines(k: number): Promise<{ title: string; url: string }[]> {
  try {
    const ids: number[] = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { cache: "no-store" }
    ).then((r) => r.json());
    const picks = ids.slice(0, k * 3);
    const items = await Promise.all(
      picks.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          cache: "no-store",
        })
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    return items
      .filter((it) => it && it.title && it.url)
      .slice(0, k)
      .map((it) => ({ title: it.title as string, url: it.url as string }));
  } catch {
    return [];
  }
}

function mockSession(n: number, seen: string[]): LearnSession {
  const fresh = LEARN_FIXTURES.filter((c) => !seen.includes(c.id));
  const pool = fresh.length >= n ? fresh : LEARN_FIXTURES;
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

function extractJsonArray(text: string): unknown[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const n = Math.min(Math.max(Number(url.searchParams.get("n")) || 5, 1), 8);
  const seen = (url.searchParams.get("seen") || "").split(",").filter(Boolean);
  const topics =
    (url.searchParams.get("topics") || "").split(",").map((t) => t.trim()).filter(Boolean);
  const topicList = topics.length ? topics : DEFAULT_TOPICS;

  // Per-IP burst limit: serve a cheap sample deck (no model call) when tripped.
  const ip = clientIp(req);
  if (!(await withinIpLimit(ip))) {
    return Response.json({
      ...mockSession(n, seen),
      degraded: true,
      note: "slow down — sample cards",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // No key (e.g. before it's set in Vercel) → graceful mock so the feed still works.
  if (!apiKey) return Response.json(mockSession(n, seen));

  // Global daily generation cap (circuit breaker on spend): once today's budget
  // is spent, serve the sample deck instead of calling the model.
  if (!(await withinDailyCap())) {
    return Response.json({
      ...mockSession(n, seen),
      degraded: true,
      note: "daily limit — sample cards",
    });
  }

  // Fresh real headlines for grounded news cards (best-effort).
  const headlines = await fetchHeadlines(3);
  const headlineUrls = new Set(headlines.map((h) => h.url));
  const newsBlock = headlines.length
    ? `\n\nCURRENT REAL HEADLINES (use 1-2 of these as "news" cards — copy the headline and url VERBATIM into the card; write your own summary + so-what):\n${headlines
        .map((h, i) => `[${i + 1}] ${h.title} — ${h.url}`)
        .join("\n")}`
    : "";

  const prompt = `You are a sharp, accurate quizmaster generating ${n} bite-size LEARNING cards for a personal "Learn" feed. The reader has ~2 minutes and wants to learn something and be entertained.

Return ONLY a JSON array of exactly ${n} cards (no prose, no markdown fences). Mix the TYPES and TOPICS so it feels varied. Draw topics from this set (use the reader's interests): ${topicList.join(", ")}.

Each card is one of:
- {"type":"quiz","topic":string,"difficulty":"easy"|"medium"|"hard","question":string,"options":[3-4 strings],"correctIndex":integer (0-based index of the correct option),"explanation":string}
- {"type":"trivia","topic":string,"difficulty":"easy"|"medium"|"hard","fact":string,"why":string}
- {"type":"flashcard","topic":string,"difficulty":"easy"|"medium"|"hard","term":string,"definition":string}
- {"type":"thisday","topic":string,"difficulty":"easy"|"medium"|"hard","year":string,"event":string,"why":string}
- {"type":"news","topic":string,"difficulty":"easy"|"medium"|"hard","headline":string,"summary":string (≤2 sentences),"why":string (the so-what),"source":{"name":"Hacker News","url":string}}${newsBlock}

Rules: be factually correct and self-contained; quiz options must be plausible (no throwaways) and exactly one correct; "explanation"/"why"/"summary"/"definition" is the teaching payoff in 1-2 sentences. For news cards, the headline and source.url MUST be copied verbatim from the provided headlines (do not invent news). Mix at least 3 different card TYPES across the set. Include exactly ONE "discover" card on an interesting topic OUTSIDE the reader's set above (label its topic honestly). Vary difficulty. Do NOT repeat well-worn clichés. Output the JSON array only.`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2200,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const raw = extractJsonArray(text);
    if (!raw) return Response.json(mockSession(n, seen));

    const cards: LearnCard[] = [];
    for (const item of raw) {
      const parsed = GenCard.safeParse(item);
      if (!parsed.success) continue;
      const c = parsed.data;
      if (c.type === "quiz" && c.correctIndex >= c.options.length) continue;
      // Drop hallucinated news: the source URL must be one we actually fetched.
      if (c.type === "news" && !headlineUrls.has(c.source.url)) continue;
      cards.push({ ...c, id: `live-${crypto.randomUUID().slice(0, 8)}` } as LearnCard);
    }
    if (cards.length === 0) return Response.json(mockSession(n, seen));

    const session: LearnSession = {
      cards,
      generatedAt: new Date().toISOString(),
      mode: "live",
    };
    return Response.json(session);
  } catch {
    return Response.json(mockSession(n, seen));
  }
}

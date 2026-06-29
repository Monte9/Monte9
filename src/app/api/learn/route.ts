import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { LEARN_FIXTURES } from "@/data/learn-fixtures";
import type { LearnCard, LearnSession } from "@/lib/learn-types";

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
const GenCard = z.discriminatedUnion("type", [Quiz, Trivia]);

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // No key (e.g. before it's set in Vercel) → graceful mock so the feed still works.
  if (!apiKey) return Response.json(mockSession(n, seen));

  const prompt = `You are a sharp, accurate quizmaster generating ${n} bite-size LEARNING cards for a personal "Learn" feed. The reader has ~2 minutes and wants to learn something and be entertained.

Return ONLY a JSON array of exactly ${n} cards (no prose, no markdown fences). Mix the TYPES and TOPICS so it feels varied. Draw topics from this set (use the reader's interests): ${topicList.join(", ")}.

Each card is one of:
- {"type":"quiz","topic":string,"difficulty":"easy"|"medium"|"hard","question":string,"options":[3-4 strings],"correctIndex":integer (0-based index of the correct option),"explanation":string}
- {"type":"trivia","topic":string,"difficulty":"easy"|"medium"|"hard","fact":string,"why":string}

Rules: be factually correct and self-contained; quiz options must be plausible (no throwaways) and exactly one correct; "explanation"/"why" is the teaching payoff in 1-2 sentences (the chain of facts to the answer / why it matters). Vary difficulty. Do NOT repeat well-worn clichés. Output the JSON array only.`;

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

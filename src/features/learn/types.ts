// Shared, client-safe types for the Learn feed. Used by the UI, the mock
// fixtures, and the /api/learn serverless function + its Zod schema.

export type Difficulty = "easy" | "medium" | "hard";
export type CardType = "quiz" | "trivia" | "news" | "flashcard" | "thisday";

// Fields common to every card. `seenAt` is stamped client-side when a card is
// dealt (the session's generatedAt) so the UI can show "when" and sort history.
type CardCommon = {
  id: string;
  topic: string;
  difficulty: Difficulty;
  seenAt?: string;
};

export type QuizCard = CardCommon & {
  type: "quiz";
  question: string;
  options: string[]; // 2–4
  correctIndex: number;
  explanation: string; // the "why" — the chain of facts to the answer
};

export type TriviaCard = CardCommon & {
  type: "trivia";
  fact: string;
  why: string; // why it's interesting / matters
};

export type NewsCard = CardCommon & {
  type: "news";
  headline: string;
  summary: string; // ≤2 sentences
  why: string; // the "so what"
  source?: { name: string; url: string };
};

export type FlashcardCard = CardCommon & {
  type: "flashcard";
  term: string;
  definition: string;
};

export type ThisDayCard = CardCommon & {
  type: "thisday";
  year: string; // keep as string ("1969", "49 BC")
  event: string;
  why: string;
};

export type LearnCard =
  | QuizCard
  | TriviaCard
  | NewsCard
  | FlashcardCard
  | ThisDayCard;

export type LearnSession = {
  cards: LearnCard[];
  generatedAt: string;
  mode: "live" | "mock";
  degraded?: boolean; // true when a live fetch failed and we fell back to mock
  note?: string; // short reason for a degraded/sample response (rate limit, etc.)
};

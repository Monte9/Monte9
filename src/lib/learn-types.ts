// Shared, client-safe types for the Learn feed. Used by the UI, the mock
// fixtures, and (Sprint 4) the /api/learn serverless function + its Zod schema.

export type Difficulty = "easy" | "medium" | "hard";
export type CardType = "quiz" | "trivia" | "news" | "flashcard" | "thisday";

export type QuizCard = {
  id: string;
  type: "quiz";
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: string[]; // 2–4
  correctIndex: number;
  explanation: string; // the "why" — the chain of facts to the answer
};

export type TriviaCard = {
  id: string;
  type: "trivia";
  topic: string;
  difficulty: Difficulty;
  fact: string;
  why: string; // why it's interesting / matters
};

export type NewsCard = {
  id: string;
  type: "news";
  topic: string;
  difficulty: Difficulty;
  headline: string;
  summary: string; // ≤2 sentences
  why: string; // the "so what"
  source?: { name: string; url: string };
};

export type FlashcardCard = {
  id: string;
  type: "flashcard";
  topic: string;
  difficulty: Difficulty;
  term: string;
  definition: string;
};

export type ThisDayCard = {
  id: string;
  type: "thisday";
  topic: string;
  difficulty: Difficulty;
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
};

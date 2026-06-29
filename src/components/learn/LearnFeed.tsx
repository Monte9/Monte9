"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCw, Check, X, ArrowRight, Flame } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getSession, TOPICS } from "@/lib/learn-client";
import type { LearnCard, LearnSession } from "@/lib/learn-types";

const SEEN_KEY = "learn-seen";
const STREAK_KEY = "learn-streak";
const TOPICS_KEY = "learn-topics";
const SESSION_N = 5;

// ---- small localStorage helpers (guarded for SSR) ----
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000
  );

type Phase = "loading" | "card" | "complete";

export default function LearnFeed() {
  const { reduceMotion } = useTheme();
  const [phase, setPhase] = useState<Phase>("loading");
  const [cards, setCards] = useState<LearnCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null); // quiz selection
  const [revealed, setRevealed] = useState(false); // trivia/news why shown
  const [correct, setCorrect] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [topics, setTopics] = useState<string[]>(TOPICS);
  const topicsRef = useRef<string[]>(TOPICS);
  const mockRef = useRef(false);
  const [degraded, setDegraded] = useState(false);
  const [pull, setPull] = useState(0);
  const pullStartY = useRef<number | null>(null);

  // current streak for display (broken if last completion > 1 day ago)
  useEffect(() => {
    const { streak: s = 0, lastDate = "" } = readJSON<{
      streak: number;
      lastDate: string;
    }>(STREAK_KEY, { streak: 0, lastDate: "" });
    setStreak(lastDate && daysBetween(lastDate, today()) <= 1 ? s : 0);
    const savedTopics = readJSON<string[]>(TOPICS_KEY, TOPICS);
    if (Array.isArray(savedTopics) && savedTopics.length) {
      setTopics(savedTopics);
      topicsRef.current = savedTopics;
    }
    mockRef.current =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("mock") === "1";
  }, []);

  const toggleTopic = useCallback((t: string) => {
    setTopics((cur) => {
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      topicsRef.current = next;
      writeJSON(TOPICS_KEY, next);
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setPhase("loading");
    const seen = readJSON<string[]>(SEEN_KEY, []);
    const session: LearnSession = await getSession({
      n: SESSION_N,
      seen,
      mock: mockRef.current,
      topics: topicsRef.current.length ? topicsRef.current : undefined,
    });
    // remember these cards so the next set avoids them (ring buffer ~60)
    const nextSeen = [...session.cards.map((c) => c.id), ...seen].slice(0, 60);
    writeJSON(SEEN_KEY, nextSeen);
    setDegraded(!!session.degraded);
    setCards(session.cards);
    setQuizCount(session.cards.filter((c) => c.type === "quiz").length);
    setIdx(0);
    setChosen(null);
    setRevealed(false);
    setCorrect(0);
    setPhase("card");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // dynamic tab title = the external trigger
  useEffect(() => {
    const base = "Learn · Monte Thakkar";
    if (phase === "complete") document.title = "New set ready · Learn";
    else document.title = streak > 0 ? `🔥 ${streak}-day streak · Learn` : base;
    return () => {
      document.title = base;
    };
  }, [phase, streak]);

  const bumpStreak = useCallback(() => {
    const { streak: s = 0, lastDate = "" } = readJSON<{
      streak: number;
      lastDate: string;
    }>(STREAK_KEY, { streak: 0, lastDate: "" });
    const t = today();
    let next: number;
    if (lastDate === t) next = s || 1;
    else next = lastDate && daysBetween(lastDate, t) === 1 ? s + 1 : 1;
    writeJSON(STREAK_KEY, { streak: next, lastDate: t });
    setStreak(next);
  }, []);

  const next = useCallback(() => {
    if (idx < cards.length - 1) {
      setIdx((i) => i + 1);
      setChosen(null);
      setRevealed(false);
    } else {
      bumpStreak();
      setPhase("complete");
    }
  }, [idx, cards.length, bumpStreak]);

  const card = cards[idx];
  const trans = reduceMotion ? "" : "transition-colors";

  // Pull-to-refresh: pull down past threshold while scrolled to the top → new set.
  const onTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY <= 0)
      pullStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current == null) return;
    const d = e.touches[0].clientY - pullStartY.current;
    if (d > 0 && window.scrollY <= 0) setPull(Math.min(d, 90));
  };
  const onTouchEnd = () => {
    if (pull > 70) load();
    pullStartY.current = null;
    setPull(0);
  };

  // ---------- render ----------
  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
        Dealing your cards…
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-2 flex items-center gap-2 text-2xl font-semibold text-fg">
          <Flame className="h-6 w-6 text-accent" aria-hidden /> {streak}-day streak
        </div>
        {quizCount > 0 && (
          <p className="mb-1 text-fg">
            {correct}/{quizCount} correct this set
          </p>
        )}
        <p className="mb-6 text-sm text-muted">Nice — that&apos;s your 2 minutes.</p>

        <div className="mb-6 w-full max-w-sm">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Topics for your next set
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {TOPICS.map((t) => {
              const on = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTopic(t)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    on
                      ? "border-accent text-accent"
                      : "border-border text-muted hover:text-fg"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-accent-contrast hover:opacity-90"
        >
          <RotateCw className="h-4 w-4" aria-hidden /> New set
        </button>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pull > 0 && (
        <div
          className="mb-1 text-center text-xs text-muted"
          style={{ opacity: Math.min(pull / 70, 1) }}
        >
          {pull > 70 ? "Release for a new set ↻" : "Pull for a new set ↓"}
        </div>
      )}
      {degraded && (
        <div className="mb-3 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-center text-xs text-muted">
          Showing sample cards — couldn&apos;t reach the generator.
        </div>
      )}
      {/* progress + streak */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${
                i === idx ? "w-6 bg-accent" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3.5 w-3.5 text-accent" aria-hidden />
          {streak}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
          <span className="rounded-full bg-surface-2 px-2 py-0.5 capitalize">
            {card.type}
          </span>
          <span>{card.topic}</span>
        </div>

        {card.type === "quiz" && (
          <QuizView
            card={card}
            chosen={chosen}
            onChoose={(i) => {
              if (chosen !== null) return;
              setChosen(i);
              if (i === card.correctIndex) setCorrect((c) => c + 1);
            }}
            trans={trans}
          />
        )}

        {card.type === "trivia" && (
          <div>
            <p className="text-lg leading-relaxed text-fg">{card.fact}</p>
            {revealed ? (
              <p className="mt-4 border-l-2 border-accent pl-3 text-sm text-muted">
                {card.why}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-4 text-sm font-medium text-accent hover:opacity-80"
              >
                Why it matters →
              </button>
            )}
          </div>
        )}

        {card.type === "news" && (
          <div>
            <h2 className="text-lg font-semibold leading-snug text-fg">
              {card.headline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg">{card.summary}</p>
            {revealed ? (
              <div className="mt-4 border-l-2 border-accent pl-3">
                <p className="text-sm text-muted">{card.why}</p>
                {card.source && (
                  <a
                    href={card.source.url}
                    className="mt-1 inline-block text-xs text-accent hover:underline"
                  >
                    {card.source.name} →
                  </a>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-4 text-sm font-medium text-accent hover:opacity-80"
              >
                So what? →
              </button>
            )}
          </div>
        )}

        {card.type === "flashcard" && (
          <div>
            <p className="text-lg font-semibold text-fg">{card.term}</p>
            {revealed ? (
              <p className="mt-3 border-l-2 border-accent pl-3 text-sm leading-relaxed text-muted">
                {card.definition}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-4 text-sm font-medium text-accent hover:opacity-80"
              >
                Reveal →
              </button>
            )}
          </div>
        )}

        {card.type === "thisday" && (
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">
              On this day · {card.year}
            </p>
            <p className="mt-1 text-lg leading-relaxed text-fg">{card.event}</p>
            {revealed ? (
              <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-muted">
                {card.why}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-4 text-sm font-medium text-accent hover:opacity-80"
              >
                Why it matters →
              </button>
            )}
          </div>
        )}

        {card.type === "bigq" && (
          <div>
            <p className="text-lg leading-relaxed text-fg">{card.prompt}</p>
            <p className="mt-3 text-sm text-muted">
              Take a beat — there&apos;s no wrong answer.
            </p>
          </div>
        )}
      </div>

      {/* next — enabled once the card has been engaged */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={
            card.type === "quiz"
              ? chosen === null
              : card.type === "bigq"
                ? false
                : !revealed
          }
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-40"
        >
          {idx === cards.length - 1 ? "Finish" : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function QuizView({
  card,
  chosen,
  onChoose,
  trans,
}: {
  card: Extract<LearnCard, { type: "quiz" }>;
  chosen: number | null;
  onChoose: (i: number) => void;
  trans: string;
}) {
  const answered = chosen !== null;
  return (
    <div>
      <p className="text-lg font-medium leading-snug text-fg">{card.question}</p>
      <div className="mt-4 space-y-2">
        {card.options.map((opt, i) => {
          const isCorrect = i === card.correctIndex;
          const isChosen = i === chosen;
          let cls = "border-border bg-bg text-fg";
          if (answered && isCorrect)
            cls = "border-accent bg-surface-2 text-fg";
          else if (answered && isChosen)
            cls = "border-border bg-surface-2 text-muted line-through";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChoose(i)}
              disabled={answered}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${trans} ${cls} ${
                answered ? "" : "hover:bg-surface-2"
              }`}
            >
              <span>{opt}</span>
              {answered && isCorrect && (
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              )}
              {answered && isChosen && !isCorrect && (
                <X className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mt-4 border-l-2 border-accent pl-3 text-sm text-muted">
          {card.explanation}
        </p>
      )}
    </div>
  );
}

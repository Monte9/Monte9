"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RotateCw,
  Check,
  X,
  ArrowRight,
  Flame,
  Layers,
  BarChart3,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getSession, TOPICS } from "@/lib/learn-client";
import type { LearnCard, LearnSession } from "@/lib/learn-types";

const SEEN_KEY = "learn-seen";
const STREAK_KEY = "learn-streak";
const TOPICS_KEY = "learn-topics";
const SETS_KEY = "learn-sets";
const HISTORY_KEY = "learn-history";
const CURRENT_KEY = "learn-current";
const SESSION_N = 5;
const HISTORY_CAP = 80;

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
function dedupeById(cards: LearnCard[]): LearnCard[] {
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

type Phase = "loading" | "card" | "complete";
type View = "current" | "history";

export default function LearnFeed() {
  const { reduceMotion } = useTheme();
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<View>("current");
  const [cards, setCards] = useState<LearnCard[]>([]);
  const [history, setHistory] = useState<LearnCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null); // quiz selection
  const [correct, setCorrect] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sets, setSets] = useState(0); // total sets completed (persisted)
  const [topics, setTopics] = useState<string[]>(TOPICS);
  const topicsRef = useRef<string[]>(TOPICS);
  const mockRef = useRef(false);
  const [degraded, setDegraded] = useState(false);
  const [degradedNote, setDegradedNote] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false); // analytics password UI
  const [statsPass, setStatsPass] = useState("");

  // streak + sets + history for display (streak breaks if last completion >1d ago)
  useEffect(() => {
    const { streak: s = 0, lastDate = "" } = readJSON<{
      streak: number;
      lastDate: string;
    }>(STREAK_KEY, { streak: 0, lastDate: "" });
    setStreak(lastDate && daysBetween(lastDate, today()) <= 1 ? s : 0);
    const savedSets = readJSON<number>(SETS_KEY, 0);
    setSets(typeof savedSets === "number" ? savedSets : 0);
    setHistory(readJSON<LearnCard[]>(HISTORY_KEY, []));
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
    setView("current");
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
    // grow the full-card history (newest first, deduped, capped)
    const prevHist = readJSON<LearnCard[]>(HISTORY_KEY, []);
    const mergedHist = dedupeById([...session.cards, ...prevHist]).slice(
      0,
      HISTORY_CAP
    );
    writeJSON(HISTORY_KEY, mergedHist);
    setHistory(mergedHist);
    setDegraded(!!session.degraded);
    setDegradedNote(session.note ?? null);
    setCards(session.cards);
    setQuizCount(session.cards.filter((c) => c.type === "quiz").length);
    setIdx(0);
    setChosen(null);
    setCorrect(0);
    setPhase("card");
  }, []);

  // On mount, restore the in-progress set instead of fetching — so navigating
  // away and back (or any remount) doesn't burn a new generation. Only fetch
  // when there's nothing saved; "New set" is the explicit way to fetch fresh.
  useEffect(() => {
    const saved = readJSON<{
      cards: LearnCard[];
      idx: number;
      chosen: number | null;
      correct: number;
      quizCount: number;
      phase: "card" | "complete";
      degraded?: boolean;
      note?: string | null;
    } | null>(CURRENT_KEY, null);
    if (saved && Array.isArray(saved.cards) && saved.cards.length) {
      setCards(saved.cards);
      setIdx(Math.min(Math.max(saved.idx ?? 0, 0), saved.cards.length - 1));
      setChosen(saved.chosen ?? null);
      setCorrect(saved.correct ?? 0);
      setQuizCount(
        saved.quizCount ?? saved.cards.filter((c) => c.type === "quiz").length
      );
      setDegraded(!!saved.degraded);
      setDegradedNote(saved.note ?? null);
      setPhase(saved.phase === "complete" ? "complete" : "card");
    } else {
      load();
    }
  }, [load]);

  // Persist the current set + progress so a remount restores exactly here.
  useEffect(() => {
    if (phase === "loading" || cards.length === 0) return;
    writeJSON(CURRENT_KEY, {
      cards,
      idx,
      chosen,
      correct,
      quizCount,
      phase,
      degraded,
      note: degradedNote,
    });
  }, [cards, idx, chosen, correct, quizCount, phase, degraded, degradedNote]);

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

  const bumpSets = useCallback(() => {
    setSets((cur) => {
      const n = cur + 1;
      writeJSON(SETS_KEY, n);
      return n;
    });
  }, []);

  const next = useCallback(() => {
    if (idx < cards.length - 1) {
      setIdx((i) => i + 1);
      setChosen(null);
    } else {
      bumpStreak();
      bumpSets();
      setPhase("complete");
    }
  }, [idx, cards.length, bumpStreak, bumpSets]);

  const card = cards[idx];
  const trans = reduceMotion ? "" : "transition-colors";
  // Only quiz cards gate the Next button — everything else is read-and-go.
  const engaged = card?.type === "quiz" ? chosen !== null : true;
  const hasNextCard = idx < cards.length - 1;

  // History = everything seen. While a set is in progress we hide its own cards
  // (they're the "current" set); once it's complete, fold them in so the count
  // and the History feed update the moment you finish on the success screen.
  const currentIds = new Set(cards.map((c) => c.id));
  const pastCards =
    phase === "complete"
      ? history
      : history.filter((c) => !currentIds.has(c.id));

  return (
    <div className="relative -mx-5 -mt-10 -mb-28 flex h-[calc(100svh-8.5rem)] flex-col overflow-hidden sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      {/* ---- header: title + description + meta + view toggle (matches /posts, /apps) ---- */}
      <div className="relative z-20 shrink-0 px-5 pt-10">
        <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Learn</h1>
        <p className="text-muted">
          A 2-minute hit of quizzes, trivia, and fresh news on the things
          I&apos;m into.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-accent" aria-hidden />
            {streak}-day streak
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {sets} {sets === 1 ? "set" : "sets"} done
          </span>
          {view === "current" && phase === "card" && cards.length > 0 && (
            <span>
              {idx + 1} / {cards.length}
            </span>
          )}
          {degraded && (
            <span className="opacity-80">
              · {degradedNote ?? "offline sample"}
            </span>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div
            className="inline-flex rounded-lg border border-border p-0.5 text-xs"
            role="group"
            aria-label="Learn view"
          >
            {(["current", "history"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                  view === v
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:text-fg"
                }`}
              >
                {v}
                {v === "history" && pastCards.length > 0
                  ? ` (${pastCards.length})`
                  : ""}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {showStats ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = statsPass.trim();
                  if (t)
                    window.location.href = `/api/learn/stats/?token=${encodeURIComponent(
                      t
                    )}`;
                }}
              >
                <input
                  type="password"
                  value={statsPass}
                  autoFocus
                  onChange={(e) => setStatsPass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowStats(false);
                  }}
                  placeholder="password ↵"
                  aria-label="Analytics password"
                  className="w-32 rounded-full border border-border bg-bg/60 px-3 py-1.5 text-xs text-fg outline-none backdrop-blur focus:border-accent"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowStats(true)}
                aria-label="View analytics"
                title="Analytics"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-bg/60 p-2 text-muted backdrop-blur transition-colors hover:text-fg"
              >
                <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={load}
              aria-label="Deal a new set"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur transition-colors hover:text-fg"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">New set</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---- stage ---- */}
      <div className="relative z-10 mt-4 min-h-0 flex-1">
        {view === "history" ? (
          <HistoryFeed cards={pastCards} />
        ) : phase === "loading" ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Dealing your cards…
          </div>
        ) : phase === "complete" ? (
          <Complete
            reduceMotion={reduceMotion}
            streak={streak}
            sets={sets}
            correct={correct}
            quizCount={quizCount}
            topics={topics}
            onToggleTopic={toggleTopic}
            onNewSet={load}
          />
        ) : (
          card && (
            <>
              {/* a static card behind the active one for a subtle "deck" feel */}
              {hasNextCard && (
                <div
                  aria-hidden
                  className="absolute left-1/2 top-1/2 rounded-2xl border border-border bg-surface"
                  style={{
                    width: "min(94vw, 34rem)",
                    height: "min(100%, 38rem)",
                    transform:
                      "translate(-50%, -50%) translateY(12px) scale(0.955)",
                    opacity: 0.5,
                    zIndex: 5,
                  }}
                />
              )}

              <div
                key={card.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: "min(94vw, 34rem)",
                  height: "min(100%, 38rem)",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              >
                <div
                  className={`flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.4)] ${
                    reduceMotion ? "" : "learn-card-in"
                  }`}
                >
                  <CardChrome type={card.type} topic={card.topic} />
                  <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                    <CardBody
                      card={card}
                      chosen={chosen}
                      reduceMotion={reduceMotion}
                      trans={trans}
                      onChoose={(i) => {
                        if (chosen !== null) return;
                        setChosen(i);
                        if (card.type === "quiz" && i === card.correctIndex)
                          setCorrect((n) => n + 1);
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* ---- footer: progress dots + Next/Finish (current set only) ---- */}
      {view === "current" && phase === "card" && card && (
        <div className="relative z-20 shrink-0 px-5 pb-3 pt-1">
          <div className="mb-2.5 flex items-center justify-center gap-1.5">
            {cards.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full ${
                  reduceMotion ? "" : "transition-all duration-300"
                } ${i === idx ? "w-6 bg-accent" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={next}
              disabled={!engaged}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg/60 px-5 py-2.5 text-sm font-medium text-fg backdrop-blur transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              {idx === cards.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// The type/topic chip row at the top of a card.
function CardChrome({ type, topic }: { type: string; topic: string }) {
  return (
    <div className="mb-3 flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
      <span className="rounded-full bg-surface-2 px-2 py-0.5 capitalize">
        {type}
      </span>
      <span className="truncate">{topic}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History feed — a scrollable, read-only list of previously-seen cards.
// ---------------------------------------------------------------------------
function HistoryFeed({ cards }: { cards: LearnCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center text-sm text-muted">
        No history yet — finish a set and the cards you&apos;ve seen show up
        here.
      </div>
    );
  }
  return (
    <div className="mx-auto h-full max-w-[34rem] space-y-3 overflow-y-auto px-5 pb-4">
      {cards.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-border bg-surface p-4"
        >
          <CardChrome type={c.type} topic={c.topic} />
          {c.type === "quiz" ? (
            <QuizReview card={c} />
          ) : (
            <NonQuizContent card={c} />
          )}
        </div>
      ))}
    </div>
  );
}

// Read-only quiz: shows the question, the correct option, and the explanation.
function QuizReview({
  card,
}: {
  card: Extract<LearnCard, { type: "quiz" }>;
}) {
  return (
    <div>
      <p className="text-base font-medium leading-snug text-fg">
        {card.question}
      </p>
      <div className="mt-3 space-y-2">
        {card.options.map((opt, i) => {
          const isCorrect = i === card.correctIndex;
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm ${
                isCorrect
                  ? "border-accent bg-surface-2 text-fg"
                  : "border-border bg-bg text-muted"
              }`}
            >
              <span>{opt}</span>
              {isCorrect && (
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      <Quote>{card.explanation}</Quote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion celebration (count-up + burst + topic picker + new set).
// ---------------------------------------------------------------------------
function Complete({
  reduceMotion,
  streak,
  sets,
  correct,
  quizCount,
  topics,
  onToggleTopic,
  onNewSet,
}: {
  reduceMotion: boolean;
  streak: number;
  sets: number;
  correct: number;
  quizCount: number;
  topics: string[];
  onToggleTopic: (t: string) => void;
  onNewSet: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-4 text-center">
      <div
        className={`relative mb-2 flex items-center gap-2 text-2xl font-semibold text-fg ${
          reduceMotion ? "" : "learn-countup"
        }`}
      >
        {!reduceMotion && <Burst />}
        <Flame className="h-6 w-6 text-accent" aria-hidden /> {streak}-day streak
      </div>
      {quizCount > 0 && (
        <p className={`mb-1 text-fg ${reduceMotion ? "" : "learn-countup"}`}>
          {correct}/{quizCount} correct this set
        </p>
      )}
      <p className="mb-6 text-sm text-muted">
        Nice — that&apos;s your 2 minutes. {sets} {sets === 1 ? "set" : "sets"}{" "}
        done so far.
      </p>

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
                onClick={() => onToggleTopic(t)}
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
        onClick={onNewSet}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-accent-contrast hover:opacity-90"
      >
        <RotateCw className="h-4 w-4" aria-hidden /> New set
      </button>
    </div>
  );
}

// One-shot accent particle burst (the reward beat on a correct answer).
function Burst() {
  const dots = Array.from({ length: 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 14;
    const r = 34 + (i % 3) * 12;
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
  });
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      aria-hidden
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="learn-burst-dot absolute h-1.5 w-1.5 rounded-full bg-accent"
          style={
            { "--dx": `${d.dx}px`, "--dy": `${d.dy}px` } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card body — type-specific content for the interactive (current) card.
// ---------------------------------------------------------------------------
function CardBody({
  card,
  chosen,
  reduceMotion,
  trans,
  onChoose,
}: {
  card: LearnCard;
  chosen: number | null;
  reduceMotion: boolean;
  trans: string;
  onChoose: (i: number) => void;
}) {
  if (card.type === "quiz") {
    return (
      <QuizView
        card={card}
        chosen={chosen}
        reduceMotion={reduceMotion}
        onChoose={onChoose}
        trans={trans}
      />
    );
  }
  return <NonQuizContent card={card} />;
}

// The always-shown payoff content for non-quiz cards (the "why" / definition
// rendered inline as quote blocks). Shared by the live card and the history feed.
function NonQuizContent({
  card,
}: {
  card: Exclude<LearnCard, { type: "quiz" }>;
}) {
  if (card.type === "trivia") {
    return (
      <div>
        <p className="text-lg leading-relaxed text-fg">{card.fact}</p>
        <Quote>{card.why}</Quote>
      </div>
    );
  }
  if (card.type === "news") {
    return (
      <div>
        <h2 className="text-lg font-semibold leading-snug text-fg">
          {card.headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg">{card.summary}</p>
        <Quote>{card.why}</Quote>
        {card.source && (
          <a
            href={card.source.url}
            className="mt-2 inline-block text-xs text-accent hover:underline"
          >
            {card.source.name} →
          </a>
        )}
      </div>
    );
  }
  if (card.type === "flashcard") {
    return (
      <div>
        <p className="text-lg font-semibold text-fg">{card.term}</p>
        <Quote tone="fg">{card.definition}</Quote>
      </div>
    );
  }
  // thisday
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-accent">
        On this day · {card.year}
      </p>
      <p className="mt-1 text-lg leading-relaxed text-fg">{card.event}</p>
      <Quote>{card.why}</Quote>
    </div>
  );
}

// A left-bordered quote block — the inline payoff shown on every non-quiz card.
function Quote({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "fg";
}) {
  return (
    <p
      className={`mt-4 border-l-2 border-accent pl-3 text-sm leading-relaxed ${
        tone === "fg" ? "text-fg" : "text-muted"
      }`}
    >
      {children}
    </p>
  );
}

function QuizView({
  card,
  chosen,
  onChoose,
  trans,
  reduceMotion,
}: {
  card: Extract<LearnCard, { type: "quiz" }>;
  chosen: number | null;
  onChoose: (i: number) => void;
  trans: string;
  reduceMotion: boolean;
}) {
  const answered = chosen !== null;
  const gotIt = answered && chosen === card.correctIndex;
  return (
    <div>
      <p className="text-lg font-medium leading-snug text-fg">{card.question}</p>
      <div className="relative mt-4 space-y-2">
        {gotIt && !reduceMotion && <Burst />}
        {card.options.map((opt, i) => {
          const isCorrect = i === card.correctIndex;
          const isChosen = i === chosen;
          let cls = "border-border bg-bg text-fg";
          let anim = "";
          if (answered && isCorrect) {
            cls = "border-accent bg-surface-2 text-fg";
            if (!reduceMotion) anim = "learn-pop";
          } else if (answered && isChosen) {
            cls = "border-border bg-surface-2 text-muted line-through";
            if (!reduceMotion) anim = "learn-shake";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChoose(i)}
              disabled={answered}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${trans} ${cls} ${anim} ${
                answered ? "" : "hover:bg-surface-2 active:scale-[0.99]"
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
        <p
          className={`mt-4 border-l-2 border-accent pl-3 text-sm text-muted ${
            reduceMotion ? "" : "learn-reveal"
          }`}
        >
          {card.explanation}
        </p>
      )}
    </div>
  );
}

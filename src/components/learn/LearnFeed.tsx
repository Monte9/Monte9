"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  X,
  ArrowRight,
  Brain,
  Layers,
  BarChart3,
  Play,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getSession, TOPICS, CARD_TYPES } from "@/lib/learn-client";
import type { LearnCard, LearnSession } from "@/lib/learn-types";
import Sheet from "@/components/Sheet";

const SEEN_KEY = "learn-seen";
const TOPICS_KEY = "learn-topics";
const SETS_KEY = "learn-sets";
const HISTORY_KEY = "learn-history";
const CURRENT_KEY = "learn-current";
const CARD_TYPES_KEY = "learn-card-types";
const SESSION_N = 5;
const HISTORY_CAP = 80;
const ALL_TYPE_KEYS = CARD_TYPES.map((t) => t.key as string);

// Progress levels keyed off total sets completed. Each set ≈ 5 cards / ~2 min.
const LEVELS = [
  { name: "Novice", min: 0 },
  { name: "Apprentice", min: 5 },
  { name: "Scholar", min: 15 },
  { name: "Savant", min: 30 },
  { name: "Brainiac", min: 60 },
  { name: "Brain Master", min: 120 },
];
function levelFor(sets: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (sets >= LEVELS[k].min) i = k;
  const current = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next
    ? Math.min(1, (sets - current.min) / (next.min - current.min))
    : 1;
  const remaining = next ? Math.max(0, next.min - sets) : 0;
  return { current, next, progress, remaining };
}

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
// Format a card's seenAt (ISO/UTC) in the viewer's local time, e.g. "Jun 30, 11:05 AM".
function fmtSeen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
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
  const [sets, setSets] = useState(0); // total sets completed (persisted)
  const [topics, setTopics] = useState<string[]>(TOPICS);
  const topicsRef = useRef<string[]>(TOPICS);
  const [cardTypes, setCardTypes] = useState<string[]>(ALL_TYPE_KEYS);
  const cardTypesRef = useRef<string[]>(ALL_TYPE_KEYS);
  const [setupOpen, setSetupOpen] = useState(false);
  const mockRef = useRef(false);
  const [degraded, setDegraded] = useState(false);
  const [degradedNote, setDegradedNote] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false); // analytics password UI
  const [statsPass, setStatsPass] = useState("");
  const cardTopRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef(false); // skip the auto-scroll on first render/restore

  // sets + history + prefs for display
  useEffect(() => {
    const savedSets = readJSON<number>(SETS_KEY, 0);
    setSets(typeof savedSets === "number" ? savedSets : 0);
    setHistory(readJSON<LearnCard[]>(HISTORY_KEY, []));
    const savedTopics = readJSON<string[]>(TOPICS_KEY, TOPICS);
    if (Array.isArray(savedTopics) && savedTopics.length) {
      setTopics(savedTopics);
      topicsRef.current = savedTopics;
    }
    const savedTypes = readJSON<string[]>(CARD_TYPES_KEY, ALL_TYPE_KEYS);
    if (Array.isArray(savedTypes) && savedTypes.length) {
      const valid = savedTypes.filter((t) => ALL_TYPE_KEYS.includes(t));
      const next = valid.length ? valid : ALL_TYPE_KEYS;
      setCardTypes(next);
      cardTypesRef.current = next;
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

  const toggleType = useCallback((t: string) => {
    setCardTypes((cur) => {
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      cardTypesRef.current = next;
      writeJSON(CARD_TYPES_KEY, next);
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
      types:
        cardTypesRef.current.length &&
        cardTypesRef.current.length < ALL_TYPE_KEYS.length
          ? cardTypesRef.current
          : undefined,
    });
    // stamp each card with when it was dealt (for "when" + history sort)
    const stamped = session.cards.map((c) => ({
      ...c,
      seenAt: c.seenAt ?? session.generatedAt,
    }));
    // remember these cards so the next set avoids them (ring buffer ~60)
    const nextSeen = [...stamped.map((c) => c.id), ...seen].slice(0, 60);
    writeJSON(SEEN_KEY, nextSeen);
    // grow the full-card history (newest first, deduped, capped)
    const prevHist = readJSON<LearnCard[]>(HISTORY_KEY, []);
    const mergedHist = dedupeById([...stamped, ...prevHist]).slice(
      0,
      HISTORY_CAP
    );
    writeJSON(HISTORY_KEY, mergedHist);
    setHistory(mergedHist);
    setDegraded(!!session.degraded);
    setDegradedNote(session.note ?? null);
    setCards(stamped);
    setQuizCount(stamped.filter((c) => c.type === "quiz").length);
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

  // On advance (idx change), bring the new card up into view — but never on the
  // first render / restore.
  useEffect(() => {
    if (!advancedRef.current) {
      advancedRef.current = true;
      return;
    }
    if (view === "current" && phase === "card") {
      cardTopRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const startNewSet = useCallback(() => {
    setSetupOpen(false);
    load();
  }, [load]);

  // dynamic tab title = the external "new set ready" trigger
  useEffect(() => {
    const base = "Learn · Monte Thakkar";
    document.title = phase === "complete" ? "New set ready · Learn" : base;
    return () => {
      document.title = base;
    };
  }, [phase]);

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
      bumpSets();
      setPhase("complete");
    }
  }, [idx, cards.length, bumpSets]);

  const card = cards[idx];
  const trans = reduceMotion ? "" : "transition-colors";
  const lvl = levelFor(sets);
  // Only quiz cards gate the Next button — everything else is read-and-go.
  const engaged = card?.type === "quiz" ? chosen !== null : true;

  // History = everything seen. While a set is in progress we hide its own cards
  // (they're the "current" set); once it's complete, fold them in so the count
  // and the History feed update the moment you finish on the success screen.
  const currentIds = new Set(cards.map((c) => c.id));
  const pastCards =
    phase === "complete"
      ? history
      : history.filter((c) => !currentIds.has(c.id));

  return (
    <div>
      {/* ---- header: title + description + meta + view toggle (matches /posts, /apps) ---- */}
      <div>
        <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Learn</h1>
        <p className="text-muted">
          A 2-minute hit of quizzes, trivia, and fresh news on the things
          I&apos;m into.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Brain className="h-3.5 w-3.5 text-accent" aria-hidden />
            {lvl.current.name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {sets} {sets === 1 ? "set" : "sets"} done
          </span>
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
              onClick={() => setSetupOpen(true)}
              aria-label="Start a new set"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur transition-colors hover:text-fg"
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">New set</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---- content ---- */}
      {view === "history" ? (
        <HistoryFeed cards={pastCards} />
      ) : phase === "loading" ? (
        <div className="mt-16 text-center text-sm text-muted">
          Dealing your cards…
        </div>
      ) : phase === "complete" ? (
        <Complete
          reduceMotion={reduceMotion}
          sets={sets}
          onNewSet={() => setSetupOpen(true)}
        />
      ) : (
        card && (
          <div ref={cardTopRef} className="mt-6 scroll-mt-20">
            {/* segmented progress bar (replaces the carousel dots) */}
            <div className="flex gap-1.5" aria-hidden>
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    reduceMotion ? "" : "transition-colors"
                  } ${i <= idx ? "bg-accent" : "bg-border"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {idx + 1} of {cards.length}
            </p>

            {/* card sizes to its content — every option visible, nothing clipped */}
            <div
              key={card.id}
              className={`mt-3 rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.35)] ${
                reduceMotion ? "" : "learn-card-in"
              }`}
            >
              <CardChrome
                type={card.type}
                topic={card.topic}
                seenAt={card.seenAt}
              />
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

            {/* full-width primary advance button */}
            <button
              type="button"
              onClick={next}
              disabled={!engaged}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${
                engaged
                  ? "bg-accent text-accent-contrast hover:opacity-90"
                  : "cursor-not-allowed border border-border text-muted"
              }`}
            >
              {idx === cards.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      )}

      <SetupModal
        open={setupOpen}
        types={cardTypes}
        topics={topics}
        onToggleType={toggleType}
        onToggleTopic={toggleTopic}
        onClose={() => setSetupOpen(false)}
        onStart={startNewSet}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// New-set setup sheet — choose card types + topics, then start a fresh set.
// ---------------------------------------------------------------------------
function SetupModal({
  open,
  types,
  topics,
  onToggleType,
  onToggleTopic,
  onClose,
  onStart,
}: {
  open: boolean;
  types: string[];
  topics: string[];
  onToggleType: (t: string) => void;
  onToggleTopic: (t: string) => void;
  onClose: () => void;
  onStart: () => void;
}) {
  if (!open) return null;
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors ${
      on
        ? "border-accent bg-accent/10 text-accent"
        : "border-border text-muted hover:text-fg"
    }`;
  return (
    <Sheet onClose={onClose} ariaLabel="New set" className="sm:w-[26rem]">
      <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">New set</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Card types
        </p>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {CARD_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={types.includes(t.key)}
              onClick={() => onToggleType(t.key)}
              className={chip(types.includes(t.key))}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Topics</p>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topics.includes(t)}
              onClick={() => onToggleTopic(t)}
              className={chip(topics.includes(t))}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={types.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="h-4 w-4" aria-hidden />
          {types.length === 0 ? "Pick at least one type" : "Start set"}
        </button>
    </Sheet>
  );
}

// The type/topic chip row at the top of a card, with the time it was dealt.
function CardChrome({
  type,
  topic,
  seenAt,
}: {
  type: string;
  topic: string;
  seenAt?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
      <span className="rounded-full bg-surface-2 px-2 py-0.5 capitalize">
        {type}
      </span>
      <span className="truncate">{topic}</span>
      {seenAt && (
        <span className="ml-auto shrink-0 normal-case tracking-normal opacity-70">
          {fmtSeen(seenAt)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// History feed — a scrollable, read-only list of previously-seen cards.
// ---------------------------------------------------------------------------
function HistoryFeed({ cards }: { cards: LearnCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="mt-16 px-8 text-center text-sm text-muted">
        No history yet — finish a set and the cards you&apos;ve seen show up
        here.
      </div>
    );
  }
  // Newest first (most-recently-dealt at the top).
  const sorted = [...cards].sort((a, b) =>
    (b.seenAt ?? "").localeCompare(a.seenAt ?? "")
  );
  return (
    <div className="mt-6 space-y-3">
      {sorted.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-border bg-surface p-4"
        >
          <CardChrome type={c.type} topic={c.topic} seenAt={c.seenAt} />
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
  sets,
  onNewSet,
}: {
  reduceMotion: boolean;
  sets: number;
  onNewSet: () => void;
}) {
  const { current, next, progress, remaining } = levelFor(sets);
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div
        className={`relative mb-2 flex items-center gap-2 text-2xl font-semibold text-fg ${
          reduceMotion ? "" : "learn-countup"
        }`}
      >
        {!reduceMotion && <Burst />}
        <Brain className="h-6 w-6 text-accent" aria-hidden /> {current.name}
      </div>
      <p className="mb-8 text-sm text-muted">
        {sets} {sets === 1 ? "set" : "sets"} done
      </p>

      {/* level progress: current on the left, next on the right */}
      <div className="mb-8 w-full max-w-xs">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-accent">{current.name}</span>
          <span className="text-muted">{next ? next.name : "Max level"}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full bg-accent ${
              reduceMotion ? "" : "transition-all duration-500"
            }`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {next
            ? `${remaining} more ${remaining === 1 ? "set" : "sets"} to ${
                next.name
              }`
            : "Top level reached 🎉"}
        </p>
      </div>

      <button
        type="button"
        onClick={onNewSet}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-accent-contrast hover:opacity-90"
      >
        <Play className="h-4 w-4" aria-hidden /> New set
      </button>
      <p className="mt-3 text-xs text-muted">
        Pick card types &amp; topics for the next one
      </p>
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

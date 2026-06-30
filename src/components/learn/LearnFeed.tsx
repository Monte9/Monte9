"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCw,
  Check,
  X,
  ArrowRight,
  Flame,
  Layers,
  Hand,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getSession, TOPICS } from "@/lib/learn-client";
import type { LearnCard, LearnSession } from "@/lib/learn-types";

const SEEN_KEY = "learn-seen";
const STREAK_KEY = "learn-streak";
const TOPICS_KEY = "learn-topics";
const SETS_KEY = "learn-sets";
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
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// ---------------------------------------------------------------------------
// Drag spring — same critically-ish damped spring the Boarding Pass app uses for
// its tear/fling, so the Learn swipe has the identical paper-fling feel.
// ---------------------------------------------------------------------------
type Spring = { value: number; target: number; velocity: number };
function stepSpring(s: Spring, dt: number, stiffness: number, damping: number) {
  const t = Math.min(dt, 0.032); // clamp so a backgrounded tab can't explode it
  const force = (s.target - s.value) * stiffness;
  s.velocity += (force - s.velocity * damping) * t;
  s.value += s.velocity * t;
  return s;
}

const SWIPE_THRESHOLD = 130; // px of drag (or a hard fling) that sends the card off
const FLING_OFF = 900; // where a flung card lands before recycling

type Phase = "loading" | "card" | "complete";

export default function LearnFeed() {
  const { reduceMotion } = useTheme();
  const [phase, setPhase] = useState<Phase>("loading");
  const [cards, setCards] = useState<LearnCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null); // quiz selection
  const [revealed, setRevealed] = useState(false); // trivia/news "why" shown
  const [correct, setCorrect] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sets, setSets] = useState(0); // total sets completed (persisted)
  const [topics, setTopics] = useState<string[]>(TOPICS);
  const topicsRef = useRef<string[]>(TOPICS);
  const mockRef = useRef(false);
  const [degraded, setDegraded] = useState(false);

  // ----- drag-swipe state (mutated off the React path; flushed via `force`) -----
  const springX = useRef<Spring>({ value: 0, target: 0, velocity: 0 });
  const lift = useRef<Spring>({ value: 0, target: 0, velocity: 0 });
  const [, force] = useState(0);
  const down = useRef(false); // pointer is held
  const dragging = useRef(false); // crossed the move threshold → actively swiping
  const moved = useRef(false); // this gesture became a drag (used to swallow click)
  const flinging = useRef(false); // card is flying off to recycle
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const pointerVel = useRef(0);
  const rafRef = useRef<number | null>(null);
  const prevT = useRef(0);
  const loopRef = useRef<(t: number) => void>(() => {});

  // streak + sets for display (streak breaks if last completion > 1 day ago)
  useEffect(() => {
    const { streak: s = 0, lastDate = "" } = readJSON<{
      streak: number;
      lastDate: string;
    }>(STREAK_KEY, { streak: 0, lastDate: "" });
    setStreak(lastDate && daysBetween(lastDate, today()) <= 1 ? s : 0);
    const savedSets = readJSON<number>(SETS_KEY, 0);
    setSets(typeof savedSets === "number" ? savedSets : 0);
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
    springX.current = { value: 0, target: 0, velocity: 0 };
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
      setRevealed(false);
    } else {
      bumpStreak();
      bumpSets();
      setPhase("complete");
    }
  }, [idx, cards.length, bumpStreak, bumpSets]);

  // ----- rAF spring loop (stored in a ref so it always sees the latest `next`) -----
  const advanceAfterFling = useCallback(() => {
    springX.current = { value: 0, target: 0, velocity: 0 };
    next();
  }, [next]);

  useEffect(() => {
    const settled = () =>
      Math.abs(springX.current.value - springX.current.target) < 0.3 &&
      Math.abs(springX.current.velocity) < 0.3 &&
      Math.abs(lift.current.value - lift.current.target) < 0.003;

    loopRef.current = (t: number) => {
      const dt = prevT.current ? (t - prevT.current) / 1000 : 0.016;
      prevT.current = t;
      stepSpring(springX.current, dt, 170, 22);
      stepSpring(lift.current, dt, 200, 26);

      // The card has flown far enough — recycle to the next card.
      if (flinging.current && Math.abs(springX.current.value) > 600) {
        flinging.current = false;
        advanceAfterFling();
      }

      force((n) => (n + 1) & 0xffff);

      if (dragging.current || flinging.current || !settled()) {
        rafRef.current = requestAnimationFrame(loopRef.current);
      } else {
        rafRef.current = null;
        prevT.current = 0;
      }
    };
  }, [advanceAfterFling]);

  const kick = useCallback(() => {
    if (reduceMotion) {
      force((n) => (n + 1) & 0xffff); // single flush; no free-running rAF
      return;
    }
    if (rafRef.current === null) {
      prevT.current = 0;
      rafRef.current = requestAnimationFrame(loopRef.current);
    }
  }, [reduceMotion]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      prevT.current = 0;
    };
  }, []);

  // ----- pointer handlers (drag the top card; taps still reach the buttons) -----
  // We don't capture on pointerdown — only once a horizontal move passes the
  // threshold. That keeps quiz taps / reveal taps working: a tap never moves, so
  // it falls straight through to the child button.
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "card") return;
    down.current = true;
    dragging.current = false;
    moved.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastT.current = performance.now();
    pointerVel.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!down.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!dragging.current) {
      // Only claim the gesture if it's clearly horizontal — vertical stays free
      // for scrolling long cards / the page.
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        dragging.current = true;
        moved.current = true;
        lift.current.target = 1;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        kick();
      } else {
        return;
      }
    }
    const now = performance.now();
    const dt = Math.max(1, now - lastT.current);
    pointerVel.current = (e.clientX - lastX.current) / dt; // px/ms
    lastX.current = e.clientX;
    lastT.current = now;
    springX.current.value = dx;
    springX.current.target = dx;
    springX.current.velocity = 0;
    if (reduceMotion) force((n) => (n + 1) & 0xffff);
  };

  const endDrag = () => {
    down.current = false;
    if (!dragging.current) return;
    dragging.current = false;
    lift.current.target = 0;
    lift.current.value = 0;
    const v = pointerVel.current * 1000; // px/s
    const dx = springX.current.value;
    const willFling = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(v) > 900;

    if (reduceMotion) {
      springX.current = { value: 0, target: 0, velocity: 0 };
      if (willFling) next();
      else force((n) => (n + 1) & 0xffff);
      return;
    }
    if (willFling) {
      const dir = dx === 0 ? Math.sign(v) || 1 : Math.sign(dx);
      flinging.current = true;
      springX.current.target = dir * FLING_OFF;
      springX.current.velocity = v;
    } else {
      springX.current.target = 0; // snap back to center
      springX.current.velocity = v;
    }
    kick();
  };

  // After a real drag, swallow the click it would otherwise synthesize so a
  // swipe never accidentally answers a quiz.
  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  // The visible deck: current card on top, the next two peeking behind it.
  const deck = useMemo(() => {
    const out: { card: LearnCard; depth: number }[] = [];
    for (let d = 0; d < 3; d++) {
      const c = cards[idx + d];
      if (c) out.push({ card: c, depth: d });
    }
    return out.reverse(); // back-to-front so the top card paints last
  }, [cards, idx]);

  const card = cards[idx];
  const trans = reduceMotion ? "" : "transition-colors";

  const engaged =
    card?.type === "quiz"
      ? chosen !== null
      : card?.type === "bigq"
        ? true
        : revealed;

  // Derived top-card transform values from the spring.
  const x = springX.current.value;
  const liftV = clamp(lift.current.value, 0, 1);
  const rot = clamp(x * 0.045, -14, 14);
  const swipeProg = clamp(Math.abs(x) / SWIPE_THRESHOLD, 0, 1);

  return (
    <div className="relative -mx-5 -mt-10 -mb-28 flex h-[calc(100svh-8.5rem)] flex-col overflow-hidden sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 22%, var(--surface) 0%, var(--bg) 70%)",
        }}
      />

      {/* ---- header: title, description, live meta (streak · sets · progress) ---- */}
      <div className="relative z-20 shrink-0 px-5 pt-4 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="hidden text-xl font-semibold text-fg sm:block">
              Learn
            </h1>
            <p className="max-w-md text-xs leading-relaxed text-muted sm:mt-0.5 sm:text-sm">
              A 2-minute hit of quizzes, trivia, and fresh news on the things
              I&apos;m into. Swipe through a set — grab a new one anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            aria-label="Deal a new set"
            className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur transition-colors hover:text-fg"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">New set</span>
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-accent" aria-hidden />
            {streak}-day streak
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {sets} {sets === 1 ? "set" : "sets"} done
          </span>
          {phase === "card" && cards.length > 0 && (
            <span>
              {idx + 1} / {cards.length}
            </span>
          )}
          {degraded && <span className="opacity-80">· offline sample</span>}
        </div>
      </div>

      {/* ---- stage ---- */}
      <div
        className="relative z-10 min-h-0 flex-1"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        role="group"
        aria-label="Learn cards — swipe or use Next"
      >
        {phase === "loading" && (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Dealing your cards…
          </div>
        )}

        {phase === "complete" && (
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
        )}

        {phase === "card" &&
          deck.map(({ card: c, depth }) => {
            const isTop = depth === 0;
            const dragX = isTop ? x : 0;
            const r = isTop ? rot : 0;
            const ty = isTop ? -liftV * 6 : 0;
            const scale = isTop ? 1 + liftV * 0.01 : 1 - depth * 0.045;
            const op = isTop
              ? 1 - Math.min(0.5, Math.abs(dragX) / 720)
              : depth === 1
                ? 0.65
                : 0.32;
            return (
              <div
                key={c.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: "min(92vw, 30rem)",
                  height: "min(100%, 30rem)",
                  zIndex: 100 - depth,
                  transform: `translate(-50%, -50%) translate(${dragX.toFixed(
                    1
                  )}px, ${ty.toFixed(1)}px) rotate(${r.toFixed(
                    2
                  )}deg) scale(${scale.toFixed(3)})`,
                  transition: isTop
                    ? "none"
                    : "transform 380ms cubic-bezier(.22,1,.36,1), opacity 300ms",
                  opacity: op,
                  pointerEvents: isTop ? "auto" : "none",
                  willChange: "transform",
                  cursor: isTop && !reduceMotion ? "grab" : undefined,
                }}
              >
                <div
                  className={`flex h-full select-none flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.4)] ${
                    isTop && !reduceMotion ? "learn-card-in" : ""
                  }`}
                >
                  <div className="mb-3 flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 capitalize">
                      {c.type}
                    </span>
                    <span className="truncate">{c.topic}</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                    <CardBody
                      card={c}
                      active={isTop}
                      chosen={isTop ? chosen : null}
                      revealed={isTop ? revealed : false}
                      reduceMotion={reduceMotion}
                      trans={trans}
                      onChoose={(i) => {
                        if (!isTop || chosen !== null) return;
                        setChosen(i);
                        if (
                          c.type === "quiz" &&
                          i === c.correctIndex
                        )
                          setCorrect((n) => n + 1);
                      }}
                      onReveal={() => isTop && setRevealed(true)}
                    />
                  </div>
                </div>

                {/* Tinder-style intent stamps, stuck to the top card */}
                {isTop && !reduceMotion && swipeProg > 0.05 && (
                  <>
                    <Stamp side="right" show={dragX > 0} progress={swipeProg} />
                    <Stamp side="left" show={dragX < 0} progress={swipeProg} />
                  </>
                )}
              </div>
            );
          })}
      </div>

      {/* ---- footer: progress dots + swipe hint + Next/Finish ---- */}
      {phase === "card" && card && (
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
          <div className="flex items-center justify-center gap-3">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Hand className="h-3.5 w-3.5" aria-hidden />
              {reduceMotion ? "Tap Next" : "Swipe the card"}
            </p>
            <button
              type="button"
              onClick={next}
              disabled={!engaged}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg/60 px-4 py-2 text-sm font-medium text-fg backdrop-blur transition-colors hover:bg-surface-2 disabled:opacity-40"
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

// ---------------------------------------------------------------------------
// Tinder LIKE/NOPE-style stamp that rides along with the dragged card.
// ---------------------------------------------------------------------------
function Stamp({
  side,
  show,
  progress,
}: {
  side: "left" | "right";
  show: boolean;
  progress: number;
}) {
  const right = side === "right";
  // Stamp sits on the trailing edge (opposite the swipe direction, Tinder-style)
  // so it stays on-screen as the card flies away.
  return (
    <div
      className={`pointer-events-none absolute top-6 rounded-lg border-2 px-3 py-1 text-sm font-bold uppercase tracking-widest ${
        right
          ? "left-5 border-accent text-accent"
          : "right-5 border-border text-muted"
      }`}
      style={{
        opacity: show ? progress : 0,
        transform: `rotate(${right ? -12 : 12}deg)`,
      }}
      aria-hidden
    >
      {right ? "Got it" : "Skip"}
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
// Card body — the type-specific content. `active` is false for the cards
// peeking behind the top one (rendered static, non-interactive).
// ---------------------------------------------------------------------------
function CardBody({
  card,
  active,
  chosen,
  revealed,
  reduceMotion,
  trans,
  onChoose,
  onReveal,
}: {
  card: LearnCard;
  active: boolean;
  chosen: number | null;
  revealed: boolean;
  reduceMotion: boolean;
  trans: string;
  onChoose: (i: number) => void;
  onReveal: () => void;
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

  if (card.type === "trivia") {
    return (
      <div>
        <p className="text-lg leading-relaxed text-fg">{card.fact}</p>
        {revealed ? (
          <p
            className={`mt-4 border-l-2 border-accent pl-3 text-sm text-muted ${
              reduceMotion ? "" : "learn-reveal"
            }`}
          >
            {card.why}
          </p>
        ) : (
          <button
            type="button"
            onClick={onReveal}
            disabled={!active}
            className="mt-4 text-sm font-medium text-accent hover:opacity-80"
          >
            Why it matters →
          </button>
        )}
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
        {revealed ? (
          <div
            className={`mt-4 border-l-2 border-accent pl-3 ${
              reduceMotion ? "" : "learn-reveal"
            }`}
          >
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
            onClick={onReveal}
            disabled={!active}
            className="mt-4 text-sm font-medium text-accent hover:opacity-80"
          >
            So what? →
          </button>
        )}
      </div>
    );
  }

  if (card.type === "flashcard") {
    return (
      <FlashcardFlip card={card} reduceMotion={reduceMotion} onFlip={onReveal} />
    );
  }

  if (card.type === "thisday") {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-accent">
          On this day · {card.year}
        </p>
        <p className="mt-1 text-lg leading-relaxed text-fg">{card.event}</p>
        {revealed ? (
          <p
            className={`mt-3 border-l-2 border-accent pl-3 text-sm text-muted ${
              reduceMotion ? "" : "learn-reveal"
            }`}
          >
            {card.why}
          </p>
        ) : (
          <button
            type="button"
            onClick={onReveal}
            disabled={!active}
            className="mt-4 text-sm font-medium text-accent hover:opacity-80"
          >
            Why it matters →
          </button>
        )}
      </div>
    );
  }

  // bigq
  return (
    <div>
      <p className="text-lg leading-relaxed text-fg">{card.prompt}</p>
      <p className="mt-3 text-sm text-muted">
        Take a beat — there&apos;s no wrong answer.
      </p>
    </div>
  );
}

// A real 3D flip (CSS 3D, no WebGL) — term on the front, definition on the back.
function FlashcardFlip({
  card,
  reduceMotion,
  onFlip,
}: {
  card: Extract<LearnCard, { type: "flashcard" }>;
  reduceMotion: boolean;
  onFlip: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setFlipped((f) => !f);
        onFlip();
      }}
      className="block w-full text-left [perspective:1000px]"
      aria-label="Flip flashcard"
    >
      <div
        className={`relative grid min-h-[6rem] [transform-style:preserve-3d] ${
          reduceMotion ? "" : "transition-transform duration-500"
        } ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
      >
        <div className="[grid-area:1/1] [backface-visibility:hidden]">
          <p className="text-lg font-semibold text-fg">{card.term}</p>
          <p className="mt-3 text-xs text-muted">Tap to flip ↻</p>
        </div>
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-sm leading-relaxed text-fg">{card.definition}</p>
          <p className="mt-3 text-xs text-muted">Tap to flip back ↻</p>
        </div>
      </div>
    </button>
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

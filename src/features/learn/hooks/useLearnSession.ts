"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  getSession,
  ALL_TYPE_KEYS,
} from "@/features/learn/client/learn-client";
import type { LearnCard, LearnSession } from "@/features/learn/types";
import { levelFor } from "@/features/learn/levels";
import {
  SEEN_KEY,
  SETS_KEY,
  HISTORY_KEY,
  CURRENT_KEY,
  SESSION_N,
  HISTORY_CAP,
  readJSON,
  writeJSON,
  dedupeById,
} from "@/features/learn/client/storage";

type Phase = "loading" | "card" | "complete";
type View = "current" | "history";

// All the in-flight session state + actions for the Learn feed: the current
// deck, progress, persisted sets/history, and the load / advance / finish
// lifecycle. Takes the prefs refs so a fetch reads the latest topics/types
// synchronously without re-running when they change.
export function useLearnSession({
  topicsRef,
  cardTypesRef,
  reduceMotion,
}: {
  topicsRef: RefObject<string[]>;
  cardTypesRef: RefObject<string[]>;
  reduceMotion: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<View>("current");
  const [cards, setCards] = useState<LearnCard[]>([]);
  const [history, setHistory] = useState<LearnCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null); // quiz selection
  const [correct, setCorrect] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [sets, setSets] = useState(0); // total sets completed (persisted)
  const mockRef = useRef(false);
  const [degraded, setDegraded] = useState(false);
  const [degradedNote, setDegradedNote] = useState<string | null>(null);
  const cardTopRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef(false); // skip the auto-scroll on first render/restore

  // sets + history + mock flag (declared first so mockRef is set before the
  // restore effect below can call load()).
  useEffect(() => {
    const savedSets = readJSON<number>(SETS_KEY, 0);
    setSets(typeof savedSets === "number" ? savedSets : 0);
    setHistory(readJSON<LearnCard[]>(HISTORY_KEY, []));
    mockRef.current =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("mock") === "1";
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
    // remember these cards so the next set avoids them (ring buffer ~60).
    // History is grown on completion (finishSet), not on deal — so the count
    // is stable while a set is in progress and only the current set is "live".
    const nextSeen = [...stamped.map((c) => c.id), ...seen].slice(0, 60);
    writeJSON(SEEN_KEY, nextSeen);
    setDegraded(!!session.degraded);
    setDegradedNote(session.note ?? null);
    setCards(stamped);
    setQuizCount(stamped.filter((c) => c.type === "quiz").length);
    setIdx(0);
    setChosen(null);
    setCorrect(0);
    setPhase("card");
  }, [topicsRef, cardTypesRef]);

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

  // Finishing a set: count it once and fold its cards into history (newest
  // first, deduped, capped). History only grows here — never on deal.
  const finishSet = useCallback(() => {
    setSets((cur) => {
      const n = cur + 1;
      writeJSON(SETS_KEY, n);
      return n;
    });
    setHistory((prev) => {
      const merged = dedupeById([...cards, ...prev]).slice(0, HISTORY_CAP);
      writeJSON(HISTORY_KEY, merged);
      return merged;
    });
  }, [cards]);

  const next = useCallback(() => {
    if (idx < cards.length - 1) {
      setIdx((i) => i + 1);
      setChosen(null);
    } else {
      finishSet();
      setPhase("complete");
    }
  }, [idx, cards.length, finishSet]);

  const card = cards[idx];
  const lvl = levelFor(sets);
  // Only quiz cards gate the Next button — everything else is read-and-go.
  const engaged = card?.type === "quiz" ? chosen !== null : true;

  // History holds only completed sets' cards (added in finishSet), so the count
  // is stable while a set is in progress and grows by one set on completion.
  const pastCards = history;

  const choose = useCallback(
    (i: number) => {
      if (chosen !== null) return;
      setChosen(i);
      if (card?.type === "quiz" && i === card.correctIndex)
        setCorrect((n) => n + 1);
    },
    [chosen, card]
  );

  return {
    phase,
    view,
    setView,
    cards,
    idx,
    chosen,
    sets,
    degraded,
    degradedNote,
    card,
    lvl,
    engaged,
    pastCards,
    cardTopRef,
    next,
    choose,
    startNewSet,
  };
}

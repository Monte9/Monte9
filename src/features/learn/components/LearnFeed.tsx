"use client";

import { useState } from "react";
import { Brain, Layers, BarChart3, Play } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useLearnPrefs } from "@/features/learn/hooks/useLearnPrefs";
import { useLearnSession } from "@/features/learn/hooks/useLearnSession";
import CardStage from "@/features/learn/components/CardStage";
import CompleteScreen from "@/features/learn/components/CompleteScreen";
import HistoryFeed from "@/features/learn/components/HistoryFeed";
import SetupSheet from "@/features/learn/components/SetupSheet";

export default function LearnFeed() {
  const { reduceMotion } = useTheme();
  const { topics, cardTypes, topicsRef, cardTypesRef, toggleTopic, toggleType } =
    useLearnPrefs();
  const {
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
  } = useLearnSession({ topicsRef, cardTypesRef, reduceMotion });

  const [setupOpen, setSetupOpen] = useState(false);
  const [showStats, setShowStats] = useState(false); // analytics password UI
  const [statsPass, setStatsPass] = useState("");

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
        <CompleteScreen
          reduceMotion={reduceMotion}
          sets={sets}
          onNewSet={() => setSetupOpen(true)}
        />
      ) : (
        card && (
          <CardStage
            cards={cards}
            idx={idx}
            card={card}
            chosen={chosen}
            reduceMotion={reduceMotion}
            engaged={engaged}
            cardTopRef={cardTopRef}
            onChoose={choose}
            onNext={next}
          />
        )
      )}

      <SetupSheet
        open={setupOpen}
        types={cardTypes}
        topics={topics}
        onToggleType={toggleType}
        onToggleTopic={toggleTopic}
        onClose={() => setSetupOpen(false)}
        onStart={() => {
          setSetupOpen(false);
          startNewSet();
        }}
      />
    </div>
  );
}

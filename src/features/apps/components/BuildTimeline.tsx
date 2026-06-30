"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  CircleCheck,
  CircleX,
  ClipboardList,
  Hammer,
  Repeat,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import {
  BUILD_LOG,
  BUILD_STATS,
  LOOP_BRANCHES,
  LOOP_STAGES,
  type LoopStageId,
  type Milestone,
} from "@/features/apps/data/buildlog";

/* ------------------------------------------------------------------ *
 * Motion helper — respects the site's reduce-motion preference, which
 * the harness sets as data-reduce-motion="true" on <html>. We read it
 * once on mount and keep it live via a MutationObserver so toggling the
 * preference in /settings updates the page without a reload.
 * ------------------------------------------------------------------ */
function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => root.dataset.reduceMotion === "true";
    setReduce(read());

    const observer = new MutationObserver(() => setReduce(read()));
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-reduce-motion"],
    });
    return () => observer.disconnect();
  }, []);

  return reduce;
}

const STAGE_ICONS: Record<LoopStageId, typeof ClipboardList> = {
  planner: ClipboardList,
  generator: Hammer,
  evaluator: ScanSearch,
};

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */
function Header() {
  return (
    <header className="mb-10">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
        <Bot aria-hidden className="h-3.5 w-3.5 text-accent" />
        Built by agents
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        This site builds itself.
      </h1>
      <p className="mt-3 max-w-prose text-muted">
        Every feature on montethakkar.com is shipped by an autonomous agent
        harness. Each one runs the same loop —{" "}
        <span className="text-fg">planner → build → evaluator</span> — and only
        work that passes the evaluator gets to ship. Below is the real sprint
        record that produced the site you&apos;re looking at.
      </p>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * The harness loop — Planner → Generator → Evaluator, branching to
 * PASS (ship) or FAIL (loop back). Animated with an SVG pulse that
 * travels the path; the pulse is hidden under reduce-motion.
 * ------------------------------------------------------------------ */
function HarnessLoop({ reduce }: { reduce: boolean }) {
  return (
    <section
      aria-label="The agent harness loop"
      className="mb-14 rounded-2xl border border-border bg-surface p-5 sm:p-7"
    >
      <div className="mb-5 flex items-center gap-2">
        <Repeat aria-hidden className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          The loop
        </h2>
      </div>

      {/* The three stages as a flow. Wraps cleanly at 390px. */}
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
        {LOOP_STAGES.map((stage, i) => {
          const Icon = STAGE_ICONS[stage.id];
          return (
            <li
              key={stage.id}
              className="flex flex-1 items-stretch gap-3 sm:flex-col sm:gap-0"
            >
              <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-surface-2 p-4">
                {/* Traveling pulse along the top edge of each stage card */}
                {!reduce && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden"
                  >
                    <span
                      className="block h-px w-1/3 bg-accent"
                      style={{
                        animation: "bba-sweep 3.6s linear infinite",
                        animationDelay: `${i * 1.2}s`,
                      }}
                    />
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-accent">
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{stage.label}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{stage.caption}</p>
              </div>

              {/* Connector arrow between stages */}
              {i < LOOP_STAGES.length - 1 && (
                <div
                  aria-hidden
                  className="flex shrink-0 items-center justify-center px-1 text-muted sm:py-2"
                >
                  <ArrowRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* The evaluator gate: PASS ships, FAIL loops back */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-contrast">
            <CircleCheck aria-hidden className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-medium">
              {LOOP_BRANCHES.pass.label}
            </div>
            <div className="text-sm text-muted">
              {LOOP_BRANCHES.pass.caption}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-muted">
            <CircleX aria-hidden className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              {LOOP_BRANCHES.fail.label}
              <Repeat
                aria-hidden
                className={`h-3.5 w-3.5 text-muted ${
                  reduce ? "" : "animate-[bba-spin_4s_linear_infinite]"
                }`}
              />
            </div>
            <div className="text-sm text-muted">
              {LOOP_BRANCHES.fail.caption}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Summary strip — counts derived from the log.
 * ------------------------------------------------------------------ */
function StatStrip() {
  const stats: { label: string; value: number }[] = [
    { label: "Milestones", value: BUILD_STATS.total },
    { label: "Evaluator PASS", value: BUILD_STATS.passed },
    { label: "Shipped", value: BUILD_STATS.shipped },
  ];
  return (
    <dl className="mb-10 grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-surface p-4 text-center"
        >
          <dt className="text-xs text-muted">{s.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-accent">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ *
 * A single timeline card. Reveals itself on scroll via the shared
 * IntersectionObserver; under reduce-motion it just renders visible.
 * ------------------------------------------------------------------ */
function TimelineCard({
  milestone,
  reduce,
}: {
  milestone: Milestone;
  reduce: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduce) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    // Guard for older/SSR-mismatched environments.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduce]);

  const isPass = milestone.result === "PASS";
  const date = new Date(`${milestone.date}T00:00:00`).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <li
      ref={ref}
      className={`relative pl-10 transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Node on the rail */}
      <span
        aria-hidden
        className="absolute left-[7px] top-1.5 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-bg"
      >
        <span className="h-2 w-2 rounded-full bg-accent" />
      </span>

      <article className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-medium">{milestone.title}</h3>
          <Badge isPass={isPass} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>{date}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5">
            <Sparkles aria-hidden className="h-3 w-3 text-accent" />
            {milestone.phase}
          </span>
        </div>

        <p className="mt-3 text-sm text-muted">{milestone.note}</p>
      </article>
    </li>
  );
}

function Badge({ isPass }: { isPass: boolean }) {
  if (isPass) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-accent">
        <CircleCheck aria-hidden className="h-3.5 w-3.5" />
        PASS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
      <CircleCheck aria-hidden className="h-3.5 w-3.5" />
      shipped
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Page body
 * ------------------------------------------------------------------ */
export default function BuildTimeline() {
  const reduce = useReduceMotion();

  return (
    <div>
      {/* Component-scoped keyframes. Globals/Tailwind config are off-limits,
          so the animations live here; reduce-motion is enforced both by the
          `reduce` flag (we don't render the pulse) and by the global
          [data-reduce-motion] CSS rule that flattens animation-duration. */}
      <style>{`
        @keyframes bba-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes bba-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Header />
      <StatStrip />
      <HarnessLoop reduce={reduce} />

      <section aria-label="Build timeline">
        <div className="mb-5 flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Sprint history
          </h2>
        </div>

        {/* Vertical rail + scroll-revealed cards */}
        <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {BUILD_LOG.map((milestone) => (
            <TimelineCard
              key={milestone.id}
              milestone={milestone}
              reduce={reduce}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

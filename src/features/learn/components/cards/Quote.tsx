import type { ReactNode } from "react";

// A left-bordered quote block — the inline payoff shown on every non-quiz card.
export default function Quote({
  children,
  tone = "muted",
}: {
  children: ReactNode;
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

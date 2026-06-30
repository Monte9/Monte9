"use client";

import { useEffect } from "react";

// Lightweight client-side redirect used by the legacy /labs stubs to forward to
// the matching /apps route (keeps old shared links working).
export default function Redirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div className="py-24 text-center text-muted">
      Moved to{" "}
      <a href={to} className="text-accent underline underline-offset-2">
        {to}
      </a>
      …
    </div>
  );
}

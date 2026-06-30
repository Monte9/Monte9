"use client";

import { useEffect } from "react";

// Client-side redirect for the static export (no server redirects under
// `output: export`). Used by the legacy /labs stubs to forward to /apps.
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

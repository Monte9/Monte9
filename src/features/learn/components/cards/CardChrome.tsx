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

// The type/topic chip row at the top of a card, with the time it was dealt.
export default function CardChrome({
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

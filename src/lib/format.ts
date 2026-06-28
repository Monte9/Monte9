// Client-safe date formatting (no fs/node deps) so it can be imported from both
// server code and client components. Accepts an ISO date ("2026-06-28") or
// date-time ("2026-06-28T18:25") and shows the time when present, e.g.
// "Jun 28, 2026" or "Jun 28, 2026 · 6:25 PM" (shown as-is, no TZ conversion).
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const dateStr = `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
  if (!timePart) return dateStr;
  const [hStr, min = "00"] = timePart.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${dateStr} · ${h}:${min} ${ampm}`;
}

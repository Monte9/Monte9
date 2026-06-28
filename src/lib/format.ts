// Client-safe date formatting (no fs/node deps) so it can be imported from both
// server code and client components.
export function formatDate(date: string): string {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Route handler for the Learn stats dashboard. Implementation lives in the
// learn feature (server/stats.ts); this file is a thin route adapter.
export { GET } from "@/features/learn/server/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route handler for the Learn feed generator. The implementation lives in the
// learn feature (server/generate.ts) so the route file stays a thin adapter.
export { GET } from "@/features/learn/server/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

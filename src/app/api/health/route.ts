// Smoke route proving server route handlers run at runtime (the capability the
// Learn serverless function depends on). No secrets; safe to keep.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, service: "montethakkar.com", ts: Date.now() });
}

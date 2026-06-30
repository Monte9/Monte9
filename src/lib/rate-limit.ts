// Server-only. Best-effort rate limiting for the Learn generator endpoint.
//
// Two layers:
//   1. Per-IP burst limit  — stops a single client flooding the endpoint.
//   2. Global daily cap    — a circuit breaker bounding how many model
//      generations run per day (each ~1¢), so an abuser can't run up the bill.
//
// When Upstash Redis / Vercel KV REST creds are present the counters live in
// Redis so the limits hold across serverless instances. Without them we fall
// back to per-instance in-memory counters — weaker (each warm instance keeps
// its own tally) but non-zero, and the real hard backstop is the monthly spend
// limit set on the API workspace in the Anthropic Console. We talk to Redis via
// plain fetch (the Upstash REST API) so there's no extra dependency, and any
// Redis hiccup fails open to the in-memory path rather than breaking the feed.

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

// All three are env-overridable so limits can be tuned without a redeploy.
const PER_IP = Number(process.env.LEARN_RL_PER_IP) || 30; // requests per window
const WINDOW_S = Number(process.env.LEARN_RL_WINDOW_S) || 300; // window, seconds
const DAILY_CAP = Number(process.env.LEARN_DAILY_CAP) || 500; // generations/day

export const RATE_LIMIT_CONFIG = {
  perIp: PER_IP,
  windowSeconds: WINDOW_S,
  dailyCap: DAILY_CAP,
  distributed: !!(REDIS_URL && REDIS_TOKEN),
};

const todayUTC = () => new Date().toISOString().slice(0, 10);

// Pull the originating client IP from the proxy headers Vercel sets.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// ---- Upstash REST pipeline (returns null on any failure → caller falls back) ----
async function redisPipeline(
  cmds: (string | number)[][]
): Promise<Array<{ result?: unknown }> | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmds),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Array<{ result?: unknown }>;
  } catch {
    return null;
  }
}

async function redisIncr(key: string, ttl: number): Promise<number | null> {
  const out = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, ttl],
  ]);
  if (!out) return null;
  const n = Number(out[0]?.result);
  return Number.isFinite(n) ? n : null;
}

// ---- in-memory fallback (per-instance) ----
const ipHits = new Map<string, { n: number; resetAt: number }>();
let memDaily = { date: "", n: 0 };

function memIpIncr(ip: string): number {
  const now = Date.now();
  const e = ipHits.get(ip);
  if (!e || e.resetAt <= now) {
    ipHits.set(ip, { n: 1, resetAt: now + WINDOW_S * 1000 });
    return 1;
  }
  e.n += 1;
  // Opportunistic cleanup so the map can't grow unbounded.
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) if (v.resetAt <= now) ipHits.delete(k);
  }
  return e.n;
}

function memDailyIncr(): number {
  const d = todayUTC();
  if (memDaily.date !== d) memDaily = { date: d, n: 0 };
  memDaily.n += 1;
  return memDaily.n;
}

// Per-IP check: increment this IP's counter and report whether it's still
// within the window limit. Cheap — runs on every request.
export async function withinIpLimit(ip: string): Promise<boolean> {
  const key = `learn:rl:ip:${ip}`;
  const count = (await redisIncr(key, WINDOW_S)) ?? memIpIncr(ip);
  return count <= PER_IP;
}

// Daily spend cap: increment today's generation counter and report whether
// we're still under the cap. Call ONLY on the path that actually invokes the
// model, so mock/no-key responses don't burn the budget. The per-day key is
// kept for 35 days so the stats endpoint can show a month of history.
const DAILY_TTL = 35 * 86400;
export async function withinDailyCap(): Promise<boolean> {
  const key = `learn:rl:daily:${todayUTC()}`;
  const count = (await redisIncr(key, DAILY_TTL)) ?? memDailyIncr();
  return count <= DAILY_CAP;
}

// Read the per-day generation counts for the last `days` days (most recent
// first). Reads from KV when configured; otherwise only this instance's
// in-memory count for today is known.
export async function dailyCounts(
  days: number
): Promise<{ date: string; sets: number }[]> {
  const span = Math.max(1, Math.min(days, 90));
  const now = Date.now();
  const dates: string[] = [];
  for (let i = 0; i < span; i++) {
    dates.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  const out = await redisPipeline(
    dates.map((d) => ["GET", `learn:rl:daily:${d}`])
  );
  if (out) {
    return dates.map((d, i) => ({ date: d, sets: Number(out[i]?.result) || 0 }));
  }
  return dates.map((d) => ({
    date: d,
    sets: d === memDaily.date ? memDaily.n : 0,
  }));
}

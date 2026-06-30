import { dailyCounts, readEnv, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/learn/stats
//   → HTML mini-dashboard of generations ("sets") per day (default)
//   → JSON with ?format=json
// Optional gate: if LEARN_STATS_TOKEN is set, require ?token=<value>
// (or an x-stats-token header). The counter is the same one the daily spend
// cap checks, so it reflects live generation requests (≈ sets) per day.

export async function GET(req: Request) {
  const url = new URL(req.url);

  // readEnv uses a computed key so a "Sensitive" LEARN_STATS_TOKEN (runtime-only)
  // isn't inlined to empty at build time. Changing the value needs a redeploy.
  const required = readEnv("LEARN_STATS_TOKEN")?.trim();
  if (required) {
    const provided = (
      url.searchParams.get("token") ||
      req.headers.get("x-stats-token") ||
      ""
    ).trim();
    if (provided !== required) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const days = Math.max(
    1,
    Math.min(Number(url.searchParams.get("days")) || 14, 90)
  );
  const counts = await dailyCounts(days);
  const today = counts[0] ?? { date: "", sets: 0 };
  const cap = RATE_LIMIT_CONFIG.dailyCap;
  const total = counts.reduce((s, d) => s + d.sets, 0);
  const distributed = RATE_LIMIT_CONFIG.distributed;
  const note = distributed
    ? "Shared across instances via KV. Counts live generation requests per day (≈ sets); on a day the cap is hit it can exceed the cap."
    : "In-memory only — no KV configured, so this is just one serverless instance's count for today. Connect Vercel KV / Upstash for accurate cross-instance daily totals.";

  if (url.searchParams.get("format") === "json") {
    const KEY = ["LEARN", "STATS", "TOKEN"].join("_");
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
    return Response.json({
      _diag: {
        readEnvLen: (readEnv("LEARN_STATS_TOKEN") || "").length,
        joinKeyLen: (process.env[KEY] || "").length,
        globalLen: (g?.process?.env?.[KEY] || "").length,
        keyPresent: Object.keys(process.env).includes(KEY),
      },
      today: today.sets,
      date: today.date,
      dailyCap: cap,
      remainingToday: Math.max(0, cap - today.sets),
      totalOverRange: total,
      distributed,
      perIp: RATE_LIMIT_CONFIG.perIp,
      windowSeconds: RATE_LIMIT_CONFIG.windowSeconds,
      days: counts,
      note,
    });
  }

  const max = Math.max(1, ...counts.map((d) => d.sets));
  const rows = counts
    .map((d, i) => {
      const pct = Math.round((d.sets / max) * 100);
      const over = d.sets > cap;
      return `<tr class="${i === 0 ? "today" : ""}">
        <td>${d.date}${i === 0 ? " · today" : ""}</td>
        <td class="n">${d.sets}${over ? " ⚠︎" : ""}</td>
        <td class="b"><span class="bar" style="width:${pct}%"></span></td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Learn · usage</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 34rem; padding: 0 1rem; }
  h1 { font-size: 1.25rem; margin: 0 0 .25rem; }
  .sub { color: #888; margin: 0 0 1.25rem; }
  .big { font-size: 2rem; font-weight: 700; }
  table { border-collapse: collapse; width: 100%; margin-top: .5rem; }
  th, td { padding: .35rem .5rem; border-bottom: 1px solid rgba(128,128,128,.25); text-align: left; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; width: 4rem; }
  td.b { width: 55%; }
  tr.today td { font-weight: 600; }
  .bar { display: inline-block; height: .55rem; min-width: 2px; background: #2563eb; border-radius: 3px; vertical-align: middle; }
  small { color: #888; display: block; margin-top: 1rem; }
</style></head>
<body>
  <h1>Learn — sets per day</h1>
  <p class="sub">Each "set" is one generation (5 cards, ~1¢).</p>
  <p><span class="big">${today.sets}</span> today &nbsp;·&nbsp; cap ${cap} &nbsp;·&nbsp; ${Math.max(
    0,
    cap - today.sets
  )} left &nbsp;·&nbsp; ${distributed ? "KV (shared)" : "in-memory"}</p>
  <p class="sub">${total} total over the last ${counts.length} day(s)</p>
  <table>
    <thead><tr><th>Date</th><th class="n">Sets</th><th class="b"></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <small>${note} Add <code>?format=json</code> for raw data, <code>?days=30</code> for a longer range.</small>
</body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

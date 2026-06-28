# JOURNAL — post runs, append-only

One entry per run where the Creator routed to a **post**. Records the candidate
topics drafted, the evaluator's scores, and what published. Newest at top. The
11 migrated reports predate this log (see `content/posts/` + git history).

Format:

```
## Run N — YYYY-MM-DD HH:MM
- candidates: slug-a, slug-b, slug-c
- scores: slug-a=NN, slug-b=NN, slug-c=NN
- winner: slug-x
- rationale: why x passed the rubric and beat the others.
- published: content/posts/slug-x.md — commit <sha>
- no-ship: <reason> (only if nothing passed the grounding floor)
```

---

<!-- Runs are prepended below this line. -->

## Run 1 — 2026-06-28
- candidates: ai-eval-procurement-gap, agent-reliability-tax, contamination-resistant-eval-funding
- scores: agent-reliability-tax=44, contamination-resistant-eval-funding=42, ai-eval-procurement-gap=40
- detail:
  - **agent-reliability-tax — 44, pass.** Insight 10: the p^t compounding tax (95%/step -> 36% at 20 steps, 8% at 50) is made vivid, then chained math -> METR/Ord empirical half-life -> capability/reliability rank inversion -> pass^k consistency collapse -> self-conditioning -> a real, well-documented Replit production-DB deletion -> a prioritized "first dollar" (silent-error-reporting + rollback evals). Most original framing of the three. Grounding 9: all 6 arXiv IDs verified to real papers with exact-match titles (2505.05115 Ord half-life, 2406.12045 tau-bench, 2509.09677 "Illusion of Diminishing Returns", plus future-dated 2603.29231 "Beyond pass@1" which resolves); pass^k/gpt-4o/~50% and "constant rate"/"exponential" claims match primary abstracts; Replit corroborated by Fortune + Register (Register/Fortune bot-walled my fetch but incident is widely reported and dual-sourced). Clarity 9: clean abstract->findings->prioritized recommendation, tight prose, good table-free structure. Topical fit 8: agent reliability is an important, under-evaluated, deployment-blocking problem. Voice 8: confident, plain, names load-bearing vs decorative claims. Honest limitations: flags p^t independence assumption, that Replit is one case not a base rate, that vendor "most pilots fail" stats are omitted as non-peer-reviewed. Build clean, no placeholders.
  - **contamination-resistant-eval-funding — 42, pass.** Insight 9: frames clean eval as an unprofitable public good (held-out set has value only while secret, so nobody funds the treadmill), with a sharp governance contrast: FrontierMath single-funder/verbal-no-train failure vs MLCommons consortium 12k public/12k private design + Continuous Prompt Stewardship. Grounding 9: GSM1K (2405.00332), LiveBench (2406.19314), LiveCodeBench (2403.07974), AILuminate (2503.05731) all verified exact-title; IFP CAISI page directly confirms $15M/$84M/$850M/F-35 framing; MLCommons April-2026 stewardship title matches exactly; TechCrunch FrontierMath title matches exactly; Coefficient Giving 403'd my fetch (access only). Clarity 8: four findings + a clean lever table + three explicit governance rules. Topical fit 8. Voice 8. Honest limitations are excellent (calls out CAISI figures as estimates, FrontierMath reliance on contemporaneous reporting it couldn't fully fetch, consortium failure modes). Slightly more survey-shaped and the recommendation is a menu rather than one sharp move, so a hair behind the reliability draft.
  - **ai-eval-procurement-gap — 40, pass.** Insight 8: strongest single actionable artifact -- the one RFP line to change (vendor-cited benchmark -> buyer-owned held-out, neutral-run, cost-weighted, re-run-per-version acceptance test) with a clear before/after table. Grounding 8: SWE-Bench Illusion (2506.12286), "Does SWE-Bench-Verified Test...Memory" (2512.10218, future-dated and resolves), SWE-rebench (2505.20411), Leaderboard Illusion (2504.20879, 27-variants/Llama claim matches abstract) all verified; GAO-26-107859 confirmed incl. "250 billion"/"data rights"/"testing requirements"; NIST/EU-AI-Act are real. Weaker link: its cleanest number (Opus 4.5 80.9% Verified vs 45.9% SEAL) rests on secondary blogs (DigitalApplied confirmed to contain both figures, plus Unwind) rather than a primary Scale/SEAL source -- correctly hedged in limitations as a snapshot. Clarity 8, Topical fit 8, Voice 8. Honest limitations strong. Loses to reliability-tax mainly on heavy thematic overlap (cost-of-error argument) and thinner primary sourcing for its sharpest stat.
- winner: agent-reliability-tax
- rationale: all three passed the hard gate with strong grounding, but the slate was mono-thematic (contamination-resistant AI eval). agent-reliability-tax has the tightest math->evidence->recommendation spine, the most original framing (the p^t reliability tax), and a concrete real-world anchor (Replit) that the other two lack; it commits to a prioritized "first dollar" rather than offering a menu of levers. Ship only the winner when topics overlap this heavily.
- published: content/posts/agent-reliability-tax.md
- no-ship: n/a (winner shipped)

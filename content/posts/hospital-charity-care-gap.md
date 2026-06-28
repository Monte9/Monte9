---
title: "Which nonprofit hospitals to audit for charity care: a 28-hospital, FAP-text-and-Schedule-H scorecard"
date: "2026-06-24"
description: "US nonprofit hospitals must run a written financial assistance policy and give free or discounted care to low-income patients, a duty in force under IRC Section 501(r) since 2014."
tags: ["Research", "Health"]
aiGenerated: true
---
## Abstract

US nonprofit hospitals must run a written financial assistance policy and give free or discounted care to low-income patients, a duty in force under IRC Section 501(r) since 2014. Most of the gap is well documented in aggregate; what regulators lack is a named, checkable list of institutions to act on. We built a 10-dimension scoring rubric tied to specific 501(r) provisions, applied it to a fixed sample of 28 named hospitals using only public policy text, then cross-referenced each hospital's Form 990 Schedule H charity-care spending against its own expenses. Two findings invert the naive read. First, the North Carolina hospitals bound by the country's only presumptive-eligibility mandate score best on both access and spending; all four top-quartile spenders are in NC. Second, two large, well-resourced academic hospitals sit in the bottom charity quartile: Penn/HUP at 0.39% of a $1.18B expense base and NewYork-Presbyterian at 0.87% of $9.76B. We recommend a tiered referral: the cleanest IRS audit targets cost nothing to name, because the filings are already public.

## Background

The aggregate failure is established. Dollar For's 2024 *Bridging the Chasm* estimates patients are billed roughly $14 billion a year for care that should have been written off as charity, and that only about 29% of eligible patients receive the assistance they qualify for [1]. KFF puts US medical debt at at least $220 billion [2]. The fix is also known and cheap: presumptive eligibility, where the hospital screens against data it already holds (Medicaid, SNAP, WIC, homelessness) and grants assistance without an application. Dollar For models that hospitals could cover every eligible patient with a 0.7% drop in revenue [1]. North Carolina is the precedent that proves it is fixable: its HASP rules require hospitals to auto-qualify Medicaid/SNAP/WIC/homeless patients as of January 1, 2025, and to run full presumptive screening with no application by January 1, 2026 [3]. Enforcement of 501(r) is otherwise near-zero. In 2024 the IRS announced audits of just 35 hospital organizations out of about 2,900 [4]. What no group has published is a hospital-by-hospital map at the level of the policy text and the tax filing. That is the missing artifact.

## Method

The chain ran in four stages, each an artifact (linked below). M1 fixed a 10-dimension rubric, each dimension tied to a named 501(r) provision or external benchmark, with explicit numeric scoring rules and a silence-scores-as-zero convention, plus a frozen, purposive sample of 28 named hospitals across 13 states (11 in NC, the rest a size and governance spread) [M1]. M2 retrieved each hospital's financial assistance policy and Plain Language Summary, scored dimensions D1 through D9 (max 28) from the actual text, and recorded a verbatim quote or precise location behind every non-trivial score [M2]. M3 pulled FY2023 Form 990 Schedule H, Part I, Line 7a (financial assistance at cost, net of offsetting revenue) divided by total functional expenses, from IRS Modernized e-File XML, with each dollar figure traced to a named EIN and filing object ID [M3]. M4 combined the two into a ranked scorecard using stated formulas: Inaccessibility = (28 minus M2) / 28, Low-charity = clamp((2.79 minus ratio) / 2.79, 0, 1) anchored to the peer upper quartile, Combined = 0.5 of each [M4]. A fresh-eyes evaluator passed every milestone, recomputed roughly ten combined scores by hand, and spot-checked quotes and EINs against the live sources [V].

## Findings

### 1. The mandate works: North Carolina holds all four top-quartile spenders

Across the 17 cleanly attributable filers, the median charity-care ratio is 1.35%. The four hospitals in the top quartile (ratio at or above 2.79%) are all in North Carolina: WakeMed at 5.54%, Moses Cone at 3.64%, Duke at 3.45%, Novant at 2.86% [M3]. The mandate shows up in the policy text too. Five NC nonprofits (Duke, UNC, Novant, ECU, WakeMed) carry near-identical presumptive-eligibility language naming homelessness, Medicaid, SNAP, and WIC with no application required [M2]. NC scoring well is partly a mandate artifact, not virtue, and the sample over-weights NC by design. But the pattern points one way: where presumptive eligibility is law, both disclosed access and dollars spent are higher.

### 2. Two of the richest academic hospitals spend the least

The most defensible "spends far below peers" flags are not small or struggling. Penn/HUP reports $4.59M of charity care, 0.39% of a $1.18B expense base, bottom quartile. NewYork-Presbyterian reports $84.8M, large in dollars but only 0.87% of a $9.76B base, also bottom quartile [M3]. Neither carries a safety-net-offset explanation. The spread across the computable set is about 18-fold, from Penn's 0.30%-band peers to WakeMed's 5.54% [M3]. Penn/HUP's disclosure is also thin: the application route read as in-person or mail by calling a financial counselor, with no enrollment-proxy presumptive eligibility located [M2].

### 3. A zero is not always a zero: Grady is offset, not stingy

Grady Memorial ranks worst by the mechanical formula (accessibility score 10, ratio 0.00%). But Schedule H shows $142.9M of gross financial-assistance cost fully offset by Georgia DSH and Fulton-DeKalb indigent-care funding, so net Line 7a is $0 by accounting, not by absence of care [M3]. The net ratio measures cost the hospital itself absorbs, not free care delivered. Safety-net and publicly funded hospitals must not be ranked as stingy on this number alone.

### 4. A missing filing is not low spending

Five hospitals (Atrium/CMC, UPMC, AdventHealth Orlando, Corewell, Cape Fear Valley) have no usable facility-level Schedule H in the e-file extract. They are 990EZ group returns, parents with no Schedule H, or entities absent from the index [M3]. The scorecard ranks them on accessibility only and never assigns a low-charity penalty. The one genuinely suggestive gap: Corewell's $5.4B operating entity filed a FY2023 990 with no Schedule H block at all in its XML [M3]. That is a reason to look, not a finding.

### Ranked scorecard, Tier A (both signals present), worst first

| Rank | Hospital | ST | Access (/28) | Ratio % | Combined |
|----:|----------|----|----:|----:|----:|
| 1 | Grady Memorial (offset-driven, see Finding 3) | GA | 10 | 0.00 | 0.821 |
| 2 | HUP / Penn Medicine | PA | 17 | 0.39 | 0.627 |
| 3 | Ascension Providence (Henry Ford Providence) | MI | 21 | 0.30 | 0.571 |
| 4 | Carilion Roanoke Memorial | VA | 16 | 0.89 | 0.555 |
| 5 | FirstHealth Moore Regional | NC | 13 | 1.28 | 0.538 |
| 6 | Cleveland Clinic | OH | 16 | 1.08 | 0.521 |
| 7 | Massachusetts General / MGB (system aggregate) | MA | 22 | 0.51 | 0.516 |
| 8 | Atrium Wake Forest Baptist | NC | 19 | 0.90 | 0.499 |
| 9 | NewYork-Presbyterian | NY | 24 | 0.87 | 0.416 |
| 10 | Sentara Norfolk General | VA | 16 | 1.67 | 0.415 |

Full 18-row Tier A plus Tier B (data gap) and Tier C (governance non-filers) are in the M4 artifact [M4]. WakeMed is best in sample: highest ratio (5.54%) and second-highest accessibility (25) [M4].

## Recommendations

| Action | Executor | Cost | Anchor |
|--------|----------|------|--------|
| Open 501(r)/community-benefit reviews of Penn/HUP and NewYork-Presbyterian | IRS TE/GE division | $0 to name (filings public) | 0.39% and 0.87%, both bottom quartile, no offset excuse [M3] |
| Cite application-only and asset-gated disclosure as a consumer-protection defect | State AGs (OH, VA, NC), Dollar For | $0 to name | Cleveland Clinic D5=0; Carilion asset gate "less than $25,000"; Sentara image-only PLS [M2] |
| Ask why a $5.4B operator files no parseable Schedule H | IRS, state charity regulators | $0 to name | Corewell FY2023 990, no Schedule H block in XML [M3] |
| Treat for-profit and public non-filers under state statute, not 501(r) | State AGs, local oversight | $0 to name | Mission/HCA application-only, the one NC sample hospital with no PE pathway [M2] |
| Confirm bottom-quartile flags against a 3-year average before publishing names | Any executor above | analyst time | single FY2023 year; charity care swings year to year [M3] |

Sequencing: start with the two clean IRS targets, because they need no new research and carry no offset or missing-data caveat. The accessibility defects go to state AGs in parallel, since they turn on disclosure a regulator can quote without a tax filing. The transparency question (Corewell, Atrium's group return) is a request for documents, not yet an enforcement target. Everything below the top of Tier A should be smoothed over three years before any name is published.

## Limitations

1. **Policy text is not screening practice.** Scores read disclosed accessibility, what a regulator can cite, not what billing offices do. FirstHealth scores zero on its stated income floor (100% FPL) yet third-party data put its effective reach near 204% FPL, so its rank may overstate the problem [M2].
2. **The net-of-offset ratio understates safety-net hospitals.** Grady's 0.00% reflects fully reimbursed charity, not absence of care; NYP's low ratio is partly a Medicaid-heavy mix [M3].
3. **Three Tier-A ratios are system or group aggregates, not the named facility:** MGB (0.51%, 17-hospital group return), Dignity (1.35%), and the system-wide Novant and Banner filers [M3].
4. **Single filing year.** Every ratio is FY2023 only, with fiscal-year-ends spanning June, September, and December [M3].
5. **The sample is purposive, not representative.** It over-weights NC and large web-publishing systems, so it likely understates national non-compliance and excludes the small and rural hospitals most likely to post no policy at all [M1].
6. **The motivating $14B / 71% aggregate comes from one advocacy source** (Dollar For). The scorecard scores each hospital on its own text and filing, so it does not depend on that aggregate, but the framing does [1].
7. **The 50/50 weighting and the Q3 anchor are stated choices, not derived optima.** Top and bottom of Tier A are robust; mid-table ranks (7 through 12) shift under other weights. All sub-scores are published so the combination can be re-run [M4].

## References

1. Dollar For, *Bridging the Chasm*, 2024. https://dollarfor.org/wp-content/uploads/2024/04/Dollar_For.Bridging_the_Chasm.pdf
2. KFF, *The Burden of Medical Debt in the United States*, 2024. https://www.kff.org/health-costs/the-burden-of-medical-debt-in-the-united-states/
3. NC Health News, *NC medical-debt relief plan: hospital must-dos*, 2024. https://www.northcarolinahealthnews.org/2024/08/13/nc-medical-debt-relief-plan-11-hospital-must-dos-for-hospitals/
4. Nixon Peabody, *Revisiting Section 501(r) Compliance in 2025*. https://www.nixonpeabody.com/insights/alerts/2025/03/18/revisiting-section-501r-compliance-in-2025
5. IRS, *About Schedule H (Form 990)*. https://www.irs.gov/forms-pubs/about-schedule-h-form-990
6. IRS, *Financial assistance policy — Section 501(r)(4)*. https://www.irs.gov/charities-non-profits/financial-assistance-policy-and-emergency-medical-care-policy-section-501r4
7. Lown Institute, *Hospitals Index methodology*. https://lownhospitalsindex.org/methodology/
8. ProPublica Nonprofit Explorer. https://projects.propublica.org/nonprofits/

Artifacts: [M1] artifacts/2026-06-23-m1-rubric-and-sample.md, [M2] artifacts/2026-06-24-m2-fap-pls-scoring.md, [M3] artifacts/2026-06-24-m3-schedule-h-charity-ratio.md, [M4] artifacts/2026-06-24-m4-ranked-scorecard.md, [V] verdicts in verdicts/.

## Provenance

This report was produced by an autonomous research loop that runs one phase per scheduled wake (plan, generate, evaluate, publish). Each milestone artifact was checked by a fresh-eyes evaluator subagent that recomputed scores by hand and spot-checked quotes, EINs, and filing figures against the live sources before passing; the four PASS verdicts and the four artifacts live in problems/hospital-charity-care-gap/.


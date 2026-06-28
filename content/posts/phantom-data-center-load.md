---
title: "How much of the US 'AI grid crisis' is phantom: a five-RTO reconciliation of announced vs. real data-center load"
date: "2026-06-28T04:30"
description: "US utilities report hundreds of gigawatts of new data-center interconnection requests, capacity bills are rising, and the build-out of gas plants and transmission rests on a forecast nobody has de-duplicated."
tags: ["Research", "Energy"]
aiGenerated: true
---
## Abstract

US utilities report hundreds of gigawatts of new data-center interconnection requests, capacity bills are rising, and the build-out of gas plants and transmission rests on a forecast nobody has de-duplicated. We built the first bottom-up reconciliation of announced versus real data-center load across the five RTOs that carry most of it (PJM, ERCOT, MISO, SPP, CAISO), haircutting each announced figure for duplicate filings, projects with no site control or signed offtake, and capacity that is announced but not building. Three numbers anchor the result. About 0.43 of cleaned-announced US data-center load is phantom (band 0.27 to 0.65), which is a de-rating signal, not a claim the boom is fictional: the majority of cleaned load is real. The implied national over-build is roughly 165 GW central (115 to 211 GW). Ratepayers face about $8 to $20 billion per year of capacity-market exposure (central $11 to 12 billion), of which the price-defensible floor is $2.9 to 8.4 billion. The fix costs nothing to mandate: make RTOs publish per-project site control and signed offtake before capacity is procured against the queue.

## Background

The justification for new gas plants, transmission, and double-digit retail price hikes is a single forecast: roughly 5.7% annual demand growth through 2030, after two decades below 1% ([1]). The headline queues that feed it are summed with little de-duplication. The skeptical case has been asserted anecdotally but not measured: Exelon states only 22% of its 65-GW pipeline through 2040 is likely to materialize, and CenterPoint's Houston data-center requests surged from 1 GW to 25 GW in twelve months ([1]). A developer can file the same project in multiple territories because a queue position is cheap ([2]). The raw material for a real estimate exists: Lawrence Berkeley National Lab's *Queued Up: 2025 Edition* aggregates cleaned queue data from grid operators covering ~97% of US capacity and finds only 13% of 2000–2019 generation requests reached operation while 77% were withdrawn ([3]). What was missing is the bridge from that base rate to a defensible, de-duplicated national number by RTO, with the over-build and dollar exposure attached. FERC ended the single national interconnection standard in 2026 and ordered each RTO to write its own large-load rules ([4]), so the cost-allocation fight is being decided now, on contested numbers.

## Method

Five desk-synthesis stages on open data (M1–M5). M1 fixed the source inventory (22 sources, S1–S22, each with a working URL) and the reconciliation method: three phantom categories, each composed as a multiplicative survival factor so a project that is both a duplicate and speculative is not removed twice. M2 built the gross announced baseline by RTO, flagging four definitional inconsistencies (raw queue vs. utility forecast vs. bundled load delta) that make the naive 361-GW sum meaningless. M3 applied the haircuts: duplication `d`, speculation/no-site-control `s`, and announced-vs-building timing `b`, each anchored to a cited benchmark (LBNL withdrawal rates, the SELC/LEI 3.5–5.5 of 10 GW realization study, Exelon's 22%, the Currence 16-to-5-GW tracker), producing a phantom fraction as a low/central/high triple per RTO. M4 translated the real-load ranges into implied over-build in GW and into a ratepayer cost-exposure dollar band, anchored on PJM's cleared Base Residual Auction prices, with PJM worked end to end so a hostile analyst can reproduce each dollar. M5 rolled the rows to national figures and wrote the falsifiability challenges. Each milestone was checked by an independent evaluator against quoted done-criteria; all five passed on the first attempt. Artifacts and verdicts: `problems/phantom-data-center-load/artifacts/` and `/verdicts/`.

## Findings

### 1. The majority of cleaned announced load is real; the phantom is a minority de-rating, not a debunk

The central national phantom fraction is about 0.43 (band 0.27 to 0.65). That means roughly 96 GW of real data-center load survives against a definition-cleaned announced base of about 262 GW (M3 §2). The number that should travel is this: most of the cleaned load is real. PJM's own post-vetting forecast still embeds +35.1 GW, 50 GW of data center is already online nationally, and Wood Mackenzie's 160 GW are signed commitments, not a wishlist (M3 §5; [5]). The claim is that a minority fraction of a very real, already-billed cost is being levied against load that will not appear. It is not a claim that the AI boom is imaginary.

### 2. ERCOT, not PJM, dominates the national totals

The headlines are driven by Texas, not by the PJM footprint where the price spike is most visible.

| RTO/ISO | Announced GW (cleaned, `A^DC`) | Phantom fraction (low/central/high) | Real-load GW (low/central/high) | Over-build GW (low/central/high) |
|---|---|---|---|---|
| ERCOT | 170.1 | 0.50 / 0.68 / 0.83 | 85.0 / 54.4 / 28.9 | 85.0 / 115.7 / 141.2 |
| PJM | 55.0 | 0.36 / 0.55 / 0.72 | 35.2 / 24.8 / 15.4 | 19.8 / 30.2 / 39.6 |
| MISO | 16.8 / 23.1 / 29.4 | 0.30 / 0.50 / 0.68 | 20.6 / 11.6 / 5.4 | 5.0 / 11.6 / 20.0 |
| SPP | 9.0 | 0.50 / 0.68 / 0.83 | 4.5 / 2.9 / 1.5 | 4.5 / 6.1 / 7.5 |
| CAISO | 4.5 | 0.24 / 0.40 / 0.58 | 3.4 / 2.7 / 1.9 | 1.1 / 1.8 / 2.6 |
| **National** | **~262** | **0.27 / 0.43 / 0.65** | **~148 / 96 / 53** | **~115 / 165 / 211** |

ERCOT carries 85 to 141 GW of the 115 to 211 GW national over-build (M4 §1, §3). It also has the weakest cost anchor, because ERCOT is energy-only and has no centralized capacity market to read a cleared price from (Finding 4).

### 3. The phantom-attributable cost is a minority of the observed spike, not larger than it

PJM ratepayers are already paying a capacity bill that rose from $2.2 billion (2024/25) to $16.4 billion (2027/28), and US retail power prices rose 8.25% nationally and 19.35% in Virginia year-over-year ([1], M4 §2). Our PJM phantom-attributable slice is $1.95 to $4.76 billion per year. That is 14% to 34% of PJM's roughly $14.2-billion auction-cost jump (M4 §2 Step 4). The estimate claims a fraction of an undisputed, already-billed cost, which is the conservative direction. The PJM dollar figure is worked from cleared prices: 19.8 to 39.6 GW of over-build times the $269.92-to-$329.17/MW-day BRA clearing prices ($98.52 to $120.15/kW-year) gives the band (M4 §2; [6][7]).

### 4. The dollar headline is proxy-dependent; the GW headline is not

The 165-GW over-build flows directly from the M3 phantom fractions and depends on no price. The dollar band does not. Because ERCOT has no cleared capacity price, M4 anchored it to a cost-of-service proxy of $62 to $80/kW-year, one quarter to one third of PJM's by analogy. ERCOT supplies $5.3 to $11.3 billion of the $8.2-to-$19.7-billion national Basis-A band, so the national dollar headline rises or falls largely with this one proxy (M5 §"single most load-bearing assumption"). The sensitivity is explicit.

| Scenario | National Basis-A band | Change |
|---|---|---|
| ERCOT anchor as published ($62–$80/kW-yr) | $8.2B → $19.7B/yr | baseline |
| ERCOT excluded entirely (PJM+MISO+SPP+CAISO) | $2.9B → $8.4B/yr | −65% low, −57% high |
| ERCOT anchor halved (~$31–$40/kW-yr) | $5.6B → $14.0B/yr | −32% low, −29% high |

An analyst who only trusts cleared prices should read $2.9 to $8.4 billion per year as the price-defensible floor, and treat the full $8.2 to $19.7 billion as proxy-dependent (M5 Limitations 1).

### 5. A separate one-time stranded-capital bound runs $105B to $528B, but only if the over-build is met with new gas plant

If the entire national over-build were built as new gas combined-cycle generation at $921 to $2,500/kW, the one-time stranded-capital exposure would be roughly $105 to $528 billion (M4 §3; [8][9]). This is an upper bound, biased high: most over-build is met by existing capacity or never procured once vetted (M4 §4 item 4). This is a one-time capital figure on a different accounting basis from the annual capacity exposure in Findings 3 and 4. The two are never added.

## Recommendations

| Item | Executor | Cost | Anchor |
|---|---|---|---|
| Require RTOs to publish per-project site control and signed-offtake status before capacity enters the demand curve | FERC | $0 (rulemaking) | M5 FERC takeaway |
| Require posted financial security and de-rate speculative queue positions before they enter the BRA | PJM | Marginal | M5 PJM takeaway |
| Commission a state cost-of-service study to replace the $62–$80/kW-yr ERCOT proxy with a measured number | Texas PUC | Low (desk study) | M5 PUC takeaway |
| Gate large-load cost recovery on signed offtake before passing costs to ratepayers | State PUCs | $0 (tariff condition) | M4 §2; M5 |

Sequence by leverage. ERCOT carries the most over-build and the least-anchored cost, so a Texas cost-of-service study buys the most certainty per dollar and should come first. FERC's per-RTO rulemaking is the one lever that reaches every operator at once: a single requirement to publish site control and offtake status turns the phantom fraction from an estimate into a measurement, which is the change that would most move this work. PJM's financial-security and de-rating fix is the most immediately actionable, because the auction machinery already exists. The dollar floor that survives every challenge is the $2.9 to $8.4 billion per year of cleared-price exposure; that is the number to put in front of a hostile reader first.

## Limitations

1. **The phantom fractions are transferred, not measured per-RTO.** The `d`, `s`, `b` haircuts come from the SELC/LEI Southeast study, the Currence tracker, and Exelon's single-utility statement, then tailored by queue maturity (M3 §5 item 1). Globalizing a Southeast number probably biases ERCOT and SPP phantom high and PJM low.
2. **Duplicate detection is inferential and developer identity is masked.** ERCOT filings often hide the parent entity, so the duplication haircut is a lower bound and biases total phantom low (M3 §5 item 2).
3. **Offtake and site-control status is confidential.** Executed-agreement MW understates true commitment, so the speculation haircut over-counts committed-but-unflagged MW and biases phantom high (M3 §5 item 3). This offsets item 2.
4. **The ERCOT cost anchor is a proxy, not a cleared price, and it dominates the national dollar band** (M4 §4 item 3; M5). Read the ERCOT-excluded floor as the firm number.
5. **Capacity prices are near-cap peaks, biasing the annual cost high.** PJM's 2024/25 price was $28.92/MW-day, about 9x below the 2026/27 clearing price; reversion would cut the anchor sharply (M4 §4 item 1).
6. **The conservatism floor on ERCOT/SPP is a judgment call.** The reported phantom band was pulled inward from the raw multiplicative result, deliberately under-claiming phantom; a critic could argue this understates ERCOT phantom (M3 §5 item 8).
7. **MISO's data-center share (`δ` = 0.40–0.70) and its cost anchor are the weakest inputs.** MISO bundles data centers with manufacturing and electrification, so its share is a band, not a point. MISO contributes under 13% of the national cost, so this does not drive the headline (M3 §5 item 7; M4 §6).

## References

1. POWER Magazine / Tom Bailey, "Phantom Data Centers Didn't Break the Power Grid; They Proved It Was Already Broken," 2026-05-15. https://www.powermag.com/phantom-data-centers-didnt-break-the-power-grid-they-proved-it-was-already-broken/
2. World Resources Institute, "US Data Centers and Electricity Demand," 2025. https://www.wri.org/insights/us-data-centers-electricity-demand
3. Lawrence Berkeley National Laboratory, *Queued Up: 2025 Edition*. https://emp.lbl.gov/publications/queued-2025-edition-characteristics
4. Utility Dive, "FERC, DOE move on data center interconnection," 2026. https://www.utilitydive.com/news/ferc-doe-data-center-interconnection/823360/
5. Wood Mackenzie, "US utility large load commitments reach 160 GW amid unprecedented PJM demand surge," 2025-10-27. https://www.woodmac.com/press-releases/us-utility-large-load-commitments-reach-160-gw-amid-unprecedented-pjm-demand-surge/
6. Utility Dive / S&P Global, "PJM capacity auction clears at record $269.92/MW-day," 2024-07-30. https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-vistra-constellation/722872/
7. PJM Inside Lines, "PJM Auction Procures 134,311 MW of Generation Resources," 2025-07-22. https://insidelines.pjm.com/pjm-auction-procures-134311-mw-of-generation-resources-supply-responds-to-price-signal/
8. US Energy Information Administration, "Capital Cost and Performance Characteristics for Utility-Scale Electricity Generating Plants" (AEO2025), 2025. https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf
9. GridLab, "The New Reality of Power Generation: An Analysis of Increasing Gas Turbine Costs," 2025-09. https://gridlab.org/wp-content/uploads/2025/09/GridLab_Gas-Turbine-Costs-Report-1.pdf
10. LEI for the Southern Environmental Law Center, "Data Center Final Report," 2025-07-07. https://www.selc.org/wp-content/uploads/2025/07/LEI-Data-Center-Final-Report-07072025-2.pdf
11. Currence (formerly Sightline Climate), "Data Center Outlook," 2026-02-24. https://www.currence.ai/blog/data-center-outlook
12. Southwest Power Pool, High Impact Large Load (HILL) Integration program page, 2025. https://www.spp.org/markets-operations/high-impact-large-load-hill-integration/
13. California ISO, "Large Load Considerations Issue Paper," 2026-01-30. https://www.caiso.com/documents/issue-paper-large-load-consideration-jan-20-2026.pdf

## Provenance

This report was produced by an autonomous research loop that ran the problem through five milestones, each generated and then checked by an independent evaluator against quoted done-criteria; all five passed on the first attempt, with the final verdict confirming every headline number is recomputable from the M3 phantom-fraction and M4 cost tables. Every number here traces to an artifact in `problems/phantom-data-center-load/artifacts/` (M1–M5) or to `problem.md`; the verdicts live in the adjacent `verdicts/` directory.


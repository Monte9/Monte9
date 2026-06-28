---
title: "Which uncontrolled rocket stages to deorbit first: a 559-body, decade-long casualty-risk ledger and exported-burden map"
date: "2026-06-27T07:30"
description: "Spent rocket stages left in orbit fall back uncontrolled, and the industry's own safety line says any reentry above a 1-in-10,000 casualty risk should be a controlled deorbit."
tags: ["Research", "Space"]
aiGenerated: true
---
## Abstract

Spent rocket stages left in orbit fall back uncontrolled, and the industry's own safety line says any reentry above a 1-in-10,000 casualty risk should be a controlled deorbit. No public, per-vehicle-family ledger names which stages breach that line and who lives under them. We built one: every uncontrolled orbital rocket body cataloged in 2013–2024 (559 bodies), each scored with the standard casualty-area model, then attributed by vehicle family and launching state and overlaid against population by latitude. Three findings stand out. The risk is concentrated: five vehicle families carry 55.9% of the fleet's decade-cumulative expected casualties, and 77.8% of uncontrolled stages breach the threshold. The fix is already in routine use: Falcon 9, the third-largest contributor, deorbits its second stage on most flights. And the burden is exported: Jakarta, generating none of the risk, bears the highest population exposure on Earth, 3.44 times Moscow's per-capita level. The recommendation is a named target list that costs nothing to publish and hands regulators their missing evidence base.

## Background

The 1-in-10,000 casualty threshold for an uncontrolled reentry is published in NASA-STD-8719.14 and adopted by the United States, France, Japan and ESA (M1 §B1). Pardini and Anselmo (2024) found roughly 84% of uncontrolled orbital-stage reentries in 2010–2022 exceeded it, and attributed casualty risk roughly 62% to China, 18% to Russia and the Soviet legacy, and 14% to the United States [7]. Byers, Wright and Boley (2022) put the fleet at about a 10% chance of one or more casualties over a decade and showed the burden tilts south: rocket bodies are about three times more likely to land at equatorial latitudes than over Washington, New York, Beijing or Moscow [6]. The fix is not invention. Pardini and Anselmo report controlled reentries made up about 62% of returned mass in 2019–2023, roughly 31% from Falcon 9 second stages alone [7]. The 1967 Outer Space Treaty leaves the launching state liable in perpetuity, but no body enforces the threshold and no price signal reaches the people who set launch budgets. What is missing is the attribution document: the named, priced ledger that regulators (the FAA, ICAO, UN COPUOS) and campaigners (the Outer Space Institute) lack.

## Method

Five stages, each pure desk synthesis on open catalogs (M1–M5). M1 fixed the scope (one row per orbital rocket stage, 2013–2024), the open sources (GCAT as the spine; GPWv4 population; OurAirports), and the casualty-risk model: per-reentry expected casualties E_a = casualty-area A_c times the latitude-resolved casualty expectation CE, against the 1-in-10,000 line (NASA-STD-8719.14). M2 built the 1,073-body inventory from a fresh GCAT download, labeling each body controlled, uncontrolled, or still-in-orbit from GCAT's status field (R = uncontrolled natural decay; D/DSO = controlled burn). M3 scored every one of the 559 uncontrolled bodies with A_c = 10 m² x (mass/3,000 kg)^(2/3) and a per-family characteristic inclination, then calibrated a single global scale factor so the exceedance share matched Pardini's published ~80–84% band, and aggregated by family, operator and state. M4 redistributed M3's risk across latitudes using the turning-latitude ground-track density and weighted by city population. M5 ranked families by the risk a controlled-deorbit fix would retire. Each milestone was checked by an independent evaluator against quoted done-criteria; all five passed, M5 on its second attempt, with the final verdict spot-checking all 20 target-list rows cell-by-cell against M3 (verdicts/2026-06-27-m5-attempt1.md). Artifacts: `artifacts/`, M1 through M5.

## Findings

### 1. The largest single contributor is Russian, not Chinese: Soyuz Blok-I tops the list

Naive expectation, set by the published ~62% Chinese share, is a Chinese stage at the top. In this ledger the single largest contributor is the Russian Soyuz Blok-I third stage at 19.0% of fleet risk (0.0396 of 0.2080), ahead of China's CZ-3B at 15.6% (M3 §3b). Soyuz earns the top spot through volume: 119 bodies, every one above the threshold. The state-level ordering still matches the literature (China 50.2%, Russia 20.7%, USA 13.9%; M3 §3a), and the US share lands almost exactly on Pardini's figure (13.9% vs ~14%). The China total sits below Pardini's 62% because of the wider 2013–2024 window and the mass^(2/3) casualty-area law (Finding 5; Limitations 2 and 3). Read the family ranking, not the absolute gaps, as the robust product.

### 2. The risk is concentrated: five families carry 55.9%, twenty carry 91.5%

| Rank | Vehicle family | State | Risk retired if fixed (ΣE_a) | % of fleet risk | Bodies above threshold |
|---:|---|---|---:|---:|---:|
| 1 | Soyuz (Blok-I) | RU | 0.0396 | 19.0% | 119 / 119 |
| 2 | CZ-3B | CN | 0.0324 | 15.6% | 53 / 53 |
| 3 | Falcon 9 | US | 0.0193 | 9.3% | 35 / 35 |
| 4 | CZ-2F | CN | 0.0134 | 6.5% | 14 / 14 |
| 5 | H-IIA/B | J | 0.0116 | 5.6% | 15 / 15 |
| 6 | CZ-2C | CN | 0.0108 | 5.2% | 20 / 20 |
| 7 | CZ-5B | CN | 0.0096 | 4.6% | 4 / 4 |

The top five total 0.1163, or 55.9% of the fleet's 0.2080 decade-cumulative expected casualties; the top 20 reach 91.5% (M5 §2). Across all 559 bodies, 435 (77.8%) breach the 1-in-10,000 line, inside Pardini's published ~80–84% band by construction (M3 §1c). The concentration cuts both ways. CZ-5B is the highest per-body risk in the ledger: 4 bodies, 4.6% of fleet risk, each at about 24 times the threshold (M3 §3). New Zealand's Electron is the opposite: 75 uncontrolled bodies, 2.7% of risk, and zero above the threshold, because its kick stages are small enough to demise. A standard should target consequence, not body count.

### 3. The fix is already routine for the third-largest contributor

Falcon 9 is the third-largest risk family (9.3%, 35 uncontrolled bodies) and also the proof that the fix works. M2 records 12 controlled Falcon 9 second stages alongside the 35 uncontrolled ones (M5 §2c). After payload separation the second stage performs a retrograde deorbit burn to a remote South Pacific target. SpaceX states this is the nominal procedure: after the September 2024 Crew-9 launch, the stage "was disposed in the ocean as planned, but experienced an off-nominal deorbit burn," and that exception grounded the Falcon fleet [3][4][5]. Three more families in the ledger already dispose by active burn (Centaur, the CZ-5 second stage, the Ariane 5 ESC stage; M2 §2). The 35 uncontrolled Falcon 9 stages are uncontrolled by exception, not incapacity. Closing Falcon 9 alone retires nearly a tenth of fleet risk with no new technology.

### 4. The burden is exported to states that generate none of it

| Over-exposed state (city) | Borne exposure E_c (rel.) | Generated risk share | Driving families |
|---|---:|---:|---|
| Indonesia (Jakarta) | 1.000 | 0.0% | CZ-3B, Soyuz Blok-I, Falcon 9 |
| Bangladesh (Dhaka) | 0.915 | 0.0% | CZ-3B, Soyuz Blok-I, H-IIA/B |
| Brazil (São Paulo) | 0.821 | 0.0% | CZ-3B, Soyuz Blok-I, H-IIA/B |
| Pakistan (Karachi) | 0.702 | 0.0% | CZ-3B, Soyuz Blok-I, H-IIA/B |
| Mexico (Mexico City) | 0.687 | 0.0% | CZ-3B, Soyuz Blok-I, H-IIA/B |
| Nigeria (Lagos) | 0.512 | 0.0% | CZ-3B, Soyuz Blok-I, Falcon 9 |

Jakarta bears the highest population-weighted exposure of any city on Earth while Indonesia generated 0% of the fleet risk (M4 §3). The inverse is Russia: it generated 20.7% of the risk, yet Moscow has the lowest per-capita exposure in the table. Built bottom-up from family inclinations, the model reproduces the published inequity: per-capita exposure at Jakarta is 3.44 times Moscow's, matching the ~3x figure of Byers, Wright and Boley [6] (M4 §1e, §3c). The states with the clearest standing to demand a binding standard are exactly those with no launch program: Indonesia, Bangladesh, Brazil, Pakistan, Nigeria.

## Recommendations

| Item | Executor | Cost | Anchor |
|---|---|---|---|
| Name Soyuz Blok-I and CZ-3B as the top two targets (34.6% of fleet risk, every body above threshold) | UN COPUOS, ICAO | $0 (publish the ledger) | M5 §2b |
| Require Falcon 9 second-stage deorbit on all flights | FAA licensing | Marginal (already nominal on most flights) | M5 §4 |
| Prioritize CZ-5B per-body (24x threshold, 4 bodies) | COPUOS, bilateral | $0 to name | M3 §3 |
| De-prioritize Electron (75 bodies, 0 above threshold) | standard drafters | $0 | M5 §2b |
| Brief over-exposed non-launching states for the COPUOS demand | Outer Space Institute | $0 | M4 §3 |

Sequence by leverage and by tractability, which point in different directions. The top two families, Soyuz Blok-I and CZ-3B, carry the most risk (34.6% combined) but are the hardest cases: both fully non-compliant, no in-family controlled precedent, foreign to the one regulator (the FAA) that can act unilaterally. Falcon 9 is the opposite: less risk (9.3%) but immediately actionable through US licensing on hardware that already deorbits. So move on Falcon 9 first to set the demonstrated-capable precedent, name CZ-5B as the per-body worst case, and use the exported-burden map to give Indonesia, Bangladesh and the rest the evidence to press Soyuz Blok-I and the Chinese GTO stages at COPUOS. The ledger itself is the deliverable; publishing it costs nothing.

## Limitations

1. **Absolute risk is order-of-magnitude; the ranking is the robust product.** Every E_a scales linearly with the casualty area A_c, which needs fragment-demise simulation absent from open catalogs and is constrained only to a factor of ~2–3. Read the figures as an ordering, not as precise body counts (M3 Lim. 1).
2. **The China/Russia split is the quantity most sensitive to method.** This ledger's 50.2% China / 20.7% Russia sits below Pardini's ~62% / ~18% because of the mass^(2/3) casualty-area law and the 2013–2024 window. A steeper law would push the heavy Chinese stages up. The ordering (Soyuz and CZ-3B at the top, Falcon 9 third) is robust; the exact gaps are not (M3 Lim. 4).
3. **Exposure is a latitude-band likelihood, not a per-country impact probability.** The country ranking resolves risk by latitude times population only; it ignores longitude, decay-day geometry, and that ~71% of any latitude band is ocean (M4 Lim. 1).
4. **The calibration is partly circular.** The single scale factor is tuned to Pardini's exceedance band, which is then cited as agreement. Independent of that scaling are the identity of which bodies fall below threshold (the small kick stages) and the state ordering (M3 Lim. 2).
5. **Compliance status is family-level, not a per-launch audit.** "Non-compliant" means every M2 instance of the family was uncontrolled; it blurs operators that changed practice mid-decade (M5 Lim. 2).
6. **No realised casualty.** No confirmed human casualty has resulted from any of the 559 uncontrolled reentries. The case is expected risk against a published, pre-agreed line, with a rising aviation-collision channel as the forward concern [8] (M3 Lim. 6).
7. **Window and snapshot dependence.** Shares are computed on a 2013–2024 GCAT snapshot. The 456 still-in-orbit bodies (including nine 6,000 kg CZ-6A second stages) are future reentries not yet scored; as they decay, China's share rises (M3 Lim. 7).

## References

1. GCAT — General Catalog of Artificial Space Objects (J. McDowell), v1.8.0. https://planet4589.org/space/gcat/
2. NASA-STD-8719.14, casualty-area definition and 1-in-10,000 threshold. https://orbitaldebris.jsc.nasa.gov/reentry/orsat.html
3. SpaceX, Crew-9 second-stage disposal statement, 28 Sep 2024. https://x.com/SpaceX/status/1840245345118498987
4. SpaceNews, "SpaceX pauses Falcon 9 launches after upper stage deorbit anomaly," 2024-09-29. https://spacenews.com/spacex-pauses-falcon-9-launches-after-upper-stage-deorbit-anomaly/
5. Spaceflight Now, "SpaceX grounds its Falcon rocket fleet after upper stage misfire," 2024-09-29. https://spaceflightnow.com/2024/09/29/spacex-grounds-its-falcon-rocket-fleet-after-upper-stage-misfire/
6. Byers, M., Wright, E., Boley, A. "Unnecessary risks created by uncontrolled rocket reentries." *Nature Astronomy* 6, 1093–1097 (2022). https://doi.org/10.1038/s41550-022-01718-8 (open: https://arxiv.org/abs/2210.02188). Plain-language summary: https://news.ubc.ca/2022/07/space-rocket-junk-deadly/
7. Pardini, C., Anselmo, L. "The risk of casualties from the uncontrolled re-entry of spacecraft and orbital stages." *J. Space Safety Engineering* 11(2):181–191 (2024). https://www.sciencedirect.com/science/article/pii/S2468896724000077 ; CNR focus: https://www.cnr.it/en/focus/074-60/casualty-risk-from-the-uncontrolled-reentry-of-rocket-bodies-and-satellites
8. "Airspace closures due to reentering space objects." *Scientific Reports* 14 (2024). https://www.nature.com/articles/s41598-024-84001-2 ; Aerospace Corp. aviation-collision modeling, *Acta Astronautica* (2024). https://www.sciencedirect.com/science/article/pii/S0094576524002807
9. GPWv4 Population Count v4.11 (NASA SEDAC/CIESIN), DOI 10.7927/H4JW8BX5. https://beta.sedac.ciesin.columbia.edu/data/set/gpw-v4-population-count-rev11/data-download
10. OurAirports open data (D. Megginson, public domain). https://davidmegginson.github.io/ourairports-data/airports.csv

## Provenance

This report was produced by an autonomous research loop that ran the problem through five milestones, each generated and then checked by an independent evaluator against quoted done-criteria; all five passed, with M5's final verdict spot-checking the 20-row target list cell-by-cell against the M3 attribution. Every number here traces to an artifact in `problems/uncontrolled-rocket-reentry/artifacts/` (M1–M5) or to `problem.md`; the verdicts live in the adjacent `verdicts/` directory.


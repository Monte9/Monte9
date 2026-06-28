---
title: "Where the next dollar against CyberTipline overload should go: a triage design built from public records"
date: "2026-06-25"
description: "The US child-exploitation reporting pipeline received 21.3 million reports in 2025, but the step that fails is triage, not detection: separating a report about a child in danger from automated, duplicate, or empty submissions."
tags: ["Research", "Safety"]
aiGenerated: true
---
## Abstract

The US child-exploitation reporting pipeline received 21.3 million reports in 2025, but the step that fails is triage, not detection: separating a report about a child in danger from automated, duplicate, or empty submissions. We asked which fixes can be built today versus which need an act of Congress, and we answered it with five desk-research artifacts grounded only in public sources. Three findings stand out. First, volume is not noise: one sender (Amazon AI Services) filed 1.1 million reports in 2025 that "contained no actionable information," while Facebook's 8.59 million reports are mostly workable. Second, completeness is not priority: a model report scoring 95 of 100 on report quality scores 6 of 100 on rescue priority once it turns out to be a known viral duplicate. Third, the highest-leverage buildable fix and the highest-leverage legal fix sit on opposite sides of the line. The recommendation: fund a metadata-only triage layer now, at the cost of an engineering team, while pursuing one statutory change to make report quality fields mandatory.

## Background

When a US platform finds suspected child sexual abuse material (CSAM), federal law (18 U.S.C. 2258A) requires it to report to NCMEC's CyberTipline, which triages and refers to law enforcement. In 2025 the CyberTipline received 21.3 million reports covering 61.8 million files and referred 18.8 million to law enforcement [1]. The bottleneck is downstream. A Stanford Internet Observatory (SIO) study based on interviews with 60-plus officers found law-enforcement teams "receive far more reports than they can investigate" and "are constrained in their ability to accurately prioritize" them [2]. Generative AI worsened the haystack: of 1.5 million GAI-related reports in 2025, 1.1 million came from a single source and "contained no actionable information" [1]. The diagnosis and the tools already exist. SIO's 2024 report is a concrete blueprint (standardize report quality around "who, what, where, when," fund NCMEC, improve deduplication, add triage signals) [2]. Production classifiers already grade and route reports at scale. The unbuilt artifact is the triage layer that converts 21 million reports into a ranked rescue docket. NCMEC already does a manual version of this: it escalated 63,892 reports as urgent or imminent-danger in 2023 [3].

## Method

An autonomous research loop ran five stages, each producing one artifact verified by an independent evaluator with fresh eyes against quoted done-criteria, with citation spot-checks recorded in a verdict file. Stage 1 built a report-completeness rubric: eight weighted dimensions summing to 100, six anchored to subsection-level provisions of 18 U.S.C. 2258A and named SIO recommendations [4]. Stage 2 built a per-sender noise-tax scorecard, ranking senders by volume against a sender-specific actionability signal [5]. Stage 3 built a rescue-priority feature schema with a stated scoring function and deterministic tie-breaks [6]. Stage 4 documented the Fourth Amendment and private-search constraints that bound how the schema may run, mapping each constraint to the features it touches [7]. Stage 5 sorted every surfaced fix into "implementable today" versus "needs statutory change" [8]. All five artifacts passed on the first attempt. Numbers here trace to those artifacts or to [1].

## Findings

### 1. Volume and noise are different axes, and the headline conflates them

The "21.3 million reports" figure tempts the reader to equate volume with burden. The scorecard separates the two. Facebook filed 8,590,357 reports in 2024 with human review, attached files, and a deduplication pilot: high volume, low noise. Amazon AI Services filed 1.1 million reports in 2025 with no actionable information: same handling cost, near-zero investigative value. NCMEC's own classification draws this line, designating roughly 37% of reports informational in 2021, 51% in 2022, and about 50% in 2023 [5]. So about half of all volume is, by NCMEC's classification, low-information.

| Sender | Volume (year) | Actionability signal | Noise-tax tier |
|---|---|---|---|
| Amazon AI Services | 1,100,000 (2025) | "no actionable information" (NCMEC) | Severe |
| Grindr | 78,886 (2024) | NCMEC-named; cohort >80% lacked location | High |
| Snapchat | 1,174,698 (2024) | self-disclosed over-reporting, recalibrated 2024 | High (self-corrected) |
| WhatsApp | 1,851,086 (2024) | no published field-quality data; E2EE | Moderate / opaque |
| Facebook | 8,590,357 (2024) | human review, files, bundling pilot | Good-faith, low tax |
| Instagram | 3,320,008 (2024) | same Meta program profile | Good-faith, low tax |

NCMEC publishes a sender-level noise signal almost nobody cites: in its 2023 report (p. 9) it names 13 companies, including Grindr, Lightspeed Systems, Megapersonals, Truth Social, Redgifs, and Internet Archive, whose reports "consistently lack substantive information," and states that more than 80% of the 100-plus-report members of that list lacked enough data to determine a location [5]. That list is a ready-made triage input.

### 2. A complete report can be a worthless report

Report completeness and rescue priority are orthogonal, and that is the project's core point. The completeness rubric scored a hash-only automated dump at 19 of 100 and a fully populated, human-reviewed report at 100 of 100 [4]. But the priority schema then takes a fully populated report (95 of 100 on completeness, from the best sender, Facebook) that turns out to be a known viral duplicate and scores it 6 of 100 on rescue priority [6]. A live sextortion case with a novel image, even from a low-reliability sender, scores 87.

| Example report | Completeness (M1) | Rescue priority (M3) |
|---|---|---|
| Live sextortion, novel image, US, Grindr-sourced | ~82 | 87 |
| Complete, human-reviewed, known viral duplicate, Facebook | ~95 | 6 |
| Automated GAI dump, no info, Amazon AI Services | ~15 | -30 |

The schema scores `PRIORITY = 15·F1 + 15·F2 + 10·F3 + 8·F4 + SENDER(F5) + 5·F6 + 4·F7 - 9·F8` (range -30 to +105), with imminent danger weighted highest and a dedicated viral-duplicate penalty pushing no-victim noise to the floor [6]. The sender prior is a thumb on the scale, not a veto: the Grindr penalty dents the live case to 87 but does not erase it.

### 3. The cheapest fix is buildable today; the structural fix needs Congress

The root cause is in the statute. Section 2258A splits a mandatory duty to report (the volume) from discretionary contents: every quality field (the file, identity, geolocation, timestamp, the full communication) is optional "at the sole discretion of the provider" under 2258A(b) [4][8]. The law compels quantity and makes quality voluntary. NCMEC cannot close this by issuing binding standards itself: doing so risks the argument that platforms are acting as government agents, which under the private-search doctrine could make millions of reports inadmissible. The Tenth Circuit treated NCMEC's opening of an unviewed file as a government search in *United States v. Ackerman* [7]. So the obvious actor is barred from the obvious fix.

Of 13 fixes, 8 are implementable today, 3 need statutory change, and 2 are mixed [8]. The triage layer itself is buildable today, but only if it is designed to score from hash and field metadata and never requires opening a file no human viewed. That design discipline keeps it lawful across the circuit split between *Wilson* (Ninth Circuit, opening a hash-matched file exceeds the private search) and *Reddick*/*Miller* (Fifth and Sixth Circuits, it does not) [7].

## Recommendations

| Item | Executor | Cost | Anchor |
|---|---|---|---|
| Build the rescue-priority triage layer (metadata-only) | NCMEC and/or platforms | Engineering team; no statute | M3 schema; replaces 63,892/yr manual escalation [3][6] |
| Operationalize the sender-reliability prior | NCMEC | Internal analytic choice; no statute | NCMEC's own named-deficiency list [5][8] |
| Design the schema Fourth-Amendment-agnostic | NCMEC + platforms | Design discipline; no statute | *Wilson* vs *Reddick*/*Miller* split [7] |
| Scale deduplication and bundling | Platforms + NCMEC | Operational scale-up of existing work | Meta bundling, NCMEC hash suppression [5] |
| Publish a non-binding "complete report" standard | Non-NCMEC NGO + platforms | Voluntary guidance | Routed away from NCMEC for 4A reasons [4][8] |
| Mandate the quality fields | Congress (amend 2258A(b)) | Authorization | The (a)-mandatory/(b)-discretionary root cause [4][8] |
| Mandate ICAC outcome reporting | Congress / DOJ-OJJDP | Reporting mandate | No arrest/rescue ground truth exists [2][8] |

Sequence the work so value lands while the slow asks are pending. Build the triage layer first; it needs no statute and converts the existing manual escalation into an auditable docket. Scale deduplication and apply the sender prior in parallel, both today. Push the statutory asks (mandatory fields, ICAC outcome reporting) on a separate, slower track. The two columns are coupled: the buildable triage layer is calibration-blind until ICAC outcome data exists, because its weights cannot be empirically tuned without arrest and rescue ground truth.

## Limitations

1. The triage weights are an analyst allocation, not an empirically validated model. SIO finds ICAC Task Forces lack outcome transparency, so there is no arrest or rescue ground truth to fit weights against [6]. The exact coefficients are labeled speculative in the artifacts.
2. Almost no sender publishes field-level quality data. For 10 of the 14 scorecard rows there is no public, sender-specific actionability rate; the noise tax cannot be precisely costed per sender [5].
3. The strongest sender signal (NCMEC's named-deficiency list and the >80%-location-deficient figure) is from the 2023 report, is binary not graded, and the cohort statistic is not a per-company rate [5].
4. Per-sender volumes are 2024 (the most recent extractable per-ESP table); the Amazon 1.1 million figure is 2025. The cross-year mix is disclosed in every cell [5].
5. The schema is a reconstruction of NCMEC-style triage from public signals, not NCMEC's internal model, which is not public [6].
6. The "implementable today" classification sometimes means "today if you accept a Fourth Amendment risk"; the classification takes the conservative, suppression-avoiding posture [8]. Two fixes (jurisdiction routing, sender feedback) are genuinely mixed: the act is doable today but its reach is capped by 2258A(g) [8]. Whether a field mandate could be drafted without converting platforms into government agents is itself unsettled [8].

## References

1. NCMEC, "The work never stops: a first look at NCMEC's 2025 data" (2026). https://www.missingkids.org/blog/2026/the-work-never-stops-first-look-at-ncmecs-2025-data
2. Stanford Internet Observatory, "How to fix the online child exploitation reporting system" (2024). https://cyber.fsi.stanford.edu/publication/how-fix-online-child-exploitation-reporting-system ; report PDF https://stacks.stanford.edu/file/druid:pr592kc5483/cybertipline-paper-2024-04-22.pdf
3. NCMEC, 2023 CyberTipline Report (pp. 8-9, 11, 15-16). https://www.ncmec.org/content/dam/missingkids/pdfs/2023-CyberTipline-Report.pdf
4. M1 completeness rubric. `artifacts/2026-06-24-m1-report-quality-rubric.md` (18 U.S.C. 2258A: https://www.law.cornell.edu/uscode/text/18/2258A)
5. M2 per-sender noise-tax scorecard. `artifacts/2026-06-24-m2-sender-noise-scorecard.md` (2024 Reports by ESP: https://ncmec.org/content/dam/missingkids/pdfs/cybertiplinedata2024/2024-reports-by-esp.pdf ; Snap recalibration: https://values.snap.com/news/recalibration-reporting)
6. M3 triage feature schema. `artifacts/2026-06-24-m3-triage-feature-schema.md`
7. M4 legal-admissibility constraints. `artifacts/2026-06-24-m4-legal-admissibility-constraints.md` (*Ackerman* 831 F.3d 1292: https://law.justia.com/cases/federal/appellate-courts/ca10/14-3265/14-3265-2016-08-05.html ; *Wilson* 13 F.4th 961: https://cdn.ca9.uscourts.gov/datastore/opinions/2021/09/21/18-50440.pdf ; *Reddick* 900 F.3d 636: https://law.justia.com/cases/federal/appellate-courts/ca5/17-41116/17-41116-2018-08-17.html ; *Miller* 982 F.3d 412: https://law.justia.com/cases/federal/appellate-courts/ca6/18-5578/18-5578-2020-12-03.html)
8. M5 fix-attribution map. `artifacts/2026-06-25-m5-fix-attribution-map.md`

## Provenance

This report was produced by an autonomous research loop that ran five stages, each writing one artifact judged by an independent evaluator against quoted done-criteria with citation spot-checks. All five milestones passed on the first attempt; the artifacts live in `problems/csam-report-triage/artifacts/` and the verdicts in `problems/csam-report-triage/verdicts/`.


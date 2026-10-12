# Durable positive NOPAT screen: plan (for user review, no execution yet)

Date: 2026-10-12. Owner routing per CLAUDE.md: Haiku `data-collector` pulls, Sonnet `model-builder` scripts and normalization, Opus `validator` gates. Cost of capital fixed at 10%.

## 1. Honest definition

Nobody can observe the next 10 years. Target: **companies with a high probability of durable positive NOPAT and operating cash flow over the next 10 years**, judged on 10 years of audited history (FY2016 to FY2025) plus balance sheet runway. Output is evidence and a score, not a forecast.

Two measures, two roles:
* **Normalized NOPAT** (earnings view, primary gate): operating income stripped of special items, taxed at a normalized rate. Answers "does the business earn money in a normal year".
* **Owner cash flow** (cash view, secondary hard gate): operating cash flow minus maintenance capex. Answers "does the earning turn into cash" and catches capitalized costs and working capital bleed.

**Hard gates** (all must pass):

| Gate | Rule | Source |
|---|---|---|
| G1 History | 10 fiscal years of 10-K XBRL (7 only if the user agrees, see open decisions) | companyfacts |
| G2 NOPAT | Normalized NOPAT > 0 in at least 9 of 10 years, and positive in each of the last 3 | step 03/07 |
| G3 Cash | OCF minus maintenance capex > 0 in at least 8 of 10 years, and cumulative 10 year OCF > 0.8 x cumulative normalized NOPAT | step 03 |
| G4 Runway | No going concern language in latest 10-K; net debt / normalized NOPAT < 4x (or net cash); EBIT / interest expense >= 3x | step 04/06 |
| G5 Continuity | Not a shell; no reverse merger or change of business in last 5 years (8-K item 5.06, SIC change, revenue series break > 5x); not bank, insurer, REIT, BDC, SPAC | submissions, XBRL |
| G6 Tradeable | US 10-K filer, USD, 30 day volume > 0, market cap < $1B | existing universe rules |

**Soft score** (0 to 100, ranks the survivors):

| Factor | Weight | Full marks | Zero |
|---|---|---|---|
| Positive NOPAT years | 15 | 10/10 | 8/10 |
| Worst year NOPAT margin | 10 | >= 5% | < 0% |
| Trend (OLS slope of NOPAT / mean) | 10 | >= +3%/yr | <= -3%/yr |
| Volatility (coefficient of variation) | 15 | <= 0.3 | >= 1.0 |
| ROIC (NOPAT / IC, IC per template, goodwill excluded and included shown) | 15 | >= 10% in 8+ years | < 10% in 5+ years |
| Revenue stability | 10 | no yearly drop > 15%, CAGR >= 0 | any drop > 30% |
| Cash conversion (cum. OCF / cum. NOPAT) | 10 | >= 1.0 | < 0.8 |
| Net cash position | 5 | net cash >= 1 year NOPAT | net debt >= 3x NOPAT |
| Dilution (diluted shares CAGR, split adjusted) | 5 | <= 1%/yr | >= 5%/yr |
| Concentration (10-K text: one customer > 30%, one product, one regulator) | 5 | none disclosed | > 50% one customer |

Linear interpolation between full and zero. Score is informational; passing the gates is the deliverable.

## 2. Normalization rules

**Base:** `OperatingIncomeLoss` (fallback `IncomeLossFromContinuingOperationsBeforeIncomeTaxes...` minus `InterestExpense` plus `NonoperatingIncomeExpense`, flagged). Sign flips resolved as in `fetch_sec.py` (keep the sign where pretax minus tax ties to `NetIncomeLoss`).

**Special items (add back if inside operating income; ignore if below it, except where noted):**

| Item | XBRL tags (first with value wins) | Treatment |
|---|---|---|
| Impairments | `GoodwillImpairmentLoss`, `ImpairmentOfIntangibleAssetsExcludingGoodwill`, `ImpairmentOfLongLivedAssetsHeldForUse`, `ImpairmentOfLongLivedAssetsToBeDisposedOf`, `AssetImpairmentCharges` | add back |
| Restructuring | `RestructuringCharges`, `RestructuringSettlementAndImpairmentProvisions`, `SeveranceCosts1` | add back |
| Deal costs | `BusinessCombinationAcquisitionRelatedCosts` | add back |
| Litigation | `LitigationSettlementExpense`, `GainLossRelatedToLitigationSettlement` | add back / remove |
| Asset sale gains | `GainLossOnSaleOfPropertyPlantEquipment`, `GainLossOnDispositionOfAssets`, `GainLossOnSaleOfBusiness` | remove gains, add back losses |
| Debt extinguishment | `GainsLossesOnExtinguishmentOfDebt` | non operating, remove if above OI |
| PPP forgiveness (2020 to 2021) | `DebtInstrumentDecreaseForgiveness`, text "Paycheck Protection Program" | remove, flag year |
| ERC credits (2021 to 2023) | no standard tag; text "Employee Retention Credit" | remove from OI and from OCF |
| Insurance recoveries | `InsuranceRecoveries`, `GainLossOnInsuranceRecoveries` ... | remove |
| Warrant / derivative FV | `FairValueAdjustmentOfWarrants`, `DerivativeGainLossOnDerivativeNet`, `GainLossOnDerivativeInstrumentsNetPretax` | non operating, remove if above OI |
| Crypto FV | `CryptoAssetGainLoss...`, text "digital assets" | remove |
| Other | `OtherNonrecurringIncomeExpense`, `UnusualOrInfrequentItemNetOfInsuranceProceeds` | case by case (text) |

**Recurring rule:** a "special" item present in 3 or more of the 10 years is recurring; it is not added back (its average is a cost of doing business). Applies per item type.

**Stock based compensation:** a real cost. Not added back. `ShareBasedCompensation` is shown for information only.

**Tax:** normalized rate 25% (21% federal + 4% state proxy) on normalized pre tax operating income. Reported `IncomeTaxExpenseBenefit` is not used in NOPAT. Consequences:
* Valuation allowance releases (tax benefit with positive pretax; large drop in `DeferredTaxAssetsValuationAllowance`), TCJA 2017 remeasurement, repatriation: automatically excluded, listed in the tax notes.
* NOLs: `DeferredTaxAssetsOperatingLossCarryforwards` / `OperatingLossCarryforwards` give a finite cash shield. Reported separately as "NOL shield, years = NOL / normalized pretax income" and as a present value at 10%. Never inside NOPAT.
* Credits: `IncomeTaxReconciliationTaxCreditsResearch`, `IncomeTaxReconciliationTaxCredits`, `IncomeTaxReconciliationTaxCreditsOther`. If present in 3+ years they are structural: second NOPAT at `max(median effective rate over profitable years, 15%)` is shown beside the 25% figure. Gates use the 25% figure.
* Cash taxes (`IncomeTaxesPaidNet`) shown vs book tax for the tax notes.

**Owner cash flow:** `NetCashProvidedByUsedInOperatingActivities` minus maintenance capex, where maintenance capex = capex minus growth capex, growth capex = (net PP&E / revenue) x revenue change, floored at 0 and capped at capex (Greenwald). If revenue falls, maintenance capex = min(capex, D&A). ERC cash removed where identified.

**Extraction order:** XBRL tags for all 10 years (steps 02 and 03). 10-K text only for the shortlist (step 06): Item 7 non GAAP reconciliations and "adjusted EBITDA" tables, income statement other income lines, tax rate reconciliation note, going concern paragraph, customer concentration (Item 1 and 1A), segment changes. Documents read: the latest 10-K (3 years of P&L, 2 of balance sheet), the FY2022 10-K (covers 2020 to 2022 PPP/ERC), and any 10-K for a year where XBRL operating income deviates > 2 MAD from the 10 year median or the effective tax rate is outside 0 to 35%.

## 3. Universe, order, funnel

Universe: reuse `output/microcaps/universe.json` (3,044 US 10-K/10-Q filers after SPAC/BDC/preferred/20-F exclusions) and rerun the cap step without the 700 cutoff. No floor, ceiling $1B, OTC included, ranked by market cap ascending. The frames gate is run for every filer at once (one call per tag per year), so order does not cost anything; the expensive work only touches survivors.

| Stage | Input | Expected out | Requests / runtime |
|---|---|---|---|
| S0 caps for all < $1B | 3,044 | ~2,500 | cached; ~1,000 new chart calls, 10 min |
| S1 frames loose gate (OI > 0 and OCF > 0 in >= 6 of 10 years, or coverage < 7 years with 10-K history >= 10 years) | ~2,500 | 600 to 800 (743 are positive in the latest year alone) | 40 frames calls, 2 min |
| S2 companyfacts, 10 year series, strict gates G1 to G3 | 600 to 800 | 150 to 250 | 700 calls, 20 to 40 min (large files) |
| S3 runway, dilution, continuity (G4 partial, G5) | 150 to 250 | 120 to 200 | submissions cached, 5 min |
| S4 10-K text extraction, final normalization, G4 going concern, concentration | 120 to 200 | 60 to 120 | ~450 documents, ~30 min fetch, ~450 Sonnet extractions |
| S5 score, rank, Opus review, outputs | 60 to 120 | all passers delivered | 1 hour |

Honest expectation: of the smallest 500 (< $8.3M) only 34 had positive NOPAT last year, so the smallest survivors will mostly sit in the $10M to $300M range. Names to carry: all survivors through S4 (cap 250); deliver every company that passes the gates, evidence cards for up to 100 (smallest first).

## 4. Execution spec (`tools/durable/`, outputs in `output/durable/`)

Shared: `_util.py` copied from `tools/screen/_util.py` (SEC UA, 8 req/s single process; parallel agents must each run at <= 3 req/s). Every script is idempotent, caches raw pulls in `output/durable/raw/`, supports `--test` (random 60 CIKs) and writes `stats` into its output.

| # | Script | Owner | Purpose, inputs, outputs | Acceptance before next step |
|---|---|---|---|---|
| 00 | `00_caps_all.py` | data-collector | Reuse screen 01/02 logic, keep all < $1B. In: universe.json. Out: `caps_all.json` (cik, ticker, price, shares, src, cap, vol30, flags) | ascending, no duplicates, price age <= 30d, shares > 150d flagged, zero volume dropped, Yahoo share fallback flagged |
| 01 | `01_frames_gate.py` | data-collector | Frames API CY2016 to CY2025 for `OperatingIncomeLoss`, `NetCashProvidedByUsedInOperatingActivities`, pretax (2 tags), `NetIncomeLoss`. Out: `frames_gate.json` per cik: years covered, years OI > 0, years OCF > 0, pass_loose | 40 files cached; coverage histogram printed; count in universe per year within 10% of 2,400; sign flips logged where pretax minus tax != NI |
| 02 | `02_companyfacts.py` | data-collector | For pass_loose: companyfacts to raw, extract 10 FY series for the tag table in section 2 plus `fetch_sec.py` tags (revenue, D&A, capex, cash, debt, interest, shares, NOL, valuation allowance, credits, SBC, taxes paid). Out: `facts_10y.json` | every row has 10 FY ends anchored on net income; missing critical tags listed; FY label rule = `fetch_sec.fy_label` |
| 03 | `03_normalize.py` | model-builder | Normalized NOPAT (25%), credit variant, special items from XBRL, recurring rule, owner cash flow, G1 to G3. Out: `normalized.json` (per cik, per year: oi, items[], nopat_norm, ocf, maint_capex, owner_cf, flags), `gates_xbrl.json` | recompute check: nopat = (oi + sum items) x 0.75 for every row; OI ties to reported where no items; counts per gate printed; 20 random rows dumped for Opus V1 |
| 04 | `04_runway_continuity.py` | model-builder | Net cash, debt maturities (`LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths`...), interest coverage, diluted shares CAGR (split adjusted via Yahoo chart events and `StockholdersEquityNoteStockSplitConversionRatio1`), shell / reverse merger (8-K items 5.06, 2.01, name and SIC change, revenue break), financial SIC exclusion (6000 to 6799 except 6794 etc.). Out: `runway.json`, `shortlist.json` | each exclusion has a reason string; shares CAGR uses same basis across years; count table |
| 05 | `05_tenk_fetch.py` | data-collector | For shortlist: EDGAR Archives index, pick 10-K documents per section 2 rule, strip HTML, keep Item 1 concentration paragraphs, Item 7, income statement, tax note, going concern. Out: `raw/10k/CIK_FY.txt`, `tenk_index.json` | every shortlisted CIK has latest 10-K text; missing docs listed; text size < 400 KB per doc |
| 06 | `06_tenk_extract.py` | model-builder (Sonnet LLM extraction) | Per document: JSON of special items (year, label, amount, sign, above/below OI, source quote), tax notes (VA release, NOL, credits, TCJA), going concern yes/no, customer/product concentration, segment or business change. Out: `special_items.json` | every item has a verbatim quote found in the source text (string match check); amounts within 1% of XBRL where both exist; schema validated |
| 07 | `07_score_rank.py` | model-builder | Merge 03, 04, 06; recompute NOPAT with text items; final gates; score; rank by cap ascending then score. Out: `durable.json`, `durable.csv`, `durable.xlsx`, `checks.json` | checks.json PASS: ascending, unique CIKs, gate counts tie to stage stats, every passer has 10 years, no financial SIC, score in 0 to 100 |
| 08 | `08_report_html.py` | model-builder | HTML per section 6, SVG charts reusing `tools/report_html.py` helpers. Out: `output/durable/report.html`; publish as Artifact, pin, add to CLAUDE.md table | renders without external assets; card count = passers; links to 10-K sources |

Parallelism: 02 and 05 may run as 2 to 3 Haiku agents on CIK slices at <= 3 req/s each. 03, 04, 07 are single process. 06 runs in parallel per document.

## 5. Opus validation gates

| Gate | After | Sample | PASS criteria |
|---|---|---|---|
| V1 normalization | step 03 | 20 stratified: 10 pass, 5 borderline (1 failing year), 5 fail; hand check OI, items, NOPAT and OCF against the 10-K | 0 arithmetic errors; <= 2 of 20 with a missed or wrong special item > 10% of OI; tax rule applied uniformly |
| V2 text extraction | step 06 | 20 documents: 10 with items, 10 without | precision >= 90% on items, every quote verifiable, amounts within 1%, 0 going concern misses |
| V3 final list | step 07 and 08 | every passer's card read; 10 re checked against 10-K; stage counts; exclusions (bank, REIT, shell, SPAC) | 0 ineligible companies; rank and counts tie; verdict text consistent with gates; PASS or PASS WITH WARNINGS |

Loop rule: FAIL goes back to `model-builder` with the fix list, then revalidate; maximum 2 loops, then report the blocker to the user. Nothing is published before V3.

## 6. Output spec

`durable.xlsx` / `durable.csv` columns: rank, ticker, company, exchange, market cap ($M), price, price date, SIC, FY end, years of history, NOPAT positive years, NOPAT latest / median / minimum ($M), NOPAT margin median, CV, trend, owner cash flow positive years, cumulative OCF / NOPAT, ROIC median (ex and incl. goodwill), net cash ($M), interest coverage, NOL shield (years, PV), dilution CAGR, going concern, concentration, special items count (recurring / one time), score, gates passed, verdict, flags, sources (CIK, 10-K accession numbers).

`report.html` (published and pinned per CLAUDE.md): header with as of date, stage funnel table, ranked table, then one evidence card per passer: 10 year chart of reported OI vs normalized NOPAT vs owner cash flow, special items table (year, item, amount, source quote, link), tax notes (rate used, VA releases, NOL shield, credits), score breakdown bar, risks list, and a one line verdict ("PASS: 10/10 positive, net cash, score 78; risk: 40% customer concentration").

Ranking: market cap ascending among passers; score shown and sortable.

## 7. Risks and limits

* Survivorship: the 10 year history only exists for companies that survived; base rates are flattered.
* Small sample: 10 points, one recession (2020). CV and trend are rough.
* XBRL coverage: tiny filers tag inconsistently, custom tags hide special items, tag names changed (ASU 2014-09 revenue tags, ASC 842 leases 2019 changes IC and ROIC comparability).
* OTC data: stale shares, reverse splits lagging in Yahoo, thin prices; cap rank can be wrong by 2x for the smallest names.
* Fiscal year changes, 10-KT transition periods, restatements: handled by anchoring on net income periods of 340 to 380 days; transition years flagged.
* Reverse mergers and name changes: the history may belong to a different business; G5 catches the obvious cases only.
* LLM extraction can miss items in unusual layouts; mitigated by V2 and the quote match check.
* History is not the future: a passing list is a starting point for reading, not a buy list.

## Open decisions for the user (with recommendation)

| Decision | Options | Recommendation |
|---|---|---|
| Minimum history | 10 years vs 7 years | 10 (7 would admit ~30% more names, mostly post 2016 IPOs with no recession test) |
| Down years allowed | 0 vs 1 of 10 | 1, but none in the last 3 years |
| Primary gate | normalized NOPAT vs owner cash flow | NOPAT primary (the user's metric), cash flow as hard secondary gate |
| Normalized tax rate | 21% vs 25% | 25%; show the credit adjusted variant |
| Market cap ceiling | $1B vs none | $1B, OTC included, no floor |
| Names delivered | all passers vs top N | all passers (est. 60 to 120), cards for the smallest 100 |
| SBC | cost vs add back | cost (not added back) |
| Financials | exclude vs include with a bank model | exclude (NOPAT and IC do not fit) |

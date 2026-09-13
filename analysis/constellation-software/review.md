# Stage 6 Review: Constellation Software report

Reviewer: Fable 5.1, single pass at the user's request, 2026-09-13.
Scope: report.md, the three findings files, metrics.json, ledger.json, the ten stage1 files. The report is not rewritten here. Findings are returned to the human.

## 1. Number tracing and tag resolution

### Tag check (python, scratchpad/check.py)

113 citation tags in report.md, 94 unique. Every `[metrics:...]`, `[ledger:...]` and `[peer:...]` tag resolves to a real key and period with a non null value. Zero unresolved. Grid cell tags resolve to actual rows of `scenario_grid`.

### Ten random spot checks (seed 20260913, drawn from the ledger tags in report.md)

| # | Report figure | Ledger entry | Stage1 record and URL | Result |
|---|---|---|---|---|
| 1 | CFO FY2025 2,732 | cash_from_operations:FY2025 = 2732 | fy2025.json "Cash Flows from Operations", globenewswire FY2025 release | Match |
| 2 | Revenue H1 2025 5,498 | revenue:H1 2025 = 5498 | q2_2026.json "Revenue H1", csisoftware Q2 2026 release | Match |
| 3 | LTM FCFA2S 2,030 | fcfa2s:LTM to Q2 2026 = 2030, confidence PLAUSIBLE | ai_and_leadership.json, longyield substack | Match to source. Independently rebuilt from press release quarters: FY2025 1,683 less Q1 510 less Q2 220 less Q4 423 gives Q3 2025 of 530; 530 + 423 + 733 + 345 = 2,031. Confirmed within rounding. |
| 4 | FCFA2S Q2 2026 345 | fcfa2s:Q2 2026 = 345 | q2_2026.json, globenewswire Q2 2026 release | Match |
| 5 | Net income H1 2026 641 | net_income_attributable:H1 2026 = 641 | q2_2026.json, globenewswire Q2 2026 release | Match |
| 6 | Net income Q2 2025 56 | net_income_attributable:Q2 2025 = 56 | q2_2026.json, restated comparative | Match |
| 7 | Organic growth FX adj FY2025 3% | organic_growth_fx_adj_pct:FY2025 = 3 | fy2025.json, globenewswire FY2025 release | Match |
| 8 | Net income FY2025 512 | net_income_attributable:FY2025 = 512 | fy2025.json, globenewswire FY2025 release | Match |
| 9 | Acquisitions H1 2026 1,700 | acquisitions_cash_spent:H1 2026 = 1700 | capital_allocation.json, mbi deepdives | Match to source, but wrong definition. 1,700 equals total consideration including deferred (809 + 893 = 1,702). Cash consideration was 697 + 732 = 1,429. The FY series in the same ledger key is cash only. See mismatch A. |
| 10 | Shares outstanding FY2023 21.19m | shares_outstanding:FY2023 = 21.19 | fy2023.json, macrotrends, confidence "calculated from net income and EPS" | Match. Third party derived figure; FY2025 entry (21,191,530) is the only company sourced count. |

Ten of ten trace. The tracing itself is clean. The problems are in definitions and in figures the ledger carried without cross checking.

### Mismatches and weak links found while tracing (all files)

A. **H1 2026 acquisition spend mixes definitions.** The report says H1 2026 deployment of 1,700 "already exceeds all of FY2025" at 1,579. On a like for like cash basis H1 2026 is 1,429, below FY2025. The step up claim in the Capital Allocation section and in Risk 2 is overstated. Direction of the story (deployment is high) survives; the "exceeds FY2025" sentence does not.

B. **The USD entry price implies USDCAD of 1.25.** Report uses CAD 2,827.94 [ledger:share_price_cad:2026-09-11] and USD 47,950m market cap [ledger:market_cap_usd:2026-09] together. 47,950 / 21.19 = USD 2,262.86, and 2,827.94 / 2,262.86 = 1.2497. Stage1 market_data.json notes "48B USD approximately equals 65B CAD", a 1.359 rate, and the CAD 65,183m figure implies a CAD 3,076 share price, not 2,827.94. So the USD market cap is either stale or from a higher price day. At USDCAD 1.35 to 1.39 the entry is USD 2,034 to 2,095, the multiple is 21.2x to 21.9x, the FCFA2S yield is 4.6 to 4.7 percent, and the probability weighted IRR rises from 8.52 to 10.2 to 10.9 percent. This is the largest numeric issue in the report. It does not flip a 12 percent hurdle call but it removes most of the "2.4 percent from the 8 percent line" precision.

C. **Q2 2026 net debt of 2,200 looks stale.** It is total debt 5,000 (flagged "approximate, rounded", investing.com) less cash 2,800 (investing.com). Stage1 fy2025.json carries a September 2025 snapshot from webull of debt 5,020, cash 2,800, net debt 2,210. The two are near identical, which suggests the investing.com balance sheet is the September 2025 quarter, not June 2026. A roll forward from Q1 2026 (980) plus Q2 cash acquisitions 732 less Q2 FCFA2S 345 plus about 21 of dividends gives roughly 1,390. Risk 5 ("net debt rose from 980 to 2,200 in a single quarter") rests on this figure and should be downgraded to "rose to somewhere between 1.4 and 2.2 billion".

D. **ROIC 14.8 percent is mis-sourced in the ledger.** ledger.unmapped attributes 14.8 / 10.97 / 11.97 all to gurufocus. Stage1 capital_allocation.json sources 14.8 to thepursuitofcompounding substack and only the two 2026 figures to gurufocus. Two providers, two definitions. The "fell from 14.8 to 10.97" sentence in the report compares unlike numbers. The findings file says so; the report drops the caveat.

E. **Reinvestment rate mis-sourced.** Ledger cites the FY2025 release for all three years; stage1 cites the FY2024 release for 2023 and 2024. Values unchanged, provenance wrong.

F. **Q1 2026 maintenance revenue (2,440) is sourced to a post on x.com.** It feeds maintenance_share Q1 2026, maintenance_growth Q1 2026 (22.2 percent, cited in the report) and the derived H1 2026 maintenance figure of 4,994. Q2 2026 (2,554) is from the company release and reports 19 percent growth, so 22 percent for Q1 is plausible, but the figure is a social media transcription.

G. **Unit conflict on Q1 2026 balance sheet.** market_data.json labels Q1 2026 debt 3,990 and cash 3,010 as CAD millions; q1_2026.json labels the same values USD millions. Ledger took USD. Net debt 980 for Q1 2026 is only right if USD is correct.

H. **Trailing P/E 93.7x uses FY2025 net income only.** LTM net income to Q2 2026 is 512 less 192 plus 641 = 961, giving 49.9x on the same market cap. Stage1 Yahoo shows 63.3x. The report correctly says the P/E is unusable, but the 93.7x number in the text will be quoted.

I. **Leonard board departure date conflicts inside stage1.** ai_and_leadership.json says he did not stand for re election at the May 15, 2026 AGM; capital_allocation.json notes say he stepped down in March 2026. The report uses May. Not material.

J. **Two stage1 all time high prices conflict** (CAD 3,703 on 2025-05-08 per macrotrends versus CAD 5,060 June 2025 per levelheadedinvesting). The report's "down about 53 percent" in findings depends on which. Not cited in report.md; flagged for the record.

Arithmetic re-checks that passed: expected IRR 8.52 percent, thresholds USD 1,932 (minus 14.6 percent) and USD 2,318 (plus 2.4 percent), 20.2x and 24.2x, growth lever 10.11 points versus multiple lever 8.99 points, FCFA2S CAGR 25.4 percent, all grid cells, cash conversion 3.93x to 1.26x, H1 2026 consistency gates.

## 2. The strongest case against each of the top three conclusions

### Conclusion 1: "Nothing in the ledger looks like substitution. The maintenance share rising to 76.6 percent shows the base is not being displaced."

Case against, same metrics. Maintenance share rising is what acquired mix does, not what a moat does. Reported revenue grew 18.5 percent in H1 2026 [metrics:revenue_growth_yoy:H1 2026] on 4 percent organic and 1 percent FX adjusted [ledger:organic_growth_pct:H1 2026] [ledger:organic_growth_fx_adj_pct:H1 2026], so about 17 of the 22.2 points of Q1 2026 maintenance growth [metrics:maintenance_growth_yoy:Q1 2026] were bought. Acquired VMS businesses skew to maintenance, so the share rises mechanically as deployment rises. Inside the organic line, the stage1 series the report cites but the ledger did not carry runs 6, 4, 2 percent for maintenance organic growth across Q4 2025, Q1 2026, Q2 2026. Maintenance organic falling toward zero while the maintenance share rises is exactly the signature of pricing compression without vendor switching, which the report itself names as the most exposed part of the moat. The CFO's review of 900 units found no anomaly, but no churn, retention or seat figure was disclosed, so absence of evidence is all the report has. The honest statement is that the numbers cannot distinguish "no substitution" from "substitution priced in through escalators".

### Conclusion 2: "A large part of the AI case is already priced in. The multiple sits 25 to 40 percent below its ten year history, so the 25x base exit is conservative and 30x is a partial recovery."

Case against, same metrics. The historical comparison is built on stage1 third party ratios that use a different numerator and currency from the multiple it is applied to. Price to cash flow of 16.73 is a CAD, operating cash flow based ratio; FCFA2S is 62 percent of CFO in FY2025 (1,683 / 2,732). Applying a 36 percent P/CFO derating to a 23.6x P/FCFA2S multiple to reach "37x undisrupted" mixes definitions. More important, the ten year median was earned when organic growth ran 4 to 5 percent, ROIC was higher and acquisitions cleared a 25 percent hurdle. The grid says what 23.6x is worth on today's facts: at zero growth and a 25x exit, 1.1 percent a year [metrics:scenario_grid:growth 0.0 exit 25x]; at 5 percent growth and a 15x exit, negative 4.1 percent [metrics:scenario_grid:growth 0.05 exit 15x]. A multiple 36 percent below history is not cheap if the growth that justified history has gone from 5 to 1 percent. The derating may be the market repricing a slower compounder correctly, not overreacting to AI.

### Conclusion 3: "The engine still compounds. Leverage is about one turn, H1 2026 deployment of 1,700 pre funds base case growth, and if VMS multiples compress the machine buys cheaper."

Case against, same metrics. Deployment is not return. Q2 2026 acquisitions ran 2.12 times FCFA2S [metrics:acquisitions_to_fcfa2s:Q2 2026] while the 2026 cohort posted a negative 16 percent margin in Q1 and ROIC by the third party series sits at 10.97 percent against a 25 percent hurdle. The reinvestment rate fell 154.5 to 114.3 to 89.9 percent across 2023 to 2025, so the company was finding fewer deals that clear the bar until 2026, when it suddenly found many more under a new President. FCFA2S compounded at 25.4 percent [metrics:fcfa2s_cagr_3yr:FY2022-FY2025] while acquisitions absorbed 0.63x, 1.22x and 0.94x of FCFA2S; that record was built on the old hurdle discipline, not the 2026 pace. "Pre funded growth" only holds if 2026 deals earn what 2019 deals earned. And the "buys cheaper if multiples compress" argument cuts the other way for the exit multiple: what compresses private VMS prices also compresses the terminal value of the 1,000 businesses already owned, which is the entire equity.

## 3. Metrics a peer analyst would define differently

| Metric | Definition used in this report | How a peer would differ | Consequence |
|---|---|---|---|
| FCFA2S | Company definition: operating cash flow less interest, debt repayments, capex, taxes and amounts attributable to non controlling interests. Taken as reported from press releases and one substack (LTM). | Most analysts use FCF = CFO less capex, or levered FCF. FCFA2S is 62 percent of CFO in FY2025. | The 23.6x "P/FCF" is not comparable to any screen or to the 16.73x ycharts figure. Yield of 4.2 percent is conservative versus a CFO based yield near 6.8 percent. |
| Organic growth | Company definition, excludes acquisitions. Two series: reported and FX adjusted. Report uses reported (4 percent) for the base case anchor and FX adjusted (1 percent) for the bear case. | Constant currency organic is the standard series. Topicus 5 percent is reported; Lumine negative 2 percent is FX adjusted. | The peer table compares unlike series. Base case is anchored to the friendlier series. |
| Adjusted EBITA | Absent from the ledger for every period. Stage1 carries third party EBITDA (alphaquery, macrotrends) that was correctly not used. | Company's headline profit metric; analysts quote EV to adjusted EBITA. | No margin trend, no EV multiple, no historical EV comparison on a like basis. |
| Net debt | Total debt less cash. Debt from Yahoo, investing.com and a substack. Excludes the IRGA liability (1,186 at June 2026) and leases. | Many would add the IRGA liability and deferred acquisition consideration as debt like, giving net debt near 3,400 on the ledger's own Q2 figure. | Leverage described as "about one turn of LTM FCFA2S" would be 1.7x on a broader definition, and the Q2 2026 base figure is itself suspect (mismatch C). |
| Acquisitions cash spent | FY series is cash consideration; H1 2026 is total consideration including deferred. | One or the other, consistently. | See mismatch A. |
| Cash conversion | FCFA2S divided by net income attributable. | FCF to net income or FCF to EBITDA. Values above 3x here reflect amortization heavy net income, not cash quality. | The 3.93x to 1.26x drop is a valid signal about the Q2 2026 earnings jump but the ratio is unusual and will confuse a reader. |

## 4. The single assumption that flips the recommendation

The base case exit multiple of 25x, held as a permanent derating from today's 23.6x.

Numbers: with weights fixed at 0.30 / 0.50 / 0.20, base exit at 20x takes the expected IRR from 8.52 to 6.09 percent, below every hurdle, and the call is Not Buy for any investor. Base exit at 30x takes it to 10.6 percent; combine 30x with the corrected entry price near USD 2,064 (USDCAD 1.37) and the expected IRR is about 12.5 percent, which clears a 12 percent hurdle and the call becomes Buy. Growth cannot do this alone: at 25x, base growth of 5 percent gives 5.99 percent expected and even moving the bear weight from 0.30 to 0.10 only reaches 11.6 percent. Nothing in the ledger pre funds the exit multiple; H1 2026 deployment partly pre funds growth. That asymmetry is why the multiple, not growth, is the assumption to watch.

## 5. Open judgment calls returned to the human

1. **Hurdle rate.** At a 12 percent hurdle the stock is a Not Buy at any plausible entry price (8.5 to 10.9 percent expected). At an 8 percent hurdle it is a Buy at the corrected entry and a marginal Buy at the report's entry. Evidence for a high hurdle: first year President, ROIC on third party series near 11 percent, organic growth at 1 percent, no churn data. Evidence for a lower hurdle: 25.4 percent FCFA2S CAGR, flat share count, 14.5 percent FCFA2S margin with no erosion, multiple 25 to 40 percent below its own history.

2. **Entry price.** The report's USD 2,262.86 implies USDCAD 1.25. At a market rate near 1.36 the multiple is about 21.6x and every IRR is roughly two points higher. The human should pull a USDCAD rate and a same day USD market cap before acting on the 2.4 percent and 14.6 percent thresholds.

3. **Scenario weights (0.30 / 0.50 / 0.20).** Evidence for a heavier bear: organic 1 percent FX adjusted for two quarters, maintenance organic 6 to 4 to 2, Lumine negative 2 percent, Enghouse negative 5.8 percent, sector wide. Evidence for a lighter bear: Topicus at 5 percent organic, Descartes at 12 percent growth, FCFA2S up 57 percent in Q2 2026 year over year, CFO review of 900 units with no anomaly, private deal prices (DerbySoft at 4x revenue) not collapsing.

4. **Reported versus FX adjusted organic as the anchor.** The base case uses 4 percent reported; FX adjusted is 1 percent for the same period. If FX adjusted is the honest series, the base case organic assumption is three points too high and the 10 percent FCFA2S per share CAGR in the base needs more acquired growth to hold.

5. **Whether the historical derating applies.** The "37x undisrupted" figure comes from applying a P/CFO derating to a P/FCFA2S multiple, using stage1 ratios not in the ledger. Evidence for using it: two independent series (P/CF and EV/EBITDA) both show 25 to 40 percent below ten year medians. Evidence against: the median was earned at 4 to 5 percent organic; definitions differ; the growth that justified the median is gone.

6. **Net debt and balance sheet capacity.** Q2 2026 net debt of 2,200 may be a September 2025 figure. If the roll forward of about 1,400 is right, Risk 5 is overstated and capacity is larger. If 2,200 is right, leverage on a broad definition (adding the 1,186 IRGA liability) is near 1.7x LTM FCFA2S.

7. **The user thesis.** Evidence that VMS is not being replaced: maintenance dollars up 19 to 22 percent year over year, maintenance share rising, no disclosed attrition anomaly across 900 units, regulated systems of record. Evidence that the thesis is right but not the point: maintenance organic decaying 6 to 4 to 2, sector wide deceleration, pricing power the most exposed layer. The call depends on organic growth and the exit multiple far more than on whether an LLM replaces a permit system. The human should decide whether "not replaced" is enough, or whether "not repriced" is the bar.

8. **Leadership.** One year of Mark Miller. H1 2026 deployment shows the machine runs. Whether the hurdle discipline survives a full cycle without Leonard cannot be tested on two quarters. This is a pure judgment call with no ledger evidence either way.

## Files

- Review script: /tmp/claude-0/-home-user-Sample-R/d900b171-55a1-4299-b8b2-9c42f4366b00/scratchpad/check.py
- Inputs: /home/user/Sample_R/analysis/constellation-software/report.md, ledger.json, metrics.json, findings/*.md, stage1/*.json

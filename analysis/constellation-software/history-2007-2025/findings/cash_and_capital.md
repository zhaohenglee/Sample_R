# Cash and Capital: the three buckets, FY2007 to FY2025

Three buckets separate a cost from what leaves the building. Bucket 1 is never cash. Bucket 2 is timing. Bucket 3 is real cash that never touches the profit lines, which here is almost the whole story. One warning: two cash metrics run through this history, adjusted net income FY2009 to FY2017 and FCFA2S from FY2018, adopted with Q3 2019 results [event:2019-10-31:fcfa2s_introduced]. They are never joined. Every figure below is labelled by basis.

## Bucket 1: never cash

Amortization of acquired intangibles is the classic never cash charge and this ledger carries it for no year at all. The only figures in either report sit in the first report's stage1 intake: amortization of intangible assets of 860 in FY2023 and 1,044 in FY2024, USD millions [stage1:../stage1/fy2024.json:https://www.csisoftware.com/docs/default-source/press-releases/q4-2024-shareholder-report.pdf]. Both are the broader intangibles line, not the acquired subset, so treat them as an upper bound. Every other year is gap.

Those two years show the scale. FY2023 net income of 565 sat against CFO of 1,779 [hist:net_income_attributable:FY2023] [hist:cash_from_operations:FY2023], a difference of 1,214 the charge covers 70.8 percent of, computed here. FY2024 net income of 731 sat against CFO of 2,196 [hist:net_income_attributable:FY2024] [hist:cash_from_operations:FY2024], a difference of 1,465 it covers 71.3 percent of, computed here. In both years the charge exceeded reported profit, at 152.2 and 142.8 percent of net income, computed here.

The window confirms the pattern without naming its cause. Cash conversion, CFO over net income, was 2.37x in FY2013, 1.75x in FY2018 and 5.34x in FY2025 [hm:annual:cash_conversion_ratio:FY2013] [hm:annual:cash_conversion_ratio:FY2018] [hm:annual:cash_conversion_ratio:FY2025], never below 1.7x in any year with both inputs. Net margin was 4.6 percent in FY2007 and 4.4 in FY2025 [hm:annual:net_margin_pct:FY2007] [hm:annual:net_margin_pct:FY2025] against a FY2025 CFO margin of 23.5 percent [hm:annual:cfo_margin_pct:FY2025]. Net income is the wrong line here.

## Bucket 2: timing

This bucket is mostly gap and should be said plainly. Deferred revenue appears nowhere in the ledger for any of the nineteen years, and the first report recorded it as not found. There is no backlog series either. On a base that is majority maintenance and recurring, 5,985 in FY2023 and 7,396 in FY2024 [hist:maintenance_recurring_revenue:FY2023] [hist:maintenance_recurring_revenue:FY2024], renewal cash timing is untestable here.

Contingent consideration survives only as side notes on the acquisition line, on inconsistent bases. FY2013 cash of 558 excluded 27 of holdbacks and 4 of contingent consideration [hist:acquisitions_cash_spent:FY2013]; FY2014 of 115 excluded 17 and 8 [hist:acquisitions_cash_spent:FY2014]; FY2025 of 1,579 includes both [hist:acquisitions_cash_spent:FY2025]. FY2021 is an open conflict on that point, 1,337 against a broader 1,517 [hist:acquisitions_cash_spent:FY2021], and FY2019 the same, 688 of total consideration against 549 of cash [hist:acquisitions_cash_spent:FY2019].

The IRGA liability is the one large contingent item with a visible effect. FY2021 FCFA2S fell 106, or 11 percent, which the company attributed mainly to the TSS and IRGA membership liability revaluation charge and Topicus.com non controlling interests [hist:fcfa2s:FY2021]. No IRGA balance exists for any year FY2007 to FY2025. The only balances are the first report's, past this window: 1,234 at December 2025 falling to 1,186 at H1 2026 [ledger:unmapped:IRGA liability balance and revaluation:H1 2026, Dec 2025]. This bucket is one attributed but unquantified charge and nothing else.

## Bucket 3: cash outside the profit lines

Acquisitions are the real reinvestment. Column tags: cash metric [hist:adjusted_net_income:FY] to FY2017 then [hist:fcfa2s:FY], acquisitions [hist:acquisitions_cash_spent:FY], acquisitions to CFO [hm:annual:acquisitions_to_cfo_pct:FY], reinvestment rate [hm:reinvestment:reinvestment_rate_pct:FY], dividends [hm:annual:dividends_per_share_total:FY], last two [hm:annual:cash_after_acquisitions:FY] and [hm:annual:cash_after_acquisitions_and_dividends:FY]. USD millions except dividends.

| FY | Cash metric | Basis | Acquisitions | Acq to CFO % | Reinv rate % | Div/sh | After acq | After acq and div |
|---|---|---|---|---|---|---|---|---|
| 2007 | gap | gap | gap | gap | gap | gap | gap | gap |
| 2008 | gap | gap | 94 | gap | gap | gap | gap | gap |
| 2009 | 62 | adj net income | gap | gap | gap | gap | gap | gap |
| 2010 | gap | gap | gap | gap | gap | 2.00 CAD | gap | gap |
| 2011 | 140 | adj net income | gap | gap | gap | 2.00 CAD | gap | gap |
| 2012 | 172 | adj net income | gap | gap | gap | 4.00 | gap | gap |
| 2013 | 207 | adj net income | 558 | 253.64 | 269.57 | 4.00 | -351 | -435.76 |
| 2014 | 274.3 | adj net income | 115 | 33.72 | 41.92 | 4.00 | 159.3 | 74.54 |
| 2015 | 371 | adj net income | 248.8 | 62.84 | 67.06 | 4.00 | 122.2 | 37.44 |
| 2016 | 395.0 | adj net income | 178.1 | 36.27 | 45.09 | 4.00 | 216.9 | 132.14 |
| 2017 | 463 | adj net income | gap | gap | gap | 4.00 | gap | gap |
| 2018 | 559 | FCFA2S | 603 | 91.09 | 107.87 | 24.00 | -44 | -552.56 |
| 2019 | 590 | FCFA2S | 688 | 97.18 | 116.61 | 4.00 | -98 | -182.76 |
| 2020 | 989 | FCFA2S | 179 | 15.09 | 18.10 | 4.00 | 810 | 725.24 |
| 2021 | 883 | FCFA2S | 1,337 | 102.85 | 151.42 | 4.00 | -454 | -538.76 |
| 2022 | 853 | FCFA2S | 1,600 | 123.36 | 187.57 | 4.00 | -747 | -831.76 |
| 2023 | 1,160 | FCFA2S | 732 | 41.15 | 63.10 | 4.00 | 428 | 343.24 |
| 2024 | 1,472 | FCFA2S | 1,792 | 81.60 | 121.74 | 4.00 | -320 | -404.76 |
| 2025 | 1,683 | FCFA2S | 1,579 | 57.80 | 93.82 | 4.00 | 104 | 19.24 |

Four dividend years are derived, not company sourced: FY2012, FY2016, FY2017, FY2021 [hist:dividends_per_share_regular:FY2012] [hist:dividends_per_share_regular:FY2016] [hist:dividends_per_share_regular:FY2017] [hist:dividends_per_share_regular:FY2021]. FY2020 and FY2022 acquisitions are third party [hist:acquisitions_cash_spent:FY2020] [hist:acquisitions_cash_spent:FY2022].

Three things fall out. The regular dividend is trivial: fixed at USD 4.00 a share since FY2012 [hm:annual:dividends_per_share_total:FY2025] on a share count unchanged at 21.19 million [hist:shares_outstanding:FY2025], it costs 84.76 a year, computed here, against FY2025 FCFA2S of 1,683. It is a retention policy dressed as a dividend.

The one special dividend proves the point. USD 20.00 a share was declared 14 February 2019 with FY2018 results and paid 5 April 2019, the company saying it held capital in excess of its needs [event:2019-02-14:special_dividend]. The ledger books it to FY2018, so that column reads 24.00, or 508.56 of cash, computed here from 24.00 and 21.19 million shares. It is the only special found across all five intake sweeps, a confirmed absence elsewhere rather than a search failure [hist:dividends_per_share_special:FY2018]. Excess capital was returned once in twenty years.

Cash after acquisitions and dividends was negative in six of the twelve computable years: FY2013, FY2018, FY2019, FY2021, FY2022 and FY2024 [hm:annual:cash_after_acquisitions_and_dividends:FY2013] [hm:annual:cash_after_acquisitions_and_dividends:FY2018] [hm:annual:cash_after_acquisitions_and_dividends:FY2019] [hm:annual:cash_after_acquisitions_and_dividends:FY2021] [hm:annual:cash_after_acquisitions_and_dividends:FY2022] [hm:annual:cash_after_acquisitions_and_dividends:FY2024]. Seven years cannot be computed, FY2007 to FY2012 and FY2017. Worst was FY2022 at negative 831.76, best FY2020 at positive 725.24 [hm:annual:cash_after_acquisitions_and_dividends:FY2020]. Spending past the year's own cash in half the measurable years means debt and vendor paper fund the difference: TSS in FY2013 came with a one year USD 350 million term loan [event:2013-12-16:acquisition_above_100m], and the FY2023 Black Knight purchase used 200 of cash plus a 500 promissory note [event:2023-09-15:acquisition_above_100m].

## The compounding arithmetic

Per share growth equals reinvestment rate times return on what is deployed. Era average reinvestment, as acquisitions to CFO, was gap for FY2007 to FY2011, then 96.62, 76.55 and 75.98 percent across the three later eras, and 83.05 percent full window [hm:eras:avg_acquisitions_to_cfo_pct:Scaling and returning capital] [hm:eras:avg_acquisitions_to_cfo_pct:Larger deals and looser hurdles] [hm:eras:avg_acquisitions_to_cfo_pct:Big deals and succession] [hm:eras:avg_acquisitions_to_cfo_pct:Full window]. Reinvestment has fallen era by era on this measure.

The return term is the problem. ROIC is on file for two years only, 24 percent in FY2009 and 25 percent in FY2010, both from President's letters [hist:roic_pct:FY2009] [hist:roic_pct:FY2010]. Neither year has an acquisition figure, so implied per share growth is null for all nineteen years [hm:reinvestment:implied_per_share_growth_pct:FY2009] [hm:reinvestment:implied_per_share_growth_pct:FY2013]. The identity cannot be closed from primary sources in any single year of this history.

Run against the realised cash metric per share CAGR it shows what the record would have needed. Columns are [hm:eras:avg_acquisitions_to_cfo_pct:<era>] and [hm:eras:cash_metric_per_share_cagr_pct:<era>]; implied return is CAGR divided by reinvestment rate, computed here in each row.

| Era | Avg reinvestment % | Realised per share CAGR % | Basis | Implied return % |
|---|---|---|---|---|
| FY2007 to FY2011 | gap | gap | gap | gap |
| FY2012 to FY2016 | 96.62 | 23.10 | adj net income | 23.91 |
| FY2017 to FY2021 | 76.55 | 17.52 | mixed, invalid | 22.89 |
| FY2022 to FY2025 | 75.98 | 25.42 | FCFA2S | 33.46 |
| Full window | 83.05 | gap | gap | gap |

Two cautions. The FY2017 to FY2021 row is not usable: its CAGR runs from adjusted net income of 463 to FCFA2S of 883, and the metrics file nulls the aggregate version of the same sum for that reason [hm:eras:cash_metric_cagr_pct:Larger deals and looser hurdles] [hm:eras:cash_metric_per_share_cagr_pct:Larger deals and looser hurdles]. It is shown to mark the trap. The full window row is uncomputable, there being no FY2007 cash metric [hm:eras:cash_metric_per_share_cagr_pct:Full window].

One cross check is suggestive, not proof. The FY2009 ROIC of 24 percent applied to the FY2012 to FY2016 reinvestment rate of 96.62 percent implies 23.19 percent per share growth, computed here, against 23.10 percent realised on the adjusted net income basis. The fit is close enough to notice and is a coincidence, the return being from a different era. On the full window rate of 83.05 percent the same 24 percent implies 19.93 percent, computed here, with no realised CAGR to test it.

The later record points the other way. The first report has the company's own reinvestment rate falling from 154.5 percent in 2023 to 114.3 in 2024 to 89.9 in 2025 [ledger:unmapped:Reinvestment rate:2023, 2024, 2025], and ROIC falling from 14.8 percent in 2025 to 10.97 at June 2026 on third party definitions [ledger:unmapped:ROIC:2025, June 2026, TTM 2026]. Those reused figures imply roughly 10 to 13 percent per share growth, computed here, against low twenties at a 24 percent return. That is the distance between the engine of 2010 and the engine now.

## What the record says about the engine

It is an acquisition engine, not a profit engine. Reported profit is the least informative line in the file: amortization exceeded net income in both years it can be measured. Reinvestment at 83.05 percent of CFO is the machine [hm:eras:avg_acquisitions_to_cfo_pct:Full window], and its output was 23.10 percent per share compounding FY2012 to FY2016 and 25.42 percent FY2022 to FY2025 [hm:eras:cash_metric_per_share_cagr_pct:Scaling and returning capital] [hm:eras:cash_metric_per_share_cagr_pct:Big deals and succession], with no valid measurement of the decade between.

What the record does not support is that the compounding is self funded. Six of twelve measurable years spent past their own cash after a token dividend, and the two largest deals were funded with a term loan and a promissory note. The engine runs on reinvestment plus balance sheet, and the return term that would say whether it still works was disclosed twice in nineteen years, both before 2011.

## Gaps

- Amortization of acquired intangibles is gap for all nineteen years. The only figures, FY2023 and FY2024, come from the first report's stage1 and are the broader intangibles line.
- Deferred revenue and backlog are gap for every year in both reports. The timing bucket is essentially untested.
- Contingent consideration and holdbacks appear only as inconsistent side notes, with FY2019 and FY2021 carrying unresolved cash versus total consideration conflicts.
- No IRGA balance exists for any year in this window, only the FY2021 attribution and post window balances from the first report.
- ROIC exists for FY2009 and FY2010 only, so implied per share growth is null for all nineteen years and the identity cannot be closed from primary sources.
- Acquisitions are gap for FY2007, FY2009 to FY2012 and FY2017, so cash after acquisitions and the reinvestment rate are uncomputable in six years. CFO is gap for FY2007, FY2008 and FY2010 to FY2012.
- Capex is third party for FY2023 and FY2024 only, 68 and 72 [hist:capex:FY2023] [hist:capex:FY2024], so free cash flow cannot be built independently of the company's own FCFA2S.
- Year end share prices are gap for every year, so none of this ties to shareholder return, which rests on the IPO price and third party aggregates only.

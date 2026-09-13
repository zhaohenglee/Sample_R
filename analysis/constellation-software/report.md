# Constellation Software: Buy or Not Buy

## Executive Summary

Verdict: Not Buy

Applies to CAD 2,827.94 on September 11, 2026, taken as USD 2,262.86 and 23.6 times trailing FCFA2S [metrics:scenario_inputs:current_multiple_price_to_fcfa2s].

It flips to Buy if the price falls to about CAD 2,415, where the weighted five year IRR clears 12 percent, or if two consecutive quarters show FX adjusted organic growth at or above 3 percent and maintenance organic at or above 4 percent. If your hurdle is 8 to 10 percent rather than 12, the current price already pays it and the call is Buy.

Reasons that carry the call

1. The price pays a market return for an open question. The weighted five year IRR is 8.5 percent: bear negative 4.1 percent [metrics:scenario_grid:growth 0.05 exit 15x], base 11.3 percent [metrics:scenario_grid:growth 0.10 exit 25x], bull 20.6 percent [metrics:scenario_grid:growth 0.15 exit 30x]. Not enough for a first year President and a live disruption debate.

2. Organic growth is near zero. FX adjusted organic growth was 1 percent in Q2 2026 and H1 2026 [ledger:organic_growth_fx_adj_pct:Q2 2026] [ledger:organic_growth_fx_adj_pct:H1 2026], down from 4 percent a year earlier [ledger:organic_growth_fx_adj_pct:Q2 2025]. At zero growth and a 25 times exit the grid returns 1.1 percent a year [metrics:scenario_grid:growth 0.0 exit 25x].

3. Deployment is up, measured returns are down. Q2 2026 acquisitions ran 2.12 times FCFA2S [metrics:acquisitions_to_fcfa2s:Q2 2026] while third party ROIC fell from 14.8 to 10.97 percent. Reported growth of 18.5 percent [metrics:revenue_growth_yoy:H1 2026] is bought.

4. Cash is strong, which is why this is close. FCFA2S compounded at 25.4 percent a year [metrics:fcfa2s_cagr_3yr:FY2022-FY2025], margin held at 14.5 percent [metrics:fcfa2s_margin:FY2025], and the maintenance share rose to 76.6 percent [metrics:maintenance_share_of_revenue:H1 2026]. The call flips on price, not the business.

Your thesis

The evidence supports the narrow claim. Nothing in the numbers looks like an LLM replacing a system of record. Maintenance dollars grew 22.2 percent in Q1 2026 [metrics:maintenance_growth_yoy:Q1 2026], the share keeps rising, and the CFO's review of 900 units found no attrition anomaly.

But the evidence is thinner than the report reads. No churn, retention, seat or price versus volume figure exists in any file. The thesis is unfalsified, not proven. And it aims at the wrong risk. Maintenance organic growth ran 6, 4, 2 percent over the last three quarters (stage1 only). That is pricing power leaking while nobody switches vendor, and Lumine at negative 2 percent and Enghouse at negative 5.8 percent show it is sector wide. Replacement is largely priced in. Organic growth settling near 1 percent is not. That, not Claude, decides this stock.

One caveat: the USD entry price implies USDCAD of 1.25. At 1.36 the multiple is about 21.6 times and the weighted IRR about 10.5 percent. The verdict holds with less margin.

### Post review corrections

The Fable 5.1 review found that the USD entry price in the valuation section was derived from a USD market cap that implies a USDCAD rate of 1.25 [metrics:post_review:implied_usdcad_in_report_entry]. No direct exchange rate could be fetched, so Stage 2 added a rate of 1.36 derived from two third party market caps [ledger:usdcad:2026-09] and Stage 3 recomputed the valuation across a range of rates. Nothing below was calculated by a model.

| USDCAD | Entry price USD | Multiple of LTM FCFA2S | Expected 5 year IRR | Buy price for 12 percent, CAD | Price where IRR falls under 8 percent, CAD |
|---|---|---|---|---|---|
| 1.25 (as in the report) | 2,262 | 23.6x | 8.5% | 2,416 | 2,897 |
| 1.36 (derived) | 2,080 | 21.7x | 10.4% | 2,627 | 3,151 |
| 1.40 | 2,020 | 21.1x | 11.0% | 2,705 | 3,245 |

All rows from [metrics:post_review:fx_sensitivity]. The verdict does not change at any rate in the range: the expected return stays below 12 percent and above 8 percent. At the derived rate the Buy line moves from about CAD 2,415 to about CAD 2,627, roughly 7 percent below the September 11 price, and the current price sits about 11 percent below the level where the expected return drops under 8 percent.

Three other review findings were corrected in the body: H1 2026 acquisition spend is now stated on the cash basis used for every other period, the trailing P/E is now on last twelve month earnings, and the Q2 2026 net debt figure is shown as a range because the source balance sheet may be a September 2025 snapshot.

## The Question and the User Thesis

The question is simple to state and hard to answer. Should an investor buy Constellation Software (TSX: CSU, OTC: CNSWF) at the current price, and under what conditions would that call flip. The user's thesis, formed from direct industry experience deploying AI, is that sector specific vertical market software (VMS) will not be replaced by Claude or other large language model systems. This report tests that thesis against the ledger rather than assuming it. It asks whether organic growth or attrition is deteriorating in a way consistent with AI substitution, which parts of the VMS moat an LLM actually erodes, whether the market has already priced disruption into the multiple, and whether the acquisition engine still compounds if VMS multiples compress.

The honest answer up front. The thesis largely survives on the evidence available, but the data needed to prove it decisively, churn, retention, and seat counts, does not exist in the ledger. What the numbers do show is a broad, sector wide deceleration in organic growth that is consistent with AI pressure on pricing and services revenue, even where it is not consistent with outright substitution of systems of record.

## Company Snapshot

Constellation Software acquires and operates vertical market software businesses, reporting in USD with a December 31 fiscal year end. Revenue grew from 6,622 in FY2022 to 8,407 in FY2023 to 10,066 in FY2024 to 11,623 in FY2025, all USD millions [ledger:revenue:FY2022] [ledger:revenue:FY2023] [ledger:revenue:FY2024] [ledger:revenue:FY2025]. The three year revenue CAGR to FY2025 is 20.6 percent [metrics:revenue_cagr_3yr:FY2022-FY2025]. The stock trades at CAD 2,827.94 as of September 11, 2026 [ledger:share_price_cad:2026-09-11], with a market capitalization of USD 47,950 million [ledger:market_cap_usd:2026-09]. Mark Leonard resigned as President on September 25, 2025, with Mark Miller appointed the same day, and Leonard did not stand for re election to the board in May 2026. Capital allocation discipline is now running through a new leader for the first time in the company's history, untested through a full cycle.

## Financial Performance

Revenue growth stepped down every year from FY2023 through FY2025, then reaccelerated on the reported line in 2026, though that reacceleration was bought through acquisition rather than earned organically.

| Line item (USD millions unless noted) | FY2023 | FY2024 | FY2025 | H1 2025 | H1 2026 |
|---|---|---|---|---|---|
| Revenue | 8,407 [ledger:revenue:FY2023] | 10,066 [ledger:revenue:FY2024] | 11,623 [ledger:revenue:FY2025] | 5,498 [ledger:revenue:H1 2025] | 6,516 [ledger:revenue:H1 2026] |
| Maintenance and recurring revenue | 5,985 [ledger:maintenance_recurring_revenue:FY2023] | 7,396 [ledger:maintenance_recurring_revenue:FY2024] | n/a (gap) | n/a (gap) | 4,994 [ledger:maintenance_recurring_revenue:H1 2026] |
| Net income attributable | 565 [ledger:net_income_attributable:FY2023] | 731 [ledger:net_income_attributable:FY2024] | 512 [ledger:net_income_attributable:FY2025] | 192 [ledger:net_income_attributable:H1 2025] | 641 [ledger:net_income_attributable:H1 2026] |
| Cash from operations | 1,779 [ledger:cash_from_operations:FY2023] | 2,196 [ledger:cash_from_operations:FY2024] | 2,732 [ledger:cash_from_operations:FY2025] | 1,260 [ledger:cash_from_operations:H1 2025] | 1,374 [ledger:cash_from_operations:H1 2026] |
| FCFA2S | 1,160 [ledger:fcfa2s:FY2023] | 1,472 [ledger:fcfa2s:FY2024] | 1,683 [ledger:fcfa2s:FY2025] | n/a (gap) | n/a (gap) |
| Acquisitions cash spent | 732 [ledger:acquisitions_cash_spent:FY2023] | 1,792 [ledger:acquisitions_cash_spent:FY2024] | 1,579 [ledger:acquisitions_cash_spent:FY2025] | n/a | 1,429 [ledger:acquisitions_cash_spent:H1 2026] |

| Key metric | FY2023 | FY2024 | FY2025 | H1 2026 |
|---|---|---|---|---|
| Revenue growth YoY | 27.0% [metrics:revenue_growth_yoy:FY2023] | 19.7% [metrics:revenue_growth_yoy:FY2024] | 15.5% [metrics:revenue_growth_yoy:FY2025] | 18.5% [metrics:revenue_growth_yoy:H1 2026] |
| Organic growth (reported) | 5% [ledger:organic_growth_pct:FY2023] | 2% [ledger:organic_growth_pct:FY2024] | 4% [ledger:organic_growth_pct:FY2025] | 4% [ledger:organic_growth_pct:H1 2026] |
| Organic growth (FX adjusted) | n/a | n/a | 3% [ledger:organic_growth_fx_adj_pct:FY2025] | 1% [ledger:organic_growth_fx_adj_pct:H1 2026] |
| Maintenance share of revenue | 71.2% [metrics:maintenance_share_of_revenue:FY2023] | 73.5% [metrics:maintenance_share_of_revenue:FY2024] | n/a (gap) | 76.6% [metrics:maintenance_share_of_revenue:H1 2026] |
| Net margin | 6.7% [metrics:net_margin:FY2023] | 7.3% [metrics:net_margin:FY2024] | 4.4% [metrics:net_margin:FY2025] | 9.8% [metrics:net_margin:H1 2026] |
| CFO margin | 21.2% [metrics:cfo_margin:FY2023] | 21.8% [metrics:cfo_margin:FY2024] | 23.5% [metrics:cfo_margin:FY2025] | 21.1% [metrics:cfo_margin:H1 2026] |
| FCFA2S margin | 13.8% [metrics:fcfa2s_margin:FY2023] | 14.6% [metrics:fcfa2s_margin:FY2024] | 14.5% [metrics:fcfa2s_margin:FY2025] | n/a (gap) |

Organic growth is the number that matters most and it is soft. Inside 2026 it deteriorated further on an FX adjusted basis, 2 percent in Q1 2026 down to 1 percent in Q2 2026 [ledger:organic_growth_fx_adj_pct:Q1 2026] [ledger:organic_growth_fx_adj_pct:Q2 2026], against 4 percent in Q2 2025 [ledger:organic_growth_fx_adj_pct:Q2 2025]. Currency is doing roughly two points of work in the headline organic print. Net margin is a poor read here because acquired intangible amortization and one off items distort it. The Q2 2026 jump in net income, from 56 to 274 [ledger:net_income_attributable:Q2 2025] [ledger:net_income_attributable:Q2 2026], is mostly currency and an IRGA liability revaluation, not operating improvement. Cash conversion, FCFA2S over net income, fell from 3.93 times in Q2 2025 to 1.26 times in Q2 2026 [metrics:cash_conversion:Q2 2025] [metrics:cash_conversion:Q2 2026], confirming the earnings jump is largely non cash. FCFA2S itself is the honest line: it grew from 220 to 345 in the same quarters [ledger:fcfa2s:Q2 2025] [ledger:fcfa2s:Q2 2026], and compounded at 25.4 percent annually over three years [metrics:fcfa2s_cagr_3yr:FY2022-FY2025], ahead of the 20.6 percent revenue CAGR [metrics:revenue_cagr_3yr:FY2022-FY2025]. Adjusted EBITA and capex are absent from the ledger for every period, so the company's own preferred margin metric cannot be trended here.

## Capital Allocation Engine

Constellation is fundamentally an acquisition machine, and that machine sped up in 2026 even as its measured returns fell. Acquisition cash deployed ran 732 in FY2023, 1,792 in FY2024, and 1,579 in FY2025 [ledger:acquisitions_cash_spent:FY2023] [ledger:acquisitions_cash_spent:FY2024] [ledger:acquisitions_cash_spent:FY2025], against FCFA2S ratios of 0.63x, 1.22x, and 0.94x [metrics:acquisitions_to_fcfa2s:FY2023] [metrics:acquisitions_to_fcfa2s:FY2024] [metrics:acquisitions_to_fcfa2s:FY2025]. H1 2026 cash deployment was 1,429, already 90.5 percent of the FY2025 total in half a year [ledger:acquisitions_cash_spent:H1 2026] [metrics:post_review:acquisitions_h1_2026_cash_vs_fy2025], or 1,702 including deferred consideration [metrics:post_review:acquisitions_h1_2026_total_consideration], with Q2 2026 cash spending 2.12 times that quarter's FCFA2S [metrics:acquisitions_to_fcfa2s:Q2 2026]. The engine is not short of targets or capital.

What is less clear is whether it still compounds at historical rates. Third party ROIC figures fell from 14.8 percent in 2025 to 10.97 percent by June 2026, per stage1 sourcing carried forward in the ledger's unmapped section, against a stated 25 percent IRR hurdle rate. The two figures come from different providers with different definitions, so the direction is more reliable than the size of the drop. The company's own reinvestment rate fell from 154.5 percent in 2023 to 114.3 percent in 2024 to 89.9 percent in 2025. Nearly all of 2026's headline growth is acquired rather than organic: 18.5 percent reported H1 revenue growth sat on only 1 percent FX adjusted organic growth [metrics:revenue_growth_yoy:H1 2026] [ledger:organic_growth_fx_adj_pct:H1 2026]. The balance sheet still has room. Net debt was 980 at Q1 2026 [metrics:net_debt:Q1 2026]. The Q2 2026 source balance sheet gives 2,200 [metrics:net_debt:Q2 2026], but that balance sheet matches a September 2025 snapshot and may be stale; a roll forward from Q1 gives about 1,388 [metrics:post_review:net_debt_rollforward]. Against LTM FCFA2S of 2,030 [ledger:fcfa2s:LTM to Q2 2026] either figure is around one turn of leverage or less, not a constraint, though adding the IRGA liability would lift the broader measure. Share count has been flat at 21.19 million from FY2023 through Q2 2026 [ledger:shares_outstanding:FY2023] [ledger:shares_outstanding:Q2 2026], so all per share growth is operational, not financial engineering. The dividend has been fixed at 4.00 per share since FY2022, a 5.0 percent payout of FCFA2S in FY2025 [metrics:dividend_payout_of_fcfa2s:FY2025], a retention policy rather than an income signal.

If VMS multiples compress permanently, the engine still runs, since it buys at private market multiples largely independent of CSU's own public multiple. The risk is not that the engine stops buying, it is that it buys more at lower forward returns, which is exactly the pattern in the ROIC and reinvestment rate data above.

## AI Disruption: Testing the Thesis

Nothing in the ledger looks like substitution of a system of record. The maintenance and recurring revenue base, the part of the business an LLM would need to displace to prove the bear case, has been rising as a share of total revenue, not falling: from 71.2 percent in FY2023 to 73.5 percent in FY2024 to 76.6 percent in H1 2026 [metrics:maintenance_share_of_revenue:FY2023] [metrics:maintenance_share_of_revenue:FY2024] [metrics:maintenance_share_of_revenue:H1 2026]. Maintenance grew 23.6 percent year over year in FY2024 and 22.2 percent in Q1 2026 [metrics:maintenance_growth_yoy:FY2024] [metrics:maintenance_growth_yoy:Q1 2026]. A revenue base being displaced by AI agents does not typically rise as a share of the whole. Cash conversion tells the same story: FCFA2S margin held flat to mildly up across the whole period, 12.9 percent in FY2022 to 14.5 percent in FY2025 [metrics:fcfa2s_margin:FY2022] [metrics:fcfa2s_margin:FY2025], with no visible erosion.

Breaking the VMS moat into its components changes the picture. The system of record and regulatory data component looks essentially unthreatened on any near term horizon, since regulators do not accept a probabilistic layer as the authoritative copy of a permit file or clinical record. The embedded workflow and integration component looks partly eroded, on a three to seven year horizon, since agents are well suited to the integration and data movement work vendors currently bill as professional services, meaning the license and services line could get hollowed out before maintenance does. Switching cost and customer inertia look least eroded, since agents lower the cost of building a replacement system but not the cost of migrating a regulated customer off a running one. Pricing power looks most exposed and on the shortest horizon, two to five years, since maintenance organic growth here is substantially a price line, and a customer who can point to an AI agent and argue the software is now worth less can compress escalators even without switching vendors. Small niches with no venture backed competition look genuinely at risk on a medium horizon, since collapsing build costs could let small funded teams enter markets previously too thin to support competition, though acquisition prices have not yet collapsed in a way that would signal the market is pricing this in.

The strongest case against the thesis is that this deceleration is not company specific. Lumine ran 0 percent organic growth in Q1 2026 and negative 2 percent on an FX adjusted basis [peer:LMN:Q1 2026 organic growth fx-adj], and Enghouse revenue fell 5.8 percent year over year in H1 2026 [peer:ENGH:H1 2026 revenue growth yoy]. Three VMS names decelerating together looks like a sector signal rather than a Constellation specific execution problem, and it is consistent with a scenario where the thesis is right about no direct substitution but wrong about what matters, because value can leak through price and growth compression without any single customer switching software.

The most important gap in the data is this: no churn rate, retention figure, seat count, or price versus volume split exists anywhere in metrics.json or ledger.json. That is the single most diagnostic number for this question, and its absence means neither side of the thesis can be proven conclusively from what is available here. A probability weighted judgment, not derived from the ledger, puts roughly 60 percent odds on the thesis holding in its literal form through 2031, roughly 30 percent on it holding literally but failing economically as pricing power erodes, and roughly 10 percent on agents taking real share in the thinnest niches.

## Valuation and Scenarios

The entry price is derived as USD 2,262.86 per share, market capitalization divided by shares outstanding, since no USD share price or USDCAD rate existed in the ledger when this section was drafted [metrics:valuation:implied_share_price_usd] [ledger:share_price_cad:2026-09-11]. The review found this implies a rate of 1.25; the post review corrections under the executive summary restate the valuation at a derived rate of 1.36, which lowers the entry to about USD 2,080 and lifts the expected return to about 10.4 percent without changing the verdict. That price buys LTM FCFA2S per share of 95.80 [metrics:scenario_inputs:current_fcfa2s_per_share], meaning 23.62 times free cash flow available to shareholders [metrics:scenario_inputs:current_multiple_price_to_fcfa2s] and a 4.2 percent cash yield [metrics:valuation:fcfa2s_yield]. The trailing P/E is 49.9 times on last twelve month net income of 961 [metrics:post_review:pe_trailing_ltm] [metrics:post_review:net_income_ltm], or 93.7 times on FY2025 alone [metrics:valuation:pe_trailing]. Neither is usable, since FY2025 earnings were depressed and H1 2026 earnings were inflated by FX and IRGA gains. No EV multiple can be built at all, since the ledger's only enterprise value figure is CAD denominated with no conversion rate available.

The three scenario cases sit on a computed five year IRR grid with growth and exit multiple as the two axes.

| Case | FCFA2S per share CAGR | Exit multiple | 5 year IRR | Probability |
|---|---|---|---|---|
| Bear | 5% | 15x | negative 4.12% [metrics:scenario_grid:growth 0.05 exit 15x] | 0.30 |
| Base | 10% | 25x | 11.26% [metrics:scenario_grid:growth 0.10 exit 25x] | 0.50 |
| Bull | 15% | 30x | 20.63% [metrics:scenario_grid:growth 0.15 exit 30x] | 0.20 |

Full IRR grid (five year IRR by FCFA2S CAGR and exit multiple):

| Growth | 15x | 20x | 25x | 30x | 35x |
|---|---|---|---|---|---|
| 0% | -8.68% | -3.27% | 1.14% | 4.90% | 8.18% |
| 5% | -4.12% | 1.56% | 6.20% | 10.14% | 13.59% |
| 10% | 0.45% | 6.40% | 11.26% | 15.39% | 19.00% |
| 15% | 5.02% | 11.24% | 16.31% | 20.63% | 24.41% |
| 20% | 9.58% | 16.07% | 21.37% | 25.88% | 29.82% |

All grid values are read directly from metrics.json [metrics:scenario_grid]. Probability weighting these three cases gives an expected five year IRR of 8.52 percent, arithmetic performed here on the cited grid cells and judgment weights, not a stored metric. That sits below a 12 percent hurdle and only barely above an 8 percent one. The assumption that moves the call most is the exit multiple, not growth: at 25x, moving growth from 5 to 15 percent is worth 10.1 points of IRR, while at 10 percent growth, moving the exit multiple from 20x to 30x is worth 9.0 points. Since H1 2026's 1,429 in cash acquisition spending is capital already deployed and will show up in 2027 and 2028 FCFA2S, base case growth is partly pre funded, while nothing pre funds the exit multiple. Holding the three cases and weights fixed, the expected IRR clears 12 percent below roughly USD 1,932, about 14.6 percent under the current price, and falls under 8 percent above roughly USD 2,318, about 2.4 percent over the current price. The stock sits inside a narrow band: a small further rally kills the 8 percent case, while only a meaningful drawdown, roughly 15 percent, is needed to make it pay 12 percent.

Against its own trading history, and using stage1 sourcing not carried into the ledger, price to cash flow of 16.73 sits about 36 percent below a ten year median of 26.17, and EV to EBITDA of 13.43 to 16.89 sits 25 to 40 percent below a ten year median of 22.48. Applying a similar derating to today's 23.62 times FCFA2S implies an undisrupted level near 37 times, above the top of the grid axis used here. That suggests a large part of the AI disruption case is already priced in, and the base case's 25x exit already assumes much of that derating is permanent rather than temporary.

## Peer Comparison

Peer coverage is incomplete. Roper Technologies, Tyler Technologies, and Open Text have no data retrieved at all, per stage1 WebSearch budget exhaustion [peer:ROP:status]. No peer market multiple can be computed against CSU's own multiple, since Topicus reports in EUR with no conversion rate, and Lumine, Descartes, and Enghouse have no market capitalization figures in the ledger at all. The comparison below is therefore operational only, not valuation based.

| Peer | Growth metric | Value | Margin metric | Value |
|---|---|---|---|---|
| Constellation Software (CSU) | H1 2026 organic growth | 4% [ledger:organic_growth_pct:H1 2026] | H1 2026 net margin | 9.8% [metrics:net_margin:H1 2026] |
| Topicus.com (TOI) | H1 2026 organic growth | 5% [peer:Topicus.com (TOI):H1 2026 organic growth] | n/a | n/a |
| Lumine Group (LMN) | Q1 2026 organic growth (FX adj) | -2% [peer:Lumine Group (LMN):Q1 2026 organic growth fx-adj] | n/a | n/a |
| Descartes Systems (DSG) | FY2026 revenue growth | 12% [peer:Descartes Systems (DSG):FY2026 revenue growth yoy] | Adjusted EBITDA margin | 45.2% [metrics:peers:Descartes Systems (DSG):FY2026 adjusted_ebitda_margin] |
| Enghouse Systems (ENGH) | H1 2026 revenue growth | -5.8% [peer:Enghouse Systems (ENGH):H1 2026 revenue growth yoy] | Q2 2026 adjusted EBITDA margin | 23.2% [metrics:peers:Enghouse Systems (ENGH):Q2 2026 adjusted_ebitda_margin] |

CSU sits in the middle of this operational spread. Topicus and CSU show similar low single digit organic growth, Lumine and Enghouse are outright contracting, and Descartes is the outlier growing at double digits with a materially higher margin profile. The dispersion across peers argues against a uniform sector wide collapse and toward differentiated exposure to AI and macro pressure, which cuts against reading CSU's deceleration as proof of disruption specific to Constellation.

## Key Risks

The most direct risk is organic growth continuing to fall toward zero. FX adjusted organic growth was already 1 percent for both Q2 2026 and H1 2026 [ledger:organic_growth_fx_adj_pct:H1 2026], and at 23.6 times FCFA2S the current price assumes some recovery from that level; the grid shows a five year IRR of only 1.1 percent at zero growth and a 25x exit. Second, returns are falling faster than deployment is rising: reported ROIC fell from 14.8 percent to 10.97 percent while H1 2026 cash acquisition spending hit 1,429, meaning the company may be deploying more capital at lower marginal returns, which breaks the compounding math faster than deploying less would. Third, currency is doing real work in the recent numbers, roughly two points of Q2 2026 organic growth and much of the reported net income jump are FX related, and both effects unwind if the US dollar strengthens against CAD and other currencies. Fourth, valuation risk currently exceeds operating risk at this price: a permanent derating to a 15x exit multiple produces a negative IRR even at 5 percent growth, and the exit multiple assumption, not the growth assumption, is the single most powerful lever on the outcome. Fifth, leadership and balance sheet risk compound each other: net debt rose from 980 to somewhere between about 1,390 and 2,200 in a single quarter under a President who has been in the role under a year, and while leverage remains manageable at roughly one turn of LTM FCFA2S, a faster acquisition pace paired with falling ROIC and an untested new allocator is a real tail risk. Sixth, and specific to the user's thesis, pricing power in maintenance contracts is the most exposed part of the moat on the shortest horizon, and the ledger cannot currently distinguish ordinary budget pressure from AI driven pricing compression, since no churn, retention, or price versus volume data exists anywhere in the underlying files.

## Sources and Data Limitations

Data limitations, copied from brief.json: Network policy in this environment allows WebSearch only. Filing PDFs, the company site, SEDAR+ and news sites cannot be fetched. Figures come from press release text and financial data sites as surfaced in search results. Each figure must carry its source URL. Ten spot checks are traced to those source records instead of filing pages.

Source URLs used across ledger.json and findings, deduplicated:

- https://www.globenewswire.com/news-release/2024/03/06/2841834/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2023-and-Declares-Quarterly-Dividend.html
- https://www.csisoftware.com/constellation-software-inc-announces-results-for-the-fourth-quarter-and-year-ended-december-31-2024-and-declares-quarterly-dividend/
- https://www.globenewswire.com/news-release/2026/03/09/3251696/0/en/constellation-software-inc-announces-results-for-the-fourth-quarter-and-year-ended-december-31-2025-and-declares-quarterly-dividend.html
- https://finance.yahoo.com/news/constellation-software-first-quarter-2025-135734558.html
- https://seekingalpha.com/pr/20100772-constellation-software-inc-announces-results-for-the-first-quarter-ended-march-31-2025-and
- https://www.csisoftware.com/constellation-software-inc-announces-results-for-the-first-quarter-ended-march-31-2026-and-declares-quarterly-dividend/
- https://www.globenewswire.com/news-release/2026/08/11/3343207/0/en/constellation-software-inc-announces-results-for-the-second-quarter-ended-june-30-2026-and-declares-quarterly-dividend.html
- https://www.csisoftware.com/constellation-software-inc-announces-results-for-the-second-quarter-ended-june-30-2026-and-declares-quarterly-dividend/
- https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/q4-2023-shareholder-report.pdf?sfvrsn=91ffcfe7_3
- https://www.csisoftware.com/docs/default-source/press-releases/csi---press-release-q4-2024---final.pdf?sfvrsn=a6da3ec_3/+CSI---Press-Release-Q4-2024---Final+.pdf
- https://quartr.com/events/constellation-software-inc-csu-q1-2025_33rGRbqH
- https://x.com/rebound_capital/status/2054557849347404278
- https://www.speedwellmemos.com/p/constellation-software-2022-earnings
- https://www.globenewswire.com/news-release/2025/03/07/3039269/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2024-and-Declares-Quarterly-Dividend.html
- https://thepursuitofcompounding.substack.com/p/constellation-software-inc-fiscal
- https://www.csisoftware.com/docs/default-source/press-releases/csi---press-release-q1-2025---final.pdf?sfvrsn=f9d1211d_3/
- https://www.marketscreener.com/news/constellation-software-inc-reports-earnings-results-for-the-first-quarter-ended-march-31-2026-ce7f5bdfda8bf121
- https://finance.yahoo.com/news/constellation-software-second-quarter-2025-123135751.html
- https://www.rttnews.com/3651605/constellation-software-q1-profit-revenue-increase.aspx
- https://www.globenewswire.com/news-release/2026/05/12/3293525/0/en/constellation-software-inc-announces-results-for-the-first-quarter-ended-march-31-2026-and-declares-quarterly-dividend.html
- https://finance.yahoo.com/news/constellation-software-full-2023-earnings-110310762.html
- https://www.mbi-deepdives.com/csu2q26/
- https://longyield.substack.com/p/constellation-software-q2-2026-the
- https://finance.yahoo.com/quote/CNSWF/balance-sheet/
- https://www.levelheadedinvesting.com/p/constellation-software-csu-q1-2026-results-the-market-feared-ai-constellation-deployed-1-6-billion
- https://investing.com/equities/constellation-software-inc-balance-sheet
- https://www.macrotrends.net/stocks/charts/CNSWF/constellation-software/shares-outstanding
- https://www.gurufocus.com/term/shares-outstanding/CNSWF
- https://stockanalysis.com/quote/tsx/CSU/dividend/
- https://www.investing.com/equities/constellation-software-inc-dividends
- https://www.stockopedia.com/share-prices/constellation-software-TSE:CSU/
- https://tradingeconomics.com/csu:cn:market-capitalization
- https://stockanalysis.com/quote/tsx/CSU/market-cap/
- https://multiples.vc/public-comps/constellation-software-valuation-multiples
- https://www.gurufocus.com/term/roic/CNSWF
- https://www.morningstar.com/company-reports/1489931-constellation-software-hurdle-rate-discipline-remains-the-cash-compounders-north-star
- https://www.csisoftware.com/wp-content/uploads/2026/08/CSI-MDA-Q2-2026-Final.pdf
- https://expandstocks.substack.com/p/constellation-software-q1-2026
- https://finimize.com/content/cnswf-asset-snapshot
- https://www.alphaquery.com/stock/CNSWF/fundamentals/annual/ebitda
- https://www.csisoftware.com/docs/default-source/press-releases/q4-2024-shareholder-report.pdf?sfvrsn=2b888200_3/+Q4-2024-Shareholder-Report+.pdf
- https://expansestocks.substack.com/p/constellation-software-agm-2026
- https://www.csisoftware.com/constellation-software-inc-announces-the-resignation-of-mark-leonard-and-appointment-of-mark-miller-as-president-of-constellation-software/
- https://www.globenewswire.com/news-release/2025/09/25/3156334/0/en/Con
- https://ground.news/article/constellation-software-inc-announces-mark-
- https://seekingalpha.com/article/4905097-constellation-software-q1-2026-leaning-in-amidst-saaspocalypse
- https://www.gurufocus.com/news/9029244/constellation-software-inc-cnswf-q2-2026-earnings-call-highlights-ai-boosts-productivity-but-organic-growth-decelerates
- https://seekingalpha.com/article/4856592-constellation-softwares-biggest-drawdown-in-20-years-is-forcing-a-rethink
- https://ycharts.com/companies/CSU.TO/price_to_cash_flow_ttm
- https://finbox.com/TSX:CSU/explorer/ev_to_ebitda_ltm/
- https://www.csisoftware.com/category/press-releases/2023/02/23/constellation-software-inc.-and-lumine-group-inc.-complete-purchase-of-wideorbit-inc.-and-lumine-group-spin-out
- https://www.globenewswire.com/news-release/2026/08/05/3339823/0/en/constellation-software-inc-and-topicus-com-inc-announce-results-for-topicus-com-inc-for-the-second-quarter-ended-june-30-2026.html
- https://www.investing.com/equities/topicus.com
- https://www.gurufocus.com/term/mktcap/TSXV:TOI
- https://www.globenewswire.com/news-release/2026/08/04/3338792/0/en/Lumine-Group-Inc-Announces-Results-for-the-Second-Quarter-Ended-June-30-2026.html
- https://finance.yahoo.com/markets/stocks/articles/lumine-group-inc-announces-results-200100205.html
- https://www.theglobeandmail.com/investing/markets/stocks/DSGX-Q/pressreleases/726305/descartes-systems-group-posts-record-fiscal-2026-revenue-and-earnings-amid-logistics-turbulence/
- https://finance.yahoo.com/markets/stocks/articles/enghouse-systems-ltd-eghsf-q2-010050704.html

## Methodology and Model Routing

Work moved through six stages with model choice matched to task difficulty. Haiku 4.5 handled bulk intake search and extraction, Sonnet 5 at low effort normalized the raw figures into the ledger, a Python script written by Sonnet 5 at low effort computed every derived metric so no arithmetic was ever done by a model, Opus 5 at high or extra high effort analyzed the results through three lenses, this report was written by Sonnet 5 at medium effort, and a final review plus the executive summary above is reserved for a single pass from Fable 5.1, run only at the user's explicit request, per brief.json routing.

After the Fable 5.1 review, one numeric finding went back one stage as the pipeline rules require: the ledger gained a derived exchange rate and a cash basis H1 2026 acquisition figure, the compute script was rerun, and the affected sentences in this report were corrected. The executive summary is Fable's text, unedited. Peer coverage of Roper, Tyler, Open Text and Jack Henry is missing because the session's web search budget ran out before that sweep.

# Accounting ratio bankruptcy models applied to Unisys Corporation (NYSE: UIS)

Research date: 11 October 2026. Periods used: FY2025 (balance sheet 31 Dec 2025, 10-K filed 25 Feb 2026) and Q2 2026 (balance sheet 30 Jun 2026, 10-Q filed 30 Jul 2026; earnings release 29 Jul 2026).

Method note. WebFetch failed on every domain tried (sec.gov, unisys.com, stockanalysis.com all returned "getaddrinfo ENOTFOUND"). Every Unisys figure below therefore comes from WebSearch result snippets of the SEC filings, Unisys releases or aggregators, not from reading the full documents. Each figure carries its source. "Gap" means not found, and it was not estimated. "Derived" means simple arithmetic on sourced inputs, shown in the text.

Unit: US$ millions unless stated.

---

## 1. Model definitions: formulas, coefficients, cutoffs, populations

### Takeaway
For an IT services company, Altman Z'' (no sales term, book equity, non manufacturer) is the best fit of the Altman family. Ohlson and Zmijewski are the other two models built on accounting data that include a leverage term. The coefficient sets for Ohlson (last three terms), Zmijewski and Taffler could not be verified against the original papers in this session, so those are flagged.

### Cited Findings

**Altman Z (1968), listed manufacturers**
- Formula: Z = 1.2 X1 + 1.4 X2 + 3.3 X3 + 0.6 X4 + 1.0 X5. X1 = working capital / total assets, X2 = retained earnings / total assets, X3 = EBIT / total assets, X4 = market value of equity / book value of total liabilities, X5 = sales / total assets. — [MetricGate summary](https://metricgate.com/docs/altman-z-score/)
- Cutoffs: above 2.99 safe, 1.81 to 2.99 grey, below 1.81 distress. — [MetricGate](https://metricgate.com/docs/altman-z-score/)
- Population: 33 bankrupt and 33 non bankrupt manufacturing firms, multiple discriminant analysis, publicly traded manufacturers only. — [MetricGate](https://metricgate.com/docs/altman-z-score/). The 1946 to 1965 window is from my background knowledge, not confirmed by a source in this session.
- Reported accuracy conflicts across secondary sources (95% one year out and 72% two years out in one, 80 to 90% two years out in another) — [Beancount summary](https://beancount.io/pt/blog/2026/05/18/altman-z-score-five-ratio-bankruptcy-prediction-model-small-business-financial-distress-screen-customers-suppliers-credit-guide); sources disagree, check Altman (1968) Journal of Finance.

**Altman Z' (1983), private firms**
- Same five ratios, but X4 uses book value of equity / total liabilities. Coefficients 0.717, 0.847, 3.107, 0.420, 0.998. Cutoffs 1.23 (distress) and 2.90 (safe). — Not confirmed by any source fetched in this session (taken from my background knowledge of Altman 1983). Only the statement that book equity replaces market equity in X4 is corroborated: [MBA Knowledge Base / search summary](https://www.mbaknol.com/financial-management/altman-z-score-formula/).

**Altman Z'' (1995), non manufacturers and emerging markets**
- Formula: Z'' = 6.56 X1 + 3.26 X2 + 6.72 X3 + 1.05 X4, with X1 = working capital / total assets, X2 = retained earnings / total assets, X3 = EBIT / total assets, X4 = book equity / total liabilities. The sales / assets term is dropped to reduce industry distortion. — [Wikipedia, Altman Z-score](https://en.wikipedia.org/wiki/Altman_Z-score); [Wall Street Prep](https://www.wallstreetprep.com/knowledge/altman-z-score)
- Emerging market version adds a constant of 3.25. Cutoffs for both: above 2.6 safe, 1.1 to 2.6 grey, below 1.1 distress. — [Wikipedia](https://en.wikipedia.org/wiki/Altman_Z-score)
- The 2.99 / 1.81 cutoffs belong to the original manufacturing model and must not be mixed with Z''. — [Wikipedia](https://en.wikipedia.org/wiki/Altman_Z-score)
- Population: Z'' is a re-estimate for non manufacturing and emerging market firms (Altman, Hartzell and Peck 1995 bond rating based Mexican sample). The sample detail is not confirmed by a source here; it is background knowledge.

**Ohlson O score (1980)**
- Logit model: O = -1.32 - 0.407 SIZE + 6.03 TLTA - 1.43 WCTA + 0.0757 CLCA - 1.72 OENEG - 2.37 NITA - 1.83 FFOTL + 0.285 INTWO - 0.521 CHIN. SIZE = ln(total assets / GNP price level index, 1968 = 100), TLTA = total liabilities / total assets, WCTA = working capital / total assets, CLCA = current liabilities / current assets, OENEG = 1 if total liabilities exceed total assets, NITA = net income / total assets, FFOTL = funds from operations / total liabilities, INTWO = 1 if net loss in each of the last two years, CHIN = (NI_t - NI_t-1) / (|NI_t| + |NI_t-1|). — The first seven coefficients and the SIZE, TLTA, WCTA, CLCA, OENEG, NITA definitions are confirmed by [arXiv 2606.05623 appendix](https://arxiv.org/pdf/2606.05623) and [Wikipedia, Ohlson O-score](https://en.wikipedia.org/wiki/Ohlson_O-score). The last three coefficients (-1.83, +0.285, -0.521) are from my background knowledge and were not confirmed by a source here.
- Probability = exp(O) / (1 + exp(O)). A probability above 50% (O above 0) flags predicted bankruptcy; other studies use different cutoffs (one 2026 study used 0.38). — [Wikipedia](https://en.wikipedia.org/wiki/Ohlson_O-score); [capital.com](https://capital.com/ohlson-o-score-definition)
- Population: about 105 bankrupt industrial firms and 2,058 non bankrupt firms, 1970 to 1976, Journal of Accounting Research vol 18 no 1. — Background knowledge only; a search could not confirm the split ([capital.com](https://capital.com/ohlson-o-score-definition) says "over 2000 companies").
- Later evidence: Begley, Ming and Watts (1996) found Ohlson's original model performed best overall against Altman's original and re-estimated models. — [UCLouvain thesis summary](https://thesis.dial.uclouvain.be/entities/masterthesis/04e000b4-5a23-4911-9015-045642aff06f)

**Zmijewski (1984)**
- Probit: X = b0 + b1 (NI / TA) + b2 (TL / TA) + b3 (CA / CL). Set A: -4.336 - 4.513 ROA + 5.679 TLTA + 0.004 CACL. — [TradingView support page](https://th.tradingview.com/support/solutions/43000597850/). A 2026 arXiv paper rounds to -4.3, -4.5, +5.7 but gives the CACL coefficient as -0.004 (opposite sign). — [arXiv 2606.05623](https://arxiv.org/pdf/2606.05623)
- Set B (-4.803, -3.599, +5.406, -0.100) is the alternative set I recall as widely quoted. A search found no source for it, so it is background knowledge only.
- Cutoff: probit probability above 0.5 (X above 0) classifies as bankrupt. — [Springer table](https://jfin-swufe.springeropen.com/articles/10.1186/s40854-016-0026-9/tables/1)
- Population: 40 bankrupt and 800 non bankrupt firms. — [TradingView](https://th.tradingview.com/support/solutions/43000597850/)
- Paper: Journal of Accounting Research vol 22, pp 59 to 82. Authors advise re-estimating coefficients on recent data. — [Augusta Univ listing](https://augusta.elsevierpure.com/en/publications/re-estimations-of-the-zmijewski-and-ohlson-bankruptcy-prediction-)

**Springate (1978)**
- S = 1.03 A + 3.07 B + 0.66 C + 0.4 D. A = working capital / TA, B = EBIT / TA, C = pre tax profit / current liabilities, D = sales / TA. Below 0.862 classed as failing. — [Growing Science paper](https://www.growingscience.com/dsl/Vol13/dsl_2023_51.pdf) and [search summary of Islamic bank comparison](https://www.researchgate.net/publication/415132111_Comparison_of_Financial_Distress_Prediction_Using_Altman_Zmijewski_Grover_Springate_and_Taffler_Models_on_Islamic_Banks_ASEAN_Region)
- Population not confirmed here (my recollection: Canadian industrials, 40 firms; not sourced).

**Grover (2001)**
- G = 1.650 X1 + 3.404 X2 - 0.016 X3 + 0.057. X1 = working capital / TA, X2 = EBIT / TA, X3 = net income / TA. Healthy at G of 0.01 or more, distressed at G of -0.02 or less, grey between. — [Grover method paper](https://eudl.eu/pdf/10.4108/eai.8-10-2018.2288689); one source quotes a different X3 coefficient, so check.
- Population not confirmed (my recollection: re-estimate of the Altman model on 70 US firms; not sourced).

**Taffler (1983, UK)**
- Four ratios: profit before tax / current liabilities, current assets / total liabilities, current liabilities / total assets, and a no credit interval. Coefficients are disputed or undisclosed across sources (one says the raw weights were never published, one gives 0.53, 0.13, 0.18, 0.16). Cutoff: Golding quotes a 1.8 to 2.67 grey zone; commonly Z above 0.3 is solvent in the weighted version. — [ACCA article](https://www.accaglobal.com/content/dam/acca/global/PDF-students/2012/sa_jj08_mpogue.pdf); [Czech study](https://cfuc.vse.cz/doi/10.18267/j.cfuc.583.pdf); [EFMA 2009 paper](https://efmaefm.org/0EFMAMEETINGS/EFMA%20ANNUAL%20MEETINGS/2009-Milan/papers/EFMA2009_0506_fullpaper.pdf)

### Inferences
- Z'' is the correct Altman variant here: the company is a listed services firm, so the original manufacturer model (with a sales/assets term worth 1.0 X5) is outside its population, and Z' is for private firms.
- Because Z'' has no sales term and no market value, it is the only Altman version where a negative book equity and a deep accumulated deficit enter directly via X2 and X4.

### Gaps
- Primary papers (Altman 1968, 1983, 2000; Ohlson 1980; Zmijewski 1984) were not retrievable; coefficient sets for Z', Ohlson terms 8 to 10, Zmijewski (conflicting sets), Springate and Grover populations are unverified.
- Taffler coefficients: no reliable source, so no Taffler score is computed.

---

## 2. Unisys inputs (actual figures)

### Takeaway
Unisys carries negative equity (total deficit of $268.3m at 31 Dec 2025 and $351.9m at 30 Jun 2026), an accumulated deficit of $2.6bn, and about $485m to $518m of pension and postretirement liabilities on the balance sheet. Current assets exceed current liabilities, so working capital is positive.

### Cited Findings

**Balance sheet**

| Item | 31 Dec 2025 | 30 Jun 2026 | Source |
|---|---|---|---|
| Total assets | 1,846.2 | 1,641.6 | [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm); [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000027/uis-20260630.htm) |
| Total current assets | 1,004.0 | 846.1 | [Q2 2026 8-K release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| Total current liabilities | 655.9 | 600.3 | 10-K (search summary of [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm)); Q2: [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000027/uis-20260630.htm) and [Weiss Ratings](https://weissratings.com/en/stock/uis-nyse/balance-sheet/quarterly) (30 Jun 2026: 600.3; 31 Mar 2026: 602.4) |
| Working capital (derived) | 1,004.0 - 655.9 = 348.1 | 846.1 - 600.3 = 245.8 | derived |
| Accumulated deficit (retained earnings) | (2,478.9) | (2,610.0) | [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm); [Q2 release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) (search flagged the Q2 excerpt as garbled in places, confirm in full filing) |
| Total deficit (incl. noncontrolling interests) | (268.3) | (351.9) | [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm); [Q2 release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| Unisys stockholders' deficit (excl. NCI) | (282.6) | (367.4) | [Q4 2025 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf); [Q2 2026 release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| Total liabilities (derived, balance sheet prints no total) | 1,846.2 + 268.3 = 2,114.5 | 1,641.6 + 351.9 = 1,993.5 | derived. The FY2025 10-K search summary independently summed the liability captions to about 2,114.5; a data site shows 2.11bn ([10-K summary](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm)) |
| Cash and equivalents | 413.9 | 324.3 | [Q4 2025 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf); [Q2 2026 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2026/2q-2026-072926.pdf) |
| Long term debt | gap (current maturities 12.7) | 721.9 | Q2 2026: [8-K release summary](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm); the 31 Dec 2025 long term debt was not found |
| Total debt | gap at 31 Dec 2025 (AlphaSpread shows 729m, undated: [AlphaSpread](https://www.alphaspread.com/security/six/uis/solvency)) | 721.9 + 11.6 = 733.5 (derived; matches a third party figure of 733.5 including $686.9m of 10.625% notes due 2031) | [Q2 release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| Long term pension and postretirement liabilities | 517.7 | 485.1 | [Q2 2026 release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| Pension funding deficit (defined benefit plans) | 448.5 (down from 750.2 at end 2024) | gap | [Q4 2025 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf) |
| Pension liabilities as share of total liabilities (derived) | 517.7 / 2,114.5 = 24.5% | 485.1 / 1,993.5 = 24.3% | derived |

**Income and cash flow**

| Item | FY2025 | LTM to 30 Jun 2026 | Source |
|---|---|---|---|
| Revenue | 1,950.1 (FY2024: 2,008.4) | 460.2 + 574.5 + 437.6 + 473.5 = 1,945.8 (derived) | FY: [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm). Quarters: Q3'25 [8-K](https://www.sec.gov/Archives/edgar/data/746838/000074683825000028/q32025earningsrelease.htm); Q4'25 [release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf); Q1'26 [8-K](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000015/q12026earningsrelease.htm); Q2'26 [8-K](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| GAAP operating profit (used as EBIT) | 78.5 (includes $55.0m goodwill impairment; FY2024: 97.4) | 78.5 - 35.4 (H1'25) + (-16.7) (H1'26) = 26.4 (derived) | FY: [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm). H1'26 operating loss 16.7 vs H1'25 profit 35.4: [10-Q MD&A summary](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000027/uis-20260630.htm). Q2'26 operating loss 32.9 incl. $47.2m goodwill impairment: [Q2 release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) |
| Interest expense | 53.4 (FY2024: 31.9) | Q2'26 18.3; H1'26 36.8 | [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm); [10-Q](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000027/uis-20260630.htm) |
| Pre tax loss | gap (FY2025) | H1'26: (102.9) (Q1 23.1 + Q2 79.8); LTM gap | [10-Q](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000027/uis-20260630.htm) |
| Net loss attributable to Unisys | (339.8) (FY2024: (193.4)); includes pretax pension settlement loss of 227.7 | (339.8) - (-49.6 H1'25) + (-131.1 H1'26) = (421.3) (derived) | FY: [10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm). H1'25 = Q1 (29.5) + Q2 (20.1): [Q1'26 8-K](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000015/q12026earningsrelease.htm), [search summary of Q2'26](https://www.webull.com/news/15319076896777216). H1'26 (131.1): [Q2 release](https://ir.unisys.com/news-releases/news-release-details/unisys-announces-2q26-results) |
| Cash from operations | (140.0) (includes $250m discretionary pension contribution; pre pension free cash flow 127.7) | gap (LTM) | [Q4 2025 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf) |
| Non GAAP operating profit | 176.9 | gap | [Q4 2025 release](https://www.sec.gov/Archives/edgar/data/746838/000074683826000003/q42025earningsrelease.htm) |

**Market data**
- Shares outstanding: 72,915,955 at 30 Jun 2026 (72,905,170 at 31 Mar 2026), per 10-Q cover page. — [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000027/uis-20260630.htm)
- Share price: $2.44 checked 22 Sep 2026; $2.65 on 2 Sep 2026 (third party snapshots, exact date and source unnamed in the result). — [search summary of price data](https://uk.investing.com/equities/unisys-corp). Earlier: $3.63 close on 20 Jul 2026 with market cap $264.65m — [Motley Fool quote page](https://www.fool.com/quote/nyse/unisys/uis/). No October 2026 price found.
- Market cap used: 72.915955m x $2.44 = $177.9m (derived; consistent with the Fool figure, since 72.916 x 3.63 = $264.7m). At $3.63 it would be $264.7m.
- Analyst targets: consensus about $4.81, range $3.25 to $6.00 (4 analysts). — [Bullstory](https://bullstory.io/en/stocks/uis/forecast/price-target). Needham cut its target to $5.00 on 30 Jul 2026. — [MarketBeat](https://www.marketbeat.com/instant-alerts/unisys-nyseuis-given-new-500-price-target-at-needham-company-llc-2026-07-30/)

**Context**
- Backlog $2.82bn at Q2 2026 vs $2.92bn a year earlier; 2026 guidance reaffirmed (constant currency revenue -5.0% to -3.5%, non GAAP operating margin 9% to 11%). — [Q2 2026 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2026/2q-2026-072926.pdf)
- $700m 10.625% Senior Secured Notes due 2031 issued 27 June 2025; about $200m of proceeds plus $50m cash funded a $250m discretionary pension contribution. — [Q4 2025 release](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf)
- Third quarter 2025: pension annuity purchase moved about $320m of projected US liabilities to an insurer, first step toward reducing about $600m by end 2026. — [Q3 2025 8-K](https://www.sec.gov/Archives/edgar/data/746838/000074683825000028/q32025earningsrelease.htm)

### Inferences
- The accumulated deficit (-$2,610.0m) is 159% of total assets (2,610.0 / 1,641.6 = 1.59), so any model with a retained earnings term is dominated by it.
- Working capital and the current ratio look acceptable: 846.1 / 600.3 = 1.41 at Q2 2026; 1,004.0 / 655.9 = 1.53 at FY2025.
- Cash fell $89.6m in H1 2026 (413.9 - 324.3), alongside rising interest cost (H1 interest 36.8 vs FY2025 total 53.4).

### Gaps
- Total debt and long term debt at 31 Dec 2025, FY2025 pre tax income, LTM operating cash flow, Q2 2026 pension funding deficit, FY2025 consolidated net loss including noncontrolling interests, accumulated other comprehensive loss split, funds from operations (needed by Ohlson), prior year net income for the LTM CHIN term, Oct 2026 price.
- Every figure above is from search snippets and should be re-checked against full filings. The search tool flagged the Q2 accumulated deficit excerpt as partly garbled.

---

## 3. Computed scores for Unisys

All arithmetic is shown. EBIT = GAAP operating profit (it excludes the non service pension cost and other expense lines that sit below operating profit, a choice that flatters X3). Market cap $177.9m (72.916m shares x $2.44).

### Takeaway
Altman Z'' is in the distress zone under every variant and period (FY2025 EM version +0.26; Q2 2026 EM version -1.03; both below 1.1). Ohlson, Zmijewski, Springate, Z' and original Z also read distress. Grover is the exception: it reads healthy (0.52 and 0.36) because it ignores retained earnings and equity.

### Cited Findings and calculations

**Altman Z'' inputs**

| Input | FY2025 (31 Dec 2025) | Q2 2026 (30 Jun 2026; EBIT is LTM) |
|---|---|---|
| X1 = WC / TA | 348.1 / 1,846.2 = 0.1885 | 245.8 / 1,641.6 = 0.1497 |
| X2 = RE / TA | -2,478.9 / 1,846.2 = -1.3427 | -2,610.0 / 1,641.6 = -1.5899 |
| X3 = EBIT / TA | 78.5 / 1,846.2 = 0.0425 | 26.4 / 1,641.6 = 0.0161 |
| X4 = book equity / TL | -268.3 / 2,114.5 = -0.1269 | -351.9 / 1,993.5 = -0.1765 |
| Weighted terms | 6.56 x 0.1885 = 1.2369; 3.26 x -1.3427 = -4.3772; 6.72 x 0.0425 = 0.2857; 1.05 x -0.1269 = -0.1332 | 0.9822; -5.1831; 0.1081; -0.1853 |
| Z'' (no constant) | **-2.988** | **-4.278** |
| Z'' emerging market (+3.25) | **0.262** | **-1.028** |
| Zone (cutoffs 1.1 / 2.6) | Distress in both versions | Distress in both versions |

Using Unisys-attributable stockholders' deficit (-282.6 and -367.4) in X4 changes Z'' by under 0.01 (-2.995 and -4.286).

Also reported for completeness (inputs as above, market cap in X4 of original Z):
- Original Z (1968): FY2025 = 1.2 x 0.1885 + 1.4 x -1.3427 + 3.3 x 0.0425 + 0.6 x (177.9 / 2,114.5 = 0.0841) + 1.0 x (1,950.1 / 1,846.2 = 1.0563) = 0.2263 - 1.8798 + 0.1403 + 0.0505 + 1.0563 = **-0.406**; Q2 2026 (sales 1,945.8 / 1,641.6 = 1.1853; X4 = 177.9 / 1,993.5 = 0.0892) = **-0.754**. Below 1.81: distress. The model is out of population for a services company.
- Z' (1983, coefficients unverified): FY2025 = **0.131**; Q2 2026 = **-0.081**. Both below 1.23: distress.

**Decomposition (arithmetic, not an estimate).** In Z'' the retained earnings term alone is -4.377 (FY2025) and -5.183 (Q2). Without X2 the EM version would be 0.262 + 4.377 = 4.639 (FY2025), so the accumulated deficit is the single driver of the distress reading. Excluding X4 and the constant, FY2025 Z'' = 1.2369 - 4.3772 + 0.2857 = -2.855, still deeply negative.

**Pension sensitivity (illustrative scenario, shows direction and size only).** Remove the balance sheet pension and postretirement liability from total liabilities and add it back to equity one for one (ignores tax and AOCI effects):
- FY2025: equity = -268.3 + 517.7 = 249.4; TL = 2,114.5 - 517.7 = 1,596.8; X4 = 0.1562; X4 changes by +0.2831, Z'' rises by 1.05 x 0.2831 = +0.297, giving -2.691 (no constant) and 0.559 (EM).
- Q2 2026: equity = -351.9 + 485.1 = 133.2; TL = 1,508.4; X4 = 0.0883; Z'' rises +0.278, giving -4.000 and -0.750 (EM).
- Result: the pension liability moves Z'' by under 0.3 points; the zone does not change.

**Ohlson O score (FY2025 basis; a full score cannot be computed)**

| Term | Calculation | Value |
|---|---|---|
| Intercept | | -1.32 |
| TLTA | 6.03 x (2,114.5 / 1,846.2 = 1.1453) | +6.906 |
| WCTA | -1.43 x 0.1885 | -0.270 |
| CLCA | 0.0757 x (655.9 / 1,004.0 = 0.6533) | +0.049 |
| OENEG | TL exceeds TA, so 1; -1.72 x 1 | -1.720 |
| NITA | -2.37 x (-339.8 / 1,846.2 = -0.1841) | +0.436 |
| INTWO | net loss in FY2024 (-193.4) and FY2025 (-339.8), so 1; 0.285 x 1 | +0.285 |
| CHIN | (-339.8 - (-193.4)) / (339.8 + 193.4) = -0.2746; -0.521 x -0.2746 | +0.143 |
| Partial sum (all terms except SIZE and FFOTL) | | **+4.51** |
| SIZE | -0.407 x ln(TA / GNP index) | **gap** (needs Ohlson's GNP deflator base and units) |
| FFOTL | -1.83 x FFO / TL | **gap** (funds from operations not found) |

For O to fall to 0 or below, SIZE plus FFOTL would have to contribute -4.51 or less. The partial sum is dominated by TLTA above 1 (+6.906) and the OENEG dummy. The sign of the final O score is not established here; the partial sum points to a high failure probability. For Q2 2026 (balance sheet only): partial sum excluding SIZE, FFOTL, INTWO and CHIN = -1.32 + 7.3226 - 0.2141 + 0.0537 - 1.72 + 0.6082 = **+4.73**, with CHIN a gap because prior LTM net income was not found. Ohlson's final score and probability: **gap** for both periods.

**Zmijewski (coefficient sets disagree)**
- FY2025 inputs: ROA = -339.8 / 1,846.2 = -0.1841 (attributable net loss), TLTA = 1.1453, CACL = 1,004.0 / 655.9 = 1.531.
- Set A: -4.336 - 4.513 x (-0.1841) + 5.679 x 1.1453 + 0.004 x 1.531 = **3.005**; probability = Phi(3.005) = 0.9987. Set B: -4.803 - 3.599 x (-0.1841) + 5.406 x 1.1453 - 0.100 x 1.531 = **1.898**; Phi = 0.9711. Both exceed 0: distressed.
- Q2 2026 (LTM net loss -421.3, ROA = -0.2566, TLTA = 1.2144, CACL = 1.409): Set A = **3.724** (Phi 0.9999); Set B = **2.545** (Phi 0.9945). Distressed.

**Springate (S, cutoff 0.862)**
- FY2025: A = 0.1885, B = 0.0425, D = 1.0563. Terms excluding C: 1.03 x 0.1885 + 3.07 x 0.0425 + 0.4 x 1.0563 = 0.1942 + 0.1305 + 0.4225 = 0.747. C = pre tax profit / current liabilities is a **gap** (FY2025 pre tax income not found). Because 0.747 is already below 0.862, S stays below the cutoff for any pre tax profit of zero or less. Score: **gap, below 0.862 if EBT is 0 or negative**.
- Q2 2026 (LTM): 1.03 x 0.1497 + 3.07 x 0.0161 + 0.4 x 1.1853 = 0.678 excluding C; C needs LTM pre tax profit (**gap**; H1 2026 pre tax was a loss of 102.9). Same conclusion if LTM EBT is not positive; pre tax profit would have to be at least 0.184 / 0.66 x 600.3 = about $167m to reach 0.862 (derived).

**Grover (healthy at 0.01 or more, distressed at -0.02 or less)**
- FY2025: 1.650 x 0.1885 + 3.404 x 0.0425 - 0.016 x (-0.1841) + 0.057 = 0.3111 + 0.1447 + 0.0029 + 0.057 = **0.516**: healthy zone.
- Q2 2026: 1.650 x 0.1497 + 3.404 x 0.0161 - 0.016 x (-0.2566) + 0.057 = 0.2471 + 0.0547 + 0.0041 + 0.057 = **0.363**: healthy zone.
- Note: I added the 0.057 constant per the standard form. A negative net income is multiplied by a negative coefficient, so losses slightly raise G.

**Taffler**: **gap** (no verified coefficients; the no credit interval input also needs cash operating costs not collected).

### Inferences
- The models split by what they weight. Models using retained earnings or leverage (Z'', Z, Z', Zmijewski, partial Ohlson) put Unisys in distress; Grover, which uses only working capital, EBIT/TA and ROA, reads healthy. This split tracks the balance sheet: positive working capital and a thin but positive operating margin versus a huge accumulated deficit and liabilities above assets.
- Operating profit is a generous EBIT: pre tax result is far lower (H1 2026 pre tax loss of 102.9 versus operating loss of 16.7), because non operating pension and interest costs sit below operating profit.
- Ohlson results are not decision grade here because SIZE and FFOTL are missing.

### Gaps
- See the gaps listed in Section 2 and the SIZE, FFOTL, EBT, Taffler gaps above.
- Using a different EBIT definition (pretax plus interest) was not possible for FY2025 or LTM.

---

## 4. Behaviour of these models with negative equity and a large pension liability

### Takeaway
I found no published study or author statement tested specifically on negative book equity plus a large pension deficit; the points below are the sourced general limitations and clearly marked reasoning. The mechanics are clear: negative equity makes X4 negative in Z'' and Z', sets OENEG = 1 in Ohlson, and pushes TLTA above 1 in Ohlson and Zmijewski.

### Cited Findings
- Z'' uses book equity / total liabilities in X4 and removes sales/assets to reduce industry specific distortion. — [stablebread summary](https://stablebread.com/altman-z-score/); [MBA Knowledge Base](https://www.mbaknol.com/financial-management/altman-z-score-formula/)
- The Altman score is blind to off balance sheet liabilities, and unfunded pensions, contingent obligations and complex instruments can distort it. This is a practitioner remark, not a tested adjustment. — [search summary, Altman Z-score guides](https://pro.stockalarm.io/blog/altman-z-score-guide)
- The score is highly sensitive to small variations in its accounting inputs. — [arXiv 1109.1087](https://arxiv.org/pdf/1109.1087)
- Researchers using the Zmijewski and Ohlson models on recent data should re-estimate the coefficients. — [Augusta University listing](https://augusta.elsevierpure.com/en/publications/re-estimations-of-the-zmijewski-and-ohlson-bankruptcy-prediction-)
- The cutoffs are screening heuristics, not exact probabilities, and later academic work leans on market data. — [Wikipedia](https://en.wikipedia.org/wiki/Altman_Z-score) (as summarised by search)
- Sample populations (Altman original: 66 manufacturers; Ohlson: industrial firms; Zmijewski: 840 firms) contain no firm of this type; Unisys is an IT services company. — see Section 1 sources.

### Inferences
- Unisys's accumulated deficit mostly reflects past losses, including a $227.7m pension settlement loss in FY2025. A large part of the pension burden has therefore already hit retained earnings (via X2) and equity (via X4) at the same time, and a pension liability also inflates total liabilities, which lowers X4 and raises TLTA. The pension effect is partly counted twice, but the sensitivity above shows removing it moves Z'' by less than 0.3, so the pension is not what drives the distress reading; the accumulated deficit is.
- Because the pension plans are frozen or being de-risked (annuity purchase of about $320m, $343.7m of cash contributions in 2025), the balance sheet liability is falling ($517.7m to $485.1m), but the cash cost is real; the models do not see the funding calendar.
- Models using only operating items (Grover, working capital, EBIT/TA) miss capital structure and can give a false healthy signal: here Grover reads 0.52 and 0.36 while four other models read distress.

### Gaps
- No academic paper on pension adjusted Altman or Ohlson scores, or on negative equity firms, was found in the searches. Altman's own guidance on negative book equity in X4 was not located. A deeper literature search (Altman 2000 notes; Altman, Iwanicz-Drozdowska et al. 2017 on Z-score international performance; pension debt papers by Franzoni and Marin 2006 on pension underfunding) is recommended, but those references are from my background knowledge and were not verified.

---

## 5. Published Z or O scores for Unisys on data sites vs computed

### Takeaway
All data sites that publish a Z score show Unisys negative, in distress, but values span -1.37 to -0.17 and are undated. My original Z (-0.41 FY2025, -0.75 Q2 2026) falls within that range. I found no Macroaxis or StockAnalysis value, and no published O score.

### Cited Findings
- GuruFocus UIS page: Altman Z-score -1.37 and Piotroski F-score 3/9 on the current page; another GuruFocus page shows -0.29; a key ratios page shows -0.62. — [GuruFocus](https://www.gurufocus.com/stock/UIS). Older GuruFocus snapshots for the Xetra and Swiss listings show -0.58 and -0.66. — [GuruFocus STU:USY1](https://test.gurufocus.com/stock/STU:USY1/summary)
- ROIC.ai: -0.63 for UIS; -0.17 for the German listing USY1.DE. — [ROIC.ai](https://www.roic.ai/quote/UIS/statistics)
- StockMarketWatch: distress zone, data dated 4 Aug 2026 (no value in snippet). — [StockMarketWatch](https://stockmarketwatch.com/stock/UIS)
- AlphaSpread: bankruptcy probability 1.1%, solvency score 52/100; Z-score field did not load. — [AlphaSpread](https://new.alphaspread.com/security/nyse/uis/solvency)
- valueinvesting.io: 49.69% probability of financial distress over 24 months (a composite that includes Altman Z and Beneish M). — [valueinvesting.io](https://valueinvesting.io/UIS/probability-of-bankruptcy)

### Inferences
- My original Z (-0.41 FY2025; -0.75 Q2 2026) is bracketed by GuruFocus (-0.62, -1.37) and ROIC (-0.63). The differences likely reflect price date, EBIT definition, period (trailing vs annual) and total liabilities treatment, but the sites do not show their inputs, so this is unverified.
- The AlphaSpread 1.1% and valueinvesting.io 49.69% figures disagree widely, which shows these vendor probabilities are not comparable; neither is a Z'' or O score.

### Gaps
- No Macroaxis, StockAnalysis or published Ohlson/Zmijewski value found for UIS. The Z'' score is not published on any site found. Dates of the data site values are not shown, and they cannot be matched to a filing period.

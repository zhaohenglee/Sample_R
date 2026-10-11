# Market based and credit rating based default probability frameworks, applied to Unisys (UIS), as of October 2026

Method note: WebFetch was blocked (DNS failure for sec.gov and unisys.com). Everything below comes from WebSearch result text. Items marked "(snippet)" were not checked against the full primary document. Items marked "Gap" were not found; no input was estimated. The research budget was about 25 tool calls.

## 1. Structural and market signal frameworks (method, inputs, limitations)

### Takeaway
Merton/KMV, bond spread, CDS and hazard models all need a market equity value, an equity volatility and a debt or liability measure; for Unisys only market cap, share count and debt are partly available, so no distance to default (DD) can be computed without breaking the "no estimates" rule. Formulas are standard literature statements; the sources linked give context but the snippets did not reproduce the equations.

### Cited Findings
- Merton (1974), "On the Pricing of Corporate Debt: The Risk Structure of Interest Rates", J. Finance, treats equity as a call option on firm assets with debt as the strike. Observable inputs are equity value E and equity volatility sigma_E; unobservable asset value V and asset volatility sigma_V are solved simultaneously from two equations — [Wikipedia: Merton model](https://en.wikipedia.org/wiki/Merton_model); [acadifi summary (snippet)](https://acadifi.com/community/merton-model-distance-to-default-structural-credit-risk)
- Standard form (textbook, not reproduced in the snippets): DD = [ln(V/D) + (mu − 0.5 sigma_V^2) T] / (sigma_V sqrt(T)); Merton PD = N(−DD). Under risk neutral drift (r in place of mu) this is a risk neutral probability, higher than the physical PD because of embedded risk premia — [acadifi (snippet)](https://acadifi.com/community/merton-model-distance-to-default-structural-credit-risk)
- KMV adaptation: default point is short term debt plus about half of long term debt, not total debt; DD is mapped to an Expected Default Frequency (EDF) through a proprietary empirical default database rather than N(−DD); horizon is one year — [Wikipedia: KMV model](https://Www.Wikipedia.org/wiki/KMV_model); [acadifi (snippet)](https://acadifi.com/community/merton-model-distance-to-default-structural-credit-risk)
- Bharath and Shumway (2008), Review of Financial Studies 21(3):1339–1369: the "naive" DD uses the Merton functional form without solving the simultaneous system, and forecasts defaults slightly better than the full Merton DD model in hazard models and out of sample. They conclude Merton DD is not a sufficient statistic for default probability — [IDEAS/RePEc](https://ideas.repec.org/a/oup/rfinst/v21y2008i3p1339-1369.html)
- Naive DD implementation (third party library documentation, not the paper): debt volatility proxy sigma_D = 0.05 + 0.25 sigma_E, asset volatility as the value weighted blend of sigma_E and sigma_D, asset value approximated by equity plus debt. Verify against the paper before use — [merton.readthedocs.io](https://merton.readthedocs.io/en/latest/api/merton/calibration/naive/index.html)
- Campbell, Hilscher and Szilagyi (2008), "In Search of Distress Risk", J. Finance: logit hazard model on market and accounting variables. GuruFocus describes it as an eight variable logit; NIMTAAVG is net income over market total assets (market cap plus total liabilities) with geometrically declining weights over four quarters; coefficients on NIMTAAVG and EXRETAVG are negative, on TLMTA and SIGMA positive — [GuruFocus (snippet)](https://m.gurufocus.com/term/PFD/SLGC). The other variables (RSIZE, CASHMTA, MB, PRICE) are named from the paper from memory and were not confirmed in this session; coefficient values not retrieved.
- Shumway (2001) hazard model is the accounting plus market predecessor to CHS. Not retrieved in this session. Gap on a citable link.
- Bond spread implied PD and CDS implied PD (standard approximations, no source retrieved): hazard rate lambda ≈ spread / (1 − recovery); T year PD ≈ 1 − exp(−lambda T). Inputs: spread over a risk free or swap curve (option adjusted for callable bonds), recovery assumption, maturity. Limitations: spread includes liquidity and risk premia so the result is risk neutral and overstates the real world PD; thin trading distorts quotes. No citable source retrieved. Gap.
- Limitations common to all (from the acadifi summary, snippet): Gaussian assumption, single maturity zero coupon debt, heuristic default point, unobservable asset inputs, risk neutral vs physical probabilities — [acadifi](https://acadifi.com/community/merton-model-distance-to-default-structural-credit-risk)

### Inferences
- The Merton family treats liabilities as the debt face value; a pension deficit is not a contractual debt claim with a fixed strike, so the choice of D for Unisys is a judgment call (see section 7).
- Equity volatility for a roughly $250 to $300 million market cap stock with a price that fell to $3.6 or lower will be high, which pushes asset volatility up and DD down, but the number itself is a Gap.

### Gaps
- Original equations from the primary papers (Merton 1974, Bharath and Shumway 2008, CHS 2008): not retrieved, only secondary descriptions.
- Moody's EDF/CreditEdge or S&P CreditModel methodology documents: not retrieved.

## 2. Rating agency frameworks: methodology, Unisys rating level and every action since 2020

### Takeaway
Unisys is single B category at both agencies. Moody's CFR is B2 (downgraded from B1, stable outlook, March 2025 per Investing.com). S&P is B (downgraded from B+ in 2024 per the company's own filing), stable. Both outlooks were stable as of the FY2025 10-K. I found no 2026 rating action.

### Cited Findings
- Unisys FY2025 10-K risk factor: "in 2024, we were downgraded from B+ to B by Standard & Poor's" and "in 2025, we were downgraded from B1 to B2 by Moody's"; both agencies currently rate Unisys with a stable outlook. The search summary showed the S&P name garbled ("Standard & Poor's 500"). Filed around Feb 2026 — [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm) (snippet); same text in [Form ARS FY2025](https://www.sec.gov/Archives/edgar/data/746838/000130817926000085/uis014724a.pdf) (snippet)
- Moody's, March 2025 (date from the search summary, snippet): CFR and senior secured rating downgraded to B2 from B1, also the $485 million senior secured global notes due 2027; outlook to stable from negative. Reasons: expected little or no revenue growth and debt to EBITDA around 4.5x over 12 to 18 months; governance risk from high financial leverage was a key ESG factor; stable outlook supported by expected gross margin expansion in non license and support lines. SGL-2 liquidity rating kept. Cash $377 million at 31 Dec 2024. Moody's noted over $2 billion of pension liabilities removed since 2020 and possible future US pension contributions. Pension payments "approaching $100 million" in 2025 and over $100 million in 2026 — [Investing.com](https://www.investing.com/news/stock-market-news/unisys-credit-rating-downgraded-by-moodys-outlook-now-stable-93CH-3938020) (secondary coverage of Moody's release; Moody's own release not found)
- Moody's rating before the March 2025 action was B1 with a negative outlook (implied by the outlook change in the same Investing.com piece) — [Investing.com](https://www.investing.com/news/stock-market-news/unisys-credit-rating-downgraded-by-moodys-outlook-now-stable-93CH-3938020)
- Valens Research (Oct 2020, opinion, not a rating action) said Moody's then rated Unisys B2 and argued agencies misjudged pension risk — [Valens Research](https://www.valens-research.com/investor-essentials-daily/uis-unisys-corporation-consulting-firms-underfunded-pension-rating-agencies-panicked-wrong-reasons/)
- A Moody's report on Unisys's substantial pension funding deficit is listed for September 2024; no rating detail in the snippet — [ResearchPool listing](https://app.researchpool.com/category/credit-analysis/?page=462)
- Older history (pre 2020, for context only): Moody's raised Unisys to B1 from B3 and S&P raised it to B+ from B around 2010 to 2011 — [Benzinga/Zacks](https://benzinga.com/z/445347); 6.25% notes due 2017 carried B1/BB- in 2012 (offering doc, per search summary) — [Unisys capital structure deck listing](https://wwwprod12.unisys.com/siteassets/investor-relations/presentations/unisys-capital-structure-and-pension-strategy.pdf)
- 10-K risk factor says agencies weigh financial strength, earnings, interest rates, IT industry and economic conditions, and methodology changes; a further downgrade could raise cost of funds — [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm) (snippet)

### Inferences
- Moody's went B2 (Oct 2020) to B1 (by early 2025) to B2 (Mar 2025), so there must have been an upgrade between 2020 and 2024 that I did not find. Likely tied to the 2020 pension de-risking, but this is inference.
- With the 2031 secured notes now the main debt, issue level ratings are likely at or near the CFR/corporate level, but no issue rating was retrieved.

### Gaps
- S&P 2024 downgrade: date, outlook before/after, and stated reasons not found. No S&P press release surfaced.
- Moody's primary press release for March 2025 and any earlier Moody's actions 2020 to 2024 (including the upgrade to B1 and the negative outlook date): not found.
- Issue ratings and recovery ratings on the 10.625% 2031 notes from either agency: not found. Moody's SGL-2 may have changed since; not found.
- Any rating action after the 2025 pension de-risking (F&G annuity Sept 2025), FY2025 results (Feb 2026), Q2 2026 results or the Sept 2026 NY Life annuity: none found; the 10-K (filed about Feb 2026) says both stable. Nothing confirms status in October 2026.
- Moody's and S&P technology services methodology (factors, weights, pension adjustments): not retrieved.

## 3. Historical default rates that map ratings to PD

### Takeaway
I could not retrieve a primary table for B/B2 one year and five year cumulative default rates. Only partial secondary figures are available; the writer should not quote a B one year or five year PD from this note.

### Cited Findings
- S&P 1981 to 2024 average, per a third party blog (secondary): one year default rate CCC/C 26.12%, BBB 0.14%; ten year cumulative B 22.02%, CCC/C 50.43% — [Ledgertouch](https://ledgertouch.com/blog/planning-and-costs/default-rates-by-credit-rating)
- S&P 2024 study (via search summary of S&P): issuers initially rated in the B category have a lifetime default rate of 21.2% with average time to default 5.2 years; 43.2% of those initially CCC+ or lower eventually default — [S&P 2024 study key takeaways](https://www.spglobal.com/ratings/en/research/articles/250117-default-transition-and-recovery-europe-and-the-u-s-undermine-2024-drop-in-global-corporate-defaults-13384577)
- S&P 2025 default study: no investment grade defaults in 2025; about 60% of 2025 defaults were US (secondary summary) — [FIIG Wire, 15 Jul 2026](https://thewire.fiig.com.au/article/2026/07/15/attempting-to-quantify-the-risk-of-bonds-with-credit-ratings)
- S&P's published table location: Investor Factbook chart "Global Corporates Average Cumulative Default Rates by Rating, 1981–2024" (values not in snippet) — [S&P Investor Factbook](https://investorfactbook.spglobal.com/sp-global-ratings/ratings-track-record-standing-the-test-of-time/)
- Moody's trailing 12 month global speculative grade default rate 4.5% at end of July 2025; long run global average 4.2%; US speculative grade 5.8% in July 2025 (secondary summary) — [First Trust factoid, 23 Jul 2025](https://www.ftportfolios.com/blogs/InvestBlog/2025/7/23/factoid---wednesday,-july-23,-2025)
- Very old reference (1981 to 1996 averages, S&P/Moody's): one year B 4.8%, BBB 0.2%, BB 1.1%, CCC 16.4%. Dated and not suitable for current use — [efalken.com](https://www.efalken.com/banking/html's/defaultcurves.htm)

### Inferences
- The 21.2% lifetime and 22.02% ten year B figures suggest a five year cumulative B default rate well below those, but the actual number is not retrieved and must not be inferred.

### Gaps
- S&P and Moody's one year and five year cumulative default rates for B, B−, B2, B3 (issuer weighted), from the latest annual studies: not retrieved. Primary documents are on spglobal.com/ratings and moodys.com (not fetchable here).
- Moody's rating to PD mapping (alphanumeric B2 specific): not retrieved.

## 4. Unisys outstanding debt and market pricing

### Takeaway
As of the FY2025 10-K the only note outstanding is the $700 million 10.625% senior secured notes due 15 Jan 2031, issued June 2025; the 2020 6.875% notes due 2027 were tendered and refinanced. I found no 2026 refinancing. No reliable current price, YTM or Treasury spread exists in my results; aggregator snapshots conflict.

### Cited Findings
- 2020 issue: $485 million 6.875% senior secured notes due 1 Nov 2027, priced Oct 2020 in a 144A offering to fund part of the US pension deficit; interest 1 May and 1 Nov; secured by liens on substantially all assets; callable at par from 1 Nov 2025 — [8-K Oct 2020](https://www.sec.gov/Archives/edgar/data/746838/000074683820000140/exhibit991pressrelease.htm); [8-K 2025](https://www.sec.gov/Archives/edgar/data/746838/000110465925058412/tm2517689d1_8k.htm) (snippets)
- 11 June 2025: Unisys proposed $700 million senior secured notes due 2031 with a concurrent cash tender offer and consent solicitation for the 2027 notes ($485 million outstanding) — [8-K June 2025](https://www.sec.gov/Archives/edgar/data/746838/000110465925058412/tm2517689d1_8k.htm) (snippet)
- Priced and closed 27 June 2025: $700.0 million 10.625% senior secured notes due 15 Jan 2031; interest 15 Jan and 15 Jul from 15 Jan 2026; guaranteed by Unisys Holding Corporation, Unisys AP Investment Company I and Unisys NPL, Inc.; guarantor group to expand to U.S. domestic subsidiaries that guarantee the ABL — [Unisys closing release](https://www.unisys.com/siteassets/collateral/news/closing-private-offering-senior-secured-notes-062725.pdf); [TipRanks pricing](https://www.tipranks.com/news/company-announcements/unisys-announces-pricing-of-700m-senior-secured-notes); [MarketScreener](https://www.marketscreener.com/quote/stock/UNISYS-CORPORATION-14744/news/Unisys-Announces-Closing-of-700-Million-Private-Offering-of-Senior-Secured-Notes-Net-Proceeds-to-B-50356857/)
- Use of proceeds: tender for the 2027 notes, redeem leftovers, and fund part of the US pension deficit and postretirement liabilities — same sources
- At 31 Dec 2025 total indebtedness was $741.7 million including the $700 million 2031 notes; fair value of the 10.625% notes $717.5 million — [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm) (snippets). Long term debt $729 million, current maturities $13 million — [edgar.tools](https://app.edgar.tools/companies/UIS) (aggregator)
- Q2 2026: cash $324.3 million at 30 June 2026 vs $413.9 million at 31 Dec 2025; Q2 free cash flow −$49.0 million; H1 −$74.5 million; 2026 FCF guidance about −$25 million, capex about $85 million — [Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/0000746838/000074683826000025/q22026earningsrelease.htm) (snippet via [Placera](https://www.placera.se/pressmeddelanden/unisys-unisys-announces-2q26-results-20260729)). Third party: long term debt $722 million — [Panabee](https://www.panabee.com/news/unisys-earnings-q2-2026-report) (unverified)
- Price/yield snapshots for the 2031 notes (undated, conflicting, thin trading): YTM 10.77% at 99.37; 10.33% at 101.10; 10.12% at 101.78; 9.05% at 106.39; 8.72% at 107.82 — [TradingView](https://www.tradingview.com/symbols/GETTEX-USY1/bonds), [TradingView SWB](https://in.tradingview.com/symbols/SWB-USY1/bonds)
- The 6.875% 2027 notes still have a TradingView/FINRA page (status after tender unknown) — [TradingView FINRA](https://www.tradingview.com/symbols/FINRA-UIS5076423/analysis-overview)

### Inferences
- $717.5M fair value over $700M par implies a year end 2025 price of about 102.5 (arithmetic on two cited numbers, assumes fair value equals clean price times par). That is consistent with a yield near the 10% coupon area, not a distress level.
- $741.7M total indebtedness less $700M notes leaves about $41.7M of other debt (likely leases or local facilities), composition not confirmed.
- The 10.625% coupon against a Treasury benchmark implies a new issue spread of several hundred basis points at issue, but the issue yield and Treasury benchmark were not retrieved.

### Gaps
- Final tender results for the 2027 notes (amount tendered vs redeemed): not found; the 10-K total debt implies full retirement.
- Current (Oct 2026) price, YTM and spread over Treasuries from TRACE/Bloomberg/MarketAxess: Gap. No dated quote.
- Treasury benchmark yield and spread: Gap.
- Amended and Restated ABL Credit Facility size, drawn amount, maturity, covenants: Gap.
- Any 2026 refinancing or new issuance: none found.
- CDS: no Unisys CDS quote found; it is likely there is no liquid single name CDS, but that is not confirmed. Gap.

## 5. Agency rating action reasons and rating changes after pension actions and FY2025 results

### Takeaway
The latest action I can document is Moody's March 2025 downgrade to B2 (stable). No agency action after the June 2025 refinancing, September 2025 F&G annuity, FY2025 results or September 2026 NY Life annuity was found.

### Cited Findings
- Pension actions: Sept 2025 transfer of about $320 million (some listings say $250 million of group annuity contracts first announced) of US pension obligations to F&G — [MyChesCo](https://www.mychesco.com/?p=641004)
- 16 Sept 2026: closed a group annuity of about $200 million with New York Life covering about 1,700 retirees; expected Q3 2026 non cash pre tax settlement charge about $150 million; no cash effect (purchase from pension trust); cumulative reduction about $520 million since July 2025 against a $600 million target; one further settlement expected by Jan 2027 — [Placera release](https://www.placera.se/pressmeddelanden/unisys-unisys-transfers-approximately-200-million-of-its-u-s-defined-benefit-pension-obligations-to-new-york-life-through-the-purchase-of-a-group-annuity-contract-20260916); [MyChesCo](https://www.mychesco.com/a/news/regional/unisys-cuts-u-s-pension-liabilities-by-another-200-million/)
- FY2025 10-K ratings text (filed about Feb 2026) still lists only the 2024 S&P and 2025 Moody's downgrades and both stable — [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm) (snippet)
- Pension funding deficit $448.5 million at 31 Dec 2025, down $301.7 million, mainly from $343.7 million cash contributions including a $250 million discretionary one (snippet of Q4 2025 materials) — [Unisys 4Q25 results PDF](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf)
- Q2 2026: revenue $473.5 million (−2.0%); $47.2 million non cash goodwill impairment (DWS unit); backlog $2.8 billion; guidance reaffirmed; global pension deficit improved $30 million from year end — [Q2 2026 release via Placera](https://www.placera.se/pressmeddelanden/unisys-unisys-announces-2q26-results-20260729); [Nasdaq call highlights](https://www.nasdaq.com/articles/unisys-q2-earnings-call-highlights)

### Inferences
- Stable outlooks at the 10-K date, plus no news of a later action in searches, suggest ratings are unchanged, but absence of search results is weak evidence. Treat current status as unconfirmed.
- Negative free cash flow in H1 2026 and the goodwill impairment are the kind of items agencies cite for pressure; no agency commentary was found.

### Gaps
- What each agency said in its most recent action (S&P: nothing found; Moody's: March 2025 only via secondary source).
- Whether either agency commented on the pension annuity transactions or Q2 2026 results: not found.
- Dated Moody's/S&P pages: ratings.moodys.com and spglobal.com were not fetchable.

## 6. Published distance to default or market implied default probability, and Merton inputs

### Takeaway
No Merton/KMV distance to default, Bloomberg DRSK, or Moody's EDF figure for Unisys was found. Only low quality aggregator scores exist, and they conflict. Merton inputs available: market cap and share count (dated), debt and cash (dated). Equity volatility is a Gap, so no DD is computed here.

### Cited Findings
- valueinvesting.io: 49.69% probability of bankruptcy within 24 months (composite of Altman Z, Beneish M and other inputs, undated, methodology opaque) — [valueinvesting.io](https://valueinvesting.io/UIS/probability-of-bankruptcy)
- AlphaSpread NYSE:UIS page: 1.1% probability of bankruptcy ("highly unlikely"); other AlphaSpread pages hide the figure; price on snapshots differs ($3.12 vs $2.30) so they are different dates — [AlphaSpread](https://new.alphaspread.com/security/nyse/uis/solvency)
- roic.ai Altman Z-score −0.63 (undated) — [roic.ai](https://www.roic.ai/quote/UIS/statistics)
- Market cap and price: last close $3.63 on 20 Jul 2026 with market cap $264.65 million — [Motley Fool quote](https://www.fool.com/quote/nyse/unisys/uis/); $148.99 million on 2 Apr 2026 — [Public.com](https://public.com/stocks/uis/market-cap); $253.71 million at $3.48 with 72,905,170 shares (undated) — [Equibles](https://equibles.com/stocks/uis/summary); 71.31 million shares and $201 million (undated) — [Ortex](https://app.ortex.com/s/NYSE/UIS). Share counts vary from 71.3 to 72.9 million.
- Debt (Merton D candidate): $741.7 million total indebtedness at 31 Dec 2025, all long dated secured notes due Jan 2031 — [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm) (snippet)
- Pension deficit at 31 Dec 2025: $448.5 million funding basis (Q4 2025 materials, snippet) — [4Q25 PDF](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf); third party $485 million underfunded pension (Q2 2026, unverified) — [Panabee](https://www.panabee.com/news/unisys-earnings-q2-2026-report)
- Cash $324.3 million at 30 June 2026 — [Q2 2026 release via Placera](https://www.placera.se/pressmeddelanden/unisys-unisys-announces-2q26-results-20260729)

### Inferences
- Inputs a Merton/naive DD run would need: E (market cap, October 2026 close: Gap), sigma_E (trailing 1 year daily or implied volatility: Gap), D (face value of debt $700M notes plus other debt; pension and lease inclusion is a judgment call), T (1 year), r (risk free: Gap), mu (equity return, for naive DD use the past year stock return: Gap). CHS needs additionally net income, total liabilities, cash, book equity, price and index excess returns: Gap.
- Aggregator "probability of bankruptcy" values (1.1% vs 49.7%) are not comparable to Merton PDs and should not be used as a point estimate.

### Gaps
- Equity volatility (historical or implied) for UIS: Gap.
- Market cap and price at October 2026: Gap (latest dated is 20 July 2026).
- Bloomberg DRSK, Moody's EDF, S&P CreditModel PD, or academic replication for UIS: none found.
- Computed DD: not produced because sigma_E, E at date, r and mu are missing.

## 7. Performance of these frameworks when the largest liability is a pension deficit

### Takeaway
No source found that tests these models on pension heavy issuers; the points below are limited to what the sources support. The Unisys pension deficit (about $449M funding basis at year end 2025) is of similar size to its funded debt ($742M total), so the choice of liability definition materially changes leverage and DD.

### Cited Findings
- Moody's explicitly lists future US pension contributions as a risk in its Unisys action — [Investing.com](https://www.investing.com/news/stock-market-news/unisys-credit-rating-downgraded-by-moodys-outlook-now-stable-93CH-3938020)
- Company says pension cash contributions drive liquidity: 2025 contributions $343.7 million including a $250 million discretionary payment funded by the 2031 notes; about $100 million guided for 2026 — [4Q25 PDF](https://www.unisys.com/siteassets/investor-relations/earnings-files/2025/4q-2025-022426.pdf); [Placera Q2 2026](https://www.placera.se/pressmeddelanden/unisys-unisys-announces-2q26-results-20260729)
- Valens Research (opinion) argued agencies treated pension risk with traditional metrics and overstated it for Unisys — [Valens Research](https://www.valens-research.com/investor-essentials-daily/uis-unisys-corporation-consulting-firms-underfunded-pension-rating-agencies-panicked-wrong-reasons/)
- Merton model limits: default point is a heuristic, and the model assumes simple debt claims — [acadifi](https://acadifi.com/community/merton-model-distance-to-default-structural-credit-risk); [Bharath and Shumway](https://ideas.repec.org/a/oup/rfinst/v21y2008i3p1339-1369.html)

### Inferences
- Standard debt only DD (D = $700M notes) ignores a claim that is the same order of magnitude; adding the pension deficit to D would roughly raise D by 60%. Both choices are defensible, and the results would diverge; this should be shown as a sensitivity once sigma_E is available.
- Pension liabilities are not accelerated on a missed contribution the way bond principal is; a missed minimum contribution triggers PBGC and IRS consequences and could breach covenants. So pension acts as a claim on cash flow, not a default trigger in the Merton sense. Reasoning, not sourced.
- CHS and naive DD use market equity, so a pension deficit lowers equity value through the stock price indirectly, but the accounting leverage measure (TLMTA) would include pension liabilities if total liabilities are used. Hazard model coefficients were estimated on firms with far smaller pension share, so extrapolation is weak. Reasoning, not sourced.
- Bond spread and CDS measure the secured notes' PD only; secured notes with a first lien on substantially all assets could trade tight even if equity holders are close to wiped out. Reasoning.

### Gaps
- Empirical studies of Merton/CHS performance on pension heavy firms: not searched in depth, none found.
- How Moody's and S&P adjust Unisys debt for pension (adjusted leverage figures): not found (Moody's cites about 4.5x debt to EBITDA, unclear if pension adjusted).

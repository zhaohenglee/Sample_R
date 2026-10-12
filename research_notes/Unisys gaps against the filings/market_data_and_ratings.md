# Unisys (NYSE: UIS) market and rating inputs for distance to default and bond implied default probability, as of 12 October 2026

Method: curl only (per FETCH_RULES), UA with contact address, downloads saved to `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/edgar/downloads_market/`. Script: `.../edgar/scripts/market_inputs.py` (run with `python3 -I`), results `.../scripts/market_results.json`; combined raw inputs and results in `market_inputs.json` beside this note. Nothing was estimated. Where a call failed, the host and result are stated.

## Computed inputs and outputs (summary table)

| Item | Value | As of | Source |
|---|---|---|---|
| UIS last close | $2.22 | 9 Oct 2026 | Yahoo chart API, raw JSON saved |
| 252 day annualised volatility (daily log returns, sample sd x sqrt 252) | 64.24% (daily sd 4.046%) | window 9 Oct 2025 to 9 Oct 2026 | Yahoo chart API |
| 1 year return | -43.80% ($3.95 on 9 Oct 2025 to $2.22) | 9 Oct 2026 | Yahoo chart API |
| Shares outstanding | 72,915,955 | 30 Jun 2026 | Q2 2026 10-Q cover page (filed 30 Jul 2026) |
| Market capitalisation | $161.87 million (2.22 x 72,915,955) | price 9 Oct 2026, shares 30 Jun 2026 | computed |
| Total debt | $733.5 million | 30 Jun 2026 | Q2 2026 10-Q, Note 13 Debt, "Total 733.5" |
| 1 year / 5 year Treasury (par, CMT) | 4.47% / 5.02% | 9 Oct 2026 | home.treasury.gov daily par yield curve; FRED DGS1/DGS5 last print 8 Oct 2026 was 4.44% / 4.99% (FRED had no 9 Oct row) |
| 2031 notes price and YTM | 94.50 and 12.29% | 7 Oct 2026 (FINRA feed via TradingView) | see section 3 |
| Matched Treasury (4.27 years, linear interpolation of 3Y 4.87% and 5Y 5.03%) | 4.97% | 7 Oct 2026 | Treasury curve |
| Spread over Treasury | 7.32% | 7 Oct 2026 | computed |
| Bond implied annual default probability (40% recovery) | 11.5% (hazard 12.20%); cumulative to maturity (4.27 years) 40.6% | 7 Oct 2026 | computed |
| Naive distance to default, mu = past year stock return | DD -0.97, PD 83.4% | 9 Oct 2026 | computed |
| Naive DD, sensitivity with mu = 1 year Treasury 4.47% | DD +0.70, PD 24.2% | 9 Oct 2026 | computed |

Naive DD inputs: E = $161.87m; F = $733.5m; V = E + F = $895.37m; sigma_E = 0.6424; sigma_D = 0.05 + 0.25 x sigma_E = 0.2106; sigma_V = E/V x sigma_E + F/V x sigma_D = 0.2886; T = 1 year. Formula (Bharath and Shumway 2008): DD = [ln(V/F) + (mu - 0.5 sigma_V^2) T] / (sigma_V sqrt T); PD = N(-DD). Bharath and Shumway set mu to the prior year stock return, which is -43.8% here, so it drags DD below zero. The sensitivity row replaces mu with the 1 year Treasury yield; the risk free rate does not otherwise enter the naive formula. Both rows are shown, not averaged.

Bond formula: spread s = YTM - matched Treasury; hazard lambda = s / (1 - R) with R = 0.40; annual PD = 1 - exp(-lambda); cumulative PD to maturity = 1 - exp(-lambda x T). Sensitivities in `market_inputs.json`: versus the plain 5Y Treasury, annual PD 11.4%; R = 30%, 9.9%; R = 50%, 13.6%. These are risk neutral numbers that include liquidity and risk premia, so they overstate real world default probability.

## 1. Equity: daily closes, volatility, return, market cap

### Takeaway
UIS closed at $2.22 on 9 Oct 2026, down 43.8% over one year, with 64.2% annualised volatility on 252 daily log returns, giving a market cap of about $162 million against $733.5 million of debt.

### Cited Findings
- 501 daily closes from 10 Oct 2024 to 9 Oct 2026, none missing; last close $2.22 on 9 Oct 2026 (previous close $2.31 on 8 Oct) — [Yahoo Finance chart API](https://query1.finance.yahoo.com/v8/finance/chart/UIS?range=2y&interval=1d), saved as `yahoo_uis_2y.json`
- Closing high in the 252 day window $4.78 on 1 Jun 2026; closing low $2.00 on 10 Apr 2026; Yahoo meta shows intraday 52 week range $1.97 to $4.98 — same source
- Price path in the series: $3.66 on 30 Jun 2026, $3.63 on 20 Jul 2026, $3.15 on 30 Jul (10-Q filing day), $2.87 on 31 Jul 2026. The two largest one day log falls in the two year series were -23.7% on 6 Dec 2024 (outside the 252 day window) and -22.5% on 6 Nov 2025 (inside it) — same source
- Share count 72,915,955 at 30 Jun 2026: "Number of shares of Unisys Common Stock, par value $.01, outstanding as of June 30, 2026: 72,915,955" — [Unisys 10-Q for Q2 2026, cover page](https://www.sec.gov/Archives/edgar/data/746838/000074683826000027/uis-20260630.htm)
- Total debt $733.5 million at 30 Jun 2026 (10.625% notes $686.9m carrying after $11.5m issuance costs against $698.4m face, finance leases $37.3m, other debt $9.3m; less current maturities $11.6m = long term $721.9m); MD&A: "At June 30, 2026, total debt was $733.5 million compared to $741.7 million at December 31, 2025", and $1.6m of the 2031 notes repurchased for $1.4m in the half — same 10-Q, Note 13 and liquidity section

### Inferences
- Market cap uses a 9 Oct 2026 price with 30 Jun 2026 shares; the 8 Oct 2026 share count is not available, so it may differ slightly. Equity is about 18% of E + F, which is why the naive DD is so sensitive to mu.
- Volatility is historical, not implied; no option implied volatility was retrieved.

### Gaps
- Share count after 30 Jun 2026 (the Q3 10-Q is not yet filed). Net debt and cash were not part of this task.

## 2. Risk free rate

### Takeaway
The latest Treasury par yields are 4.47% (1 year) and 5.02% (5 year) for 9 Oct 2026; FRED agrees on earlier dates but lags a day.

### Cited Findings
- 9 Oct 2026 curve: 6 Mo 4.32%, 1 Yr 4.47%, 2 Yr 4.80%, 3 Yr 4.89%, 5 Yr 5.02%, 7 Yr 5.13%, 10 Yr 5.24% — [US Treasury daily par yield curve, Oct 2026](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202610)
- FRED last observation 8 Oct 2026: DGS1 4.44%, DGS5 4.99% (matches Treasury page for 8 Oct); 7 Oct 2026: DGS1 4.42, DGS3 4.87, DGS5 5.03 — [FRED DGS1](https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS1), [DGS5](https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS5), [DGS3](https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS3)
- 30 Jun 2026 curve (used for the 10-Q fair value cross-check): 1Y 3.98, 3Y 4.15, 5Y 4.19 — [US Treasury June 2026](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202606)

### Inferences
- Treasury yields rose about 80 basis points at 5 years between 30 Jun and 7 Oct 2026 (4.19% to 5.03%), so part of the bond yield move since the 10-Q is rates, not credit.

### Gaps
- None for this step.

## 3. The 10.625 percent senior secured notes due 2031: price and yield

### Takeaway
One dated FINRA sourced quote exists: price 94.50, YTM 12.29% on 7 Oct 2026, plus a 10-Q derived Level 2 fair value at 30 Jun 2026 (price about 94.2, recomputed YTM 12.32%). Boerse Frankfurt, the FINRA/Morningstar bond center and Moody's returned no bond data to curl.

### Cited Findings
- Quote 1, venue FINRA (TRACE feed, delivered by TradingView with ICE Data Services; flagged "delayed streaming 14400" seconds): price 94.5, yield to maturity 12.290%, bar dated 7 Oct 2026, volume 200,000 face; page metadata update stamp 7 Oct 2026 13:15 UTC; all time low 83.403 on 31 Mar 2026, all time high 107.816 on 25 Sep 2025; outstanding amount 706.92m, issue date 27 Jun 2025 — [TradingView FINRA:UIS6102484](https://www.tradingview.com/symbols/FINRA-UIS6102484/) and the TradingView scanner call (`scanner.tradingview.com/bond/scan`, response saved as `bonds/tv_scan.json`). TradingView's own identifiers: CUSIP U90921AG9, ISIN USU90921AG93 (the Reg S style code); the Rule 144A note CUSIP is 909214 BX5 in the form of note in [Exhibit 4.1 indenture of 27 Jun 2025](https://www.sec.gov/Archives/edgar/data/746838/000110465925063658/tm2517689d2_ex4-1.htm). A recompute of YTM from the 94.5 clean price (semiannual, 30/360, settlement 8 Oct 2026) gives 12.31%, consistent with the reported 12.29%.
- Quote 2, venue the company's own 10-Q (not a trade): fair value $658.0m at 30 Jun 2026 (carrying $686.9m, Level 2 "based on market prices") against face $698.4m, an implied price of 94.22; recomputed YTM 12.32% versus a 4.18% interpolated Treasury, spread 8.14%, implied annual PD 12.7% at 40% recovery. At 31 Dec 2025 fair value was $717.5m (price about 102.5 on $700.0m face) — [Q2 2026 10-Q, Note 10 Fair value](https://www.sec.gov/Archives/edgar/data/746838/000074683826000027/uis-20260630.htm)
- Spread and default probability from Quote 1: see the summary table. Treasury is interpolated linearly between the 3 and 5 year par yields on 7 Oct 2026 (4.27 years to 15 Jan 2031).
- Failed routes: `finra-markets.morningstar.com/BondCenter/` returns 200 but the page is a FINRA shell (JavaScript, no data); `finra.org/finra-data/fixed-income/bond?cusip=909214BX5` returns 200, a generic shell; `boerse-frankfurt.de/bonds` returns 200 but is an Angular shell, and `api.boerse-frankfurt.de` search returned `{}` for "Unisys" and for the CUSIP, with HTTP 404 "No data found for given ISIN: US909214BX53" for the price endpoint; TradingView `GETTEX-USY1/bonds`, `SWB-USY1/bonds` and `NYSE-UIS/bonds` list "No symbols match your criteria" (their embedded price 2.0195 and 1.968 are the equity in EUR, not the bond); marketwatch.com returned 401. WebSearch for the 144A CUSIP found no quote.
- The 6.875% notes due 2027 still list on TradingView (FINRA:UIS5076423, price 99.05, YTM 7.31%, last bar 27 Jun 2025); they were refinanced in June 2025 and the quote is stale, so it is not used.

### Inferences
- The quote is a single TRACE derived print of unknown size beyond 200,000 face on the bar; thin trading means the 12.29% is indicative.
- Exact trade date inside 6 to 7 Oct 2026 is not certain (bar date 7 Oct, snapshot stamp 13:15 UTC on 7 Oct). A one day shift changes the matched Treasury by about 1 to 4 basis points, which is immaterial to the 11.5% result.
- The quoted yield is YTM; yield to worst was not computed because the call schedule was not retrieved for this note.
- The bond implied annual PD (11.5%) and the naive DD PD (24.2% to 83.4%) are on different bases (risk neutral hazard versus a one year physical probability under different drift assumptions) and should not be compared as if equal.

### Gaps
- Trade level detail (time, size, side) from TRACE and any second dealer quote: no host returned them. CDS: not searched here.

## 4. Ratings

### Takeaway
The only dated rating status is the FY2025 10-K (filed Feb 2026): S&P B and Moody's B2, both stable. moodys.com and spglobal.com could not be opened to curl for press releases, and no rating action in 2026 turned up in search.

### Cited Findings
- Company statement: "In 2024, we were downgraded from B+ to B by Standard & Poor's 500, and in 2025 we were downgraded from B1 to B2 by Moody's. Both rating agencies currently rate Unisys with a stable outlook." The "500" is as printed in the filing — [Unisys FY2025 10-K, risk factors on rating](https://www.sec.gov/Archives/edgar/data/746838/000074683826000006/uis-20251231.htm)
- The Q2 2026 10-Q contains no rating or outlook sentence (only a forward looking item on maintaining a credit rating) — [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/746838/000074683826000027/uis-20260630.htm)
- Snippet, Moody's action: CFR and senior secured rating cut to B2 from B1, outlook stable from negative, covering the $485m 6.875% notes due 2027; reasons per the Investing.com report: expected little or no revenue growth and debt to EBITDA around 4.5x over 12 to 18 months; B2 CFR reflects debt to EBITDA of 4.8x at 31 Dec 2024, small scale and a competitive industry; Moody's treated the $776m underfunded pension as debt. Date: about March 2025 (a search tool said about 571 days before 12 Oct 2026; the exact day was not confirmed) — [Investing.com (snippet)](https://www.investing.com/news/stock-market-news/unisys-credit-rating-downgraded-by-moodys-outlook-now-stable-93CH-3938020). Snippet only; investing.com returns 403 to curl.
- S&P: WebSearch snippets (queries with 2024, 2025, 2026) found no S&P press release for Unisys; the 2024 B+ to B downgrade rests on the 10-K sentence above only (snippet level, no date or reasons).

### Inferences
- Rating status in October 2026 is probably unchanged (stable B / B2) but this is unconfirmed by any October 2026 primary page.
- The 94.5 bond price and 12.3% yield are far from a B2 level; the market is pricing the notes like a low single B or CCC credit. This is a judgment from the spread, not a rating fact.

### Gaps
- Moody's CFR, the rating on the 2031 notes, outlook and every action since 2024 from moodys.com: `moodys.com/web/en/us/search.html?q=Unisys` returned 404; `ratings.moodys.com/ratings-news?q=Unisys` and `/search?q=Unisys` return a 34,642 byte JavaScript shell; `ratings.moodys.com/api/rmc-documents` returned 403; `ratings.moodys.com/mmc-documents/356901` returned the same shell. No press release text was retrievable.
- S&P issuer and issue rating, dates and stated reasons: spglobal.com not fetched (403 per FETCH_RULES); no snippet found. Fitch: not found.
- Issue rating of the 2031 notes at either agency: not found.

## 5. Default rate tables

### Takeaway
The S&P 2024 study table 24 (1981 to 2024 pooled, issued 27 Mar 2025) is available only in secondary copies; a B rated issuer defaults at 2.93% in one year, 10.46% in three and 15.60% in five. Moody's annual default study 2025 was not retrievable.

### Cited Findings
- S&P table 24, global corporates, average cumulative default rates 1981 to 2024, percent. SECONDARY copy at ledgertouch.com (article dated 21 Aug 2026, which labels it "Source: S&P Global Ratings, table 24"):

| Rating | 1 year | 3 years | 5 years | 10 years |
|---|---|---|---|---|
| B | 2.93 | 10.46 | 15.60 | 22.02 |
| CCC/C | 26.12 | 41.32 | 46.53 | 50.43 |
| BB (context) | 0.56 | 3.12 | 5.75 | 10.44 |
| Speculative grade (context) | 3.54 | 9.55 | 13.64 | 19.15 |

  — [Ledgertouch](https://ledgertouch.com/blog/planning-and-costs/default-rates-by-credit-rating); second secondary host with the 1, 5 and 10 year columns, identical values, citing "March 27, 2025, table 24": [investmentgrade.com](https://investmentgrade.com/bond-ratings/)
- Ledgertouch also reports S&P's March 2026 SEC filing figure: 16.77% of issuers rated B at 31 Dec 2015 had defaulted 10 years later and 68.60% had the rating withdrawn (single cohort, not comparable with the average cohort table) — same Ledgertouch page (secondary)
- S&P Investor Factbook page carries the chart for the same data but the values are not in the HTML (chart only, source line reads "2023 Annual Global Corporate Default and Rating Transition Study, March 27, 2025", a labelling inconsistency with the 2024 study title) — [S&P Investor Factbook](https://investorfactbook.spglobal.com/sp-global-ratings/ratings-track-record-standing-the-test-of-time/)

### Inferences
- S&P's table is by letter category, so it applies to Unisys at B (S&P). It is not split into B+, B, B minus.
- The 2025 study (published around March 2026, covering 1981 to 2025) was not found, so these are the 2024 vintage numbers, about 18 months old.

### Gaps
- Primary S&P PDF: spglobal.com 403; the Maalot copies `maalot.co.il/Publications/FTS20250331162126.pdf` and `.../TS20250630083120.pdf` both return 403 to curl.
- Moody's Annual Default Study 2025 and any B2, B band or Caa one, three, five year rates: moodys.com search 404; ratings.moodys.com/api/rmc-documents/427804 returned 403; Scribd copies (2023 and 2024 editions) return a 3 KB stub with no text. Only a 2004 edition B2 row appeared in a search snippet (5.42, 13.62, 20.67, 27.74, 31.77 for years 1 to 5), too old to use.
- S&P 2025 edition table: not found.

## 6. Computation record

### Takeaway
The script and its outputs are saved; all inputs above are read from the downloaded files or stated as constants with sources.

### Cited Findings
- Script: `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/edgar/scripts/market_inputs.py`, run with `python3 -I market_inputs.py <downloads_market dir> <output json>`; combined output `market_inputs.json` built by `build_json.py` — local scripts
- Constants typed into the script: shares 72,915,955, debt $733.5m, fair value $658.0m, face $698.4m, recovery 40%, naive sigma_D rule 0.05 + 0.25 sigma_E — Q2 2026 10-Q and the task spec

### Inferences
- The naive DD of -0.97 (PD 83%) is mostly a result of using a -43.8% trailing return as drift. Treat 24% (risk free drift) as the more neutral reading and both as high. Neither equals a forecast.

### Gaps
- No Merton solved asset value and asset volatility (iterative KMV style) was run; the task asked for the naive version only.

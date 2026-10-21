# Resilient Chinese compounders: closest candidates to a 12 percent, shallow drawdown stock over 20 years (Oct 2006 to Oct 2026)

Scope: price window 2006-10-20 to 2026-10-20, fiscal years 2006 to 2025, 18 shortlisted companies. All arithmetic was done in scripts (`/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/scripts_fund/`: shortlist.py, stress.py, build_a.py, build_hk.py, assemble.py, assemble2.py, yz_check.py, pricelib.py). Stress window drawdowns were recomputed from the cached Yahoo series and match the screen CSVs to two decimals for every shortlisted stock (except China Yangtze Power, where the screens write `gap`). Method conventions: stock drawdowns use `adjclose` (dividends reinvested); A share benchmark is the CSI 300 total return index (price index shown in the benchmark table); HK names use the Hang Seng Index (HSI, price only: the stock series includes reinvested dividends and the index does not, which flatters the stock slightly and is not adjusted); NetEase uses FXI (USD total return ETF). Stress windows are those used by the screens: 2007-10-01 to 2008-12-31, 2015-06-01 (HK/US: 2015-04-01) to 2016-02-29, calendar 2018, 2021-01-01 to 2024-09-30 (peak to trough inside each window).

## Q1. Shortlist: which stocks are the closest candidates?

### Takeaway
Applying the stated rule to the 132 A share and 33 HK/US stocks with CAGR of 12 percent or more (165 combined) gives 15 names by CAGR divided by absolute maximum drawdown, plus Yili (R2 and negative year rule) and the two shallowest drawdown names (Grandblue, China Yangtze Power); Gree, Moutai, Tencent and NetEase were already in the top 15, so the final list is 18 companies. Nothing on it is a true shallow drawdown compounder: the shallowest are Grandblue at -54.65 percent and Yangtze Power at -55.6 percent, and the best ratio is Tencent at 0.379.

### Cited Findings
- Source tables: the A share CSV has 1,085 eligible stocks, 132 with CAGR of 12 percent or more; the HK/US CSV has 190 mainland classified stocks, 33 with CAGR of 12 percent or more. The ratio is the screens' own `composite` (A share) or `cagr_over_abs_mdd` (HK/US), recomputed in `shortlist.py` as CAGR / |max drawdown| from the corrected CAGR (`cagr_pct`, `cagr`), `mdd_pct`/`mdd`, `r2_monthly` and `n_neg_years`/`neg_years` columns — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv); [hk_us_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/hk_us_screen.csv)
- Shortlist with metrics (ranks are on CAGR/|DD| across all 165 stocks):

| # | Symbol | Company | Table | CAGR % | Max DD % | CAGR / abs(DD) | Rank on ratio (of 165) | R2 | Neg. yrs | Why included |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0700.HK | Tencent | HK/US | 27.60 | -72.80 | 0.379 | 1 | 0.875 | 6 | top 15 by ratio (rank 1); also on the named list |
| 2 | NTES | NetEase | HK/US | 21.38 | -57.34 | 0.373 | 2 | 0.951 | 5 | top 15 (also R2 0.95 and 5 negative years) |
| 3 | 000651.SZ | Gree Electric | A share | 23.99 | -65.03 | 0.369 | 3 | 0.886 | 8 | top 15 by ratio (rank 3); also on the named list |
| 4 | 600519.SS | Kweichow Moutai | A share | 21.78 | -62.49 | 0.349 | 4 | 0.902 | 6 | top 15 by ratio (rank 4); also on the named list |
| 5 | 1385.HK | Fudan Microelectronics | HK/US | 25.84 | -78.83 | 0.328 | 5 | 0.837 | 6 | top 15 by ratio (rank 5) |
| 6 | 0512.HK | Grand Pharmaceutical | HK/US | 24.70 | -76.87 | 0.321 | 6 | 0.871 | 7 | top 15 by ratio (rank 6) |
| 7 | 002001.SZ | Zhejiang NHU | A share | 21.52 | -68.92 | 0.312 | 7 | 0.860 | 6 | top 15 by ratio (rank 7) |
| 8 | 000977.SZ | IEIT Systems | A share | 21.04 | -70.08 | 0.300 | 8 | 0.884 | 7 | top 15 by ratio (rank 8) |
| 9 | 600176.SS | China Jushi | A share | 21.01 | -70.06 | 0.300 | 9 | 0.784 | 7 | top 15 by ratio (rank 9) |
| 10 | 600276.SS | Jiangsu Hengrui | A share | 20.78 | -70.99 | 0.293 | 10 | 0.891 | 5 | top 15 (also R2 >= 0.85 and 5 negative years) |
| 11 | 600406.SS | NARI Technology | A share | 16.86 | -57.60 | 0.293 | 11 | 0.843 | 6 | top 15 by ratio (rank 11) |
| 12 | 002050.SZ | Zhejiang Sanhua | A share | 21.57 | -74.65 | 0.289 | 12 | 0.932 | 6 | top 15 by ratio (rank 12) |
| 13 | 600760.SS | AVIC Shenyang Aircraft | A share | 21.16 | -73.53 | 0.288 | 13 | 0.880 | 6 | top 15 by ratio (rank 13) |
| 14 | 002028.SZ | Sieyuan Electric | A share | 18.96 | -66.75 | 0.284 | 14 | 0.730 | 5 | top 15 by ratio (rank 14) |
| 15 | 600522.SS | Zhongtian Technology | A share | 19.09 | -67.56 | 0.283 | 15 | 0.843 | 6 | top 15 by ratio (rank 15) |
| 16 | 600887.SS | Inner Mongolia Yili | A share | 14.63 | -78.58 | 0.186 | 86 | 0.859 | 5 | R2 >= 0.85 and <= 5 negative years (named in A share note) |
| 17 | 600323.SS | Grandblue Environment | A share | 13.45 | -54.65 | 0.246 | 31 | 0.892 | 7 | shallowest drawdown among 12% compounders |
| 18 | 600900.SS | China Yangtze Power | A share | 13.64 | -55.60 | 0.245 | 33 | 0.870 | 8 | second shallowest drawdown among 12% compounders |

- Stocks that satisfy R2 of at least 0.85 and five or fewer negative calendar years across both tables: only NetEase (R2 0.951, 5), Hengrui (0.8915, 5) and Yili (0.8589, 5); zero stocks have four or fewer negative years — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv); [hk_us_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/hk_us_screen.csv)
- Two shallowest whole window drawdowns among 12 percent compounders: Grandblue Environment -54.65 percent (peak 2015-06-08, trough 2015-07-08) and China Yangtze Power -55.6 percent (peak 2007-10-16, trough 2011-09-06); next are Yunnan Baiyao -56.11 percent (CAGR 12.62), NetEase -57.34 and NARI -57.60 — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv); [hk_us_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/hk_us_screen.csv)
- Price adjustment flags carried from the A share screen: IEIT Systems (Yahoo price multiple 43.58 versus independent 36.81, +18.4 percent difference; conservative CAGR 20.02 percent) and China Jushi (Yahoo price multiple 33.72 versus independent 30.36, +11.1 percent; conservative CAGR 20.38 percent) are "unconfirmed" in the screen; NARI's window starts 2006-11-03 because it did not trade for 10 market days after 2006-10-20 — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv)

### Inferences
- The top 15 is dominated by names that are not low risk at all (median drawdown about -70 percent). The ratio rewards high CAGR as much as shallow drawdown, so it is a poor proxy for "resilient". The only genuinely shallower names are the two utilities forced in by the shallowest drawdown rule (Grandblue, Yangtze Power) and NetEase.
- Grand Pharmaceutical (rank 6) and AVIC Shenyang Aircraft (rank 13) started 2006 as loss making companies (see Q2, Q3), so their ranks reflect a low base, not a durable compounding record.

### Gaps
- The Sina based CAGR ranking (133 stocks at 12 percent) differs slightly from the Yahoo ranking; the shortlist uses the Yahoo corrected figures as instructed.
- Dual listings: Fudan Micro (also 688385.SS, listed after 2006), Weichai, BYD and others appear only once (HK table) because their A shares do not qualify for the A table; China Merchants Bank appears in both tables but is not near the top 15.

## Q2. Per company: ROE durability, DuPont, payout, behaviour in each selloff, and why it fell less or recovered faster

### Takeaway
ROE durability separates the group: Tencent, Gree, Moutai (never at or below 15 percent), NetEase (one year) and NARI (three years) have it; IEIT, Zhongtian, Grandblue, AVIC Shenyang and Sieyuan do not. But durable ROE did not translate into smaller drawdowns: the 18 stocks had a shallower drawdown than their benchmark in 13 of 17 windows in 2007 to 2008, only 5 of 17 in 2015 to 2016, 3 of 18 in 2018 and 2 of 18 in 2021 to 2024. Where earnings were recorded, nearly every price fall was multiple compression (profits rose in most selloffs). What the group did do is regain peaks faster than the indexes, which regained them slowly (79 months for the CSI 300 TR after 2008), and that is partly survivorship.

### Cited Findings
**ROE series, FY2006 to FY2025 (percent).** Seven companies (Moutai, Gree, Hengrui, Yili, Yangtze Power, Tencent, NetEase) are reused from [roe_prefetch.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/roe_prefetch.csv) (Sina weighted average ROE for A shares, Eastmoney HK computed average equity ROE for Tencent, computed net income over average equity for NetEase). The other 11 use the same method: Sina weighted average ROE for the 31 December column, Eastmoney weighted ROE (`ROEJQ`) where Sina shows `--` (2016 for Jushi, AVIC, Zhongtian), and Eastmoney HK `ROE_AVG` (net profit over average parent equity) for Fudan Micro and Grand Pharma. Sources: [Sina financial guideline pages](https://money.finance.sina.com.cn/corp/go.php/vFD_FinancialGuideLine/stockid/002001/ctrl/2008/displaytype/4.phtml); [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报")); [Eastmoney HK F10 main indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=(SECURITY_CODE="00700")(DATE_TYPE_CODE="001")); [NetEase FY2008 20-F](https://www.sec.gov/Archives/edgar/data/1110646/000119312509141163/d20f.htm); [SEC XBRL company facts, NetEase](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json)

| Company | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | Avg | Min (yr) | Yrs >15 | Yrs <=15 | Yrs <=10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tencent | 32.0 | 35.2 | 45.7 | 53.7 | 47.5 | 40.6 | 36.5 | 31.2 | 34.5 | 28.8 | 27.9 | 33.2 | 27.2 | 24.7 | 28.1 | 29.8 | 24.6 | 15.1 | 21.8 | 21.1 | 32.0 | 15.1 (2023) | 20 | 0 | 0 |
| NetEase | 46.9 | 40.1 | 35.8 | 28.6 | 26.0 | 28.3 | 25.2 | 24.7 | 21.8 | 25.6 | 34.4 | 25.5 | 13.5 | 39.8 | 16.8 | 19.0 | 20.3 | 25.7 | 22.6 | 22.6 | 27.2 | 13.5 (2018) | 19 | 1 | 0 |
| Gree Electric | 21.9 | 31.9 | 32.1 | 33.5 | 36.5 | 34.0 | 31.4 | 35.8 | 35.2 | 27.3 | 30.4 | 37.4 | 33.4 | 25.7 | 18.9 | 21.3 | 24.2 | 26.5 | 25.4 | 20.3 | 29.2 | 18.9 (2020) | 20 | 0 | 0 |
| Kweichow Moutai | 27.7 | 39.3 | 39.0 | 33.5 | 30.9 | 40.4 | 45.0 | 39.4 | 32.0 | 26.2 | 24.4 | 33.0 | 34.5 | 33.1 | 31.4 | 29.9 | 30.3 | 34.2 | 36.0 | 32.5 | 33.6 | 24.4 (2016) | 20 | 0 | 0 |
| Fudan Microelectronics | 8.6 | 14.1 | 10.6 | 16.2 | 29.5 | 22.3 | 25.0 | 24.1 | 21.6 | 17.2 | 19.1 | 14.9 | 6.0 | -8.7 | 7.2 | 20.3 | 28.1 | 14.6 | 10.2 | 3.9 | 15.2 | -8.7 (2019) | 10 | 10 | 5 |
| Grand Pharmaceutical | -75.0 | 308.5 | 126.8 | 150.9 | 32.4 | 9.0 | 9.7 | 12.2 | 17.6 | 15.9 | 18.8 | 23.4 | 15.1 | 14.8 | 18.3 | 19.5 | 15.1 | 12.8 | 15.6 | 7.4 | 38.4 | -75.0 (2006) | 13 | 7 | 4 |
| Zhejiang NHU | 3.8 | 9.6 | 95.4 | 44.4 | 27.4 | 22.5 | 14.7 | 14.1 | 11.9 | 5.7 | 15.9 | 19.9 | 20.5 | 13.2 | 19.6 | 21.1 | 16.1 | 11.2 | 21.8 | 21.9 | 21.5 | 3.8 (2006) | 12 | 8 | 3 |
| IEIT Systems | 0.9 | 1.1 | 2.4 | 0.4 | 3.4 | 7.0 | 6.1 | 12.7 | 17.4 | 17.4 | 7.6 | 8.3 | 8.7 | 9.8 | 12.1 | 13.1 | 13.4 | 9.9 | 12.1 | 11.6 | 8.8 | 0.4 (2009) | 2 | 18 | 12 |
| China Jushi | 17.5 | 29.1 | 17.9 | -11.1 | 15.6 | 13.6 | 7.8 | 8.6 | 12.2 | 22.1 | 14.8 | 18.4 | 18.0 | 14.3 | 14.7 | 30.1 | 26.5 | 10.9 | 8.4 | 10.6 | 15.0 | -11.1 (2009) | 9 | 11 | 4 |
| Jiangsu Hengrui | 17.6 | 28.2 | 22.9 | 28.6 | 24.4 | 23.1 | 22.9 | 21.2 | 21.3 | 24.4 | 23.2 | 23.3 | 23.6 | 24.0 | 22.5 | 14.0 | 10.9 | 11.0 | 14.7 | 14.3 | 20.8 | 10.9 (2022) | 15 | 5 | 0 |
| NARI Technology | 14.3 | 16.4 | 13.2 | 20.9 | 34.2 | 29.8 | 31.2 | 29.4 | 19.4 | 17.1 | 17.2 | 16.4 | 16.9 | 14.8 | 15.1 | 15.7 | 16.1 | 16.1 | 15.9 | 16.3 | 19.3 | 13.2 (2008) | 17 | 3 | 0 |
| Zhejiang Sanhua | 11.3 | 11.6 | 23.3 | 19.8 | 22.7 | 14.1 | 9.7 | 10.8 | 14.6 | 15.2 | 17.2 | 19.1 | 15.7 | 16.1 | 15.0 | 16.0 | 21.4 | 19.2 | 16.8 | 15.8 | 16.3 | 9.7 (2012) | 14 | 6 | 1 |
| AVIC Shenyang Aircraft | -14.0 | 4.9 | -3.8 | 8.8 | 8.8 | -22.8 | -4.8 | 2.4 | -20.9 | -43.4 | 13.5 | 13.7 | 9.9 | 10.6 | 15.4 | 15.4 | 18.4 | 21.0 | 20.2 | 18.4 | 3.6 | -43.4 (2015) | 6 | 14 | 11 |
| Sieyuan Electric | 29.6 | 22.5 | 17.7 | 38.0 | 19.0 | 5.6 | 9.0 | 11.4 | 13.2 | 10.2 | 8.7 | 5.8 | 6.6 | 11.6 | 16.1 | 16.1 | 13.9 | 15.9 | 18.1 | 22.6 | 15.6 | 5.6 (2011) | 10 | 10 | 5 |
| Zhongtian Technology | 5.7 | 12.2 | 18.1 | 24.7 | 23.6 | 12.6 | 9.5 | 11.1 | 9.3 | 11.1 | 14.3 | 10.8 | 11.3 | 9.7 | 10.1 | 0.7 | 11.2 | 9.8 | 8.4 | 8.0 | 11.6 | 0.7 (2021) | 3 | 17 | 8 |
| Inner Mongolia Yili | 14.0 | -4.3 | -48.3 | 20.8 | 20.3 | 35.3 | 26.0 | 23.1 | 23.7 | 23.9 | 26.6 | 25.2 | 24.3 | 26.4 | 25.2 | 25.6 | 19.2 | 20.2 | 15.8 | 20.9 | 18.2 | -48.3 (2008) | 17 | 3 | 2 |
| Grandblue Environment | 10.4 | 10.9 | 10.0 | 10.6 | 44.1 | 9.5 | 10.6 | 9.9 | 13.6 | 9.8 | 11.0 | 12.8 | 15.9 | 14.6 | 15.0 | 12.8 | 11.0 | 12.4 | 13.1 | 14.1 | 13.6 | 9.5 (2011) | 2 | 18 | 3 |
| China Yangtze Power | 15.6 | 15.2 | 10.0 | 10.2 | 12.8 | 11.5 | 14.5 | 11.9 | 14.5 | 13.6 | 16.9 | 16.9 | 16.3 | 14.8 | 16.7 | 14.9 | 11.7 | 13.5 | 15.7 | 15.9 | 14.2 | 10.0 (2008) | 8 | 12 | 0 |

- Reading the ROE series: Grand Pharma ROE of 308.5 (2007), 126.8 and 150.9 are artefacts of near zero or negative parent equity after years of losses (net loss in FY2006 to FY2008; FY2006 revenue RMB 43m, net loss RMB 10.7m) and should be treated as not meaningful; NHU 95.4 in FY2008 follows a net profit of RMB 1,375m versus RMB 77m a year earlier (+1,683 percent); Grandblue 44.1 in FY2010 follows net profit of RMB 558m versus RMB 104m in FY2009 (one year spike, 9.5 to 15.9 in all other years) — [Sina financial guideline pages](https://money.finance.sina.com.cn/corp/go.php/vFD_FinancialGuideLine/stockid/002001/ctrl/2008/displaytype/4.phtml); [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报")); [Eastmoney HK F10 main indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=(SECURITY_CODE="00700")(DATE_TYPE_CODE="001"))
- AVIC Shenyang Aircraft had negative ROE in six of its first ten years (2006, 2008, 2011, 2012, 2014, 2015: -14.0, -3.8, -22.8, -4.8, -20.9, -43.4); ROE has been 10 to 21 percent since 2017. Its share count rose from 345m to 1,337m on 2017-12-12 (new A shares issued) — [Sina financial guideline pages](https://money.finance.sina.com.cn/corp/go.php/vFD_FinancialGuideLine/stockid/002001/ctrl/2008/displaytype/4.phtml); [Eastmoney F10 share capital history](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_EQUITY&columns=ALL&filter=(SECUCODE="600276.SH"))
- Yili's ROE was -4.3 in 2007 and -48.3 in 2008 (net loss RMB 1,687m in FY2008 against RMB 325m profit in FY2006) before recovering to 20 to 35 percent — [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报"))

**Latest DuPont split (FY2025).** A shares: net margin = attributable profit / revenue; asset turnover = Eastmoney total asset turnover (`TOAZZL`); implied leverage = reported weighted ROE / (net margin x turnover). HK names: ROE = net profit / average parent equity, turnover = revenue / average assets, leverage = average assets / average parent equity (computed). NetEase from SEC XBRL (assets, equity, net income, revenue RMB 112,626m) — [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报")); [Eastmoney HK F10 main indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=(SECURITY_CODE="00700")(DATE_TYPE_CODE="001")); [SEC XBRL company facts, NetEase](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json)

| Company | FY25 ROE % | Net margin % | Asset turnover | Implied leverage (ROE/ROA) | Debt/assets % | Gross margin % | Revenue bn | Net profit bn |
|---|---|---|---|---|---|---|---|---|
| Tencent | 21.1 | 29.9 | 0.394 | 1.8 | 39.1 | 56.2 | 751.8 | 224.84 |
| NetEase | 22.6 | 30.0 | 0.54 | 1.4 | gap | gap | 112.6 | 33.76 |
| Gree Electric | 20.3 | 16.9 | 0.451 | 2.66 | 61.7 | 29.8 | 171.1 | 29.0 |
| Kweichow Moutai | 32.5 | 47.8 | 0.571 | 1.19 | 16.4 | 91.2 | 172.1 | 82.32 |
| Fudan Microelectronics | 3.9 | 5.8 | 0.437 | 1.52 | 26.6 | 56.2 | 4.0 | 0.23 |
| Grand Pharmaceutical | 7.4 | 10.1 | 0.463 | 1.57 | 36.8 | 55.2 | 11.1 | 1.12 |
| Zhejiang NHU | 21.9 | 30.4 | 0.502 | 1.43 | 27.7 | 44.7 | 22.3 | 6.76 |
| IEIT Systems | 11.6 | 1.5 | 2.126 | 3.71 | 73.6 | 4.9 | 164.8 | 2.41 |
| China Jushi | 10.6 | 17.4 | 0.35 | 1.75 | 40.4 | 33.1 | 18.9 | 3.29 |
| Jiangsu Hengrui | 14.3 | 24.4 | 0.527 | 1.11 | 11.6 | 86.2 | 31.6 | 7.71 |
| NARI Technology | 16.3 | 12.5 | 0.691 | 1.88 | 42.7 | 25.8 | 66.2 | 8.28 |
| Zhejiang Sanhua | 15.8 | 13.1 | 0.723 | 1.67 | 35.1 | 28.8 | 31.0 | 4.06 |
| AVIC Shenyang Aircraft | 18.4 | 7.9 | 0.642 | 3.63 | 66.9 | 13.7 | 44.7 | 3.52 |
| Sieyuan Electric | 22.6 | 14.6 | 0.808 | 1.91 | 47.0 | 30.8 | 21.5 | 3.15 |
| Zhongtian Technology | 8.0 | 5.5 | 0.871 | 1.66 | 38.1 | 13.9 | 52.5 | 2.9 |
| Inner Mongolia Yili | 20.9 | 10.0 | 0.758 | 2.76 | 61.5 | 34.6 | 115.9 | 11.57 |
| Grandblue Environment | 14.1 | 14.2 | 0.275 | 3.62 | 70.1 | 33.2 | 13.9 | 1.97 |
| China Yangtze Power | 15.9 | 40.0 | 0.153 | 2.59 | 58.3 | 61.7 | 86.2 | 34.5 |

**Dividend payout record.** A shares: pre tax cash dividends implemented for each fiscal year (interim plus final) x total shares at record date / attributable net profit (zero where no dividend row exists; n/a where profit was zero or negative). Tencent: cash DPS (HKD) converted to RMB at the average HKDCNY rate of the payment year, over reported EPS; special distributions in kind (China Literature 2017, Tencent Music 2018, JD.com 2021, Meituan 2022) and the HK$0.10 special of 2008 are excluded. Fudan Micro and Grand Pharma: DPS in the Eastmoney HK dividend list over EPS; the list shows no dividend for Fudan in FY2014 to FY2020 and for Grand Pharma before FY2018, which may reflect an incomplete list rather than no dividend. NetEase: cash dividends paid in the year over net income (XBRL `PaymentsOfDividendsCommonStock`, available from 2013). Tencent's first dividend in the list is for FY2007 — [Eastmoney dividend table](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=(SECURITY_CODE="000651")); [Eastmoney HK dividend list](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_MAIN_DIVBASIC&columns=ALL&filter=(SECURITY_CODE="00700")); [SEC XBRL company facts, NetEase](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json); [Yahoo CNY=X](https://query1.finance.yahoo.com/v8/finance/chart/CNY=X?period1=1160006400&interval=1d) and [Yahoo HKDCNY=X](https://query1.finance.yahoo.com/v8/finance/chart/HKDCNY=X?period1=1160006400&interval=1d)

| Company | Avg payout all yrs % | Avg 2021-25 % | FY with no dividend / loss | 2006..2025 payout % by fiscal year |
|---|---|---|---|---|
| Tencent | 13 | 16 | 0 zero / 1 n/a | 06:n/a 07:16 08:14 09:12 10:10 11:11 12:11 13:11 14:11 15:13 16:12 17:10 18:11 19:11 20:8 21:6 22:11 23:26 24:20 25:19 |
| NetEase | 30 | 32 | 0 zero / 7 n/a | 06:n/a 07:n/a 08:n/a 09:n/a 10:n/a 11:n/a 12:n/a 13:18 14:42 15:22 16:22 17:30 18:23 19:42 20:35 21:21 22:33 23:27 24:38 25:41 |
| Gree Electric | 44 | 55 | 2 zero / 0 n/a | 06:0 07:20 08:19 09:32 10:20 11:29 12:41 13:42 14:64 15:72 16:70 17:0 18:48 19:29 20:109 21:74 22:46 23:46 24:52 25:58 |
| Kweichow Moutai | 47 | 62 | 0 zero / 0 n/a | 06:43 07:28 08:29 09:26 10:43 11:47 12:50 13:30 14:33 15:50 16:51 17:51 18:52 19:52 20:52 21:52 22:52 23:52 24:75 25:79 |
| Fudan Microelectronics | 5 | 13 | 13 zero / 1 n/a | 06:0 07:0 08:0 09:0 10:0 11:0 12:0 13:31 14:0 15:0 16:0 17:0 18:0 19:n/a 20:0 21:9 22:10 23:11 24:12 25:21 |
| Grand Pharmaceutical | 15 | 35 | 9 zero / 3 n/a | 06:n/a 07:n/a 08:n/a 09:0 10:0 11:0 12:0 13:0 14:0 15:0 16:0 17:0 18:31 19:27 20:21 21:17 22:24 23:49 24:37 25:46 |
| Zhejiang NHU | 44 | 41 | 0 zero / 0 n/a | 06:51 07:44 08:30 09:37 10:33 11:37 12:43 13:41 14:47 15:54 16:54 17:52 18:49 19:50 20:42 21:41 22:43 23:51 24:26 25:45 |
| IEIT Systems | 11 | 9 | 3 zero / 1 n/a | 06:0 07:0 08:22 09:n/a 10:0 11:28 12:18 13:13 14:11 15:11 16:10 17:12 18:12 19:11 20:11 21:10 22:11 23:11 24:10 25:2 |
| China Jushi | 28 | 37 | 3 zero / 1 n/a | 06:30 07:0 08:0 09:n/a 10:0 11:27 12:32 13:33 14:30 15:35 16:40 17:34 18:33 19:32 20:32 21:32 22:32 23:36 24:39 25:44 |
| Jiangsu Hengrui | 16 | 23 | 0 zero / 0 n/a | 06:26 07:10 08:12 09:9 10:10 11:12 12:9 13:10 14:10 15:9 16:12 17:11 18:20 19:19 20:17 21:23 22:26 23:30 24:20 25:17 |
| NARI Technology | 33 | 52 | 1 zero / 0 n/a | 06:0 07:36 08:15 09:15 10:10 11:12 12:25 13:15 14:30 15:50 16:23 17:51 18:41 19:31 20:40 21:41 22:41 23:60 24:60 25:60 |
| Zhejiang Sanhua | 40 | 39 | 0 zero / 0 n/a | 06:49 07:17 08:61 09:28 10:47 11:41 12:22 13:37 14:14 15:30 16:55 17:26 18:58 19:29 20:86 21:32 22:42 23:38 24:42 25:41 |
| AVIC Shenyang Aircraft | 16 | 37 | 7 zero / 6 n/a | 06:n/a 07:0 08:n/a 09:0 10:0 11:n/a 12:n/a 13:0 14:n/a 15:n/a 16:0 17:0 18:0 19:24 20:23 21:47 22:34 23:37 24:32 25:33 |
| Sieyuan Electric | 22 | 18 | 1 zero / 0 n/a | 06:0 07:25 08:16 09:10 10:63 11:29 12:18 13:25 14:14 15:33 16:22 17:31 18:26 19:14 20:16 21:13 22:19 23:20 24:19 25:17 |
| Zhongtian Technology | 23 | 58 | 4 zero / 0 n/a | 06:0 07:0 08:0 09:19 10:7 11:22 12:0 13:13 14:14 15:11 16:19 17:17 18:14 19:16 20:13 21:187 22:11 23:24 24:36 25:31 |
| Inner Mongolia Yili | 53 | 76 | 2 zero / 2 n/a | 06:16 07:n/a 08:n/a 09:0 10:0 11:22 12:31 13:51 14:59 15:59 16:64 17:71 18:66 19:71 20:70 21:71 22:70 23:73 24:91 25:75 |
| Grandblue Environment | 27 | 28 | 0 zero / 0 n/a | 06:48 07:40 08:40 09:39 10:10 11:17 12:30 13:20 14:25 15:19 16:30 17:23 18:18 19:18 20:17 21:15 22:16 23:27 24:39 25:43 |
| China Yangtze Power | 62 | 75 | 0 zero / 0 n/a | 06:61 07:52 08:51 09:88 10:51 11:55 12:53 13:51 14:53 15:16 16:77 17:67 18:66 19:69 20:61 21:71 22:88 23:74 24:71 25:71 |

- Dividend heavy stories: Yili (59 to 91 percent since FY2014), Yangtze Power (51 to 88 percent in every year except FY2015 at 16), Moutai (up to 79 percent in FY2025), Gree (109 percent in FY2020; none for FY2017 and FY2006). Low payout: Tencent (6 to 26 percent), Hengrui (9 to 30), IEIT (about 10 to 12) — [Eastmoney dividend table](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=(SECURITY_CODE="000651")); [Eastmoney HK dividend list](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_MAIN_DIVBASIC&columns=ALL&filter=(SECURITY_CODE="00700"))

**Behaviour in each selloff against the benchmark.** Columns: the stock's own peak to trough drawdown inside the window (adjclose), the date it first regained that window peak and months from trough / from peak, the benchmark's own drawdown and months from its trough to regain its window peak, and the stock's return measured over the benchmark's own peak to trough dates (a like for like timing check). Months = days / 30.4375. China Yangtze Power windows with `gap` traded on under 60 percent of window days because of long suspensions (Q5). Sources: [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split); [csindex CSI 300 TR H00300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021); [Yahoo ^HSI](https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI?period1=1160006400&interval=1d); [Yahoo FXI](https://query1.finance.yahoo.com/v8/finance/chart/FXI?period1=1160006400&interval=1d); screen CSVs [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv), [hk_us_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/hk_us_screen.csv), [ashare_screen_benchmarks.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen_benchmarks.csv), [hk_us_benchmarks.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/hk_us_benchmarks.csv)

Benchmark reference (own peak to trough in each window; CSI 300 TR is the A share benchmark, HSI the HK benchmark, FXI the NetEase benchmark):

| Benchmark | Window | Peak -> trough | DD % | Regained | Months trough to regain | Months peak to regain |
|---|---|---|---|---|---|---|
| CSI300TR | 2007-08 | 2007-10-16 -> 2008-11-04 | -72.0 | 2015-06-05 | 79.0 | 91.6 |
| CSI300TR | 2015-16 | 2015-06-08 -> 2016-01-28 | -46.1 | 2020-07-09 | 53.4 | 61.0 |
| CSI300TR | 2018 | 2018-01-24 -> 2018-12-27 | -30.4 | 2020-01-13 | 12.6 | 23.6 |
| CSI300TR | 2021-24 | 2021-02-10 -> 2024-02-02 | -41.6 | not regained | not regained | not regained |
| CSI300 | 2007-08 | 2007-10-16 -> 2008-11-04 | -72.3 | not regained | not regained | not regained |
| CSI300 | 2015-16 | 2015-06-08 -> 2016-01-28 | -46.7 | 2021-01-05 | 59.3 | 67.0 |
| CSI300 | 2018 | 2018-01-24 -> 2018-12-27 | -31.9 | 2020-07-03 | 18.2 | 29.3 |
| CSI300 | 2021-24 | 2021-02-10 -> 2024-09-13 | -45.6 | not regained | not regained | not regained |
| HSI | 2007-08 | 2007-10-30 -> 2008-10-27 | -65.2 | 2018-01-16 | 110.7 | 122.6 |
| HSI | 2015-16 | 2015-04-28 -> 2016-02-12 | -35.6 | 2017-10-06 | 19.8 | 29.3 |
| HSI | 2018 | 2018-01-26 -> 2018-10-30 | -25.8 | not regained | not regained | not regained |
| HSI | 2021-24 | 2021-02-17 -> 2022-10-31 | -52.8 | not regained | not regained | not regained |
| HSCE | 2007-08 | 2007-10-30 -> 2008-10-27 | -75.5 | not regained | not regained | not regained |
| HSCE | 2015-16 | 2015-05-26 -> 2016-02-12 | -49.3 | not regained | not regained | not regained |
| HSCE | 2018 | 2018-01-26 -> 2018-12-27 | -27.2 | not regained | not regained | not regained |
| HSCE | 2021-24 | 2021-02-17 -> 2022-10-31 | -59.6 | not regained | not regained | not regained |
| FXI | 2007-08 | 2007-10-31 -> 2008-10-27 | -72.7 | 2021-02-11 | 147.5 | 159.4 |
| FXI | 2015-16 | 2015-04-27 -> 2016-02-11 | -44.6 | 2018-01-11 | 23.0 | 32.5 |
| FXI | 2018 | 2018-01-26 -> 2018-10-29 | -28.2 | 2021-01-19 | 26.7 | 35.8 |
| FXI | 2021-24 | 2021-02-17 -> 2022-10-31 | -60.8 | not regained | not regained | not regained |

Per stock results:

| Company | Window | Stock DD % | Stock peak -> trough | Stock regained (mo. from trough / from peak) | Benchmark | Bench DD % | Bench regained (mo. from trough) | Stock return over bench peak->trough % | Stock DD minus bench DD (pp) |
|---|---|---|---|---|---|---|---|---|---|
| Tencent | 2007-08 | -47.0 | 2008-06-04 -> 2008-10-27 | 2009-05-04 (6.2 / 11.0) | HSI | -65.2 | 2018-01-16 (110.7) | -45.6 | +18.1 |
| Tencent | 2015-16 | -26.7 | 2015-04-13 -> 2015-08-24 | 2016-05-27 (9.1 / 13.5) | HSI | -35.6 | 2017-10-06 (19.8) | -18.3 | +8.9 |
| Tencent | 2018 | -46.7 | 2018-01-23 -> 2018-10-30 | 2020-06-22 (19.7 / 28.9) | HSI | -25.8 | not regained | -46.4 | -20.9 |
| Tencent | 2021-24 | -72.8 | 2021-01-25 -> 2022-10-28 | not regained | HSI | -52.8 | not regained | -71.8 | -20.0 |
| NetEase | 2007-08 | -41.8 | 2008-08-25 -> 2008-11-19 | 2009-04-03 (4.4 / 7.3) | FXI | -72.7 | 2021-02-11 (147.5) | -14.8 | +30.9 |
| NetEase | 2015-16 | -29.2 | 2015-06-17 -> 2015-08-24 | 2015-11-12 (2.6 / 4.9) | FXI | -44.6 | 2018-01-11 (23.0) | 12.1 | +15.4 |
| NetEase | 2018 | -45.6 | 2018-01-02 -> 2018-09-10 | 2020-01-09 (16.0 / 24.2) | FXI | -28.2 | 2021-01-19 (26.7) | -41.0 | -17.4 |
| NetEase | 2021-24 | -57.3 | 2021-02-11 -> 2022-10-28 | 2025-05-15 (30.6 / 51.1) | FXI | -60.8 | not regained | -55.3 | +3.5 |
| Gree Electric | 2007-08 | -65.0 | 2008-02-19 -> 2008-10-29 | 2009-10-28 (12.0 / 20.3) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -51.1 | +7.0 |
| Gree Electric | 2015-16 | -49.0 | 2015-06-01 -> 2015-09-29 | 2016-11-28 (14.0 / 17.9) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -38.2 | -2.9 |
| Gree Electric | 2018 | -37.8 | 2018-01-26 -> 2018-12-27 | 2019-04-10 (3.4 / 14.4) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -36.0 | -7.5 |
| Gree Electric | 2021-24 | -49.3 | 2021-01-05 -> 2022-04-26 | 2024-10-08 (29.4 / 45.1) | CSI300TR | -41.6 | not regained | -26.9 | -7.7 |
| Kweichow Moutai | 2007-08 | -62.5 | 2007-12-28 -> 2008-11-07 | 2011-07-21 (32.4 / 42.7) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -51.2 | +9.5 |
| Kweichow Moutai | 2015-16 | -30.0 | 2015-06-01 -> 2015-08-24 | 2016-03-24 (7.0 / 9.8) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -16.8 | +16.0 |
| Kweichow Moutai | 2018 | -33.5 | 2018-06-12 -> 2018-10-30 | 2019-03-01 (4.0 / 8.6) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -25.3 | -3.2 |
| Kweichow Moutai | 2021-24 | -47.5 | 2021-02-10 -> 2024-09-19 | not regained | CSI300TR | -41.6 | not regained | -34.9 | -5.9 |
| Fudan Microelectronics | 2007-08 | -78.8 | 2007-11-07 -> 2008-10-27 | 2009-11-20 (12.8 / 24.4) | HSI | -65.2 | 2018-01-16 (110.7) | -78.0 | -13.7 |
| Fudan Microelectronics | 2015-16 | -60.0 | 2015-06-01 -> 2016-02-11 | 2019-03-07 (36.8 / 45.2) | HSI | -35.6 | 2017-10-06 (19.8) | -49.3 | -24.4 |
| Fudan Microelectronics | 2018 | -25.4 | 2018-06-12 -> 2018-12-28 | 2019-03-06 (2.2 / 8.8) | HSI | -25.8 | not regained | 23.9 | +0.5 |
| Fudan Microelectronics | 2021-24 | -77.2 | 2022-11-23 -> 2024-02-05 | 2025-09-16 (19.4 / 33.8) | HSI | -52.8 | not regained | 144.2 | -24.4 |
| Grand Pharmaceutical | 2007-08 | -75.5 | 2007-12-06 -> 2008-11-25 | 2009-08-31 (9.2 / 20.8) | HSI | -65.2 | 2018-01-16 (110.7) | -25.0 | -10.3 |
| Grand Pharmaceutical | 2015-16 | -41.2 | 2015-04-21 -> 2015-07-08 | 2017-08-10 (25.1 / 27.7) | HSI | -35.6 | 2017-10-06 (19.8) | -26.8 | -5.6 |
| Grand Pharmaceutical | 2018 | -49.0 | 2018-05-28 -> 2018-12-27 | 2020-07-21 (18.8 / 25.8) | HSI | -25.8 | not regained | -19.1 | -23.1 |
| Grand Pharmaceutical | 2021-24 | -57.1 | 2021-06-01 -> 2022-10-31 | 2025-05-08 (30.2 / 47.2) | HSI | -52.8 | not regained | -44.1 | -4.3 |
| Zhejiang NHU | 2007-08 | -68.9 | 2008-05-13 -> 2008-11-06 | 2010-10-26 (23.6 / 29.4) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -7.1 | +3.1 |
| Zhejiang NHU | 2015-16 | -54.9 | 2015-06-11 -> 2015-09-15 | 2017-11-13 (26.0 / 29.1) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -49.0 | -8.8 |
| Zhejiang NHU | 2018 | -48.1 | 2018-01-16 -> 2018-10-18 | 2020-01-14 (14.9 / 23.9) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -36.5 | -17.7 |
| Zhejiang NHU | 2021-24 | -49.2 | 2021-03-01 -> 2023-05-31 | 2026-01-20 (31.7 / 58.7) | CSI300TR | -41.6 | not regained | -38.0 | -7.6 |
| IEIT Systems | 2007-08 | -67.6 | 2008-03-05 -> 2008-11-04 | 2010-01-08 (14.1 / 22.1) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -58.6 | +4.5 |
| IEIT Systems | 2015-16 | -63.1 | 2015-06-02 -> 2015-09-02 | 2020-02-07 (53.2 / 56.2) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -53.5 | -17.0 |
| IEIT Systems | 2018 | -44.7 | 2018-08-13 -> 2018-12-28 | 2019-03-07 (2.3 / 6.8) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -3.3 | -14.4 |
| IEIT Systems | 2021-24 | -57.6 | 2023-06-20 -> 2024-02-05 | 2025-02-17 (12.4 / 20.0) | CSI300TR | -41.6 | not regained | -5.8 | -16.1 |
| China Jushi | 2007-08 | -68.0 | 2008-03-04 -> 2008-10-16 | 2015-03-16 (76.9 / 84.4) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -53.6 | +4.1 |
| China Jushi | 2015-16 | -49.6 | 2015-06-08 -> 2015-07-08 | 2017-10-20 (27.4 / 28.4) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -45.1 | -3.6 |
| China Jushi | 2018 | -40.2 | 2018-01-16 -> 2018-10-18 | 2020-08-19 (22.0 / 31.1) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -32.9 | -9.9 |
| China Jushi | 2021-24 | -61.1 | 2021-02-18 -> 2024-01-22 | 2026-01-22 (24.0 / 59.1) | CSI300TR | -41.6 | not regained | -59.5 | -19.5 |
| Jiangsu Hengrui | 2007-08 | -38.9 | 2008-01-25 -> 2008-10-27 | 2009-09-04 (10.3 / 19.3) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -5.2 | +33.1 |
| Jiangsu Hengrui | 2015-16 | -25.4 | 2015-06-01 -> 2015-07-08 | 2015-10-26 (3.6 / 4.8) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -6.7 | +20.6 |
| Jiangsu Hengrui | 2018 | -39.2 | 2018-06-06 -> 2018-12-21 | 2019-07-02 (6.3 / 12.8) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -14.2 | -8.9 |
| Jiangsu Hengrui | 2021-24 | -71.0 | 2021-01-07 -> 2022-04-26 | not regained | CSI300TR | -41.6 | not regained | -60.1 | -29.4 |
| NARI Technology | 2007-08 | -55.6 | 2008-01-07 -> 2008-11-12 | 2009-05-22 (6.3 / 16.5) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -35.2 | +16.4 |
| NARI Technology | 2015-16 | -57.6 | 2015-06-03 -> 2016-01-28 | 2020-12-28 (59.0 / 66.9) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -55.8 | -11.5 |
| NARI Technology | 2018 | -20.0 | 2018-05-10 -> 2018-07-04 | 2018-12-10 (5.2 / 7.0) | CSI300TR | -30.4 | 2020-01-13 (12.6) | 3.5 | +10.4 |
| NARI Technology | 2021-24 | -43.1 | 2021-12-15 -> 2022-04-26 | 2026-03-05 (46.3 / 50.6) | CSI300TR | -41.6 | not regained | 10.5 | -1.5 |
| Zhejiang Sanhua | 2007-08 | -74.7 | 2008-01-02 -> 2008-10-27 | 2010-09-28 (23.0 / 32.9) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -59.0 | -2.6 |
| Zhejiang Sanhua | 2015-16 | -66.9 | 2015-06-01 -> 2015-09-15 | 2017-07-05 (21.7 / 25.1) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -59.9 | -20.9 |
| Zhejiang Sanhua | 2018 | -48.3 | 2018-03-12 -> 2018-10-30 | 2019-12-13 (13.4 / 21.1) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -38.9 | -17.9 |
| Zhejiang Sanhua | 2021-24 | -51.2 | 2021-01-05 -> 2022-04-25 | 2022-06-27 (2.1 / 17.7) | CSI300TR | -41.6 | not regained | -14.3 | -9.7 |
| AVIC Shenyang Aircraft | 2007-08 | -71.9 | 2008-03-06 -> 2008-10-14 | 2009-11-10 (12.9 / 20.2) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -51.9 | +0.1 |
| AVIC Shenyang Aircraft | 2015-16 | -67.4 | 2015-06-25 -> 2016-02-01 | 2017-02-10 (12.3 / 19.6) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -52.2 | -21.4 |
| AVIC Shenyang Aircraft | 2018 | -42.1 | 2018-01-10 -> 2018-02-09 | 2018-04-19 (2.3 / 3.3) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -8.6 | -11.7 |
| AVIC Shenyang Aircraft | 2021-24 | -46.9 | 2021-08-31 -> 2022-04-26 | 2024-11-06 (30.4 / 38.2) | CSI300TR | -41.6 | not regained | -15.1 | -5.3 |
| Sieyuan Electric | 2007-08 | -58.3 | 2008-01-24 -> 2008-11-07 | 2009-11-13 (12.2 / 21.7) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -28.4 | +13.7 |
| Sieyuan Electric | 2015-16 | -60.3 | 2015-06-15 -> 2015-09-15 | 2020-02-26 (53.4 / 56.4) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -51.0 | -14.3 |
| Sieyuan Electric | 2018 | -50.3 | 2018-05-17 -> 2018-12-28 | 2020-02-25 (13.9 / 21.3) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -32.6 | -19.9 |
| Sieyuan Electric | 2021-24 | -56.2 | 2021-12-15 -> 2022-04-26 | 2024-02-07 (21.4 / 25.8) | CSI300TR | -41.6 | not regained | 136.6 | -14.6 |
| Zhongtian Technology | 2007-08 | -67.6 | 2008-01-18 -> 2008-11-04 | 2009-04-20 (5.5 / 15.0) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -56.3 | +4.5 |
| Zhongtian Technology | 2015-16 | -57.3 | 2015-06-03 -> 2015-09-15 | 2017-09-27 (24.4 / 27.8) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -50.7 | -11.3 |
| Zhongtian Technology | 2018 | -50.1 | 2018-01-03 -> 2018-10-18 | 2021-11-04 (36.6 / 46.0) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -37.6 | -19.8 |
| Zhongtian Technology | 2021-24 | -59.8 | 2022-07-20 -> 2024-02-05 | 2026-02-26 (24.7 / 43.3) | CSI300TR | -41.6 | not regained | 21.7 | -18.3 |
| Inner Mongolia Yili | 2007-08 | -78.1 | 2007-10-16 -> 2008-10-27 | 2010-01-14 (14.6 / 27.0) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -76.7 | -6.0 |
| Inner Mongolia Yili | 2015-16 | -40.8 | 2015-06-09 -> 2016-01-28 | 2017-06-08 (16.3 / 24.0) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -37.2 | +5.3 |
| Inner Mongolia Yili | 2018 | -39.3 | 2018-01-23 -> 2018-10-29 | 2019-07-01 (8.0 / 17.2) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -35.2 | -8.9 |
| Inner Mongolia Yili | 2021-24 | -53.2 | 2021-01-07 -> 2024-09-18 | not regained | CSI300TR | -41.6 | not regained | -37.1 | -11.6 |
| Grandblue Environment | 2007-08 | -46.4 | 2008-01-09 -> 2008-10-14 | 2010-02-25 (16.4 / 25.6) | CSI300TR | -72.0 | 2015-06-05 (79.0) | -29.9 | +25.7 |
| Grandblue Environment | 2015-16 | -54.6 | 2015-06-08 -> 2015-07-08 | 2020-06-01 (58.8 / 59.8) | CSI300TR | -46.1 | 2020-07-09 (53.4) | -52.5 | -8.6 |
| Grandblue Environment | 2018 | -31.0 | 2018-05-22 -> 2018-10-18 | 2019-03-13 (4.8 / 9.7) | CSI300TR | -30.4 | 2020-01-13 (12.6) | -0.7 | -0.7 |
| Grandblue Environment | 2021-24 | -45.0 | 2021-09-28 -> 2024-02-05 | 2025-07-15 (17.3 / 45.5) | CSI300TR | -41.6 | not regained | -28.8 | -3.5 |
| China Yangtze Power | 2007-08 | gap (traded 47% of window days) | gap | gap | CSI300TR | -72.0 | 79.0 | gap | gap |
| China Yangtze Power | 2015-16 | gap (traded 45% of window days) | gap | gap | CSI300TR | -46.1 | 53.4 | gap | gap |
| China Yangtze Power | 2018 | -16.4 | 2018-06-19 -> 2018-12-06 | 2019-03-22 (3.5 / 9.1) | CSI300TR | -30.4 | 2020-01-13 (12.6) | 1.2 | +14.0 |
| China Yangtze Power | 2021-24 | -17.5 | 2022-07-19 -> 2022-11-03 | 2023-12-25 (13.7 / 17.2) | CSI300TR | -41.6 | not regained | 37.3 | +24.0 |

Scorecard (window counts; "faster" counts windows where both regained, or only the stock regained):

| Company | Windows with a drawdown | Stock DD shallower than benchmark | Regained faster than benchmark (of comparable) |
|---|---|---|---|
| Tencent | 4 | 2 | 3 of 3 |
| NetEase | 4 | 3 | 4 of 4 |
| Gree Electric | 4 | 1 | 4 of 4 |
| Kweichow Moutai | 4 | 2 | 3 of 3 |
| Fudan Microelectronics | 4 | 1 | 3 of 4 |
| Grand Pharmaceutical | 4 | 0 | 3 of 4 |
| Zhejiang NHU | 4 | 1 | 3 of 4 |
| IEIT Systems | 4 | 1 | 4 of 4 |
| China Jushi | 4 | 1 | 3 of 4 |
| Jiangsu Hengrui | 4 | 2 | 3 of 3 |
| NARI Technology | 4 | 2 | 3 of 4 |
| Zhejiang Sanhua | 4 | 0 | 3 of 4 |
| AVIC Shenyang Aircraft | 4 | 1 | 4 of 4 |
| Sieyuan Electric | 4 | 1 | 2 of 4 |
| Zhongtian Technology | 4 | 1 | 3 of 4 |
| Inner Mongolia Yili | 4 | 1 | 3 of 3 |
| Grandblue Environment | 4 | 1 | 3 of 4 |
| China Yangtze Power | 2 | 2 | 2 of 2 |

- By window, stocks with a shallower drawdown than benchmark (stocks with data): 2007-08 13 of 17 (median difference +4.5 percentage points), 2015-16 5 of 17 (median -8.6), 2018 3 of 18 (median -10.8), 2021-24 2 of 18 (median -8.7); regained faster than the benchmark in 17 of 17, 12 of 17, 13 of 18 and 14 of 14 comparable windows. 66 of 70 stock windows had regained the in window peak by 2026-10-20 (not regained: Tencent 2021-24, Moutai 2021-24, Hengrui 2021-24, Yili 2021-24) — computed from [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Profit changes against price drawdowns in the same windows. "Implied P/E" = (1 + window drawdown) / (1 + change in aggregate attributable net profit between the fiscal years shown) - 1, an approximation that ignores share count changes and timing of the fiscal year; it shows that falls were driven by multiples, not profits. Net profit from [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报")), [Eastmoney HK F10 main indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=(SECURITY_CODE="00700")(DATE_TYPE_CODE="001")), [SEC XBRL company facts, NetEase](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json):

| Company | 2007-08 (FY07->FY08) | 2015-16 (FY14->FY15) | 2018 (FY17->FY18) | 2021-24 (FY20->FY23) |
|---|---|---|---|---|
| Tencent | DD -47%; NP +78%; implied P/E -70% | DD -27%; NP +21%; implied P/E -39% | DD -47%; NP +10%; implied P/E -52% | DD -73%; NP -28%; implied P/E -62% |
| NetEase | DD -42%; NP +26%; implied P/E -54% | DD -29%; NP +42%; implied P/E -50% | DD -46%; NP -43%; implied P/E -5% | DD -57%; NP +144%; implied P/E -83% |
| Gree Electric | DD -65%; NP +55%; implied P/E -77% | DD -49%; NP -11%; implied P/E -42% | DD -38%; NP +17%; implied P/E -47% | DD -49%; NP +31%; implied P/E -61% |
| Kweichow Moutai | DD -62%; NP +34%; implied P/E -72% | DD -30%; NP +1%; implied P/E -31% | DD -34%; NP +30%; implied P/E -49% | DD -47%; NP +60%; implied P/E -67% |
| Fudan Microelectronics | DD -79%; NP -18%; implied P/E -74% | DD -60%; NP -5%; implied P/E -58% | DD -25%; NP -49%; implied P/E +47% | DD -77%; NP +442%; implied P/E -96% |
| Grand Pharmaceutical | DD -76%; NP n/m (loss year) | DD -41%; NP +10%; implied P/E -46% | DD -49%; NP +62%; implied P/E -69% | DD -57%; NP +13%; implied P/E -62% |
| Zhejiang NHU | DD -69%; NP +1683%; implied P/E -98% | DD -55%; NP -50%; implied P/E -9% | DD -48%; NP +81%; implied P/E -71% | DD -49%; NP -24%; implied P/E -33% |
| IEIT Systems | DD -68%; NP +74%; implied P/E -81% | DD -63%; NP +33%; implied P/E -72% | DD -45%; NP +54%; implied P/E -64% | DD -58%; NP +22%; implied P/E -65% |
| China Jushi | DD -68%; NP -20%; implied P/E -60% | DD -50%; NP +107%; implied P/E -76% | DD -40%; NP +10%; implied P/E -46% | DD -61%; NP +26%; implied P/E -69% |
| Jiangsu Hengrui | DD -39%; NP +2%; implied P/E -40% | DD -25%; NP +43%; implied P/E -48% | DD -39%; NP +26%; implied P/E -52% | DD -71%; NP -32%; implied P/E -57% |
| NARI Technology | DD -56%; NP +22%; implied P/E -63% | DD -58%; NP +1%; implied P/E -58% | DD -20%; NP +28%; implied P/E -38% | DD -43%; NP +48%; implied P/E -62% |
| Zhejiang Sanhua | DD -75%; NP +98%; implied P/E -87% | DD -67%; NP +8%; implied P/E -69% | DD -48%; NP +5%; implied P/E -51% | DD -51%; NP +100%; implied P/E -76% |
| AVIC Shenyang Aircraft | DD -72%; NP n/m (loss year) | DD -67%; NP n/m (loss year) | DD -42%; NP +5%; implied P/E -45% | DD -47%; NP +103%; implied P/E -74% |
| Sieyuan Electric | DD -58%; NP +27%; implied P/E -67% | DD -60%; NP -16%; implied P/E -53% | DD -50%; NP +18%; implied P/E -58% | DD -56%; NP +67%; implied P/E -74% |
| Zhongtian Technology | DD -68%; NP +73%; implied P/E -81% | DD -57%; NP +42%; implied P/E -70% | DD -50%; NP +19%; implied P/E -58% | DD -60%; NP +37%; implied P/E -71% |
| Inner Mongolia Yili | DD -78%; NP n/m (loss year) | DD -41%; NP +12%; implied P/E -47% | DD -39%; NP +7%; implied P/E -43% | DD -53%; NP +47%; implied P/E -68% |
| Grandblue Environment | DD -46%; NP +3%; implied P/E -48% | DD -55%; NP +31%; implied P/E -65% | DD -31%; NP +34%; implied P/E -49% | DD -45%; NP +35%; implied P/E -59% |
| China Yangtze Power | DD gap (suspended) | DD gap (suspended) | DD -16%; NP +2%; implied P/E -18% | DD -18%; NP +4%; implied P/E -20% |

**Evidence based explanation, company by company** (benchmark differences are percentage points of window drawdown, stock minus benchmark; positive means the stock fell less):

- Tencent: fell less than HSI in 2007-08 (-47.0 vs -65.2, +18.1) and 2015-16 (-26.7 vs -35.6, +8.9), more in 2018 (-46.7 vs -25.8) and 2021-24 (-72.8 vs -52.8, still not regained). In the first two windows attributable profit rose 78 percent and 21 percent, ROE was 35 to 54 percent in 2007 to 2009 and 28.8 in 2015, and leverage is low (debt to assets 39 percent), so the fall was a multiple fall from a high base (P/E on FY2006 EPS 28.7). In 2018 and 2021 to 2024 profit fell 28 percent (FY2020 to FY2023) and the multiple compressed to 14.1 by FY2025 EPS. Recovery was 6.2 and 9.1 months from the trough in the first two windows, 19.7 months in 2018. The shield was growth in profits, not defensiveness.
- NetEase: shallower than FXI in three of four windows (-41.8 vs -72.7, -29.2 vs -44.6, -57.3 vs -60.8) and deeper in 2018 (-45.6 vs -28.2). ROE 13.5 to 46.9 (one year at or below 15), net margin 30 percent, leverage 1.4x, R2 0.95 and regained the 2015 peak in 2.6 months. Net income grew in three of four windows (+26 percent, +42 percent, +144 percent) but fell 43 percent in FY2018, the one window it lagged.
- Gree: fell less in 2007-08 (-65.0 vs -72.0), more than CSI 300 TR in the other three windows (-49.0 vs -46.1, -37.8 vs -30.4, -49.3 vs -41.6). Every ROE year was above 18.9 percent and profit rose in three of four windows (-11 percent in FY2015), yet the implied P/E fell 42 to 77 percent in each window. The recoveries (12.0, 14.0, 3.4, 29.4 months) were faster than the index (79.0, 53.4, 12.6, not regained). The cushion was a low starting multiple (P/E 9.6 on FY2006 EPS, 7.4 now) and a high payout (44 percent average, 55 percent in the last five years): dividends supplied 20 percent of the log total return, the largest of any shortlisted stock.
- Kweichow Moutai: fell less in 2007-08 (-62.5 vs -72.0) and 2015-16 (-30.0 vs -46.1, regained in 7.0 months), more in 2018 (-33.5 vs -30.4) and 2021-24 (-47.5 vs -41.6, not regained). ROE never below 24.4 percent (average 33.6), net margin 47.8 percent, gross margin 91.2 percent, debt to assets 16.4 percent, profit up in every window (+34, +1, +30, +60 percent) — so each price fall was entirely a multiple fall (implied P/E -72, -31, -49, -67 percent). The 2008 regain took 32.4 months from the trough.
- Fudan Microelectronics: deeper than HSI in 2007-08, 2015-16 and 2021-24 (-78.8, -60.0, -77.2), flat in 2018. ROE averaged 15.2 with a loss year (2019) and 3.9 in 2025; FY2025 net profit RMB 232m is 78 percent below the FY2022 peak of RMB 1,077m. No resilience evidence; the 20 year return was a rerating (P/E from 8.5 to 72.0) plus 8.3x EPS growth.
- Grand Pharmaceutical: deeper than HSI in all four windows (-75.5, -41.2, -49.0, -57.1 vs -65.2, -35.6, -25.8, -52.8). FY2006 revenue RMB 43m and net loss RMB 10.7m; first profit in FY2009. No resilience evidence; the shortlist rank reflects a HK$0.072 starting price.
- Zhejiang NHU: shallower than CSI 300 TR only in 2007-08 (-68.9 vs -72.0), deeper in the other three (-54.9, -48.1, -49.2). ROE at or below 15 in eight years (2006, 2007, 2012 to 2015, 2019, 2023) and profit fell 50 percent (FY2014 to FY2015) and 24 percent (FY2020 to FY2023). No resilience evidence; return was EPS growth from a very low base (FY2006 profit RMB 34m) partly offset by P/E falling from 61 to 12.
- IEIT Systems: deeper than the benchmark in all four windows (-67.6, -63.1, -44.7, -57.6) with ROE of 10 percent or less in 12 of 20 years, a 1.5 percent net margin and 3.7x implied leverage (server assembly, revenue RMB 164.8bn). Slow recovery (53.2 months in 2015-16). No resilience evidence.
- China Jushi: shallower than CSI 300 TR only in 2007-08 (-68.0 vs -72.0); deeper in 2015-16 (-49.6 vs -46.1), 2018 (-40.2 vs -30.4) and 2021-24 (-61.1 vs -41.6). A glass fibre producer with ROE from -11.1 (2009) to 30.1 and 76.9 months to regain the 2008 peak. No resilience evidence.
- Jiangsu Hengrui: the one clear defensive record in the early windows: -38.9 vs -72.0 (2007-08, +33.1), -25.4 vs -46.1 (2015-16, +20.6, regained in 3.6 months), -39.2 vs -30.4 (2018) and -71.0 vs -41.6 (2021-24, not regained). Evidence: ROE of 17.6 to 28.6 percent in 2006 to 2020 (every year above 15), gross margin 86 percent, debt to assets 11.6 percent, profit up 2 percent and 43 percent through the first two windows. The record broke after 2020: ROE fell to 10.9 to 14.7 in 2021 to 2025 and profit fell 32 percent (FY2020 to FY2023); Hengrui is the only name whose P/E rose over 20 years (34.8 to 39.9).
- NARI Technology: -55.6 vs -72.0 (2007-08), -20.0 vs -30.4 (2018), but -57.6 vs -46.1 in 2015-16 (59.0 months to regain, longer than the benchmark's 53.4) and -43.1 vs -41.6 in 2021-24. ROE never below 13.2 percent (three years at or below 15), a State Grid affiliate (controlling shareholder per Eastmoney: State Grid Electric Power Research Institute) with a payout rising to 60 percent. The structure (grid equipment demand from a single customer group) is the most plausible reason for the fewer low ROE years but the data pulled does not test it.
- Zhejiang Sanhua: deeper than the benchmark in all four windows (-74.7, -66.9, -48.3, -51.2). ROE 9.7 to 23.3. Regain in 2021-24 was only 2.1 months from trough. No resilience evidence.
- AVIC Shenyang Aircraft: -71.9 vs -72.0, -67.4 vs -46.1, -42.1 vs -30.4, -46.9 vs -41.6, with profit losses in FY2006 and in the 2008, 2011 to 2012 and 2014 to 2015 years. The 20 year price growth followed the 2017 asset injection. No resilience evidence.
- Sieyuan Electric: shallower in 2007-08 (-58.3 vs -72.0) and deeper in the other three; ROE below 10 percent in five years (2011, 2012, 2016 to 2018). Slow regain after 2015 (53.4 months).
- Zhongtian Technology: deeper than the benchmark in the last three windows (-57.3, -50.1, -59.8) and 36.6 months to regain after 2018; ROE of 15 or less in 17 of 20 years and 0.7 in 2021.
- Inner Mongolia Yili: -78.1 vs -72.0 (2007-08, deeper; FY2008 loss RMB 1.69bn), -40.8 vs -46.1 (2015-16, shallower), -39.3 vs -30.4 (2018) and -53.2 vs -41.6 (2021-24, not regained). ROE 15.8 to 35.3 percent since 2009 (every year above 15) and a payout of 59 to 91 percent since FY2014: dividends gave 15 percent of the log total return.
- Grandblue Environment: shallowest of the A share names in 2007-08 (-46.4 vs -72.0, +25.7), deeper in 2015-16 (-54.6 vs -46.1; 58.8 months to regain) and about equal in 2018 (-31.0 vs -30.4) and 2021-24 (-45.0 vs -41.6). Waste, water and energy revenue (solid waste 58 percent of FY2025 revenue per Eastmoney), but ROE only 9.5 to 16 outside the 2010 spike, 70 percent debt to assets and 3.6x leverage. The low drawdown in 2008 is not repeated, so it is not evidence of a stable defensive profile.
- China Yangtze Power: observable windows show the defensive profile: -16.4 vs -30.4 (2018, +14.0, regained in 3.5 months) and -17.5 vs -41.6 (2021-24, +24.0, regained in 13.7 months). Evidence: 40 percent net margin, 61.7 percent gross margin, profit changes of +2 percent and +4 percent in those windows, and a payout of 62 percent on average (71 to 75 percent recently). For 2007-08 and 2015-16 the window drawdown is a gap because the stock was suspended for most of each window (see Q5), and the observable record before the suspension was not defensive (see Q5).

### Inferences
- The group did not reliably fall less than the market. It fell less in the 2007-08 crash, when valuations were at a record and the best companies still had a cushion; it fell more in 2018 and 2021 to 2024 in most cases. A shallower drawdown than the benchmark in at least two windows occurs in only six names (Tencent, NetEase, Moutai, Hengrui, NARI, Yangtze Power, the last on its two observable windows); all but Yangtze Power also lagged the benchmark by 5 to 29 percentage points in at least one window.
- Defensive evidence is strongest for China Yangtze Power in 2018 and 2021 to 2024 (low beta cash flow utility, high payout), for Hengrui in 2007 to 2016, and for Moutai only in 2015 to 2016. For the other 12 names, the data show no resilience; their 20 year compounding came from profit growth bought through share issuance, low starting prices or a rerating.
- Quick recovery in this sample is partly survivorship: the screen conditions on stocks that were still listed in 2026 and had CAGR of at least 12 percent, so most windows being regained (66 of 70) is partly built into the list. The comparison with benchmark recovery times is still informative because the indexes were slow (CSI 300 TR needed 79.0 months after 2008 and 53.4 months after 2015, and had not regained its 2021 peak by October 2026).
- Price falls were multiple compression: of 72 company window cells, 66 have positive profit in both fiscal years (4 are loss years, 2 are Yangtze gaps); profit rose in 55 of the 66, and the implied P/E fell in 65 of 66 (the exception is Fudan in 2018).

### Gaps
- Company specific reasons for FY2008 profit jumps (NHU, Grandblue FY2010) are not explained by sources pulled; the ROE and profit figures are from Eastmoney and Sina only, not from annual reports.
- HSI has no total return version, so the HK stocks (which include dividends) are compared with a price index, which flatters the stocks by the dividend yield; the effect is small relative to the drawdowns but is not adjusted.
- Business descriptions for Fudan Micro and Grand Pharmaceutical were not retrieved (no source), and Fudan's 2006 predecessor (GEM listing) and Grand Pharma's former name (China Grand Pharmaceutical and Healthcare Holdings per [TipRanks](https://www.tipranks.com/stocks/HK:0512)) were not checked against HKEX filings.
- Eastmoney's dividend list for the HK names (Fudan, Grand Pharma) may be incomplete; zero payout years for them are "no record found".
- NetEase payout before FY2013 not extracted; ROE and drawdown data are complete.
- ROE for the 14 A share names comes from Sina/Eastmoney aggregator pages, for the HK names from Eastmoney HK and for NetEase from SEC XBRL; none was checked against the cninfo or HKEX annual report PDFs.

## Q3. Return decomposition: earnings per share growth, change in P/E and dividends

### Takeaway
For the 16 companies with positive FY2006 earnings, per share earnings growth explains a median of about 95 percent of the log total return, the P/E change is a median small negative (median P/E ratio 0.93, 8 of 16 fell, 8 rose) and dividends a median of about 7 to 8 percent. Only Fudan Microelectronics (46 percent rerating) and China Jushi, Sanhua, Sieyuan and Yangtze Power (11 to 21 percent) owe a visible share of the return to a rise in P/E; Tencent, NHU, IEIT, NARI, Yili, Gree, Moutai and Grandblue earned their returns against a falling multiple. Grand Pharma and AVIC Shenyang Aircraft cannot be decomposed because FY2006 earnings were negative.

### Cited Findings
Method (script `build_a.py`, `build_hk.py`, `assemble2.py`): total return multiple TR = price multiple x dividend/reinvestment factor (Yahoo `adjclose` multiple over `close` multiple). Price multiple PM = P(end)/P(start) on the Yahoo split adjusted close. P/E at the end = price on 2026-10-20 / FY2025 basic EPS (Eastmoney, or SEC for NetEase); P/E at the start = raw (unadjusted) 2006 price x shares in issue on the start date / FY2006 attributable net profit (A shares; shares from the Eastmoney share capital history; raw price from the screen's independent Tencent raw price series) or raw price / FY2006 reported EPS converted at the spot FX rate (HK/US). EPS growth (per share, on today's share base) is then PM / (P/E end / P/E start), which by construction is consistent with the price series: it equals net profit growth times a dilution factor (shares at start x bonus/split factor / shares now). FY2025 EPS is up to 10 months stale at the price date, so a trailing twelve month P/E to June 2026 (FY2025 + H1 2026 - H1 2025 EPS) is also shown for A shares. For HK/US names EPS is reported in RMB and the price is in HKD or USD, so a currency effect (RMB per HKD or USD at the two price dates) is shown separately; spot rates are 1.0134 and 0.8526 RMB per HKD and 7.8946 and 6.6909 RMB per USD at the start and end. Sources: [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split); [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报")); [Eastmoney F10 share capital history](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_EQUITY&columns=ALL&filter=(SECUCODE="600276.SH")); [Eastmoney HK F10 main indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=(SECURITY_CODE="00700")(DATE_TYPE_CODE="001")); [NetEase FY2008 20-F](https://www.sec.gov/Archives/edgar/data/1110646/000119312509141163/d20f.htm); [SEC XBRL company facts, NetEase](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json); [Yahoo CNY=X](https://query1.finance.yahoo.com/v8/finance/chart/CNY=X?period1=1160006400&interval=1d) and [Yahoo HKDCNY=X](https://query1.finance.yahoo.com/v8/finance/chart/HKDCNY=X?period1=1160006400&interval=1d)

| Company | Price x (ex div) | Total return x | EPS growth x (per share, today basis) | P/E start (FY06 EPS) | P/E end (FY25 EPS) | P/E end (TTM Jun-26) | P/E change x | Currency effect x | Dividend/reinvest x | Share of log TR: EPS / P/E / FX / div |
|---|---|---|---|---|---|---|---|---|---|---|
| Tencent | 120.3 | 130.9 | 205.2 (local) x FX 1.19 | 28.7 | 14.1 | n/m | 0.49 | 1.19 | 1.09 | 109% / -14% / 4% / 2% |
| NetEase | 37.1 | 48.2 | 27.5 (local) x FX 1.18 | 13.9 | 15.8 | n/m | 1.14 | 1.18 | 1.30 | 86% / 3% / 4% / 7% |
| Gree Electric | 31.8 | 73.8 | 41.1 | 9.6 | 7.4 | 7.8 | 0.77 | 1.00 | 2.32 | 86% / -6% / 0% / 20% |
| Kweichow Moutai | 35.7 | 51.5 | 53.4 | 30.3 | 20.3 | 20.5 | 0.67 | 1.00 | 1.44 | 101% / -10% / 0% / 9% |
| Fudan Microelectronics | 82.9 | 99.2 | 8.3 (local) x FX 1.19 | 8.5 | 72.0 | n/m | 8.42 | 1.19 | 1.20 | 46% / 46% / 4% / 4% |
| Grand Pharmaceutical | 65.0 | 82.7 | n/m | n/m | 12.4 | n/m | n/m | 1.00 | 1.27 | n/m |
| Zhejiang NHU | 31.2 | 49.3 | 160.3 | 61.1 | 11.9 | 11.2 | 0.19 | 1.00 | 1.58 | 130% / -42% / 0% / 12% |
| IEIT Systems | 43.6 | 45.5 | 183.0 | 147.6 | 35.1 | 18.5 | 0.24 | 1.00 | 1.04 | 136% / -38% / 0% / 1% |
| China Jushi | 33.7 | 45.3 | 15.1 | 18.9 | 42.2 | 30.4 | 2.24 | 1.00 | 1.34 | 71% / 21% / 0% / 8% |
| Jiangsu Hengrui | 41.2 | 43.6 | 36.0 | 34.8 | 39.9 | 40.6 | 1.15 | 1.00 | 1.06 | 95% / 4% / 0% / 1% |
| NARI Technology | 17.2 | 22.4 | 33.4 | 43.0 | 22.1 | 21.9 | 0.51 | 1.00 | 1.30 | 113% / -21% / 0% / 9% |
| Zhejiang Sanhua | 37.2 | 49.7 | 22.2 | 19.1 | 32.1 | 34.8 | 1.68 | 1.00 | 1.34 | 79% / 13% / 0% / 7% |
| AVIC Shenyang Aircraft | 44.1 | 46.4 | n/m | n/m | 37.5 | 46.3 | n/m | 1.00 | 1.05 | n/m |
| Sieyuan Electric | 27.0 | 32.2 | 18.5 | 19.1 | 27.9 | 26.5 | 1.46 | 1.00 | 1.19 | 84% / 11% / 0% / 5% |
| Zhongtian Technology | 28.5 | 32.9 | 26.5 | 30.6 | 33.0 | 25.7 | 1.08 | 1.00 | 1.15 | 94% / 2% / 0% / 4% |
| Inner Mongolia Yili | 10.1 | 15.3 | 20.9 | 31.9 | 15.3 | 17.5 | 0.48 | 1.00 | 1.52 | 111% / -27% / 0% / 15% |
| Grandblue Environment | 9.3 | 12.5 | 13.7 | 18.8 | 12.7 | 11.4 | 0.68 | 1.00 | 1.35 | 104% / -15% / 0% / 12% |
| China Yangtze Power | 6.6 | 12.9 | 4.8 | 15.3 | 21.1 | 20.1 | 1.38 | 1.00 | 1.96 | 61% / 13% / 0% / 26% |

(EPS growth is shown in local reporting currency x currency effect for HK/US names. Share of log TR columns sum to about 100 percent.)

- Per company cross check of the earnings side (aggregate net profit growth, share counts, the bonus/split factor implied by raw versus Yahoo adjusted start price, and the screen's own independent check of that adjustment):

| Company | NP FY06 (m) | NP FY25 (m) | NP growth x | Shares at start (m) | Shares now (m) | Bonus/split factor (Keff) | Dilution factor (<1 = new shares) | Screen check of price adjustment |
|---|---|---|---|---|---|---|---|---|
| Tencent | 1,063.8 | 224,842.0 | 211.4 | see note | see note |  | per share EPS used directly | HK/US price check vs stockanalysis in hk_us_screen.csv |
| NetEase | 1,242.8 | 33,759.8 | 27.2 | see note | see note |  | per share EPS used directly | HK/US price check vs stockanalysis in hk_us_screen.csv |
| Gree Electric | 691.7 | 29,003.1 | 41.9 | 805.4 | 5,601.4 | 6.78 | 0.98 | confirmed (within 3%) |
| Kweichow Moutai | 1,544.8 | 82,320.1 | 53.3 | 943.8 | 1,250.1 | 1.33 | 1.00 | confirmed (within 3%) |
| Fudan Microelectronics | 21.1 | 232.3 | 11.0 | see note | see note |  | per share EPS used directly | HK/US price check vs stockanalysis in hk_us_screen.csv |
| Grand Pharmaceutical | -10.7 | 1,120.8 | n/m | see note | see note |  | per share EPS used directly | HK/US price check vs stockanalysis in hk_us_screen.csv |
| Zhejiang NHU | 33.8 | 6,764.2 | 200.4 | 342.1 | 3,073.4 | 7.16 | 0.80 | confirmed (within 3%) |
| IEIT Systems | 9.1 | 2,412.9 | 264.6 | 215.0 | 1,468.5 | 4.74 | 0.69 | unconfirmed difference +18.4%: Yahoo close carries a further adjustment of x1.184 not in its split list (rights issue style) |
| China Jushi | 140.5 | 3,285.5 | 23.4 | 427.4 | 4,003.1 | 6.03 | 0.64 | unconfirmed difference +11.1%: Yahoo split events differ from Eastmoney bonus/transfer table by x1.111 (rights issue or reform consideration shares recorded as splits) |
| Jiangsu Hengrui | 207.0 | 7,711.1 | 37.3 | 331.6 | 6,637.2 | 18.86 | 0.97 | confirmed (within 3%) |
| NARI Technology | 115.2 | 8,279.0 | 71.8 | 212.6 | 8,031.8 | 17.42 | 0.47 | confirmed (within 3%) |
| Zhejiang Sanhua | 46.1 | 4,062.9 | 88.0 | 113.0 | 4,208.0 | 8.79 | 0.25 | confirmed (within 3%) |
| AVIC Shenyang Aircraft | -62.4 | 3,517.8 | n/m | 273.0 | 2,834.9 | 1.96 | 0.19 | confirmed (within 3%) |
| Sieyuan Electric | 149.6 | 3,150.1 | 21.1 | 106.0 | 782.6 | 6.45 | 0.88 | confirmed (within 3%) |
| Zhongtian Technology | 39.5 | 2,902.3 | 73.5 | 270.8 | 3,412.9 | 4.52 | 0.36 | confirmed (within 3%) |
| Inner Mongolia Yili | 325.1 | 11,565.2 | 35.6 | 516.5 | 6,325.4 | 7.20 | 0.59 | confirmed (within 3%) |
| Grandblue Environment | 86.3 | 1,973.1 | 22.9 | 208.5 | 815.3 | 2.34 | 0.60 | confirmed (within 3%) |
| China Yangtze Power | 3,615.2 | 34,502.8 | 9.5 | 8,186.7 | 24,468.2 | 1.50 | 0.50 | confirmed (within 3%) |

- Reading the cross check: the dilution factor is below 1 where the share count grew faster than bonus/transfer shares, i.e. new shares were issued. The share count history shows the main events: China Yangtze Power 9.4bn to 11.0bn (2009-11-06, new A shares) and 16.5bn to 22.0bn (2016-04-13); NARI 2.4bn to 4.2bn (2017-12-26) and 4.2bn to 4.6bn (2018-04-11); AVIC Shenyang 0.35bn to 1.34bn (2017-12-12); Sanhua 0.11bn to 0.26bn (2009-01-05) and 3.7bn to 4.1bn (2025-06-23, H share IPO); Zhongtian 0.7bn to 0.86bn (2014-09-24), 0.86bn to 1.02bn (2015-11-11), and 2.6bn to 3.1bn (2017-02-08); Yili 0.52bn to 0.67bn (2007-11-14, warrant exercise) and 1.6bn to 1.9bn (2013-01-10) — [Eastmoney F10 share capital history](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_EQUITY&columns=ALL&filter=(SECUCODE="600276.SH")) (same report for each code)
- For Yangtze Power, aggregate profit rose 9.5x but per share only 4.8x because shares grew 3.0x (8.19bn to 24.47bn) against a bonus factor of 1.5x; NARI profit rose 71.8x and per share EPS 33.4x; Sanhua 88.0x and 22.2x; Zhongtian 73.5x and 26.5x; AVIC Shenyang n/m — [Eastmoney F10 annual indicators](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE="600519.SH")(REPORT_TYPE="年报")); [Eastmoney F10 share capital history](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_EQUITY&columns=ALL&filter=(SECUCODE="600276.SH"))
- Price adjustment sensitivity: for IEIT, using the independent price multiple 36.81 (instead of Yahoo's 43.58) lowers EPS growth from 183x to 155x; for Jushi, 30.36 (instead of 33.72) lowers it from 15.1x to 13.6x. P/E start and end are unchanged — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv)
- Market context for the "market wide derating" question: the CSI 300 trailing P/E was 12.99 on 2026-10-20, with the Hang Seng Index at 10.55 and the HSCEI at 9.26 (Danjuan; series begins October 2016, range for CSI 300 10.09 to 17.38 since 2016). The A share market was far higher in 2007: Siblis puts the SSE Composite trailing P/E near 70 at the 2007 peak — [Danjuan CSI 300 PE history](https://danjuanfunds.com/djapi/index_eva/pe_history/SH000300?day=all); [Danjuan HSI](https://danjuanfunds.com/djapi/index_eva/pe_history/HKHSI?day=all); [Danjuan HSCEI](https://danjuanfunds.com/djapi/index_eva/pe_history/HKHSCEI?day=all); [Siblis Research](https://siblisresearch.com/data/China-shanghai-pe-cape-ratio/) (as quoted in [market_context_and_rankings.md](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/market_context_and_rankings.md))
- Index price over the same 20 years: CSI 300 price index 2.88x and total return 4.25x, Hang Seng Index 1.32x — [ashare_screen_benchmarks.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen_benchmarks.csv); [hk_us_benchmarks.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/hk_us_benchmarks.csv)

### Inferences
- For most of the shortlist the stock price did not escape a derating by rerating; it escaped it by earnings growth large enough to swamp a falling multiple. Tencent (P/E 28.7 to 14.1), NHU (61 to 12), IEIT (148 to 35, on tiny FY2006 profit), NARI (43 to 22), Yili (32 to 15), Gree (9.6 to 7.4), Moutai (30 to 20) and Grandblue (19 to 13) all derated by 20 to 80 percent while earnings per share rose 14x to 205x.
- A rerating contributed to Fudan (P/E 8.5 to 72 on depressed FY2025 profit), Jushi (19 to 42, 30 on TTM), Sanhua (19 to 32), Sieyuan (19 to 28) and Yangtze Power (15 to 21), and was neutral or small for Hengrui (35 to 40), NetEase (13.9 to 15.8), Zhongtian (31 to 33). Their prices therefore also depended on multiples holding up.
- Yangtze Power and Yili are the most dividend dependent: dividends supplied 26 percent and 15 percent of the log return, and Gree 20 percent; Tencent, Hengrui and IEIT got 1 to 2 percent.
- The statement "earnings grew while the market derated" can only be partly tested: the 2026 CSI 300 P/E of about 13 compares with a 2007 peak reading of about 70 for a different index (SSE Composite), and no index P/E for October 2006 was found, so the size of the market wide derating over exactly this window is not established.
- Aggregate profit growth overstates per share growth for six names where the share count rose by more than the bonus factor; for these the "earnings backed" claim is weaker than the profit totals imply.

### Gaps
- Index P/E at 2006-10-20 (CSI 300, Shanghai Composite, HSI): not found in open sources; Danjuan starts in October 2016.
- FY2006 EPS for the HK names is as reported by Eastmoney HK (Tencent 0.603, Fudan 0.0338, Grand Pharma negative); not checked against the HKEX annual reports. For NetEase the FY2006 EPS is derived as net income RMB 1,242.8m / 3,231.8m weighted shares from the FY2008 20-F.
- TTM P/E for HK/US names and for NetEase not computed.
- AVIC Shenyang Aircraft (FY2006 net loss RMB 62.4m) and Grand Pharmaceutical (FY2006 loss) have no meaningful start P/E and no EPS growth multiple; for them only the price multiple, dividend factor and end P/E (37.5 and 12.4) are available.
- Restated versus original FY2006 profits: Eastmoney's FY2006 attributable profit is the figure as presented after the 2007 move to new Chinese accounting standards (for example Moutai RMB 1,544.8m); original old standard figures were not retrieved.

## Q4. Check 1: Wuliangye FY2025 revenue and profit declines and restatement of the first three quarters

### Takeaway
Confirmed from the company's own filings on cninfo.com.cn. The FY2025 annual report shows revenue RMB 40,528,509,770.23 (-54.55 percent) and net profit attributable to shareholders RMB 8,954,257,202.51 (-71.89 percent), and the company formally corrected its 2025 Q1, H1 and Q3 reports (a "prior period accounting error correction" announced 2026-04-30). One caveat the prefetch note missed: FY2024 was not restated, so the year on year declines compare a 2025 figure on the new revenue basis with a 2024 figure on the old basis.

### Cited Findings
- Annual report 2025 (published 2026-04-30), section "Main accounting data": 营业收入 40,528,509,770.23 元 (2024: 89,175,178,322.70 元), "本年比上年增减 -54.55%"; 归属于上市公司股东的净利润 8,954,257,202.51 元 (2024: 31,853,172,533.98 元), "-71.89%"; basic EPS 2.3068 (2024: 8.2062); weighted average ROE 6.89 percent (2024: 23.35 percent). Recomputed: -54.552 percent and -71.889 percent — [Wuliangye 2025年年度报告, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273091.PDF)
- Same report, quarterly table (revenue RMB bn: Q1 17.09, Q2 6.42, Q3 7.13, Q4 9.89 = 40.53; attributable profit RMB bn: 4.42, 0.21, 1.85, 2.48 = 8.95) with the note "上述财务指标或其加总数是否与公司已披露季度报告、半年度报告相关财务指标存在重大差异: 是" and the explanation quoted: "公司对 2025 年业务模式进行梳理，基于谨慎性原则，调整 2025 年部分业务收入确认相关核算。" — [2025年年度报告, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273091.PDF)
- Dedicated announcement, 关于前期会计差错更正的公告 (No. 2026/011, 2026-04-30, approved by the board on 2026-04-28): "此次前期会计差错更正涉及2025年已披露的一季度、半年度、三季度合并资产负债表与合并利润表的部分项目，不影响现金流量表列示". Restatement tables: Q1 revenue 36,940,356,116.35 -> 17,085,765,657.95 and attributable profit 14,860,265,752.48 -> 4,416,313,048.41; H1 revenue 52,770,984,383.52 -> 23,509,972,048.65 and profit 19,491,942,398.53 -> 4,623,850,715.13; nine months revenue 60,945,321,083.57 -> 30,637,727,654.97 and profit 21,511,276,550.29 -> 6,474,551,792.18 (EPS 5.542 -> 1.668) — [关于前期会计差错更正的公告, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273122.PDF)
- The original Q3 2025 report (published 2025-10-30) shows nine month revenue 60,945,321,083.57 (-10.26 percent) and profit 21,511,276,550.29 (-13.72 percent); the updated Q3 report published 2026-04-30 shows 30,637,727,654.97 (-54.89 percent) and 6,474,551,792.18 (-74.03 percent) — [Q3 2025 original, cninfo](http://static.cninfo.com.cn/finalpage/2025-10-31/1224774300.PDF); [Q3 2025 updated, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273123.PDF)
- The annual report states, in the same filing, "公司是否需追溯调整或重述以前年度会计数据: 否" and (section on changes in accounting policy, estimate or major error correction) "公司报告期无会计政策、会计估计变更或重大会计差错更正的情况", i.e. the 2024 comparative was not restated — [2025年年度报告, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273091.PDF)
- Other 2025 operating detail in the report: Wuliangye branded liquor sales volume 19,455 tonnes (-53.00 percent) with ending inventory of 25,118 tonnes (+306.90 percent); the report describes "白酒行业进入深度调整期，消费场景收缩、存量竞争加剧，导致销量下降、阶段性库存增加" — [2025年年度报告, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273091.PDF)
- The claims in `compounder_fundamentals_prefetch.md` (revenue -54.6 percent, profit -71.9 percent, nine month revenue from RMB 60.9bn to 30.6bn, profit from RMB 21.5bn to 6.5bn, restated after changing revenue recognition on some businesses) match the filings; the "revenue recognition" wording is the company's: "调整2025年部分业务收入确认相关核算" — [compounder_fundamentals_prefetch.md](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/compounder_fundamentals_prefetch.md); [2025年年度报告, cninfo](http://static.cninfo.com.cn/finalpage/2026-04-30/1225273091.PDF)

### Inferences
- The headline declines are accurate as reported but overstate the like for like fall in business activity: the 2024 base (revenue RMB 89.2bn, profit RMB 31.9bn) was not restated to the new revenue basis while 2025 was, so part of the fall is an accounting basis change. The filings do not quantify how much of the FY2024 base would be affected, and the company's wording ("prudence", "business model review") does not say what was reclassified. Volume (-53.00 percent for the Wuliangye brand) and the quarterly profit run rate (Q2 RMB 0.21bn, Q3 RMB 1.85bn restated) indicate a real fall in addition to the accounting change.
- For the compounder narrative, Wuliangye's ROE of 6.89 percent for 2025 and the restated 2025 quarters should be flagged as a break in the series rather than a pure demand effect.

### Gaps
- The size of the revenue reclassification for FY2024 is not disclosed in the filings pulled; no pro forma FY2024 on the new basis was found.
- I did not read the auditor's report text, and did not search for exchange inquiry letters or press coverage about the correction.
- Quote of the prior Sina/Eastmoney articles cited in the prefetch note were not re-fetched; the cninfo primary documents supersede them.

## Q5. Check 2: is China Yangtze Power's drawdown understated because of suspensions?

### Takeaway
Yes, for the 2008 and 2015 selloffs: the screen's -55.6 percent maximum drawdown (peak 2007-10-16, trough 2011-09-06) is a floor measured only on days it traded, and the stock was frozen through the worst legs of both crashes. Yahoo's 52 and 198 flat bars in 2008 are one continuous suspension from 2008-05-08 to 2009-05-15, and the 2015 suspension ran from 2015-06-15 to 2015-11-13. The stock's price on resumption was +2.0 percent (2009) and -10.9 percent (2015) from the last pre suspension price while the CSI 300 price index was -26.5 percent and -29.4 percent over the same days; peers that traded fell between 29 and 70 percent (2008) from the same date. The true drawdown in those periods is unobserved, so the right label is gap, not a low number.

### Cited Findings
- Suspension 1: announcement "重大事项暨停牌公告" (2008-05-08): "本公司正在筹划重大资产重组事宜 ... 本公司股票自 2008 年 5 月 8 日起停牌" — [cninfo, Yangtze Power announcement 2008-05-09](http://static.cninfo.com.cn/finalpage/2008-05-09/39553218.PDF); weekly "重大事项进展公告" (the announcement states weekly updates during suspension) appear in the cninfo list on every week from 2008-05-14 to 2008-12-28 and again on 2009-05-03 and 2009-05-10 (January to April 2009 not listed in the pulls), consistent with an unbroken suspension; the 2009-05-15 restructuring plan states "本公司股票已于 2008 年 5 月 8 日停牌，停牌期间公司进行了 2007 年度的利润分配，每股派发现金红利 0.29682 元" — [cninfo, 重大事项进展公告 2009-05-10](http://static.cninfo.com.cn/finalpage/2009-05-11/52342274.PDF); [cninfo, 重大资产重组预案 2009-05-15](http://static.cninfo.com.cn/finalpage/2009-05-16/52598729.PDF)
- Yahoo prices: last traded close before the suspension 9.7667 (2008-05-07, split adjusted), first traded bar after it 9.9600 on 2009-05-18 (volume 797m); in between Yahoo carries 250 flat zero volume bars, with one apparent change on 2008-07-22 (9.7667 to 9.5667, zero volume) that is the ex dividend adjustment for the 0.2 per share 2007 dividend, not a trade — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split) for 600900.SS
- Suspension 2: "重大资产重组停牌公告" (2015-06-12): shares suspended from 2015-06-12 13:00, then from 2015-06-15; the resumption notice states "公司股票将于 2015 年 11 月 16 日起复牌" — [cninfo 2015-06-13](http://static.cninfo.com.cn/finalpage/2015-06-13/1201145841.PDF); [cninfo 2015-11-14](http://static.cninfo.com.cn/finalpage/2015-11-14/1201772181.PDF). Yahoo shows last traded close 14.73 on 2015-06-12, three spurious bars on 2015-09-28 to 09-30 (zero volume, one repeating the 2015-06-12 volume of 66,840,637), and first real trade 13.12 on 2015-11-16 (volume 513m) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Smaller suspensions: 2007-04-30 to 2007-05-08 (3 bars), 2009-09-07 to 09-11 (4 bars, CSRC review of the asset purchase), 2016-03-02 to 03-10 (6 bars), 2021-11-26 to 12-10 (10 bars) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split); cninfo titles "关于中国证监会上市公司并购重组审核委员会审核重大资产重组事宜的停牌公告" (2009-09-07) and (2016-03-02) as listed in the cninfo announcement search
- Coverage: the stock traded on 144 of 306 bars in the 2007-08 window and 82 of 182 in the 2015-16 window (47 percent and 45 percent), hence `gap` in the screens — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv)
- Comparison of the stock around the first suspension with indexes over the same dates (2008-05-07 to 2009-05-18; price series, split adjusted for the stock, no dividends):

| Series | 2008-05-07 | 2009-05-18 | Change | Lowest point between (vs 2008-05-07) |
|---|---|---|---|---|
| China Yangtze Power close | 9.7667 | 9.9600 | +2.0% | n/a (no trading until 2009-05-18) |
| China Yangtze Power TR (adjclose) | 5.0798 | 5.2875 | +4.1% | n/a |
| CSI 300 price | 3,821.32 | 2,810.57 | -26.5% | -57.4% on 2008-11-04 |
| CSI 300 TR | 3,921.90 | 2,914.03 | -25.7% | -57.0% on 2008-11-04 |
| Shanghai Composite | 3,579.15 | 2,652.78 | -25.9% | -52.3% on 2008-11-04 |
| Huaneng Power (600011) | 5.026 | 4.457 | -11.3% | -34.6% on 2008-10-29 |
| Huadian Power Intl (600027) | 3.166 | 2.904 | -8.3% | -45.3% on 2008-10-29 |
| SDIC Power (600886) | 2.462 | 2.956 | +20.1% | -29.4% on 2008-07-01 |
| Guiguan Electric, hydro (600236) | 2.711 | 3.154 | +16.3% | -46.7% on 2008-09-17 |
| Three Gorges Water (600116) | 2.201 | 1.926 | -12.5% | -52.6% on 2008-11-04 |
| Sichuan Chuantou, hydro (600674) | 5.048 | 3.730 | -26.1% | -68.3% on 2008-10-29 |
| Hubei Energy (000883) | 2.655 | 1.823 | -31.3% | -69.5% on 2008-11-04 |
| GD Power (600795) | 2.119 | 1.940 | -8.5% | -31.3% on 2008-08-26 |

(peer figures are adjclose based) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split) for each symbol; [csindex CSI 300 TR H00300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021); [csindex CSI 300 price](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000300&startDate=20061020&endDate=20261021)
- Second suspension (2015-06-12 to 2015-11-16): Yangtze Power close 14.73 to 13.12 (-10.9 percent; adjclose -8.6 percent); CSI 300 price 5,335.12 to 3,764.13 (-29.4 percent); CSI 300 TR -28.6 percent; lowest CSI 300 price point between: -43.3 percent on 2015-08-26. Peers: Huaneng Power -23.2 percent (low -36.4), Huadian Power Intl -24.7 (-35.0), SDIC Power -29.9 (-33.5), Guiguan -39.9 (-53.3), Three Gorges Water -28.2 (-54.6), Sichuan Chuantou -28.9 (-41.5), Hubei Energy -47.6 (-60.6), GD Power -38.5 (-45.2) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split); [csindex CSI 300 TR H00300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021)
- Behaviour before and after the freeze: from the 2007-10-16 peak to 2008-05-07 (just before the first suspension) Yangtze Power fell 34.4 percent against the CSI 300 TR's 34.9 percent, so it was not defensive before it was frozen. From the peak to the first print after resumption (2009-05-18) it was -31.7 percent (adjclose; -33.1 percent price) versus the CSI 300 TR's -51.7 percent. After resumption it fell 5.7 percent in the month to 2009-06-15 while the CSI 300 TR rose 6.5 percent; its largest fall between 2009-05-18 and 2009-12-31 was -20.4 percent (2009-08-05 to 2009-08-19) against -25.2 percent for the index. After the second resumption it fell 18.5 percent from 2015-11-13 to 2016-01-28 against 23.8 percent for the CSI 300 TR, and its drawdown from 2015-11-16 to 2016-02-29 was -19.4 percent against -26.4 percent for the index — computed from [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split) and [csindex CSI 300 TR H00300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021)
- The screens' reported maximum drawdown: -55.6 percent, peak 2007-10-16, trough 2011-09-06, regained 2015-04-16; 2018 window -16.39 percent and 2021-24 window -17.54 percent are not affected by suspensions — [ashare_screen.csv](/home/user/Sample_R/research_notes/Chinese%20stock%20compounders%2020%20years/ashare_screen.csv)

### Inferences
- The reported -55.6 percent drawdown understates what the stock would have shown had it traded: in 2008 the CSI 300 fell 57.4 percent from the suspension date to its November 2008 trough, in 2015 the CSI 300 fell 43.3 percent from the suspension date to its August 2015 low, and the traded utility peers fell between 29 and 70 percent in 2008 and between 33 and 61 percent in 2015 from the same dates. That is strong evidence the unobserved path included a deep drawdown, but the actual trough for Yangtze Power cannot be read from any price; any number would be an estimate, so the correct entry is `gap` for the 2007-08 and 2015-16 windows (as the screens have it).
- An investor who held through the suspension had no path risk at all and came out at +2.0 percent (2008 to 2009) and -10.9 percent (2015) while the market lost 26 to 29 percent: the relative "outperformance" of about 28.5 and 18.5 percentage points came from illiquidity, not from the business. These suspension periods should therefore not be used as evidence of defensiveness.
- The defensive claim for Yangtze Power rests on the periods when it traded normally: 2018 (-16.4 percent vs -30.4 percent) and 2021 to 2024 (-17.5 percent vs -41.6 percent). Note the stock was not defensive in the traded stretch from October 2007 to May 2008 (-34.4 percent, in line with the index) or in the first month after the 2009 resumption (-5.7 percent while the index rose 6.5 percent), although it fell less than the index later in 2009.
- The 20 year CAGR is largely unaffected by the suspensions, because both endpoints are real trades; only the drawdown, volatility and R2 (0.870) readings are affected (month end values were carried flat for about 12 months in 2008 to 2009 and about 5 months in 2015).

### Gaps
- The Yangtze Power price at the 2008 and 2015 troughs does not exist; no estimate was made. The peer ranges are context only.
- The suspension reason is stated in the filings as major asset restructuring (acquisition of assets from the parent's group); the details of both deals (2009 and 2015 to 2016) were not read beyond the announcement headers.
- The cninfo announcement search for the 2009 resumption returned no "复牌" titled announcement; the resumption date of 2009-05-18 is inferred from the first trade in the Yahoo series and the plan published 2009-05-15, not from a resumption notice.
- Yahoo adjclose moves during suspension (dividend factor changes, e.g. +2.6 percent on 2015-06-30) are artefacts and were ignored; endpoint comparisons use traded bars only.

# Hong Kong and US listed Chinese stocks: 20 year (20 Oct 2006 to 20 Oct 2026) return, drawdown and consistency screen

Files produced (all paths absolute). Main table: `/home/user/Sample_R/research_notes/Chinese stock compounders 20 years/hk_us_screen.csv` (190 rows, one per eligible mainland China stock, sorted by CAGR, ranks across HK and US combined). Companion tables in the same folder: `hk_us_screen_excluded_borderline.csv` (589 eligible but excluded rows: borderline, non mainland, ineligible identity, code reuse), `hk_us_benchmarks.csv` (^HSI, ^HSCE, FXI). Scripts (reproducible, run with `python3 -I`, data paths as arguments): `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/scripts_hkus/` with `parse_hkex.py` (HKEX list), `fetch_yahoo.py` (price cache, 2 req/s, 5/10/20/40 s backoff, log), `metrics.py` + `run_metrics.py` (all metrics), `fetch_profiles.py` (Yahoo assetProfile for classification), `classification.py` (manual classification with basis), `search_a.py` (A share counterpart search), `fetch_sa.py` + `xcheck_sa.py` + `daily_compare.py` + `step_scan.py` (stockanalysis.com cross checks), `assemble.py` (builds CSVs), `consistency.py` (screens). Raw downloads: `.../scratchpad/cn20/downloads_hkus/` (yahoo/, profiles/, stockanalysis/hist/, uscc/, hkexnews/, ListOfSecurities.xlsx). Fetch logs: `downloads_hkus/fetch_log.txt`, `fetch_log_us.txt` (zero HTTP errors or permanent failures logged).

Conventions: window start 2006-10-20 (first traded bar on or after), end 2026-10-20 (exact end date for every stock and benchmark; years = 20.0). Total return (TR) = Yahoo `adjclose` multiple, CAGR = TR^(1/20.0)-1, in listing currency (HKD for HK, USD for US). Price only = Yahoo `quote.close` (split adjusted, not dividend adjusted). MDD = max drawdown of daily adjclose over the window. Stress windows are the stock's own max drawdown inside each window. "Neg yrs" = number of negative calendar years 2007 to 2025 (of 19). R2 = OLS R squared of ln(month end adjclose) on month index. "A" column: Y = also has a mainland A share listing (flag so the A share screen is not double counted).


## Which HK listed mainland China companies traded continuously since Oct 2006, and how do they rank by 20 year CAGR?

### Takeaway
Of 2,771 HKEX Main Board and GEM equity codes fetched, 871 had price history on or before 2006-10-20 and 751 passed the continuity rules; after manual classification (top 263 ranks) and automated classification beyond, 178 are mainland China businesses (H share, red chip, P chip). Only 30 HK mainland names (plus 3 US names) compounded at 12% or more; the best are Tencent 27.6%, Shanghai Fudan Microelectronics 25.8%, Grand Pharmaceutical 24.7%, BYD 21.5%, Sino Biopharmaceutical 20.8%.

### Cited Findings
- HKEX list "Updated as at 21/10/2026" holds 2,481 Main Board and 314 GEM ordinary equities (2,795); 24 RMB counter codes (80xxx) were dropped as duplicates of HKD counters, leaving 2,771 symbols (4 digit code + ".HK"). All 2,771 downloaded with 0 failures; 19 returned no data — [HKEX list](https://www.hkex.com.hk/eng/services/trading/securities/securitieslists/ListOfSecurities.xlsx), [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/0700.HK?period1=1160006400&interval=1d&events=div,split); local logs above.
- Funnel: 1,881 symbols have first bar after 2006-10-20 (not eligible); 871 have bars on or before; 83 fail the 90% rule once Yahoo padded suspension bars are excluded (see data quality); 37 had no actual trade within 30 trading days of 2006-10-20; 751 pass. Six names whose first bar is within 30 trading days after the start were listed after it, so not eligible: 1398 ICBC (2006-10-27), 0609 Tiande Chemical (2006-10-27), 2233 West China Cement (2006-12-04), 1888 Kingboard Laminates (2006-12-07), 0552 China Communications Services (2006-12-08), 1818 Zhaojin Mining (2006-12-08) — computed from the Yahoo caches.
- End date for HK: the 2026-10-21 Yahoo bar is an intraday partial print (timestamp 01:30 UTC = 09:30 HKT while the run happened at about 03:00 UTC on 2026-10-21), so it was dropped; all 751 eligible stocks have a 2026-10-20 close. FXI also ends 2026-10-20.
- Classification: ranks 1 to 263 of the 751 eligible (more than the 250 required) were classified one by one in `classification.py`, each with a basis string stored in the CSV column `classification_basis` (evidence: ISIN prefix from the HKEX list where CNE = PRC incorporated H share; Yahoo `assetProfile` HQ city/country and business summary; ownership from my own knowledge is marked "k:"). Ranks 264+ are automated (CNE ISIN = H share; Yahoo HQ China and non-CNE ISIN = "P/Red chip (subtype unverified)"; everything else treated as non mainland and labelled UNCLASSIFIED in the excluded file) — [Yahoo quoteSummary assetProfile](https://query1.finance.yahoo.com/v10/finance/quoteSummary/0700.HK?modules=assetProfile) (needs cookie and crumb).
- Result in the main CSV (190 rows): 92 H shares (35 of them classified automatically from the CNE ISIN), 29 red chips, 34 P chips, 23 P/Red chip subtype unverified (automated), 12 US listed. 132 of 190 rows are manually classified. 139 of 190 have a positive CAGR; 103 are at 5% or above; 52 at 10% or above; 33 at 12% or above (30 HK, 3 US: NetEase, New Oriental, China Yuchai).
- A share dual listing: 47 HK rows flagged Y. Method: Yahoo name search for A share tickers (.SS/.SZ), false positives removed by hand (for example Skyworth 000810, Shanghai Industrial 600748 and Huabao 501090 are different entities), plus direct Yahoo chart confirmation for 688505.SS (Fudan Zhangjiang), 601318.SS (Ping An), 600011.SS (Huaneng). The A tickers are in column `a_share_ticker`. Of the 33 names at 12%+, A+H: Fudan Microelectronics, BYD, Weichai, Zijin, COSCO Shipping Holdings, Yankuang Energy, Great Wall Motor, Zhejiang Shibao, China Merchants Bank, CNOOC (A listing 600938), China Shenhua — [Yahoo search](https://query1.finance.yahoo.com/v1/finance/search?q=BYD).
- Excluded as borderline/non mainland (never in the mainland ranking, but all metrics are in the excluded CSV): HK headquartered exporters or mixed businesses (for example Dream International 21.1%, Techtronic 14.6%, Lenovo 14.6%, Luk Fook 20.3%, China State Construction International 16.3%) and HK/overseas locals (HKT, OOIL, HKEX, SUNeVision, Wharf). Table of excluded names with CAGR of 10% or above and the reason:

| Rank in excluded group | Symbol | Name | Class | CAGR | MDD | Why excluded |
|---|---|---|---|---|---|---|
| 1 | 0990.HK | Deep Source Holdings Limited | BL | 26.6% | -96% | HK shell (formerly Theme International); bulk commodity trading PRC/HK/Singapore; penny stock; unclear |
| 2 | 1184.HK | S.A.S. Dragon Holdings Limited | BL | 25.0% | -77% | HK-HQ electronics distributor; revenue mix HK/PRC/Taiwan/Vietnam |
| 3 | 1196.HK | Realord Technology Company Lim | BL | 24.3% | -77% | HK conglomerate (hangtag, property, auto parts, financial services) HK/PRC/Grenada |
| 4 | 6823.HK | HKT Trust and HKT Limited | NM-HK | 21.8% | -64% | Yahoo HQ/business: HKT HK telecom |
| 5 | 1126.HK | Dream International Limited | BL | 21.1% | -90% | HK-HQ toy maker; plants in PRC and Vietnam; customers overseas |
| 6 | 0590.HK | Luk Fook Holdings (Internation | BL | 20.3% | -81% | HK-HQ jeweller; revenue HK/Macau-led, mainland minority (k, unverified) |
| 7 | 0372.HK | PT International Development C | BL | 18.0% | -98% | HK commodity trader (formerly ITC Corp); penny stock |
| 8 | 0316.HK | Orient Overseas (International | NM-OS | 18.0% | -90% | Yahoo HQ/business: OOIL global container shipping (HK HQ) |
| 9 | 1161.HK | Water Oasis Group Limited | NM-HK | 17.6% | -75% | Yahoo HQ/business: HK beauty centres |
| 10 | 3311.HK | China State Construction Inter | BL | 16.3% | -84% | Red chip (CSCEC) but construction revenue HK/Macau-heavy; mixed |
| 11 | 0240.HK | Build King Holdings Limited | NM-HK | 16.0% | -94% | Yahoo HQ/business: HK construction |
| 12 | 1686.HK | SUNeVision Holdings Ltd. | NM-HK | 15.8% | -69% | Yahoo HQ/business: HK data centres |
| 13 | 0687.HK | Tysan Holdings Limited | NM-HK | 14.8% | -84% | Yahoo HQ/business: HK piling |
| 14 | 0856.HK | VSTECS Holdings Limited | BL | 14.7% | -90% | HK-HQ IT distributor North/Southeast Asia; mixed |
| 15 | 0992.HK | Lenovo Group Limited | BL | 14.6% | -84% | HK-incorporated global (Legend Holdings), mainland <30% revenue (k) |
| 16 | 0669.HK | Techtronic Industries Company  | BL | 14.6% | -90% | HK-HQ global power tools; >85% revenue N.America/Europe (k) |
| 17 | 0259.HK | Yeebo (International Holdings) | BL | 14.4% | -83% | HK-HQ LCD maker; plants PRC; sales mix unclear |
| 18 | 1118.HK | Golik Holdings Limited | BL | 13.9% | -82% | HK metal/building products HK-led |
| 19 | 2668.HK | Pak Tak International Limited | BL | 13.8% | -99% | HK supply chain/property; mixed |
| 21 | 0613.HK | Planetree International Develo | NM-HK | 13.1% | -93% | Yahoo HQ/business: HK financial services |
| 22 | 2368.HK | Eagle Nice (International) Hol | BL | 13.1% | -75% | HK-HQ garment maker; plants PRC/elsewhere; export |
| 23 | 0398.HK | Oriental Watch Holdings Limite | BL | 12.7% | -86% | HK-HQ watch retailer HK/PRC/Macau |
| 24 | 1050.HK | Karrie International Holdings  | BL | 12.7% | -88% | HK-HQ export manufacturer |
| 25 | 0388.HK | Hong Kong Exchanges and Cleari | NM-HK | 12.6% | -79% | Yahoo HQ/business: HKEX |
| 26 | 0679.HK | Asia Tele-Net and Technology C | BL | 12.6% | -86% | Bermuda shell; electroplating multi-country |
| 27 | 0912.HK | Suga International Holdings Li | BL | 11.7% | -79% | HK-HQ consumer electronics/pet food; mixed |
| 28 | 0004.HK | The Wharf (Holdings) Limited | NM-HK | 11.4% | -73% | Yahoo HQ/business: Wharf HK property/retail |
| 29 | 8131.HK | Novatech Intelligence Limited | NM-HK | 11.4% | -96% | Yahoo HQ/business: HK software |
| 30 | 0108.HK | SR Medical Technology Company  | BL | 10.9% | -98% | Property HK/UK/US/PRC; mixed |
| 31 | 1045.HK | APT Satellite Holdings Limited | BL | 10.6% | -85% | HK satellite operator (CASC-linked); regional |
| 32 | 0116.HK | Chow Sang Sang Holdings Intern | BL | 10.5% | -78% | HK-HQ jeweller HK/Macau/PRC mixed |
| 33 | 2388.HK | BOC Hong Kong (Holdings) Limit | NM-HK | 10.5% | -72% | Yahoo HQ/business: BOCHK |
| 34 | 0146.HK | Tai Ping Carpets International | BL | 10.4% | -73% | HK/global carpets |
| 35 | 3633.HK | Zhongyu Energy Holdings Limite | BL | 10.2% | -85% | Zhongyu Energy (Henan gas) - RTO/penny; PRC ops but Yahoo HQ Central; see data-quality |
| 36 | 0008.HK | PCCW Limited | NM-HK | 10.0% | -46% | Yahoo HQ/business: PCCW |

Top 60 of the combined mainland ranking (HK in HKD, US in USD; full 190 rows with every metric, calendar year returns 2007 to 2025 and 2026 YTD, peak/trough dates, recovery dates and flags are in `hk_us_screen.csv`). Stress MDD columns are 2007-10 to 2008-12, 2015-04 to 2016-02, 2018, 2021-01 to 2024-09. Flags: "padded" = days Yahoo padded for suspension, "adj-fix" = corrected for a corporate action Yahoo missed, "bars removed", "big moves" = a daily move above +80% or below -60% (see data quality), "start shifted" = start moved to first real trade.

| # | Symbol | Name | Class | A | TR x | CAGR | MDD | Stress MDD 07-08 / 15-16 / 18 / 21-24 | Neg yrs | R2 | Flags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0700.HK | Tencent Holdings Limited | P chip | N | 130.9 | 27.6% | -73% | -47% / -27% / -47% / -73% | 6 | 0.88 |  |
| 2 | 1385.HK | Shanghai Fudan Microelectronic | H share | Y | 99.2 | 25.8% | -79% | -79% / -60% / -25% / -77% | 6 | 0.84 |  |
| 3 | 0512.HK | Grand Pharmaceutical Group Lim | P chip | N | 82.7 | 24.7% | -77% | -76% / -41% / -49% / -57% | 7 | 0.87 |  |
| 4 | 1211.HK | BYD Company Limited | H share | Y | 48.9 | 21.5% | -87% | -56% / -51% / -47% / -50% | 7 | 0.81 |  |
| 5 | NTES | NetEase, Inc. | US-listed | n/a | 48.2 | 21.4% | -57% | -42% / -29% / -46% / -57% | 5 | 0.95 |  |
| 6 | 1177.HK | Sino Biopharmaceutical Limited | P chip | N | 43.8 | 20.8% | -77% | -59% / -37% / -63% / -73% | 8 | 0.78 |  |
| 7 | 8049.HK | Jilin Province Huinan Changlon | H share | N | 36.8 | 19.8% | -81% | -69% / -59% / -40% / -33% | 8 | 0.60 |  |
| 8 | 2338.HK | Weichai Power Co., Ltd. | H share | Y | 33.8 | 19.3% | -80% | -80% / -63% / -32% / -71% | 7 | 0.77 |  |
| 9 | 1093.HK | CSPC Pharmaceutical Group Limi | P chip | N | 29.9 | 18.5% | -77% | -73% / -25% / -59% / -60% | 7 | 0.80 |  |
| 10 | 0565.HK | Art Group Holdings Limited | P chip | N | 22.8 | 16.9% | -88% | -74% / -52% / -54% / -73% | 7 | 0.49 | padded 174d |
| 11 | 2313.HK | Shenzhou International Group H | P chip | N | 22.3 | 16.8% | -81% | -71% / -15% / -19% / -73% | 6 | 0.77 |  |
| 12 | 2899.HK | Zijin Mining Group Company Lim | H share | Y | 21.9 | 16.7% | -90% | -90% / -49% / -38% / -49% | 5 | 0.61 | padded 23d, adj-fix |
| 13 | 1061.HK | Essex Bio-Technology Limited | P chip | N | 21.3 | 16.5% | -77% | -64% / -42% / -52% / -74% | 8 | 0.69 | padded 24d |
| 14 | 0175.HK | Geely Automobile Holdings Limi | P chip | N | 21.2 | 16.5% | -84% | -78% / -46% / -54% / -77% | 8 | 0.79 |  |
| 15 | 1919.HK | COSCO SHIPPING Holdings Co., L | H share | Y | 18.1 | 15.6% | -95% | -93% / -66% / -42% / -48% | 9 | 0.19 | padded 86d, adj-fix |
| 16 | 2176.HK | CCID Consulting Company Limite | H share | N | 18.0 | 15.5% | -83% | -80% / -59% / -40% / -44% | 6 | 0.70 | bars removed, big moves |
| 17 | 0371.HK | Beijing Enterprises Water Grou | Red chip | N | 17.4 | 15.4% | -82% | -82% / -49% / -40% / -52% | 7 | 0.38 | big moves |
| 18 | 1114.HK | Brilliance China Automotive Ho | Red chip | N | 17.0 | 15.2% | -90% | -89% / -64% / -74% / -70% | 6 | 0.50 | padded 372d, SA short |
| 19 | 2328.HK | PICC Property and Casualty Com | H share | N | 17.0 | 15.2% | -89% | -89% / -42% / -32% / -22% | 5 | 0.77 |  |
| 20 | 1171.HK | Yankuang Energy Group Company  | H share | Y | 16.7 | 15.1% | -90% | -83% / -68% / -56% / -44% | 9 | 0.41 |  |
| 21 | 0868.HK | Xinyi Glass Holdings Limited | P chip | N | 16.7 | 15.1% | -84% | -83% / -39% / -40% / -79% | 8 | 0.78 |  |
| 22 | 2333.HK | Great Wall Motor Company Limit | H share | Y | 16.6 | 15.1% | -91% | -91% / -73% / -59% / -81% | 5 | 0.67 |  |
| 23 | 1057.HK | Zhejiang Shibao Company Limite | H share | Y | 15.4 | 14.7% | -89% | -58% / -67% / -65% / -56% | 7 | 0.50 | padded 63d |
| 24 | 1164.HK | CGN Mining Company Limited | Red chip | N | 13.9 | 14.1% | -86% | -59% / -68% / -65% / -56% | 7 | 0.51 |  |
| 25 | 3968.HK | China Merchants Bank Co., Ltd. | H share | Y | 11.7 | 13.1% | -75% | -75% / -48% / -27% / -62% | 6 | 0.82 |  |
| 26 | 0883.HK | CNOOC Limited | Red chip | Y | 11.6 | 13.0% | -74% | -74% / -50% / -25% / -25% | 6 | 0.59 |  |
| 27 | 0268.HK | Kingdee International Software | P chip | N | 11.4 | 12.9% | -86% | -66% / -61% / -47% / -86% | 9 | 0.75 |  |
| 28 | 0746.HK | Lee & Man Chemical Company Lim | P chip | N | 11.1 | 12.8% | -86% | -85% / -62% / -28% / -77% | 7 | 0.54 |  |
| 29 | 1088.HK | China Shenhua Energy Company L | H share | Y | 11.0 | 12.7% | -85% | -85% / -50% / -33% / -21% | 7 | 0.44 |  |
| 30 | EDU | New Oriental Education & Techn | US-listed | n/a | 10.9 | 12.7% | -96% | -56% / -30% / -52% / -96% | 8 | 0.47 |  |
| 31 | CYD | China Yuchai International Lim | US-listed | n/a | 10.2 | 12.3% | -81% | -81% / -56% / -52% / -59% | 6 | 0.53 |  |
| 32 | 2028.HK | Jolimark Holdings Limited | P chip | N | 10.2 | 12.3% | -98% | -80% / -29% / -72% / -84% | 9 | 0.01 | padded 114d, big moves |
| 33 | 1109.HK | China Resources Land Limited | Red chip | N | 9.9 | 12.1% | -70% | -70% / -38% / -23% / -46% | 8 | 0.87 |  |
| 34 | 0639.HK | Shougang Fushan Resources Grou | Red chip | N | 9.5 | 11.9% | -87% | -81% / -56% / -36% / -36% | 6 | 0.40 |  |
| 35 | 2218.HK | Yantai North Andre Juice Co.,  | H share | Y | 9.4 | 11.8% | -80% | -76% / -45% / -9% / -31% | 6 | 0.54 | padded 56d, adj-fix |
| 36 | 0995.HK | Anhui Expressway Company Limit | H share | Y | 9.3 | 11.8% | -69% | -69% / -43% / -33% / -33% | 4 | 0.73 |  |
| 37 | BIDU | Baidu, Inc. | US-listed | n/a | 9.3 | 11.8% | -77% | -75% / -40% / -45% / -77% | 9 | 0.30 |  |
| 38 | 3393.HK | Wasion Holdings Limited | P chip | N | 9.2 | 11.8% | -85% | -85% / -75% / -26% / -45% | 7 | 0.40 |  |
| 39 | 2688.HK | ENN Energy Holdings Limited | P chip | N | 9.2 | 11.7% | -72% | -65% / -45% / -34% / -72% | 6 | 0.78 |  |
| 40 | 0257.HK | China Everbright Environment G | Red chip | N | 9.0 | 11.6% | -89% | -89% / -54% / -49% / -59% | 9 | 0.30 |  |
| 41 | 0719.HK | Shandong Xinhua Pharmaceutical | H share | Y | 9.0 | 11.6% | -81% | -77% / -64% / -49% / -68% | 5 | 0.81 | padded 52d |
| 42 | 2005.HK | SSY Group Limited | P chip | N | 8.8 | 11.5% | -79% | -78% / -56% / -40% / -68% | 8 | 0.68 | bars removed |
| 43 | 1349.HK | Shanghai Fudan-Zhangjiang Bio- | H share | Y | 8.5 | 11.3% | -84% | -78% / -53% / -32% / -67% | 8 | 0.36 |  |
| 44 | 0107.HK | Sichuan Expressway Group Compa | H share | Y | 8.4 | 11.2% | -75% | -75% / -56% / -24% / -25% | 9 | 0.36 | padded 27d |
| 45 | 0517.HK | COSCO SHIPPING International ( | Red chip | N | 8.3 | 11.1% | -91% | -91% / -30% / -21% / -19% | 8 | 0.37 | padded 66d |
| 46 | 0939.HK | China Construction Bank Corpor | H share | Y | 8.0 | 10.9% | -70% | -70% / -43% / -30% / -28% | 8 | 0.80 |  |
| 47 | 0425.HK | Minth Group Limited | P chip | N | 7.6 | 10.7% | -84% | -82% / -37% / -49% / -76% | 8 | 0.66 |  |
| 48 | 2678.HK | Texhong International Group Li | P chip | N | 7.3 | 10.5% | -80% | -77% / -53% / -41% / -69% | 9 | 0.53 |  |
| 49 | TCOM | Trip.com Group Limited | US-listed | n/a | 7.0 | 10.2% | -76% | -76% / -35% / -51% / -62% | 7 | 0.63 |  |
| 50 | 0950.HK | Lee's Pharmaceutical Holdings  | P chip | N | 6.9 | 10.2% | -92% | -43% / -57% / -62% / -83% | 10 | 0.08 | padded 27d |
| 51 | 0751.HK | Skyworth Group Limited | P chip | N | 6.9 | 10.1% | -77% | -72% / -50% / -59% / -60% | 9 | 0.31 |  |
| 52 | 0177.HK | Jiangsu Expressway Company Lim | H share | Y | 6.9 | 10.1% | -55% | -55% / -21% / -27% / -38% | 7 | 0.82 |  |
| 53 | 0038.HK | First Tractor Company Limited | H share | Y | 6.6 | 9.9% | -88% | -87% / -55% / -51% / -53% | 10 | 0.10 |  |
| 54 | 0270.HK | Guangdong Investment Limited | Red chip | N | 6.5 | 9.8% | -75% | -68% / -22% / -9% / -71% | 7 | 0.62 |  |
| 55 | 3988.HK | Bank of China Limited | H share | Y | 6.2 | 9.5% | -65% | -65% / -46% / -29% / -17% | 6 | 0.77 |  |
| 56 | 0384.HK | China Gas Holdings Limited | P chip | N | 6.1 | 9.5% | -88% | -88% / -33% / -44% / -79% | 8 | 0.49 |  |
| 57 | 0305.HK | Wuling Motors Holdings Limited | P chip | N | 6.0 | 9.4% | -92% | -85% / -52% / -50% / -91% | 11 | 0.02 | padded 20d, big moves |
| 58 | 2318.HK | Ping An Insurance (Group) Comp | H share | Y | 6.0 | 9.4% | -79% | -79% / -49% / -28% / -66% | 7 | 0.64 | padded 45d |
| 59 | 0358.HK | Jiangxi Copper Company Limited | H share | Y | 6.0 | 9.3% | -91% | -91% / -56% / -40% / -60% | 7 | 0.17 |  |
| 60 | 2348.HK | Dawnrays Pharmaceutical (Holdi | P chip | N | 5.9 | 9.2% | -74% | -22% / -38% / -40% / -40% | 9 | 0.45 |  |

### Inferences
- The 20 year mainland winners cluster in three groups: (1) consumer/tech platforms (Tencent, NetEase), (2) pharma and healthcare (Grand Pharmaceutical, Sino Biopharmaceutical, CSPC, Jilin Changlong, Essex Bio) and (3) cyclicals and autos that recovered violently after 2008 (BYD, Weichai, Geely, Great Wall, Zijin, Yankuang, COSCO Shipping). Within the 33 names at 12%+, 11 are A+H, so the A share researcher's screen will overlap with these; use the `a_share_ticker` column to dedupe.
- Several high ranks are low quality prints rather than investable compounders: Art Group Holdings (#10) is a penny stock with 33% zero volume days whose price rose from about HK$0.2 to HK$3.6 mostly in 2024 to 2026; Jolimark (#32) has a negative CAGR until the end of 2025 (about -6.8% CAGR to 2025-12-31 computed from its Yahoo series) and only turns positive because of a 2026 run (adjusted price 0.12 on 2026-04-30 to a 5.68 peak on 2026-09-24; the daily prints match stockanalysis, so it is not a data error but it is speculative); CCID Consulting (#16), Beijing Enterprises Water (#17, k: reverse takeover into a former HK shell in 2007; its price roughly doubled at the 2007-04-13 reopening) and CGN Mining (#24, reopened after a resumption in 2011) carry penny stock era returns. Treat ranks 10, 16, 17, 24, 32 with caution.
- TR/price multiple above 1.8 (heavy dividend contribution) for 17 of the 33 names: Brilliance China (11.5x ratio, special dividends), Yankuang (4.5x), Shenhua (3.7x), Jolimark (3.7x), CCID (3.2x), CNOOC (3.1x), Lee & Man Chemical (2.9x), Jilin Changlong and COSCO Shipping (2.5x each), Xinyi Glass (2.6x), China Yuchai (2.6x). The ranking by TR therefore differs from a price only ranking for these.
- The sample is 100% survivors: stocks that were listed in Oct 2006 and later delisted from HKEX are not in the HKEX list file used, so survivorship bias flatters every number here.

### Gaps
- Manual classification beyond rank 263 is automated; HK locals with a negative CAGR and a non China Yahoo HQ are labelled UNCLASSIFIED (425 rows in the excluded file) and could include red chips headquartered in Hong Kong; none has a CAGR above 2.6%, so none affects the top 100.
- Several "k:" ownership and revenue mix statements (for example Luk Fook, Techtronic, Lenovo revenue split, Texhong HQ, Kingboard control) are from my own knowledge, not sourced; borderline calls (Dream International, Kingboard, TCL Electronics, China State Construction International, China Taiping, Yue Yuen) could reasonably go either way. They are in the excluded CSV with full metrics so the report writer can move them.
- A share flag relies on Yahoo name search plus manual name checks; a red chip whose A listing Yahoo did not return would be marked N. Flag N means only that the Yahoo name search found no A share; absence was not independently confirmed (for example Tencent, Geely, Shenzhou are N from the search plus my knowledge).
- Penny stock share consolidations: the +80%/-60% flag plus a day by day comparison with stockanalysis (see data quality) found no consolidation error in the mainland ranking, but stocks outside the 194 mainland rows were not compared.
- Asian Century Stocks A/H table (https://www.asiancenturystocks.com/p/duallisted) could not be used: the list is not in the HTML I could fetch.


## Which US listed Chinese companies pre-date 20 Oct 2006 and survive, and what did they return?

### Takeaway
Source list: the USCC table of 286 Chinese companies on NYSE/Nasdaq/NYSE American (7 Mar 2025), plus about 115 tickers I added by hand (delisted SOE ADRs, privatised names, HK/Macau based small caps such as China Yuchai that USCC omits); each was run through Yahoo and kept only if price history starts on or before 2006-10-20 and the company identity matches. Twelve mainland China companies qualify; only NetEase (21.4% CAGR), New Oriental (12.7%) and China Yuchai (12.3%) clear 12%, Baidu 11.8% and Trip.com 10.2% are just below.

### Cited Findings
- USCC table: "As of March 7, 2025, there were 286 Chinese companies listed on these U.S. exchanges"; no Chinese SOEs remain listed after eight SOE issuers delisted in 2022 and 2023 — [USCC page](https://www.uscc.gov/research/chinese-companies-listed-major-us-stock-exchanges), [USCC PDF](https://www.uscc.gov/sites/default/files/2025-03/Chinese_Companies_Listed_on_US_Stock_Exchanges_03_2025.pdf). CYD (China Yuchai), a Bermuda company operating in Guangxi, is not in the USCC table and was added manually. USCC lists EDU's IPO as "March 2006", but stockanalysis shows 2006-09-07 and Yahoo's first trade is 2006-09-15 — [stockanalysis EDU](https://stockanalysis.com/stocks/edu/company/); in both cases it is before the cutoff.
- Listing dates used (stockanalysis/Yahoo `firstTradeDate`): NetEase 2000-06-30, Sohu 2000-07-12, China Yuchai 1994-12, Trip.com (Ctrip) 2003-12-09, Baidu 2005-08-05, New Oriental 2006-09 — [NTES](https://stockanalysis.com/stocks/ntes/company/), [BIDU](https://stockanalysis.com/stocks/bidu/company/), [TCOM](https://stockanalysis.com/stocks/tcom/company/), [SOHU](https://stockanalysis.com/stocks/sohu/company/), [CYD](https://stockanalysis.com/stocks/cyd/company/). CBAK Energy (ticker CBAT now) began trading on the Nasdaq National Market on 2006-05-31 (as CBAK) — [eepower](https://eepower.com/news/china-bak-battery-receives-approval-to-begin-trading-on-nasdaq/). The9 Dec 2004, Origin Agritech Mar 2004, China Natural Resources 1995, China Automotive Systems 2003 (Yahoo first trade dates), UTStarcom 2000-03-03 (stockanalysis).
- Excluded because not exchange listed in Oct 2006: China Pharma Holdings (CPHI) began NYSE Amex trading around 2009-09-30, OTC before — [company 8-K](https://www.sec.gov/Archives/edgar/data/0001106644/000101054909000669/cph8kex991100109.htm); Smart Powerr (CREG, now OTC Pink) and Taoping (TAOP, listing venue in 2006 unverified) are excluded; their Yahoo histories include OTC periods. All three have CAGR of -29% to -36%, so ranking is unaffected. Ticker collisions removed: ACH (now Accendra Health), SNDA (now Sonida Senior Living), AGM, BWEN, CFFN, DAC, EDUC, GTE, NAT are non Chinese companies.
- Borderline (HK/Macau/Taiwan HQ), kept in the excluded file only: Euro Tech (CLWT), Deswell (DSWL, Macau HQ, Dongguan plants), Highway Holdings (HIHO), Asia Pacific Wire & Cable (APWC, Taipei).
- NetEase, Trip.com, Baidu and New Oriental now also have HK secondary listings (USCC +HK tag; the HK codes 9999, 9961, 9888, 9901 are from my knowledge); they are not in the HK screen (post 2006 listings), so no double count in the CSV.
- Results (USD, adjclose; sources: Yahoo chart API, cross checked with [stockanalysis NTES history](https://stockanalysis.com/api/charts/s/NTES/MAX/c)):

| Symbol | Name | Exchange | TR x | CAGR | MDD | Neg yrs | R2 |
|---|---|---|---|---|---|---|---|
| NTES | NetEase | NasdaqGS | 48.22 | 21.4% | -57% | 5 | 0.95 |
| EDU | New Oriental | NYSE | 10.88 | 12.7% | -96% | 8 | 0.47 |
| CYD | China Yuchai | NYSE | 10.17 | 12.3% | -81% | 6 | 0.53 |
| BIDU | Baidu | NasdaqGS | 9.30 | 11.8% | -77% | 9 | 0.30 |
| TCOM | Trip.com | NasdaqGS | 7.00 | 10.2% | -76% | 7 | 0.63 |
| CAAS | China Automotive Systems | NasdaqCM | 0.72 | -1.6% | -94% | 10 | 0.21 |
| SOHU | Sohu.com | NasdaqGS | 0.59 | -2.6% | -95% | 9 | 0.61 |
| CBAT | CBAK Energy | NasdaqCM | 0.03 | -16.8% | -99% | 12 | 0.68 |
| UTSI | UTStarcom | NasdaqGS | 0.02 | -17.8% | -98% | 14 | 0.83 |
| CHNR | China Natural Resources | NasdaqCM | 0.01 | -20.7% | -100% | 14 | 0.90 |
| SEED | Origin Agritech | NasdaqCM | 0.01 | -21.3% | -100% | 14 | 0.84 |
| NCTY | The9 | NasdaqCM | 0.00 | -31.5% | -100% | 14 | 0.95 |

- Survivorship notes (taken private or delisted, with sources where I found them; not ranked, because Yahoo has no price history for these tickers). Sina: merger closed 2021-03-22, $43.30 per share, delisted from Nasdaq — [China Project](https://thechinaproject.com/2021/03/24/sina-goes-private-after-21-years-on-nasdaq/), [SEC 6-K](https://www.sec.gov/Archives/edgar/data/1094005/000110465921039966/a20-32650_6ex99d1.htm). AsiaInfo-Linkage: take private closed 2014-01-15, about $887 to 890 million — [AVCJ](https://www.avcj.com/avcj/news/52341/citic-capital-consortium-completes-usd887m-asiainfo-take-private). 51job: agreed $5.7 billion buyout (ADS $79.05) — [MoFo](https://www.mofo.com/resources/news/210622-chinese-firm-to-go-private). China Mobile, China Telecom, China Unicom: NYSE announced delisting in Jan 2021 under US executive order — [Caixin](https://www.caixinglobal.com/2021-01-02/nyse-to-delist-chinese-telco-giants-on-us-executive-order-101646002.html), [Lightwave](https://www.lightwaveonline.com/business/companies/article/14189720/@lightwaveonline). CNOOC: NYSE delisting began Feb 2021, ADR delisting reported effective 2021-10-22 — [Caixin](https://www.caixinglobal.com/2021-02-27/chinese-offshore-oil-giant-faces-us-delisting-from-march-9-101668235.html), [Business Today](https://businesstoday.in/markets/global-markets/nyse-begins-formal-delisting-of-chinese-state-oil-producer-cnooc/story/432516.html). China Life, PetroChina, Sinopec, Aluminum Corp of China (Chalco), Sinopec Shanghai Petrochemical announced voluntary NYSE delisting on 2022-08-12 — [CNN via KRDO](https://krdo.com/news/2022/08/12/five-state-owned-chinese-companies-to-delist-from-new-york-stock-exchange/); Huaneng Power filed Form 15F on 2022-07-08 (USCC footnote). USCC says 19 Chinese companies delisted between Jan 2024 and Mar 2025 (largest by market cap: ChinData, Hollysys, among others).
- Yahoo returned no data for these candidate tickers, consistent with delisting or ticker change (not independently sourced per ticker): CHL, CHU, CHA(old), CEO, CEA, ZNH, GSH, SNP, PTR, SHI, LFC, HNP, YZC, SINA, JOBS, ELON, JRJC, CNTF, HOLI, KONE, HRAY, LTON, TOMO, CDCS, NTE, NTP, BNSO, SORL, CMED, JST, CHDX.

### Inferences
- The US survivor set is thin: only NetEase compounds at 20%+ with a MDD shallower than -60%. The others are dominated by the 2021 to 2022 regulatory drawdown (New Oriental -96%).
- Because Chinese SOE ADRs and many privatised internet names are gone, a US only screen is heavily survivor biased; HK is the only venue where the SOE H shares still show 20 year histories.

### Gaps
- No complete, dated list of every Chinese company listed in the US in Oct 2006 was found; the USCC list is current companies only, so pre-2006 names that later delisted are known only from my own knowledge plus the web sources above. Shanda, eLong, Hurray, Linktone, Sinovac (Yahoo history only starts 2026-10-14), Hollysys, SORL and others are unsourced here.
- UTStarcom's classification (US origin, now Hangzhou HQ) is medium confidence; The9's business changed from games to crypto mining; Euro Tech's stockanalysis price multiple (0.35x) differs from Yahoo's (0.09x) by 275% and was not resolved (borderline name, not ranked).
- Listing venue of Taoping in Oct 2006 not verified.


## How do ^HSI, ^HSCE and FXI compare over the same window?

### Takeaway
Over 20 years the benchmarks barely compounded: HSI 1.4% a year (price index), Hang Seng China Enterprises Index 0.3% a year (price index, fell 76% from its 2007 peak to the 2022 trough and has not regained that peak), FXI 3.2% a year total return (0.8% price only). Every one of the 33 mainland stocks at 12%+ beat all three, but none avoided the drawdowns.

### Cited Findings
- Computed from [^HSI](https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI), [^HSCE](https://query1.finance.yahoo.com/v8/finance/chart/%5EHSCE) and [FXI](https://query1.finance.yahoo.com/v8/finance/chart/FXI) daily data, saved in `hk_us_benchmarks.csv`. ^HSI and ^HSCE are price indexes (Yahoo adjclose equals close; TR multiple equals price multiple, so no dividends); FXI adjclose includes dividends and its price only series is the `close`.

| Benchmark | Basis | Start to end | TR x | CAGR | Price x | MDD (peak to trough) | Recovered | Stress MDD 07-08 / 15-16 / 18 / 21-24 | Neg yrs | Worst year | R2 | 2026 YTD |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ^HSI | price index, HKD | 2006-10-20 to 2026-10-20 | 1.32 | 1.4% | 1.32 | -65.2% (2007-10-30 to 2008-10-27) | yes, 2018-01-16 | -65% / -36% / -26% / -53% | 8 | -48.3% (2008) | 0.04 | -6.9% |
| ^HSCE | price index, HKD | same | 1.07 | 0.3% | 1.07 | -75.8% (2007-10-30 to 2022-10-31) | no | -76% / -49% / -27% / -60% | 11 | -51.1% (2008) | 0.36 | -9.9% |
| FXI | ETF total return, USD | same | 1.86 | 3.2% | 1.18 | -72.7% (2007-10-31 to 2008-10-27) | yes, 2021-02-11 | -73% / -45% / -28% / -61% | 8 | -47.8% (2008) | 0.15 | -11.8% |

- Median of the 33 mainland stocks at 12%+: whole window MDD -83.9%, stress MDD 2007-08 -75.5%, 2015-16 -49.6%, 2018 -46.6%, 2021-24 -59.8%, 7 negative years of 19 (minimum 5), R2 0.69. So in drawdown terms they were as bad as or worse than the indexes; the extra return came from recovery rather than protection.

### Inferences
- The A share and HK/US results should be compared against an index drawdown of about -65% to -76% in 2007-08; no screened mainland stock at 12%+ had a shallower whole window drawdown than -57%.

### Gaps
- No total return version of HSI or HSCE (Yahoo gives only the price indexes); HSI total return would be about 3 points a year higher given a 3% yield (my estimate, not computed, not used).


## What data errors were found, which rankings depended on them, and does an independent source agree on the top 20?

### Takeaway
Yahoo had material problems that would have distorted the ranking: padded flat bars for suspended stocks, three unadjusted PRC bonus issues (Zijin, COSCO Shipping, Yantai North Andre), a 5x price spike, a few single bad bars, recycled stock codes and a stale pre-suspension start price. All were corrected or the stock was excluded. After corrections the top 20 price only multiples agree with stockanalysis.com within 1% for 13 of 20 and within 7% for 16 of 20; the remaining four (Tencent, Beijing Enterprises Water, Brilliance China, PICC P&C) differ for explainable or unresolved reasons (below). Zero unexplained adjclose/close ratio jumps remain.

### Cited Findings
- Yahoo pads suspended periods with flat zero volume bars (for example Brilliance China 2021-03-31 to 2022-10-03, 372 bars), so a plain "90% of trading days present" test is meaningless. Rule used: bars inside runs of 20+ consecutive zero volume, unchanged price bars count as absent (stocks with over 10% absent days fail: 83 stocks); a stale run of 5+ bars at the start moves the start to the first real trade (the instruction's "first trade within 30 trading days", 37 stocks have none within 30 days and fail); the first 5 bars after any 5+ bar stale run are treated as a resumption for the +80%/-60% test. Flags in CSV: `dq_flags`, `suspended_days`, `longest_susp_run`, `start_shifted_from`. Source: local analysis of [Yahoo chart data](https://query1.finance.yahoo.com/v8/finance/chart/1114.HK).
- +80%/-60% test: 246 of 751 eligible HK stocks have at least one such daily adjclose move outside the first 5 bars after listing or resumption (mostly penny stocks). In the mainland file the flagged events and their resolution: Art Group 2023-10-11 +84% (matches stockanalysis +84%); CCID 2007-02-22 +98% (stockanalysis +78%, genuine illiquid spike, and one bad bar 2008-09-18 at 0.073 vs 0.126 removed); Beijing Enterprises Water 2007-04-13 +94% and 2008-01-29 +150% (stockanalysis +94%/+154%); CGN Mining 2011-04-01 +150% on 554 million shares (stockanalysis +150%); Alibaba Health 2009-11-20 +133%, 2014-01-24 +372%, 2015-04-15 +81% (all match); Mengniu 2008-09-23 -60% (matches; I attribute it to the Sept 2008 melamine scandal, not sourced); CNBM 2008-10-30 +85% (matches); Huabao 2022-01-24 -67% (14.52 to 4.86, both vendors agree, adjclose does not offset it so it looks like a return of capital that neither vendor books as a dividend; unresolved); Molong 2025-05-06 +189% and 2026-03-02 +116% (match); Jolimark 2025-08 and 2026-05 to 2026-09 moves of +85% to +153% (match, speculative); Jolimark 2008-10-17 +120% (stockanalysis +25%; Yahoo prior bar wrong, unresolved, in an old period that does not move the endpoints); SSY Group 2007-08-29 +400% with zero volume reverting -79% on 2007-09-12 (stockanalysis shows no spike) so 2007-08-29 to 2007-09-11 bars were removed — [stockanalysis SSY](https://stockanalysis.com/api/charts/s/HKG-2005/MAX/c); Realord (borderline) 2026-09-14 +316% then -72% (absent in stockanalysis, bar removed); Wuling Motors 2006-12-12 +378% was a resumption from a stale 0.1512 price (start shifted to the first real trade; stockanalysis shows a very different 2006 level, so Wuling's rank 57 is low confidence). Brilliance 2022-10-05 -63% is a resumption after the 372 day suspension.
- Ratio test (adjclose/close day to day jump over 5% with no dividend or split within 3 days, only where close at least 0.2): 0 unexplained jumps among the 751 eligible stocks (about 1,600 jumps over 5% in the first pass, all coinciding with a dividend event).
- Unadjusted corporate actions found by comparing Yahoo with stockanalysis (Yahoo/stockanalysis close ratio constant before one date and 1.00 after, with the price falling on that date) and corrected in `metrics.py` (`ADJ_FIX`): Zijin Mining 2.5 bonus shares per 10 (factor 1.25 before 2007-03-29) — [HKEX announcement 2007-05-16](https://www1.hkexnews.hk/listedco/listconews/sehk/2007/0516/ltn20070516049.pdf) (the ex-date in the price data, 2007-03-29, differs from the record date 30 April 2007 stated there; I rely on the price step); CAGR moved from 15.4% to 16.7%; COSCO Shipping Holdings 1.5 bonus shares per 10 (factor 1.15 before 2007-04-12) — [HKEX filings](https://www.hkexnews.hk/listedco/listconews/sehk/2007/0424/01919/EWF107.pdf) (terms taken from a search summary, PDF not opened); CAGR 14.8% to 15.6%; Yantai North Andre Juice 2007 capitalisation issue (factor 2.2 inferred from the stockanalysis step; a 2007 capitalisation issue is confirmed by the [HKEX GEM circular 2007-08-20](https://www1.hkexnews.hk/listedco/listconews/gem/2007/0820/gln20070820007_c.pdf) but I did not read the ratio there); CAGR 7.5% to 11.7%.
- Code reuse and continuity: stockanalysis history starts at the real IPO; for four mainland rows the Yahoo history from 2006 pre-dates it, so those pre-IPO bars belong to another security on the same code: Guangzhou Automobile (2238, IPO 2010-08-30), China Railway Construction (1186, 2008-03-13), Sinopec Oilfield Service (1033, 2014-12-23), Tianjin Jinran (1265, 2011-04-12). They are in the excluded file as EXCL-CODE-REUSE. Fudan Microelectronics (1385), Fudan Zhangjiang (1349), CCID (2176), Lee & Man (0746) etc. are GEM to Main Board transfers and are continuous in both vendors. Brilliance (1114), Damai/Alibaba Pictures (1060) and Sohu are kept with a flag because stockanalysis history starts late (relisting, rename or ADS change). The continuity test was applied only to mainland rows (194 had stockanalysis data).
- Top 20 mainland cross check against stockanalysis.com (second source, daily history from 2006-10-20 to 2026-10-20; note the two vendors often share upstream data, so agreement is partial independence). "px diff" = stockanalysis relative to Yahoo:

| # | Symbol | Name | Yahoo px x | StockAnalysis px x | px diff | Yahoo TR x | SA TR x | TR diff |
|---|---|---|---|---|---|---|---|---|
| 1 | 0700.HK | Tencent Holdings Limited | 120.32 | 110.92 | -7.8% | 130.90 | 130.88 | -0.0% |
| 2 | 1385.HK | Shanghai Fudan Microelectr | 82.95 | 82.95 | +0.0% | 99.23 | 102.07 | +2.9% |
| 3 | 0512.HK | Grand Pharmaceutical Group | 65.00 | 62.27 | -4.2% | 82.65 | 82.65 | +0.0% |
| 4 | 1211.HK | BYD Company Limited | 40.76 | 40.76 | +0.0% | 48.93 | 45.20 | -7.6% |
| 5 | NTES | NetEase, Inc. | 37.06 | 37.06 | -0.0% | 48.22 | 48.13 | -0.2% |
| 6 | 1177.HK | Sino Biopharmaceutical Lim | 30.89 | 31.16 | +0.9% | 43.81 | 45.59 | +4.1% |
| 7 | 8049.HK | Jilin Province Huinan Chan | 14.59 | 14.67 | +0.6% | 36.84 | 37.93 | +3.0% |
| 8 | 2338.HK | Weichai Power Co., Ltd. | 20.10 | 20.10 | -0.0% | 33.82 | 33.99 | +0.5% |
| 9 | 1093.HK | CSPC Pharmaceutical Group  | 18.62 | 18.61 | -0.0% | 29.89 | 29.82 | -0.3% |
| 10 | 0565.HK | Art Group Holdings Limited | 16.00 | 16.00 | +0.0% | 22.82 | 22.82 | +0.0% |
| 11 | 2313.HK | Shenzhou International Gro | 11.37 | 11.41 | +0.3% | 22.29 | 22.37 | +0.4% |
| 12 | 2899.HK | Zijin Mining Group Company | 12.51 | 12.37 | -1.1% | 21.86 | 22.34 | +2.2% |
| 13 | 1061.HK | Essex Bio-Technology Limit | 15.14 | 15.14 | +0.0% | 21.29 | 21.29 | -0.0% |
| 14 | 0175.HK | Geely Automobile Holdings  | 15.89 | 15.89 | +0.0% | 21.23 | 21.26 | +0.1% |
| 15 | 1919.HK | COSCO SHIPPING Holdings Co | 7.15 | 7.13 | -0.3% | 18.07 | 18.19 | +0.7% |
| 16 | 2176.HK | CCID Consulting Company Li | 5.62 | 5.23 | -6.9% | 17.97 | 17.31 | -3.7% |
| 17 | 0371.HK | Beijing Enterprises Water  | 9.16 | 7.57 | -17.3% | 17.43 | 17.65 | +1.3% |
| 18 | 1114.HK | Brilliance China Automotiv | 1.49 | 0.68 | -54.4% | 17.04 | 6.25 | -63.3% |
| 19 | 2328.HK | PICC Property and Casualty | 8.72 | 7.67 | -12.0% | 16.98 | 17.29 | +1.8% |
| 20 | 1171.HK | Yankuang Energy Group Comp | 3.70 | 3.69 | -0.2% | 16.72 | 14.54 | -13.1% |

- Reading the table: agreement within 1% for Fudan Micro, BYD, NetEase, Sino Biopharm, Jilin Changlong, Weichai, CSPC, Art Group, Shenzhou, Essex, Geely, COSCO (after fix), Yankuang; Zijin (after fix) -1.1%. Price only differences with TR agreement within 4%: Tencent -7.8% (TR identical at 130.9x; I infer stockanalysis adjusts close for a dividend in kind that Yahoo carries only in adjclose), Grand Pharma -4.2%, Beijing Enterprises Water -17.3% (TR +1.3%), PICC P&C -12.0% (TR +1.8%), CCID -6.9% (TR -3.7%). Unresolved: Brilliance China (stockanalysis series starts 2022-10-05, not comparable), Yankuang TR 16.7x vs 14.5x (price identical, dividend treatment differs by 13%; its CAGR would be 14.0% instead of 15.1% on the stockanalysis figure), BYD TR 48.9x vs 45.2x (-7.6%).
- In the wider mainland file, other price/TR gaps above 10% that I did not resolve (all at rank 56 or lower, or negative CAGR): Wuling 0305, China Resources Gas 1193 (stockanalysis TR +246%), Sinopec Kantons 0934, Guangdong Yueyun 3399, Chinese People 0681, Nanjing Sample 1708, Capital Environment 3989, China Water Industry 1129 — see `sa_px_diff_pct` and `sa_tr_diff_pct` columns.

### Inferences
- The binding data risk for the ranking is not noise but unadjusted PRC bonus/capitalisation issues in 2006 to 2008 and penny stock prints; Zijin, COSCO and Yantai would have been understated by 0.8 to 4.2 points of CAGR (Zijin 1.3, COSCO 0.8, Yantai 4.2). Any other H share that did a bonus issue in 2006 to 2008 and is outside the roughly 190 mainland rows with stockanalysis data could be understated (the step scan covered only the 194 rows classified mainland at that stage and flagged none other with a persistent 7%+ ratio step in the top 60 besides the three fixed).
- Weak spots in the top 20 are: Art Group (#10), CCID (#16), Beijing Enterprises Water (#17), Brilliance (#18, TR is 11x price because of special dividends and cannot be cross checked) and Yankuang (#20, dividend gap).

### Gaps
- Dividend (TR) differences of 4% to 13% between vendors (BYD, Yankuang) were not traced to individual dividends.
- Huabao's -67% day, Jolimark's 2008-10-17 bar and Wuling's 2006 level are unresolved; no HKEX announcements were read for them.
- Corporate action factors for Yantai (2.2) and COSCO (1.15) rely on stockanalysis and a search summary respectively; Zijin's ex-date differs from the announced record date.


## Which mainland stocks compounded at 12%+ with shallow drawdowns, few down years and a straight line?

### Takeaway
None. Of the 33 mainland stocks with CAGR of 12% or more: 0 had a whole window maximum drawdown shallower than -50% (best is NetEase at -57.3%), 0 meet both 4 or fewer negative calendar years and R2 of 0.85 or more, and 0 compounded at 12% or more with a maximum drawdown shallower than -30%. NetEase is the only near miss (5 negative years, R2 0.95, MDD -57%).

### Cited Findings
- (a) MDD shallower than -50% among CAGR 12%+: zero stocks. Shallowest: NetEase -57.3%, China Resources Land -70.0%, Tencent -72.8%, CNOOC -74.2%, China Merchants Bank -74.9%. Source: `hk_us_screen.csv`, `consistency.py`.
- (b) 4 or fewer negative years and R2 of 0.85 or more: zero stocks. Minimum negative years among the 33 is 5 (NetEase, Zijin, PICC P&C, Great Wall Motor); highest R2: NetEase 0.95, Tencent 0.88 (6 negative years), China Resources Land 0.87 (8), Grand Pharma 0.87 (7), Fudan Micro 0.84 (6).
- (c) Top 30 by CAGR divided by absolute MDD (only 33 qualify):

| # | Symbol | Name | CAGR | CAGR/abs(MDD) | MDD | Neg yrs | R2 |
|---|---|---|---|---|---|---|---|
| 1 | 0700.HK | Tencent Holdings Limited | 27.6% | 0.379 | -72.8% | 6 | 0.88 |
| 2 | NTES | NetEase, Inc. | 21.4% | 0.373 | -57.3% | 5 | 0.95 |
| 3 | 1385.HK | Shanghai Fudan Microelectronic | 25.8% | 0.328 | -78.8% | 6 | 0.84 |
| 4 | 0512.HK | Grand Pharmaceutical Group Lim | 24.7% | 0.321 | -76.9% | 7 | 0.87 |
| 5 | 1177.HK | Sino Biopharmaceutical Limited | 20.8% | 0.270 | -77.2% | 8 | 0.78 |
| 6 | 1211.HK | BYD Company Limited | 21.5% | 0.247 | -87.0% | 7 | 0.81 |
| 7 | 8049.HK | Jilin Province Huinan Changlon | 19.8% | 0.244 | -81.0% | 8 | 0.60 |
| 8 | 1093.HK | CSPC Pharmaceutical Group Limi | 18.5% | 0.240 | -77.0% | 7 | 0.80 |
| 9 | 2338.HK | Weichai Power Co., Ltd. | 19.3% | 0.240 | -80.2% | 7 | 0.77 |
| 10 | 1061.HK | Essex Bio-Technology Limited | 16.5% | 0.214 | -77.1% | 8 | 0.69 |
| 11 | 2313.HK | Shenzhou International Group H | 16.8% | 0.208 | -80.6% | 6 | 0.77 |
| 12 | 0175.HK | Geely Automobile Holdings Limi | 16.5% | 0.197 | -83.9% | 8 | 0.79 |
| 13 | 0565.HK | Art Group Holdings Limited | 16.9% | 0.192 | -88.1% | 7 | 0.49 |
| 14 | 0371.HK | Beijing Enterprises Water Grou | 15.4% | 0.187 | -82.1% | 7 | 0.38 |
| 15 | 2176.HK | CCID Consulting Company Limite | 15.5% | 0.187 | -83.2% | 6 | 0.70 |
| 16 | 2899.HK | Zijin Mining Group Company Lim | 16.7% | 0.186 | -89.6% | 5 | 0.61 |
| 17 | 0868.HK | Xinyi Glass Holdings Limited | 15.1% | 0.180 | -83.9% | 8 | 0.78 |
| 18 | 0883.HK | CNOOC Limited | 13.0% | 0.175 | -74.2% | 6 | 0.59 |
| 19 | 3968.HK | China Merchants Bank Co., Ltd. | 13.1% | 0.175 | -74.9% | 6 | 0.82 |
| 20 | 1109.HK | China Resources Land Limited | 12.1% | 0.173 | -70.0% | 8 | 0.87 |
| 21 | 2328.HK | PICC Property and Casualty Com | 15.2% | 0.170 | -89.4% | 5 | 0.77 |
| 22 | 1114.HK | Brilliance China Automotive Ho | 15.2% | 0.170 | -89.7% | 6 | 0.50 |
| 23 | 1171.HK | Yankuang Energy Group Company  | 15.1% | 0.168 | -90.2% | 9 | 0.41 |
| 24 | 2333.HK | Great Wall Motor Company Limit | 15.1% | 0.166 | -90.5% | 5 | 0.67 |
| 25 | 1057.HK | Zhejiang Shibao Company Limite | 14.7% | 0.166 | -88.6% | 7 | 0.50 |
| 26 | 1919.HK | COSCO SHIPPING Holdings Co., L | 15.6% | 0.164 | -94.9% | 9 | 0.19 |
| 27 | 1164.HK | CGN Mining Company Limited | 14.1% | 0.164 | -85.8% | 7 | 0.51 |
| 28 | CYD | China Yuchai International Lim | 12.3% | 0.152 | -80.9% | 6 | 0.53 |
| 29 | 0268.HK | Kingdee International Software | 12.9% | 0.151 | -85.8% | 9 | 0.75 |
| 30 | 1088.HK | China Shenhua Energy Company L | 12.7% | 0.150 | -85.1% | 7 | 0.44 |

- Context check including borderline and non mainland HK/US names (58 stocks at 12%+): still zero with MDD shallower than -50% and zero with both screens; Dream International (21.1% CAGR, 5 negative years, R2 0.89, MDD -90%) and SUNeVision (15.8%, 5, 0.82, -69%) are the closest non mainland near misses. Output of `consistency.py`.
- Stocks currently within 30% of their window high among the 33 (useful for "still strong" filters): NetEase -20%, Jilin Changlong -5%, CSPC -18%, Art Group -29%, COSCO Shipping -7%, PICC P&C -18%, China Merchants Bank -4%, CNOOC -16%, Shenhua -11%, China Resources Land -18%. Six of the 33 never recovered from their worst drawdown (Tencent, Sino Biopharm, Shenzhou, Essex, Kingdee, New Oriental).

### Inferences
- Over this window a 12%+ compounder in HK or US Chinese stocks always paid for it with at least one drawdown of -57% or worse; the 2021 to 2024 drawdown (median -60% across the 33) hit even the leaders. Any "smooth compounder" list in the report has to come from the A share screen, or must relax the thresholds (for example CAGR 8% to 12%) rather than the 12% and -30% test used here.
- NetEase (ADS) is the only HK/US name with a straight line profile (R2 0.95) and the shallowest MDD, and it is US listed (also HK secondary).

### Gaps
- R2 uses month end adjclose including the start month; CAGR threshold applied to the CAGR after corrections (Zijin, COSCO, Yantai); using raw Yahoo would change membership only for Yantai (11.8% after correction vs 7.5% raw) and nobody crosses 12%.
- Dividend adjusted "total return" for HSI/HSCE does not exist; benchmark comparisons use price index values.

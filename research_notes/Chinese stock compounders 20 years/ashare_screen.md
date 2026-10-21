# Chinese A share screen: 20 year total return, drawdown and consistency (20 Oct 2006 to 20 Oct 2026)

Prepared 2026-10-21 by script from daily price data. Window start 2006-10-20, window end 2026-10-20 (last completed close). Everything below is computed, not estimated; a missing value is written `gap`.

Full results table (one row per eligible stock, sorted by CAGR, 91 columns): `/home/user/Sample_R/research_notes/Chinese stock compounders 20 years/ashare_screen.csv`. Scripts: `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/scripts_ashare/` (run order in the first section).

## Universe: how many A share companies were listed on or before 2006-10-20 and are still listed

### Takeaway
The universe is 1201 companies (719 Shanghai, 482 Shenzhen), built from the exchanges' own current A share lists filtered on listing date on or before 2006-10-20. 1085 are eligible after the price and trading rules; the other 116 are excluded for the reasons below (list with their CAGR in `ashare_screen_ineligible.csv` next to this file).

### Cited Findings
- SSE endpoint returned 1845 A share records (STOCK_TYPE=1, field `LIST_DATE` yyyymmdd, `DELIST_DATE`); 145 carry a delisting date and were removed, leaving 1,700 currently listed; of those 719 have LIST_DATE on or before 20061020 — [SSE listing endpoint](https://query.sse.com.cn/sseQuery/commonQuery.do?sqlId=COMMON_SSE_CP_GPJCTPZ_GPLB_GP_L&STOCK_TYPE=1&isPagination=false) (header `Referer: https://www.sse.com.cn/` required)
- SZSE xlsx returned 2,906 A share rows (column `A股上市日期`, `A股代码`; the list contains only currently listed companies); 482 have an A share listing date on or before 2006-10-20 — all are main board (the former SME board is merged into 主板; ChiNext cannot qualify) — [SZSE A share list](https://www.szse.cn/api/report/ShowReport?SHOWTYPE=xlsx&CATALOGID=1110&TABKEY=tab1) (the plain request failed with a TLS reset and a 50x page until a `Referer: https://www.szse.cn/market/product/stock/list/index.html` header was added)
- Total universe 1201 = 719 + 482. 72 of these companies also have a B share line; B shares are excluded because only the A share code is used — same SSE and SZSE sources
- Yahoo symbols are the six digit A share code plus .SS (Shanghai) or .SZ (Shenzhen); all 1201 returned a daily history from Yahoo (0 missing) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Eligible: 1085. Excluded: 116 (87 for traded days under 90% of window; 15 for no trade within 30 trading days of start; 13 for no trade within 30 trading days of start + traded days under 90% of window; 1 for suspended at end). Survivorship bias is built in by design: only companies still listed on 2026-10-20 are included, so companies delisted or merged away since 2006 (145 SSE records alone carry a delisting date, not all of which were listed in 2006) are not in the ranking — computed from the lists above

### Inferences
- A 20 year survivor screen on current lists flatters absolute returns; the report should say the sample is survivors only.
- Company renames, code changes and reverse mergers are handled by whatever Yahoo carries under the current code; a company that re-listed under a new code after 2006-10-20 is not in the universe.

### Gaps
- Companies listed by 2006-10-20 that have since changed code or been absorbed are not in the lists; no separate list of such companies was built.

## Prices: Yahoo daily data retrieval and reproducibility

### Takeaway
All 1,201 stocks plus Shanghai Composite and Shenzhen Component downloaded cleanly (0 permanent failures, 0 HTTP 429s, no backoff was triggered). Yahoo has no usable history for the CSI 300 index, so the official csindex.com.cn series (price and total return) was used for that benchmark.

### Cited Findings
- Each symbol was fetched once with period1=1160006400 (2006-10-05), period2 = now, interval=1d, events=div,split; JSON cached under `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/downloads_ashare/yahoo/`, throttled to about 2 requests a second, retry logic 5/10/20/40 seconds (never needed); failure log would be `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/downloads_ashare/fetch_log.txt` (not created because no failure occurred) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Yahoo `quote.close` is split and bonus adjusted but not dividend adjusted (e.g. the first 000001.SZ bar, 2006-10-09, shows close 2.418 versus adjclose 1.708, and the file carries split events of 1.3:1 and 1.6:1); `adjclose` is dividend and split adjusted. Timestamps are 01:30 UTC, i.e. 09:30 China time, so the trading date is the China date — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- The Yahoo bar dated 2026-10-21 was an intraday partial (regularMarketTime 11:13 China time on 2026-10-21), so it was dropped; the window end is **2026-10-20**. The official csindex series for the CSI 300 ends on the same date, 20261020 — [csindex CSI 300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000300&startDate=20061020&endDate=20261021)
- Yahoo fills trading suspensions with zero volume flat bars for most Chinese stocks. A bar counts as a traded day only if volume is above zero or the close differs from the previous close; the cache holds 249,777 zero volume bars (excluding each file's first bar), of which 248,785 are flat copies of the prior close and 992 carry a price change (treated as traded) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Yahoo CSI 300 history is unavailable: 000300.SS returns one bar for any range, 000300.SZ and ^000300.SS return Not Found, 399300.SZ returns one bar. Official daily history from csindex.com.cn (price index 000300 and total return index H00300, 4,859 and 4,860 rows from 2006-10-20) was used — [csindex price](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000300&startDate=20061020&endDate=20261021), [csindex total return](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021)
- Yahoo SS bars are missing on some ordinary trading days (example: both 000001.SS and 600378.SS have no bars for 2019-04-29 and 2019-04-30, so the 2019-05-06 bar shows the combined move since 2019-04-26, -5.83 percent for the index), which produces apparent two day moves of more than 10 percent on the next bar of individual stocks (see the soft flag count below); the market calendar built from the Shanghai Composite inherits such gaps — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600378.SS?period1=1160006400&interval=1d&events=div,split)
- Run order: `build_universe.py` -> `fetch_yahoo.py` -> `convert_csindex.py` -> `compute_metrics.py` (uncorrected) -> `fetch_em.py`, `crosscheck_light.py` (Tencent raw prices + Eastmoney bonus table) -> `diag_all_events.py` -> `make_corrections.py` -> `fetch_sina_qfq.py`, `sina_check.py` -> `gate_corrections.py` -> `compute_metrics.py` (with corrections.json) -> `finalize.py` -> `crosscheck_stockanalysis.py`, `mdd_sina_check.py` -> `screen.py` -> `build_notes.py`. All under `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/scripts_ashare/`; intermediate result files are in `/tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/out/`

### Inferences
- Because suspension days are carried forward at the last price, drawdowns and calendar returns of stocks that were suspended through a selloff (for example China Yangtze Power in 2008 and 2015) understate what an investor could have experienced; the stress window gap rule below addresses part of this.

### Gaps
- Yahoo `close` for rights issues (配股) is inconsistently adjusted (see data quality); no field in the Yahoo JSON identifies which.

## Eligibility: start date, end date and trading day coverage

### Takeaway
1085 of 1201 stocks pass: first trade within 30 trading days of 2006-10-20, last trade within 5 market days of 2026-10-20, and traded on at least 90 percent of the 4,855 window trading days. 47 eligible stocks started late and are flagged.

### Cited Findings
- Market calendar = Shanghai Composite bars from 2006-10-20 to 2026-10-20: 4,855 trading days; start day 2006-10-20 (a trading day), end day 2026-10-20 — [Yahoo 000001.SS](https://query1.finance.yahoo.com/v8/finance/chart/000001.SS?period1=1160006400&interval=1d)
- Start for each stock = its first traded bar on or after 2006-10-20; 47 eligible stocks were suspended on 2006-10-20 (many in share reform) and start later, between 1 and 30 market days later, flagged in column `start_flag` — computed from [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Traded day coverage of eligible stocks: median 97.5 percent, minimum 90.0 percent. Rule applied to traded days (suspension filler bars do not count). Bars on non Shanghai trading days are ignored
- Ineligible (116): 87 traded days under 90% of window; 15 no trade within 30 trading days of start; 13 no trade within 30 trading days of start + traded days under 90% of window; 1 suspended at end. Full list with CAGR, drawdown and reason: `/home/user/Sample_R/research_notes/Chinese stock compounders 20 years/ashare_screen_ineligible.csv`
- Ineligible stocks whose CAGR would have been 12 percent or more (12), shown for transparency, not ranked: 600259.SS CHINA RARE EARTH NONFERR 17.3% (coverage 87.44%); 000513.SZ LIVZON PHARMACEUTICAL GR 16.1% (no trade within 30 trading days of start); 000034.SZ Digital China Group Co., 16.1% (coverage 84.96%); 000672.SZ GANSU SHANGFENG MATERIAL 14.5% (coverage 66.78%); 000831.SZ CHINA RARE EARTH RESOURC 14.5% (coverage 89.31%); 600893.SS AECC AVIATION POWER CO,L 13.7% (coverage 86.94%); 000156.SZ Wasu Media Holding Co.,L 13.2% (no trade within 30 trading days of start); 000688.SZ Guocheng Mining CO.,LTD 13.0% (coverage 64.45%); 000603.SZ Shengda Resources Co.,Lt 12.9% (coverage 83.77%); 000999.SZ China Resources Sanjiu M 12.6% (no trade within 30 trading days of start); 600490.SS Pengxin International Mi 12.5% (coverage 89.04%); 000657.SZ CHINA TUNGSTEN AND HIGHT 12.0% (coverage 80.0%) — computed from [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)

### Inferences
- The 90 percent rule removes stocks with long suspensions (asset restructuring), several of which show high CAGR on stale carried prices; they should not be treated as 20 year compounders.

### Gaps
- The end date rule (last traded within 5 market days) excluded 1 stock; the 5 day tolerance is my addition, not part of the brief.

## Metrics: 20 year total return, drawdown and consistency ranking (top 100)

### Takeaway
Across 1085 eligible stocks the median 20 year total return CAGR is 5.7 percent; 132 stocks reach 12 percent, 57 reach 15 percent and 14 reach 20 percent. The top is led by Gree Electric (24.0 percent, 74x), Zangge Mining, Shengyi Technology and Kweichow Moutai.

### Cited Findings
- Method: CAGR = (adjclose_end / adjclose_start)^(1/years) - 1 with years = days/365.25; price only multiple from `close`; maximum drawdown on daily adjclose over the window with peak, trough and first date the old peak was regained; four stress window drawdowns (peak to trough inside the window, `gap` if the stock traded on under 60 percent of that window's market days); calendar year returns 2007 to 2025 (last bar of year over last bar of prior year, `gap` if no trading in the year) and 2026 year to date to 2026-10-20; R squared of OLS ln(month end adjclose) on month index; composite = CAGR / |max drawdown| — computed from [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split) by `compute_metrics.py`
- 118 eligible stocks returned 10x or more over the window and 42 returned 20x or more; 65 lost money in total return terms — same source
- Rank 100 cut off is a CAGR of 13.21 percent; the Sina based reconstruction (below) puts the 100th at 13.22 percent and agrees on 98 of the 100 names (the two that differ, Guangxi Huaxi Nonferrous #99 and Xiamen C&D #100 here, are #101 and #102 there, with Kexin Development 600234 and SDIC Power 600886 taking their places) — computed, see data quality section
- CSV columns: rank_cagr, rank_cagr_before_corrections, code, symbol, name_cn, name_en, exchange, board, list_date, start_date, end_date, start_flag, years, tr_multiple, cagr_pct, cagr_pct_before_corrections, price_multiple, price_cagr_pct, mdd_pct, mdd_peak_date, mdd_trough_date, mdd_recovered, mdd_recovery_date, s2007_08, s2015_16, s2018, s2021_24 (own max drawdown inside each stress window, percent), ret_2007 .. ret_2025, ret_2026ytd (calendar year total returns, percent), n_neg_years, n_valid_years, worst_year, worst_year_ret_pct, r2_monthly, composite, coverage_pct, cur_dd_from_peak_pct, dq_* (data quality flags), dq_correction_applied, xc_* (raw price plus bonus table check), sina_* (Sina reconstruction), cagr_pct_conservative, xc_yahoo_only_split_check

**Top 100 by total return CAGR (after the corrections described under data quality).** Columns: Rank; Yahoo symbol; name; CAGR % (adjclose); total return multiple; price only multiple; max drawdown %; negative calendar years 2007 to 2025; R squared; data quality flags (blank = none). Flags: `start d` first trade later than 2006-10-20; `corrected(#n)` price correction applied, rank before correction; `resume jump` extreme move after a suspension (exempt from the data error rule); `n soft` days of more than 11 percent absolute move outside suspension resumption (mostly missing Yahoo bars or market wide limit down days, see data quality); `Sina x%` Yahoo total return multiple minus the independent Sina/Tencent reconstruction, in percent (shown only if over 3 percent in absolute value); `px x%` Yahoo price only multiple minus the independent raw price plus bonus table figure, in percent (shown only if over 3 percent).

| Rank | Symbol | Name | CAGR % | TR x | Price x | Max DD % | Neg yrs | R2 | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 000651.SZ | GREE ELECTRIC APPLIANCES,INC.O 格力电器 | 24.0 | 73.8 | 31.8 | -65.0 | 8 | 0.8865 |  |
| 2 | 000408.SZ | ZANGGE MINING COMPANY LIMITED 藏格矿业 | 22.5 | 57.5 | 45.5 | -89.8 | 7 | 0.7024 |  |
| 3 | 600183.SS | Shengyi Technology Co.,Ltd. 生益科技 | 21.9 | 52.2 | 30.8 | -77.9 | 6 | 0.7936 | 1 soft |
| 4 | 600519.SS | Kweichow Moutai Co.,Ltd. 贵州茅台 | 21.8 | 51.5 | 35.7 | -62.5 | 6 | 0.9022 | 1 soft |
| 5 | 002050.SZ | ZHEJIANG SANHUA INTELLIGENT CO 三花智控 | 21.6 | 49.7 | 37.2 | -74.7 | 6 | 0.9319 |  |
| 6 | 002001.SZ | Zhejiang NHU Company Ltd. 新 和 成 | 21.5 | 49.3 | 31.2 | -68.9 | 6 | 0.8603 |  |
| 7 | 600760.SS | Avic Shenyang Aircraft Company 中航沈飞 | 21.2 | 46.4 | 44.1 | -73.5 | 6 | 0.8804 |  |
| 8 | 000977.SZ | IEIT SYSTEMS Co., Ltd. 浪潮信息 | 21.0 | 45.5 | 43.6 | -70.1 | 7 | 0.8836 | 1 soft; px +18% |
| 9 | 600176.SS | China Jushi Co.,Ltd 中国巨石 | 21.0 | 45.3 | 33.7 | -70.1 | 7 | 0.784 | Sina +11%; px +11% |
| 10 | 600703.SS | Sanan Optoelectronics Co.,Ltd 三安光电 | 20.9 | 44.8 | 39.4 | -78.5 | 7 | 0.5913 | resume jump 2008-07-08:+207.5%; 3 soft; px +20% |
| 11 | 600276.SS | JIANGSU HENGRUI PHARMACEUTICAL 恒瑞医药 | 20.8 | 43.6 | 41.2 | -71.0 | 5 | 0.8915 |  |
| 12 | 600111.SS | China Northern Rare Earth (Gro 北方稀土 | 20.5 | 41.4 | 38.4 | -81.4 | 8 | 0.5476 | 2 soft |
| 13 | 000661.SZ | CHANGCHUN HIGH-TECH INDUSTRY ( 长春高新 | 20.3 | 40.2 | 36.0 | -87.0 | 9 | 0.7468 | px +32% |
| 14 | 000596.SZ | ANHUI GUJING DISTILLERY CO.,LT 古井贡酒 | 20.2 | 39.9 | 31.2 | -80.7 | 9 | 0.8338 |  |
| 15 | 600487.SS | Hengtong Optic-Electric Co.,Lt 亨通光电 | 20.0 | 38.1 | 33.0 | -79.4 | 6 | 0.7723 | 2 soft |
| 16 | 600570.SS | Hundsun Technologies Inc. 恒生电子 | 19.8 | 37.1 | 34.0 | -79.9 | 9 | 0.7821 | 3 soft |
| 17 | 600436.SS | ZHANGZHOU PIENTZEHUANG PHARMAC 片仔癀 | 19.3 | 34.2 | 28.1 | -77.1 | 7 | 0.8995 | px +10% |
| 18 | 600353.SS | Chengdu Xuguang Electronics Co 旭光电子 | 19.2 | 33.4 | 30.3 | -78.3 | 9 | 0.7636 | start 2006-10-27; 5 soft |
| 19 | 600522.SS | Jiangsu Zhongtian Technology C 中天科技 | 19.1 | 32.9 | 28.5 | -67.6 | 6 | 0.8427 | 1 soft |
| 20 | 600988.SS | CHIFENG JILONG GOLD MINING GRO 赤峰黄金 | 19.0 | 32.3 | 31.7 | -79.1 | 8 | 0.8635 | Sina -27% |
| 21 | 002028.SZ | Sieyuan Electric Co., Ltd. 思源电气 | 19.0 | 32.2 | 27.0 | -66.8 | 5 | 0.7295 | 1 soft |
| 22 | 600562.SS | GLARUN TECHNOLOGY CO.,LTD 国睿科技 | 18.6 | 30.4 | 27.4 | -73.5 | 7 | 0.6242 | 1 soft |
| 23 | 000988.SZ | HUAGONG TECH COMPANY LIMITED 华工科技 | 18.6 | 30.3 | 28.5 | -72.3 | 6 | 0.8642 | 1 soft; px +13% |
| 24 | 600346.SS | Hengli Petrochemical Co.,Ltd. 恒力石化 | 18.3 | 28.6 | 22.2 | -73.6 | 7 | 0.867 |  |
| 25 | 600674.SS | SICHUAN CHUANTOU ENERGY CO.,LT 川投能源 | 18.1 | 27.6 | 19.3 | -73.4 | 6 | 0.8443 |  |
| 26 | 600066.SS | Yutong Bus Co.,Ltd. 宇通客车 | 18.0 | 27.5 | 11.3 | -76.1 | 5 | 0.7533 | Sina -10% |
| 27 | 600660.SS | Fuyao Glass Industry Group Co. 福耀玻璃 | 17.9 | 26.9 | 13.7 | -80.4 | 6 | 0.8721 | 1 soft; Sina -7% |
| 28 | 600105.SS | Jiangsu Etern Company Limited 永鼎股份 | 17.9 | 26.9 | 22.8 | -80.5 | 9 | 0.5073 | 4 soft |
| 29 | 000703.SZ | HENGYI PETROCHEMICAL CO., LTD 恒逸石化 | 17.4 | 24.7 | 19.2 | -85.7 | 9 | 0.5075 | Sina +6%; px +33% |
| 30 | 000975.SZ | Shanjin International Gold Co. 山金国际 | 17.4 | 24.6 | 19.0 | -83.3 | 7 | 0.8469 | px +48% |
| 31 | 600160.SS | Zhejiang Juhua Co.,Ltd 巨化股份 | 17.3 | 24.4 | 18.3 | -81.2 | 5 | 0.7865 | 3 soft; px +8% |
| 32 | 600801.SS | HUAXIN BUILDING MATERIALS GROU 华新建材 | 17.3 | 24.2 | 15.2 | -77.6 | 9 | 0.7758 |  |
| 33 | 600809.SS | Shanxi Xinghuacun Fen Wine Fac 山西汾酒 | 17.2 | 24.1 | 17.7 | -81.2 | 9 | 0.7969 |  |
| 34 | 600285.SS | HENAN LINGRUI PHARMACEUTICAL C 羚锐制药 | 17.2 | 23.9 | 16.1 | -77.6 | 8 | 0.8479 | corrected(#98) |
| 35 | 000963.SZ | HUADONG MEDICINE CO.,LTD 华东医药 | 17.1 | 23.5 | 18.2 | -64.5 | 6 | 0.8696 | start 2006-11-01 |
| 36 | 000426.SZ | INNER MONGOLIA XINGYE SILVER&T 兴业银锡 | 17.0 | 23.0 | 22.3 | -75.7 | 7 | 0.6078 | 1 soft |
| 37 | 600406.SS | NARI Technology Co., Ltd. 国电南瑞 | 16.9 | 22.4 | 17.2 | -57.6 | 6 | 0.8429 | start 2006-11-03; 1 soft; Sina -15% |
| 38 | 600690.SS | Haier Smart Home Co., Ltd. 海尔智家 | 16.8 | 22.2 | 14.4 | -73.5 | 7 | 0.9126 |  |
| 39 | 002049.SZ | Unigroup Guoxin Microelectroni 紫光国微 | 16.8 | 22.2 | 20.2 | -73.6 | 8 | 0.871 | 1 soft |
| 40 | 000811.SZ | Moon  Environment  Technology  冰轮环境 | 16.6 | 21.7 | 17.6 | -75.6 | 8 | 0.6634 |  |
| 41 | 000887.SZ | ANHUI ZHONGDING SEALING PARTS  中鼎股份 | 16.6 | 21.4 | 17.6 | -80.5 | 8 | 0.587 | resume jump 2006-12-22:+119.3%; 1 soft; Sina +7%; px +48% |
| 42 | 600329.SS | TIANJIN PHARMACEUTICAL DA REN  达仁堂 | 16.2 | 20.1 | 13.9 | -63.4 | 7 | 0.8321 | 1 soft |
| 43 | 600486.SS | Jiangsu Yangnong Chemical Co., 扬农化工 | 16.1 | 19.8 | 16.1 | -66.6 | 8 | 0.8674 | 1 soft |
| 44 | 000739.SZ | Apeloa Pharmaceutical Co.,Ltd. 普洛药业 | 16.1 | 19.7 | 16.3 | -79.5 | 7 | 0.8277 |  |
| 45 | 600763.SS | Topchoice Medical Co.,Inc. 通策医疗 | 16.0 | 19.4 | 18.8 | -88.9 | 9 | 0.7573 | start 2006-11-09 |
| 46 | 600885.SS | Hongfa Technology Co., Ltd. 宏发股份 | 16.0 | 19.3 | 17.1 | -71.7 | 6 | 0.8961 | 1 soft |
| 47 | 600031.SS | SANY HEAVY INDUSTRY CO.,LTD 三一重工 | 15.9 | 19.3 | 14.6 | -74.0 | 10 | 0.6058 | corrected(#52) |
| 48 | 600641.SS | SHANGHAI VITAL DEEPTECH CO., L 先导基电 | 15.9 | 19.2 | 15.0 | -81.8 | 9 | 0.647 |  |
| 49 | 600547.SS | Shandong Gold Mining Co.,Ltd. 山东黄金 | 15.5 | 17.9 | 16.4 | -76.8 | 7 | 0.4773 |  |
| 50 | 002003.SZ | Zhejiang Weixing Industrial De 伟星股份 | 15.5 | 17.8 | 7.9 | -71.2 | 7 | 0.7963 | px +17% |
| 51 | 600113.SS | Zhejiang Dong Ri Limited Compa 浙江东日 | 15.4 | 17.4 | 15.3 | -74.8 | 7 | 0.4797 | px +10% |
| 52 | 600673.SS | Guangdong Hec Technology Holdi 东阳光 | 15.3 | 17.3 | 15.3 | -85.0 | 6 | 0.6418 | 1 soft |
| 53 | 600452.SS | CHONGQING FULING ELECTRIC POWE 涪陵电力 | 15.2 | 16.9 | 14.1 | -72.3 | 7 | 0.8852 |  |
| 54 | 600499.SS | Keda Industrial Group Co., Ltd 科达制造 | 15.1 | 16.7 | 12.8 | -74.5 | 9 | 0.4519 | 1 soft |
| 55 | 600352.SS | ZHEJIANG LONGSHENG GROUP CO.,  浙江龙盛 | 15.1 | 16.6 | 11.2 | -75.0 | 8 | 0.7077 | 3 soft |
| 56 | 002008.SZ | Han’s Laser Technology Industr 大族激光 | 15.0 | 16.4 | 13.7 | -76.3 | 6 | 0.7112 |  |
| 57 | 002032.SZ | ZHE JIANG SUPOR  Co., Ltd. 苏 泊 尔 | 15.0 | 16.4 | 9.8 | -66.8 | 6 | 0.8391 |  |
| 58 | 600206.SS | Grinm Advanced Materials Co.,L 有研新材 | 14.9 | 16.1 | 15.3 | -77.1 | 7 | 0.6281 | 3 soft |
| 59 | 600426.SS | Shandong Hualu-Hengsheng Chemi 华鲁恒升 | 14.9 | 16.1 | 12.4 | -79.2 | 7 | 0.788 |  |
| 60 | 600741.SS | HUAYU Automotive Systems Compa 华域汽车 | 14.9 | 16.0 | 7.9 | -79.8 | 8 | 0.7834 |  |
| 61 | 600845.SS | Shanghai Baosight Software Co. 宝信软件 | 14.8 | 15.9 | 13.0 | -74.0 | 8 | 0.8569 | corrected(#82); 1 soft |
| 62 | 002043.SZ | DEHUA TB NEW DECORATION MATERI 兔 宝 宝 | 14.7 | 15.6 | 9.8 | -69.4 | 6 | 0.8356 |  |
| 63 | 600887.SS | Inner Mongolia Yili Industrial 伊利股份 | 14.6 | 15.3 | 10.1 | -78.6 | 5 | 0.8589 |  |
| 64 | 600309.SS | Wanhua Chemical Group Co.,Ltd. 万华化学 | 14.6 | 15.1 | 9.3 | -81.3 | 8 | 0.8203 |  |
| 65 | 600552.SS | Triumph Science & Technology C 凯盛科技 | 14.5 | 15.0 | 14.1 | -83.1 | 7 | 0.6097 | 4 soft |
| 66 | 000921.SZ | HISENSE HOME APPLIANCES GROUP  海信家电 | 14.4 | 14.8 | 10.6 | -76.5 | 7 | 0.8018 | resume jump 2007-03-29:+94.4%; Sina -4%; px +12% |
| 67 | 600114.SS | NBTM New Materials Group Co.,  东睦股份 | 14.4 | 14.7 | 10.7 | -70.1 | 7 | 0.8066 |  |
| 68 | 600188.SS | YANKUANG ENERGY GROUP COMPANY  兖矿能源 | 14.3 | 14.4 | 5.8 | -83.0 | 7 | 0.387 | Sina +10% |
| 69 | 600378.SS | Haohua Chemical Science & Tech 昊华科技 | 14.2 | 14.1 | 12.6 | -83.5 | 8 | 0.7489 | start 2006-11-09; 4 soft |
| 70 | 600862.SS | Avic Aviation High-Technology  中航高科 | 14.1 | 14.0 | 13.0 | -88.6 | 10 | 0.6699 | px +10% |
| 71 | 600039.SS | SICHUAN ROAD & BRIDGE GROUP CO 四川路桥 | 14.1 | 13.9 | 8.7 | -69.7 | 9 | 0.8436 | 1 soft; Sina -36% |
| 72 | 600060.SS | Hisense Visual Technology Co., 海信视像 | 14.0 | 13.8 | 9.3 | -77.9 | 6 | 0.7265 | 2 soft |
| 73 | 600388.SS | ZIJIN LONGKING CO.,LTD. 紫金龙净 | 14.0 | 13.8 | 9.8 | -72.3 | 9 | 0.692 |  |
| 74 | 600089.SS | TBEA Co.,Ltd. 特变电工 | 14.0 | 13.7 | 9.7 | -71.4 | 10 | 0.5064 | px +10% |
| 75 | 600612.SS | Lao Feng Xiang Co.,Ltd. 老凤祥 | 14.0 | 13.6 | 8.7 | -77.9 | 7 | 0.7976 |  |
| 76 | 600699.SS | Ningbo Joyson Electronic Corp. 均胜电子 | 13.9 | 13.6 | 12.7 | -77.3 | 6 | 0.6464 | 1 soft |
| 77 | 000636.SZ | GUANDDONG FENGHUA ADVANCED TEC 风华高科 | 13.9 | 13.6 | 12.0 | -84.3 | 9 | 0.5441 | start 2006-10-23; 1 soft |
| 78 | 600750.SS | CHINA RESOURCES JIANGZHONG PHA 华润江中 | 13.9 | 13.6 | 7.9 | -67.2 | 8 | 0.6647 |  |
| 79 | 600869.SS | Far East Smarter Energy Co.,Lt 远东股份 | 13.9 | 13.6 | 12.1 | -81.4 | 10 | 0.2602 | 1 soft |
| 80 | 000933.SZ | HENAN SHENHUO COAL & POWER CO. 神火股份 | 13.9 | 13.5 | 9.7 | -83.7 | 7 | 0.1996 | 1 soft |
| 81 | 600256.SS | GUANGHUI ENERGY CO.,LTD 广汇能源 | 13.9 | 13.5 | 8.6 | -80.4 | 11 | 0.2398 | 1 soft; px +10% |
| 82 | 000893.SZ | Asia—Potash International Inve 亚钾国际 | 13.9 | 13.4 | 13.1 | -87.8 | 9 | 0.3758 | 1 soft |
| 83 | 600563.SS | Xiamen Faratronic Co.,Ltd. 法拉电子 | 13.8 | 13.3 | 9.0 | -78.3 | 8 | 0.8656 |  |
| 84 | 002014.SZ | HUANGSHAN NOVEL Co., Ltd. 永新股份 | 13.8 | 13.2 | 6.2 | -77.5 | 7 | 0.837 |  |
| 85 | 600584.SS | JCET Group Co., Ltd. 长电科技 | 13.8 | 13.2 | 12.5 | -75.8 | 8 | 0.8018 | 5 soft; px +8% |
| 86 | 001696.SZ | CHONGQING ZONGSHEN POWER MACHI 宗申动力 | 13.7 | 13.1 | 8.9 | -85.2 | 11 | 0.372 |  |
| 87 | 600559.SS | Hebei Hengshui Laobaigan Liquo 老白干酒 | 13.7 | 13.1 | 10.9 | -81.2 | 10 | 0.7663 | 1 soft |
| 88 | 600079.SS | Humanwell Healthcare (Group) C ST人福 | 13.7 | 13.0 | 11.2 | -73.1 | 9 | 0.6683 |  |
| 89 | 600900.SS | China Yangtze Power Co., Ltd. 长江电力 | 13.6 | 12.9 | 6.6 | -55.6 | 8 | 0.8703 |  |
| 90 | 000915.SZ | SHANDONG WIT DYNE HEALTH CO.,L 华特达因 | 13.6 | 12.8 | 9.1 | -78.0 | 7 | 0.756 |  |
| 91 | 600489.SS | Zhongjin Gold Corp., Ltd 中金黄金 | 13.5 | 12.7 | 10.4 | -84.7 | 8 | 0.1492 | px +8% |
| 92 | 000568.SZ | LUZHOU LAO JIAO CO.,LTD 泸州老窖 | 13.5 | 12.7 | 7.0 | -72.9 | 9 | 0.7411 |  |
| 93 | 600323.SS | Grandblue Environment Co.,Ltd. 瀚蓝环境 | 13.5 | 12.5 | 9.3 | -54.6 | 7 | 0.8925 |  |
| 94 | 600298.SS | Angel Yeast Co.,Ltd 安琪酵母 | 13.4 | 12.4 | 10.2 | -78.8 | 6 | 0.7606 | 1 soft |
| 95 | 002046.SZ | SINOMACH PRECISION INDUSTRY Gr 国机精工 | 13.4 | 12.3 | 11.0 | -73.1 | 7 | 0.5185 | px +20% |
| 96 | 000858.SZ | WULIANGYE YIBIN CO.,LTD. 五 粮 液 | 13.4 | 12.3 | 8.2 | -76.5 | 9 | 0.739 |  |
| 97 | 600516.SS | Fangda Carbon New Material Co. 方大炭素 | 13.2 | 12.0 | 9.9 | -75.5 | 8 | 0.4738 | 1 soft; px +121% |
| 98 | 002064.SZ | Huafon Chemical Co., Ltd. 华峰化学 | 13.2 | 12.0 | 9.7 | -86.4 | 7 | 0.5642 |  |
| 99 | 600301.SS | GUANGXI HUAXI NONFERROUS METAL 华锡有色 | 13.2 | 12.0 | 11.4 | -82.7 | 8 | 0.4184 | 1 soft |
| 100 | 600153.SS | Xiamen C&D Inc. 建发股份 | 13.2 | 12.0 | 5.5 | -75.4 | 8 | 0.6735 | 1 soft; px +5% |

(Source for every row: [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split); full precision and all other metrics in the CSV.)

### Inferences
- The leaders are cyclical or sector re rating stories (appliances, nonferrous metals, liquor, electronics, solar and chemicals), not low volatility compounders; Kweichow Moutai (0.90) and Zhejiang Sanhua (0.93) are the only top five names with an R squared of 0.9 or more.
- Many of the 20 year winners had a 2007 start that benefited from the 2006 to 2007 bull run; start date sensitivity was not run.

### Gaps
- Start date sensitivity (e.g. 2008 or 2013 start) was not computed.

## Benchmarks: CSI 300, Shanghai Composite and Shenzhen Component

### Takeaway
Over the same window the CSI 300 price index returned 2.88x (5.4 percent a year) and its total return version 4.25x (7.5 percent); the Shanghai Composite 2.09x (3.7 percent) and Shenzhen Component 2.65x (5.0 percent), both price indexes without dividends. 380 of 1085 stocks beat the CSI 300 total return index.

### Cited Findings
| Index | Source | Multiple | CAGR % | Max DD % | Peak | Trough | Recovered | 2007-08 | 2015-16 | 2018 | 2021-24 | Neg yrs | Worst yr | R2 | 2026 YTD % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CSI 300 price index (csindex.com.cn) | csindex price | 2.88 | 5.44 | -72.3 | 2007-10-16 | 2008-11-04 | no  | -72.3 | -46.7 | -31.88 | -45.6 | 9 | 2008 (-65.95) | 0.3236 | -10.32 |
| CSI 300 Total Return Index H00300 (csindex.com.cn) | csindex total return | 4.25 | 7.51 | -72.0 | 2007-10-16 | 2008-11-04 | yes 2015-06-05 | -72.04 | -46.06 | -30.35 | -41.56 | 9 | 2008 (-65.61) | 0.5951 | -8.55 |
| Shanghai Composite | Yahoo price | 2.09 | 3.75 | -72.0 | 2007-10-16 | 2008-11-04 | no  | -71.98 | -48.6 | -30.24 | -27.27 | 8 | 2008 (-65.39) | 0.1191 | -5.88 |
| Shenzhen Component | Yahoo price | 2.65 | 5.00 | -71.0 | 2007-10-31 | 2008-11-04 | no  | -70.98 | -49.82 | -38.08 | -50.1 | 8 | 2008 (-63.36) | 0.0431 | -12.74 |

Sources: [csindex.com.cn CSI 300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000300&startDate=20061020&endDate=20261021), [csindex.com.cn CSI 300 TR](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021), [Yahoo 000001.SS](https://query1.finance.yahoo.com/v8/finance/chart/000001.SS?period1=1160006400&interval=1d), [Yahoo 399001.SZ](https://query1.finance.yahoo.com/v8/finance/chart/399001.SZ?period1=1160006400&interval=1d).

- Calendar year returns of the four series are in `/home/user/Sample_R/research_notes/Chinese stock compounders 20 years/ashare_screen_benchmarks.csv` (columns ret_2007 .. ret_2026ytd; all other metrics too). Sanity check: 2007 +96.66 percent (Shanghai Composite), +161.55 percent (CSI 300) and 2008 -65.39 percent (Shanghai Composite) match the widely reported index returns — [Yahoo 000001.SS](https://query1.finance.yahoo.com/v8/finance/chart/000001.SS?period1=1160006400&interval=1d)
- The CSI 300 coverage shows over 100 percent because csindex publishes a few more dates than the Shanghai Composite calendar; this does not affect returns

### Inferences
- The Shanghai Composite and Shenzhen Component series exclude dividends, so they understate market total return by roughly the 2.1 percentage points a year that separate the CSI 300 price and total return CAGRs; for a fair hurdle use the CSI 300 total return CAGR (7.5 percent).
- None of the indexes had regained its October 2007 peak by 2026-10-20 on a price basis except via the CSI 300 total return series (recovered 2015-06-05).

### Gaps
- No total return series for the Shanghai Composite or Shenzhen Component was fetched.

## Data quality: flags, corrections and cross checks

### Takeaway
Yahoo's total return series is sound for most names but has errors in share split handling. Three top 100 names carried errors that were corrected (Henan Lingrui #98 to #34, Shanghai Baosight #82 to #61, Sany Heavy #52 to #47); none was dropped and top 100 membership did not change. An independent reconstruction from raw prices and Sina's adjustment factors agrees with Yahoo within 3 percent for 90 of the top 100; the 10 that differ are listed.

### Cited Findings
**Mechanical flags (rules as specified)**
- Daily adjclose moves above +60 percent or below -50 percent outside the first 5 trading days after listing or a suspension resumption (a resumption = a gap of 3 or more market days between traded bars; the resume bar and the next 5 bars are exempt): 8 eligible stocks flagged before corrections and 5 after (all remaining ones are ranked below 200: 600575.SS #219 2011-06-16:+100.0%; 2011-06-17:-51.1%; 600497.SS #262 2007-04-12:+72.2%; 600595.SS #275 2021-10-08:+93.7%; 600604.SS #616 2009-12-29:+100.0%; 2010-02-03:+100.0%; 000410.SZ #980 2019-12-23:+112.0%). Before correction the only flagged stock ranked inside the top 130 was Henan Lingrui (-51.3 percent on 2007-11-06, a missed 10 for 10 transfer, now corrected); the flags on Bright Meat (600073) and Fangda Group (000055) disappeared when their wrong split factors were corrected. 31 further stocks have extreme moves that are exempt because they follow a suspension (typically 2007 share reform resumptions) — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- One day jump of more than 5 percent in adjclose/close without a dividend or split event within 4 days: 0 stocks (zero) — same source. Note the ratio test cannot see a wrong factor on a real event, which is where the errors were found
- Soft flag (added): daily adjclose move above 11 percent in absolute value outside suspension resumption, where the exchange limit is 10 percent. 603 eligible stocks have at least one. Spot checks show the bulk are caused by missing Yahoo bars (for example 2019-04-29 and 2019-04-30 missing from both the index and most Shanghai stocks, so 2019-05-06 shows a combined three day move) rather than wrong adjustments — [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)

**Independent reconstruction used to find and verify errors**
- Eastmoney's dividend / bonus / transfer history gives ex-dates and ratios (送股 + 转增) to compare with Yahoo split events — [Eastmoney RPT_SHAREBONUS_DET](https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=(SECURITY_CODE%3D%22600519%22)). 38 events across eligible stocks had no matching Yahoo split (15) or a different factor (23); in 33 stocks Yahoo's own ex-date move matched the size of the error (plus Baosight, found separately, see below), giving 34 candidate corrections. Typical cause: plans combining 送股 and 转增 (e.g. 10送2转1) were recorded by Yahoo with only part of the factor, or not at all
- Raw (unadjusted) daily closes from Tencent ([Tencent kline, bfq](https://web.ifzq.gtimg.cn/appstock/app/newfqkline/get?param=sh600519,day,2006-01-01,2026-10-20,640,bfq)) on each stock's start and end date, times the Eastmoney bonus factors, give an independent price only multiple. 912 of 1,079 stocks with data are within 3 percent of Yahoo's price only multiple as downloaded; the rest are mostly rights issues (配股) that Yahoo's `close` includes or excludes inconsistently, plus the split errors above
- Sina Finance publishes cumulative adjustment factors per ex-date including cash dividends, rights issues and share reform consideration shares — [Sina qfq factors](https://finance.sina.com.cn/realstock/company/sh600516/qfq.js). With Tencent raw closes this gives an independent total return multiple = raw_end/raw_start x F(start)/F(end). Fangda Carbon (600516) is a clean example: Sina 12.01x versus Yahoo 12.01x despite a 2.21x resumption day factor that no bonus table shows
- Verification of the corrections: a candidate correction was kept only if it moved Yahoo's total return multiple closer to the Sina reconstruction by more than 1 percentage point. 30 of 34 candidates were kept and after correction 28 of them match Sina within 2 percent (Lingrui +0.17 percent, Sany -0.18, Baosight -1.46); residual gaps remain for 600118.SS China Spacesat Co. (-12.6% residual); 600587.SS Shinva Medical Ins (-23.7% residual) (both outside the top 100; another event in each series is wrong or unadjusted). The other candidates (600028 Sinopec, 600692, 600371, 600853) were rejected because they made agreement worse; for Sinopec Yahoo had applied the 2013 bonus factor on 2013-06-13 instead of 2013-06-19, which leaves the full period multiple right — computed

**Corrections applied (all prices before the ex-date divided by the factor; close and adjclose)**

| Symbol | Name | Ex-date | Divisor | Rank before | Rank after | CAGR before | CAGR after |
|---|---|---|---|---|---|---|---|
| 600285.SS | HENAN LINGRUI PHARMACEUTIC | 2007-11-06 | 2.0000 | 98 | 34 | 13.21 | 17.21 |
| 600031.SS | SANY HEAVY INDUSTRY CO.,LT | 2010-06-24 | 1.1538 | 52 | 47 | 15.12 | 15.94 |
| 600845.SS | Shanghai Baosight Software | 2024-05-06 | 1.2000 | 82 | 61 | 13.81 | 14.85 |
| 002030.SZ | Daan Gene Co., Ltd. | 2010-06-18 | 1.2000 | 157 | 116 | 11.32 | 12.34 |
| 600118.SS | China Spacesat Co.,Ltd. | 2012-05-22 | 1.1818 | 161 | 128 | 11.15 | 12.09 |
| 000559.SZ | WANXIANG QIANCHAO CO.,LTD | 2017-05-11 | 1.2000 | 167 | 130 | 11.05 | 12.06 |
| 600987.SS | Zhejiang Hangmin Co.,Ltd | 2019-05-17 | 1.2083 | 175 | 138 | 10.81 | 11.86 |
| 000848.SZ | CHENGDE LOLO CO.,LTD | 2010-08-06 | 1.6000 | 266 | 150 | 9.09 | 11.69 |
| 600120.SS | ZHEJIANG ORIENT HOLDINGS G | 2020-05-21 | 1.1667 | 202 | 163 | 10.32 | 11.18 |
| 000547.SZ | Addsino Co.，Ltd | 2012-08-03 | 1.0800 | 183 | 169 | 10.63 | 11.05 |
| 000070.SZ | SHENZHEN SDG INFORMATION C | 2017-06-07 | 0.8696 | 141 | 172 | 11.77 | 10.99 |
| 600867.SS | Tonghua Dongbao Pharmaceut | 2014-04-22 | 0.9167 | 164 | 188 | 11.07 | 10.59 |
| 002063.SZ | YGSOFT INC. | 2020-07-10 | 0.9848 | 218 | 221 | 10.06 | 9.98 |
| 002035.SZ | VATTI CORPORATION LIMITED | 2010-05-13 | 1.1818 | 273 | 224 | 8.99 | 9.91 |
| 600587.SS | Shinva Medical Instrument  | 2008-06-24 | 1.3000 | 334 | 239 | 8.18 | 9.60 |
| 600889.SS | NANJING TECHNICAL EQUIPMEN | 2010-06-21 | 1.2000 | 346 | 276 | 7.98 | 8.97 |
| 000983.SZ | Shanxi Coking Coal Energy  | 2010-06-02 | 1.3000 | 399 | 293 | 7.26 | 8.67 |
| 600560.SS | Beijing Aritime Intelligen | 2012-05-16 | 1.1538 | 379 | 324 | 7.51 | 8.28 |
| 000876.SZ | New Hope Liuhe Co., Ltd. | 2010-07-14 | 1.1000 | 449 | 400 | 6.74 | 7.25 |
| 600756.SS | Inspur Software Co.,Ltd. | 2012-05-10 | 1.1538 | 635 | 548 | 4.89 | 5.64 |
| 000969.SZ | ADVANCED TECHNOLOGY & MATE | 2010-04-28 | 1.0588 | 629 | 598 | 4.93 | 5.23 |
| 600731.SS | HUNAN HAILI CHEMICAL INDUS | 2021-05-25 | 0.9848 | 586 | 600 | 5.29 | 5.21 |
| 002055.SZ | ZHENZHEN DEREN ELECTRONIC  | 2009-06-30 | 1.3000 | 815 | 671 | 3.12 | 4.49 |
| 600888.SS | Xinjiang Joinworld Co.,Ltd | 2012-05-25 | 1.0833 | 738 | 691 | 3.86 | 4.27 |
| 000055.SZ | CHINA FANGDA GROUP CO., LT | 2010-04-06 | 0.6294 | 672 | 702 | 4.48 | 4.18 |
| 000055.SZ | CHINA FANGDA GROUP CO., LT | 2017-05-12 | 1.5000 | 672 | 702 | 4.48 | 4.18 |
| 000718.SZ | Suning Universal Co.,Ltd. | 2011-07-05 | 1.0909 | 804 | 755 | 3.24 | 3.69 |
| 000061.SZ | SHENZHEN AGRICULTURAL POWE | 2012-05-10 | 1.1250 | 929 | 871 | 1.87 | 2.47 |
| 600828.SS | Maoye Commercial Co., Ltd | 2010-04-09 | 1.0588 | 922 | 898 | 1.91 | 2.20 |
| 600073.SS | SHANGHAI BRIGHT MEAT GROUP | 2013-06-05 | 0.5500 | 610 | 918 | 5.06 | 1.97 |
| 600818.SS | Zhonglu Co.,Ltd | 2010-04-26 | 1.1000 | 985 | 962 | 0.78 | 1.26 |

- Henan Lingrui (600285): Yahoo missed the 10 for 10 transfer ex 2007-11-06 (Eastmoney, Tencent raw 26.09 to 12.70). Shanghai Baosight (600845): Yahoo applied the 2024-06-12 10 for 2 factor to 2024-05-06..06-11 only and not to earlier history (Yahoo close/raw ratio 0.8333 inside that window, 1.0 before). Sany Heavy (600031): Yahoo used 1.3 for 10送2转3 on 2010-06-24, correct is 1.5 — [Eastmoney bonus table](https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=(SECURITY_CODE%3D%22600519%22)), [Tencent raw](https://web.ifzq.gtimg.cn/appstock/app/newfqkline/get?param=sh600519,day,2006-01-01,2026-10-20,640,bfq), [Sina factors](https://finance.sina.com.cn/realstock/company/sh600516/qfq.js)

**Top 100 data quality verdicts**
- No stock was dropped. Sina agrees (within 3 percent) for 90 of the top 100. Differences of 3 to 10 percent: #26 600066.SS Yutong Bus Co.,Ltd Yahoo 27.5x vs Sina 30.4x; #27 600660.SS Fuyao Glass Indust Yahoo 26.9x vs Sina 29.0x; #29 000703.SZ HENGYI PETROCHEMIC Yahoo 24.7x vs Sina 23.3x; #41 000887.SZ ANHUI ZHONGDING SE Yahoo 21.4x vs Sina 20.0x; #66 000921.SZ HISENSE HOME APPLI Yahoo 14.8x vs Sina 15.5x. Differences above 10 percent: #9 600176.SS China Jushi Co.,Lt Yahoo 45.3x vs Sina 40.8x (CAGR 21.0 vs 20.4); #20 600988.SS CHIFENG JILONG GOL Yahoo 32.3x vs Sina 44.0x (CAGR 19.0 vs 20.8); #37 600406.SS NARI Technology Co Yahoo 22.4x vs Sina 26.3x (CAGR 16.9 vs 17.8); #68 600188.SS YANKUANG ENERGY GR Yahoo 14.4x vs Sina 13.1x (CAGR 14.3 vs 13.7); #71 600039.SS SICHUAN ROAD & BRI Yahoo 13.9x vs Sina 21.7x (CAGR 14.1 vs 16.6) — computed from [Sina factors](https://finance.sina.com.cn/realstock/company/sh600516/qfq.js) and [Tencent raw](https://web.ifzq.gtimg.cn/appstock/app/newfqkline/get?param=sh600519,day,2006-01-01,2026-10-20,640,bfq)
- Causes identified for the larger gaps: rights issues that Yahoo omits (Yutong 2012-02-21 10 for 3 at 14.38 yuan, SDIC Power 2007-09-17 10 for 3 at 6.14 yuan; Sina carries the adjustment, Yahoo does not, so Yahoo understates) — [Eastmoney rights issue table](https://emweb.securities.eastmoney.com/PC_HSF10/BonusFinancing/PageAjax?code=SH600886); share reform resumption factors that only one vendor carries (Chifeng Jilong Gold 2007-04-20 Sina 1.36x, Sichuan Road & Bridge 2007-01-08 Sina 1.60x, NARI 2006-12-18 Sina 1.18x, all after 28 to 46 day suspensions, so unverifiable from price behaviour); Yahoo only split factors that neither Sina nor the Eastmoney bonus table carry (China Jushi 2014-08-20 factor 1.1106, where the raw close fell only 2 percent so the adjustment is not corroborated by price; Hengyi Petrochemical 2006-11-24 factor 1.27 after a 35 day suspension), so Yahoo may overstate those by 6 to 11 percent.
- Direction of error. Yahoo is lower than Sina (Yahoo likely understates) for: #20 CHIFENG JILONG GOLD  19.0 vs 20.8; #26 Yutong Bus Co.,Ltd. 18.0 vs 18.6; #27 Fuyao Glass Industry 17.9 vs 18.3; #37 NARI Technology Co., 16.9 vs 17.8; #66 HISENSE HOME APPLIAN 14.4 vs 14.7; #71 SICHUAN ROAD & BRIDG 14.1 vs 16.6. Yahoo is higher than Sina (Yahoo may overstate) for: #9 China Jushi Co.,Ltd 21.0 vs 20.4; #29 HENGYI PETROCHEMICAL 17.4 vs 17.1; #41 ANHUI ZHONGDING SEAL 16.6 vs 16.2; #68 YANKUANG ENERGY GROU 14.3 vs 13.7. All of them stay in the top 100 under the other vendor's number. For Chifeng Jilong Gold the stockanalysis.com adjusted close gives 76.2x (24.2 percent a year) against Sina 44.0x and Yahoo 32.3x, i.e. three vendors, three answers, all driven by the April 2007 resumption — [stockanalysis.com chart API](https://stockanalysis.com/api/charts/s/sha-600519/MAX/c), [Sina factors](https://finance.sina.com.cn/realstock/company/sh600516/qfq.js)
- `cagr_pct_conservative` (CSV) strips every adjustment that raw prices plus the bonus table do not reproduce, i.e. TR multiple divided by (Yahoo price multiple / independent price multiple). Under that most conservative view 3 top 100 names fall below the cutoff of 12.98 percent: #95 SINOMACH PRECISION IND 13.4 -> 12.4; #97 Fangda Carbon New Mate 13.2 -> 8.8; #100 Xiamen C&D Inc. 13.2 -> 13.0. Fangda Carbon's 2.21x resumption factor (2007-01-24), which the conservative view removes, is carried by Sina and gives the same total return multiple (12.01x), so it is kept in the main ranking

**Top 20 cross check against an independent source** (price only multiple = close_end/close_start; independent = Tencent raw closes times Eastmoney bonus and transfer factors; stockanalysis.com chart API values `c` and `a`; Sina total return multiple)

| Rank | Symbol | Name | Yahoo price x | Raw+bonus price x | Diff % | stockanalysis price x | Diff % | Yahoo TR x | Sina TR x | Diff % | stockanalysis adj x | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 000651.SZ | GREE ELECTRIC APPLIANCES | 31.82 | 31.66 | +0.5 | 31.665 | 0.49 | 73.76 | 72.671 | +1.5 | 73.453 | price confirmed; TR confirmed (Sina) |
| 2 | 000408.SZ | ZANGGE MINING COMPANY LI | 45.49 | 45.49 | +0.0 | gap |  | 57.53 | 57.494 | +0.1 | gap | price confirmed; TR confirmed (Sina) |
| 3 | 600183.SS | Shengyi Technology Co.,L | 30.78 | 30.78 | +0.0 | 30.777 | -0.0 | 52.17 | 51.526 | +1.3 | 51.526 | price confirmed; TR confirmed (Sina) |
| 4 | 600519.SS | Kweichow Moutai Co.,Ltd. | 35.74 | 35.74 | +0.0 | 35.741 | 0.0 | 51.45 | 51.448 | +0.0 | 51.451 | price confirmed; TR confirmed (Sina) |
| 5 | 002050.SZ | ZHEJIANG SANHUA INTELLIG | 37.17 | 37.17 | +0.0 | gap |  | 49.69 | 49.46 | +0.5 | gap | price confirmed; TR confirmed (Sina) |
| 6 | 002001.SZ | Zhejiang NHU Company Ltd | 31.23 | 31.23 | +0.0 | 31.231 | -0.0 | 49.30 | 49.808 | -1.0 | 49.888 | price confirmed; TR confirmed (Sina) |
| 7 | 600760.SS | Avic Shenyang Aircraft C | 44.11 | 44.11 | +0.0 | 44.127 | -0.04 | 46.43 | 46.306 | +0.3 | 46.306 | price confirmed; TR confirmed (Sina) |
| 8 | 000977.SZ | IEIT SYSTEMS Co., Ltd. | 43.58 | 36.80 | +18.4 | 36.805 | 18.41 | 45.53 | 45.543 | -0.0 | 45.543 | price differs: rights/reform adjustment in Yahoo; TR confirmed (Sina); stockanalysis price +18% |
| 9 | 600176.SS | China Jushi Co.,Ltd | 33.72 | 30.36 | +11.1 | 30.377 | 11.01 | 45.34 | 40.828 | +11.1 | 40.829 | price differs: rights/reform adjustment in Yahoo; TR differs from Sina; stockanalysis price +11% |
| 10 | 600703.SS | Sanan Optoelectronics Co | 39.44 | 32.87 | +20.0 | gap |  | 44.83 | 44.819 | +0.0 | gap | price differs: rights/reform adjustment in Yahoo; TR confirmed (Sina) |
| 11 | 600276.SS | JIANGSU HENGRUI PHARMACE | 41.24 | 41.24 | +0.0 | 41.225 | 0.04 | 43.62 | 43.667 | -0.1 | 43.668 | price confirmed; TR confirmed (Sina) |
| 12 | 600111.SS | China Northern Rare Eart | 38.44 | 38.44 | +0.0 | 38.44 | 0.01 | 41.37 | 41.363 | +0.0 | 41.366 | price confirmed; TR confirmed (Sina) |
| 13 | 000661.SZ | CHANGCHUN HIGH-TECH INDU | 36.02 | 27.30 | +32.0 | 31.387 | 14.77 | 40.23 | 40.207 | +0.1 | 40.233 | price differs: rights/reform adjustment in Yahoo; TR confirmed (Sina); stockanalysis price +15% |
| 14 | 000596.SZ | ANHUI GUJING DISTILLERY  | 31.19 | 31.19 | +0.0 | 31.191 | -0.0 | 39.92 | 39.922 | +0.0 | 39.922 | price confirmed; TR confirmed (Sina) |
| 15 | 600487.SS | Hengtong Optic-Electric  | 32.97 | 32.97 | +0.0 | 32.977 | -0.02 | 38.10 | 38.094 | +0.0 | 38.097 | price confirmed; TR confirmed (Sina) |
| 16 | 600570.SS | Hundsun Technologies Inc | 34.03 | 34.03 | +0.0 | 34.032 | -0.0 | 37.08 | 37.053 | +0.1 | 37.059 | price confirmed; TR confirmed (Sina) |
| 17 | 600436.SS | ZHANGZHOU PIENTZEHUANG P | 28.05 | 25.39 | +10.5 | 25.388 | 10.49 | 34.22 | 34.112 | +0.3 | 34.112 | price differs: rights/reform adjustment in Yahoo; TR confirmed (Sina); stockanalysis price +10% |
| 18 | 600353.SS | Chengdu Xuguang Electron | 30.30 | 30.30 | +0.0 | 27.274 | 11.11 | 33.41 | 33.318 | +0.3 | 29.986 | price confirmed; TR confirmed (Sina); stockanalysis price +11% |
| 19 | 600522.SS | Jiangsu Zhongtian Techno | 28.53 | 28.43 | +0.4 | 28.43 | 0.36 | 32.92 | 32.796 | +0.4 | 32.92 | price confirmed; TR confirmed (Sina) |
| 20 | 600988.SS | CHIFENG JILONG GOLD MINI | 31.70 | 31.70 | +0.0 | 74.886 | -57.67 | 32.26 | 43.95 | -26.6 | 76.213 | price confirmed; TR differs from Sina; stockanalysis price -58% |

Sources: [Tencent raw](https://web.ifzq.gtimg.cn/appstock/app/newfqkline/get?param=sh600519,day,2006-01-01,2026-10-20,640,bfq), [Eastmoney bonus](https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=(SECURITY_CODE%3D%22600519%22)), [stockanalysis.com chart API](https://stockanalysis.com/api/charts/s/sha-600519/MAX/c), [Sina factors](https://finance.sina.com.cn/realstock/company/sh600516/qfq.js).

- Result for the top 20: 15 of 20 price only multiples are confirmed within 3 percent by raw prices plus the bonus table; the exceptions are #8 IEIT SYSTEMS Co.,  (+18.4%); #9 China Jushi Co.,Lt (+11.1%); #10 Sanan Optoelectron (+20.0%); #13 CHANGCHUN HIGH-TEC (+32.0%); #17 ZHANGZHOU PIENTZEH (+10.5%) (Yahoo's `close` there carries a rights issue or reform adjustment that raw prices plus bonus shares do not reproduce). 18 of 20 total return multiples are confirmed within 3 percent by Sina; the exceptions are #9 China Jushi Co.,Lt (+11.1%); #20 CHIFENG JILONG GOL (-26.6%). No top 20 ranking rests on a data error: all stay in the top 100 under either number. stockanalysis.com returns no bar within 7 days of the start date for Zangge, Sanan, Sanhua and Hengli (marked gap) — computed
- The stockanalysis.com pages for the brief's suggested cross check use the paths /quote/sha/<code>/ and /quote/she/<code>/ (the paths /quote/shse/ and /quote/szse/ return 404); its chart API returns daily history back to 2002 — [stockanalysis.com SSE list](https://stockanalysis.com/list/shanghai-stock-exchange/) , [chart API](https://stockanalysis.com/api/charts/s/sha-600519/MAX/c)
- Official announcements (cninfo.com.cn, sse.com.cn) were not retrieved for the unverifiable 2006 to 2008 share reform factors; they remain flagged rather than resolved.

### Inferences
- Yahoo adjclose for A shares is reliable for cash dividends and ordinary bonus shares, less reliable where a plan mixes 送股 and 转增, for rights issues, and around 2006 to 2008 share reform resumptions.
- Because the top 100 membership is identical under the Yahoo corrected and Sina rankings except for two names at the cutoff, the headline list is robust; individual CAGRs of the flagged names carry a few percentage points of uncertainty.

### Gaps
- Share reform consideration factors for Chifeng Jilong Gold, Sichuan Road & Bridge, NARI, Zhongding, Shanjin International, Hengyi Petrochemical and Fangda Carbon could not be checked against company announcements.
- Ranks below 130 were checked only against Eastmoney bonus events and Sina totals; 6 stocks had no Sina or raw price comparison (marked in the CSV).

## Consistency screen: strong compounders with shallow drawdowns

### Takeaway
**No stock compounded at 12 percent or more with a maximum drawdown shallower than -30 percent; none had a drawdown shallower than -50 percent; none had 4 or fewer negative calendar years with R squared of 0.85 or more.** Of the 132 stocks at 12 percent or more, the shallowest drawdown is -54.65 percent and the fewest negative years is 5.

### Cited Findings
- (a) CAGR at or above 12 percent and whole window maximum drawdown shallower than -50 percent: **0 stocks**. Closest: Grandblue Environment  (600323.SS) CAGR 13.5, max DD -54.6; China Yangtze Power Co (600900.SS) CAGR 13.6, max DD -55.6; YUNNAN BAIYAO GROUP CO (000538.SZ) CAGR 12.6, max DD -56.1; NARI Technology Co., L (600406.SS) CAGR 16.9, max DD -57.6 — computed from [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split)
- Independent drawdown check: using Tencent raw closes divided by Sina cumulative factors, maximum drawdowns of the 129 stocks with CAGR of 12 percent or more that were covered differ from Yahoo's by under 5 percentage points in every case; the shallowest independent figure is 54.65 percent, so conclusions (a) and (d) hold on either data set — [Sina factors](https://finance.sina.com.cn/realstock/company/sh600516/qfq.js), [Tencent raw](https://web.ifzq.gtimg.cn/appstock/app/newfqkline/get?param=sh600519,day,2006-01-01,2026-10-20,640,bfq)
- (b) CAGR at or above 12 percent, 4 or fewer negative calendar years 2007 to 2025 and R squared at or above 0.85: **0 stocks**. Zero of the 132 had 4 or fewer negative years (the distribution of negative years among them: 5: 6, 6: 26, 7: 37, 8: 26, 9: 28, 10: 7, 11: 2). Relaxing the negative year cap to 5 gives 6 stocks, of which only Hengrui (R squared 0.8915) and Yili (0.8589) also clear R squared 0.85 — computed

  Stocks at 12 percent or more with R squared at or above 0.85 (23), for reference:

  | Rank | Symbol | Name | CAGR % | Max DD % | Neg yrs | Worst yr | R2 |
  |---|---|---|---|---|---|---|---|
  | 1 | 000651.SZ | GREE ELECTRIC APPLIANCES,I | 24.0 | -65.0 | 8 | 2008 (-40.41) | 0.8865 |
  | 4 | 600519.SS | Kweichow Moutai Co.,Ltd. | 21.8 | -62.5 | 6 | 2008 (-52.47) | 0.9022 |
  | 5 | 002050.SZ | ZHEJIANG SANHUA INTELLIGEN | 21.6 | -74.7 | 6 | 2008 (-58.79) | 0.9319 |
  | 6 | 002001.SZ | Zhejiang NHU Company Ltd. | 21.5 | -68.9 | 6 | 2018 (-31.63) | 0.8603 |
  | 7 | 600760.SS | Avic Shenyang Aircraft Com | 21.2 | -73.5 | 6 | 2008 (-48.86) | 0.8804 |
  | 8 | 000977.SZ | IEIT SYSTEMS Co., Ltd. | 21.0 | -70.1 | 7 | 2008 (-49.06) | 0.8836 |
  | 11 | 600276.SS | JIANGSU HENGRUI PHARMACEUT | 20.8 | -71.0 | 5 | 2021 (-45.27) | 0.8915 |
  | 17 | 600436.SS | ZHANGZHOU PIENTZEHUANG PHA | 19.3 | -77.1 | 7 | 2008 (-49.17) | 0.8995 |
  | 20 | 600988.SS | CHIFENG JILONG GOLD MINING | 19.0 | -79.1 | 8 | 2008 (-62.69) | 0.8635 |
  | 23 | 000988.SZ | HUAGONG TECH COMPANY LIMIT | 18.6 | -72.3 | 6 | 2008 (-55.03) | 0.8642 |
  | 24 | 600346.SS | Hengli Petrochemical Co.,L | 18.3 | -73.6 | 7 | 2008 (-61.31) | 0.867 |
  | 27 | 600660.SS | Fuyao Glass Industry Group | 17.9 | -80.4 | 6 | 2008 (-77.91) | 0.8721 |
  | 35 | 000963.SZ | HUADONG MEDICINE CO.,LTD | 17.1 | -64.5 | 6 | 2008 (-34.73) | 0.8696 |
  | 38 | 600690.SS | Haier Smart Home Co., Ltd. | 16.8 | -73.5 | 7 | 2008 (-59.06) | 0.9126 |
  | 39 | 002049.SZ | Unigroup Guoxin Microelect | 16.8 | -73.6 | 8 | 2008 (-53.84) | 0.871 |
  | 43 | 600486.SS | Jiangsu Yangnong Chemical  | 16.1 | -66.6 | 8 | 2011 (-42.4) | 0.8674 |
  | 46 | 600885.SS | Hongfa Technology Co., Ltd | 16.0 | -71.7 | 6 | 2022 (-36.66) | 0.8961 |
  | 53 | 600452.SS | CHONGQING FULING ELECTRIC  | 15.2 | -72.3 | 7 | 2008 (-56.73) | 0.8852 |
  | 61 | 600845.SS | Shanghai Baosight Software | 14.8 | -74.0 | 8 | 2008 (-54.69) | 0.8569 |
  | 63 | 600887.SS | Inner Mongolia Yili Indust | 14.6 | -78.6 | 5 | 2008 (-67.27) | 0.8589 |
  | 83 | 600563.SS | Xiamen Faratronic Co.,Ltd. | 13.8 | -78.3 | 8 | 2008 (-73.23) | 0.8656 |
  | 89 | 600900.SS | China Yangtze Power Co., L | 13.6 | -55.6 | 8 | 2008 (-24.85) | 0.8703 |
  | 93 | 600323.SS | Grandblue Environment Co., | 13.5 | -54.6 | 7 | 2011 (-37.79) | 0.8925 |

- (c) Top 30 by composite (CAGR divided by absolute maximum drawdown) among stocks at or above 12 percent CAGR, all metrics (stress windows are the stock's own peak to trough inside the window; `gap` = traded on under 60 percent of the window):

| # | CAGR rank | Symbol | Name | CAGR % | Max DD % | Peak | Trough | Regained | 2007-08 | 2015-16 | 2018 | 2021-24 | Neg yrs | Worst yr | R2 | Composite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 000651.SZ | GREE ELECTRIC APPLIANCES | 24.0 | -65.0 | 2008-02-19 | 2008-10-29 | 2009-10-28 | -65.03 | -48.96 | -37.84 | -49.3 | 8 | 2008 (-40.41) | 0.8865 | 0.3689 |
| 2 | 4 | 600519.SS | Kweichow Moutai Co.,Ltd. | 21.8 | -62.5 | 2007-12-28 | 2008-11-07 | 2011-07-21 | -62.49 | -30.04 | -33.5 | -47.48 | 6 | 2008 (-52.47) | 0.9022 | 0.3485 |
| 3 | 6 | 002001.SZ | Zhejiang NHU Company Ltd | 21.5 | -68.9 | 2008-05-13 | 2008-11-06 | 2010-10-26 | -68.92 | -54.85 | -48.1 | -49.18 | 6 | 2018 (-31.63) | 0.8603 | 0.3122 |
| 4 | 8 | 000977.SZ | IEIT SYSTEMS Co., Ltd. | 21.0 | -70.1 | 2007-05-29 | 2008-11-04 | 2010-01-12 | -67.58 | -63.1 | -44.74 | -57.61 | 7 | 2008 (-49.06) | 0.8836 | 0.3002 |
| 5 | 9 | 600176.SS | China Jushi Co.,Ltd | 21.0 | -70.1 | 2008-03-04 | 2012-09-26 | 2015-03-16 | -67.98 | -49.62 | -40.22 | -61.07 | 7 | 2008 (-53.19) | 0.784 | 0.2999 |
| 6 | 11 | 600276.SS | JIANGSU HENGRUI PHARMACE | 20.8 | -71.0 | 2020-12-25 | 2022-04-26 | no | -38.94 | -25.42 | -39.22 | -70.98 | 5 | 2021 (-45.27) | 0.8915 | 0.2927 |
| 7 | 37 | 600406.SS | NARI Technology Co., Ltd | 16.9 | -57.6 | 2015-06-03 | 2016-01-28 | 2020-12-28 | -55.61 | -57.6 | -19.97 | -43.09 | 6 | 2008 (-34.19) | 0.8429 | 0.2926 |
| 8 | 5 | 002050.SZ | ZHEJIANG SANHUA INTELLIG | 21.6 | -74.7 | 2008-01-02 | 2008-10-27 | 2010-09-28 | -74.65 | -66.93 | -48.29 | -51.25 | 6 | 2008 (-58.79) | 0.9319 | 0.2889 |
| 9 | 7 | 600760.SS | Avic Shenyang Aircraft C | 21.2 | -73.5 | 2011-03-14 | 2014-01-13 | 2015-05-12 | -71.89 | -67.41 | -42.1 | -46.91 | 6 | 2008 (-48.86) | 0.8804 | 0.2877 |
| 10 | 21 | 002028.SZ | Sieyuan Electric Co., Lt | 19.0 | -66.8 | 2010-04-21 | 2012-01-16 | 2015-06-02 | -58.31 | -60.32 | -50.27 | -56.17 | 5 | 2011 (-50.69) | 0.7295 | 0.284 |
| 11 | 19 | 600522.SS | Jiangsu Zhongtian Techno | 19.1 | -67.6 | 2008-01-18 | 2008-11-04 | 2009-04-20 | -67.56 | -57.33 | -50.12 | -59.85 | 6 | 2011 (-47.79) | 0.8427 | 0.2825 |
| 12 | 3 | 600183.SS | Shengyi Technology Co.,L | 21.9 | -77.9 | 2007-05-29 | 2008-11-04 | 2015-05-14 | -77.04 | -55.86 | -33.2 | -55.86 | 6 | 2008 (-70.37) | 0.7936 | 0.2808 |
| 13 | 10 | 600703.SS | Sanan Optoelectronics Co | 20.9 | -78.5 | 2021-08-04 | 2024-09-18 | no | gap | -46.69 | -57.81 | -78.55 | 7 | 2018 (-54.9) | 0.5913 | 0.2666 |
| 14 | 35 | 000963.SZ | HUADONG MEDICINE CO.,LTD | 17.1 | -64.5 | 2007-08-06 | 2008-11-04 | 2009-11-16 | -63.8 | -25.83 | -49.28 | -48.14 | 6 | 2008 (-34.73) | 0.8696 | 0.2653 |
| 15 | 23 | 000988.SZ | HUAGONG TECH COMPANY LIM | 18.6 | -72.3 | 2008-03-05 | 2008-11-04 | 2009-12-28 | -72.32 | -62.73 | -42.1 | -52.78 | 6 | 2008 (-55.03) | 0.8642 | 0.257 |
| 16 | 42 | 600329.SS | TIANJIN PHARMACEUTICAL D | 16.2 | -63.4 | 2008-01-17 | 2008-10-17 | 2009-05-06 | -63.37 | -54.91 | -43.3 | -54.14 | 7 | 2011 (-34.69) | 0.8321 | 0.2554 |
| 17 | 22 | 600562.SS | GLARUN TECHNOLOGY CO.,LT | 18.6 | -73.5 | 2007-09-10 | 2008-11-04 | 2009-06-01 | -72.04 | -55.43 | -46.75 | -45.47 | 7 | 2008 (-59.14) | 0.6242 | 0.2533 |
| 18 | 15 | 600487.SS | Hengtong Optic-Electric  | 20.0 | -79.4 | 2008-02-21 | 2008-10-27 | 2009-11-09 | -79.38 | -47.96 | -47.32 | -49.01 | 6 | 2011 (-59.78) | 0.7723 | 0.2515 |
| 19 | 12 | 600111.SS | China Northern Rare Eart | 20.5 | -81.4 | 2007-10-15 | 2008-11-04 | 2009-09-24 | -81.37 | -57.06 | -42.57 | -73.57 | 8 | 2008 (-71.16) | 0.5476 | 0.2514 |
| 20 | 14 | 000596.SZ | ANHUI GUJING DISTILLERY  | 20.2 | -80.7 | 2007-07-10 | 2008-10-16 | 2009-11-26 | -77.81 | -44.84 | -46.4 | -52.09 | 9 | 2008 (-66.01) | 0.8338 | 0.2507 |
| 21 | 17 | 600436.SS | ZHANGZHOU PIENTZEHUANG P | 19.3 | -77.1 | 2021-07-21 | 2026-06-26 | no | -62.4 | -54.36 | -44.67 | -61.2 | 7 | 2008 (-49.17) | 0.8995 | 0.2507 |
| 22 | 2 | 000408.SZ | ZANGGE MINING COMPANY LI | 22.5 | -89.8 | 2015-06-18 | 2020-05-12 | 2021-12-14 | gap | -70.28 | -44.28 | -46.02 | 7 | 2011 (-41.85) | 0.7024 | 0.2502 |
| 23 | 24 | 600346.SS | Hengli Petrochemical Co. | 18.3 | -73.6 | 2021-02-18 | 2024-02-05 | no | -72.82 | gap | -27.16 | -73.63 | 7 | 2008 (-61.31) | 0.867 | 0.2479 |
| 24 | 16 | 600570.SS | Hundsun Technologies Inc | 19.8 | -79.9 | 2015-06-11 | 2016-02-29 | 2020-06-23 | -68.5 | -79.91 | -32.58 | -74.17 | 9 | 2008 (-51.18) | 0.7821 | 0.2478 |
| 25 | 93 | 600323.SS | Grandblue Environment Co | 13.5 | -54.6 | 2015-06-08 | 2015-07-08 | 2020-06-01 | -46.38 | -54.65 | -31.05 | -45.05 | 7 | 2011 (-37.79) | 0.8925 | 0.2462 |
| 26 | 25 | 600674.SS | SICHUAN CHUANTOU ENERGY  | 18.1 | -73.4 | 2008-03-03 | 2008-10-29 | 2014-09-26 | -73.41 | -51.92 | -23.52 | -28.26 | 6 | 2008 (-40.95) | 0.8443 | 0.2459 |
| 27 | 89 | 600900.SS | China Yangtze Power Co., | 13.6 | -55.6 | 2007-10-16 | 2011-09-06 | 2015-04-16 | gap | gap | -16.39 | -17.54 | 8 | 2008 (-24.85) | 0.8703 | 0.2454 |
| 28 | 18 | 600353.SS | Chengdu Xuguang Electron | 19.2 | -78.3 | 2015-06-11 | 2018-10-18 | 2025-06-10 | -67.5 | -66.1 | -49.91 | -55.27 | 9 | 2008 (-56.9) | 0.7636 | 0.2451 |
| 29 | 43 | 600486.SS | Jiangsu Yangnong Chemica | 16.1 | -66.6 | 2008-02-21 | 2008-11-07 | 2010-01-19 | -66.62 | -53.26 | -43.76 | -62.49 | 8 | 2011 (-42.4) | 0.8674 | 0.2417 |
| 30 | 20 | 600988.SS | CHIFENG JILONG GOLD MINI | 19.0 | -79.1 | 2007-09-05 | 2008-10-29 | 2010-03-02 | -75.08 | gap | -46.88 | -48.31 | 8 | 2008 (-62.69) | 0.8635 | 0.2397 |

Source for all rows: [Yahoo chart API](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1160006400&interval=1d&events=div,split), computed by `compute_metrics.py` and `screen.py`; calendar year returns for each stock are in the CSV columns ret_2007 to ret_2025.

- (d) Stocks compounding at 12 percent or more with maximum drawdown shallower than -30 percent: **0**. Even in the individual stress windows the shallowest own drawdown among the 132 stocks is 2007-08: -38.9 (JIANGSU HENGRUI PH); 2015-16: -25.4 (JIANGSU HENGRUI PH); 2018: -12.4 (SDIC POWER HOLDING); 2021-24: -17.5 (China Yangtze Powe), and every one of the 132 had a whole window drawdown of 54.6 percent or deeper — computed
- For scale, the CSI 300 total return index itself had a whole window maximum drawdown of -72.0 percent and 9 negative calendar years — [csindex total return](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061020&endDate=20261021)
- Drawdown recovery: 112 of the 132 stocks at 12 percent or more have regained the pre drawdown peak by 2026-10-20 — computed
- Sina based sensitivity: 133 stocks reach 12 percent on the Sina total return reconstruction versus 132 on Yahoo; screens (a) (b) (d) are empty on both because they are driven by drawdown and negative year counts, which the adjustment differences barely move — computed

### Inferences
- Over a window that includes 2008 (about -65 percent for the market), 2015 to 2016, 2018 and 2021 to 2024, no A share survivor produced a 12 percent compounding record with a smooth path; the best the screen finds are Kweichow Moutai (21.8 percent CAGR, -62.5 percent maximum drawdown, R squared 0.90, 6 negative years), Zhejiang Sanhua and Haier Smart Home on R squared, and Jiangsu Hengrui and Inner Mongolia Yili on negative year count.
- The report should present consistency as a relative ranking (composite, R squared, negative years) and state that absolute thresholds of -30 percent or -50 percent drawdown are met by no stock in the universe.

### Gaps
- Stress window drawdowns are `gap` for 21 of the 132 stocks at 12 percent or more because they traded on under 60 percent of at least one window (for example Zangge Mining and Sanan Optoelectronics in 2007 to 2008, Hengli Petrochemical in 2015 to 2016).
- Dividend taxes and rights issue subscription costs are not modelled; adjclose reinvests pre tax cash dividends at the ex-date close.

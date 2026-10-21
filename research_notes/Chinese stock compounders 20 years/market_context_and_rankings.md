# Market context and published rankings: Chinese equities, October 2006 to October 2026

Method note for the report writer. Data pulled by curl on 2026-10-21 and treated as untrusted data; raw files are under /tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/cn20/downloads_context/. Index levels below are computed from four machine readable feeds: csindex.com.cn (SSE Composite, CSI 300, CSI 300 Total Return, CSI 500 TR, CSI Dividend TR; data to 2026-10-20), MSCI's own index level API (MSCI China, World, USA, EM; to 2026-10-20), Yahoo Finance chart API (Hang Seng, HSCEI, S&P 500, S&P 500 TR; last observation 2026-10-14), and World Bank API (GDP). "Close" means daily closing level; "intraday" is flagged. Where a figure comes only from a web search snippet (not an opened page) it is marked [snippet only]. "Gap" means not found. Nothing is estimated.

Source key for computed numbers:
- csindex: [CSI 300 daily](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000300&startDate=20061001&endDate=20261020), [CSI 300 TR (H00300)](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=H00300&startDate=20061001&endDate=20261020), [SSE Composite (000001)](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000001&startDate=20061001&endDate=20261020)
- MSCI API: [MSCI China, code 302400, net TR](https://app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph?currency_symbol=USD&index_variant=NETR&start_date=20061001&end_date=20261021&data_frequency=DAILY&baseValue=false&index_codes=302400). Same URL with index_variant=STRD for price, index_codes=990100 (World), 984000 (USA), 891800 (EM).
- Yahoo: [^HSI](https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI?period1=1159660800&period2=1792000000&interval=1d), [^HSCE](https://query1.finance.yahoo.com/v8/finance/chart/%5EHSCE?period1=1159660800&period2=1792000000&interval=1d), [^GSPC](https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?period1=1159660800&period2=1792000000&interval=1d), [^SP500TR](https://query1.finance.yahoo.com/v8/finance/chart/%5ESP500TR?period1=1159660800&period2=1792000000&interval=1d)

## 1. The selloffs: dates, peak to trough falls, causes, and what 2024 to 2026 did

### Takeaway
Four full cycle drawdowns of 30 to 76 percent each, with a fifth (post stimulus) retracement of 12 to 25 percent already under way in 2026. The 2007 to 2008 collapse (about minus 72 percent for A share indices, minus 74 percent for MSCI China) was the deepest; the 2021 to 2022 fall was the deepest for the offshore listed names (MSCI China minus 64 percent, HSCEI minus 60 percent). Almost every cycle started with a leverage or regulatory trigger, not a collapse in GDP.

### Cited Findings
Closing level peak to trough (computed). Intraday extremes in the next table.

| Episode | Index | Peak (close) | Trough (close) | Fall |
|---|---|---|---|---|
| 2007 to 2008 | SSE Composite | 6,092.06 on 2007-10-16 | 1,706.70 on 2008-11-04 | minus 72.0% |
| | CSI 300 | 5,877.20 on 2007-10-16 | 1,627.76 on 2008-11-04 | minus 72.3% |
| | Hang Seng | 31,638.22 on 2007-10-30 | 11,015.84 on 2008-10-27 | minus 65.2% |
| | HSCEI | 20,400.07 on 2007-10-30 | 4,990.08 on 2008-10-27 | minus 75.5% |
| | MSCI China price (USD) | 104.06 on 2007-10-30 | 27.20 on 2008-10-27 | minus 73.9% (net TR minus 73.3%; MSCI's own factsheet gives max drawdown 73.30% for 2007-10-30 to 2008-10-27) |
| | S&P 500 (reference) | 1,565.15 on 2007-10-09 | 752.44 on 2008-11-20 | minus 51.9% |
| 2015 to 2016 | SSE Composite | 5,166.35 on 2015-06-12 | 2,655.66 on 2016-01-28 | minus 48.6% |
| | CSI 300 | 5,353.75 on 2015-06-08 | 2,853.76 on 2016-01-28 | minus 46.7% |
| | Hang Seng | 28,442.75 on 2015-04-28 | 18,319.58 on 2016-02-12 | minus 35.6% |
| | HSCEI | 14,801.94 on 2015-05-26 | 7,505.37 on 2016-02-12 | minus 49.3% |
| | MSCI China price | 84.94 on 2015-04-27 | 47.87 on 2016-02-12 | minus 43.6% |
| | S&P 500 | 2,130.82 on 2015-05-21 | 1,829.08 on 2016-02-11 | minus 14.2% |
| 2018 | SSE Composite | 3,559.47 on 2018-01-24 | 2,464.36 on 2019-01-03 | minus 30.8% |
| | CSI 300 | 4,389.89 on 2018-01-24 | 2,964.84 on 2019-01-03 | minus 32.5% |
| | Hang Seng | 33,154.12 on 2018-01-26 | 24,585.53 on 2018-10-30 | minus 25.8% |
| | HSCEI | 13,723.96 on 2018-01-26 | 9,833.69 on 2019-01-02 | minus 28.3% |
| | MSCI China price | 101.30 on 2018-01-26 | 67.76 on 2018-10-30 | minus 33.1% |
| | S&P 500 | 2,872.87 on 2018-01-26 | 2,351.10 on 2018-12-24 | minus 18.2% |
| 2021 to 2024 | SSE Composite | 3,696.17 on 2021-02-19 | 2,702.19 on 2024-02-05 | minus 26.9% |
| | CSI 300 | 5,807.72 on 2021-02-10 | 3,159.25 on 2024-09-13 | minus 45.6% |
| | Hang Seng | 31,084.94 on 2021-02-17 | 14,687.02 on 2022-10-31 | minus 52.8% |
| | HSCEI | 12,228.63 on 2021-02-17 | 4,938.56 on 2022-10-31 | minus 59.6% |
| | MSCI China price | 129.60 on 2021-02-17 | 46.92 on 2022-10-31 | minus 63.8% (net TR minus 62.5%) |
| | S&P 500 | 3,934.83 on 2021-02-12 | 3,577.03 on 2022-10-12 | minus 9.1% |

Sources: csindex, MSCI API and Yahoo links above (computed). CSI 300 made successive lower closing lows in this cycle (3,508.70 on 2022-10-31, 3,179.63 on 2024-02-02, 3,159.25 on 2024-09-13); the table gives the lowest. SSE Composite closing lows were 2,886.43 on 2022-04-26 and 2,702.19 on 2024-02-05.

Intraday extremes (csindex high/low fields), useful because the press quotes them:
- SSE Composite: high 6,124.04 on 2007-10-16; low 1,664.93 on 2008-10-28 (intraday); high 5,178.19 on 2015-06-12; low 2,638.30 on 2016-01-27; high 3,587.03 on 2018-01-29; low 2,440.91 on 2019-01-04; high 3,731.69 on 2021-02-18; low 2,635.09 on 2024-02-05. [csindex SSE](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000001&startDate=20061001&endDate=20261020)
- CSI 300: high 5,891.72 on 2007-10-17; low 1,606.73 on 2008-11-04; high 5,380.43 on 2015-06-09; low 2,821.21 on 2016-02-29; high 4,403.34 on 2018-01-26; low 2,935.83 on 2019-01-04; high 5,930.91 on 2021-02-18; low 3,108.35 on 2024-02-02 and 3,145.79 on 2024-09-18. [csindex CSI 300](https://www.csindex.com.cn/csindex-home/perf/index-perf?indexCode=000300&startDate=20061001&endDate=20261020) (This confirms the 5,380 and 1,606 figures in the brief as intraday values.)
- Press corroboration of SSE intraday points: 998.23 on 2005-06-06 as the starting bottom, 6,124.04 on 2007-10-16, 1,664.93 on 2008-10-28 (minus 73 percent), 3,478.01 on 2009-08-04, 5,178 on 2015-06-12 (52 days, minus 43.43 percent), 2,850.71 on 2015-08-26. — [中国证券网/信息时报, 2016-02-01](https://www.cs.com.cn/ssgs/gsxw/201602/t20160201_4897411.html). That article says the 2016-01-28 close was 2,737.60; csindex shows 2,655.66 for 2016-01-28 (2,737.60 is the 2016-01-29 close; the article appears to have mislabelled the date, and the article itself also lists a 2.92 percent fall on 28 January). Use the csindex figure.
- MSCI's own risk table (factsheet dated Sep 30, 2026): MSCI China maximum drawdown 73.30 percent (2007-10-30 to 2008-10-27), versus 65.25 percent for MSCI EM and 58.38 percent for MSCI ACWI. — [MSCI China factsheet](https://www.msci.com/documents/10199/255599/msci-china-index-usd-net.pdf)

Calendar year total returns, computed (percent; CSI 300 TR and MSCI China net in USD; S&P 500 TR). Source: csindex, MSCI API, Yahoo:
| Year | SSE price | CSI 300 TR | Hang Seng price | MSCI China net | S&P 500 TR |
|---|---|---|---|---|---|
| 2006 (partial: 2006-10-09 to year end, all series) | 49.9 | 42.2 | 13.0 | 36.0 | 5.5 |
| 2007 | 96.7 | 163.3 | 39.3 | 66.2 | 5.5 |
| 2008 | minus 65.4 | minus 65.6 | minus 48.3 | minus 50.8 | minus 37.0 |
| 2009 | 80.0 | 98.6 | 52.0 | 62.3 | 26.5 |
| 2010 | minus 14.3 | minus 11.6 | 5.3 | 4.6 | 15.1 |
| 2011 | minus 21.7 | minus 24.0 | minus 20.0 | minus 18.4 | 2.1 |
| 2012 | 3.2 | 9.8 | 22.9 | 22.7 | 16.0 |
| 2013 | minus 6.7 | minus 5.3 | 2.9 | 3.6 | 32.4 |
| 2014 | 52.9 | 55.8 | 1.3 | 8.0 | 13.7 |
| 2015 | 9.4 | 7.2 | minus 7.2 | minus 7.8 | 1.4 |
| 2016 | minus 12.3 | minus 9.3 | 0.4 | 0.9 | 12.0 |
| 2017 | 6.6 | 24.3 | 36.0 | 54.1 | 21.8 |
| 2018 | minus 24.6 | minus 23.6 | minus 13.6 | minus 18.9 | minus 4.4 |
| 2019 | 22.3 | 39.2 | 9.1 | 23.5 | 31.5 |
| 2020 | 13.9 | 29.9 | minus 3.4 | 29.5 | 18.4 |
| 2021 | 4.8 | minus 3.5 | minus 14.1 | minus 21.7 | 28.7 |
| 2022 | minus 15.1 | minus 19.8 | minus 15.5 | minus 21.9 | minus 18.1 |
| 2023 | minus 3.7 | minus 9.1 | minus 13.8 | minus 11.2 | 26.3 |
| 2024 | 12.7 | 18.2 | 17.7 | 19.4 | 25.0 |
| 2025 | 18.4 | 21.0 | 27.8 | 31.2 | 17.9 |
| 2026 YTD (to 10-14/10-20) | minus 5.9 | minus 8.5 | minus 5.1 | minus 14.9 | 13.8 |
Cross check: MSCI's factsheet annual returns for MSCI China: 2025 31.17, 2024 19.42, 2023 minus 11.20, 2022 minus 21.93, 2021 minus 21.72, 2020 29.49, 2019 23.46, 2018 minus 18.88, 2017 54.07, 2016 0.90, 2015 minus 7.82 (matches the computed column). — [MSCI China factsheet](https://www.msci.com/documents/10199/255599/msci-china-index-usd-net.pdf)

Causes, by episode:
- 2007 to 2008: Wikipedia records an earlier 27 Feb 2007 shock (Shanghai down 9 percent in one day, DJIA down 416 points, S&P 500 down 3.47 percent) before the October 2007 peak. — [Wikipedia, Chinese stock bubble of 2007](https://en.wikipedia.org/wiki/Chinese_stock_bubble_of_2007). The 2016 press retrospective attributes the 2007 to 2008 collapse to the global crisis, selling of formerly non tradable "large and small" shareholdings (大小非减持), and fund issuance stopping; the RMB 4 trillion stimulus then drove a rebound of over 100 percent (2008-10-28 to 2009-08-04, plus 108.9 percent). The same piece says the market ran 514 percent from 998.23 (2005-06-06) to 6,124.04 (2007-10-16), after a share reform (股权分置改革) that followed a five year bear market caused by planned state share sales. — [中国证券网, 2016-02-01](https://www.cs.com.cn/ssgs/gsxw/201602/t20160201_4897411.html)
- 2015 to 2016: A third of Shanghai A share value was lost within a month of 12 June 2015; 24 Aug 2015 fall of 8.49 percent; circuit breakers triggered 4 Jan 2016 and suspended 7 Jan 2016. The CSRC had loosened margin and short selling rules after 2010, margin calls forced selling, the "national team" spent RMB 1.6 trillion buying shares, IPOs were suspended, and the PBOC devalued the RMB by 1.86 percent on 11 Aug 2015. — [Wikipedia, 2015–2016 Chinese stock market turbulence](https://en.wikipedia.org/wiki/2015%E2%80%932016_Chinese_stock_market_turbulence). The trigger on 12 June 2015 was the CSRC announcing a crackdown on off exchange margin financing, which then caused the leveraged account collapse; the preceding rally was 63 trading days from 3,400 to 5,178 (plus 55.69 percent) on an interest rate cut on 21 Nov 2014 and loose money. — [中国证券网, 2016-02-01](https://www.cs.com.cn/ssgs/gsxw/201602/t20160201_4897411.html)
- 2018: A deleveraging campaign, a US China trade war and a liquidity squeeze on the private sector; pledged shares being sold by lenders amplified the fall. Shanghai entered a bear market in June 2018 after a six week losing streak (down 13.9 percent for the year to then). Allianz GI questioned the trade only story: onshore and offshore China equities diverged by more than 20 percent that year. Caixin: China's stock market lost 23 trillion RMB of market value in 2018. — [Caixin Global, year end review](https://www.caixinglobal.com/2018-12-31/slowing-growth-and-trade-war-define-chinas-economy-and-finance-in-2018-101365278.html) [snippet only]; [Bloomberg Quint, bear market](https://www.bloombergquint.com/markets/chinese-stocks-poised-to-enter-bear-market-as-airlines-tumble) [snippet only]; [Allianz GI](https://allianzgi.turtl.co/story/chinese-whispers/page/4) [snippet only]
- 2021 to 2024: MSCI says MSCI China fell 54 percent from 17 Feb 2021 to 15 March 2022 (the later low in Oct 2022 took it to minus 64 percent in our computation), and named the real estate debt crisis, regulatory changes and HFCAA (US audit access) concerns as drivers, plus COVID and the Russia Ukraine war; MSCI China ROE "had not materially deteriorated", so MSCI read the selloff as sentiment more than fundamentals. China overseas listed companies fell 11.4 percent on 2022-03-11 after the SEC named five companies under HFCAA. — [MSCI blog, Drivers of China Equities' Sell-Off](https://www.msci.com/research-and-insights/blog-post/drivers-of-china-equities-sell-off) [snippet only; page body would not parse]. Goldman Sachs estimated overseas listed Chinese tech firms lost about USD 1 trillion of value between February and July 2021; Tencent, Meituan and Alibaba lost more than USD 237 billion in 48 hours in late July 2021 as the crackdown widened (private education also targeted). — [CNN Business via KVIA, 2021-07-27](https://kvia.com/news/business-technology/cnn-business-consumer/2021/07/27/meituan-tencent-and-other-chinese-tech-firms-continue-to-plunge-as-beijing-expands-its-crackdown/) [snippet only]. Marquette and abrdn list zero COVID, property distress and geopolitics as the 2022 drivers. — [Marquette Associates](https://www.marquetteassociates.com/wp-content/uploads/2022/11/Chinese-Equities-Down-17-in-October.pdf) [snippet only]
- Sept 2024 stimulus: On 2024-09-24 the PBOC announced rate and reserve requirement cuts (RRR down 50 bp, 7 day reverse repo down 20 bp, 1 year MLF cut to 2.0 percent on 9-25) and a planned USD 114 billion share purchase facility; the Politburo then pledged to stabilise housing. Reuters reported the CSI 300 and Shanghai Composite on track for their best weeks since late 2008. — [Reuters via TradingView](https://tr.tradingview.com/news/reuters.com,2024:newsml_L1N3L9043:0-china-stocks-set-for-best-week-in-16-years-on-stimulus-package) [snippet only]; [Invesco HK](https://invesco.com/hk/en/investment-ideas/quick-takes/china-latest-stimulus-could-boost-the-economy-and-market-sentiment.html) [snippet only]

What the rally and the two years after did (computed, close to close, base 2024-09-20; sources csindex, Yahoo):
- SSE Composite: 2,736.81 (2024-09-20) to 3,336.50 (2024-09-30, plus 21.9%) to 3,489.78 (2024-10-08, plus 27.5%); 3,262.56 on 2025-01-02; 3,096.58 on 2025-04-07; 3,605.73 on 2025-07-24; 4,016.33 on 2025-10-29 (first close above 4,000); 3,968.84 at 2025-12-31 (2025 up 18.4%); intraday high 4,258.86 on 2026-05-14 (close high 4,242.57 on 2026-05-13); 3,735.37 on 2026-10-20 (minus 12.0% from the close high). No close above 5,000 since 2015.
- CSI 300: 3,201.05 to 4,017.85 (2024-09-30, plus 25.5%) to 4,256.10 (2024-10-08, plus 33.0%); 4,629.94 at 2025-12-31; close high 5,059.66 on 2026-06-22 (intraday 5,064.27); 4,152.11 on 2026-10-20 (minus 17.9%). CSI 300 is still 29 percent below its 2007 close high (4,152.11 versus 5,877.20) and 28 percent below its Feb 2021 close high (5,807.72).
- Hang Seng: 18,258.57 (2024-09-20) to 27,968.09 (close high 2026-01-29); 24,314.17 on 2026-10-14. HSCEI: 6,381.50 to 9,724.38 (2025-10-02); 8,183.17 on 2026-10-14. MSCI China price: peak 90.75 on 2025-10-02, low 68.13 on 2026-06-26, 68.95 on 2026-10-20 (minus 24 percent from 2025 peak). MSCI factsheet: MSCI China net return minus 11.86 percent YTD, minus 18.37 percent over 1 year to Sep 30, 2026, after plus 31.17 percent in 2025. — [MSCI China factsheet](https://www.msci.com/documents/10199/255599/msci-china-index-usd-net.pdf)
- 2025 narrative: Shanghai up 18.41 percent, Shenzhen Component up 29.87 percent, ChiNext up 49.57 percent in 2025; 495 stocks more than doubled (Wind via 财联社). — [search result summary via 财联社](https://www.cls.cn/detail/2245504) [snippet only]. Goldman (Jan 2026) forecast MSCI China to 100 by end 2026 (plus 20 percent) with 14 percent earnings growth in 2026 and 2027; MSCI China at about 69 price (net TR 567) in Oct 2026 is therefore well short of that path. — [Bloomberg, 2026-01-07](https://www.bloomberg.com/news/articles/2026-01-07/goldman-forecasts-earnings-driven-2026-gains-for-china-stocks) [snippet only]; [investinglive](https://investinglive.com/stock-market-update/goldman-sachs-sees-further-china-equities-upside-on-ai-and-earnings-growth-prominent-10-20260108/). (The 100 target is on a price index basis; the MSCI China price index closed 2025 at 82.58 in the MSCI API data, so 100 implied plus 21 percent.)
- CSI 300 path in 2026 (csindex closes): about 4,877 on 2026-05-06, 4,931 on 2026-06-17, 5,059.66 on 2026-06-22, 4,549.72 on 2026-07-30, 4,345.21 on 2026-09-29, 4,217.68 on 2026-10-14. I found no source explaining the 2026 retracement; cause is a gap.

### Inferences
- The A share and offshore indices have peaked and troughed at different times in the same cycle: in 2007 to 2008 and 2015 the A share peaks came in June or October (domestic leverage), while Hong Kong peaked earlier (April or May 2015) and in 2021 (February) the HK/ADR names led. The CSI 300 kept making lower lows until 13 Sept 2024 (two weeks before the stimulus), whereas the Hang Seng and MSCI China bottomed on 2022-10-31; the SSE Composite's 2021 to 2024 low came on 2024-02-05.
- The Sept 2024 move was a roughly 3 week 25 to 33 percent re rating of CSI 300 that was partly given back by April 2025; the sustained advance (to Oct 2025 and a 2026 high) was a second leg.
- A buy and hold investor from October 2006 would have endured four drawdowns of at least 30 percent; the sequence 2007 to 2008 minus 72 percent, 2015 to 2016 minus 47 percent, 2018 minus 32 percent, 2021 to 2024 minus 46 percent is the quantitative frame for "how hard it was to compound".

### Gaps
- Intraday low for Hang Seng (10,676.29 on 2008-10-27 is what I recall) and the HSCEI was not retrieved; only closes from Yahoo are reported. Yahoo shows 11,015.84 as the 2008-10-27 close.
- Hang Seng, HSCEI and S&P 500 series end on 2026-10-14 (Yahoo); the A share and MSCI series end 2026-10-20.
- No total return series for the SSE Composite (csindex code H00001 returned empty). Hang Seng total return not retrieved.
- Primary text of the MSCI blog and Reuters/Caixin/Bloomberg Quint articles could not be parsed; those items rely on search snippets.

## 2. The 20 year scorecard: October 2006 to October 2026

### Takeaway
The broad A share price indices roughly doubled to tripled over 20 years (SSE Composite plus 109 percent, CSI 300 plus 189 percent price and plus 327 percent total return) but have not regained their October 2007 highs (SSE minus 39 percent, CSI 300 minus 29 percent). MSCI China net total return in USD grew 2.85 times (5.4 percent a year) against 8.5 percent for MSCI World, 10.6 percent for MSCI USA and 11.2 percent for the S&P 500 total return. "Roughly sideways" is wrong for the full 20 years from 2006 (which began mid rally) but right from the October 2007 peak and from Feb 2021.

### Cited Findings
Start (2006-10-09, first trading day after Golden Week) and end (2026-10-20 unless stated) levels. All computed; sources csindex, MSCI API, Yahoo as listed at the top.
| Index | 2006-10-09 | 2026-10-20 | Multiple | Annualised |
|---|---|---|---|---|
| SSE Composite (price) | 1,785.39 | 3,735.37 | 2.09x | 3.75% |
| CSI 300 (price) | 1,436.07 | 4,152.11 | 2.89x | 5.44% |
| CSI 300 Total Return (H00300) | 1,463.14 | 6,243.18 | 4.27x | 7.51% |
| CSI 500 TR | 1,613.76 | 8,587.05 | 5.32x | 8.70% |
| CSI Dividend TR (H00922) | 1,323.22 | 12,088.06 | 9.14x | 11.68% (index may be back tested early on; not verified) |
| MSCI China price (USD) | 38.32 | 68.95 | 1.80x | 2.98% |
| MSCI China net TR (USD) | 199.18 | 566.75 | 2.85x | 5.36% |
| MSCI EM net TR (USD) | 270.75 | 887.94 | 3.28x | 6.11% |
| MSCI World net TR (USD) | 3,098.34 | 15,944.81 | 5.15x | 8.52% |
| MSCI USA net TR (USD) | 2,971.06 | 22,311.06 | 7.51x | 10.59% |
| S&P 500 price | 1,350.66 | 7,718.94 (2026-10-14) | 5.71x | 9.10% |
| S&P 500 TR | 2,072.71 | 17,318.14 (2026-10-14) | 8.36x | 11.19% |
| Hang Seng price | 17,675.24 | 24,314.17 (2026-10-14) | 1.38x | 1.61% |
| HSCEI price | 7,072.44 | 8,183.17 (2026-10-14) | 1.16x | 0.73% |
Using 2006-10-31 as the start instead: SSE 1,837.99 (2.03x), CSI 300 1,464.47 (2.84x), MSCI China net 213.11 (2.66x, 5.0% a year), S&P 500 TR 2,115.65 (8.19x).
- From the October 2007 closing highs: SSE 3,735.37 versus 6,092.06 is minus 38.7 percent; CSI 300 4,152.11 versus 5,877.20 is minus 29.4 percent; MSCI China price 68.95 versus 104.06 (2007-10-30) is minus 33.7 percent and versus 129.60 (2021-02-17) is minus 46.8 percent. (computed)
- MSCI's own long run: MSCI China net return annualised 3.36 percent over 10 years, minus 2.10 percent over 5 years, 7.11 percent since Dec 29, 2000 (to Sep 30, 2026); MSCI EM 9.09 percent over 10 years, ACWI 12.38 percent. — [MSCI China factsheet](https://www.msci.com/documents/10199/255599/msci-china-index-usd-net.pdf)
- GDP versus equities (World Bank): China GDP in current USD was USD 2,791 billion in 2006 and USD 19,498 billion in 2025 (7.0x); in RMB 22,258 billion to 140,188 billion (6.3x); real GDP (constant 2015 USD) USD 5,091 billion to USD 19,401 billion (3.8x). Market capitalisation of listed domestic companies (current USD) was USD 1,145 billion in 2006, USD 4,479 billion in 2007, USD 8,188 billion in 2015 and USD 15,509 billion in 2025 (13.5x since 2006). — [World Bank GDP USD](https://api.worldbank.org/v2/country/CHN/indicator/NY.GDP.MKTP.CD?format=json&date=2005:2025&per_page=50), [GDP real](https://api.worldbank.org/v2/country/CHN/indicator/NY.GDP.MKTP.KD?format=json&date=2005:2025&per_page=50), [GDP RMB](https://api.worldbank.org/v2/country/CHN/indicator/NY.GDP.MKTP.CN?format=json&date=2005:2025&per_page=50), [market cap](https://api.worldbank.org/v2/country/CHN/indicator/CM.MKT.LCAP.CD?format=json&date=2005:2025&per_page=50). (The 2006 market cap number partly reflects the pre share reform float.)
- Earnings did not keep pace: Siblis Research puts SSE Composite aggregate earnings at an index of 117.0 in Sept 2026 versus 100 at end 2016 (about 1 percent a year compounded over ten years, and lower than a year earlier). — [Siblis Research, China (SSE Composite) P/E](https://siblisresearch.com/data/China-shanghai-pe-cape-ratio/)
- Dilution: A share company count rose from about 1,500 to about 3,400 between Oct 2007 and Oct 2017; total shares from 1.99 trillion to about 6 trillion; tradable shares from 943.5 billion to 5.16 trillion (plus 447 percent); total market cap from about RMB 36 trillion to about RMB 64 trillion (plus 77 percent). Over that decade the SSE Composite fell 43.77 percent and CSI 300 fell 32.65 percent while CSI 500 rose 37.20 percent. — [每日经济网/证券时报, 2017-10-15](https://www.nbd.com.cn/articles/2017-10-15/1154126.html)
- Citi (9 Feb 2024): since 2002 China's nominal GDP in USD rose 12 times, the weighted average of Shanghai, Shenzhen and HSCEI rose 3 times, and market capitalisation rose 27 times; the US comparison was 2.5x GDP, 3.0x index, 4.5x market cap; Japan showed the least dilution. "The equity markets have been a massive ATM for China's corporate issuers." Other causes cited by Citi: SOEs listing to fund social security obligations ("national service") and banks issuing equity to provision for bad loans. — [Citi Global Wealth, Asia Pacific Strategy, 9 Feb 2024](https://www.citigroup.com/rcs/citigpa/storage/public/Asia-Pacific-Strategy-China-Will-It-Work-This-Time.pdf)
- Pictet estimates secondary offerings cut EPS growth by about 2 percent a year among the main benchmark constituents, and that Chinese EPS compound growth undershot GDP growth by about 8 percentage points a year over 15 years (Refinitiv, 2008 to 2023), roughly twice the EM average shortfall. — [Pictet AM, Outlook for Chinese stocks, 2023](https://am.pictet.com/us/en/investment-views/active-equity/2023/chinese-stocks) [snippet only; page returned 403 to curl]
- AllianceBernstein (Feb 3, 2026): EPS growth stagnated for a decade; high issuance diluted EPS, plus poor price discipline, deflation and overcapacity; net issuance has now turned negative as dividends and buybacks rise; "anti involution" in the 15th Five Year Plan helps margins; ROE may have reached an inflection point. — [AllianceBernstein](https://www.alliancebernstein.com/corporate/en/insights/investment-insights/china-equities-tracking-the-turn-from-rally-to-resilience.html)
- Ritter and others: correlation between equity returns and per capita GDP growth is negative across 19 countries 1900 to 2011 (minus 0.39 local currency); Ritter: "China has outstanding economic growth but stock investors have not done great." Nomura data via WSJ: China real GDP growth 1993 to 2010 was 9.5 percent compounded versus 2.2 percent real return on domestic stocks. — [search result summary of Morningstar and WSJ coverage](https://www.morningstar.ca/ca/news/186475/economic-growth-great-for-everyone-but-investors.aspx) [snippet only]
- NBER paper "The Real Value of China's Stock Market" is the academic reference on the weak link between stock returns and growth (finding on anticipation of slower growth). — [NBER w20957](https://www.nber.org/system/files/working_papers/w20957/w20957.pdf) [not opened; snippet only]

### Inferences
- The brief's phrase "broad index roughly sideways" holds for the 19 years from the 2007 peak (SSE minus 39 percent, CSI 300 minus 29 percent, MSCI China price minus 34 percent) but not for the 20 years from October 2006: the index started on a steep ramp (SSE was about 1,785 and went to 6,092 in 12 months). A start at October 2007 would show a clearly negative price return; a start at October 2006 shows about 3.7 to 5.4 percent a year price return and 7.5 percent a year total return for CSI 300.
- The gap between GDP (3.8x real, 7x nominal USD) and index (2x to 3x price) is explained in the sources by: earnings per share nearly flat (Siblis), share count tripling (nbd) with market cap up 13 to 27 times, valuation de rating, and a market weighted to SOE banks and cyclicals; the offshore index also lost a trillion dollars of tech value in the regulatory reset.
- The CSI Dividend TR (9.1x) and CSI 500 TR (5.3x) beat the CSI 300 TR (4.3x), so the broad "sideways" story hides a large dispersion by style; the dividend and small cap series should be used with their definitions checked.

### Gaps
- SSE Composite total return (dividends) not available; CSI 300 TR is the dividend inclusive A share benchmark used here. MSCI China net TR is USD based; RMB total return for MSCI China not retrieved.
- Hang Seng total return and HSCEI total return not retrieved.
- GDP real growth multiple depends on the series (World Bank constant 2015 USD); I did not check IMF real RMB GDP.
- I did not open the NBER paper or the Morningstar article; both are snippet level.

## 3. The China discount: size, history, explanations, and who escaped it

### Takeaway
Chinese equities have traded at roughly 40 to 55 percent below US or global multiples on most dated observations since 2016, and at about 43 percent (forward P/E) and 66 percent (P/B) below MSCI World at 30 Sep 2026. The A share market itself was at the opposite extreme in 2007 (SSE trailing P/E near 70, CAPE above 109). Explanations are governance, dilution, state ownership, regulatory and geopolitical risk, VIE structure and delisting risk, and capital controls; consumer staples and a few quality names traded at global premium multiples.

### Cited Findings
Most recent snapshot, MSCI factsheets dated Sep 30, 2026:
| Index | Dividend yield | Trailing P/E | Forward P/E | P/BV |
|---|---|---|---|---|
| MSCI China | 2.43% | 13.03 | 10.15 | 1.38 |
| MSCI Emerging Markets | 2.02% | 14.90 | 9.72 | 2.39 |
| MSCI ACWI | 1.58% | 21.35 | 16.28 | 3.77 |
| MSCI World | 1.52% | 22.69 | 17.92 | 4.10 |
Sources: [MSCI China factsheet](https://www.msci.com/documents/10199/255599/msci-china-index-usd-net.pdf) and [MSCI World factsheet](https://www.msci.com/documents/10199/178e6643-6ae6-47b9-82be-e1fc565ededb). Computed: MSCI China forward P/E is 43 percent below MSCI World (10.15 versus 17.92) and 38 percent below ACWI; P/BV 66 percent below World. Implied ROE (P/BV divided by trailing P/E): China about 10.6 percent, EM 16.0, ACWI 17.7, World 18.1.

Dated forward P/E comparisons found:
- Sept 2017: Datastream China H share index 7.2x forward earnings versus 15.6x for the world, a 53.9 percent discount. — [Edison Investment Research on Fidelity China Special Situations, 15 Sep 2017](https://www.edisongroup.com/research/attractive-valuations-and-growth-prospects/19555/)
- Jan 2022 (Reuters, end of week to 2022-01-07): MSCI Asia Pacific 12 month forward P/E 14.27 versus MSCI World 18.31, a 22 percent discount, the widest since at least June 2003; Hong Kong and China markets each had forward P/E below 11. (Asia Pacific, not China.) — [Reuters via nippon.com](https://www.nippon.com/en/news/reu20220107KBN2JH0DZ/)
- Around March 2023 (date inferred by the search tool, not by the page): MSCI China forward P/E about 10.1 versus about 20.2 for the US, exactly half, the widest gap since March 2022. — [ETF Trends](https://etftrends.com/china-insights-channel/china-us-have-wide-valuation-gap-between-them/) [snippet only; page returned 403]
- June 2025: Eastspring (citing MacroMind) says MSCI China's P/E discount to MSCI US remained above its 5 year average despite a widening China minus US growth differential; MSCI China up 32.2 percent over the year. No number extracted. — [Eastspring](https://www.eastspring.com/insights/deep-dives/china-equities-scaling-the-great-wall-of-worries)
- Jan 2026 (Goldman Sachs): forward P/E about 12.4x for MSCI China and about 14.5x for CSI 300, "broadly in line with long term averages". — [investinglive, 2026-01-08](https://investinglive.com/stock-market-update/goldman-sachs-sees-further-china-equities-upside-on-ai-and-earnings-growth-prominent-10-20260108/)

CSI 300 and Hang Seng indices, trailing P/E (Danjuan weekly series, 2016 onwards) next to S&P 500 trailing P/E (multpl.com month data). Definitions differ (Danjuan methodology not verified; multpl is as reported trailing), so use as an indicative ratio only.
| Date (approx) | CSI 300 P/E | CSI 300 P/B | HSCEI P/E | HSI P/E | S&P 500 P/E | CSI 300 / S&P |
|---|---|---|---|---|---|---|
| 2016-10-19 | 13.13 | 1.49 | 8.02 | 11.50 | 23.57 | 0.56 |
| 2018-01-21 (near peak) | 15.47 | 1.80 | 9.80 | 14.04 | 24.97 | 0.62 |
| 2019-01-01 | 10.09 | 1.24 | 8.38 | 9.32 | 19.60 | 0.51 |
| 2021-02-07 (near peak) | 16.78 | 1.84 | 14.56 | 16.57 | 33.24 | 0.50 |
| 2022-10-30 (trough) | 10.29 | 1.20 | 6.44 | 7.23 | 20.44 | 0.50 |
| 2024-02-04 | 10.61 | 1.18 | 6.71 | 7.69 | 26.14 | 0.41 |
| 2024-09-17 | 10.87 | 1.16 | 7.76 | 8.67 | 28.09 | 0.39 |
| 2024-12-29 | 13.09 | 1.40 | 8.33 | 9.18 | 28.60 | 0.46 |
| 2025-09-28 | 14.19 | 1.47 | 10.82 | 12.06 | 28.42 | 0.50 |
| 2026-06-21 | 14.93 | 1.50 | 9.59 | 11.64 | 25.22 | 0.59 |
| 2026-10-19 | 12.99 | 1.38 | 9.26 | 10.55 | 26.32 (multpl current) | 0.49 |
Sources: [Danjuan CSI 300 PE](https://danjuanfunds.com/djapi/index_eva/pe_history/SH000300?day=all), [PB](https://danjuanfunds.com/djapi/index_eva/pb_history/SH000300?day=all), [HSCEI](https://danjuanfunds.com/djapi/index_eva/pe_history/HKHSCEI?day=all), [HSI](https://danjuanfunds.com/djapi/index_eva/pe_history/HKHSI?day=all), [multpl S&P 500 P/E](https://www.multpl.com/s-p-500-pe-ratio/table/by-month) (S&P value for 2025-09/10 is the Oct 2025 month). Over the 2016 to 2026 series the CSI 300 trailing P/E ranged 10.09 (2019-01-01) to 17.38 (2021-02-17), median 12.74; HSCEI P/E 6.32 (2024-01-21) to 16.31 (2021-02-22), median 8.81; HSI P/B 0.72 (2022-10-30) to 1.48.

SSE Composite valuation history (Siblis Research, aggregate market cap over normalised earnings): trailing P/E near 70 and CAPE above 109 at the 2007 peak; year end forward P/E 14.30 (2016), 13.99 (2017), 10.00 (2018), 12.43 (2019), 17.06 (2020), 15.19 (2021), 11.63 (2022), 10.74 (2023), 13.05 (2024), 14.93 (2025), 13.29 (Sept 2026); trailing P/E 16.87 and CAPE 17.08 in Sept 2026. — [Siblis Research](https://siblisresearch.com/data/China-shanghai-pe-cape-ratio/)
- Other 2007 readings: Capital Economics put the Shanghai Composite trailing P/E at a cyclical peak of about 49 in Oct 2007; a December 2007 reading quoted by SCMP was Hang Seng 21.1x and Shanghai Composite 59.2x; the ECB (June 2008) said Chinese P/E ratios in Oct 2007 were comparable to Japan at its bubble peak. The readings differ by method. — [Capital Economics](https://capitaleconomics.com/clients/publications/global-markets/emerging-markets-market-valuation-monitor/how-stretched-is-the-valuation-of-china-s-stock-market) [snippet only]; [SCMP](https://m.scmp.com/business/markets/article/1814380/small-cap-stocks-chinas-shenzhen-market-bubble-territory-risking) [snippet only]; [ECB FSR, June 2008](https://ECB.eu/pub/financial-stability/fsr/focus/2008/pdf/ecb~9d4f6cb695.fsrbox200806_03.pdf) [snippet only]
- 2016 press: after five years of bear market the average P/E of Shanghai and Shenzhen A shares fell to about 13x, the lowest valuation in A share history and below major global markets. — [中国证券网, 2016-02-01](https://www.cs.com.cn/ssgs/gsxw/201602/t20160201_4897411.html)
- Historical MSCI China versus MSCI World forward P/E series for 2006 to 2016: gap. Not found in any open source. (MSCI only publishes the current factsheet; Wayback Machine holds one 2026 snapshot.)

A share versus H share premium (Hang Seng Stock Connect AH Premium Index; launched 9 July 2007; above 100 means A shares dearer than H shares):
- 157.16 intraday on 2024-01-22, the highest since 2010; above 160 in Feb 2024 (peak reported at 161.36); 149.26 reported as a high in 2021; fell to a low of 128.31 on 2025-03-19; premium 27 percent on 2025-06-12, the lowest since Aug 2020, with BYD and CATL A shares trading below their H shares. Sector pattern: brokers, airlines and infrastructure carry high premia; resources, materials and home appliances low. UBS strategist Wang Zonghao said the premium was close to historical lows and could reverse. — [财联社, 2024-01-23](https://www.cls.cn/detail/1577793); [华尔街见闻, 2025-06-12](https://wallstreetcn.com/articles/3748975); [snippet for 2021 and 161.36](https://wallstreetcn.com/articles/3670211) [snippet only]
- AH premium 2007 to 2020 history: gap (index series not retrievable; Yahoo had no ticker).

Reasons given for the discount:
- Dilution and capital allocation: see Section 2 (Citi, Pictet, AllianceBernstein). Citi adds that "strengthened governance … is what could help to restore trust" and that policy measures alone would not. — [Citi, 9 Feb 2024](https://www.citigroup.com/rcs/citigpa/storage/public/Asia-Pacific-Strategy-China-Will-It-Work-This-Time.pdf)
- Regulation and politics: Pictet counts a 2.5 year crackdown that wiped more than USD 1 trillion from market value and impaired earnings growth, plus volatile regulation, dilution and weak governance. — [Pictet](https://am.pictet.com/us/en/investment-views/active-equity/2023/chinese-stocks) [snippet only]
- VIE structure: a paper "When Enron Met Alibaba: The Rise of VIEs in China" finds US listed Chinese VIE firms have Tobin's Q up to 35 percent lower than non VIE Chinese firms, concentrated where expropriation and government intervention risks are higher; the discount is smaller with Big N auditors, politically connected directors and institutional ownership. The VIE structure has never been formally endorsed by Beijing. — [CUHK Business School event page](https://www.bschool.cuhk.edu.hk/events/when-enron-met-alibaba-the-rise-of-vies-in-china) [snippet only]; [Columbia CLS Blue Sky Blog](https://clsbluesky.law.columbia.edu/2018/03/06/the-rise-of-u-s-listed-vies-from-china-balancing-state-control-and-access-to-foreign-capital/?amp=1) [snippet only]; [Investor Daily](https://investordaily.com.au/analysis/49841-china-governance-and-regulatory-risks-to-the-fore) [snippet only]
- Delisting risk and audit access (HFCAA): the Western Michigan Law Review notes US listed Chinese companies face looming delisting under the Holding Foreign Companies Accountable Act; the fear has eased with the audit inspection agreement but data issues persist. — [William and Mary Business Law Review / WMU summary](https://scholarship.law.wm.edu/wmblr/vol14/iss3/5) [snippet only]; MSCI blog (Section 1) names HFCAA as a March 2022 driver.
- Founder expropriation incentives under VIEs (Jack Ma example): [Simon Business School, Rochester](https://simon.rochester.edu/blog/chinese-stocks-corporate-governance-and-political-risk) (page opened; commentary, not peer reviewed).
- State ownership: IMF Working Paper 2021/075 finds listed SOEs earn lower profits (return on assets) than listed firms without state stakes; the gap in productivity widened 2002 to 2009 and remained sizeable in 2019. A Brandeis working paper puts SOE returns at about half the non state level after 2008, linked to the 2008 to 2009 stimulus. — [IMF WP 2021/075](https://www.elibrary.imf.org/view/journals/001/2021/075/article-A001-en.xml) [snippet only]; [Brandeis WP109R](https://www.brandeis.edu/economics/RePEc/brd/doc/Brandeis_WP109R.pdf) [snippet only]
- Index composition: Siblis says the SSE Composite is weighted to banks, industrials and state linked firms; Tencent, Alibaba, Xiaomi and Meituan are listed in Hong Kong and not in the SSE series, so cross market comparisons reflect composition as well as cheapness. — [Siblis](https://siblisresearch.com/data/China-shanghai-pe-cape-ratio/)
- Capital controls, A share and H share segmentation: analyst Gui Haoming says the A/H premium reflects a relatively closed market versus an internationally allocated one. — [华尔街见闻, 2025-06-12](https://wallstreetcn.com/articles/3748975)
- Geopolitics and trade war: a 2018 trigger (Section 1) and 2022 drivers. Sell side (Goldman, Jan 2026) says valuations are "no longer distressed". — [investinglive](https://investinglive.com/stock-market-update/goldman-sachs-sees-further-china-equities-upside-on-ai-and-earnings-growth-prominent-10-20260108/)

Who escaped the discount:
- Consumer staples and healthcare in A shares: in the 券商中国/证券时报 20 year review, food and beverage and pharma sector average P/E rose from about 15x twenty years earlier (Hengrui at 30x) to 40 to 50x or more by Aug 2021; Moutai's initial P/E was about 20x and its P/E was about 40x then, with a 140 fold profit increase from 2001 to 2020 (RMB 328 million to RMB 46.9 billion). — [澎湃/券商中国, 2021-08-22](https://m.thepaper.cn/newsDetail_forward_14159850)
- Military industrial names (航发动力, 中航西飞, 中航沈飞): rose about 15 times mostly on re rating, from initial P/E in the low teens to a dynamic P/E above 100 by Aug 2021. Same source.
- ChiNext (growth) P/E 31.6 and P/B 4.4 on 2026-10-19 versus CSI 300 at 13.0 and 1.4 (Danjuan), and 2016-10 ChiNext at 49.1x. — [Danjuan 399006](https://danjuanfunds.com/djapi/index_eva/pe_history/SZ399006?day=all)
- Dividend stocks: CSI Dividend TR 9.1x over 20 years versus CSI 300 TR 4.3x (Section 2).

### Inferences
- The discount to US trailing P/E has oscillated between roughly 0.4 and 0.6 of the S&P 500 multiple since 2016, with the narrowest gap at the 2018 and mid 2026 highs and the widest in 2024 when the S&P multiple was near 28x and CSI 300 near 11x. The forward P/E comparison at 30 Sep 2026 (0.57 of World) sits inside that band.
- The discount is not a mainland domestic phenomenon at all times: A share valuations were far above the world in 2007 (P/E 49 to 70), and the AH premium of 30 to 60 percent shows domestic investors paid more than offshore investors for the same company during 2021 and 2024. The "discount" is strongest in H shares, ADRs and state weighted indices, and weakest in A share staples.
- Several sources agree that dilution plus state ownership and weak governance explain why GDP growth did not become per share value, and the discount capitalises the risk that this continues.

### Gaps
- No clean historical series for MSCI China forward P/E versus MSCI World for 2006 to 2016 and for Oct 2007, Oct 2008, Feb 2021 and Oct 2022 individually. Only the dated spot points above were found.
- Hang Seng AH premium history for 2007 to 2020 not retrieved. No source computed an academic estimate of the China discount in percent after controls (only the VIE Tobin's Q result).
- I did not find a Morgan Stanley, UBS or CICC quote with a dated China versus world multiple, nor an IMF or central bank commentary on the selloffs that I could cite.

## 4. Published long term rankings (10, 15 and 20 year horizons; long bull lists)

### Takeaway
I found no published list covering exactly 2006 to 2026 (20 years), no 15 year list, no Hong Kong or US listed Chinese 20 year list and no English language ranking. What exists: a 20 year top 50 for stocks listed 20+ years as of Aug 2021 (about 2001 to 2021), several 10 year lists (2007 to 2017, 2009 to 2019, 2016 to 2026 [blog, low reliability]), a 10 year Hong Kong top 10 to Dec 2019, and since listing lists. Methods (price versus adjusted, start date, survivorship) differ enough that the same stock appears with 3x to 15x spread in different lists. All lists are dominated by baijiu, pharma and consumer staples, with a small number of technology and industrial names.

### Cited Findings
All entries: date of publication, data source, horizon, named stocks with returns. "fq" = adjusted for dividends and bonus shares (复权).

A. 20 year list, stocks listed at least 20 years as of Aug 2021 (about 2001 to 2021)
- 券商中国/证券时报 "投资小红书", published 2021-08-22; covers all A shares listed 20 years or more; source: 证券时报 own statistics (data vendor not stated); top 50 over 20 years; price multiple basis not stated (probably adjusted).
- Top names: 贵州茅台 about 340x; 山西汾酒 140x; 恒瑞医药 about 120x (text elsewhere says 112x); 格力电器 104x; 泸州老窖 93x; 万华化学 81x (rank 6); 五粮液 64x; 长春高新 60x; 伊利股份 47x; 三安光电 42x; 重庆啤酒 38x; 用友网络 35x; 古井贡酒 34x; 通策医疗 32x; 云南白药 30x; 福耀玻璃 30x; 舍得酒业 27x; 复星医药 27x; 长安汽车 24x; 中国巨石 23x; 双汇发展 23x; 宝信软件 22x; 宇通客车 22x; 酒鬼酒 21x; 华东医药 20x; 中联重科 18x; 水井坊 17x; 生益科技 17x; 华域汽车 16x; 青岛啤酒 16x; 海尔智家 15x; 航发动力/中航西飞/中航沈飞 about 15x each; 丽珠集团 14x; 特变电工 14x; 天坛生物 13x; 承德露露 13x; 国际医学 12x. Also 海通证券 and 万科 in the top 50.
- Sector counts: 13 food and beverage (8 baijiu) and 9 biomedicine = 44 percent of top 50; with appliances and autos as consumer discretionary, 54 percent. Average ROE of Moutai since 2001 was 30 percent; Fenjiu and Luzhou Laojiao above 20 percent. — [澎湃/券商中国, 2021-08-22](https://m.thepaper.cn/newsDetail_forward_14159850)
- Reliability: good (a securities newspaper, explicit method of "complete list of stocks listed 20 years"), but it excludes later listings (e.g. Midea, Tencent) and delisted stocks. Rank order and exact multiples were taken from the text; the full top 50 table is an image and not captured.

B. 10 year lists
1. 2007-10-16 to 2017-10 (the "6124" anniversary): 每日经济网 reprinting 证券时报, published 2017-10-15; exact fq return: 三安光电 plus 5,947.93 percent (about 60x); 华夏幸福 more than 30x; 平潭发展 plus 2,754.25 percent (best Shenzhen main board); 东方雨虹 plus 2,464.66 percent (best SME board); 贵州茅台 plus 361.86 percent, rank 253 on the two markets; worst: 中远海控 minus 87.01 percent, also *ST锐电, 中国铝业, 西部矿业, 云南铜业, 中远海能 down more than 80 percent. Index comparison: CSI 500 plus 37.20 percent, SME index plus 35.55 percent, SSE minus 43.77 percent, CSI 300 minus 32.65 percent. — [每日经济网](https://www.nbd.com.cn/articles/2017-10-15/1154126.html)
2. Same period, 界面新闻 using 同花顺 data, published 2017-10-18: 986 stocks were above their 6,124 point price on an adjusted basis, 476 below; top three 三安光电 59x, 华夏幸福 30x, 平潭发展 27x; 13 stocks gained more than 10x. — [界面新闻](https://m.jiemian.com/article/1690564_yidian.html). A 知乎 post from the search results says 26 stocks gained 10x on a different adjusted basis (同花顺 front adjusted for cash dividends only) [snippet only: https://zhuanlan.zhihu.com/p/94757942]. Conflict: 13 versus 26.
3. 2005-06-06 (SSE 998) to 2016-01-28: 中国证券网/信息时报, published 2016-02-01, 同花顺 data: of 1,306 stocks with comparable data, 1,195 (91.5 percent) more than doubled; 489 more than 5x; 169 more than 10x (29 pharma stocks the largest group). Named: 康美药业 about 35x (later subject of a major accounting fraud case; that fact is from my background knowledge, not from these sources), 万科A and 格力电器 (plus 2,543.49 percent since 1996 listing), 贵州茅台 plus 1,580.52 percent since the 998 low. — [中国证券网, 2016-02-01](https://www.cs.com.cn/ssgs/gsxw/201602/t20160201_4897411.html)
4. Since 2015-06-12 (the 5,178 peak) to 2018-06-12: 数据宝/证券时报, published 2018-06-13: only 227 stocks (listed before 2015) were above their level; 北讯集团 plus 421.66 percent, 协鑫集成 plus 331.15 percent, 鸿特科技, 赣锋锂业, 贵州茅台, 小天鹅A, 水井坊; 38 stocks doubled including 五粮液, 恒瑞医药, 分众传媒, 顺丰控股, 美的集团; 中国平安 plus 51.5 percent. — [每日经济网](https://www.nbd.com.cn/articles/2018-06-13/1225560.html)
5. Roughly 2009 to Sept 2019 ten baggers: 数据宝/证券时报 via 21财经, published 2019-09-23: more than 400 stocks rose more than 10x at some point in the decade; maximum gains 银之杰 more than 82x (then fell 83.02 percent from its high), 东方财富 more than 70x, 金证股份 more than 60x, 光启技术 and 同花顺 more than 40x; only 33 were within 20 percent of their highs (9 pharma, 9 electronics, 5 food and beverage; also 中国国旅, 韵达股份, 牧原股份, 格力电器 at P/E under 13). Note this is peak gain, not period gain. — [21财经](https://m.21jingji.com/article/20190923/herald/996a84294dca26ecdd6de603ec9d4a62.html)
6. Ten years to Dec 2019, internal growth ten baggers: 腾讯财经 via 格隆汇 (data on 4,102 listed companies, 1,968 listed more than 10 years, after excluding backdoor listings): only 14 stocks gained 10x; 立讯精密 32x, 亿纬锂能 27x, 东方财富 22x, 贵州茅台 about 14x (rank 7); sector: 6 pharma (通策医疗, 爱尔眼科, 长春高新, 智飞生物), 4 technology (东方财富, 同花顺, 立讯精密), 2 consumer (茅台, 中国中免). Average ROE over the decade for the 14 was 18.26 percent: 茅台 33.89 percent highest, 东方财富 8.98 percent lowest. — [格隆汇, republishing 腾讯证券](https://m.gelonghui.com/p/433292) (publication date shown as "6 years ago"; text says data to Dec 9, presumably 2019)
7. Ten years 2016 to 2026 top ten (eastmoney 财富号 blogger, published 2026-04-16): 中际旭创 plus 5,194 percent (52x), 新易盛 38x, 北方华创 31x, 胜宏科技 22x, 宁德时代 21x, 亿纬锂能 20x, 东方财富 19x, 兆易创新 16x, 长川科技 15x, 阳光电源 14x; fq prices. Reliability: low. The author uses "listing day price" or "pre listing valuation" as the base price for 新易盛, 宁德时代, 兆易创新 and 长川科技, so these are not true ten year returns, and no data source is given. — [东方财富财富号](https://caifuhao.eastmoney.com/news/20260416222209498231100)

C. Lists since listing (30 years and 20 plus year horizons)
- 木头投研 via 腾讯新闻, 2020-08-27, exact fq since listing (stocks still trading): 泸州老窖 386x, 贵州茅台 348x, 格力电器 180x (rank 8), 恒瑞医药 rank 7, 东阿阿胶 rank 50 at 35.8x; about 50 stocks more than 30x. — [腾讯新闻](https://view.inews.qq.com/a/20200827A0ECC400)
- 界面新闻, Wind data, c. 2020 (29 years of history, excludes new issues and "old eight"): 万科A 274x, 伊利股份 227x, 泸州老窖 171x, 贵州茅台 157x, 格力电器 141x, 云南白药 138.65x; then 恒瑞医药, 华域汽车, 中天金融, 华夏幸福 all above 50x. 6 stocks above 100x, 60 above 20x, 157 above 10x, 390 above 5x, 1,515 above 1x of 3,486; 505 of 2,519 stocks listed 5 years or more (20 percent) are down since listing; 西部矿业 minus 77.76 percent, 中石油 minus 77.11 percent; best annualised return among 10 year plus listings 贵州茅台 32.42 percent, then 东方雨虹, 华夏幸福, 恒生电子 above 30 percent. Publication date not captured. — [界面新闻](https://www.jiemian.com/article/2954993.html)
- Self media list dated 2026-05-17 on sina.cn (adjusted since listing, no data source named): 万科A 3,657x, 格力电器 2,450x, 福耀玻璃 1,445x, 云南白药 874x, 泸州老窖 663x, 山西汾酒 582x, 伊利 509x, 贵州茅台 474x, 万华化学 212x, 恒瑞医药 210x, 片仔癀 206x, 特变电工 200x, 五粮液 181x, 长春高新 159x, 华域汽车 129x, 紫光国微 128x, 海尔智家 116x, 比亚迪 110x; also over 100x: 爱尔眼科, 通策医疗, 东方雨虹, 立讯精密, 汇川技术, 海天味业, 牧原股份, 中际旭创, 宁德时代. Reliability: low (blogger, no method; ranks differ from the Wind based lists above by up to 15x for the same stock, e.g. 万科 274x versus 3,657x). — [Sina](https://www.sina.cn/news/detail/5299587191408688.html)
- uSMART citing Choice data, for 2000 to 2019 (stated as "past nearly 20 years"; probably unadjusted price multiples, adjustment not stated): 恒瑞医药 269x, 贵州茅台 246x. Compared by the author to Netflix (US). — [uSMART](https://www.usmart.hk/en/news-detail/6598015070402380087)
- 证券时报·数据宝 June 2020 (snippet only): on gains from post listing lows, 云南白药 more than 638x; 24 stocks more than 100x. — [证券时报网](https://news.stcn.com/sd/202006/t20200622_2062028.html) [not opened; fetch failed]

D. Hong Kong
- 10 years to 2019-12-24 (HK$5 billion minimum market cap, excluding suspect "老千股"; published 2019-12-27 by 新浪财经): 舜宇光学科技 more than 140x; 银河娱乐 18.2x; 中国奥园 17.4x; 融创中国 16.3x; 申洲国际 14.1x; 颐海国际 13.7x; 金斯瑞生物科技 more than 12x; 中国生物制药 11.7x; 腾讯控股 11.5x (rank 9); 创科实业 about 10x. Hang Seng rose about 7.8 percent in 2019 versus 28.6 percent for the S&P 500 and 19 percent for the SSE. Adjustment basis not stated. — [新浪财经](https://finance.sina.com.cn/stock/hkstock/ggscyd/2019-12-27/doc-iihnzhfz8284239.shtml)
- 东方证券 2018 report on the top 20 HSCI constituents by return from 2008-01-01 to 2017-12-31: exists per a search summary but the list was not retrieved. [snippet only]
- 10 baggers within the last year (not long horizon): 14 Hong Kong 10 baggers between Aug 2024 and Jul 2025 (每日经济网); 13 in 2025 (Wind): 粤港湾控股 about 32.7x, 九福来 about 30.3x. — [每日经济网, 2025-08-01](https://www.nbd.com.cn/articles/2025-08-01/3998198.html) [snippet only]

E. US listed Chinese stocks: no ranking found. Contextual only: 280 US listed Chinese stocks lost on average 55.6 percent in the year to 2022-03-10. [snippet only: https://wallstreetcn.com/articles/3654042]

F. English language: no ranked list found. Bloomberg (via Caixin, 2020-09-03): Moutai and Hengrui had each risen more than 10x in a decade by mid 2020. — [Caixin Global](https://www.caixinglobal.com/2020-09-03/chinese-investor-hunting-for-next-moutai-wins-big-on-cocktails-101600781.html) [snippet only]. MOI Global (2019): Moutai had 22 consecutive years of revenue, EPS and tangible book growth and raised prices in 10 of the previous 18 years. — [MOI Global](https://moiglobal.com/wide-moat-asia-2019/?pdf=55812) [snippet only]

G. Spot check for the cross check (my own computation, not a published ranking): Yahoo Finance adjusted close, 2006-10-09 to 2026-10-14. Treat as indicative; Yahoo adjustment for Chinese bonus shares and rights issues is not verified.
| Stock | Adj multiple | Annualised |
|---|---|---|
| 腾讯 0700.HK | 138.8x | 28.0% |
| 格力电器 000651 | 77.7x | 24.3% |
| 贵州茅台 600519 | 48.4x | 21.4% |
| 恒瑞医药 600276 | 41.3x | 20.4% |
| 片仔癀 600436 | 30.0x | 18.5% |
| 福耀玻璃 600660 | 26.4x | 17.8% |
| 山西汾酒 600809 | 22.7x | 16.9% |
| 万华化学 600309 | 15.4x | 14.6% |
| 伊利股份 600887 | 14.7x | 14.4% |
| 长江电力 600900 | 12.9x | 13.6% |
| 泸州老窖 000568 | 12.5x | 13.5% |
| 招商银行 600036 | 11.4x | 12.9% |
| 五粮液 000858 | 11.0x | 12.7% |
| 云南白药 000538 | 10.4x | 12.4% |
| 比亚迪 002594 (from 2011-06-30) | 10.1x | 16.3% |
| 万科A 000002 | 2.0x | 3.5% |
Source: [Yahoo chart API, e.g. 600519.SS](https://query1.finance.yahoo.com/v8/finance/chart/600519.SS?period1=1159660800&period2=1792000000&interval=1d&events=div,split). Note the 2006 to 2026 multiples are much smaller than the "since listing" multiples above (e.g. Moutai 48x versus 348x to 474x) because 2006 was already a re rated starting point.

### Inferences
- The consistent names across independent lists (10 and 20 year, 2007 to 2021): 贵州茅台, 山西汾酒, 泸州老窖, 五粮液, 恒瑞医药, 格力电器, 伊利股份, 云南白药, 长春高新, 万华化学, 福耀玻璃, 三安光电, 东方财富, 立讯精密, 通策医疗, 爱尔眼科. These are the strongest candidates for the separate price screen to cross check.
- Names in short term lists that later disappeared from the top (华夏幸福, 康美药业, 北讯集团, 银之杰) show that 10x lists contain many boom and bust names; the 2019 数据宝 study finds only 33 of 400+ ten baggers held within 20 percent of their highs.
- For 2006 to 2026 specifically, Tencent (Hong Kong), Gree, Moutai and Hengrui look like the leaders among the names spot checked, but a proper screen must cover the full universe incl. delisted names.

### Gaps
- No 15 year list in any source. No published list for 2006 to 2026 (or 2005 to 2025). No US listed Chinese 10, 15, 20 year ranking. No English ranking beyond anecdotes. No Hong Kong 15 or 20 year list; 东方证券 2008 to 2017 list not retrieved. No Morningstar, FT or Reuters ranking found.
- The 澎湃 20 year top 50 table is an image: ranks 7 to 50 are only partially transcribed here.
- Publication date of the 界面新闻 "274x" article not captured (about 2020).

## 5. Sustainable ROE: what drove it and why so few kept it

### Takeaway
Persistent high ROE in A shares is rare: one 国信证券 study finds only 0.6 percent of A shares had ROE above 15 percent every year from 2010 to 2023, and 数据宝 counts 12 companies with ROE above 15 percent for ten straight years to 2023 (7 with under 10 percent foreign revenue to 2024). The survivors are consumer brands (baijiu, condiments, appliances), a few pharma, light asset software or electronics niches, and one bank, with pricing power, low debt, low capital intensity and high payouts. The failures are cyclicals, SOEs, leveraged and overbuilt sectors, and companies that diluted.

### Cited Findings
Counts and rates:
- 国信金工 (published on Sina, 2024-07-31): across the A share market, companies with ROE above 15 percent in every year from 2010 to 2023 are only 0.6 percent; the share of companies with ROE above 10, 15 and 20 percent for three consecutive years averages 17 percent, 6 percent and 2 percent since 2010; only about 30 percent of stocks in an average year have ROE above 10 percent. Stocks whose ROE is stable earn long run annualised returns close to the average ROE. — [Sina Finance, 国信金工](https://finance.sina.com.cn/roll/2024-07-31/doc-incfysvm9263286.shtml)
- 证券时报·数据宝, 2024-04-03: among stocks listed before 2013 that had reported 2023 annual results (about 1,200 reports in), 12 had weighted ROE above 15 percent for ten consecutive years. Named: 贵州茅台, 招商银行, 美的集团, 海尔智家, 豪迈科技, 宏发股份, 法拉电子, 长春高新, 双汇发展, 恩华药业, 美亚光电 (11 of 12 named in the text; the 12th is in an image). Also 10 stocks with 2023 ROE above 40 percent (石英股份 90.63 percent, 中基健康 72.43 percent, 重庆啤酒 67.05 percent), illustrating cyclical spikes. — [证券时报](https://www.stcn.com/article/detail/1166747.html)
- 数据宝, 2025-04-06: among stocks listed before 2015 with 2024 results, 7 had ROE above 15 percent for ten years and overseas revenue under 10 percent: 贵州茅台, 海天味业, 同花顺, 双汇发展, 中航光电, 晨光股份, 恩华药业. All 7 paid at least 30 percent of 2024 profit as dividends; 5 paid over 60 percent; 6 grew net profit above 10 percent a year over ten years; 同花顺 and 中航光电 above 20 percent a year. — [证券时报](http://stcn.com/article/detail/1641495.html)
- Eastmoney columnist (司马道馆), 2025-06-06: 58 companies had ROE above 15 percent for ten consecutive years to 2024 (63 in 2023; 54 excluding newly listed); 13 for fifteen years; 白酒 5 companies; white goods 4 (格力, 美的); 5 auto parts; 茅台 five year average ROE 32.36 percent, 苏泊尔 30.71 percent, 吉比特 29.06 percent; 招商银行 and 长春高新 dropped out in 2024; 洋河股份 dropped out of the 15 year list. The same author's 2026-05-23 update: 66 qualifying in 2021, 64 in 2022, 63 in 2023, 58 in 2024, 52 in 2025 (period 2016 to 2025). Counts differ from 数据宝 because of definitions (weighted versus diluted ROE, listing date cut off, financial sector). Reliability: columnist, method not documented. — [东方财富财富号, 2025-06-06](https://caifuhao.eastmoney.com/news/20250606100125029912780); [2026-05-23](https://caifuhao.eastmoney.com/news/20260523110405543030440)
- Sina Finance, 2026-05-25 feature on Moutai: only 20 A share companies have maintained ROE above 20 percent since 2009 (a Sina 2024 report); Moutai ROE above 20 percent in 23 of 25 listed years, above 30 percent in 16 years; 2025 ROE 32.53 percent versus 18.32 percent for the food and beverage sector; net margin about 21 percent in 2001, above 40 percent by 2007, about 50 percent since the 2010s; almost no borrowing (interest bearing debt RMB 44 million, cash RMB 51.7 billion at end 2025); difference between ROE and ex items ROE under 0.5 points in 23 of 25 years. — [新浪财经](https://finance.sina.com.cn/wm/2026-05-25/doc-inhzchzm2836312.shtml)
- Overall A share ROE: 2019 to 2021 aggregate recurring ROE was about 8 to 9 percent (广发基金 Wang Ruidong). — [中证网, 2022-11-28](https://www.cs.com.cn/tzjj/jjks/202211/t20221128_6310506.html) [snippet only]. 2025 has about 360 companies with ROE at or above 15 percent in a single year [snippet only, 2026 article: https://www.sfccn.com/2026/5-2/2MMDE1MjBfMjEzODI2MA.html]. 数据宝: 53 A share companies had recurring diluted ROE above 20 percent in Q1 to Q3 2025 [snippet only].
- Danjuan/MSCI cross check: MSCI China implied ROE about 10.6 percent (P/BV 1.38 over trailing P/E 13.03) versus 18.1 percent for MSCI World (Section 3).

What drove it (as stated by sources):
- Industry structure and pricing power: 券商中国 (2021) uses Porter: baijiu has no threat of new entrants (licences, brands, aging), stable structure; all 18 listed baijiu companies were profitable; Moutai average ROE 30 percent since 2001. Pharma and soft drinks similarly. Also Siegel: consumer brands and pharma were the best US sectors 1950 to 2003 (13.4 to 13.8 percent a year). — [澎湃/券商中国](https://m.thepaper.cn/newsDetail_forward_14159850)
- Management and R&D: 恒瑞医药 R&D 17.99 percent of revenue in 2020, expensed rather than capitalised; 万华化学 incentive system. Same source.
- Light assets and high margins: Eastmoney columnist cites 珀莱雅, 爱美客 (beauty), 同花顺 (software) with net margins above 30 percent; 美的 lowest ROE volatility (standard deviation 1.52 percent) due to diversification; the 数据宝 piece lists management, patents, concession rights, first mover or scale advantage, R&D teams as the typical moat. — [东方财富](https://caifuhao.eastmoney.com/news/20250606100125029912780); [证券时报](https://www.stcn.com/article/detail/1166747.html)
- Dividend policy: the 7 stock list all paid more than 30 percent of profit; 茅台 paid 75 percent in 2024 (about RMB 64.7 billion, with a RMB 30 billion special); in the 20 year review, Gree 2014 payout 63.75 percent. — [证券时报](http://stcn.com/article/detail/1641495.html); [中国证券网, 2016](https://www.cs.com.cn/ssgs/gsxw/201602/t20160201_4897411.html)
- Utilities and low cycle: 国信 notes 长江电力 ROE steady around 15 percent versus 兖矿能源 volatile. Hydropower and airport examples named in the brief: I found no study specifically on airports; 长江电力 appears only in this 国信 chart. — [Sina Finance, 国信金工](https://finance.sina.com.cn/roll/2024-07-31/doc-incfysvm9263286.shtml)
- Traditional Chinese medicine: 云南白药, 片仔癀 appear in every since listing list (Section 4C). No ROE data on protected formulas found.
- ROE converts to return: the 14 internal growth ten baggers in the decade to 2019 averaged 18.26 percent ROE; 国信 finds long run stock return approaches average ROE when ROE is stable; Munger "annual return equals ROE if held long enough" is quoted in the 腾讯 piece. — [格隆汇](https://m.gelonghui.com/p/433292)

Why so few kept it:
- Competition and capital attracted to high ROE; ROE mean reverts; cyclical sectors (securities in bull markets 20 to 30 percent, single digit in bears) cannot sustain it. — [东方证券资产管理 / 银行螺丝钉, 2019-06-28](https://www.dfham.com/contents/2019/6/28-a6c98198f77f48e98b5b10eb8627adbd.html); [广发基金 Wang Ruidong, 中证网](https://www.cs.com.cn/tzjj/jjks/202211/t20221128_6310506.html) [snippet only]
- One off gains inflate ROE; use recurring ROE and three year averages (东方证券资产管理 / 螺丝钉).
- Overcapacity, price wars ("involution"), and deflation: AllianceBernstein (Feb 2026) cites poor price discipline, deflation and overcapacity as the reasons for ten years of stagnant EPS; anti involution policy is the 2026 corrective. — [AllianceBernstein](https://www.alliancebernstein.com/corporate/en/insights/investment-insights/china-equities-tracking-the-turn-from-rally-to-resilience.html)
- State ownership: SOE profitability gap (IMF WP 2021/075; Brandeis) and "national service" SOE IPOs (Citi). The 2017 review lists cyclicals and state controlled names with the worst decade returns: 中远海控, 中国铝业, 西部矿业, 云南铜业, 中远海能 (all down more than 80 percent). — [每日经济网, 2017-10-15](https://www.nbd.com.cn/articles/2017-10-15/1154126.html)
- Dilution and leverage: Citi, Pictet (Section 2); banks issuing equity to provision for bad loans (Citi). On leverage, Moutai's no debt balance sheet is the contrast.
- Even the survivors slip: 招商银行 and 长春高新 dropped out of the ten year list and 洋河股份 out of the fifteen year list in 2024 (东方财富 columnist). I found no source on a baijiu or staples de rating in 2021 to 2024.

### Inferences
- With only 12 firms (数据宝) or 58 (columnist) of roughly 5,000 listed companies meeting a ten year ROE above 15 percent hurdle, a stock screen that requires sustained high ROE will have a very small universe, concentrated in consumer staples, appliances, pharma and a few industrial niches.
- The numerical claim in the brief (share of A share companies with ROE above 15 percent for ten consecutive years): the closest published statistics are 0.6 percent (2010 to 2023 every year above 15 percent, 国信), 12 names for the 2013 listed cohort to 2023 (数据宝), and 58 names to 2024 (columnist). The denominator for the 12 and 58 counts is not stated in the sources; 12 of roughly 1,968 companies listed more than ten years at Dec 2019 would be about 0.6 percent, consistent with the 国信 estimate, but that ratio is my arithmetic and mixes dates.
- Dividend payout, low debt and high net margin appear together in every survivor profile (茅台, 海天, 双汇, 同花顺), which suggests that ROE persistence is as much about not reinvesting at falling returns (paying out) as about the moat.

### Gaps
- No academic study located on persistence of ROE in Chinese listed firms with a quantified decay rate. The IMF and Brandeis papers are about SOE versus non SOE profitability, not ten year persistence.
- No data on airports and hydropower ROE other than 长江电力 around 15 percent (国信 chart); no study on traditional Chinese medicine ROE.
- The 12th company of the 数据宝 list, and the full list of 58 companies, were not captured (images).
- 2025 and 2026 data on whether consumer staples ROE held up (茅台 2025 ROE 32.53 percent is sourced; others are not).

# Fundamentals prefetch: business models and 20-year ROE of the Chinese long-term compounders

Scope note: latest figures are fiscal year 2025 annual reports (published March to April 2026) unless stated; data pulled 2026-10-21. All downloads are untrusted third-party aggregator data; nothing below was checked against the cninfo/HKEX PDFs, except where a press article is cited. The ROE table is also saved at `/home/user/Sample_R/research_notes/Chinese stock compounders 20 years/roe_prefetch.csv` (560 rows: company, ticker, year, value, definition, source URL, alternative value, note).

## 1. Which companies qualify (listed before October 2006), including Midea and Shuanghui

### Takeaway
All 20 listed A-share names, Midea, Shuanghui, the five Hong Kong names (Ping An through its H shares) and NetEase were listed before October 2006 (the only exception to a pre-2006 A-share listing is Ping An A shares, March 2007, and BYD A shares, 2011). Midea Group (000333) has a continuous listed history through Midea Electric (000527, listed 12 Nov 1993, absorbed on 18 Sep 2013), so it qualifies using 000527 data for 2006 to 2012. Henan Shuanghui (000895, listed Dec 1998) qualifies on listing date, but it is the listed subsidiary of WH Group (about 70.3% owned), not its parent; WH Group (0288) itself listed in 2014 and does not qualify.

### Cited Findings
- Kweichow Moutai 600519.SH: listed 2001-08-27 — [Eastmoney company profile 600519](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600519.SH"%29)
- Wuliangye 000858.SZ: listed 1998-04-27 — [Eastmoney company profile 000858](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000858.SZ"%29)
- Luzhou Laojiao 000568.SZ: listed 1994-05-09 — [Eastmoney company profile 000568](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000568.SZ"%29)
- Shanxi Fenjiu 600809.SH: listed 1994-01-06 — [Eastmoney company profile 600809](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600809.SH"%29)
- Anhui Gujing 000596.SZ: listed 1996-09-27 — [Eastmoney company profile 000596](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000596.SZ"%29)
- Yili 600887.SH: listed 1996-03-12 — [Eastmoney company profile 600887](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600887.SH"%29)
- Gree Electric 000651.SZ: listed 1996-11-18 — [Eastmoney company profile 000651](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000651.SZ"%29)
- Haier Smart Home 600690.SH: listed 1993-11-19 — [Eastmoney company profile 600690](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600690.SH"%29)
- Fuyao Glass 600660.SH: listed 1993-06-10 — [Eastmoney company profile 600660](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600660.SH"%29)
- Jiangsu Hengrui 600276.SH: listed 2000-10-18 — [Eastmoney company profile 600276](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600276.SH"%29)
- Pien Tze Huang 600436.SH: listed 2003-06-16 — [Eastmoney company profile 600436](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600436.SH"%29)
- Yunnan Baiyao 000538.SZ: listed 1993-12-15 — [Eastmoney company profile 000538](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000538.SZ"%29)
- China Merchants Bank 600036.SH: listed 2002-04-09 — [Eastmoney company profile 600036](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600036.SH"%29)
- China Yangtze Power 600900.SH: listed 2003-11-18 — [Eastmoney company profile 600900](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600900.SH"%29)
- Shanghai Intl Airport 600009.SH: listed 1998-02-18 — [Eastmoney company profile 600009](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600009.SH"%29)
- Sany Heavy 600031.SH: listed 2003-07-03 — [Eastmoney company profile 600031](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600031.SH"%29)
- Wanhua Chemical 600309.SH: listed 2001-01-05 — [Eastmoney company profile 600309](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600309.SH"%29)
- Anhui Conch 600585.SH: listed 2002-02-07 — [Eastmoney company profile 600585](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600585.SH"%29)
- Hualan Biological 002007.SZ: listed 2004-06-25 — [Eastmoney company profile 002007](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="002007.SZ"%29)
- Yutong Bus 600066.SH: listed 1997-05-08 — [Eastmoney company profile 600066](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600066.SH"%29)
- Midea Group 000333.SZ: listed 2013-09-18 (as 000333); predecessor 000527 listed 1993-11-12 — [Eastmoney company profile 000333](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000333.SZ"%29)
- Henan Shuanghui (WH Group sub) 000895.SZ: listed 1998-12-10 — [Eastmoney company profile 000895](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000895.SZ"%29)
- Ping An 601318.SH: listed 2007-03-01 (A); H shares 2004-06-24 — [Eastmoney company profile 601318](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="601318.SH"%29)
- Tencent 0700 listed 2004-06-16; Ping An 2318 H shares 2004-06-24 (A shares 2007-03-01); Shenzhou 2313 2005-11-24; BYD 1211 H shares 2002-07-31 (A shares 002594 2011-06-30); Hengan 1044 1998-12-08 — [Eastmoney HK security info 00700](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_INFO_SECURITYINFO&columns=ALL&filter=%28SECURITY_CODE="00700"%29), same report for codes 02318, 02313, 01211, 01044
- NetEase (NTES) files Form 20-F with the SEC, with 20-F filings listed from 2002 onward, so it was listed before October 2006; its Hong Kong secondary listing (9999) is 2020-06-11 and is irrelevant to the ROE history — [SEC EDGAR submissions](https://data.sec.gov/submissions/CIK0001110646.json); [Eastmoney HK security info 09999](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_INFO_SECURITYINFO&columns=ALL&filter=%28SECURITY_CODE="09999"%29)
- Midea Group completed its absorption merger of Guangdong Midea Electric (000527) on 2013-09-18 and took ticker 000333; swap ratio 0.3447 Midea Group shares per Midea Electric share; 000527 was suspended from 2013-08-15 and delisted on 2013-09-18; Midea Electric had listed on the Shenzhen exchange in 1993 — [SZSE merger announcement (Aug 2013)](https://disc.static.szse.cn/disc/disk01/finalpage/2013-08-12/635b9f86-65f4-4720-88f2-42657c93acfe.PDF); [SZSE release on 000527](https://szse.io/releases/000527/63073801-announcement-on-midea-group-co-ltd-s-share)
- Eastmoney names Midea Electric 000527 formerly 粤美的A (Guangdong Midea), listed 1993-11-12, and Midea Group 000333 listed 2013-09-18 — [Eastmoney company profile 000527](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000527.SZ"%29); [Eastmoney company profile 000333](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000333.SZ"%29)
- WH Group indirectly owns about 70.33% of Shuanghui Development (000895) per an October 2025 announcement; WH Group controls Shuanghui, which was listed in 1998 — [WH Group announcement (HKEX, Oct 2025)](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1028/2025102801696.pdf); [Wikipedia WH Group](https://en.wikipedia.org/wiki/WH_Group)
- WH Group (0288) listing date 2014-08-05 — [Eastmoney HK security info 00288](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_INFO_SECURITYINFO&columns=ALL&filter=%28SECURITY_CODE="00288"%29)
- Wanhua Chemical 600309 was listed as Yantai Wanhua on 2001-01-05; in May 2018 it announced absorbing its controlling shareholder Wanhua Chemical Group (net asset book value RMB 2.11bn, estimated value RMB 52.2bn), which brought the group chemical assets into the listed company — [Eastmoney company profile 600309](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="600309.SH"%29); [CS.com.cn, 10 May 2018](https://cs.com.cn/ssgs/gsxw/201805/t20180510_5797966.html)

### Inferences
- Pre-2013 Midea history is Midea Electric (the refrigeration/air-conditioning appliance arm), not the whole Midea group; the 000333 series for 2006 to 2012 is a merger pro forma and Sina shows only diluted ROE for it. I therefore use 000527 for 2006 to 2012 and 000333 from 2013.
- Shuanghui as an investable "WH Group" proxy qualifies on the listing test only if the screen accepts a 70%-owned subsidiary; flag this to the writer.
- Ping An and BYD have Hong Kong listings before 2006 but A-share listings after; this note uses the H-share era for eligibility and gives both ROE series.

### Gaps
- I did not confirm Midea Electric standalone financials against original annual reports for 2007 and 2008 (see question 2).
- The 2011 restructuring of Yantai Wanhua (injection of the parent MDI assets) was not confirmed from a source; Eastmoney shows revenue jumping from RMB 9.4bn (2010) to 13.7bn (2011) which is consistent with a change in scope, but that is only an observation.
- NetEase Nasdaq IPO date (2000) not sourced here; only 20-F filing history from 2002.

## 2. ROE by year, 2006 to 2025

### Takeaway
Every one of the 28 companies has a full 20-year series with no gaps. Only Kweichow Moutai (20 of 20), Gree (20), Midea (20) and Tencent (20) never fell to 15% or below; Moutai is the only one with a 20-year minimum above 24%. Yangtze Power (8 of 20 above 15%), Shanghai Airport (5), BYD (7) and Ping An (13, minimum 0.7% in 2008) are the weakest long-run record on this test.

### Cited Findings
**Definitions and sources**
- A shares: "Sina" = weighted average ROE (加权平均净资产收益率) as shown for the 31 Dec column of each year's financial indicator page; used as the primary value because it matches the first-published annual figure (verified for Wanhua 2017 and 2018, and Ping An 2022, where the Eastmoney value is a later restated figure). Where Sina shows "--" or 0 (Yili 2016, Conch 2006, and some year-ends) the Eastmoney weighted ROE (ROEJQ) is used. Eastmoney value is kept as the alternative when it differs by more than 0.05 points; differences above 0.6 points are listed below.
- Hong Kong names (Tencent, Shenzhou, BYD, Hengan): Eastmoney HK "ROE_AVG", which equals net profit attributable divided by the average of opening and closing parent equity (I checked Tencent 2025: 224.84 / mean of 973.5 and 1,154.2 = 21.1%). This is computed, not the reported weighted average. For BYD the A-share weighted ROE is kept as alternative; for Ping An the A-share weighted ROE is primary and the HK computed value is the alternative.
- NetEase: computed by me as net income attributable to NetEase over the average of opening and closing NetEase shareholders' equity, US GAAP, RMB. 2009 to 2025 from SEC XBRL facts; 2005 to 2008 equity and 2005 to 2008 net profit from the FY2008 20-F selected data. Cross-check: stockanalysis.com shows 2021 to 2025 ROE of 17.6, 18.5, 24.8, 22.4, 22.6 on its own definition, close to my 19.0, 20.3, 25.7, 22.6, 22.6.
- Source URLs: [Sina page pattern (Moutai 2025)](https://money.finance.sina.com.cn/corp/go.php/vFD_FinancialGuideLine/stockid/600519/ctrl/2025/displaytype/4.phtml) (change stockid and ctrl year); [Eastmoney annual indicators 600519](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=%28SECUCODE="600519.SH"%29%28REPORT_TYPE="年报"%29) (change SECUCODE); [Eastmoney HK indicators 00700](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=%28SECURITY_CODE="00700"%29%28DATE_TYPE_CODE="001"%29); [SEC XBRL companyfacts NetEase](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json); [NetEase FY2008 20-F](https://www.sec.gov/Archives/edgar/data/1110646/000119312509141163/d20f.htm). Per-cell URLs are in the CSV.

**ROE statistics (primary series)**

| Company | Avg 2006-25 | Minimum (year) | Years above 15% | Years with ROE of 15% or below |
|---|---|---|---|---|
| Kweichow Moutai | 33.6 | 24.4 (2016) | 20 of 20 | none |
| Wuliangye | 21.7 | 6.9 (2025) | 17 of 20 | 2006 (15.0), 2015 (14.9), 2025 (6.9) |
| Luzhou Laojiao | 29.2 | 8.0 (2014) | 18 of 20 | 2014 (8.0), 2015 (14.7) |
| Shanxi Fenjiu | 28.6 | 9.3 (2014) | 17 of 20 | 2014 (9.3), 2015 (12.5), 2016 (13.2) |
| Anhui Gujing | 18.5 | 1.6 (2006) | 16 of 20 | 2006 (1.6), 2007 (4.1), 2008 (4.0), 2025 (14.3) |
| Yili | 18.2 | -48.3 (2008) | 17 of 20 | 2006 (14.0), 2007 (-4.3), 2008 (-48.3) |
| Gree Electric | 29.2 | 18.9 (2020) | 20 of 20 | none |
| Haier Smart Home | 19.8 | 5.5 (2006) | 17 of 20 | 2006 (5.5), 2007 (10.3), 2008 (11.7) |
| Fuyao Glass | 21.4 | 7.5 (2008) | 16 of 20 | 2008 (7.5), 2019 (14.1), 2020 (12.1), 2021 (13.0) |
| Jiangsu Hengrui | 20.8 | 10.9 (2022) | 15 of 20 | 2021 (14.0), 2022 (10.9), 2023 (11.0), 2024 (14.7), 2025 (14.3) |
| Pien Tze Huang | 20.6 | 14.2 (2006) | 18 of 20 | 2006 (14.2), 2025 (14.8) |
| Yunnan Baiyao | 19.3 | 7.6 (2021) | 13 of 20 | 2019 (10.3), 2020 (14.5), 2021 (7.6), 2022 (7.9), 2023 (10.5), 2024 (12.0), 2025 (13.0) |
| China Merchants Bank | 19.1 | 13.4 (2025) | 18 of 20 | 2024 (14.5), 2025 (13.4) |
| China Yangtze Power | 14.2 | 10.0 (2008) | 8 of 20 | 2008 (10.0), 2009 (10.2), 2010 (12.8), 2011 (11.5), 2012 (14.5), 2013 (11.9), 2014 (14.5), 2015 (13.6), 2019 (14.8), 2021 (14.9), 2022 (11.7), 2023 (13.5) |
| Shanghai Intl Airport | 8.3 | -8.2 (2022) | 5 of 20 | 2008 (7.2), 2009 (5.6), 2010 (9.7), 2011 (10.2), 2012 (10.0), 2013 (11.4), 2014 (11.8), 2015 (13.1), 2016 (13.2), 2020 (-4.1), 2021 (-6.0), 2022 (-8.2), 2023 (2.3), 2024 (4.7), 2025 (5.0) |
| Sany Heavy | 20.8 | 0.6 (2015) | 11 of 20 | 2013 (12.2), 2014 (3.0), 2015 (0.6), 2016 (0.9), 2017 (8.7), 2022 (6.7), 2023 (6.8), 2024 (8.5), 2025 (11.2) |
| Wanhua Chemical | 28.8 | 12.4 (2025) | 17 of 20 | 2015 (14.7), 2024 (14.3), 2025 (12.4) |
| Anhui Conch | 16.9 | 4.1 (2024) | 11 of 20 | 2008 (13.8), 2009 (13.2), 2012 (13.5), 2015 (11.0), 2016 (11.6), 2022 (8.5), 2023 (5.7), 2024 (4.1), 2025 (4.3) |
| Hualan Biological | 18.7 | 8.2 (2025) | 14 of 20 | 2006 (14.8), 2012 (12.1), 2022 (11.1), 2023 (13.7), 2024 (9.4), 2025 (8.2) |
| Yutong Bus | 22.5 | 3.1 (2020) | 14 of 20 | 2018 (14.3), 2019 (11.3), 2020 (3.1), 2021 (4.1), 2022 (5.2), 2023 (13.0) |
| Midea Group | 24.3 | 15.5 (2006) | 20 of 20 | none |
| Henan Shuanghui (WH Group sub) | 28.2 | 14.9 (2011) | 19 of 20 | 2011 (14.9) |
| Ping An | 15.8 | 0.7 (2008) | 13 of 20 | 2008 (0.7), 2012 (13.8), 2021 (13.0), 2022 (10.1), 2023 (9.7), 2024 (13.8), 2025 (14.0) |
| Tencent | 32.0 | 15.1 (2023) | 20 of 20 | none |
| Shenzhou International | 21.2 | 12.3 (2021) | 18 of 20 | 2021 (12.3), 2023 (14.3) |
| BYD | 11.8 | 0.4 (2012) | 7 of 20 | 2008 (9.3), 2010 (14.4), 2011 (7.0), 2012 (0.4), 2013 (2.6), 2014 (1.8), 2015 (9.8), 2016 (12.1), 2017 (7.7), 2018 (5.0), 2019 (2.9), 2020 (7.5), 2021 (4.0) |
| Hengan | 21.5 | 10.0 (2022) | 16 of 20 | 2022 (10.0), 2023 (14.0), 2024 (11.1), 2025 (11.9) |
| NetEase | 27.2 | 13.5 (2018) | 19 of 20 | 2018 (13.5) |

Annual series (percent, 2006 to 2025; primary value as defined above):

- Kweichow Moutai: 06:27.7 07:39.3 08:39.0 09:33.5 10:30.9 11:40.4 12:45.0 13:39.4 14:32.0 15:26.2 16:24.4 17:33.0 18:34.5 19:33.1 20:31.4 21:29.9 22:30.3 23:34.2 24:36.0 25:32.5
- Wuliangye: 06:15.0 07:16.5 08:17.3 09:24.9 10:26.7 11:30.0 12:36.8 13:23.7 14:15.4 15:14.9 16:15.0 17:19.4 18:22.8 19:25.3 20:24.9 21:25.3 22:25.3 23:25.1 24:23.4 25:6.9
- Luzhou Laojiao: 06:19.4 07:31.7 08:41.5 09:38.8 10:41.2 11:41.7 12:46.9 13:33.1 14:8.0 15:14.7 16:17.8 17:20.3 18:21.8 19:25.5 20:28.3 21:31.1 22:33.3 23:35.1 24:30.4 25:22.7
- Shanxi Fenjiu: 06:25.3 07:30.2 08:17.9 09:23.0 10:27.6 11:34.5 12:44.1 13:25.6 14:9.3 15:12.5 16:13.2 17:19.0 18:25.1 19:27.4 20:35.1 21:42.0 22:44.7 23:43.1 24:39.7 25:33.5
- Anhui Gujing: 06:1.6 07:4.1 08:4.0 09:16.9 10:34.2 11:31.6 12:23.8 13:17.5 14:15.1 15:15.9 16:15.9 17:19.1 18:24.0 19:25.6 20:19.5 21:21.2 22:17.9 23:22.9 24:23.9 25:14.3
- Yili: 06:14.0 07:-4.3 08:-48.3 09:20.8 10:20.3 11:35.3 12:26.0 13:23.1 14:23.7 15:23.9 16:26.6 17:25.2 18:24.3 19:26.4 20:25.2 21:25.6 22:19.2 23:20.2 24:15.8 25:20.9
- Gree Electric: 06:21.9 07:31.9 08:32.1 09:33.5 10:36.5 11:34.0 12:31.4 13:35.8 14:35.2 15:27.3 16:30.4 17:37.4 18:33.4 19:25.7 20:18.9 21:21.3 22:24.2 23:26.5 24:25.4 25:20.3
- Haier Smart Home: 06:5.5 07:10.3 08:11.7 09:15.8 10:24.3 11:31.3 12:33.8 13:32.8 14:27.6 15:16.2 16:20.4 17:23.6 18:21.0 19:19.1 20:17.7 21:17.3 22:16.8 23:16.9 24:17.7 25:17.0
- Fuyao Glass: 06:24.1 07:28.7 08:7.5 09:29.2 10:35.6 11:26.3 12:23.1 13:26.1 14:27.1 15:18.9 16:18.6 17:17.2 18:20.8 19:14.1 20:12.1 21:13.0 22:17.6 23:19.0 24:22.7 25:25.6
- Jiangsu Hengrui: 06:17.6 07:28.2 08:22.9 09:28.6 10:24.4 11:23.1 12:22.9 13:21.2 14:21.3 15:24.4 16:23.2 17:23.3 18:23.6 19:24.0 20:22.5 21:14.0 22:10.9 23:11.0 24:14.7 25:14.3
- Pien Tze Huang: 06:14.2 07:15.4 08:18.9 09:17.2 10:22.2 11:22.9 12:27.5 13:21.9 14:16.8 15:15.4 16:16.2 17:21.2 18:25.0 19:23.6 20:23.1 21:27.7 22:23.5 23:22.6 24:21.4 25:14.8
- Yunnan Baiyao: 06:29.3 07:28.2 08:29.4 09:18.0 10:23.1 11:24.3 12:25.2 13:28.9 14:24.9 15:22.4 16:20.0 17:18.6 18:17.4 19:10.3 20:14.5 21:7.6 22:7.9 23:10.5 24:12.0 25:13.0
- China Merchants Bank: 06:17.5 07:24.8 08:27.4 09:21.2 10:21.8 11:24.2 12:24.8 13:23.1 14:19.3 15:17.1 16:16.3 17:16.5 18:16.6 19:16.8 20:15.7 21:17.0 22:17.1 23:16.2 24:14.5 25:13.4
- China Yangtze Power: 06:15.6 07:15.2 08:10.0 09:10.2 10:12.8 11:11.5 12:14.5 13:11.9 14:14.5 15:13.6 16:16.9 17:16.9 18:16.3 19:14.8 20:16.7 21:14.9 22:11.7 23:13.5 24:15.7 25:15.9
- Shanghai Intl Airport: 06:15.6 07:15.6 08:7.2 09:5.6 10:9.7 11:10.2 12:10.0 13:11.4 14:11.8 15:13.1 16:13.2 17:15.5 18:15.8 19:16.7 20:-4.1 21:-6.0 22:-8.2 23:2.3 24:4.7 25:5.0
- Sany Heavy: 06:23.7 07:43.5 08:23.3 09:29.4 10:54.7 11:56.0 12:26.6 13:12.2 14:3.0 15:0.6 16:0.9 17:8.7 18:21.4 19:28.7 20:29.6 21:19.9 22:6.7 23:6.8 24:8.5 25:11.2
- Wanhua Chemical: 06:38.8 07:45.7 08:35.7 09:22.6 10:27.7 11:27.9 12:31.0 13:32.6 14:24.2 15:14.7 16:28.1 17:50.7 18:36.8 19:25.4 20:22.2 21:42.5 22:22.8 23:20.4 24:14.3 25:12.4
- Anhui Conch: 06:22.6 07:26.4 08:13.8 09:13.2 10:19.4 11:29.1 12:13.5 13:18.1 14:18.5 15:11.0 16:11.6 17:19.1 18:29.7 19:27.0 20:23.6 21:19.2 22:8.5 23:5.7 24:4.1 25:4.3
- Hualan Biological: 06:14.8 07:19.8 08:22.1 09:43.3 10:32.1 11:16.3 12:12.1 13:16.9 14:16.7 15:16.7 16:19.9 17:18.5 18:22.4 19:19.9 20:23.4 21:16.5 22:11.1 23:13.7 24:9.4 25:8.2
- Yutong Bus: 06:18.2 07:19.2 08:27.7 09:29.3 10:37.7 11:40.6 12:25.9 13:22.8 14:25.5 15:30.2 16:31.2 17:22.1 18:14.3 19:11.3 20:3.1 21:4.1 22:5.2 23:13.0 24:30.9 25:38.0
- Midea Group: 06:15.5 07:29.8 08:21.2 09:28.7 10:29.5 11:21.1 12:16.7 13:24.9 14:29.5 15:29.1 16:26.9 17:25.9 18:25.7 19:26.4 20:24.9 21:24.1 22:22.2 23:22.2 24:21.3 25:19.7
- Henan Shuanghui (WH Group sub): 06:24.8 07:26.7 08:31.7 09:35.0 10:34.2 11:14.9 12:27.9 13:30.4 14:28.6 15:27.2 16:28.3 17:31.4 18:34.1 19:37.4 20:32.9 21:21.8 22:25.4 23:23.8 24:23.8 25:24.1
- Ping An: 06:17.3 07:16.9 08:0.7 09:18.5 10:17.3 11:16.0 12:13.8 13:16.4 14:18.2 15:17.1 16:17.4 17:20.7 18:20.9 19:24.4 20:20.0 21:13.0 22:10.1 23:9.7 24:13.8 25:14.0
- Tencent: 06:32.0 07:35.2 08:45.7 09:53.7 10:47.5 11:40.6 12:36.5 13:31.2 14:34.5 15:28.8 16:27.9 17:33.2 18:27.2 19:24.7 20:28.1 21:29.8 22:24.6 23:15.1 24:21.8 25:21.1
- Shenzhou International: 06:20.7 07:18.0 08:26.2 09:37.1 10:29.3 11:31.3 12:22.9 13:19.6 14:18.7 15:18.9 16:20.9 17:21.7 18:21.7 19:21.5 20:19.5 21:12.3 22:15.6 23:14.3 24:18.2 25:15.9
- BYD: 06:23.6 07:20.1 08:9.3 09:27.1 10:14.4 11:7.0 12:0.4 13:2.6 14:1.8 15:9.8 16:12.1 17:7.7 18:5.0 19:2.9 20:7.5 21:4.0 22:16.1 23:24.0 24:24.8 25:15.1
- Hengan: 06:27.2 07:24.2 08:22.7 09:27.3 10:25.0 11:23.2 12:26.6 13:24.3 14:22.9 15:23.1 16:24.4 17:24.6 18:23.1 19:22.6 20:24.6 21:17.0 22:10.0 23:14.0 24:11.1 25:11.9
- NetEase: 06:46.9 07:40.1 08:35.8 09:28.6 10:26.0 11:28.3 12:25.3 13:24.7 14:21.8 15:25.6 16:34.4 17:25.5 18:13.5 19:39.8 20:16.8 21:19.0 22:20.3 23:25.7 24:22.6 25:22.6

Years where the alternative source differs by more than 0.6 points (primary / alternative), from the CSV:

| Company | Year | Primary | Alternative | Alternative source |
|---|---|---|---|---|
| Luzhou Laojiao | 2014 | 7.99 | 8.65 | Eastmoney |
| Yili | 2006 | 14.02 | 13.38 | Eastmoney |
| Yili | 2007 | -4.35 | -0.77 | Eastmoney |
| Gree Electric | 2008 | 32.13 | 30.36 | Eastmoney |
| Haier Smart Home | 2009 | 15.83 | 19.24 | Eastmoney |
| Haier Smart Home | 2014 | 27.58 | 29.34 | Eastmoney |
| Haier Smart Home | 2017 | 23.59 | 22.89 | Eastmoney |
| Pien Tze Huang | 2012 | 27.47 | 28.84 | Eastmoney |
| Pien Tze Huang | 2013 | 21.92 | 23.74 | Eastmoney |
| Yunnan Baiyao | 2007 | 28.18 | 25.91 | Eastmoney |
| Yunnan Baiyao | 2017 | 18.55 | 7.92 | Eastmoney |
| Yunnan Baiyao | 2018 | 17.37 | 9.06 | Eastmoney |
| China Merchants Bank | 2006 | 17.52 | 18.49 | Eastmoney |
| China Yangtze Power | 2014 | 14.47 | 16.30 | Eastmoney |
| China Yangtze Power | 2015 | 13.58 | 15.56 | Eastmoney |
| China Yangtze Power | 2022 | 11.73 | 9.32 | Eastmoney |
| Shanghai Intl Airport | 2021 | -6.03 | -4.12 | Eastmoney |
| Sany Heavy | 2008 | 23.30 | 21.73 | Eastmoney |
| Sany Heavy | 2009 | 29.37 | 34.09 | Eastmoney |
| Sany Heavy | 2019 | 28.71 | 27.16 | Eastmoney |
| Wanhua Chemical | 2008 | 35.74 | 36.63 | Eastmoney |
| Wanhua Chemical | 2017 | 50.66 | 85.88 | Eastmoney |
| Wanhua Chemical | 2018 | 36.82 | 50.83 | Eastmoney |
| Anhui Conch | 2006 | 22.60 | 0.00 | Sina |
| Yutong Bus | 2007 | 19.25 | 16.32 | Eastmoney |
| Yutong Bus | 2012 | 25.86 | 30.50 | Eastmoney |
| Yutong Bus | 2013 | 22.80 | 26.38 | Eastmoney |
| Midea Group | 2007 | 29.82 | 21.04 | Eastmoney |
| Midea Group | 2008 | 21.19 | 28.81 | Eastmoney |
| Henan Shuanghui (WH Group sub) | 2009 | 34.96 | 34.13 | Eastmoney |
| Henan Shuanghui (WH Group sub) | 2010 | 34.23 | 35.43 | Eastmoney |
| Henan Shuanghui (WH Group sub) | 2017 | 31.40 | 35.62 | Eastmoney |
| Henan Shuanghui (WH Group sub) | 2018 | 34.06 | 38.84 | Eastmoney |
| Ping An | 2006 | 17.30 | 19.75 | 2318.HK computed ROE_AVG (Eastmoney HK); differs by definition (avg equity) |
| Ping An | 2007 | 16.90 | 23.63 | 2318.HK computed ROE_AVG (Eastmoney HK); differs by definition (avg equity) |
| Ping An | 2014 | 18.25 | 16.63 | 2318.HK computed ROE_AVG (Eastmoney HK); differs by definition (avg equity) |
| BYD | 2016 | 12.09 | 12.91 | A-share 002594 weighted ROE (Sina/Eastmoney) |
| BYD | 2024 | 24.84 | 26.05 | A-share 002594 weighted ROE (Sina/Eastmoney) |

### Inferences
- Where Eastmoney and Sina disagree, Eastmoney is consistently the later restated figure (Wanhua 2017: Sina 50.7 vs Eastmoney 85.9; Wanhua 2018: 36.8 vs 50.8; Yunnan Baiyao 2017: 18.6 vs 7.9 and 2018: 17.4 vs 9.1; Ping An 2022: 10.1 vs 13.2). This is consistent with common-control mergers (Wanhua 2019, Yunnan Baiyao 2019) and with IFRS 17 (Ping An 2022) rewriting history, but I did not read the restatement notes.
- Yunnan Baiyao and Wanhua look materially different on first-published versus restated numbers; the writer should state which basis is used. First-published is the better test of what an investor could have seen at the time.
- Values within 0.1 of 15% (Wuliangye 2006 at 14.99, 2015 at 14.9, 2016 at 15.01) are borderline; the "above 15%" count treats 2016 as above and 2006 as below.
- Midea 2006 to 2012 uses Midea Electric; Midea Group's 2013 onward weighted ROE has never been below 19.7%.

### Gaps
- Midea Electric 2007 and 2008: Sina 29.8 and 21.2 versus Eastmoney 21.0 and 28.8; Eastmoney 2008 equals its 2009 value (28.81), which looks like a duplicate. Primary values use Sina; unresolved without the 2007 and 2008 annual reports.
- Eastmoney or Sina could be wrong for any individual year; I did not open cninfo annual-report PDFs. Of 460 A-share year cells, 75 differ by more than 0.05 points between Sina and Eastmoney and 36 by more than 0.6 points (that count includes Ping An's HK-basis alternative); treat the remaining roughly 92% as cross-confirmed by two aggregators, not by the filings.
- HK ROE_AVG is computed on average equity, so it is not directly comparable to the A-share weighted ROE (which weights equity changes by months outstanding). The Ping An HK vs A difference is small (2025: 14.0 vs 14.0) except 2008 (0.3 vs 0.7) and 2022 (10.0 vs 10.1).
- Bank and insurer ROE (CMB, Ping An) is on common equity after preferred dividends where applicable; I did not check this.

## 3. DuPont split of FY2025 ROE

### Takeaway
Moutai's ROE comes from a 48% net margin on a thin 1.19x leverage; Gree, Yili, Midea, Haier and Wanhua use 2.5x to 3.1x leverage on 6% to 17% margins; banks and insurers run 11x to 14x leverage on 1% to 1.2% asset returns. BYD's 15.1% is 4.1% margin, 0.97 turnover and 3.9x leverage, the most leverage-dependent of the non-financials.

### Cited Findings
Method (A shares): net margin = attributable net profit / total operating revenue (computed from Eastmoney FY2025 values); asset turnover = Eastmoney total asset turnover (revenue over average total assets); ROA = margin x turnover; implied leverage = reported weighted ROE / that ROA, so it also absorbs minorities and the weighted-average equity basis. Hong Kong names and NetEase are computed exactly: margin = attributable profit / revenue, turnover = revenue / average assets, leverage = average assets / average parent equity, product = ROE_AVG. Sources: [Eastmoney annual indicators 600519](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=%28SECUCODE="600519.SH"%29%28REPORT_TYPE="年报"%29) (per code), [Eastmoney HK indicators 00700](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=%28SECURITY_CODE="00700"%29%28DATE_TYPE_CODE="001"%29), [NetEase XBRL](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json).

| Company | FY2025 ROE | Net margin | Asset turnover (x) | ROA | Leverage (x) | Revenue (RMB bn) | Attrib. net profit (RMB bn) |
|---|---|---|---|---|---|---|---|
| Kweichow Moutai | 32.5% | 47.8% | 0.571 | 27.3% | 1.19 | 172.1 | 82.32 |
| Wuliangye | 6.9% | 22.1% | 0.214 | 4.7% | 1.46 | 40.5 | 8.95 |
| Luzhou Laojiao | 22.7% | 42.1% | 0.387 | 16.3% | 1.39 | 25.7 | 10.83 |
| Shanxi Fenjiu | 33.5% | 31.6% | 0.705 | 22.3% | 1.5 | 38.7 | 12.25 |
| Anhui Gujing | 14.3% | 18.8% | 0.478 | 9.0% | 1.58 | 18.8 | 3.55 |
| Yili | 20.9% | 10.0% | 0.758 | 7.6% | 2.76 | 115.9 | 11.57 |
| Gree Electric | 20.3% | 16.9% | 0.451 | 7.6% | 2.66 | 171.1 | 29.0 |
| Haier Smart Home | 17.0% | 6.5% | 1.031 | 6.7% | 2.55 | 302.3 | 19.55 |
| Fuyao Glass | 25.6% | 20.3% | 0.687 | 14.0% | 1.83 | 45.8 | 9.31 |
| Jiangsu Hengrui | 14.3% | 24.4% | 0.527 | 12.9% | 1.11 | 31.6 | 7.71 |
| Pien Tze Huang | 14.8% | 24.0% | 0.513 | 12.3% | 1.21 | 9.0 | 2.16 |
| Yunnan Baiyao | 13.0% | 12.5% | 0.769 | 9.6% | 1.35 | 41.2 | 5.15 |
| China Merchants Bank | 13.4% | 44.5% | 0.027 | 1.2% | 11.29 | 337.5 | 150.18 |
| China Yangtze Power | 15.9% | 40.0% | 0.153 | 6.1% | 2.59 | 86.2 | 34.5 |
| Shanghai Intl Airport | 5.0% | 15.9% | 0.188 | 3.0% | 1.68 | 13.3 | 2.12 |
| Sany Heavy | 11.2% | 9.4% | 0.551 | 5.2% | 2.16 | 89.7 | 8.41 |
| Wanhua Chemical | 12.4% | 6.2% | 0.659 | 4.1% | 3.06 | 203.2 | 12.53 |
| Anhui Conch | 4.3% | 9.8% | 0.323 | 3.2% | 1.35 | 82.5 | 8.11 |
| Hualan Biological | 8.2% | 20.5% | 0.291 | 6.0% | 1.37 | 4.6 | 0.94 |
| Yutong Bus | 38.0% | 13.4% | 1.272 | 17.1% | 2.23 | 41.4 | 5.55 |
| Midea Group | 19.7% | 9.6% | 0.756 | 7.2% | 2.72 | 458.5 | 43.95 |
| Henan Shuanghui (WH Group sub) | 24.1% | 8.6% | 1.55 | 13.3% | 1.81 | 59.5 | 5.1 |
| Ping An | 14.0% | 12.8% | 0.078 | 1.0% | 13.95 | 1050.5 | 134.78 |
| Tencent | 21.1% | 29.9% | 0.394 | 11.8% | 1.8 | 751.8 | 224.84 |
| Shenzhou International | 15.9% | 18.8% | 0.563 | 10.6% | 1.5 | 31.0 | 5.83 |
| BYD | 15.1% | 4.1% | 0.965 | 3.9% | 3.86 | 804.0 | 32.62 |
| Hengan | 11.9% | 11.0% | 0.556 | 6.1% | 1.94 | 23.1 | 2.54 |
| NetEase | 22.6% | 30.0% | 0.54 | 16.2% | 1.4 | 112.6 | 33.76 |

Notes: Ping An on the HK-report basis: net margin 11.8%, turnover 0.085, leverage 13.9x, product 14.0%. For the two banks and insurers, "revenue" is total operating income and turnover is a mechanical ratio. Wuliangye FY2025 includes an accounting correction (see question 4). Moutai, FY2025 on stockanalysis.com's own basis: ROE 34.4%, ROA 23.0%, asset turnover 0.56 — [stockanalysis Moutai ratios](https://stockanalysis.com/quote/sha/600519/financials/ratios/).

### Inferences
- Three ROE engines: (a) margin-led with little leverage (Moutai, Luzhou, Fenjiu, Gujing, Hengrui, Pien Tze Huang, Tencent, NetEase, Fuyao); (b) higher leverage (Gree 2.7x, Midea 2.7x, Haier 2.6x, Yili 2.8x, Wanhua 3.1x); (c) turnover-led (Yutong 1.27x, Shuanghui 1.55x, Haier 1.03x).
- The leverage figures are total assets over equity; I did not analyse what the liabilities are (payables, customer deposits or borrowings), so the source of Gree and Midea leverage is unexamined.

### Gaps
- Interest-bearing debt versus operating liabilities is not separated; leverage here is total assets over equity.
- Eastmoney revenue for Gree includes "other" lines (9.8% of revenue); the margin could differ slightly on a main-business basis.

## 4. Business models, revenue mix and moat evidence

### Takeaway
Spirits (Moutai, Wuliangye, Luzhou, Fenjiu, Gujing) combine 75% to 91% gross margins with near-zero leverage; consumer durables and food (Gree, Midea, Haier, Yili, Shuanghui) earn lower margins on high asset turnover and customer-funded balance sheets; the infrastructure names (Yangtze Power, Shanghai Airport, Conch, CMB) depend on regulation, concession economics and credit cycles. Pricing-power evidence is documented for Moutai only; for most others I found price-increase evidence absent or indirect.

### Cited Findings

**Kweichow Moutai** (600519.SH)
- Core product: Moutai baijiu (sauce-aroma) 86.8% of FY2025 revenue, other series liquors 13.2%; domestic 97.1%, overseas 2.9%; gross margin 91.2%; debt/assets 16.4% — [Eastmoney FY2025 segment data 600519](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600519.SH"%29%28REPORT_DATE='2025-12-31'%29)
- Sales channels FY2025: direct sales RMB 84.5bn vs wholesale agents RMB 84.2bn (direct about 50% of revenue, first time above wholesale); i-Moutai app sales RMB 13.0bn, down 34.9% — [Sina Finance](https://cj.sina.com.cn/articles/view/5993531560/1653e08a802001ku30); [36Kr](https://www.36kr.com/p/3770348991578889)
- Pricing power: ex-factory price of 53% Feitian raised from RMB 819 to 969 on 1 Jan 2018 (about 18%), and about 20% on 1 Nov 2023 (to about RMB 1,163 per the press); a report counts nine ex-factory price rises since listing, none below 15% until a 2026 rise of RMB 100 (under 9%) — [SFCCN, Nov 2023](https://www.sfccn.com/2023/11-1/xOMDE0NzBfMTg3MjExOQ.html); [Sina Finance, Nov 2023](https://finance.sina.cn/2023-11-01/detail-imztanss6797880.d.html); [Huxiu](https://www.huxiu.com/article/2256414.html)
- Dividends: press reports payout 84%, 75% and 79% for 2023 to 2025 (cash dividend totals RMB 62.8bn, 64.7bn, 65.0bn); my declaration-basis calculation gives 52% for FY2023 (final dividend only) and 75% and 79% for FY2024 and FY2025 — [The Paper](https://www.thepaper.cn/newsDetail_forward_32988235); [Eastmoney dividend history 600519](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600519"%29)
- FY2025 revenue RMB 172.05bn, attributable profit RMB 82.32bn (Eastmoney); 2025 sales of Moutai liquor RMB 146.5bn (+0.4%), other series RMB 22.3bn (-9.8%) — [The Paper](https://m.thepaper.cn/newsDetail_forward_32995848)
- ROE engine FY2025 (weighted ROE 32.5%): attributable net margin 47.8%, asset turnover 0.571x, leverage 1.19x; gross margin 91%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 47%, 2021 to 2025 average 62%, FY2025 79% — [Eastmoney dividend history 600519](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600519"%29)

**Wuliangye** (000858.SZ)
- Core product: Wuliangye baijiu (Puwu, 1618 and others) 91.6% of FY2025 revenue (gross margin 83.8%), non-liquor products 8.4% (gross margin 10.2%); regions: south 44.0%, east 31.7%, north 15.9% — [Eastmoney FY2025 segment data 000858](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000858.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025: revenue RMB 40.5bn (-54.6%), attributable profit RMB 8.95bn (-71.9%); the annual report restated the first three quarters of 2025 (revenue from RMB 60.9bn to 30.6bn, profit from RMB 21.5bn to 6.5bn) after changing revenue recognition on some businesses; management cites deep adjustment of the liquor industry, falling volume and channel destocking — [Sina News, 1 May 2026](https://news.sina.cn/gn/2026-05-01/detail-inhwkcck5651694.d.html); [Eastmoney, 1 May 2026](https://finance.eastmoney.com/a/202605013727071671.html)
- Q1 2026 revenue RMB 22.8bn (+33.7%), profit RMB 8.06bn (+82.6%), attributed to a low base; planned share buyback of RMB 8bn to 10bn — same sources.
- Dividends: FY2025 declared dividends of RMB 2.58 per share plus RMB 2.58 interim = about 224% of the (reduced) profit; 2021 to 2024 payout 50% to 70% — [Eastmoney dividend history 000858](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000858"%29)
- ROE engine FY2025 (weighted ROE 6.9%): attributable net margin 22.1%, asset turnover 0.214x, leverage 1.46x; gross margin 78%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 48%, 2021 to 2025 average 92%, FY2025 224% — [Eastmoney dividend history 000858](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000858"%29)

**Luzhou Laojiao** (000568.SZ)
- Core product: Guojiao 1573 and other mid-to-high-end liquor 89.3% of FY2025 revenue (gross margin 91%), other liquor 10.3%; domestic 99.2% — [Eastmoney FY2025 segment data 000568](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000568.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025: revenue RMB 25.73bn (-17.5%), attributable profit RMB 10.83bn (-19.6%), first simultaneous fall since 2015; volume 86,089 tonnes (-17.0%); inventory RMB 15.4bn (about 24% of assets); management policy of not cutting the Guojiao 1573 price while its wholesale price (RMB 840 in Apr 2026) sits below its RMB 980 ex-factory price — [Huxiu](https://www.huxiu.com/article/4888584.html); [Jiemian](https://m.jiemian.com/article/14356977.html)
- H1 2026: revenue RMB 10.47bn (-36.4%), profit RMB 4.34bn (-43.4%) — same sources.
- ROE engine FY2025 (weighted ROE 22.7%): attributable net margin 42.1%, asset turnover 0.387x, leverage 1.39x; gross margin 87%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 68%, 2021 to 2025 average 65%, FY2025 78% — [Eastmoney dividend history 000568](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000568"%29)

**Shanxi Fenjiu** (600809.SH)
- Core product: Fenjiu brand 96.7% of FY2025 revenue (gross margin 76%), other liquor 3.0%; outside Shanxi 65.1%, inside 34.6% — [Eastmoney FY2025 segment data 600809](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600809.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 38.72bn (+7.5%), attributable profit RMB 12.25bn (flat); the only listed baijiu maker among 12 reporting with both revenue and profit up; outside-province revenue RMB 25.2bn (+12.6%), over 3,000 outside-province distributors; cash dividend RMB 6.56 per share, RMB 8.0bn, 65.35% of profit — [Jiemian](https://m.jiemian.com/article/14361782.html); [10jqka](https://stock.10jqka.com.cn/20260726/c678437634.shtml)
- Q1 2026: revenue RMB 14.9bn (-9.7%), profit RMB 5.38bn (-19.0%) — same sources.
- ROE engine FY2025 (weighted ROE 33.5%): attributable net margin 31.6%, asset turnover 0.705x, leverage 1.5x; gross margin 75%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 46%, 2021 to 2025 average 53%, FY2025 65% — [Eastmoney dividend history 600809](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600809"%29)

**Anhui Gujing** (000596.SZ)
- Core product: Gujing Gong baijiu 98.4% of FY2025 revenue (gross margin 79%); Central China 88.4% of sales — [Eastmoney FY2025 segment data 000596](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000596.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 18.83bn (-20.1%), profit RMB 3.55bn (-35.7%), first simultaneous fall since 2021; gross margin 79.46% (-2.3 points); causes cited: lower volume and price per tonne, promotions, rigid fixed costs; contract liabilities fell to RMB 2.3bn at Q1 2026 from RMB 3.7bn a year earlier — [Lanjinger](https://www.lanjinger.com/d/1777513004039212899); [RC Caijing](https://m.rccaijing.com/news-7389963201058371129.html)
- Eastmoney tags the old ticker as *ST/ST Gujing (special treatment status) in its former-name history — [Eastmoney company profile 000596](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000596.SZ"%29)
- ROE engine FY2025 (weighted ROE 14.3%): attributable net margin 18.8%, asset turnover 0.478x, leverage 1.58x; gross margin 79%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 34%, 2021 to 2025 average 55%, FY2025 66% — [Eastmoney dividend history 000596](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000596"%29)

**Yili** (600887.SH)
- Core product: liquid milk 60.9% of FY2025 revenue (gross margin 31%), milk powder and dairy products 28.3% (42%), ice cream 8.5% (38%) — [Eastmoney FY2025 segment data 600887](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600887.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue about RMB 115.9bn, attributable profit RMB 11.57bn (+36.8%), weighted ROE 20.87%, net margin about 10% (record); liquid milk revenue RMB 70.4bn; press says it is the only integrated dairy to grow revenue and profit; 2024 payout 91.4% — [CNFIN](https://www.cnfin.com/jgdt-lb/detail/20260429/4406860_1.html); [Weekly on Stock](https://static.weeklyonstock.com/26/0430/wd223012.html); [CS.com.cn](https://www.cs.com.cn/ssgs/gsxl/202504/t20250430_6489150.html)
- ROE engine FY2025 (weighted ROE 20.9%): attributable net margin 10.0%, asset turnover 0.758x, leverage 2.76x; gross margin 35%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 53%, 2021 to 2025 average 76%, FY2025 75% — [Eastmoney dividend history 600887](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600887"%29)

**Gree Electric** (000651.SZ)
- Core product: household air conditioners and appliances 78.1% of FY2025 revenue (gross margin 35%), industrial products and green energy 10.2%, other 9.8% at 3% margin; domestic 74.2%, export 16.1% — [Eastmoney FY2025 segment data 000651](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000651.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 170.4bn (-9.9%), profit RMB 29.0bn (-9.9%); consumer appliance revenue -10.4%; domestic -10.7%, overseas -2.9%; H1 2025 central air conditioning domestic demand weak on property market adjustment; channel reform cited as a drag; Gree was the only one of the big three white-goods firms with falling revenue — [WallStreetCN](https://wallstreetcn.com/articles/3771163); [36Kr](https://www.36kr.com/p/3787521400658947)
- FY2025 dividends: RMB 2.00 per share final plus RMB 1.00 interim; operating cash flow RMB 46.4bn (+57.9%) — [The Paper](https://m.thepaper.cn/newsDetail_forward_33082694)
- ROE engine FY2025 (weighted ROE 20.3%): attributable net margin 16.9%, asset turnover 0.451x, leverage 2.66x; gross margin 30%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 44%, 2021 to 2025 average 55%, FY2025 58% — [Eastmoney dividend history 000651](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000651"%29)

**Haier Smart Home** (600690.SH)
- Core product: refrigerators 27.8% of FY2025 revenue, washing machines 21.5%, air conditioners 17.8%, kitchen appliances 13.7%, equipment parts and channel services 12.9%, water appliances 5.8%; overseas 51.1%, domestic 48.3% (gross margins 25% and 29%) — [Eastmoney FY2025 segment data 600690](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600690.SH"%29%28REPORT_DATE='2025-12-31'%29)
- Structure: Haier Smart Home absorbed Haier Electronics (Hong Kong listed) via a scheme of arrangement effective 21 Dec 2020, ending a dual-listing set-up with overlapping business and many related-party transactions — [Pedaily](https://news.pedaily.cn/202012/464097.shtml); [CBN Data](https://www.cbndata.com/information/93092)
- ROE engine FY2025 (weighted ROE 17.0%): attributable net margin 6.5%, asset turnover 1.031x, leverage 2.55x; gross margin 27%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 33%, 2021 to 2025 average 44%, FY2025 56% — [Eastmoney dividend history 600690](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600690"%29)

**Fuyao Glass** (600660.SH)
- Core product: automotive glass 91.5% of FY2025 revenue (gross margin 31%), float glass 14.2% before group eliminations of -17.5%; domestic 52.9%, overseas 45.6% — [Eastmoney FY2025 segment data 600660](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600660.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 45.8bn (+16.7%), attributable profit RMB 9.31bn (+24.2%), a record; gross margin 37.27%; automotive glass shipments +8.5% and price per square metre RMB 248 (+8.1%); cash dividends RMB 5.48bn, 58.85% of profit — [WallStreetCN](https://wallstreetcn.com/articles/3767744); [Jiemian](https://m.jiemian.com/article/14131329.html) (global market share percentage not found in these sources)
- ROE engine FY2025 (weighted ROE 25.6%): attributable net margin 20.3%, asset turnover 0.687x, leverage 1.83x; gross margin 37%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 60%, 2021 to 2025 average 67%, FY2025 59% — [Eastmoney dividend history 600660](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600660"%29)

**Jiangsu Hengrui** (600276.SH)
- Core product: oncology 52.7% of FY2025 revenue, neuroscience 13.6%, contrast agents 9.5%, metabolic and cardiovascular 7.7%; domestic 84.3%, overseas 4.3%; gross margin 86% — [Eastmoney FY2025 segment data 600276](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600276.SH"%29%28REPORT_DATE='2025-12-31'%29)
- 2018: generics were over 80% of RMB 17.4bn revenue; since 2018 22 of 35 generics entered volume-based procurement at an average price cut of 74.5%; in 2022 revenue fell 17.9% to RMB 21.3bn and attributable profit fell 13.8% to RMB 3.9bn; fifth-batch procurement products sold RMB 0.61bn in 2022, RMB 2.26bn less than a year earlier (-79%); innovative drugs on the NRDL took an average 33% price cut from 1 Jan 2022 — [Lanjinger](https://www.lanjinger.com/d/208210); [WallStreetCN](https://wallstreetcn.com/articles/3668223)
- FY2025 revenue RMB 31.6bn (+13.0%), profit RMB 7.71bn (+21.7%) (Eastmoney); the low payout (17% to 30%, 20-year average 16%) and 11% debt/assets explain the ROE staying below 15% despite 24% margins.
- ROE engine FY2025 (weighted ROE 14.3%): attributable net margin 24.4%, asset turnover 0.527x, leverage 1.11x; gross margin 86%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 16%, 2021 to 2025 average 23%, FY2025 17% — [Eastmoney dividend history 600276](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600276"%29)

**Pien Tze Huang** (600436.SH)
- Core product: medicine 91.1% of FY2025 revenue, of which manufacturing 49.3% (gross margin 59%, liver-disease drugs 47.4%) and distribution 41.7% (gross margin 8%); cosmetics 6.3% — [Eastmoney FY2025 segment data 600436](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600436.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 9.0bn (-16.6%), attributable profit RMB 2.16bn (-27.5%), first simultaneous fall; natural bezoar (cattle gallstone) price rose from RMB 0.43m per kg in early 2020 to RMB 1.7m per kg in early 2025; liver-disease product gross margin fell from above 80% (end 2020) to 61.1% (Q3 2025); retail price raised to RMB 760 per tablet in 2023 caused channel inversion, resale price down from RMB 1,600 to RMB 400 to 500; inventory above RMB 6bn — [Lanjinger](https://www.lanjinger.com/d/1761191953406184043); [Huxiu](https://www.huxiu.com/article/4891991.html); [QQ News](https://news.qq.com/rain/a/20251023A02MAQ00)
- Formula-secrecy protection: not found in my search results.
- ROE engine FY2025 (weighted ROE 14.8%): attributable net margin 24.0%, asset turnover 0.513x, leverage 1.21x; gross margin 36%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 45%, 2021 to 2025 average 51%, FY2025 83% — [Eastmoney dividend history 600436](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600436"%29)

**Yunnan Baiyao** (000538.SZ)
- Core product: FY2025 revenue by segment: pharmaceutical distribution 55.7% (gross margin 6%), drugs 19.8% (69%), health and daily-chemical products (toothpaste and others) 16.6% (68%), Chinese medicine resources 5.4% (14%); Yunnan province 62.7% — [Eastmoney FY2025 segment data 000538](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000538.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 41.19bn (+2.9%), profit RMB 5.15bn (+8.5%); H1 2025 health products revenue RMB 3.44bn (+9.5%) and toothpaste ranked first in national all-channel market share per Nielsen — [Eastmoney](https://finance.eastmoney.com/a/202603313690820672.html); [Stockstar](https://stock.stockstar.com/RB2026040200002408.shtml)
- ROE history: the last year above 20% was reported as 2016; a 2017 mixed-ownership reform brought Xinhuadu in as 50% owner of the parent (RMB 25.4bn commitment), and the 2019 absorption of the parent raised net assets sharply — [Huxiu](https://m.huxiu.com/article/815470.html); [Pedaily](https://news.pedaily.cn/202303/509771.shtml)
- ROE engine FY2025 (weighted ROE 13.0%): attributable net margin 12.5%, asset turnover 0.769x, leverage 1.35x; gross margin 30%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 43%, 2021 to 2025 average 71%, FY2025 55% — [Eastmoney dividend history 000538](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000538"%29)

**China Merchants Bank** (600036.SH)
- Core business: retail finance 56.6% of FY2025 operating income, wholesale finance 40.9%; Yangtze delta 13.9% and head office 36.9% of regional income — [Eastmoney FY2025 segment data 600036](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600036.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 operating income RMB 337.5bn (flat), attributable profit RMB 150.2bn (+1.2%); net interest income RMB 215.6bn (+2.0%); fee income RMB 75.3bn (+4.4%); retail AUM above RMB 17 trillion, 224 million retail customers (+6.7%); non-interest income 36.1% of revenue — [CS.com.cn](https://www.cs.com.cn/ssgs/gsxl/202603/t20260330_6543687.html); [WallStreetCN](https://wallstreetcn.com/articles/3768613)
- Net interest margin and NPL ratio values not found in my search results; dividend payout steady at 30% to 34% since 2012.
- ROE engine FY2025 (weighted ROE 13.4%): net margin 44.5%, asset turnover 0.027x, leverage 11.29x
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 29%, 2021 to 2025 average 33%, FY2025 34% — [Eastmoney dividend history 600036](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600036"%29)

**China Yangtze Power** (600900.SH)
- Core business: domestic hydropower 87.7% of FY2025 revenue (gross margin 66%), other 12.0%; net margin 40% on 0.15 turnover; debt/assets 58% — [Eastmoney FY2025 segment data 600900](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600900.SH"%29%28REPORT_DATE='2025-12-31'%29)
- Articles of association commit to cash dividends of at least 70% of net profit for 2021 to 2025; 2022 profit fell 18.3% yet RMB 20.1bn was paid out; the 2022 fall was driven by drought-hit inflows in the second half — [Jiemian](https://www.jiemian.com/article/10726402.html); [Caixin](https://www.caixinglobal.com/2023-04-29/china-yangtze-power-coltds-net-profit-dropped-183-in-2022-102044300.html); [TMTPost](https://www.tmtpost.com/6684953.html)
- The Wudongde and Baihetan stations were injected into the listed company (merger committee approval noted in 2022), which is consistent with the jump in revenue (+24% in 2022) and debt/assets (56% in 2022, 63% in 2023) in the Eastmoney data — [Stockstar](https://stock.stockstar.com/JC2022110900006535.shtml)
- ROE engine FY2025 (weighted ROE 15.9%): attributable net margin 40.0%, asset turnover 0.153x, leverage 2.59x; gross margin 62%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 62%, 2021 to 2025 average 75%, FY2025 71% — [Eastmoney dividend history 600900](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600900"%29)

**Shanghai Intl Airport** (600009.SH)
- Core business: aviation and related services 94.2% of FY2025 revenue (Eastmoney segment data show 25% gross margin on the aviation line, 64% on other) — [Eastmoney FY2025 segment data 600009](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600009.SH"%29%28REPORT_DATE='2025-12-31'%29)
- Duty-free: from Jan 2021 the concession fee was tied to international passenger flow rather than sales; a Dec 2023 supplementary agreement set an annual minimum of RMB 707m with rates of 18% to 36%; on 17 Dec 2025 new concession contracts for 1 Jan 2026 to 31 Dec 2033 were signed with CDFG and Duty Free & Retail (fixed monthly rent with a +/-20% passenger-flow adjustment) — [Huxiu](https://www.huxiu.com/article/2774915.html); [CNStock](https://paper.cnstock.com/html/2023-12/27/content_1859084.htm); [NBD](https://www.nbd.com.cn/articles/2025-12-17/4185273.html)
- 2022 loss of about RMB 3.0bn due to the pandemic; 2024 profit RMB 1.93bn (+107%) with 124 million passengers across the two airports — [The Paper](https://m.thepaper.cn/detail/30741519); [Huxiu](https://www.huxiu.com/article/2774915.html)
- ROE engine FY2025 (weighted ROE 5.0%): attributable net margin 15.9%, asset turnover 0.188x, leverage 1.68x; gross margin 28%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 33%, 2021 to 2025 average 46%, FY2025 55% — [Eastmoney dividend history 600009](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600009"%29)

**Sany Heavy** (600031.SH)
- Core product: excavators 38.7% of FY2025 revenue (gross margin 34%), concrete machinery 17.6%, cranes 17.4%, road machinery 4.2%, piling 3.2%; international 62.6% (gross margin 32%) vs domestic 35.2% (21%) — [Eastmoney FY2025 segment data 600031](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600031.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 89.2bn (+14.7%), profit RMB 8.41bn (+41.2%), operating cash flow RMB 20.0bn (record); international revenue RMB 55.9bn (+15.1%), 64% of the machinery business; new-energy product sales RMB 8.6bn (+115%); excavator revenue US$4.83bn (+13.7%) — [CLS](https://www.cls.cn/detail/2329920); [WallStreetCN](https://wallstreetcn.com/articles/3753830)
- Construction machinery entered a downturn of more than three years from 2011, driven by slowing fixed-asset and property investment, high dealer inventory and tighter sales terms — [NBD, Dec 2014](https://www.nbd.com.cn/articles/2014-12-28/886734.html)
- ROE engine FY2025 (weighted ROE 11.2%): attributable net margin 9.4%, asset turnover 0.551x, leverage 2.16x; gross margin 28%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 108%, 2021 to 2025 average 41%, FY2025 51% — [Eastmoney dividend history 600031](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600031"%29)

**Wanhua Chemical** (600309.SH)
- Core product: petrochemicals 41.4% of FY2025 revenue (gross margin 1%), polyurethanes (MDI, TDI etc.) 36.9% (27%), fine chemicals and new materials 16.3% (11%); domestic 52.2%, overseas 47.4%; gross margin 13.6% — [Eastmoney FY2025 segment data 600309](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600309.SH"%29%28REPORT_DATE='2025-12-31'%29)
- Global MDI is an oligopoly: Wanhua, BASF, Covestro, Huntsman and Dow hold over 90%; Wanhua capacity 3.8m tonnes per year is about 33.8%, the largest — [36Kr](https://www.36kr.com/p/3780588223951363)
- 2025 earnings fell on falling product prices, with nine-month profit RMB 9.16bn (-17.5%) on revenue RMB 144.2bn (-2.3%); causes cited: global MDI/TDI capacity additions, weak property demand and a low-margin petrochemicals business — [The Paper](https://m.thepaper.cn/detail/31832719); [Jinduan/Lanjinger](https://www.lanjinger.com/d/1765255975577089809)
- ROE engine FY2025 (weighted ROE 12.4%): attributable net margin 6.2%, asset turnover 0.659x, leverage 3.06x; gross margin 14%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 39%, 2021 to 2025 average 31%, FY2025 31% — [Eastmoney dividend history 600309](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600309"%29)

**Anhui Conch** (600585.SH)
- Core product: 42.5-grade cement 58.9% of FY2025 revenue (gross margin 27%), 32.5-grade 9.0%, clinker 6.0%, aggregates 5.1%, ready-mix concrete 3.9%; eastern region 22.7%, central 22.2%, overseas 7.1% (gross margin 43%) — [Eastmoney FY2025 segment data 600585](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600585.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025: revenue RMB 82.5bn (-9.3%), profit RMB 8.11bn (+5.4%), first profit rise in five years; national cement output 1.693bn tonnes (-6.9%), lowest since 2010; average price RMB 367 per tonne (-RMB 17); clinker unit cost -11.1%; cash dividend 55% of profit (RMB 4.49bn); commitment to pay at least 50% of profit as dividends and buybacks in 2026 and 2027; debt/assets 20.4% — [Weekly on Stock](https://static.weeklyonstock.com/26/0328/zbf190734.html); [Sina Finance](https://finance.sina.com.cn/roll/2026-04-13/doc-inhuihzi9806051.shtml)
- Cost position and market share percentages were not found; clinker capacity 269m tonnes and cement 384m tonnes at end-2021 — [uSMART](https://www.usmart.hk/en/news-detail/6604629091092135981)
- ROE engine FY2025 (weighted ROE 4.3%): attributable net margin 9.8%, asset turnover 0.323x, leverage 1.35x; gross margin 24%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 30%, 2021 to 2025 average 48%, FY2025 56% — [Eastmoney dividend history 600585](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600585"%29)

**Hualan Biological** (002007.SZ)
- Core product: blood products 73.7% of FY2025 revenue (albumin 30.9%, immunoglobulin 18.4%, others 24.4%), vaccines 26.0% (influenza vaccine 24.4% at 79% gross margin) — [Eastmoney FY2025 segment data 002007](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="002007.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- H1 2026 revenue RMB 1.57bn (-12.9%), profit RMB 383m (-25.7%); blood product industry hit by expanded volume-based procurement, medical insurance payment reform and price falls, plus rising plasma supply; 10% IVIG approved — [Gelonghui](https://m.gelonghui.com/news/5309101)
- ROE engine FY2025 (weighted ROE 8.2%): attributable net margin 20.5%, asset turnover 0.291x, leverage 1.37x; gross margin 58%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 41%, 2021 to 2025 average 69%, FY2025 194% — [Eastmoney dividend history 002007](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="002007"%29)

**Yutong Bus** (600066.SH)
- Core product: buses 87.5% of FY2025 revenue (gross margin 25%); overseas 51.0% (gross margin 30%), domestic 37.2% (19%) — [Eastmoney FY2025 segment data 600066](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="600066.SH"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025: 49,518 buses sold (+5.5%), revenue RMB 41.4bn (+11.3%), profit RMB 5.55bn (+34.9%); dividend RMB 2.00 per share, about 99.65% of profit; operating cash flow RMB 3.2bn (-55.7%); 2023 and 2024 profit growth 139% and 127% from a depressed 2022 base of RMB 0.76bn — [The Paper](https://m.thepaper.cn/newsDetail_forward_30934643); [10jqka](https://stock.10jqka.com.cn/20260405/c675777832.shtml)
- Share: Yutong is first in domestic large and medium buses; in H1 2025 its domestic urban bus share was 22.24%; in 2025 it led bus exports with 17,149 vehicles (21.9% of the top-10 market), though BYD led new-energy bus exports — [Gelonghui](https://m.gelonghui.com/news/5323340)
- ROE engine FY2025 (weighted ROE 38.0%): attributable net margin 13.4%, asset turnover 1.272x, leverage 2.23x; gross margin 24%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 93%, 2021 to 2025 average 167%, FY2025 100% — [Eastmoney dividend history 600066](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="600066"%29)

**Midea Group** (000333.SZ)
- Core product: smart home (ToC) 65.7% of FY2025 revenue (gross margin 30%), commercial and industrial solutions (ToB) 26.9% (21%; buildings tech 7.8%, robotics and automation 6.8%, industrial tech 6.0%); domestic 57.1%, overseas 42.9% — [Eastmoney FY2025 segment data 000333](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000333.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue about RMB 458.5bn (+12%), profit RMB 43.95bn (+14%); overseas revenue RMB 195.9bn (+16%); ToC RMB 299.9bn (+11.3%), ToB RMB 122.8bn (+17.5%); Q4 revenue growth only 5.7%; dividend RMB 4.30 per share for FY2025 (RMB 32.4bn, 73.6% of profit) plus RMB 11.6bn buybacks counted as dividends — [NBD](https://www.nbd.com.cn/articles/2026-03-31/4318601.html); [10jqka](https://stock.10jqka.com.cn/20260331/c675646714.shtml)
- ROE engine FY2025 (weighted ROE 19.7%): attributable net margin 9.6%, asset turnover 0.756x, leverage 2.72x; gross margin 26%
- Payout since 2013 listing: 20-year average not meaningful (2006 to 2012 gap); 2021 to 2025 average 62%, FY2025 75% — [Eastmoney dividend history 000333](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000333"%29)

**Henan Shuanghui (WH Group sub)** (000895.SZ)
- Core product: pork processing; FY2025 raw pork and slaughtering 49.3% of segment revenue (gross margin 5%), packaged meat products 39.7% (37%), other 20.4%, before eliminations of -9.4%; north of the Yangtze 62.1% — [Eastmoney FY2025 segment data 000895](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="000895.SZ"%29%28REPORT_DATE='2025-12-31'%29)
- FY2025 revenue RMB 59.27bn (-0.5%, fifth annual decline), profit RMB 5.1bn (+2.3%); packaged meat volume 1.361m tonnes in 2025 vs 1.587m tonnes peak in 2020; fined about RMB 129m in 2026 for lincomycin residues — [Lanjinger](https://www.lanjinger.com/d/1779715504632636672); [The Paper](https://m.thepaper.cn/newsDetail_forward_33246822)
- Ownership: WH Group 70.33% — see question 1.
- ROE engine FY2025 (weighted ROE 24.1%): attributable net margin 8.6%, asset turnover 1.55x, leverage 1.81x; gross margin 18%
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 83%, 2021 to 2025 average 97%, FY2025 98% — [Eastmoney dividend history 000895](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="000895"%29)

**Ping An** (601318.SH)
- Core product: life and health insurance 47.8% of FY2025 revenue, property and casualty 33.6%, banking 12.5%, asset management 4.9% — [Eastmoney FY2025 segment data 601318](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="601318.SH"%29%28REPORT_DATE='2025-12-31'%29)
- 2022 attributable profit RMB 83.8bn (-17.6%); 2023 RMB 85.7bn (-22.8%), with asset-management losses of RMB 19.5bn from credit-risk provisions and market declines, and a cut to the long-term investment return assumption for life embedded value — [CS.com.cn](https://cs.com.cn/bx/202403/t20240322_6396279.html); [Yicai](https://www.yicai.com/news/102038301.html)
- New-business value fell about 24% in 2022 on pandemic lockdowns and agent attrition (press summary) — [Xueqiu](https://www.xueqiu.com/1184824257/283182986)
- ROE engine FY2025 (weighted ROE 14.0%): net margin 12.8%, asset turnover 0.078x, leverage 13.95x
- Payout (cash dividends declared x shares / attributable profit, computed): 20-year average 32%, 2021 to 2025 average 42%, FY2025 36% — [Eastmoney dividend history 601318](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="601318"%29)

**Tencent (0700)**
- FY2025 revenue RMB 751.8bn (+14%): value-added services RMB 369.3bn (+16%; domestic games 164.2bn, international games 77.4bn, social networks 127.7bn), marketing services RMB 145.0bn (+19%, from pricing and impressions), fintech and business services RMB 229.4bn (+8%), other RMB 8.1bn — [HKEX results announcement, 18 Mar 2026](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0318/2026031800388.pdf); [PR Asia](https://en.prnasia.com/releases/apac/tencent-announces-2025-annual-and-fourth-quarter-results-525781.shtml)
- Attributable profit RMB 224.8bn, gross margin 56.2%, net margin 29.9%, debt/assets 39.1% — [Eastmoney HK indicators 00700](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=%28SECURITY_CODE="00700"%29%28DATE_TYPE_CODE="001"%29); final dividend HK$5.30 (2025), HK$4.50 (2024), HK$3.40 (2023), HK$2.40 (2022), HK$1.60 (2021) — [Eastmoney HK dividend table](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_MAIN_DIVBASIC&columns=ALL&filter=%28SECURITY_CODE="00700"%29)

**Shenzhou International (2313)**
- FY2025 revenue RMB 30.99bn (+8.1%), net profit RMB 5.83bn (-6.7%); sportswear 67.7% of sales; gross margin 26.3% (28.1% in 2024) on wage increases, ramp-up of the Cambodia plant, tariff sharing with customers and a stronger renminbi; profit fell mainly because 2024 included a RMB 331m equity sale gain and 2025 had a RMB 256m exchange loss; top three customers more than 70% of revenue — [Gelonghui](https://m.gelonghui.com/news/5198850); [Eastmoney HK indicators 02313](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_FN_MAININDICATOR&columns=ALL&filter=%28SECURITY_CODE="02313"%29%28DATE_TYPE_CODE="001"%29)

**BYD (1211 / 002594)**
- FY2025 revenue RMB 804.0bn (+3.5%): autos and related products 80.7% (gross margin 20%), phone components and assembly 19.3% (6%); overseas 38.7%; China revenue -11.2%, overseas +40%; attributable profit RMB 32.6bn (-19.0%); 4.6m vehicles sold, 1.05m exported; R&D about RMB 63.4bn; gross margin 17.7%; debt/assets 70.7% — [Eastmoney FY2025 segment data 002594](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FN_MAINOP&columns=ALL&filter=%28SECUCODE="002594.SZ"%29%28REPORT_DATE='2025-12-31'%29); [10jqka](https://stock.10jqka.com.cn/20260328/c675607690.shtml); [WallStreetCN](https://wallstreetcn.com/articles/3768601)
- Payout via A-share dividend history: 2013 22%, 2016 29%, 2018 20%, 2022 20%, 2023 30%, 2024 54%, 2025 10% (zero in 2011, 2012, 2014 and 2015) — [Eastmoney dividend history 002594](https://datacenter.eastmoney.com/api/data/v1/get?reportName=RPT_SHAREBONUS_DET&columns=ALL&filter=%28SECURITY_CODE="002594"%29)

**Hengan (1044)**
- FY2025 revenue RMB 23.07bn (+1.8%), profit RMB 2.54bn (+10.3%), gross margin 33.8%; tissue RMB 14.17bn (61.4% of revenue, +5.6%); hygiene products (sanitary napkins and diapers) RMB 6.57bn (28.5%, -5.3%) at 58.3% gross margin; domestic competitors' promotions hurt H1 2025; interim and final dividends of RMB 0.70 each in 2022 to 2025 — [iTiger (HKEX results coverage)](https://www-web.itiger.com/news/1198852195); [Eastmoney HK dividend table](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_HKF10_MAIN_DIVBASIC&columns=ALL&filter=%28SECURITY_CODE="01044"%29)
- 2022: revenue RMB 22.6bn (+8.8%) but profit down 41.2% to RMB 1.93bn on higher wood pulp prices (RMB 5,500 to 6,000 per tonne at end 2021 to RMB 7,400 to 7,800 at end 2022) — [TMTPost](https://www.tmtpost.com/6523276.html)

**NetEase (NTES)**
- FY2025 net revenue RMB 112.6bn (+7%); games and related value-added services RMB 92.1bn (about 82%), of which online games RMB 89.6bn; titles named include Fantasy Westward Journey Online, Identity V, Where Winds Meet and Marvel Rivals; Q4 2025 revenue RMB 27.5bn (+3.0%) — [Barchart (press release)](https://www.barchart.com/story/news/149227/netease-announces-fourth-quarter-and-fiscal-year-2025-unaudited-financial-results); [iTiger](https://www.itiger.com/news/1162997812)
- Cash dividends paid as a share of attributable net income (XBRL, paid basis): 2013 18%, 2014 42%, 2015 22%, 2016 22%, 2017 30%, 2018 23%, 2019 42%, 2020 35%, 2021 21%, 2022 33%, 2023 27%, 2024 38%, 2025 41% — [SEC XBRL companyfacts](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json)

### Inferences
- Documented price-increase evidence: Moutai (two ex-factory rises of about 18% and 20% within six years); Pien Tze Huang (retail price raised to RMB 760 per tablet in 2023, later undone by channel inversion and falling resale prices). For Wuliangye, Luzhou, Fenjiu, Gree, Midea, Haier, Yili and Fuyao I found only price per unit evidence for Fuyao (+8.1% average selling price in 2025), not list-price histories.
- Capital-light compounding is visible in the data: Moutai, Luzhou, Fenjiu, Hengrui, Pien Tze Huang, Tencent and NetEase run below 40% debt/assets with ROA between 10% and 27%.
- The distribution moat is strongest in the outcome data for Moutai (97% domestic, direct channel now 50%) and Fenjiu (65% outside Shanxi, 3,000+ outside distributors), weaker for Gujing (88% Central China).

### Gaps
- No source found for protected-formula or licence status of Moutai (appellation), Pien Tze Huang or Yunnan Baiyao (national secret formula status), or for global market share of Fuyao, domestic share of Gree/Midea/Haier, and dairy share for Yili.
- Price-increase histories for Wuliangye (Puwu ex-factory price), Luzhou, Fenjiu, Gree and Midea were not retrieved.
- Revenue mix comes from the aggregator's FY2025 segment tables; percentages do not sum to 100% where intra-group eliminations or "other" lines are included. Hong Kong segment data come from press coverage of the results announcements, not from the PDFs.
- Payout ratios are computed from the aggregator's dividend records and share counts (average excludes loss years and years with no dividend record, e.g. Yili 2007 to 2008, Airport 2020 to 2022, Midea 2006 to 2012); they may differ from company-stated ratios.
- Tencent, Shenzhou and Hengan/ Ping An payout ratio: not computed; dividends are declared in HKD or RMB and EPS is in RMB, and I did not apply an exchange rate (no estimation). Hengan RMB 1.40 per share in 2025 on EPS RMB 2.227 would be a currency-consistent ratio of about 63%, and Ping An RMB 2.70 on EPS RMB 7.68 about 35%, from the dividend table and HK indicators above.

## 5. Years with ROE of 15% or below, and why

### Takeaway
Four groups: (1) the 2012 to 2014 baijiu anti-extravagance reset hit Luzhou (8.0% in 2014), Fenjiu (9.3%) and Wuliangye (just under 15% in 2015); (2) cyclical or volume-driven profit falls (Sany 2013 to 2017 and 2022 to 2025, Conch 2022 to 2025, Yutong 2018 to 2022, Wanhua 2024 to 2025, Shenzhou 2021 and 2023); (3) policy shocks (Hengrui 2021 to 2023 volume-based procurement, Hualan blood-product procurement, Hengan 2022 pulp costs, Pien Tze Huang 2025 bezoar costs); (4) structural low-ROE states (Yangtze Power regulated hydro, Shanghai Airport after 2020, Gujing 2006 to 2008, Haier 2006 to 2008, Yili 2007 to 2008, BYD 2011 to 2021).

### Cited Findings
Facts below are from the Eastmoney annual indicators (revenue and attributable profit year-on-year changes, net margin, asset turnover, debt/assets); cause statements are cited separately. Format: year: ROE | revenue change | attributable profit change | net margin | asset turnover | debt/assets.


**Kweichow Moutai**
- No year at or below 15% in 2006 to 2025.

**Wuliangye**
- 2006: ROE 15.0 | revenue +15% | attrib. NP +48% | net margin 15.8% | asset turnover 0.74 | debt/assets 20%
- 2015: ROE 14.9 | revenue +3% | attrib. NP +6% | net margin 28.5% | asset turnover 0.44 | debt/assets 16%
- 2025: ROE 6.9 | revenue -55% | attrib. NP -72% | net margin 22.1% | asset turnover 0.21 | debt/assets 36%

**Luzhou Laojiao**
- 2014: ROE 8.0 | revenue -49% | attrib. NP -74% | net margin 16.4% | asset turnover 0.40 | debt/assets 26%
- 2015: ROE 14.7 | revenue +29% | attrib. NP +67% | net margin 21.3% | asset turnover 0.52 | debt/assets 22%

**Shanxi Fenjiu**
- 2014: ROE 9.3 | revenue -36% | attrib. NP -63% | net margin 9.1% | asset turnover 0.68 | debt/assets 32%
- 2015: ROE 12.5 | revenue +5% | attrib. NP +46% | net margin 12.6% | asset turnover 0.66 | debt/assets 33%
- 2016: ROE 13.2 | revenue +7% | attrib. NP +16% | net margin 13.7% | asset turnover 0.62 | debt/assets 35%

**Anhui Gujing**
- 2006: ROE 1.6 | revenue +47% | attrib. NP +162% | net margin 1.4% | asset turnover 0.71 | debt/assets 40%
- 2007: ROE 4.1 | revenue +25% | attrib. NP +154% | net margin 2.8% | asset turnover 0.87 | debt/assets 39%
- 2008: ROE 4.0 | revenue +22% | attrib. NP -1% | net margin 2.3% | asset turnover 0.94 | debt/assets 46%
- 2025: ROE 14.3 | revenue -20% | attrib. NP -36% | net margin 18.8% | asset turnover 0.48 | debt/assets 32%

**Yili**
- 2006: ROE 14.0 | revenue +36% | attrib. NP +11% | net margin 2.0% | asset turnover 2.59 | debt/assets 60%
- 2007: ROE -4.3 | revenue +17% | attrib. NP -106% | net margin -0.1% | asset turnover 2.21 | debt/assets 54%
- 2008: ROE -48.3 | revenue +12% | attrib. NP -8092% | net margin -7.8% | asset turnover 1.97 | debt/assets 73%

**Gree Electric**
- No year at or below 15% in 2006 to 2025.

**Haier Smart Home**
- 2006: ROE 5.5 | revenue +41% | attrib. NP +133% | net margin 2.4% | asset turnover 2.79 | debt/assets 33%
- 2007: ROE 10.3 | revenue +27% | attrib. NP +16% | net margin 2.2% | asset turnover 2.80 | debt/assets 37%
- 2008: ROE 11.7 | revenue +3% | attrib. NP +19% | net margin 2.5% | asset turnover 2.60 | debt/assets 37%

**Fuyao Glass**
- 2008: ROE 7.5 | revenue +11% | attrib. NP -73% | net margin 4.3% | asset turnover 0.61 | debt/assets 65%
- 2019: ROE 14.1 | revenue +4% | attrib. NP -30% | net margin 13.7% | asset turnover 0.58 | debt/assets 45%
- 2020: ROE 12.1 | revenue -6% | attrib. NP -10% | net margin 13.1% | asset turnover 0.52 | debt/assets 44%
- 2021: ROE 13.0 | revenue +19% | attrib. NP +21% | net margin 13.3% | asset turnover 0.57 | debt/assets 41%

**Jiangsu Hengrui**
- 2021: ROE 14.0 | revenue -7% | attrib. NP -28% | net margin 17.5% | asset turnover 0.70 | debt/assets 9%
- 2022: ROE 10.9 | revenue -18% | attrib. NP -14% | net margin 18.4% | asset turnover 0.52 | debt/assets 9%
- 2023: ROE 11.0 | revenue +7% | attrib. NP +10% | net margin 18.9% | asset turnover 0.53 | debt/assets 6%
- 2024: ROE 14.7 | revenue +23% | attrib. NP +47% | net margin 22.6% | asset turnover 0.60 | debt/assets 8%
- 2025: ROE 14.3 | revenue +13% | attrib. NP +22% | net margin 24.4% | asset turnover 0.53 | debt/assets 12%

**Pien Tze Huang**
- 2006: ROE 14.2 | revenue +27% | attrib. NP -7% | net margin 15.1% | asset turnover 0.72 | debt/assets 16%
- 2025: ROE 14.8 | revenue -17% | attrib. NP -27% | net margin 24.0% | asset turnover 0.51 | debt/assets 14%

**Yunnan Baiyao**
- 2019: ROE 10.3 | revenue +10% | attrib. NP +20% | net margin 14.1% | asset turnover 0.57 | debt/assets 23%
- 2020: ROE 14.5 | revenue +10% | attrib. NP +32% | net margin 16.8% | asset turnover 0.62 | debt/assets 31%
- 2021: ROE 7.6 | revenue +11% | attrib. NP -49% | net margin 7.7% | asset turnover 0.68 | debt/assets 27%
- 2022: ROE 7.9 | revenue +0% | attrib. NP +7% | net margin 8.2% | asset turnover 0.69 | debt/assets 28%
- 2023: ROE 10.5 | revenue +7% | attrib. NP +36% | net margin 10.5% | asset turnover 0.73 | debt/assets 26%
- 2024: ROE 12.0 | revenue +2% | attrib. NP +16% | net margin 11.9% | asset turnover 0.75 | debt/assets 27%
- 2025: ROE 13.0 | revenue +3% | attrib. NP +9% | net margin 12.5% | asset turnover 0.77 | debt/assets 26%

**China Merchants Bank**
- 2024: ROE 14.5 | revenue -0% | attrib. NP +1% | net margin 44.0% | asset turnover 0.03 | debt/assets 90%
- 2025: ROE 13.4 | revenue +0% | attrib. NP +1% | net margin 44.5% | asset turnover 0.03 | debt/assets 90%

**China Yangtze Power**
- 2008: ROE 10.0 | revenue +7% | attrib. NP -25% | net margin 42.7% | asset turnover 0.15 | debt/assets 35%
- 2009: ROE 10.2 | revenue +18% | attrib. NP +15% | net margin 41.9% | asset turnover 0.10 | debt/assets 62%
- 2010: ROE 12.8 | revenue +99% | attrib. NP +78% | net margin 37.6% | asset turnover 0.14 | debt/assets 58%
- 2011: ROE 11.5 | revenue -5% | attrib. NP -6% | net margin 37.2% | asset turnover 0.13 | debt/assets 57%
- 2012: ROE 14.5 | revenue +25% | attrib. NP +34% | net margin 40.2% | asset turnover 0.16 | debt/assets 52%
- 2013: ROE 11.9 | revenue -12% | attrib. NP -13% | net margin 39.6% | asset turnover 0.15 | debt/assets 48%
- 2014: ROE 14.5 | revenue +19% | attrib. NP +32% | net margin 44.0% | asset turnover 0.18 | debt/assets 41%
- 2015: ROE 13.6 | revenue +76% | attrib. NP +54% | net margin 38.4% | asset turnover 0.21 | debt/assets 56%
- 2019: ROE 14.8 | revenue -3% | attrib. NP -5% | net margin 43.2% | asset turnover 0.17 | debt/assets 49%
- 2021: ROE 14.9 | revenue -4% | attrib. NP -0% | net margin 47.2% | asset turnover 0.17 | debt/assets 42%
- 2022: ROE 11.7 | revenue +24% | attrib. NP -10% | net margin 34.5% | asset turnover 0.15 | debt/assets 56%
- 2023: ROE 13.5 | revenue +13% | attrib. NP +15% | net margin 34.9% | asset turnover 0.14 | debt/assets 63%

**Shanghai Intl Airport**
- 2008: ROE 7.2 | revenue +7% | attrib. NP -49% | net margin 25.7% | asset turnover 0.20 | debt/assets 29%
- 2009: ROE 5.6 | revenue -0% | attrib. NP -18% | net margin 21.2% | asset turnover 0.19 | debt/assets 24%
- 2010: ROE 9.7 | revenue +25% | attrib. NP +86% | net margin 31.3% | asset turnover 0.24 | debt/assets 19%
- 2011: ROE 10.2 | revenue +10% | attrib. NP +14% | net margin 32.5% | asset turnover 0.25 | debt/assets 18%
- 2012: ROE 10.0 | revenue +2% | attrib. NP +5% | net margin 33.5% | asset turnover 0.25 | debt/assets 17%
- 2013: ROE 11.4 | revenue +10% | attrib. NP +18% | net margin 35.9% | asset turnover 0.26 | debt/assets 18%
- 2014: ROE 11.8 | revenue +10% | attrib. NP +12% | net margin 36.4% | asset turnover 0.26 | debt/assets 18%
- 2015: ROE 13.1 | revenue +9% | attrib. NP +21% | net margin 40.3% | asset turnover 0.26 | debt/assets 19%
- 2016: ROE 13.2 | revenue +11% | attrib. NP +11% | net margin 40.4% | asset turnover 0.26 | debt/assets 16%
- 2020: ROE -4.1 | revenue -61% | attrib. NP -125% | net margin -29.4% | asset turnover 0.12 | debt/assets 11%
- 2021: ROE -6.0 | revenue +89% | attrib. NP -25% | net margin -19.4% | asset turnover 0.16 | debt/assets 45%
- 2022: ROE -8.2 | revenue -33% | attrib. NP -90% | net margin -54.6% | asset turnover 0.08 | debt/assets 40%
- 2023: ROE 2.3 | revenue +102% | attrib. NP +131% | net margin 8.5% | asset turnover 0.16 | debt/assets 40%
- 2024: ROE 4.7 | revenue +12% | attrib. NP +107% | net margin 15.6% | asset turnover 0.18 | debt/assets 38%
- 2025: ROE 5.0 | revenue +8% | attrib. NP +9% | net margin 15.9% | asset turnover 0.19 | debt/assets 38%

**Sany Heavy**
- 2013: ROE 12.2 | revenue -20% | attrib. NP -49% | net margin 7.8% | asset turnover 0.58 | debt/assets 61%
- 2014: ROE 3.0 | revenue -19% | attrib. NP -76% | net margin 2.3% | asset turnover 0.48 | debt/assets 61%
- 2015: ROE 0.6 | revenue -23% | attrib. NP -99% | net margin 0.0% | asset turnover 0.37 | debt/assets 61%
- 2016: ROE 0.9 | revenue -1% | attrib. NP +4001% | net margin 0.9% | asset turnover 0.38 | debt/assets 62%
- 2017: ROE 8.7 | revenue +65% | attrib. NP +928% | net margin 5.5% | asset turnover 0.64 | debt/assets 55%
- 2022: ROE 6.7 | revenue -24% | attrib. NP -64% | net margin 5.3% | asset turnover 0.54 | debt/assets 58%
- 2023: ROE 6.8 | revenue -8% | attrib. NP +6% | net margin 6.1% | asset turnover 0.48 | debt/assets 54%
- 2024: ROE 8.5 | revenue +6% | attrib. NP +32% | net margin 7.6% | asset turnover 0.52 | debt/assets 52%
- 2025: ROE 11.2 | revenue +14% | attrib. NP +41% | net margin 9.4% | asset turnover 0.55 | debt/assets 48%

**Wanhua Chemical**
- 2015: ROE 14.7 | revenue -12% | attrib. NP -33% | net margin 8.3% | asset turnover 0.44 | debt/assets 69%
- 2024: ROE 14.3 | revenue +4% | attrib. NP -22% | net margin 7.2% | asset turnover 0.67 | debt/assets 65%
- 2025: ROE 12.4 | revenue +12% | attrib. NP -4% | net margin 6.2% | asset turnover 0.66 | debt/assets 63%

**Anhui Conch**
- 2008: ROE 13.8 | revenue +29% | attrib. NP +5% | net margin 10.8% | asset turnover 0.66 | debt/assets 41%
- 2009: ROE 13.2 | revenue +3% | attrib. NP +36% | net margin 14.2% | asset turnover 0.56 | debt/assets 38%
- 2012: ROE 13.5 | revenue -6% | attrib. NP -46% | net margin 13.8% | asset turnover 0.53 | debt/assets 42%
- 2015: ROE 11.0 | revenue -16% | attrib. NP -32% | net margin 14.7% | asset turnover 0.49 | debt/assets 30%
- 2016: ROE 11.6 | revenue +10% | attrib. NP +13% | net margin 15.3% | asset turnover 0.52 | debt/assets 27%
- 2022: ROE 8.5 | revenue -21% | attrib. NP -53% | net margin 11.9% | asset turnover 0.56 | debt/assets 20%
- 2023: ROE 5.7 | revenue +7% | attrib. NP -33% | net margin 7.4% | asset turnover 0.58 | debt/assets 20%
- 2024: ROE 4.1 | revenue -36% | attrib. NP -26% | net margin 8.5% | asset turnover 0.36 | debt/assets 21%
- 2025: ROE 4.3 | revenue -9% | attrib. NP +5% | net margin 9.8% | asset turnover 0.32 | debt/assets 20%

**Hualan Biological**
- 2006: ROE 14.8 | revenue -2% | attrib. NP +51% | net margin 22.3% | asset turnover 0.47 | debt/assets 28%
- 2012: ROE 12.1 | revenue +1% | attrib. NP -19% | net margin 30.8% | asset turnover 0.34 | debt/assets 4%
- 2022: ROE 11.1 | revenue +2% | attrib. NP -17% | net margin 23.8% | asset turnover 0.34 | debt/assets 17%
- 2023: ROE 13.7 | revenue +18% | attrib. NP +38% | net margin 27.7% | asset turnover 0.35 | debt/assets 17%
- 2024: ROE 9.4 | revenue -18% | attrib. NP -27% | net margin 24.8% | asset turnover 0.27 | debt/assets 15%
- 2025: ROE 8.2 | revenue +5% | attrib. NP -14% | net margin 20.5% | asset turnover 0.29 | debt/assets 12%

**Yutong Bus**
- 2018: ROE 14.3 | revenue -4% | attrib. NP -26% | net margin 7.2% | asset turnover 0.87 | debt/assets 54%
- 2019: ROE 11.3 | revenue -4% | attrib. NP -16% | net margin 6.4% | asset turnover 0.83 | debt/assets 52%
- 2020: ROE 3.1 | revenue -29% | attrib. NP -73% | net margin 2.4% | asset turnover 0.62 | debt/assets 54%
- 2021: ROE 4.1 | revenue +7% | attrib. NP +19% | net margin 2.6% | asset turnover 0.71 | debt/assets 52%
- 2022: ROE 5.2 | revenue -6% | attrib. NP +24% | net margin 3.5% | asset turnover 0.70 | debt/assets 51%
- 2023: ROE 13.0 | revenue +24% | attrib. NP +139% | net margin 6.7% | asset turnover 0.89 | debt/assets 54%

**Midea Group**
- No year at or below 15% in 2006 to 2025.

**Henan Shuanghui (WH Group sub)**
- 2011: ROE 14.9 | revenue -1% | attrib. NP +15% | net margin 3.7% | asset turnover 3.02 | debt/assets 39%

**Ping An**
- 2008: ROE 0.7 | revenue -34% | attrib. NP -91% | net margin 1.3% | asset turnover 0.16 | debt/assets 90%
- 2012: ROE 13.8 | revenue +20% | attrib. NP +3% | net margin 6.7% | asset turnover 0.12 | debt/assets 93%
- 2021: ROE 13.0 | revenue -3% | attrib. NP -29% | net margin 8.6% | asset turnover 0.12 | debt/assets 89%
- 2022: ROE 10.1 | revenue -25% | attrib. NP +9% | net margin 12.6% | asset turnover 0.08 | debt/assets 89%
- 2023: ROE 9.7 | revenue +4% | attrib. NP -23% | net margin 9.4% | asset turnover 0.08 | debt/assets 89%
- 2024: ROE 13.8 | revenue +13% | attrib. NP +48% | net margin 12.3% | asset turnover 0.08 | debt/assets 90%
- 2025: ROE 14.0 | revenue +2% | attrib. NP +6% | net margin 12.8% | asset turnover 0.08 | debt/assets 90%

**Cause statements (cited)**
- Luzhou Laojiao, Fenjiu, Wuliangye 2013 to 2016: In March 2012 the State Council anti-extravagance meeting restricted public-funds spending on high-end liquor; Moutai, Wuliangye and Luzhou each fell more than 6% in a day, and between July 2012 and January 2014 Moutai, Wuliangye and Gujing shares fell more than 50%; industry revenue growth of listed baijiu makers was -4.0% in 2013 and -10.7% in 2014 per one research report; Wuliangye lost the revenue lead to Moutai in 2012 — [NBD, Mar 2012](https://www.nbd.com.cn/articles/2012-03-31/644739.html); [36Kr](https://www.36kr.com/p/1721786007553); [CNFIN research PDF](https://www.cnfin.com/upload-xh08/2020/0918/31611e456ee04101ae209a3bea8e2717.pdf). The Eastmoney data show Luzhou revenue -49% and profit -74% in 2014, Fenjiu revenue -36% and profit -63%, with ROE recovering to 17.8% (Luzhou, 2016) and 19.0% (Fenjiu, 2017). No company-stated cause for each year was retrieved.
- Wuliangye, Luzhou, Gujing 2025: Baijiu deep adjustment: scenes shrinking, stock competition, destocking; Wuliangye revenue -54.6% and profit -71.9% including an accounting correction that cut the first three quarters of 2025; Luzhou revenue -17.5%, Gujing -20.1% — see question 4 for sources.
- Sany Heavy 2013 to 2017: Construction machinery downturn from 2011 on slowing fixed-asset and property investment, heavy dealer inventory and tighter sales policy; Sany 2014 first-half profit fell about 48%; Sany 2016 profit RMB 0.2bn was the trough — [NBD](https://www.nbd.com.cn/articles/2014-12-28/886734.html); [NBD, Aug 2017](https://www.nbd.com.cn/articles/2017-08-30/1143499.html). 2022 to 2024: revenue -24% and profit -64% in 2022 (Eastmoney); cause not retrieved.
- Jiangsu Hengrui 2021 to 2025: Volume-based procurement (22 of 35 generics won at an average 74.5% price cut), the NRDL cut averaging 33% on innovative drugs from 1 Jan 2022, pandemic effects on anaesthesia and contrast agents (-33% and -28%); R&D spending kept rising (H1 2022 R&D 28.4% of sales). Analysts note the root cause was generic dependence (over 80% of 2018 revenue) — [Lanjinger](https://www.lanjinger.com/d/208210); [WallStreetCN](https://wallstreetcn.com/articles/3668223). ROE stayed near 14% in 2024 and 2025 even as profit grew, because margins are 24% but leverage is only 1.1x and payout under 30%.
- Anhui Conch 2022 to 2025: Property downturn: national cement output fell 6.9% in 2025 to 1.693bn tonnes (lowest since 2010) and average price fell RMB 17 to RMB 367; 2025 profit rose 5.4% on lower unit costs (clinker cost -11.1%) but ROE stayed 4.3% because equity is large (debt/assets 20%) and asset turnover has fallen to 0.32 — [Weekly on Stock](https://static.weeklyonstock.com/26/0328/zbf190734.html). Year-by-year profit falls (2022: -53%, 2023: -33%, 2024: -26%) are Eastmoney figures; their causes were not separately sourced.
- Gree Electric: No year below 15%; low point 18.9% in 2020. Property downturn shows up as 2025 revenue -9.9% and profit -9.9% (domestic -10.7%), with central air conditioning project demand weak on property market adjustment; ROE still 20.3% — [WallStreetCN](https://wallstreetcn.com/articles/3771163). Gree's ROE fell from 37.4% (2017) to 18.9% (2020) while the dividend moved from nil (2017) to 109% of profit (2020) per Eastmoney dividend data; I have not sourced the reason.
- BYD 2008, 2010 to 2021: Capital intensity: debt/assets 70% to 78%, net margin 4% to 5% and turnover about 1.0x in recent years; ROE was below 15% in 2008 and in every year from 2010 to 2021 (2009 was 27.1%; 2022 was 16.1%); it recovered to 24.0% to 24.8% in 2023 and 2024, then fell to 15.1% in 2025 as profit fell 19.0% on price competition (gross margin from 19% to 18%) and R&D of about RMB 63bn — [10jqka](https://stock.10jqka.com.cn/20260328/c675607690.shtml); [WallStreetCN](https://wallstreetcn.com/articles/3768601). Causes for 2011 to 2021 (profit RMB 0.1bn to 4bn on equity growing from heavy capex) are inferred from the margin and leverage data, not from a cited statement.
- Yutong Bus 2018 to 2022: Revenue and profit fell: 2020 revenue -29% and profit -73% (ROE 3.1%); 2022 profit base RMB 0.76bn; recovery to 13.0% in 2023 and 30.9% in 2024 on +139% and +127% profit growth — [The Paper](https://m.thepaper.cn/newsDetail_forward_30934643). The cause of 2018 to 2022 declines was not found in my search results (pandemic is plausible but unsourced).
- Yunnan Baiyao 2019 to 2025: On the first-published numbers ROE was 18.6% in 2017 and 17.4% in 2018, then 10.3% in 2019; the equity base rose sharply with the 2019 absorption of the parent; net margin also fell to 7.7% in 2021 (profit -49%). One analysis ties the persistent ROE decline to net asset expansion after the mixed-ownership reform without matching profitability gains — [Huxiu](https://m.huxiu.com/article/815470.html); [Pedaily](https://news.pedaily.cn/202303/509771.shtml). Reason for the 2021 profit fall not retrieved.
- Shanghai International Airport 2008 to 2019 and 2020 to 2025: ROE of 5.6% to 13.2% in 2008 to 2016 reflects an equity-heavy airport with net margin of 21% to 40%, turnover about 0.2x and debt/assets of 16% to 29%; ROE was above 15% only in 2006 to 2007 and 2017 to 2019. 2020 to 2022 losses from the pandemic (2022 loss about RMB 3.0bn); duty-free economics worsened from 2021 (fee tied to international flows) and the Dec 2023 agreement set a RMB 707m annual minimum with lower rates; recovery to 2.3% (2023), 4.7% (2024), 5.0% (2025) — [The Paper](https://m.thepaper.cn/detail/30741519); [Huxiu](https://www.huxiu.com/article/2774915.html); [CNStock](https://paper.cnstock.com/html/2023-12/27/content_1859084.htm)
- China Yangtze Power: ROE was at or below 15% in 12 of 20 years: hydro assets are capital-heavy (turnover 0.10x to 0.21x) and ROE tops out at about 17% (2016 to 2018). 2022's 11.7% followed drought-reduced inflows (profit -18.3%) and the injection of new stations; the dividend rule (at least 70% payout 2021 to 2025) keeps equity from piling up — [Caixin](https://www.caixinglobal.com/2023-04-29/china-yangtze-power-coltds-net-profit-dropped-183-in-2022-102044300.html); [Jiemian](https://www.jiemian.com/article/10726402.html)
- Ping An 2008 and 2021 to 2025: 2008: attributable profit -91% (ROE 0.7%); the cause (investment loss) was not sourced here. 2021 to 2023: profit -29% (2021), then 2022 ROE 10.1% on first-published numbers and 2023 9.7% after asset-management losses of RMB 19.5bn and a cut in the life embedded-value return assumption; 2022 new business value about -24% on pandemic effects and agent attrition — [CS.com.cn](https://cs.com.cn/bx/202403/t20240322_6396279.html); [Yicai](https://www.yicai.com/news/102038301.html); [Xueqiu](https://www.xueqiu.com/1184824257/283182986)
- China Merchants Bank 2024 to 2025: ROE slipped below 15% for the first time in 20 years (14.5% in 2024, 13.4% in 2025) with flat revenue and +1% profit; net interest margin pressure is cited generally but the value was not retrieved; leverage 10.2x year-end — [CS.com.cn](https://www.cs.com.cn/ssgs/gsxl/202603/t20260330_6543687.html)
- Yili 2007 and 2008: The 2008 loss coincides with the melamine crisis (non-recurring-adjusted loss RMB 1.80bn in 2008 and RMB 0.15bn in 2007 per one article, which also mentions a 2006 share-option plan but does not link it to the 2007 loss) — [Jiemian](https://www.jiemian.com/article/2023851.html). ROE returned to 20.8% in 2009.
- Haier Smart Home 2006 to 2009: Net margin of only 2.2% to 2.5% on 2.6x to 2.8x turnover; the parent group ran two listed vehicles (Qingdao Haier and Haier Electronics) with overlapping business, related-party dealing and trapped cash, which the sources cite as an efficiency problem; ROE reached 24.3% in 2010 and 33.8% in 2012 — [Pedaily](https://news.pedaily.cn/202012/464097.shtml); [WallStreetCN](https://wallstreetcn.com/articles/3600626). The exact reasons for the 2006 to 2008 low net margin were not sourced.
- Anhui Gujing 2006 to 2008: Net margin 1.4% to 2.8% on 0.7x to 0.9x turnover with 40% to 46% debt/assets, in the period Eastmoney lists the shares as ST (special treatment); profit recovered from 2009 and ROE reached 34.2% in 2010. Cause of the earlier weakness not sourced — [Eastmoney company profile 000596](https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_ORG_BASICINFO&columns=ALL&filter=%28SECUCODE="000596.SZ"%29)
- Fuyao Glass 2008, 2019 to 2021: 2008: profit -73% on revenue +11%, debt/assets 65% (cause not sourced). 2019: ROE 14.1% (profit -30%); 2020 12.1% and 2021 13.0% with net margins of 13% to 14%; ROE returned to 17.6% (2022) and 25.6% (2025) — Eastmoney data; the 2019 to 2021 causes were not found.
- Wanhua Chemical 2015 and 2024 to 2025: 2015 (14.7%): revenue -12%, profit -33%. 2024 to 2025: lower MDI/TDI prices from global capacity additions and property weakness, gross margin 13.6%; leverage 3.1x — [The Paper](https://m.thepaper.cn/detail/31832719); [Lanjinger](https://www.lanjinger.com/d/1765255975577089809)
- Hualan Biological 2006, 2012, 2022 to 2025: Blood-product procurement expansion, insurance payment reform and price cuts; rising plasma volumes creating oversupply; ROE of 8.2% in 2025 despite a 20.5% net margin because turnover is 0.29x and debt/assets only 12% — [Gelonghui](https://m.gelonghui.com/news/5309101)
- Pien Tze Huang 2006 and 2025: 2025 (14.8%): revenue -16.6% and profit -27.5%; raw-material (bezoar) cost inflation, 2023 retail price rise, channel inventory and speculative stocking; 2006 (14.2%) is a pre-boom year with 15% net margin — [Lanjinger](https://www.lanjinger.com/d/1761191953406184043); [Huxiu](https://www.huxiu.com/article/4891991.html)
- Hengan 2022 to 2025 (HK computed ROE): ROE 10.0% (2022), 14.0% (2023), 11.1% (2024), 11.9% (2025); 2022 profit -41.2% on wood-pulp price surge (RMB 7,400 to 7,800 per tonne vs RMB 5,500 to 6,000), tissue margins squeezed; hygiene revenue -5.3% in 2025 from e-commerce competition — [TMTPost](https://www.tmtpost.com/6523276.html); [iTiger](https://www-web.itiger.com/news/1198852195)
- Shenzhou 2021 and 2023 to 2025 (HK computed): 12.3% (2021), 15.6% (2022), 14.3% (2023), 18.2% (2024), 15.9% (2025); 2025 profit -6.7% from a one-off prior-year gain, an exchange loss of RMB 256m, labour costs and tariff sharing — [Gelonghui](https://m.gelonghui.com/news/5198850). Causes for 2021 and 2023 not retrieved.
- NetEase 2018 and 2020 (computed): 13.5% in 2018 and 16.8% in 2020 are the weakest years; 2018 net income RMB 6.5bn versus RMB 10.8bn in 2017 and RMB 21.4bn in 2019 per XBRL ProfitLoss; the cause was not examined — [SEC XBRL](https://data.sec.gov/api/xbrl/companyfacts/CIK0001110646.json)

### Inferences
- Reading across the table, ROE falls below 15% by one of three routes: profit collapse on a policy or demand shock with an unchanged equity base (Luzhou 2014, Fenjiu 2014, Hengrui 2022); equity accumulation without payout (Hengrui, Hualan, Yunnan Baiyao post-2019, Conch); or a structurally low-margin or heavy-asset model (Haier 2006 to 2008, Yangtze Power, Shanghai Airport, BYD).
- Shocks cleared in about two to three years for baijiu in 2012 to 2016 (Luzhou back above 17% in 2016, Fenjiu above 19% in 2017), which is useful context for the 2025 baijiu downturn, though the 2025 downturn comes with high inventories and falling contract liabilities.
- FY2025 ROE at or below 15%: Wuliangye (6.9%), Conch (4.3%), Hualan (8.2%), Airport (5.0%), Sany (11.2%), Wanhua (12.4%), Hengrui (14.3%), Pien Tze Huang (14.8%), Gujing (14.3%), CMB (13.4%), Ping An (14.0%), Hengan (11.9%) and Yunnan Baiyao (13.0%).

### Gaps
- Causes for the following sub-15% years were not found in sources: Yutong 2018 to 2022, Sany 2022 to 2025, Fuyao 2008 and 2019 to 2021, Ping An 2008, Yunnan Baiyao 2021, Gujing and Haier 2006 to 2008, Shenzhou 2021 and 2023, Conch year-by-year, NetEase 2018 and 2020, BYD 2010 to 2021.
- I did not find company-stated figures (annual report text) for the 2013 to 2014 baijiu declines; they come from the aggregator data and general press coverage.
- 2026 interim results are available for some names (Luzhou, Hualan, Tencent); the note uses FY2025 as the latest full year.

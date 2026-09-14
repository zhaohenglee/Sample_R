#!/usr/bin/env python3
"""Stage 2: build history_ledger.json for the Constellation Software 2007-2025 history.

Reads no external data at runtime (stage1 intake already reviewed by hand); this script
encodes the curated, source-checked figures plus the Fable-flagged known-issue resolutions,
then computes coverage counts and gate checks in code (no arithmetic done by the model).
"""
import json

YEARS = [f"FY{y}" for y in range(2007, 2026)]  # 19 fiscal years

def e(value, unit, source_url, confidence, note=None):
    d = {"value": value, "unit": unit, "source_url": source_url, "confidence": confidence}
    if note:
        d["note"] = note
    return d

L2010 = "https://www.csisoftware.com/docs/default-source/press-releases/q4_2010_press_release.pdf"
L2012 = "https://www.csisoftware.com/docs/default-source/investor-relations/financial-news/pr_q4_2012.pdf"
L2013 = "https://www.csisoftware.com/docs/default-source/investor-relations/financial-news/pr_q4_2013.pdf"
L2014M = "http://www.marketwired.com/press-release/constellation-software-inc-announces-results-fourth-quarter-year-ended-december-31-2014-tsx-csu-1995151.htm"
L2014S = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/sr_q4_2014.pdf"
L2015 = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/sr_q4_2015.pdf"
L2015REL = "https://www.globenewswire.com/news-release/2016/02/17/1061530/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2015-and-Declares-Quarterly-Dividend.html"
L2016MDA_SEDAR = "https://www.sedarplus.ca/csa-party/records/document.html?id=f773c6e5e3b902e73f73f4b0482df0b51868dc8494d2e5cb048ca2126cb3dd5e"
L2016MDA_CSI = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/mda_q4_2016.pdf"
L2016CALL = "https://www.globenewswire.com/news-release/2017/02/01/1061601/0/en/Constellation-Software-Inc-Announces-Conference-Call-to-Discuss-Fourth-Quarter-Results.html"
L2017 = "https://www.globenewswire.com/news-release/2018/02/14/1348408/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2017-and-Declares-Quarterly-Dividend.html"
L2018Q4 = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/q4-2018-shareholder-report.pdf"
L2018MDA = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/csi-mda-q4-2018.pdf"
L2018REL = "https://www.globenewswire.com/news-release/2019/02/14/1725078/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2018-and-Declares-Quarterly-and-Special-Dividends.html"
L2019 = "https://www.globenewswire.com/news-release/2020/02/13/1984977/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2019-and-Declares-Quarterly-Dividend.html"
L2019AIF = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/2019-annual-information-form---final.pdf"
L2019SR = "https://www.csisoftware.com/docs/default-source/press-releases/q4-2019-shareholder-report.pdf"
L2020 = "https://www.globenewswire.com/news-release/2021/02/12/2175170/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2020-and-Declares-Quarterly-Dividend.html"
L2021 = "https://www.globenewswire.com/news-release/2022/02/10/2383319/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2021-and-Declares-Quarterly-Dividend.html"
L2021MDA = "https://www.csisoftware.com/docs/default-source/press-releases/csi---mda-q4-2021---final.pdf"
L2022 = "https://www.globenewswire.com/news-release/2023/03/29/2637195/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2022-and-Declares-Quarterly-Dividend.html"
L2022AIF = "https://www.csisoftware.com/docs/default-source/investor-relations/2022-agm/csi-2021-mic-en.pdf"
L2023 = "https://www.globenewswire.com/news-release/2024/03/06/2841834/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2023-and-Declares-Quarterly-Dividend.html"
L2023SR = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/q4-2023-shareholder-report.pdf?sfvrsn=91ffcfe7_3"
L2024 = "https://www.csisoftware.com/constellation-software-inc-announces-results-for-the-fourth-quarter-and-year-ended-december-31-2024-and-declares-quarterly-dividend/"
L2024GW = "https://www.globenewswire.com/news-release/2025/03/07/3039269/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2024-and-Declares-Quarterly-Dividend.html"
L2025 = "https://www.globenewswire.com/news-release/2026/03/09/3251696/0/en/constellation-software-inc-announces-results-for-the-fourth-quarter-and-year-ended-december-31-2025-and-declares-quarterly-dividend.html"
LEULER = "https://eulerpool.com/stock/Constellation-Software-Stock-CA21037X1006/netincome"
LLETTERS = "https://www.mbi-deepdives.com/content/files/2022/07/Constellation-Software-SH-Letters-Merged.pdf"
LSHLETTER09 = "https://www.csisoftware.com/docs/default-source/investor-relations/presidents-letter/shareholder-letter---2009.pdf"
LSHLETTER10 = "https://www.csisoftware.com/docs/default-source/investor-relations/presidents-letter/shareholder-letter---2010.pdf"
LLETTER13 = "https://www.csisoftware.com/docs/default-source/investor-relations/presidents-letter/presidentletter_2013.pdf"
LMACRO_REV17 = "https://www.macrotrends.net/stocks/charts/CNSWF/constellation-software/revenue"
LSEC13 = "https://www.sec.gov/Archives/edgar/data/1113678/000119312514275886/d757774dex21.htm"
LSEC14 = "https://www.sec.gov/Archives/edgar/data/1113678/000119312515138334/d906182dex26.htm"
LSEC12 = "https://www.sec.gov/Archives/edgar/data/1113678/000119312515138334/d906182dex26.htm"
LTRACXN = "https://tracxn.com/d/acquisitions/acquisitions-by-constellation-software/__YaRluimuGqgVfqr0Xhgb2dPWiMKnmgzXPcPNPni5Ssg"
LNICOPER = "https://nicoper.substack.com/p/4-constellation-acquisitions-2022"
LVOLARIS85 = "https://explore.volarisgroup.com/volaris-group-blog/volaris-recognized-as-a-top-acquirer"
LMAXIMUS = "https://www.csisoftware.com/constellation-software-inc.-finalizes-acquisition-of-maximus-justice-education-and-asset-solutions-businesses/"
LAIF2011 = "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/csu-2011-aif.pdf"
LAIF2015 = "https://www.csisoftware.com/wp-content/uploads/2026/04/2015-annual-information-form-final.pdf"
LREVELIO = "https://www.reveliolabs.com/companies/constellation-software/employees/"
LMACRO_EMP22 = "https://www.macrotrends.net/stocks/charts/CNSWF/constellation-software/number-of-employees"
LSTOCKOPEDIA = "https://www.stockopedia.com/share-prices/constellation-software-TSE:CSU/cashflow/"
LSEEKALPHA = "https://seekingalpha.com/article/4255039-constellation-software-and-sustainability-of-above-average-roics"
LBIZALMANAC = "https://bizalmanac.substack.com/p/a-better-combined-ratio"
LSHLETTERS_WEBFLOW = "https://uploads-ssl.webflow.com/60e3655ca778911eb64b2a00/60f0777ead89beba9c51c0b3_Constellation-Software-Inc.-Shareholder-Letters.pdf"
LMACROSHARES = "https://www.macrotrends.net/stocks/charts/CNSWF/constellation-software/shares-outstanding"
LTORTOISE = "https://thecompoundingtortoise.substack.com/p/constellation-software-analysis-of"
LMDA2021_PARENT = "https://www.csisoftware.com/docs/default-source/press-releases/csi---mda-q4-2021---final.pdf?sfvrsn=9cb2f077_3/+CSI---MDA-Q4-2021---Final+.pdf"
LSPEEDWELL22 = "https://www.speedwellmemos.com/p/constellation-software-2022-earnings"
LSTOCKANALYSIS_SHARES = "https://stockanalysis.com/quote/tsx/CSU/statistics/"
LFINANCECHARTS = "https://www.financecharts.com/stocks/CNSWF/performance/total-return-cagr"
LPORTFOLIOSLAB = "https://portfolioslab.com/symbol/CSU.TO"
LCANTECH = "https://www.cantechletter.com/2025/05/constellation-software-has-delivered-a-36000-return-since-its-ipo-is-it-still-a-buy/"
LSTOCKOPEDIA_PRICE = "https://www.stockopedia.com/share-prices/constellation-software-TSE:CSU/"

ledger = {}

# ---------------------------------------------------------------- revenue
ledger["revenue"] = {
    "FY2007": e(243.02, "USD millions", LEULER, "third_party",
                "Company's own FY2007 release exists on csisoftware.com but its dollar figures were not recoverable via WebSearch; only the Eulerpool aggregator figure could be sourced."),
    "FY2008": e(330.53, "USD millions", LEULER, "third_party",
                "Company FY2008 release located by title but dollar figures not recoverable via WebSearch."),
    "FY2009": e(438, "USD millions", L2010, "derived",
                "Derived from the FY2010 release statement that 2010 revenue of $631M was a 44% increase over 2009 (631/1.44 = ~438). No FY2009 press release figure was directly retrieved."),
    "FY2010": e(631, "USD millions", L2010, "company",
                "Full-year FY2010 revenue, confirmed twice independently. A $171M figure also appears in the same release but is the Q4-2010-only quarterly revenue, not the annual figure -- recorded as a conflict (known issue 1)."),
    "FY2011": e(773, "USD millions", L2012, "company", "FY2011 comparative stated in the FY2012 results release."),
    "FY2012": e(891.226, "USD millions", L2012, "company", "Consolidated total revenue $891,226 thousand vs $773,341 thousand in FY2011."),
    "FY2013": e(1211, "USD millions", L2013, "derived",
                "Derived as the sum of the FY2013 release's public sector ($832M) and private sector ($379M) segment revenue lines; the search only surfaced the two segment lines, not a single consolidated total line, though the arithmetic (832+379=1211) is exact."),
    "FY2014": e(1669, "USD millions", L2015, "company", "Comparative figure in the FY2015 report: revenue grew 10% to $1,838M from $1,669M in 2014."),
    "FY2015": e(1838, "USD millions", L2015, "company", "Revenue grew 10% to $1,838M vs $1,669M in FY2014."),
    "FY2016": e(2125.1, "USD millions", L2016MDA_SEDAR, "company", "Total revenues $2,125.1M, up 16%/$286.8M over $1,838.3M in 2015."),
    "FY2017": e(2479, "USD millions, approximate", LMACRO_REV17, "third_party",
                "No company-sourced consolidated total was confirmed via WebSearch; a $790M snippet from the primary release appears to be the Private Sector segment only, not the consolidated total."),
    "FY2018": e(3060, "USD millions", L2019, "company", "Stated as FY2019 release's prior-year comparative."),
    "FY2019": e(3490, "USD millions", L2019, "company", "14% increase, or $430M, over 2018."),
    "FY2020": e(3969, "USD millions", L2020, "company", "14% increase over 2019 revenue of $3,490M."),
    "FY2021": e(5106, "USD millions", L2021, "company",
                "29% increase over 2020 revenue of $3,969M. A third-party aggregator (macrotrends) puts FY2021 revenue at $5,110M, a 0.08% difference -- below the 2% conflict threshold, not recorded as a conflict."),
    "FY2022": e(6622, "USD millions", L2022, "company"),
    "FY2023": e(8407, "USD millions", L2023, "company"),
    "FY2024": e(10066, "USD millions", L2024, "company"),
    "FY2025": e(11623, "USD millions", L2025, "company"),
}

# --------------------------------------------------------- revenue_growth_pct
ledger["revenue_growth_pct"] = {
    "FY2007": e(16, "percent", LLETTERS, "company", "President's letter: Net Revenues grew 16% in 2007, after 27% in 2006. Confirmed full-year figure."),
    "FY2010": e(44, "percent", L2010, "company", "Total revenues were $631M, an increase of 44% over 2009."),
}

# ------------------------------------------------------------- organic_growth_pct
ledger["organic_growth_pct"] = {
    "FY2008": e(-10, "percent approximate", LSHLETTER09, "company",
                "2009 letter states organic growth averaged -10% in each of 2008 and 2009 during the recession; a two-year average, not a distinct FY2008-only figure."),
    "FY2009": e(-3, "percent", L2010, "company",
                "Year-specific figure from the FY2010 release comparative (excl. PTS acquisition, organic growth was nil). Preferred over the -10% two-year-average figure from the 2009 President's letter, which is recorded as a conflict."),
    "FY2010": e(-4, "percent approximate", L2010, "company", "Organic growth from existing business estimated at approximately -4% for FY2010; increases mainly from acquisitions."),
    "FY2012": e(6, "percent", L2012, "company", "Organic growth was 6% for the year ended December 31, 2012."),
    "FY2013": e(4, "percent", LLETTER13, "company",
                "2013 President's Letter: 'Organic Net Revenue Growth was 4% in 2013.' A narrower 8% figure for 'Organic Growth in Maintenance Revenue' from the same letter is a different, more specific metric and is recorded as a conflict rather than used here."),
    "FY2014": e(4, "percent", L2014M, "company", "Revenues increased organically by 4% for the twelve months ended December 31, 2014."),
    "FY2015": e(-3, "percent", L2015, "company", "Reported (unadjusted) organic growth was -3% for FY2015."),
    "FY2016": e(0, "percent", L2016MDA_CSI, "company",
                "Reused from long-term-hold/holdings.json parent_long_run (mda_q4_2016.pdf, the FY2016 annual MD&A): reported organic growth was 0% for FY2016. This project's own fresh intake sweep surfaced two other company-sourced pairs (-1%/+1% from a sedarplus MD&A copy, and +1%/+3% from a conference-call announcement) that could not be reconciled against this figure; both are recorded as conflicts, and the mda_q4_2016.pdf pair is used because it is the FY2016 annual release and was already vetted in the prior long-term-hold report."),
    "FY2017": e(3, "percent", L2017, "company", "Full year organic growth 3% as reported and FX-adjusted vs 2016; matches parent_long_run."),
    "FY2018": e(3, "percent", L2018MDA, "company", "Organic Net Revenue growth was 3% in 2018, per the Q4 2018 MD&A."),
    "FY2019": e(-1, "percent", L2019, "company", "Matches parent_long_run FY2019 figure."),
    "FY2020": e(-3, "percent", L2020, "company", "Matches parent_long_run FY2020 figure. COVID-19 year."),
    "FY2021": e(7, "percent", L2021, "company", "Revenue grew 29% overall, 7% organic. Directly confirmed against the primary release text (parent_long_run had flagged this as not independently re-verified)."),
    "FY2022": e(-1, "percent", L2022, "company", "Revenue grew 30% to $6,622M, with -1% organic growth (+3% after FX)."),
    "FY2023": e(5, "percent", L2023, "company"),
    "FY2024": e(2, "percent", L2024GW, "company"),
    "FY2025": e(4, "percent", L2025, "company", "Revenue grew 15% (4% organic, 3% after FX) to $11,623M. Upgrades ledger.json's third-party substack citation to a company source."),
}

ledger["organic_growth_fx_adj_pct"] = {
    "FY2014": e(4, "percent, approximate", L2014M, "company",
                "Release describes the FX impact on the full-year 2014 organic growth rate as immaterial rather than giving a distinct adjusted percentage; recorded as approximately equal to the unadjusted 4% figure."),
    "FY2015": e(3, "percent", L2015, "derived",
                "Release states FX changes reduced organic growth by an approximate 6 percentage points; -3% + 6% implies approximately +3% FX-adjusted. Exact release wording for this specific line was not directly quoted in the search snippet."),
    "FY2016": e(1, "percent", L2016MDA_CSI, "company",
                "Reused from parent_long_run (mda_q4_2016.pdf): 'Positive 1% after adjusting for the impact of the net appreciation of the US dollar' (source also cites 3% after a further comparative hardware-sales adjustment, not modeled as a separate figure here). See organic_growth_pct FY2016 note and conflicts."),
    "FY2017": e(3, "percent", L2017, "company", "Same as reported organic growth for the full year (3%); the FX adjustment only changed the Q4-only figure."),
    "FY2018": e(2, "percent", L2018MDA, "company", "2% after adjusting for FX; 4% ex-US-Healthcare-vertical per the same MD&A."),
    "FY2019": e(1, "percent", L2019, "company", "Negative 1% as reported, positive 1% after adjusting for USD valuation changes."),
    "FY2020": e(-3, "percent", L2020, "company", "Same as reported (-3%); FX adjustment did not change the full-year figure."),
    "FY2021": e(5, "percent", L2021, "company", "5% after FX adjustment vs 7% as reported."),
    "FY2022": e(3, "percent", L2022, "company", "Positive 3% after adjusting for FX changes."),
    "FY2024": e(2, "percent", L2024GW, "company", "2% after adjusting for FX; same as reported (2%)."),
    "FY2025": e(3, "percent", L2025, "company"),
}

# ------------------------------------------------------- maintenance_recurring_revenue
ledger["maintenance_recurring_revenue"] = {
    "FY2018": e(68, "percent of total revenue, approximate", LSEEKALPHA, "third_party",
                "Third-party estimate, not a dollar figure. Different unit basis from the FY2023/FY2024 dollar figures below."),
    "FY2023": e(5985, "USD millions", L2023SR, "company"),
    "FY2024": e(7396, "USD millions", "https://www.csisoftware.com/docs/default-source/press-releases/csi---press-release-q4-2024---final.pdf?sfvrsn=a6da3ec_3/+CSI---Press-Release-Q4-2024---Final+.pdf", "company"),
}

# --------------------------------------------------------------- adjusted_ebita
ledger["adjusted_ebita"] = {
    "FY2009": e(88, "USD millions", L2010, "company", "Stated as the FY2009 comparative in the FY2010 release."),
    "FY2010": e(116, "USD millions", L2010, "company", "Up 32% over FY2009's $88M."),
    "FY2011": e(169, "USD millions", L2012, "company", "FY2011 comparative in the FY2012 release."),
    # FY2012: known issue 3 -- 8.41 is per diluted share, not the total. Left gap.
    "FY2013": e(233.8, "USD millions", L2014S, "company",
                "Directly quoted figure from the FY2014 report's FY2013 comparative disclosure: 'Adjusted EBITA for the fiscal year ended December 31, 2013 was $233.8 million.' Corroborated by an independently derived $233.6M (per-share x implied share count). A $178M figure from the FY2013 press release is recorded as a conflict and treated as an outlier/likely misread (known issue 4)."),
    "FY2014": e(348, "USD millions", L2015, "company", "$348.1M, stated as the FY2015 report's FY2014 comparative."),
    "FY2015": e(446, "USD millions", L2015, "company", "$445.5M, up $98M/28% vs FY2014."),
    "FY2017": e(621.2, "USD millions", L2018Q4, "company", "FY2017 comparative in the FY2018 shareholder report."),
    "FY2018": e(756.7, "USD millions", L2018Q4, "company", "22% increase over FY2017's $621.2M."),
}

# ---------------------------------------------------------- adjusted_net_income
ledger["adjusted_net_income"] = {
    "FY2009": e(62, "USD millions", L2010, "company", "$62M ($2.95 fully diluted per share), stated as the FY2009 comparative in the FY2010 release."),
    "FY2011": e(140, "USD millions", L2012, "company", "FY2011 comparative; consistent with the $6.63 diluted EPS figure."),
    "FY2012": e(172, "USD millions", L2013, "company", "Increased $32M/23% over FY2011's $140M."),
    "FY2013": e(207, "USD millions", L2013, "company", "Increase of 20% over FY2012's $172M. A $206.8M figure from the FY2014 report's comparative is the same figure to rounding, not a conflict."),
    "FY2014": e(274.3, "USD millions", L2014S, "company", "Increased from $206.8M in 2013, a 33% increase."),
    "FY2015": e(371, "USD millions", L2015REL, "company", "Increased 35% to $371M ($17.51 diluted) from $274M ($12.94 diluted) in 2014."),
    "FY2016": e(395.0, "USD millions", L2016MDA_CSI, "company",
                "Increased to $395.0M from $371.0M in 2015 (+6%). The search excerpt did not show the words 'Adjusted Net Income' attached verbatim to this sentence, so the label is inferred from numerical continuity with the FY2015 figure rather than a directly quoted label."),
    "FY2017": e(463, "USD millions", L2017, "company",
                "Increased 17% to $463M ($21.84 diluted) from $395M ($18.64 diluted) in 2016. This was the company's operative non-IFRS cash metric before FCFA2S existed; distinct from IFRS net income attributable ($222M)."),
    # No adjusted_net_income found for FY2018 onward; company appears to have transitioned to FCFA2S.
}

# --------------------------------------------------------------- net_income_attributable
ledger["net_income_attributable"] = {
    "FY2007": e(11.11, "USD millions", LEULER, "third_party", "Aggregator figure; not cross-checked against the company release text."),
    "FY2008": e(14.99, "USD millions", LEULER, "third_party", "Aggregator figure, unverified against company release."),
    "FY2011": e(157, "USD millions", L2012, "company",
                "Known issue 2: two independent retrievals of the FY2012 release pair $157M with FY2011 net income (consistent with a stated $75M FY2011 tax recovery vs an $18M FY2012 tax expense). A $63M figure is also recorded as a conflict and treated as a likely error (possibly a cross-year mixup with FY2009's $62M Adjusted Net Income)."),
    "FY2012": e(93, "USD millions", L2013, "company", "FY2013 release: 'consistent with last year's net income of $93 million.'"),
    "FY2013": e(93, "USD millions", L2013, "company"),
    "FY2014": e(103, "USD millions", L2014S, "company", "$103.1M, $4.87 diluted EPS."),
    "FY2015": e(177, "USD millions", L2015, "company", "$177.2M, up 72% from $103M in FY2014."),
    "FY2016": e(206.8, "USD millions", L2016MDA_SEDAR, "company", "$206.8M / $9.76 diluted EPS."),
    "FY2017": e(222, "USD millions", L2017, "company", "Increased 7% to $222M ($10.47 diluted) from $207M ($9.76 diluted) in 2016. A more precise $221.9M appears in a separate MD&A snippet of the same figure."),
    "FY2018": e(379.3, "USD millions", L2018Q4, "company", "$17.90 diluted EPS. The FY2019 release restates this comparative as $379M/$17.91 (rounding, <1% difference, not a conflict)."),
    "FY2019": e(333, "USD millions", L2019, "company", "12% decrease from FY2018's $379M. $15.73 diluted EPS."),
    "FY2020": e(436, "USD millions", L2020, "company", "31% increase over FY2019's $333M. $20.59 diluted EPS."),
    "FY2021": e(310, "USD millions", L2021, "company", "$14.65 diluted EPS. Decrease from FY2020's $436M."),
    "FY2022": e(512, "USD millions", L2022, "company", "Net income increased 65% to $512M."),
    "FY2023": e(565, "USD millions", L2023, "company"),
    "FY2024": e(731, "USD millions", L2024GW, "company"),
    "FY2025": e(512, "USD millions", L2025, "company"),
}

# ------------------------------------------------------------------ diluted_eps
ledger["diluted_eps"] = {
    "FY2009": e(2.95, "USD per share", L2010, "company", "FY2009 comparative fully diluted Adjusted Net Income per share; not confirmed whether GAAP or adjusted basis."),
    "FY2011": e(6.63, "USD per share", L2012, "company"),
    "FY2012": e(4.37, "USD per share", L2013, "company"),
    "FY2013": e(4.39, "USD per share", L2013, "company"),
    "FY2014": e(4.87, "USD per share", L2014S, "company"),
    "FY2015": e(8.36, "USD per share", L2015, "company"),
    "FY2016": e(9.76, "USD per share", L2016MDA_SEDAR, "company"),
    "FY2017": e(10.47, "USD per share", L2017, "company"),
    "FY2018": e(17.9, "USD per share", L2018Q4, "company"),
    "FY2019": e(15.73, "USD per share", L2019, "company"),
    "FY2020": e(20.59, "USD per share", L2020, "company"),
    "FY2021": e(14.65, "USD per share", L2021, "company"),
    "FY2022": e(24.16, "USD per share", "https://finance.yahoo.com/news/constellation-software-full-2023-earnings-110310762.html", "third_party", "No company-stated FY2022 diluted EPS figure was located; ledger.json also carries this as third-party."),
    "FY2023": e(26.67, "USD per share", L2023, "company"),
    "FY2024": e(34.48, "USD per share", L2024GW, "company"),
    "FY2025": e(24.15, "USD per share", L2025, "company"),
}

# ------------------------------------------------------------ cash_from_operations
ledger["cash_from_operations"] = {
    "FY2009": e(82, "USD millions", L2010, "company"),
    "FY2013": e(220, "USD millions", L2014M, "company", "Stated as the FY2014 release's FY2013 comparative."),
    "FY2014": e(341, "USD millions", L2014M, "company", "Increase of 55%/$121M over $220M in 2013."),
    "FY2015": e(395.9, "USD millions", L2015, "company"),
    "FY2017": e(528, "USD millions", L2017, "company", "Increase of 8%/$37M over $491M in 2016."),
    "FY2018": e(662.0, "USD millions", L2018Q4, "company"),
    "FY2019": e(708, "USD millions", L2019SR, "company", "7%/$46M increase over FY2018's $662M; adjusted for IFRS 16 Leases (adopted Jan 1, 2019)."),
    "FY2020": e(1186, "USD millions", L2020, "company"),
    "FY2021": e(1300, "USD millions", L2021, "company", "10%/$114M increase over FY2020's $1,186M."),
    "FY2023": e(1779, "USD millions", L2023SR, "company"),
    "FY2024": e(2196, "USD millions", L2024, "company"),
    "FY2025": e(2732, "USD millions", L2025, "company", "Up 24% from $2,196M in 2024."),
}

# -------------------------------------------------------------------- fcfa2s
ledger["fcfa2s"] = {
    "FY2018": e(559, "USD millions", L2019, "company", "Reused from long-term-hold/holdings.json parent_long_run."),
    "FY2019": e(590, "USD millions", L2019, "company", "Reused from parent_long_run. 6% increase over FY2018."),
    "FY2020": e(989, "USD millions", L2020, "company", "Reused from parent_long_run. +68%/$399M over FY2019."),
    "FY2021": e(883, "USD millions", L2021, "company", "Reused from parent_long_run. -11%/$106M vs FY2020, mainly the TSS/IRGA revaluation charge and Topicus.com non-controlling interests."),
    "FY2022": e(853, "USD millions", "https://www.csisoftware.com/docs/default-source/investor-relations/statutory-filings/csi---mda-q4-2023---final.pdf?sfvrsn=47d7de81_3", "company", "Reused from ledger.json."),
    "FY2023": e(1160, "USD millions", L2023, "company", "Reused from ledger.json."),
    "FY2024": e(1472, "USD millions", L2024, "company", "Reused from ledger.json."),
    "FY2025": e(1683, "USD millions", L2025, "company", "Reused from ledger.json. +$210M/14% over FY2024's $1,472M."),
}

# ------------------------------------------------------- acquisitions_cash_spent
ledger["acquisitions_cash_spent"] = {
    "FY2008": e(94, "USD millions approximate", LLETTERS, "company",
                "2008 President's letter: ~$94M of capital deployed/committed in 2008 (Maximus assets, 16 other businesses, VMS share purchases, pending Gladstone plc offer). This is total capital deployed/committed, not strictly cash spent on closed acquisitions."),
    "FY2013": e(558, "USD millions", LSEC13, "company", "Thirty acquisitions for aggregate cash consideration of $558M (plus $27M holdbacks and $4M contingent consideration, not included). Includes the TSS acquisition, closed Dec 31, 2013."),
    "FY2014": e(115, "USD millions", LSEC14, "company", "23 acquisitions for aggregate cash consideration of $115M (plus $17M holdbacks, $8M contingent consideration, not included)."),
    "FY2015": e(248.8, "USD millions", L2015, "company", "Aggregate of $248.8M, including holdback payments on prior acquisitions -- not directly comparable line-for-line with the FY2013/FY2014 figures above."),
    "FY2016": e(178.1, "USD millions", L2016MDA_CSI, "company",
                "Reused from long-term-hold/holdings.json parent_long_run (mda_q4_2016.pdf). This project's own FY2012-2016 intake sweep did not locate this figure and recorded it as a gap; parent_long_run already held it."),
    # FY2017: known issue 10 -- gap, do not fill from third-party estimates.
    "FY2018": e(603, "USD millions", L2018REL, "company"),
    "FY2019": e(688, "USD millions, total consideration", L2019, "company",
                "'Completed acquisitions totaling $688 million in consideration during 2019', directly quoted from the FY2019 release. A $549M 'aggregate cash consideration including acquired cash' figure sourced to the 2019 AIF (confidence third_party in this project's intake, and used in parent_long_run) is recorded as a conflict; the company-quoted $688M total-consideration figure is preferred."),
    "FY2020": e(179, "USD millions, aggregate cash consideration including acquired cash", L2020, "third_party",
                "WebSearch summary attributed this to FY2020 disclosures but did not quote it directly from the release text; no company-confirmed figure was found for FY2020. Matches parent_long_run and ledger.json."),
    "FY2021": e(1337, "USD millions, aggregate including holdback payments, net of a $33M additional subscription related to Topicus.com B.V.", L2021MDA, "company",
                "Reused from parent_long_run (Q4 2021 MD&A). A separate company-sourced $1,517M 'total consideration including holdbacks, contingent consideration and amounts related to Topicus.com B.V.' figure was found independently in this project's own FY2021 release search and is recorded as a conflict (net vs. total consideration are different bases)."),
    "FY2022": e(1600, "USD millions", LSPEEDWELL22, "third_party", "No company-disclosed aggregate acquisition spend was found for FY2022; matches ledger.json and parent_long_run, all citing the same third-party source."),
    "FY2023": e(732, "USD millions", L2023, "company"),
    "FY2024": e(1792, "USD millions", L2024GW, "company"),
    "FY2025": e(1579, "USD millions", L2025, "company", "Total acquisition consideration of $1,579M including holdbacks and contingent consideration."),
}

# --------------------------------------------------------------- acquisition_count
ledger["acquisition_count"] = {
    "FY2008": e(17, "count approximate", LLETTERS, "company", "2008 letter: 'bought the Maximus assets and 16 other businesses' -> 1 + 16 = 17."),
    "FY2012": e(35, "count", LSEC12, "derived", "Derived from a comparative sentence in the FY2013 disclosure ('thirty acquisitions... compared to thirty-five in 2012'); no primary FY2012 release figure found."),
    "FY2013": e(30, "count", LSEC13, "company"),
    "FY2014": e(23, "count", LSEC14, "company", "Lower than FY2013's 30; the intake's 'record year' framing for FY2014 acquisitions was not corroborated on a count or cash-consideration basis."),
    "FY2015": e(3, "count", LTRACXN, "third_party", "Low-confidence third-party M&A database count; implausibly low vs. the company's typical pace elsewhere in this window. Matches parent_long_run."),
    "FY2019": e(3, "count", LNICOPER, "third_party", "Third-party count; matches parent_long_run."),
    "FY2021": e(85, "count approximate, company-wide, stated as a minimum ('more than')", LVOLARIS85, "third_party", "Third-party (Volaris/Corum Group) reporting; not a Constellation-disclosed figure."),
}

# --------------------------------------------------------------- shares_outstanding
ledger["shares_outstanding"] = {
    "FY2023": e(21.19, "millions", LMACROSHARES, "third_party", "Matches ledger.json."),
    "FY2024": e(21.19, "millions", LMACROSHARES, "third_party", "Matches ledger.json."),
    "FY2025": e(21.19, "millions", L2025, "company", "21,191,530 shares per the company's FY2025 results release."),
}

# --------------------------------------------------------- dividends_per_share_regular
ledger["dividends_per_share_regular"] = {
    "FY2010": e(2.00, "CAD per share approximate", L2010, "company",
                "Dividend declared March 2, 2011 for FY2010; currency assumed CAD (TSX-listed shares), not directly confirmed from the release text. Whether styled 'annual' or an aggregate of quarterly payments was not confirmed."),
    "FY2011": e(2.00, "CAD per share approximate", "https://businesscaseweekly.substack.com/p/bcw-49-constellation-software", "third_party", "'$2 a share for 2011 in total', before the board adopted a true $1/share quarterly dividend starting Q1 2012."),
    "FY2013": e(4.0, "USD (4 x USD 1.00 quarterly)", "https://www.globenewswire.com/news-release/2013/10/30/1474983/0/en/Constellation-Software-Inc-Announces-Results-for-the-Third-Quarter-Ended-September-30-2013-and-Declares-Quarterly-Dividend.html", "company", "Quarterly rate of USD 1.00 confirmed; annual total assumes the same rate held for all four quarters of FY2013 (unchanged since 2012 per company disclosure pattern)."),
    "FY2014": e(4.0, "USD (4 x USD 1.00 quarterly)", "https://www.globenewswire.com/news-release/2014/03/06/1475011/0/en/Constellation-Software-Inc-Declares-Quarterly-Dividend.html", "company"),
    "FY2015": e(4.0, "USD (4 x USD 1.00 quarterly)", L2015REL, "company", "No special dividend named in this release for FY2015."),
    "FY2018": e(4.0, "USD (4 x USD 1.00 quarterly)", L2018REL, "company", "Declared alongside the USD 20.00 special dividend."),
    "FY2019": e(4.0, "USD (4 x USD 1.00 quarterly)", L2019, "company"),
    "FY2020": e(4.0, "USD (4 x USD 1.00 quarterly)", "https://www.globenewswire.com/news-release/2020/11/02/2118890/0/en/Constellation-Software-Inc-Announces-Results-for-the-Third-Quarter-Ended-September-30-2020-and-Declares-Quarterly-Dividend.html", "company"),
    "FY2022": e(4.0, "USD (4 x USD 1.00 quarterly)", L2022, "company", "No special dividend named in this release."),
    "FY2023": e(4.0, "USD (4 x USD 1.00 quarterly)", "https://www.globenewswire.com/news-release/2024/3/6/2841834/0/en/Constellation-Software-Inc-Announces-Results-for-the-Fourth-Quarter-and-Year-Ended-December-31-2023-and-Declares-Quarterly-Dividend.html", "company"),
    "FY2024": e(4.0, "USD (4 x USD 1.00 quarterly)", L2024GW, "company"),
    "FY2025": e(4.0, "USD (4 x USD 1.00 quarterly)", L2025, "company", "Regular rate still USD 1.00 quarterly; no special dividend named."),
    # FY2007, FY2008, FY2009, FY2012, FY2016, FY2017, FY2021: left as gap. Only a bare
    # quarterly rate (not a distinct annual total) was found for FY2012 and FY2017;
    # per the intake's own gap notes the USD 1.00/quarter rate is "very likely" unchanged
    # through FY2016/FY2017/FY2021 but this was not separately confirmed with its own
    # source for those specific years, so no figure is recorded (never invent a figure).
}

ledger["dividends_per_share_special"] = {
    "FY2018": e(20.0, "USD per share, one-time special dividend", L2018REL, "company",
                "Declared February 14, 2019 alongside FY2018 results and the regular USD 1.00 quarterly dividend, both paid April 5, 2019 to holders of record March 16, 2019. Company: 'we have capital in excess of our needs and should return the excess to shareholders.' Known issue 8: this is the only special dividend found anywhere across all five stage1 sweeps; earlier years were specifically searched and none were found -- see coverage note."),
}

# ----------------------------------------------------------------------- employees
ledger["employees"] = {
    "FY2011": e(1022, "count (R&D employees only, NOT total company headcount)", LAIF2011, "company",
                "2011 AIF: ~1,022 employees involved in R&D for fiscal 2011. This is an R&D headcount subset; no total company-wide employee figure was found for FY2011."),
    "FY2015": e(9924, "average full-time employees (annual average)", LAIF2015, "company",
                "2015 AIF: ~9,924 FTE average for fiscal 2015. A point-in-time figure of ~10,478 as at Dec 31, 2015 is also in the same source (different measurement basis, not a conflict)."),
    "FY2019": e(23000, "approximate full-time employees, as at Dec 31 2019", L2019AIF, "company"),
    "FY2022": e(41000, "approximate full-time employees, globally", L2022AIF, "company",
                "Known issue 7: company AIF-sourced figure of ~41,000 preferred over a third-party (macrotrends) figure of 45,000 as at Dec 31, 2022, which is recorded as a conflict."),
    "FY2023": e(57637, "count, approximate (workforce-analytics estimate, not company-disclosed)", LREVELIO, "third_party"),
    "FY2024": e(57217, "count, approximate (workforce-analytics estimate, not company-disclosed)", LREVELIO, "third_party"),
    "FY2025": e(55775, "count, approximate (workforce-analytics estimate, not company-disclosed)", LREVELIO, "third_party", "Down 2.6%/-1,442 from FY2024 per the same aggregator."),
}

# ------------------------------------------------------------------------- roic
ledger["roic_pct"] = {
    "FY2009": e(24, "percent", LSHLETTER09, "company", "2009 President's letter reported 24% ROIC for 2009."),
    "FY2010": e(25, "percent", LSHLETTER10, "company", "Reused from long-term-hold/holdings.json parent_long_run."),
}

ledger["roic_plus_organic_pct"] = {
    # FY2007's two figures (24% Q3, 25% Q4) are explicitly quarterly per the intake, not a
    # confirmed FY2007 annual average, so left as a gap rather than mislabeling a quarter as
    # the annual figure.
    "FY2017": e(33, "percent, approximate", LSHLETTERS_WEBFLOW, "third_party",
                "ROIC+OGr 'remained relatively flat at 33%' in 2017 with shareholders' Average Invested Capital growing 29%. Corroborated by a second third-party source (bizalmanac.substack.com) citing the same 33% figure and 29% ROIC alone for FY2017."),
}

# ------------------------------------------------------------------------- capex
ledger["capex"] = {
    "FY2023": e(68, "USD millions, approximate", LSTOCKOPEDIA, "third_party", "Aggregator-derived cash-flow-statement figure; not located in a company press release."),
    "FY2024": e(72, "USD millions, approximate", LSTOCKOPEDIA, "third_party", "Aggregator-derived cash-flow-statement figure; not located in a company press release."),
}

# ------------------------------------------------------- share_price_cad_year_end (issue 9)
# Every FY2007-FY2025 year end is gap; only a synthetic IPO key and the aggregate_returns key
# below carry actual data, per known issue 9.
ledger["share_price_cad_year_end"] = {
    "IPO 2006-05-17": e(17.00, "CAD, IPO offering price (not a fiscal year-end close)", LCANTECH, "third_party",
                        "Constellation listed on the TSX May 17, 2006 at an IPO price of C$17.00/share (first-day close C$18.30). Not independently confirmed from Constellation's own short-form prospectus (WebFetch unavailable); treated as third_party. No FY2006-FY2025 fiscal year-end closing price could be sourced via WebSearch in any of the five intake sweeps -- year end prices are gap for every one of the 19 fiscal years, per known issue 9."),
}

ledger["aggregate_returns"] = {
    "total_return_10yr_pct": e(460.73, "percent total return, CNSWF USD, approximate, 10 years to 2026-05", LFINANCECHARTS, "third_party"),
    "total_return_15yr_pct": e(3597.83, "percent total return, CNSWF USD, approximate, 15 years to 2026-05", LFINANCECHARTS, "third_party"),
    "annualized_return_10yr_pct": e(19.63, "percent per year, CSU.TO CAD, approximate, 10 years to 2026-09", LPORTFOLIOSLAB, "third_party", "S&P 500 averaged 13.95 percent over the same window per the same source."),
    "positive_years_count": e(17, "positive calendar years out of since-listing total (2 negative), approximate", LPORTFOLIOSLAB, "third_party"),
}

# ------------------------------------------------------------------------ events
events = [
    {"date": "2006-05-17", "item": "ipo", "text": "Constellation Software listed on the TSX (ticker CSU) at an IPO price of C$17.00/share, raising about C$80 million; shares closed their first day at C$18.30. The offering was structured mainly to give early investor TD Capital Canadian Private Equity Partners a liquidity event.", "source_url": LCANTECH, "confidence": "third_party"},
    {"date": "2006", "item": "ipo_growth_target", "text": "At IPO, management set a five-year objective: average annual growth of Net Revenues per share and Adjusted EBITDA per share in excess of 20% for January 1, 2006 to December 31, 2010.", "source_url": LLETTERS, "confidence": "company"},
    {"date": "2007", "item": "ipo_growth_target_progress", "text": "After two years, Constellation reported 16% net revenue growth and 33% EBITDA growth for 2007 (following 27% and 31% in 2006), calling the 20%/year, five-year objective 'challenging, but achievable.'", "source_url": LLETTERS, "confidence": "company"},
    {"date": "2008-09-30", "item": "acquisition", "text": "Constellation completed the acquisition of MAXIMUS Inc.'s Justice, Education and Asset Solutions businesses for total consideration of US$40 million (US$35M cash at closing plus a US$5M holdback). The largest single named deal identified in the FY2007-2011 window, though below the USD 100M event threshold.", "source_url": LMAXIMUS, "confidence": "company"},
    {"date": "2011", "item": "operating_group", "text": "Volaris, which grew out of Trapeze Group (Constellation's first acquisition, 1995), was incorporated under its current name in 2011.", "source_url": "https://www.volarisgroup.com/about/", "confidence": "company"},
    {"date": "2011-04-04", "item": "strategic_review_2011", "text": "Constellation's board announced a review of strategic alternatives ('The Process', flagged as a sale possibility in the 2010 President's letter), retaining BofA Merrill Lynch and BMO Capital Markets. During the roughly nine-month review, operating groups stopped acquiring in new verticals; 2011 acquisition spending came in at less than half of 2010's level.", "source_url": "https://www.csisoftware.com/docs/default-source/investor-relations/presidents-letter/2011_presidents_letter.pdf", "confidence": "company"},
    {"date": "2012", "item": "strategic_review_outcome", "text": "The strategic review concluded without a sale; Constellation remained independent. The board adopted a true quarterly dividend of USD 1.00/share starting Q1 2012 (after paying $2/share in total for 2011); large holders such as OMERS obtained liquidity by selling shares in the market instead.", "source_url": "https://businesscaseweekly.substack.com/p/bcw-49-constellation-software", "confidence": "third_party"},
    {"date": "2011-12", "item": "acquisition", "text": "Constellation's Friedman operating group acquired Markinson Technologies Pty Ltd.", "source_url": "https://www.globenewswire.com/news-release/2011/12/14/1474721/0/en/Constellation-Software-Inc-Acquires-Markinson-Technologies-Pty-Ltd.html", "confidence": "company"},
    {"date": "2013-12-16", "item": "acquisition_above_100m", "text": "Constellation agreed to acquire 100% of Total Specific Solutions (TSS) B.V. (Netherlands) for approximately EUR 240 million -- then the company's largest deal. TSS had annual gross revenue of approximately EUR 174 million and about 1,400 employees; Constellation added a one-year US$350M term loan to fund the deal. The acquisition closed December 31, 2013.", "source_url": "https://www.globenewswire.com/news-release/2013/12/16/1474994/0/en/Constellation-Software-Inc-Reaches-Agreement-to-Acquire-Total-Specific-Solutions-TSS-B-V-and-Increases-Credit-Facility.html", "confidence": "company"},
    {"date": "2018", "item": "president_letter_policy_change", "text": "The 2018 President's letter was Mark Leonard's last full annual letter; he said he would no longer write yearly letters as a matter of course. Reported rationale: sharing Constellation's operating and capital-allocation tactics publicly was seen as helping an expanding field of 'Constellation emulators'.", "source_url": "https://www.eagletalonpartners.com/leadership-lens/mark-leonard-stopped-writing-to-shareholders-in-2018", "confidence": "third_party"},
    {"date": "2019-02-14", "item": "special_dividend", "text": "Alongside FY2018 results, Constellation declared a special dividend of USD 20.00/share plus the regular USD 1.00/share quarterly dividend, both paid April 5, 2019. Company: 'We are optimistic about our acquisition pace for 2019, but we feel that we have capital in excess of our needs and should return the excess to shareholders.' No further special dividend was found in any later year searched (known issue 8).", "source_url": L2018REL, "confidence": "company"},
    {"date": "2019-10-31", "item": "fcfa2s_introduced", "text": "Constellation adopted the 'Free Cash Flow Available to Shareholders' (FCFA2S) metric starting with Q3 2019 results, per third-party commentary; prior to this the company's operative non-GAAP cash metric was 'Adjusted Net Income.'", "source_url": "https://www.globenewswire.com/news-release/2019/10/31/1939194/0/en/Constellation-Software-Inc-Announces-Results-for-the-Third-Quarter-Ended-September-30-2019-and-Declares-Quarterly-Dividend.html", "confidence": "third_party"},
    {"date": "2021-01-05", "item": "spin_out", "text": "Constellation completed the spin-out of Topicus.com Inc., distributing 1.859817814 Topicus shares per Constellation common share held as of Dec 28, 2020; Topicus began trading on the TSX Venture Exchange around February 1, 2021.", "source_url": "https://www.globenewswire.com/news-release/2021/01/05/2153464/0/en/Constellation-Software-Inc-Completes-Spin-Out-of-Topicus-com-Inc.html", "confidence": "company"},
    {"date": "2021-02", "item": "hurdle_rate_change", "text": "Mark Leonard's 2021 President's Letter announced Constellation would accept a lower hurdle rate on larger acquisitions to deploy the roughly $989M of excess cash generated in 2020, reasoning that brokers had only included Constellation in about 16% of large VMS sale processes over the prior five years, and a lower large-deal hurdle rate would get it included in more auctions. He also described developing 'a new circle of investing competence outside of the VMS sphere.'", "source_url": "https://www.marketscreener.com/quote/stock/CONSTELLATION-SOFTWARE-IN-1409607/news/Constellation-Software-2021-President-s-Letter-32446976/", "confidence": "third_party"},
    {"date": "2022-03-02", "item": "acquisition_above_100m", "text": "Constellation's Harris Operating Group agreed to acquire Allscripts Healthcare Solutions' Hospitals and Large Physician Practices segment (Sunrise, Paragon, Allscripts TouchWorks, Allscripts Opal, dbMotion) for up to US$700 million (US$670M fixed plus up to US$30M contingent). The segment's 2021 gross revenue was US$928 million. Completed May 2, 2022; later rebranded Altera Digital Health.", "source_url": "https://www.globenewswire.com/news-release/2022/03/02/2395833/0/en/Constellation-Software-s-Harris-Operating-Group-Acquires-Allscripts-Hospitals-and-Large-Physician-Practices-Business-Segment.html", "confidence": "company"},
    {"date": "2023-02-22", "item": "spin_out", "text": "Constellation and its subsidiary Lumine Group Inc. completed the purchase of WideOrbit Inc.; Lumine Group was then spun out via a dividend-in-kind (3.0003833 Lumine shares per Constellation common share, record date Feb 16, 2023), beginning to trade on the TSX Venture Exchange around March 24, 2023 as 'LMN'.", "source_url": "https://www.globenewswire.com/en/news-release/2023/02/22/2613833/0/en/Constellation-Software-Inc-and-Lumine-Group-Inc-Complete-Purchase-of-WideOrbit-Inc-and-Lumine-Group-Spin-Out.html", "confidence": "company"},
    {"date": "2023-08", "item": "non_cash_special_distribution", "text": "Constellation announced a non-cash 'warrant dividend' (declared August 16, 2023) and a dividend/final prospectus tied to a previously announced rights offering of Series 1 Debentures (August 24, 2023). These are non-cash special distributions, not a cash special dividend per share.", "source_url": "https://www.globenewswire.com/news-release/2023/8/16/2726016/0/en/Constellation-Software-Inc-Announces-Declaration-of-Warrant-Dividend.html", "confidence": "company"},
    {"date": "2023-09-15", "item": "acquisition_above_100m", "text": "Constellation's Perseus Operating Group completed the acquisition of Black Knight's Empower loan origination system and Optimal Blue businesses for approximately US$700 million (US$200M cash plus a US$500M promissory note), divested by Intercontinental Exchange (ICE) to help secure FTC antitrust clearance of ICE's acquisition of Black Knight.", "source_url": "https://www.csisoftware.com/category/press-releases/2023/09/15/constellation-software-s-perseus-group-completes-acquisition-of-black-knight-s-empower-and-optimal-blue-businesses", "confidence": "company"},
    {"date": "2024-03", "item": "acquisition_undisclosed_price", "text": "Constellation's Perseus Operating Group completed the acquisition of Auto-IT Pty Ltd (dealer management systems). Purchase price not disclosed.", "source_url": "https://www.businesswire.com/news/home/20240303858962/en/Perseus-Operating-Group-of-Constellation-Software-Completes-Acquisition-of-Auto-IT-Group", "confidence": "third_party"},
    {"date": "2025-09-25", "item": "leadership_change", "text": "Mark Leonard resigned as President, effective immediately, citing health reasons. The Board appointed Mark Miller (COO for over thirty years) as President; Leonard remained a Director. Shares fell 5.5% to C$3,910.71 on the news, erasing roughly C$4.8 billion of market cap.", "source_url": "https://www.globenewswire.com/news-release/2025/09/25/3156334/0/en/Constellation-Software-Inc-Announces-the-Resignation-of-Mark-Leonard-and-Appointment-of-Mark-Miller-as-President-of-Constellation-Software.html", "confidence": "company"},
    {"date": "2025-11", "item": "acquisition_undisclosed_price", "text": "Constellation acquired TECVIA, a Munich-based provider of media and training solutions for the mobility sector. Purchase price not disclosed.", "source_url": "https://www.levelheadedinvesting.com/p/constellation-software-csu-q1-2026-results-the-market-feared-ai-constellation-deployed-1-6-billion", "confidence": "third_party"},
    {"date": "2026-03", "item": "leadership_change", "text": "Constellation announced founder Mark Leonard will not stand for re-election to the Board, term ending after the May 15, 2026 AGM; he is expected to remain involved as an advisor on the Permanent Engaged Minority Shareholder strategy.", "source_url": "https://www.csisoftware.com/constellation-software-inc-announces-mark-leonards-decision-to-not-stand-for-re-election-to-board-of-directors/", "confidence": "company"},
]

# --------------------------------------------------------------------- conflicts
conflicts = [
    {"metric": "revenue", "period": "FY2010", "values": [631, 171],
     "sources": [L2010, L2010],
     "resolution": "picked 631 (full fiscal year total, confirmed twice independently); 171 is the Q4-2010-only quarterly revenue, a quarterly misread (known issue 1)."},
    {"metric": "net_income_attributable", "period": "FY2011", "values": [157, 63],
     "sources": [L2012, L2012],
     "resolution": "picked 157 (two independent pass-2 retrievals of the FY2012 release pair 157 with FY2011, consistent with a stated $75M FY2011 tax recovery); 63 matches nothing else and is a likely error, possibly a cross-year mixup with FY2009's $62M Adjusted Net Income (known issue 2)."},
    {"metric": "adjusted_ebita", "period": "FY2012", "values": ["8.41 per diluted share (not a total)"],
     "sources": [L2013],
     "resolution": "kept neither as the FY2012 total; $8.41 is a per-share figure and no aggregate FY2012 Adjusted EBITA dollar figure was located anywhere. Ledger value set to gap (known issue 3)."},
    {"metric": "adjusted_ebita", "period": "FY2013", "values": [233.8, 233.6, 178],
     "sources": [L2014S, L2013, L2013],
     "resolution": "picked 233.8 (directly quoted in the FY2014 report's comparative disclosure), corroborated by the independently derived 233.6; 178 is recorded as the outlier and treated as a likely misread (known issue 4)."},
    {"metric": "organic_growth_pct", "period": "FY2009", "values": [-3, -10],
     "sources": [L2010, LSHLETTER09],
     "resolution": "picked -3 (year-specific, from the FY2010 release comparative); -10 is a stated two-year (2008-2009) average from the 2009 President's letter, less precise for FY2009 alone."},
    {"metric": "organic_growth_pct", "period": "FY2013", "values": [4, 8],
     "sources": [LLETTER13, LLETTER13],
     "resolution": "picked 4 (total company Organic Net Revenue Growth); 8 is a narrower, distinct metric -- 'Organic Growth in Maintenance Revenue' specifically -- from the same 2013 President's letter, not a genuine conflict on the same measure."},
    {"metric": "organic_growth_pct", "period": "FY2016", "values": [0, -1, 1],
     "sources": [L2016MDA_CSI, L2016MDA_SEDAR, L2016CALL],
     "resolution": "set to 0 (mda_q4_2016.pdf, the FY2016 annual release, already used by long-term-hold/holdings.json parent_long_run); -1 (a sedarplus copy also titled 'MD&A FY2016') and +1 (a conference-call announcement, likely conflating a quarterly figure with the annual one) could not be reconciled and are both recorded here (known issue 6)."},
    {"metric": "organic_growth_fx_adj_pct", "period": "FY2016", "values": [1, 1, 3],
     "sources": [L2016MDA_CSI, L2016MDA_SEDAR, L2016CALL],
     "resolution": "set to 1 (mda_q4_2016.pdf, matches the sedarplus figure by coincidence, and is paired with the resolved 0% reported figure); the conference-call announcement's 3% could not be reconciled and is recorded here (known issue 6)."},
    {"metric": "employees", "period": "FY2022", "values": [41000, 45000],
     "sources": [L2022AIF, "https://www.macrotrends.net/stocks/charts/CNSWF/constellation-software/number-of-employees"],
     "resolution": "picked 41,000 (company AIF) over 45,000 (third-party aggregator) (known issue 7)."},
    {"metric": "acquisitions_cash_spent", "period": "FY2019", "values": [688, 549],
     "sources": [L2019, L2019AIF],
     "resolution": "picked 688 (directly quoted company total consideration figure); 549 is a third-party-confidence 'aggregate cash consideration including acquired cash' figure sourced to the 2019 AIF that could not be independently confirmed with a direct quote."},
    {"metric": "acquisitions_cash_spent", "period": "FY2021", "values": [1337, 1517],
     "sources": [L2021MDA, L2021],
     "resolution": "kept 1337 (already held by long-term-hold/holdings.json parent_long_run, from the Q4 2021 MD&A, net of a Topicus.com subscription adjustment); 1517 is a company-sourced 'total consideration including holdbacks, contingent consideration and Topicus.com amounts' figure found independently in this project's own FY2021 release search -- a different, broader basis, not reconciled."},
    {"metric": "adjusted_ebita", "period": "FY2022-FY2023", "values": [1556, 2043, 1185],
     "sources": [LTORTOISE, LTORTOISE, LTORTOISE],
     "resolution": "kept neither for the ledger value (both years set to gap); all three are third-party estimates derived by applying an assumed EBITA margin to revenue, not company-disclosed dollar figures, and the two FY2023 estimates (2043 vs 1185) are themselves mutually inconsistent."},
]

# ---------------------------------------------------------------------- coverage
def compute_coverage(ledger, years):
    coverage = {}
    for metric, periods in ledger.items():
        if metric in ("share_price_cad_year_end", "aggregate_returns"):
            continue
        years_found = [p for p in periods if p in years]
        company_sourced = [p for p in years_found if periods[p].get("confidence") == "company"]
        third_party = [p for p in years_found if periods[p].get("confidence") == "third_party"]
        coverage[metric] = {
            "years_found": len(years_found),
            "company_sourced": len(company_sourced),
            "third_party": len(third_party),
        }
    # share_price_cad_year_end: explicitly 0 of 19 fiscal years (only the synthetic IPO entry
    # exists, which is not one of the 19 fiscal years).
    coverage["share_price_cad_year_end"] = {"years_found": 0, "company_sourced": 0, "third_party": 0}
    return coverage

# ---------------------------------------------------------------------- gate checks
def gate_checks(ledger, years):
    results = {}

    # 1. every entry has a source_url
    missing_src = []
    for metric, periods in ledger.items():
        for period, entry in periods.items():
            if not entry.get("source_url"):
                missing_src.append(f"{metric}/{period}")
    results["every_entry_has_source_url"] = {
        "status": "PASS" if not missing_src else "FAIL",
        "detail": "All entries carry a source_url." if not missing_src else f"Missing source_url: {missing_src}",
    }

    # 2. revenue growth recomputed from adjacent revenue matches stated revenue_growth_pct within 1 point
    rev = ledger["revenue"]
    growth_checks = []
    for period, entry in ledger.get("revenue_growth_pct", {}).items():
        yr = int(period[2:])
        prev_period = f"FY{yr-1}"
        if prev_period in rev and period in rev:
            r0 = rev[prev_period]["value"]
            r1 = rev[period]["value"]
            computed = (r1 - r0) / r0 * 100
            stated = entry["value"]
            ok = abs(computed - stated) <= 1.0
            growth_checks.append({"period": period, "computed_pct": round(computed, 2), "stated_pct": stated, "within_1pt": ok})
        else:
            growth_checks.append({"period": period, "computed_pct": None, "stated_pct": entry["value"], "within_1pt": None, "note": "adjacent year revenue not in ledger, not checkable"})
    failed = [g for g in growth_checks if g["within_1pt"] is False]
    results["revenue_growth_matches_stated"] = {
        "status": "PASS" if not failed else "FAIL",
        "detail": growth_checks,
    }

    # 3. diluted_eps * shares_outstanding within 3% of net_income_attributable where all three exist
    eps_checks = []
    for period in years:
        eps = ledger.get("diluted_eps", {}).get(period)
        shares = ledger.get("shares_outstanding", {}).get(period)
        ni = ledger.get("net_income_attributable", {}).get(period)
        if eps and shares and ni:
            implied = eps["value"] * shares["value"]
            diff_pct = abs(implied - ni["value"]) / ni["value"] * 100
            eps_checks.append({"period": period, "implied_ni": round(implied, 1), "stated_ni": ni["value"], "diff_pct": round(diff_pct, 2), "within_3pct": diff_pct <= 3.0})
    failed_eps = [c for c in eps_checks if not c["within_3pct"]]
    results["eps_times_shares_matches_net_income"] = {
        "status": "PASS" if not failed_eps else "FAIL",
        "detail": eps_checks if eps_checks else "No year has all three of diluted_eps, shares_outstanding and net_income_attributable, so nothing to check.",
    }

    # 4. no FCFA2S entry before FY2013 unless the source names it
    early_fcfa2s = [p for p in ledger.get("fcfa2s", {}) if int(p[2:]) < 2013]
    results["no_fcfa2s_before_fy2013"] = {
        "status": "PASS" if not early_fcfa2s else "FAIL",
        "detail": "No FCFA2S entries before FY2013 (earliest is FY2018)." if not early_fcfa2s else f"Found: {early_fcfa2s}",
    }

    return results

coverage = compute_coverage(ledger, YEARS)
gate = gate_checks(ledger, YEARS)

history_ledger = {
    "company": "Constellation Software Inc.",
    "generated_from": [
        "stage1/years_2007_2011.json",
        "stage1/years_2012_2016.json",
        "stage1/years_2017_2021.json",
        "stage1/years_2022_2025.json",
        "stage1/prices_dividends_letters.json",
    ],
    "reused_from": [
        "../ledger.json (FY2022-FY2025, read only)",
        "../long-term-hold/holdings.json parent_long_run (read only)",
    ],
    "years": YEARS,
    "ledger": ledger,
    "events": events,
    "conflicts": conflicts,
    "coverage": coverage,
    "gate": gate,
    "notes": {
        "dividends_per_share_special_coverage": "All five stage1 intake sweeps specifically searched for special dividends before the confirmed USD 20.00/share special (declared Feb 2019, for FY2018). None were found for any year FY2007-FY2025; this is recorded as a confirmed absence in coverage, not a data gap from under-searching (known issue 8).",
        "share_price_cad_year_end_coverage": "Year end CAD closing prices are gap for all 19 fiscal years (FY2007-FY2025) despite dedicated search passes in every stage1 window; WebFetch/curl are unavailable in this environment so aggregator pages with historical tables could not be opened directly. Only the IPO offering price (synthetic key 'IPO 2006-05-17') and the third-party aggregate return figures (ledger key 'aggregate_returns') exist (known issue 9).",
        "adjusted_ebita_and_adjusted_net_income_never_mixed": "adjusted_ebita, adjusted_net_income and fcfa2s are always kept as separate ledger keys per year; fcfa2s is only populated FY2018 onward (the metric name postdates FY2017; 'adjusted net income' was the era's term before that, per the intake spec's labeling guidance).",
    },
}

out_path = "/home/user/Sample_R/analysis/constellation-software/history-2007-2025/history_ledger.json"
with open(out_path, "w") as f:
    json.dump(history_ledger, f, indent=2)

print("Wrote", out_path)
print("\nGate results:")
for k, v in gate.items():
    print(" ", k, "->", v["status"])
print("\nConflict count:", len(conflicts))
print("\nCoverage (metric: years_found/company/third_party):")
for k, v in coverage.items():
    print(" ", k, v)

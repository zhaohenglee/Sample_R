# Stage 6 Review: Constellation Software history, 2007 to 2025

Reviewer: Fable 5.1, single pass at the user's request, 2026-09-14.
Scope: report.md, findings/eras.md, findings/year_by_year.md, findings/cash_and_capital.md, history_ledger.json, history_metrics.json, the five stage1 files, and the earlier reports' ledger.json and metrics.json where reused. The executive summary in report.md was written in this pass. Data corrections made during review are listed in section 1 and recorded in the ledger's conflicts and notes.

## 1. Number tracing and tag resolution

### Tag check (python, scratchpad/check_hist.py)

report.md: 602 citation tags, 304 unique, after the executive summary was added. Every `[hist:...]`, `[hm:...]`, `[event:...]`, `[ledger:...]` and `[metrics:...]` tag resolves to a real key, or to a metric whose value is null where the text says gap. Zero unresolved. One descriptive sentence in the Sources section used the bracket form to describe the tag scheme and was reworded to plain text so it would not read as a citation.

Findings files: 473 tags, 281 unique, across the three files. Two unresolved before assembly, both generic `<era>` placeholders in a table header of cash_and_capital.md, replaced with concrete era tags at Stage 5.

### Ten random spot checks (seed 20260914, drawn from ledger entries with a value)

| # | Ledger figure | Confidence | Source record | Result |
|---|---|---|---|---|
| 1 | Cash from operations FY2017 528 | company | FY2017 annual release, globenewswire 2018-02-14 | Match |
| 2 | Employees FY2024 57,217 | third party | Revelio Labs tracker, approximate | Match to source; not a company count |
| 3 | FCFA2S FY2024 1,472 | company | FY2024 annual release, csisoftware.com, reused from the first report's ledger | Match |
| 4 | Diluted EPS FY2013 4.39 | company | FY2013 annual release PDF on csisoftware.com | Match |
| 5 | Regular dividend FY2018 4.00 | company | FY2018 annual release, globenewswire 2019-02-14, declared with the USD 20.00 special | Match |
| 6 | Revenue FY2007 243.02 | third party | eulerpool aggregator | Match to source; the company's own FY2007 release could not be read |
| 7 | Diluted EPS FY2014 4.87 | company | FY2014 statutory filing on csisoftware.com | Match |
| 8 | ROIC FY2009 24 percent | company | 2009 President letter PDF | Match |
| 9 | Net income FY2014 103 | company | FY2014 statutory filing, 103.1 | Match |
| 10 | Acquisition count FY2012 35 | derived | FY2013 disclosure on SEC EDGAR, comparative sentence | Match to source; derived from prose, not a stated total |

Ten of ten trace. Three are third party or derived.

### Arithmetic re-checks that passed

Era revenue CAGRs recomputed by hand from ledger endpoints: 33.55, 24.26, 19.80, 20.63 and 23.97 percent, all matching history_metrics. IPO price CAGR 28.62 percent over 20.32 years. Cash conversion 2.37x FY2013, 5.34x FY2025. Net margin 4.6 percent FY2007, 7.73 FY2022, 4.41 FY2025. Dividend cost 84.76 a year at 4.00 on 21.19 million shares; 508.56 in FY2018 at 24.00. Revenue per share 11.47 FY2007 to 548.51 FY2025. Era dividend totals 20.00, 40.00, 16.00 and 80.00 over sixteen years. FY2009 ROIC of 24 percent times the era 2 reinvestment rate of 96.62 percent gives 23.19 percent against 23.10 realised. The compute script's three internal spot checks pass.

### Corrections made at review

1. **Share count.** Carried forward at 21.19 million for FY2006 to FY2022 on two third party statements that it is unchanged since the IPO. Only FY2025 is company sourced. Without it no per share figure exists before FY2023; with it, every per share CAGR equals its total CAGR. Labelled in the ledger, the findings and the report.
2. **Cash from operations FY2016 (491) and FY2022 (1,297)** added from release comparatives found after Stage 2.
3. **Regular dividends FY2012, FY2016, FY2017, FY2021** carried at 4.00 as derived, the rate being company sourced either side with no change announced.
4. **Acquisition counts FY2015 and FY2019** set to gap; the value 3 counted disclosed major deals, not the annual total.
5. **Per share cash CAGR for FY2017 to FY2021** nulled in the compute script; it had chained adjusted net income into FCFA2S while the total CAGR was correctly null. Caught by the Stage 4 cash agent.

### Mismatches and weak links (all files)

A. **The first era is the least reliable part of the file.** FY2007 and FY2008 revenue and net income are aggregator figures. FY2009 revenue is derived from a stated growth rate. FY2013 revenue is derived from two segment lines. Cash from operations is missing for FY2007, FY2008, FY2010, FY2011 and FY2012. The 33.55 percent era CAGR rests on a third party start point.
B. **Two cash metrics, never continuous.** Adjusted net income to FY2017, FCFA2S from FY2018 (a restated comparative; the metric was adopted with the Q3 2019 release). The era 3 and full window cash CAGRs are null by design. Anyone quoting a nineteen year cash CAGR from this file is chaining incompatible series.
C. **Adjusted EBITA stops in FY2018.** Eight years on file. Two third party FY2022 and FY2023 estimates were rejected as margin assumptions applied to revenue. The company's headline profit metric cannot be trended for the last seven years.
D. **Acquisition count exists for five years,** two derived or third party. Deal cadence, the most cited fact about this company, is not readable from primary sources in this file.
E. **Acquisition spend bases differ by year.** FY2019 uses total consideration 688 over a cash figure 549. FY2021 uses 1,337 net of a Topicus item over 1,517. FY2020 (179) and FY2022 (1,600) are third party. FY2013 and FY2014 exclude holdbacks and contingent consideration; FY2025 includes them. The reinvestment series is directionally right and not uniform.
F. **Year end share prices: gap for all nineteen years.** Search snippets do not carry historical closes and outbound fetch is blocked by the egress proxy, tested. Return rests on the IPO price and three third party aggregates: 460.73 percent over ten years, 3,597.83 percent over fifteen, 19.63 percent a year over ten. None includes a dividend in this file's arithmetic.
G. **Dividend currency for FY2010 and FY2011** is recorded as CAD 2.00 annual from intake and was not verified against the release; FY2012 onward is USD. The dividend column is not one currency.
H. **FY2011 net income** 157 versus 63, resolved to 157 on two retrievals. **FY2013 adjusted EBITA** 233.8 versus 178, resolved on a direct quote. **FY2016 organic growth** had three candidate values; 0 percent reported and 1 percent FX adjusted were taken from the FY2016 MD&A already used by the second report.
I. **FY2008 organic growth of negative 10** is a two year average for 2008 and 2009 applied to FY2008 alone; FY2009's negative 3 is year specific. The era 1 organic average of negative 5.67 uses three years and inherits that.
J. **The IPO target test is null.** No FY2006 adjusted EBITDA exists and the share count is assumed. The claim that the 2006 to 2010 target was exceeded is third party commentary and is marked unverified.
K. **Special dividends.** Only the USD 20.00 declared 14 February 2019 was found, booked to FY2018. My own intake prompt asserted that earlier specials existed; five sweeps found none, and none is claimed.
L. **Employees** exist for seven years on mixed bases; FY2022 conflicts 41,000 (AIF) against 45,000 (tracker).
M. **Bucket 1 amortization** is gap for every year in this ledger; the FY2023 (860) and FY2024 (1,044) figures come from the first report's intake and are the broader intangibles line, used as an upper bound.
N. **Leonard resignation market reaction** (shares down 5.5 percent, about C$4.8 billion) is carried from an event record; the underlying price is not in the ledger.

## 2. The strongest case against each of the top three conclusions

### Conclusion 1: "Cash compounded above 23 percent in every era where it can be measured."

Case against, same metrics. It can be measured in two of four eras, and they are the two easiest: 2012 to 2016 on adjusted net income, a metric the company later abandoned, and 2022 to 2025 on FCFA2S, four years that include the 2022 to 2023 deployment surge. The decade between, where the hurdle was lowered and the special dividend paid, has no valid cash rate at all. Cash from operations, the continuous line, did compound at 25 to 28 percent, but CFO is before acquisitions, and this company spends 83 percent of it. The compounding that reached shareholders is the after acquisition line, which was negative in half the measurable years. "Every era where it can be measured" is two eras out of four and the flattering two.

### Conclusion 2: "The share count never moved, so per share value tracked the totals exactly."

Case against, same metrics. The count is company sourced for one year. The other eighteen rest on two third party sentences and were carried forward by the reviewer. If a single issuance occurred in the unverified years, every per share CAGR in the file is wrong by that amount. More important, no dilution at the parent says nothing about dilution below it: the second report found 13.83 percent of Lumine issued to WideOrbit holders and Topicus at 30.35 percent economic, both invisible to a parent share count. "Never issued shares" is true of the parent and is not the same as "shareholders kept all the growth".

### Conclusion 3: "Organic growth never carried the company, and that weakness is not new."

Case against, same metrics. The organic series is the best covered in the file, seventeen of nineteen years, but it is reported organic, and FX adjusted exists for only eleven years. The negative first era rests on a two year average applied to one year and two "about" figures. And the reading cuts both ways: an engine that compounded cash at 23 to 25 percent with organic growth near zero for nineteen years is evidence that organic growth was never the driver, which weakens the second report's kill criterion built on it as much as it confirms the first report's concern. The record says organic growth was always this weak; it does not say a return on deployed capital of 11 percent was ever normal.

## 3. The single assumption that flips the reading

Return on deployed capital, again. The history closes the identity in exactly one place: a 24 percent ROIC from 2009 against a 96.62 percent reinvestment rate implies 23.19 percent per share growth, and 23.10 percent was realised in 2012 to 2016. At the third party 10.97 percent of June 2026 and the company's 89.9 percent reinvestment rate for 2025, the same identity gives roughly 10 percent. If the true current return is nearer 20 percent than 11, the history is a template for the next decade. If it is 11, the history is a description of a different machine.

## 4. Open judgment calls returned to the human

1. **Whether to trust a carried forward share count.** It is almost certainly right, and it is still one company sourced year out of nineteen. A single AIF from any earlier year would settle it.
2. **Which cash metric to anchor on.** Adjusted net income and FCFA2S measure different things. The report keeps them apart; a reader who wants one nineteen year cash line will have to accept CFO, which is before the acquisitions that define the company.
3. **How much weight the first era gets.** Its revenue CAGR is the highest and its sourcing the worst. Dropping it leaves a 2012 to 2025 revenue CAGR of about 21.8 percent, computed here from 891.2 to 11,623 over thirteen years, which is the defensible number.
4. **The dividend as policy.** USD 4.00 a year unchanged since 2012 on a business whose cash per share went from about 8 to about 79 is a decision to retain, not a yield. The one special was framed as excess capital the machine could not deploy; the 2021 hurdle change was the alternative chosen since. Whether that trade was right is the question the second report's kill criteria are built to answer.
5. **Whether the falling return is disclosure or reality.** The company disclosed ROIC twice, both before 2011. The current 10.97 percent is a data provider's definition. The Q1 2026 MD&A may carry the company's own figure; pull it before treating the decline as fact.

## 5. Process notes

- Intake: five Sonnet sweeps, three second passes and one gap sweep, 30 searches each, about 300 searches in total. Haiku was not used at intake after its failure on the parent history in the prior project. Sonnet's first pass on the earliest window produced two misreads (a quarterly revenue as annual, a per share EBITA as a total) that the second pass fixed.
- Year end prices and pre 2010 cash flows are not reachable by snippet in this environment; both WebFetch and curl are blocked by the network egress proxy.
- Stage 4 on Opus caught one computed metric that chained two cash bases; the compute script was corrected. All three Opus agents picked up the mid task ledger corrections.
- Fable ran twice, to design and to review.

## Files

- Review script: scratchpad/check_hist.py
- Inputs: report.md, findings/*.md, history_ledger.json, history_metrics.json, stage1/*.json, ../ledger.json, ../metrics.json

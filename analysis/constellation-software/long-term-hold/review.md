# Stage 6 Review: Constellation long term hold report

Reviewer: Fable 5.1, single pass at the user's request, 2026-09-14.
Scope: report.md, findings/engine_durability.md, findings/kill_criteria.md, the eight findings/holdings files, holdings.json, hold_metrics.json, the nine stage1 files, and the first report's ledger.json and metrics.json where reused. The executive summary in report.md was written in this pass. One transcription error in report.md was corrected in this pass and is listed under mismatch M.

## 1. Number tracing and tag resolution

### Tag check (python, scratchpad/check_hold.py)

report.md: 350 citation tags, 225 unique. Every `[ledger:...]`, `[metrics:...]`, `[peer:...]`, `[holdings:...]` and `[hold:...]` tag resolves to a real key with a value, or to a field whose value is explicitly null where the text says gap. Zero unresolved.

Findings files: 634 tags, 359 unique. Four unresolved, all spelling variants of real paths and none carrying a wrong number: jonas.md cites a business count share that is null and says so; perseus.md reverses two path segments on the ten year acquisitions ratio; volaris.md shortens the Lumine share path by one level twice. Left as they are, since the report stage did not carry them.

### Ten random spot checks (seed 20260914, drawn from the holdings and ledger tags in report.md)

| # | Report figure | Ledger or holdings entry | Source record and URL | Result |
|---|---|---|---|---|
| 1 | Volaris in 60 countries | holdings volaris country_count 60, company | stage1 volaris.json, volarisgroup.com/about | Match |
| 2 | FX adjusted organic FY2025 3 percent | ledger organic_growth_fx_adj_pct FY2025 = 3 | globenewswire FY2025 results release | Match |
| 3 | Vela 11 named geographies | holdings vela geographies, list of 11 | stage1 vela.json | Match |
| 4 | Stated hurdle 25 percent IRR | ledger unmapped Hurdle rate IRR target 2024 to 2026 = 25 | Morningstar company report, third party | Match to source; it is an analyst's paraphrase of company disclosure, not a company line |
| 5 | Harris 24 acquisitions in 2024 | holdings harris acquisitions_per_year 2024 = 24, company | harriscomputer.com year in review 2024 | Match |
| 6 | IRGA liability 1,186 at H1 2026 | ledger unmapped IRGA 1186 / 1234 / 13 / 35 | Constellation Q2 2026 MD&A PDF | Match |
| 7 | Topicus economic interest 30.35 percent | holdings topicus csu_economic_interest_pct 30.35, company | topicus.com spin out completion release, 2021-01-05 | Match to source; the figure is five years stale, see weak link E |
| 8 | Reported organic FY2025 4 percent | ledger organic_growth_pct FY2025 = 4 | substack writeup, third party; the company release in stage1 fy2025.json states the same 4 percent | Match |
| 9 | Lumine total debt CAD 701 million at June 2026 | holdings lumine total_debt value_cad_2026Q2 = 701, third party | gurufocus, approximate | Match to source; conflicts in currency with the USD series and is used only in the gaps section |
| 10 | Shares outstanding FY2023 21.19 million | ledger shares_outstanding FY2023 = 21.19 | macrotrends, derived | Match; same caveat as the first review, only the FY2025 count is company sourced |

Ten of ten trace. Three of the ten are third party. The tracing is clean; the problems are in what the sources are, not in whether the numbers were copied right.

### Arithmetic re-checks that passed

Ten year IRR grid at USD 2,262.86: 8 percent growth and 25x exit 8.74 percent, 10 percent and 20x 8.31 percent, zero growth and 25x 0.74 percent. At USD 2,080.29: 9.66, 9.23, 7.26 percent at 8 percent and 20x, 5.29 at 6 percent and 20x. An independent recompute of the 8 percent and 25x cell with dividends held uninvested gives 8.70 percent against the script's 8.74, which discounts dividends as annual cash flows; consistent. Topicus look through 2,546.4 over 65,183 is 3.91 percent; Lumine 5.30 to 6.04 percent; combined 9.21 to 9.95 percent; implied private groups CAD 58,699 to 59,181 million. FCFA2S per share 54.74, 69.47, 79.42, growth 26.9 then 14.3 percent. H1 2026 cash acquisitions 1,429 over LTM FCFA2S 2,030 is 0.704. Net debt to FCFA2S 1.20x FY2024 and 1.34x Q1 2026. Topicus acquisitions to FCFA2S FY2025 1.79x, Lumine 1.44x. Jonas 840.2 over 185 brands is 4.54 million. Altera 700 over 928 is 0.754x. Volaris 240 over 40 verticals is six per vertical. All grid tables in the report match hold_metrics.json cell for cell.

### Mismatches and weak links found while tracing (all files)

A. **Harris headcount share of 40.0 percent is third party over third party.** 25,607 from a headcount tracker over a 64,000 parent estimate. Harris itself says 15,000 or more, which gives about 23 percent on the same denominator, computed here. The engine file and report use 40.0 percent as the reason Harris cannot be weighted. Direction right, number soft, and the report now says so.

B. **Jonas revenue share of 8.3 percent rests on an aggregator estimate.** 840.2 USD million is an Owler figure, not a disclosure. The AI exposure weighting, and the 4.5 million per brand figure, inherit it. The report labels it third party; the weight it carries in test 4 is more than a third party estimate should bear.

C. **The decade averages in ten_year_history are not decade averages.** The 2015 to 2020 acquisitions to FCFA2S average of 0.73x rests on three years, 2018 to 2020, and the FY2020 spend of 179 is third party and looks low against the company's own pattern. The 2020 to 2025 average of 0.85x rests on two years. The 2015 to 2020 organic average of negative 0.8 percent rests on five company sourced years with 2018 missing, and is sound.

D. **Volaris revenue figures are a different company.** Two of three third party figures trace to a press release of the Mexican airline Volaris. Caught at Stage 4, carried into the report as gap, and the concentration shares built on them are labelled not fact. This is the largest intake defect in the project and should be added to the intake spec as a named check.

E. **Topicus economic interest is a January 2021 figure.** Topicus has issued shares since. The 30.35 percent, and everything downstream in look through value, is stale by five years. The report says so.

F. **Lumine market cap has two September 2026 values**, CAD 5,628 and 6,413 million. Carried as a range throughout. Not resolved.

G. **Four parent figures were attributed to operating groups at intake.** Perseus revenue and FCFA2S for FY2024, Vela revenue and organic growth for Q4 2024, all Constellation consolidated figures sourced to parent releases. Struck at Stage 2 and in this pass. The pattern is that a group's own website republishes the parent release and the intake worker reads it as group data.

H. **Harris revenue of 1,400 USD millions is a legal entity figure.** The first report's own intake has the Allscripts business alone at 928 in FY2021 on the company's release. Struck as a group figure; the report explains why.

I. **Volaris CEO conflict inside holdings.json.** Volaris names Mike Dufton from January 2024; a Constellation leadership page still lists Mark Miller. The report treats Dufton as current and names the conflict. Not resolved on the sources.

J. **brief.json dated Omegro to 2023.** The launch was June 25, 2024. The brief was wrong; the report says so.

K. **No FX rate anywhere in this project.** All look through shares are CAD over CAD. The first report's market cap conflict, USD 47,950 million against CAD 65,183 million, is still open and moves the combined listed stake between about 9 and 11 percent.

L. **Lumine CEO tenure is stated two ways.** The engine section says Nyland since 2014, the table says CEO since 2022. Both are right: he joined Volaris in 2014 to build the business and took the CEO title at the 2022 formation. Not corrected, since each sentence is accurate in context.

M. **Corrected in this pass.** report.md section 2 read "negative 0.5 percent across the longest window". hold_metrics.json and the engine findings give positive 0.5 percent. Fixed to 0.5 percent. No other number in the report was changed.

## 2. The strongest case against each of the top three conclusions

### Conclusion 1: "The engine has delivered what the decade needs, so Hold."

Case against, same metrics. The record that clears the band is short and front loaded. FCFA2S per share growth of 26.9 percent in FY2024 and 14.3 percent in FY2025 is decelerating fast, and the FY2022 to FY2025 CAGR of 25.4 percent was earned when acquisitions absorbed 0.63 to 1.22 times FCFA2S at a hurdle that has since been loosened for large deals. The 2018 to 2021 CAGR of 16.5 percent includes 2020, when FCFA2S jumped to 989 on almost no deployment. There is no company sourced FCFA2S before 2018, so the "decade" is seven years. The band the hold needs, 8 to 10 percent for ten years, is below the record, but the record is of a machine that had a 25 percent hurdle and 4 to 5 percent organic growth in its better years. Neither holds now.

### Conclusion 2: "The structure keeps producing allocators, which makes this Hold rather than Not Hold."

Case against, same metrics. Four successions filled from inside is a count, not a result. The evidence that they worked is two quarters of H1 2026 deployment under a new President, and the same two quarters show ROIC falling and organic growth halving. Role doubling is visible: one person holds Volaris Executive Chairman, the presidency and the Lumine chair; another runs Volaris and Vencora; Perseus has no CEO three years after its founder left. Five new units in four years could as easily read as a bench being stretched across more chairs. The decentralisation moat is asserted from structure charts because no group publishes a return that would show whether its allocators allocate well.

### Conclusion 3: "Harris and Topicus carry the moat; the regulated system of record layer is least exposed."

Case against, same metrics. Harris cannot be weighed: no revenue, no organic growth, a headcount share that ranges from 23 to 40 percent depending on which third party figure is used, and its largest asset was bought at 0.75 times revenue, which is a harvest price, not a moat price. Topicus's 4 to 5 percent organic growth is reported, never FX adjusted, across seven non euro currencies, while the parent's comparable series runs three points below its reported one. If the same gap applies, Topicus's real organic growth is 1 to 2 percent, the same as everyone else. The only group with a clean organic read may not have one.

## 3. Metrics a peer analyst would define differently

| Metric | Definition used here | How a peer would differ | Consequence |
|---|---|---|---|
| Ten year IRR | FCFA2S per share compounding, exit at a multiple of FCFA2S, 4.00 dividends as annual cash flows, no reinvestment of dividends | Many would model FCF to equity after all acquisitions, or use EV to EBITA exits | The grid is internally consistent with the first report; it is not comparable to a screen |
| Return on deployed capital | Third party ROIC series, two providers with different definitions | Company's own ROIC plus organic growth KPI, or cohort IRRs | The 10.97 percent that anchors reason 3 is not a company number |
| Look through value | Economic interest times market cap, CAD over CAD | Equity method carrying value, or consolidated less minority interest | Shares of market cap would change with FX and with a current Topicus interest |
| Concentration | Third party group revenue or headcount over third party parent totals | Segment disclosure, which Constellation does not provide | Every weight in the AI exposure test is soft |
| Durability verdict | Strong, adequate, weak on structure and disclosure | A peer would want a return or a margin before grading | Seven of eight groups sit at adequate because the grade cannot be earned without numbers |

## 4. The single assumption that flips the recommendation

Return earned on deployed capital, read through FCFA2S per share growth. The hold arithmetic needs 8 to 10 percent a year. At full reinvestment that is an 8 to 10 percent realised return, and the only external read, third party ROIC, is 10.97 percent and falling. If FCFA2S per share growth runs below 8 percent for three consecutive years, the ten year IRR at a 25 times exit falls under 8.7 percent from the first report's entry and under 7.3 percent at a 20 times exit from the corrected one, and the verdict is Not Hold at any price a holder is likely to have paid since 2021. Organic growth cannot flip it alone: the floor already fails and the verdict is still Hold, because the base is flat rather than shrinking. Nothing else in the file has that leverage.

## 5. Open judgment calls returned to the human

1. **Real versus nominal floor.** No inflation series exists in any file. At 1 percent nominal organic the real sign is negative by assumption. If you accept a flat nominal base as good enough, test 2 reads Holds with conditions and the whole engine table is green.

2. **Whether to trust a third party ROIC.** Reason 3 and kill criterion 3 rest on 10.97 percent from a data provider against 14.8 percent from a substack. The company's own return disclosure was not found. If you have the annual ROIC plus organic growth figure from the MD&A, substitute it before acting.

3. **How much weight the undisclosed 90 percent gets.** Seven verdicts of adequate mean "structure fine, numbers absent". A holder who treats absence of disclosure as neutral holds. One who treats it as a risk factor in itself moves toward Not Hold, and nothing in this file can argue them out of it.

4. **The FX and market cap conflict.** Every look through share and the choice of entry price for the grid depend on a USDCAD rate this project never sourced. Pull one and a same day USD market cap before quoting any of the percentages.

5. **The Topicus stake.** Get the current economic interest from Constellation's latest MD&A. The 30.35 percent is from January 2021.

6. **Hold versus Buy.** The two reports disagree on purpose. If you own it, this report applies. If you are deciding whether to own it, the first report's price thresholds apply and this one tells you what you would be holding. Decide which question you are asking.

7. **Whether the intake failures change your confidence in the pipeline.** Four parent figures attributed to groups, one airline mistaken for a software group, two Haiku workers that reported search as exhausted when it was not. Every one was caught before the report, but by Opus at Stage 4 or by this review, not by the intake or normalise stages. The next run should add a named check for parent figures republished on group sites and for same name issuers.

## 6. Process notes for the workflow

- Stage 1 Haiku workers produced usable files for seven of nine sweeps. Two reported "search budget exhausted" and stopped after six and eight searches; the main session confirmed search was working and the sweeps were rerun on Sonnet, which used all thirty searches each without error. Consistent with the model guidance: step up one tier after one failure.
- Stage 4 Opus agents caught three intake errors the earlier stages missed (the airline, the Altera revenue mismatch, the Vela revenue). Their value here was in checking sources, not in prose.
- Fable ran twice, once to design and once to review, at the user's request. No Fable call was made inside the pipeline.
- Total of nine Haiku, four Sonnet and nine Opus subagent runs plus this session.

## Files

- Review script: /tmp/claude-0/-home-user-Sample-R/817b7df8-eb6c-5e03-b291-42bd08e9852c/scratchpad/check_hold.py
- Inputs: report.md, findings/*.md, findings/holdings/*.md, holdings.json, hold_metrics.json, stage1/holdings/*.json, stage1/parent_long_run.json, ../ledger.json, ../metrics.json

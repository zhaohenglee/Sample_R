# Long Term Hold Workflow: Constellation Software and its Holding Companies

Designed by Fable 5.1 on 2026-09-14 at the user's request. Seven stages. Model routing follows `.claude/instructions.md`: Opus by default for judgment, Fable only where the user called for it, Sonnet and Haiku for volume, scripts for arithmetic.

## The question

The first report asked whether to buy at today's price and said Not Buy. This one asks whether the business is worth holding for ten years and which parts of it carry that case. The two questions have different evidence. Entry price is a valuation problem. A ten year hold is an engine problem: does capital keep finding a home at good returns, does the installed base hold, and does the structure keep producing people who can run it.

## What functional analysis means here

Each holding company gets the same eight part treatment so the parts can be compared.

1. What it does. Verticals, geographies, customer type, approximate scale.
2. Function in the whole. Capital deployer, cash generator, geographic arm, listed currency, talent bench. Most groups serve more than one.
3. What it owns. Notable businesses and the largest deals, with dates and prices where disclosed.
4. How it deploys capital. Deal count, typical size, largest deal, hurdle discipline, any disclosed returns.
5. AI exposure map. Where its verticals sit: regulated system of record, embedded workflow, services heavy, thin niche. Uses the four layer moat framework from the first report.
6. Leadership. Who runs it, tenure, succession evidence, spin out history of allocators.
7. Durability verdict. Strong, adequate or weak over ten years, with the one number that would change it.
8. Gaps. What could not be found.

## Stages and routing

| Stage | Work | Model | Effort | Output |
|---|---|---|---|---|
| 0 Scope | Question, holding list, hold tests, this design | Fable 5.1 | default | brief.json, workflow.md |
| 1 Intake | One search sweep per holding company plus parent ten year history | Haiku 4.5, nine subagents in parallel | low | stage1/holdings/*.json, stage1/parent_long_run.json |
| 2 Normalize | Merge intake into one holding company ledger, flag conflicts, grade confidence | Sonnet 5 | low | holdings.json |
| 3 Compute | Look through value of listed stakes, ten year hold grid with dividends, reinvestment arithmetic, listed subsidiary metrics, concentration | Python script written by Sonnet 5 | low | compute_hold.py, hold_metrics.json, hold_metrics.xlsx |
| 4 Analyze | Engine durability and kill criteria; one functional analysis per holding company | Opus 5, one subagent per file | xhigh | findings/*.md |
| 5 Report | Assemble, one voice, tables, HTML render | Sonnet 5 | medium | report.md, build_html.py, report.html |
| 6 Review | Tag resolution, spot checks, strongest case against, executive summary, Hold or Not Hold | Fable 5.1, one pass | default | review.md, executive summary in report.md |

## Rules that hold at every stage

- A model reads and interprets. A script calculates. No arithmetic in prose that is not in hold_metrics.json or shown inline with its inputs.
- Every figure carries a source URL at intake and a citation tag downstream: `[holdings:<group>:<field>]`, `[hold:<metric>:<period>]`, and the first report's `[ledger:...]` and `[metrics:...]` where reused.
- Missing is written as gap. No estimates dressed as data.
- Private operating groups have no separate financials. Their analysis is qualitative where the data is qualitative, and says so.
- The five private groups, two listed subsidiaries and Omegro are treated with the same template so the reader can compare them.
- Fable runs once, at the end. If a second review is needed, Opus does it.

## Stage 1 intake specification

Each Haiku subagent gets one holding company and a budget of 30 searches. It writes `stage1/holdings/<slug>.json` with this shape:

```json
{
  "holding": "Volaris Group",
  "type": "private operating group",
  "figures": [
    {"item": "...", "period": "...", "value": 0, "unit": "...", "source_url": "...", "source_title": "...", "confidence": "company | third_party | derived"}
  ],
  "facts": [
    {"item": "...", "text": "...", "source_url": "...", "confidence": "company | third_party"}
  ],
  "verticals": ["..."],
  "notable_businesses": [{"name": "...", "vertical": "...", "acquired": "YYYY", "price": "... or undisclosed", "source_url": "..."}],
  "leadership": [{"name": "...", "role": "...", "since": "...", "source_url": "..."}],
  "gaps": ["..."]
}
```

The parent subagent writes `stage1/parent_long_run.json` in the same figures shape covering 2015 to 2025: revenue, FCFA2S, organic growth by year, acquisitions deployed by year, deal counts, hurdle rate statements, share count, dividends including specials, President letters on growth targets and the decision to pursue larger deals.

## Stage 3 compute specification

- Look through: CSU economic interest in Topicus and Lumine times each market cap, as a share of CSU market cap. Uses ledger market_cap_usd and any USDCAD rate found at intake. States the FX assumption.
- Reinvestment arithmetic: FCFA2S per share growth implied by reinvestment rate times return on deployed capital, on a grid of both, so the reader sees what ROIC and deployment rate the ten year case needs.
- Ten year hold grid: FCFA2S per share CAGR against exit multiple, ten years, dividends at 4.00 per share reinvested at zero, from the entry in the first report and from the corrected USDCAD 1.36 entry.
- Listed subsidiaries: revenue growth, organic growth, margin and deployment metrics for Topicus and Lumine where intake found them.
- Concentration: share of Constellation revenue or headcount by group where any disclosure exists; otherwise the field says gap.

## Stage 4 analysis specification

Opus writes `findings/engine_durability.md` against the six hold tests in brief.json, `findings/kill_criteria.md` with observable numbers and windows, and one `findings/holdings/<slug>.md` per holding company following the eight part template. Each file ends with a gaps section. Each subagent receives holdings.json, hold_metrics.json, the first report's ledger.json and metrics.json, and the first report's findings for context, and is told to cite rather than recompute.

## Stage 6 review specification

Fable checks every citation tag resolves, draws ten spot checks back to source URLs, writes the strongest case against each of the top three conclusions, names the single assumption that flips the call, lists the judgment calls returned to the human, and writes the executive summary with a Hold or Not Hold verdict and the kill criteria in one place.

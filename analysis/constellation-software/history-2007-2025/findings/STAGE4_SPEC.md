# Stage 4 spec: three findings files

Working directory: /home/user/Sample_R/analysis/constellation-software/history-2007-2025. Read in order: brief.json, history_ledger.json, history_metrics.json, then ../findings/fundamentals.md and ../long-term-hold/findings/engine_durability.md for context and the three bucket cash framing in ../long-term-hold/report.md if present. Work only from these files. No web access.

Citation tags: `[hist:<metric>:<FYxxxx>]` for history_ledger.json entries, `[hm:<group>:<key>:<period>]` for history_metrics.json, `[event:<date>:<item>]` for events, and the earlier reports' `[ledger:...]` and `[metrics:...]` where reused. Every number carries a tag. Arithmetic in prose only with both inputs cited and marked "computed here".

Style: concise, plain English, short sentences, no hyphens as punctuation, no em dashes. Where the evidence is thin, say so. Third party figures are named as such.

## findings/eras.md (1,400 to 2,000 words)

One section per era from brief.json, then a fifth section on what stayed constant across all four. For each era: what the company set out to do (from events and letters), what the numbers did (revenue, organic, cash, deployment, per share), the defining decisions, and a one line verdict on whether the era delivered against its own stated aim. Use the era CAGRs from history_metrics. End with a table: era, revenue CAGR, cash CAGR, average organic, average reinvestment rate, largest deal, defining decision.

## findings/year_by_year.md (table led, 1,200 to 1,800 words)

A single table with one row per fiscal year FY2007 to FY2025: revenue, growth, organic growth, adjusted EBITA margin, net income, CFO, FCFA2S or adjusted net income (column header must say which), acquisitions spent, acquisition count, dividends per share total, year end share price CAD. Gap cells say gap. Then one short paragraph per year, two to four sentences, saying what happened that year and the one number that mattered. Mark restated figures and third party figures.

## findings/cash_and_capital.md (1,000 to 1,500 words)

The three bucket view applied to the history. Bucket 1 never cash: amortization of acquired intangibles wherever the ledger has it, and its effect on net income versus CFO by year. Bucket 2 timing: deferred revenue and contingent consideration where any data exists, otherwise state the gap. Bucket 3 cash outside the profit lines: acquisitions as the real reinvestment, dividends regular and special, and what was left after both, by year. Then the compounding arithmetic: reinvestment rate times return by era, against the realised per share cash CAGR. End with what the record says about the engine and a gaps section.

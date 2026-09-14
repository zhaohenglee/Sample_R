# Stage 5 spec: assemble report.md and render report.html

Working directory: /home/user/Sample_R/analysis/constellation-software/history-2007-2025. Read brief.json, findings/*.md, history_ledger.json, history_metrics.json, and ../long-term-hold/build_html.py and ../long-term-hold/report.md for voice and rendering.

## report.md

Title: `# Constellation Software: Nineteen Years on the Record`

Sections, level two headings exactly:
1. `## Executive Summary` : placeholder line `(Fable 5.1 writes this section at Stage 6.)`
2. `## The Company in One Page` : what it does, how it is organised, the model in five sentences, then a table of FY2007 against FY2025 on revenue, CFO, cash metric, acquisitions spent, shares, dividends, share price, with the multiple of change and CAGR from history_metrics.
3. `## Four Eras` : condensed from findings/eras.md, keep the table.
4. `## Year by Year` : the full table from findings/year_by_year.md, then the per year paragraphs.
5. `## Cash and Capital` : condensed from findings/cash_and_capital.md, keep the three bucket structure and the by year table.
6. `## Per Share Record and Total Return` : per share series and the TSR table from history_metrics, with the FX and dividend caveats stated.
7. `## What the Record Says` : five to eight numbered findings, each one paragraph, drawn from the three findings files, no new numbers.
8. `## Gaps and Data Limitations` : coverage table from history_ledger.json, conflicts, and general limitations.
9. `## Sources` : deduplicated URLs grouped by era.

Keep every citation tag. No new numbers. No recomputation. Plain English, no hyphens as punctuation. 5,000 to 7,500 words excluding sources.

## build_html.py and report.html

Copy ../long-term-hold/build_html.py, adapt: reads this directory's report.md and history_metrics.json; page title "Constellation Software: Nineteen Years on the Record"; eyebrow "Fundamental analysis 2007 to 2025, designed on Fable 5.1, 2026-09-14"; tag regex also matches `hist`, `hm` and `event`; header stat tiles show revenue FY2007 and FY2025, the full window revenue CAGR, the full window cash metric per share CAGR, and total special dividends per share paid. Grid styling applies to any table whose first header is `Year` or `Growth`. Run it and confirm report.html renders with balanced sections and tables.

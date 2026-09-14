# Stage 5 spec: assemble report.md and render report.html

Working directory: /home/user/Sample_R/analysis/constellation-software/long-term-hold. Read brief.json, workflow.md, findings/HOLDING_TEMPLATE.md, then every file in findings/ and findings/holdings/, then holdings.json and hold_metrics.json. Also read ../report.md and ../build_html.py from the first report, because the new report must match their voice and rendering.

## report.md

Title: `# Constellation Software: Hold for Ten Years?`

Sections in this order, level two headings exactly as written:

1. `## Executive Summary` : leave a single placeholder line `(Fable 5.1 writes this section at Stage 6.)`. Do not write it.
2. `## The Question` : two short paragraphs. What the first report answered, what this one answers, and the definition of functional analysis from brief.json.
3. `## How the Whole is Built` : a table with one row per holding company: name, type, function in the whole (from each findings file section 2), scale figure with tag or gap, AI exposure headline, leadership status, durability verdict. Then two paragraphs on look through value from hold_metrics: what Topicus and Lumine are worth to CSU and the implied value of the private groups, with the FX caveat.
4. `## Is the Engine Durable` : condense findings/engine_durability.md to its six hold tests with verdicts, keeping every citation tag on every number. Include the summary table.
5. `## The Holding Companies` : one level three subsection per holding company in this order: Volaris, Harris, Jonas, Perseus, Vela, Topicus, Lumine, Omegro. Each subsection is 200 to 350 words condensed from the findings file: what it does, function, deployment, AI exposure, leadership, verdict and the number that would change it. Keep the tags.
6. `## What Would End the Hold` : findings/kill_criteria.md as a table (criterion, source line, threshold, window, current reading with tag) plus the monitoring routine paragraph.
7. `## Ten Year Arithmetic` : the hold grid from hold_metrics.hold_grid_10yr rendered as two tables (both entry prices), FCFA2S per share CAGR down the side, exit multiple across, IRR cells as percentages with one decimal. The first column header of each grid table must be exactly `Growth` so build_html.py styles it as a grid. Then the reinvestment identity: one short table at organic 0 percent, and two sentences on what the ten year case needs. Cite `[hold:hold_grid_10yr:<entry>:growth <g> exit <m>x]` and `[hold:reinvestment_grid:rate <r> roic <k>]` tags.
8. `## Gaps and Data Limitations` : merged from all findings gaps sections plus holdings.json conflicts, grouped by holding company, then the general limitations from brief.json.
9. `## Sources` : the deduplicated list of source URLs from holdings.json fields and facts, grouped by holding company, plain URLs one per line.

Rules: keep every citation tag that appears on a number in the findings; do not invent new numbers; do not recompute; plain English, no hyphens as punctuation, no em dashes; tables are the preferred form for anything compared across groups; the whole file 4,500 to 6,500 words excluding the sources list.

## build_html.py and report.html

Copy ../build_html.py to build_html.py and adapt it: it reads report.md and hold_metrics.json in this directory, the page title and eyebrow read "Constellation Software: Hold for Ten Years?" and "Long term hold analysis, designed on Fable 5.1, 2026-09-14", the tag regex also matches `hold` and `holdings` and `stage1` tags, and the header stat tiles show: Topicus look through share of CSU market cap, Lumine look through share (low and high), the ten year IRR at 8 percent growth and 20x exit for the corrected entry, and the count of holding companies analysed. Everything else stays the same so the two reports look alike. Run it and confirm report.html is produced and is valid enough to open (no unclosed section, tag spans rendered). Do not add external scripts or fonts.

Return: word count of report.md, count of citation tags, and confirmation that report.html rendered.

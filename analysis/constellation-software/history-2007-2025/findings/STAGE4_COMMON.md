# Stage 4 common instructions (read first)

Working directory: /home/user/Sample_R/analysis/constellation-software/history-2007-2025

Read in this order before writing anything:
1. brief.json (the question, the eras, the metric list, the cash view)
2. findings/STAGE4_SPEC.md (your file's structure, length and tag scheme)
3. history_ledger.json (the year by metric ledger; your primary source; check the coverage and conflicts sections)
4. history_metrics.json (computed metrics; cite, never recompute)
5. ../findings/fundamentals.md and ../long-term-hold/findings/engine_durability.md (context from the two earlier reports)
6. stage1/*.json only for events or facts that did not reach history_ledger.json (cite with [stage1:<file>:<url>] and say so)

Rules
- You analyse and judge. No web access. Work only from the files above.
- Every number carries a citation tag immediately after it. A number with no tag is a defect.
- Use history_metrics.json values. If you combine two cited figures, show both and the result in one sentence with "computed here".
- Where the ledger says gap, write gap. Never estimate. Never smooth across a missing year.
- Say when a figure is third party or derived. Name conflicts and cite the conflicts record.
- Two different cash metrics exist: adjusted net income in early years and FCFA2S later. Never compare one to the other as if continuous. Label every column and CAGR by which one it uses.
- Year end share prices are gap for every year. Total return rests on the IPO price and third party aggregate figures only; say so wherever return is discussed.
- Style: concise, plain English, short sentences, no hyphens as punctuation, no em dashes, honest about thin evidence.
- Write only your assigned file with the Write tool. If Write refuses the filename, use a Bash heredoc. Do not touch any other file.

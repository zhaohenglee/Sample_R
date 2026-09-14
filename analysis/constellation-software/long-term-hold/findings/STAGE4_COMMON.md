# Stage 4 common instructions (read first)

Working directory: /home/user/Sample_R/analysis/constellation-software/long-term-hold

Read in this order before writing anything:
1. brief.json and workflow.md (the question and the rules)
2. findings/HOLDING_TEMPLATE.md (template and citation tag scheme)
3. holdings.json (the normalised holding company ledger; your primary source)
4. hold_metrics.json (computed metrics; cite, never recompute)
5. ../ledger.json and ../metrics.json (the first report's parent figures; cite with [ledger:...] and [metrics:...])
6. ../findings/ai_disruption.md, ../findings/fundamentals.md, ../review.md (context on the four layer AI framework and the first report's caveats)
7. stage1/holdings/<your slug>.json for facts and quotes that did not make it into holdings.json (cite with [stage1:<file>:<url>] and say so)

Rules
- You analyse and judge. You do not search the web and you do not fetch anything. Work only from the files above.
- Every number carries a citation tag immediately after it. A number with no tag is a defect.
- Use hold_metrics.json values; if you must combine two cited figures, show both and the result in one sentence with "computed here".
- Where the data is a gap, write gap. Never estimate a private group's revenue or margin.
- Confidence matters: say when a figure is third party, and when a conflict exists say so and cite the conflict.
- Style: concise, plain English, short sentences, no hyphens as punctuation, no em dashes, no bullet paragraphs. Honest. Where the evidence is thin, say the evidence is thin.
- Length: a holding file is 600 to 1,100 words. Engine durability is 1,200 to 1,800 words. Kill criteria is 500 to 800 words.
- Write only your assigned file with the Write tool. Do not touch any other file.

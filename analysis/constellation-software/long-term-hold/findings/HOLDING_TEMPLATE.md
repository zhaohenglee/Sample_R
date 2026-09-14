# Functional analysis template for one holding company

Write `findings/holdings/<slug>.md` with exactly these eight sections in this order. Keep the section headings verbatim so the report stage can assemble across groups. Prose is concise, plain English, no hyphens as punctuation, no em dashes. Every number carries a citation tag immediately after it. Every claim of fact without a number carries a citation tag at the end of the sentence.

Citation tags
- `[holdings:<slug>:<field_or_item>]` for anything in holdings.json (the normalised holding ledger).
- `[hold:<metric>:<period>]` for anything in hold_metrics.json.
- `[ledger:<key>:<period>]` and `[metrics:<name>:<period>]` for the first report's parent figures, reused not recomputed.
- `[stage1:<file>:<url>]` only for a figure or fact that exists in stage1 but did not make it into holdings.json, and say so.
- If you do arithmetic on two cited figures in prose, show both inputs and the result in the same sentence and add "computed here". Prefer to cite hold_metrics.json instead.

# <Holding company name>

One line: type, home base, one sentence on what it is.

## 1. What it does
Verticals, geographies, customer type, scale figures available (revenue, businesses, employees, countries). If scale is a gap, say gap.

## 2. Function in the whole
Which of these it serves and evidence for each: capital deployer, cash generator, geographic arm, listed currency, talent bench, incubator of new groups. Name the single most important function.

## 3. What it owns
Notable businesses and the largest deals with dates and prices where disclosed. Table if more than four.

## 4. How it deploys capital
Deal count, typical size, largest deal, stated hurdle discipline, disclosed returns, any shift toward larger deals. For listed subsidiaries use hold_metrics.

## 5. AI exposure map
Place the group's main verticals on the four layers from the first report: system of record and regulatory data (least exposed), switching cost and inertia, embedded workflow and integration (partly exposed), pricing power and thin niches (most exposed). State the horizon for each. Cite any group specific AI statements.

## 6. Leadership
Who runs it, tenure, prior role, succession events, allocators it has produced for other groups. State what is not known.

## 7. Durability verdict
Strong, adequate or weak over ten years. Two to four sentences on why. Then one line: "The number that would change this verdict:" followed by an observable metric, threshold and window.

## 8. Gaps
Bullet list of what could not be found and what it would have changed.

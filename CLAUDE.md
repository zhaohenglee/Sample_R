# Project preferences

## Model routing (required)

| Stage | Model | Agent |
|---|---|---|
| Plan | Fable (`fable`) | `planner` |
| Execution: data pulls | Haiku (`haiku`) | `data-collector` |
| Execution: build, fill, debug | Sonnet (`sonnet`) | `model-builder` |
| Output validation | Opus (`opus`) | `validator` |

Rules:
1. Every stock evaluation starts with the `planner` agent. Do not skip planning.
2. Execution work goes to `data-collector` or `model-builder`. The main session orchestrates; it does not do execution work itself when an agent fits.
3. Nothing is reported to the user until the `validator` agent returns PASS or PASS WITH WARNINGS. On FAIL, route fixes back to `model-builder`, then validate again.

## Output style

Concise, plain English. Structured and logical. Honest feedback, no filler. Avoid "-" as a prose connector.

## HTML outputs

Every HTML report (e.g. `output/TICKER/report.html` from `tools/report_html.py`) is published as a claude.ai Artifact and pinned to the user's sidebar, and the link is given in the reply. Republish the same file path to keep the same URL.

Published reports:
| Report | Link |
|---|---|
| Amazon EPV Valuation | https://claude.ai/artifact/VGGyuqzYHGe3ZSp9Lzyyjf |
| Smallest 500 US Listed Companies | https://claude.ai/artifact/GMjewxW5DFjMajMKHmFty7 |

## Stock evaluation workflow

Fixed assumptions (user decision): cost of capital = 10%, discount rate = 10%. Do not change without the user.

Entry point: `/evaluate-stock TICKER [TICKER ...]` (see `.claude/skills/evaluate-stock/SKILL.md`).

Pipeline (one ticker):
1. `tools/fetch_sec.py TICKER` pulls 10 fiscal years from SEC EDGAR XBRL into `output/TICKER/inputs.json`.
2. `tools/fetch_price.py TICKER` adds fiscal year end prices (Yahoo, split adjusted) and current basis shares.
3. `tools/fill_template.py TICKER` writes inputs into `template/epv_template.xlsx` and saves `output/TICKER/TICKER_EPV.xlsx`.
4. `tools/epv_model.py TICKER` replicates the template math in Python and writes `output/TICKER/summary.json`.
5. `tools/validate.py TICKER` recalculates the workbook in LibreOffice, compares against `summary.json`, runs data checks, and writes `output/TICKER/validation.json`.
6. `validator` agent reviews everything and issues the verdict.

Template facts and known issues: `docs/model_review.md`. Read it before changing any tool.

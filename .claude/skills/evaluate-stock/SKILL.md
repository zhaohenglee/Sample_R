---
name: evaluate-stock
description: Apply the EPV valuation template (template/epv_template.xlsx) to one or more stock tickers. Use when the user asks to evaluate, value, or run the model on stocks.
---
# Evaluate stock(s) with the EPV template

Input: one or more US tickers. Optional: cost of capital (default 0.10).

Follow the model routing in `CLAUDE.md`. Steps:

1. **Plan** → `planner` agent (Fable) with the ticker list. If it raises open questions that change results, ask the user before continuing.
2. **Collect** → `data-collector` agent (Haiku). Tickers can run in parallel, one agent per ticker.
3. **Build** → `model-builder` agent (Sonnet). Pass the cost of capital if the user set one (`python3 tools/epv_model.py TICKER --coc 0.09` and `fill_template.py TICKER --coc 0.09`).
4. **Validate** → `validator` agent (Opus). On FAIL, send its fix list to `model-builder`, then validate again (max 2 loops, then report the blocker).
5. **Report** to the user, per ticker:
   * Verdict and warnings
   * Latest year: EV/share, EPV/share, invested capital/share, PV of competitive advantage/share, market implied growth/share and % of EV
   * ROIC vs cost of capital trend (10 years)
   * One line read: is the price justified by current earnings power or does it rely on growth
   * Path to `output/TICKER/TICKER_EPV.xlsx`
   For several tickers, add one comparison table.

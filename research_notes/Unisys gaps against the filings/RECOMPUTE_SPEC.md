# Recompute spec: Unisys frameworks on filing grade inputs

Working directory: /home/user/Sample_R/research_notes/Unisys gaps against the filings/. Inputs: fy2025_10k_ledger.json, q2_2026_10q_ledger.json, market_inputs.json, and the three .md notes beside them. Read only, for the formulas and the earlier snippet based results: ../Unisys bankruptcy risk frameworks/accounting_ratio_models.md and market_and_rating_models.md.

Write compute_unisys.py (standard library only) and run it with python3 -I to produce unisys_metrics.json and unisys_metrics.md. All arithmetic in the script. Every metric records value, formula, inputs with their source ledger item, and a note naming the missing input when null. Never estimate.

1. `inputs`: one table per period (FY2024, FY2025, Q2 2026 balance sheet with LTM flows) of the figures the models need, each with its ledger source. Where the two ledgers or the earlier snippet round disagree, show the filing figure, the snippet figure, and the difference.

2. `accounting_scores`: for FY2025 and Q2 2026 LTM: Altman Z (1968), Z' and Z'' (with and without the 3.25 constant), Ohlson O score in full (size term uses total assets over the GNP price level index; if the index is not in the inputs, use the FY2025 US GDP deflator stated in the market note if present, else null with note), Zmijewski with the published coefficients (state which set), Springate, Grover, Taffler if the earlier note found coefficients, each with zone and, for Ohlson and Zmijewski, the implied probability from the logistic transform. Then a sensitivity block: each score recomputed with the pension liability moved from liabilities to equity, and with the accumulated deficit term set to zero, to show what drives the distress reading.

3. `cash_and_leverage`: pension adjusted leverage both ways, gross debt plus pension deficit over adjusted EBITDA and net of cash; interest coverage on adjusted EBITDA and on operating cash flow; free cash flow as the company defines it and after pension contributions, FY2024, FY2025, H1 2026 and LTM; liquidity equals cash plus ABL availability; a runway table year by year 2026 to 2031 under the company's own guidance held flat (revenue decline, margin, capex, pension schedule from the 10-K table, interest on the notes), showing cash at each year end and the shortfall against the 2031 maturity, labelled as arithmetic on stated guidance, not a forecast; a second row of the table with free cash flow at zero after pension, to show the break even case.

4. `market`: naive distance to default and implied probability from market_inputs.json; bond implied annual default probability from any dated yield, at 40 and 60 percent recovery; equity value over total debt; one year change in market cap.

5. `rating_map`: the rating band (S&P B, Moody's B2) against the default table figures found, with the source grade (primary or secondary) for each.

6. `conflicts_resolved`: the six conflicts from the first round (total debt, net leverage, 2026 pension contributions, mid 2026 pension deficit, Q2 2026 free cash flow, FY2026 revenue guidance), each with the figure the filings support and the quote reference.

7. `spot_checks`: three figures recomputed independently and asserted.

Run, confirm exit 0 and valid JSON, report null count and reasons.

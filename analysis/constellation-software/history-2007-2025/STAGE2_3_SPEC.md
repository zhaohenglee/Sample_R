# Stage 2 and 3 spec: normalise the annual history and compute

Working directory: /home/user/Sample_R/analysis/constellation-software/history-2007-2025. Read brief.json and stage1/INTAKE_SPEC.md, then every stage1/*.json. Read only, never modify: ../ledger.json, ../metrics.json, ../long-term-hold/holdings.json.

## Stage 2: history_ledger.json

```json
{
  "company": "Constellation Software Inc.",
  "generated_from": ["stage1/years_2007_2011.json", "..."],
  "years": ["FY2006", "FY2007", "...", "FY2025"],
  "ledger": {
    "revenue": {"FY2007": {"value": 0, "unit": "USD millions", "source_url": "...", "confidence": "company", "note": "optional"}},
    "...": {}
  },
  "events": [{"date": "...", "item": "...", "text": "...", "source_url": "...", "confidence": "..."}],
  "conflicts": [{"metric": "...", "period": "...", "values": [], "sources": [], "resolution": "kept both | picked X because ..."}],
  "coverage": {"revenue": {"years_found": 0, "company_sourced": 0, "third_party": 0}},
  "gate": {}
}
```

Metric keys: revenue, revenue_growth_pct, organic_growth_pct, organic_growth_fx_adj_pct, maintenance_recurring_revenue, adjusted_ebita, adjusted_net_income, net_income_attributable, diluted_eps, cash_from_operations, fcfa2s, acquisitions_cash_spent, acquisition_count, shares_outstanding, dividends_per_share_regular, dividends_per_share_special, share_price_cad_year_end, employees, roic_pct, roic_plus_organic_pct, capex.

Rules
- Prefer a company sourced figure over a third party one for the same metric and year; keep the third party one in conflicts if it differs by more than 2 percent.
- Never convert currency. Never average conflicts.
- FCFA2S and adjusted net income are separate keys. Never place one under the other.
- Where a release restates a prior year, keep the restated figure and note the original.
- Gate checks (PASS or FAIL with detail): every entry has a source_url; revenue growth recomputed from adjacent revenue matches any stated revenue_growth_pct within 1 point; diluted_eps times shares_outstanding is within 3 percent of net_income_attributable for years where all three exist; no FCFA2S entry before FY2013 unless the source is a company release that names it.
- Write a coverage table: for each metric, how many of the 19 years have a value and how many are company sourced.

## Stage 3: compute_history.py, history_metrics.json, history_metrics.xlsx

Standard library plus openpyxl. All arithmetic in the script. Each metric records value, formula, inputs, and a note naming the missing input when null.

1. `annual`: for each year, revenue growth, adjusted EBITA margin, net margin, CFO margin, FCFA2S margin (or adjusted net income margin where FCFA2S is absent, labelled), cash conversion (CFO over net income), acquisitions to CFO, acquisitions to FCFA2S or adjusted net income, per share revenue, per share CFO, per share FCFA2S or adjusted net income, total dividends per share (regular plus special), cash after acquisitions (FCFA2S less acquisitions), cash after acquisitions and dividends.
2. `eras`: for each era in brief.json and for the full window, CAGR of revenue, CFO, FCFA2S or adjusted net income, per share versions, average organic growth, average acquisitions to cash flow, total acquisitions spent, total dividends paid per share, share price CAGR in CAD where year end prices exist.
3. `ipo_targets`: revenue per share and EBITDA or adjusted EBITA per share CAGR from FY2005 or FY2006 to FY2010 against the 20 percent target, null where inputs are missing.
4. `reinvestment`: for each year, reinvestment rate (acquisitions over FCFA2S or adjusted net income) and the implied per share growth identity from the long term hold report at the stated ROIC where ROIC exists.
5. `tsr`: total return in CAD from each year end to 2025 year end using year end prices plus dividends held as cash, only where the price series exists; state the FX assumption for USD dividends against a CAD price as none applied and label the result approximate.
6. `spot_checks`: three metrics recomputed by hand in the script and asserted.

Run it, confirm exit 0, confirm the xlsx opens with openpyxl, report null count and the reasons.

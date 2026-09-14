# Stage 2 and 3 spec: normalise and compute

Working directory: /home/user/Sample_R/analysis/constellation-software/long-term-hold. Inputs: stage1/holdings/*.json, stage1/parent_long_run.json, and the first report's ../ledger.json and ../metrics.json (read only, never modify). Read brief.json and workflow.md first.

## Stage 2: holdings.json

Produce `holdings.json` with this structure:

```json
{
  "generated_from": ["stage1/holdings/volaris.json", "..."],
  "date": "2026-09-14",
  "holdings": {
    "volaris": {
      "name": "Volaris Group",
      "type": "private operating group",
      "status_note": "...",
      "fields": {
        "<field>": {"value": ..., "unit": "...", "period": "...", "source_url": "...", "confidence": "company|third_party|derived", "note": "optional"}
      },
      "verticals": [],
      "geographies": [],
      "notable_businesses": [],
      "leadership": [],
      "ai_statements": [{"text": "...", "period": "...", "source_url": "..."}],
      "organic_growth_commentary": [{"text": "...", "period": "...", "source_url": "..."}],
      "gaps": []
    }
  },
  "parent_long_run": {
    "<key>": {"<period>": {"value": ..., "unit": "...", "source_url": "...", "confidence": "..."}}
  },
  "conflicts": [{"holding": "...", "field": "...", "values": [...], "sources": [...], "resolution": "kept both | picked X because ..."}],
  "gate": {}
}
```

Standard field names to use where the data exists (omit a field rather than inventing it): revenue, revenue_currency, employees, business_count, vertical_count, country_count, acquisitions_per_year, typical_deal_size, largest_deal_name, largest_deal_price, hurdle_rate, csu_ownership_pct_subordinate_voting, csu_economic_interest_pct, csu_voting_control, market_cap, market_cap_currency, market_cap_date, share_price, share_price_date, shares_outstanding, organic_growth_pct, organic_growth_fx_adj_pct, maintenance_recurring_revenue, net_income, fcfa2s, acquisitions_cash_spent, cash, total_debt. For listed subsidiaries, keep per period values as nested objects keyed by period (FY2023, FY2024, FY2025, H1 2025, H1 2026, Q2 2026).

Parent long run keys: revenue, fcfa2s, organic_growth_pct, maintenance_organic_growth_pct, acquisitions_cash_spent, acquisition_count, shares_outstanding, dividends_per_share, special_dividend_per_share, hurdle_rate, roic_pct, headcount, business_unit_count, share_price_cad, all keyed by year.

Rules: never convert currencies; never average conflicting figures; grade confidence as in intake; record every conflict; add a gate section with at least these checks and PASS or FAIL: (a) every field has a source_url, (b) no field value is a string like "approximately" without a note, (c) listed subsidiary periods are consistent (H1 equals Q1 plus Q2 where all three exist, within one percent).

## Stage 3: compute_hold.py

Write `compute_hold.py` that reads holdings.json, ../ledger.json and ../metrics.json and writes `hold_metrics.json` and `hold_metrics.xlsx` (openpyxl, live formulas where inputs are single cells). All arithmetic in the script. Every metric records value, formula and inputs, like the first report's metrics.json. Where an input is missing the value is null and the note says which input.

Required metric groups:

1. `look_through`: for topicus and lumine, csu_economic_interest_pct times market_cap, converted to USD only if a usdcad or eurcad or eurusd rate exists in holdings.json with a source; otherwise report in the subsidiary's currency and set `usd_value: null` with a note. Share of CSU market cap using ../ledger.json market_cap_usd 2026-09 (47,950) and, as a sensitivity, the CAD 65,183 figure at each rate the first report's post_review fx_sensitivity used (1.25, 1.30, 1.35, 1.3594). Implied value of the private groups as CSU market cap less look through value of the listed stakes.

2. `reinvestment_grid`: FCFA2S per share growth g = reinvestment_rate times return_on_deployed_capital, on a grid of reinvestment rate {0.5, 0.75, 1.0, 1.25, 1.5} times return {0.08, 0.10, 0.12, 0.15, 0.20, 0.25}. Add organic contribution rows at organic {0, 0.02, 0.04} as g_total = g plus organic times a stated pass through of 1.0. Label clearly that this is the identity the ten year case rests on, not a forecast.

3. `hold_grid_10yr`: ten year IRR on a grid of FCFA2S per share CAGR {0, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15} times exit multiple {12, 15, 20, 25, 30}, entry FCFA2S per share 95.80 from ../metrics.json scenario_inputs, dividends 4.00 per share per year held as uninvested cash added at exit, computed twice: entry USD 2,262.86 (first report) and entry at USDCAD 1.3594 from ../metrics.json post_review fx_sensitivity entry_price_usd. Formula: IRR solving entry = sum of dividends discounted plus exit value discounted; implement with a bisection on rate, no numpy dependency needed.

4. `ten_year_history`: from parent_long_run where present, compute revenue CAGR, FCFA2S CAGR, FCFA2S per share CAGR, average organic growth, average acquisitions to FCFA2S, for the longest window available and for 2015 to 2020 and 2020 to 2025 separately. Null where inputs are missing.

5. `listed_subsidiaries`: for topicus and lumine, revenue growth yoy, organic growth, maintenance share, fcfa2s margin, acquisitions to fcfa2s, net debt, per period where inputs exist.

6. `concentration`: any disclosed revenue, headcount or business count by group as share of the parent total where both exist; otherwise null with a note. Do not estimate.

7. `spot_checks`: three metrics recomputed by hand in the script from raw inputs and asserted equal.

Run the script, confirm it exits 0, and confirm hold_metrics.xlsx opens with openpyxl. Report the count of null metrics and why.

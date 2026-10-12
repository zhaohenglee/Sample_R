# EPV template review (`template/epv_template.xlsx`)

## What the model does

1. **Inputs** (blue cells, Financials sheet, 10 fiscal years in columns D to M): income statement, balance sheet, D&A, capex, share price, shares.
2. **NOPAT** (row 123) = (EBITDA adjusted − maintenance capex) × (1 − effective tax rate). Maintenance capex = D&A.
3. **Invested capital** (row 130) = PP&E incl. operating leases + (current assets − cash − current liabilities).
4. **EPV** (row 140) = NOPAT / cost of capital (flat 10%).
5. **EV decomposition** (rows 147 to 152, summary rows 21 to 25):
   EV = invested capital + PV of competitive advantage (EPV − IC) + market implied growth (EV − EPV).
6. **ROIC** (row 133) = NOPAT / IC, split into margin × scale (Call-out sheet).

Read: if EPV covers most of EV, the price is supported by current earnings. If "market implied growth" dominates, the price depends on growth.

## Input sign convention (the pipeline handles this)

| Row | Item | Sign |
|---|---|---|
| 32 | COGS | negative (GP = Revenue + COGS) |
| 36, 37 | Opex | positive (subtracted) |
| 41 | Interest and other income | positive = income |
| 44 | Taxes | positive = expense |
| 46 | Minority interest | added to NI; pipeline uses it as the plug so NI ties to reported |
| 37 | (unlabelled in template) | included in Operating Profit; pipeline uses it as the plug so EBIT ties to reported |

## Issues found (honest assessment)

### Affect valuation

| # | Issue | Effect | Suggested fix |
|---|---|---|---|
| 1 | **FIXED.** EBITDA build (row 78) added interest and other income, which row 42 already included in net income. | Was counted twice. | Row 78 is now `=-D41`, labelled "Less: Interest and other income". Python replica: `ebitda = ni + tax - int_other + da`. |
| 2 | Row 46 (minority, equity income, discontinued ops) flows into EBITDA through net income. | Non operating items leak into NOPAT. | Back it out in the EBITDA build. |
| 3 | Maintenance capex = 100% of D&A. | Growing firms: maintenance capex overstated, EPV understated. | Greenwald method: growth capex = (PP&E / sales) × Δsales. |
| 4 | NOPAT uses the actual effective tax rate (row 121). | One off tax items swing EPV (CMG 2020: −21% rate). | Use a normalized rate (e.g. 21% to 25%). |
| 5 | **FIXED** (requested as issue 4). EV used cash only and non current debt only, ignoring marketable securities and current debt. | Was: AAPL FY2025 EV overstated by about $96B of securities and understated by about $20B of current debt. | New input rows: 59 non-current marketable securities, 63 of which current debt + current operating lease (inside row 64, total debt + leases). Row 53 now holds cash + current securities. Row 13 = `D53+D59`. Row 128 = `D62-D63` so current debt is not counted twice in invested capital. |
| 6 | Invested capital excludes goodwill and intangibles. | Acquisitive firms show inflated ROIC and PV of competitive advantage. | Report ROIC both with and without goodwill. |
| 7 | Negative working capital firms (AAPL, many restaurants) get tiny IC. | ROIC of 1000%+ is meaningless. | Floor IC at PP&E, or flag (validator does flag). |
| 8 | Two EPVs: row 100 (row 93 NOPAT, WACC in C97) and row 140 (row 123 NOPAT, row 134). | Summary uses row 140; row 100 is unused and differs. | Delete one, or label row 100 as a cross check. |
| 9 | Flat 10% cost of capital. | EPV moves ~10% for every 1 point change. | Run the pipeline with `--coc` at 8%, 10%, 12%. |

### Structural or cosmetic

| # | Issue |
|---|---|
| 10 | PP&E series break: D to I use gross − accumulated depreciation (no leases); J to M use row 57 (with leases). ASC 842 (2019) also adds leases. ROIC before and after 2019 is not comparable. Pipeline adds lease ROU assets to gross PP&E in D to I to reduce the break. |
| 11 | Call-out sheet contains hardcoded CMG and MCD peer data, SHAK labels, years 2022/2023 in J14/K14, and 10% in C7/L7. Stale for any other ticker. |
| 12 | Chart title says "US Thousands"; the model is in millions. |
| 13 | Row 83 (one time items) only seeded with zeros for D to J. Pipeline writes all years; use `overrides.json` field `one_time` to add adjustments. |
| 14 | Row 37 has no label but is part of operating profit. Pipeline labels it. |

## Pipeline choices

* Data: SEC EDGAR XBRL company facts (10-K only). Where a period appears in several filings, sign flips are resolved to the sign that ties pretax − tax to net income; otherwise majority value, then latest filing.
* Plugs (row 37, 41, 46) force EBIT, pretax income and net income to tie to reported numbers.
* Prices: Yahoo daily close at or before fiscal year end, split adjusted. Shares: diluted weighted average, restated to the same split basis.
* Template formulas were changed for issues 1 and 4 only (rows 13, 78, 128, plus new input rows 59 and 63), by `tools/patch_template.py` (idempotent, edits the sheet XML so charts survive). Issues 2 to 4 and 6 to 9 remain in results until you approve a template change.
* Current debt (row 63) = LongTermDebtCurrent (or DebtCurrent) + commercial paper / short term borrowings + current operating lease. Commercial paper is only added on top of LongTermDebtCurrent, because DebtCurrent usually already includes it.

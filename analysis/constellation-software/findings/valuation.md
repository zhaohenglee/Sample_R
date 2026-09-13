# Valuation and Scenarios

Lens: what the current price pays for, what it returns under three futures, and the price at which the answer changes.

## What the price buys

Entry is USD 2,262.86 per share, derived as market cap over share count because no USD share price and no USDCAD rate exist in the ledger [metrics:valuation:implied_share_price_usd] [ledger:market_cap_usd:2026-09] [ledger:shares_outstanding:Q2 2026]. The quote is CAD 2,827.94 [ledger:share_price_cad:2026-09-11]. That price buys LTM FCFA2S per share of 95.80 [metrics:scenario_inputs:current_fcfa2s_per_share] on LTM FCFA2S of 2,030 [ledger:fcfa2s:LTM to Q2 2026]. So 23.62 times free cash flow available to shareholders [metrics:scenario_inputs:current_multiple_price_to_fcfa2s], a 4.2 percent cash yield [metrics:valuation:fcfa2s_yield] and a 0.18 percent dividend [metrics:valuation:dividend_yield].

Two caveats on the anchor. The 93.7 times trailing P/E is unusable because FY2025 net income is depressed [metrics:valuation:pe_trailing]. No EV multiple can be built at all: the only enterprise value in the ledger is CAD denominated with no conversion rate [metrics:valuation:ev_to_revenue], and adjusted EBITA is absent for every period [metrics:valuation:ev_to_adjusted_ebita]. The market cap itself conflicts with a CAD 65,183 million figure [ledger:market_cap_usd:2026-09]. A 9 percent error in the entry price moves each IRR below by about 1.9 points a year, arithmetic done here on the cited inputs.

## The three scenarios

All three sit on grid points, so each IRR is read from the computed grid rather than estimated. Five years, no interim dividends in the formula [metrics:scenario_inputs:irr_formula].

| Case | FCFA2S per share CAGR | Exit multiple | 5 year IRR | Probability |
|---|---|---|---|---|
| Bear | 5 percent | 15x | negative 4.12 percent [metrics:scenario_grid:growth 0.05 exit 15x] | 0.30 |
| Base | 10 percent | 25x | 11.26 percent [metrics:scenario_grid:growth 0.10 exit 25x] | 0.50 |
| Bull | 15 percent | 30x | 20.63 percent [metrics:scenario_grid:growth 0.15 exit 30x] | 0.20 |

Growth rates and exit multiples are the published axis values [metrics:scenario_inputs:grid_growth_pct_axis] [metrics:scenario_inputs:grid_exit_multiple_axis]. The probabilities are my judgment, not data.

## Assumptions behind each case

**Organic.** Bear takes 1 percent, the FX adjusted print for H1 2026 and for Q2 2026 [ledger:organic_growth_fx_adj_pct:H1 2026] [ledger:organic_growth_fx_adj_pct:Q2 2026]. Base takes 4 percent, the reported figure for FY2025 and H1 2026 [ledger:organic_growth_pct:FY2025] [ledger:organic_growth_pct:H1 2026]. Bull takes 6 percent, the Q1 2026 print [ledger:organic_growth_pct:Q1 2026]. Note base and bull rely on the reported series while the FX adjusted series is 3 points lower at FY2025 and 3 points lower at H1 2026 [ledger:organic_growth_fx_adj_pct:FY2025] [ledger:organic_growth_fx_adj_pct:H1 2026].

**Acquired.** The residual in each case, so 4 points in bear, 6 in base, 8 in bull, being the case total less organic less margin. Context for those residuals: reported revenue grew 18.5 percent in H1 2026 on 4 percent organic [metrics:revenue_growth_yoy:H1 2026], acquisitions absorbed 0.94 times FCFA2S in FY2025 and 2.12 times in Q2 2026 [metrics:acquisitions_to_fcfa2s:FY2025] [metrics:acquisitions_to_fcfa2s:Q2 2026], and H1 2026 deployment of 1,700 already exceeds all of FY2025 at 1,579 [ledger:acquisitions_cash_spent:H1 2026] [ledger:acquisitions_cash_spent:FY2025]. What haircuts the residual is the return, not the spend: reinvestment fell 154.5 to 114.3 to 89.9 percent across 2023 to 2025 [ledger:unmapped:Reinvestment rate:2023, 2024, 2025] and ROIC fell 14.8 to 10.97 percent by June 2026 against a 25 percent hurdle [ledger:unmapped:ROIC:2025, June 2026, TTM 2026] [ledger:unmapped:Hurdle rate IRR target:2024-2026].

**Margin.** Base and bear hold the FCFA2S margin flat at the FY2025 level of 14.5 percent, so margin contributes nothing [metrics:fcfa2s_margin:FY2025]. Bull assumes the FY2022 to FY2024 climb from 12.9 to 14.6 percent resumes, worth roughly 1 point of the 15 [metrics:fcfa2s_margin:FY2022] [metrics:fcfa2s_margin:FY2024].

**Dilution.** Zero in all three. Share count has been 21.19 million from FY2023 through Q2 2026 [ledger:shares_outstanding:FY2023] [ledger:shares_outstanding:Q2 2026]. The real dilution happens below the parent, in subsidiary equity such as the 13.83 percent of Lumine issued for WideOrbit [stage1:capital_allocation.json:https://www.csisoftware.com/category/press-releases/2023/02/23/constellation-software-inc.-and-lumine-group-inc.-complete-purchase-of-wideorbit-inc.-and-lumine-group-spin-out], which never touches CSU shares and so is invisible in this model.

**Dividends.** Flat at 4.00 per share in all three, unchanged FY2022 through FY2025 and running at 1.00 a quarter in 2026 [ledger:dividends_per_share:FY2025] [ledger:dividends_per_share:Q2 2026], a 5.0 percent payout of FCFA2S [metrics:dividend_payout_of_fcfa2s:FY2025]. The grid formula excludes interim dividends, so each IRR is understated by under two tenths of a point a year at a 0.18 percent yield.

**Exit multiple.** Base at 25x is roughly today's 23.62x held flat, that being the nearest axis point. Bear at 15x is a permanent terminal value discount. Bull at 30x is a partial recovery toward the company's own history.

## Expected IRR

Probability weighted, the expected five year IRR at USD 2,262.86 is 8.52 percent. That is arithmetic on the three cited grid cells and my weights, computed here, not a figure in metrics.json. It sits below a 12 percent bar and barely above an 8 percent bar. This is a price at which you are paid roughly a market return to carry a live disruption question.

## Against the peer table

No peer multiple can be computed. Topicus is the only peer with a market cap, 8,390 CAD millions [peer:Topicus.com (TOI):market_cap], and its revenue is in euros [peer:Topicus.com (TOI):H1 2026 revenue], with no conversion rate in the ledger. Lumine, Descartes and Enghouse have no market cap at all, and Roper, Tyler and Open Text have no data of any kind [peer:Roper Technologies (ROP):status]. So the peer comparison is operational only: Topicus organic 5 percent [peer:Topicus.com (TOI):H1 2026 organic growth], Lumine negative 2 percent FX adjusted [peer:Lumine Group (LMN):Q1 2026 organic growth fx-adj], Enghouse revenue down 5.8 percent [peer:Enghouse Systems (ENGH):H1 2026 revenue growth yoy], Descartes up 12 percent at a 45.2 percent EBITDA margin [peer:Descartes Systems (DSG):FY2026 revenue growth yoy] [peer:Descartes Systems (DSG):FY2026 adjusted_ebitda_margin]. CSU sits in the middle of that spread on growth. Relative value against peers is untested, and should be stated as untested rather than assumed favourable.

## Against its own history

This is the stronger comparison and it comes only from stage1, not the ledger. On one consistent series, price to cash flow is 16.73 against a ten year median of 26.17 [stage1:market_data.json:https://ycharts.com/companies/CSU.TO/price_to_cash_flow_ttm], about 36 percent below its own median. EV to EBITDA is 13.43 and 16.89 on two sources against a ten year median of 22.48 [stage1:market_data.json:https://finbox.com/TSX:CSU/explorer/ev_to_ebitda_ltm/] [stage1:market_data.json:https://www.gurufocus.com/term/enterprise-value-to-ebitda/CNSWF], so 25 to 40 percent below. Applying the same 36 percent derating to today's 23.62 times FCFA2S implies an undisrupted level near 37 times, above the top of the grid axis. So the bull exit of 30x is not heroic, it is a partial recovery, and the base of 25x already assumes the derating is permanent. The market has priced a large part of the AI case already.

## The assumption that flips the call

The exit multiple. Mathematically the two axes are almost equally powerful: at 25x, moving growth from 5 to 15 percent is worth 10.1 points of IRR, and at 10 percent growth, moving the multiple from 20x to 30x is worth 9.0 points, both computed here from cited grid cells. The tiebreaker is that base case growth is already part funded, since H1 2026 deployment of 1,700 is capital that has been spent and will show up in 2027 and 2028 FCFA2S. Nothing pre funds the multiple. Dropping the base exit alone from 25x to 20x cuts the base IRR to 6.40 percent [metrics:scenario_grid:growth 0.10 exit 20x] and the expected IRR to 6.09 percent, below the 8 percent bar. Dropping base growth alone from 10 to 5 percent gives 6.20 percent [metrics:scenario_grid:growth 0.05 exit 25x] and an expected 5.99 percent. Same destination, but only one of the two levers is still open.

## Price thresholds

Holding the three cases and weights fixed, the expected IRR clears 12 percent below USD 1,932, which is 14.6 percent below the current price, and equivalent to about CAD 2,415 on the quoted price. It falls under 8 percent above USD 2,318, which is 2.4 percent above the current price, or about CAD 2,897. In entry multiple terms those are 20.2 times and 24.2 times LTM FCFA2S per share against 23.62 times today [metrics:scenario_inputs:current_multiple_price_to_fcfa2s]. All six figures are computed here from the cited inputs. The band is narrow. The stock is 2.4 percent from the point where it stops paying 8 percent, and needs a 15 percent drawdown to pay 12 percent.

## What is missing

No churn or retention data, no capex, no adjusted EBITA, no peer multiples, no USDCAD rate. The FY2025 acquisition spend and the market cap both carry unresolved conflicts. The thresholds above are only as good as the derived entry price, and the entry price is derived, not observed.

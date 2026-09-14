#!/usr/bin/env python3
"""
Stage 3 compute script for the Constellation Software long-term-hold analysis.

Reads:
  - holdings.json          (Stage 2 output, this directory)
  - ../ledger.json         (first report, read-only)
  - ../metrics.json        (first report, read-only)

Writes:
  - hold_metrics.json
  - hold_metrics.xlsx

All arithmetic happens in this script. No model-computed numbers are used;
every metric records its value, formula and inputs, and a null value carries
a note naming the missing input. Standard library only, plus openpyxl.
"""
import json
import os

from openpyxl import Workbook
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(HERE)


def load(path):
    with open(path) as f:
        return json.load(f)


holdings = load(os.path.join(HERE, "holdings.json"))
ledger = load(os.path.join(PARENT_DIR, "ledger.json"))
metrics = load(os.path.join(PARENT_DIR, "metrics.json"))

H = holdings["holdings"]
L = ledger["ledger"]

results = {}
notes_missing_inputs = []  # (metric_path, note) for reporting null counts


def m(value, formula, inputs, unit=None, note=None):
    """Build a metrics.json-style entry."""
    entry = {"value": value, "formula": formula, "inputs": inputs}
    if unit is not None:
        entry["unit"] = unit
    if note is not None:
        entry["note"] = note
    return entry


def null_metric(formula, inputs, note):
    notes_missing_inputs.append(note)
    return m(None, formula, inputs, note=note)


# ===========================================================================
# 1. LOOK THROUGH
# ===========================================================================
look_through = {}

# --- Topicus ---
topicus_fields = H["topicus"]["fields"]
t_pct = topicus_fields["csu_economic_interest_pct"]["value"]  # 30.35
t_pct_src = topicus_fields["csu_economic_interest_pct"]["source_url"]
t_mcap = topicus_fields["market_cap"]["value"]  # 8390 CAD millions
t_mcap_unit = topicus_fields["market_cap"]["unit"]
t_mcap_src = topicus_fields["market_cap"]["source_url"]

t_look_value_native = t_pct / 100.0 * t_mcap

look_through["topicus"] = {
    "economic_interest_pct": m(
        t_pct,
        "holdings.topicus.fields.csu_economic_interest_pct.value",
        {"csu_economic_interest_pct": t_pct},
        unit="percent, fully diluted basis",
        note=f"[holdings:topicus:csu_economic_interest_pct] source={t_pct_src}",
    ),
    "market_cap_native": m(
        t_mcap,
        "holdings.topicus.fields.market_cap.value",
        {"market_cap": t_mcap},
        unit=t_mcap_unit,
        note=f"[holdings:topicus:market_cap] source={t_mcap_src} (sourced via ../ledger.json peers)",
    ),
    "look_through_value_native": m(
        round(t_look_value_native, 3),
        "csu_economic_interest_pct/100 * market_cap_native",
        {"csu_economic_interest_pct": t_pct, "market_cap_native": t_mcap},
        unit="CAD millions",
    ),
    "usd_value": null_metric(
        "look_through_value_native / usdcad_rate",
        {"look_through_value_native": round(t_look_value_native, 3)},
        "no usdcad/eurcad/eurusd rate is sourced in holdings.json for Topicus (stage1 intake recorded no FX rate); "
        "left null per Stage 3 spec instruction rather than importing an unsourced rate.",
    ),
}

# --- Lumine (two conflicting market caps, per holdings.json conflicts) ---
lumine_fields = H["lumine"]["fields"]
lu_pct = lumine_fields["csu_economic_interest_pct"]["value"]  # 61.40
lu_pct_src = lumine_fields["csu_economic_interest_pct"]["source_url"]
lu_mcap_low = lumine_fields["market_cap"]["value_1"]  # 5.628 CAD billions, 2026-09-10
lu_mcap_high = lumine_fields["market_cap"]["value_2"]  # 6.413 CAD billions, 2026-09-02

lu_mcap_low_cadm = lu_mcap_low["value"] * 1000.0  # billions -> millions
lu_mcap_high_cadm = lu_mcap_high["value"] * 1000.0

lu_look_low = lu_pct / 100.0 * lu_mcap_low_cadm
lu_look_high = lu_pct / 100.0 * lu_mcap_high_cadm

look_through["lumine"] = {
    "economic_interest_pct": m(
        lu_pct,
        "holdings.lumine.fields.csu_economic_interest_pct.value",
        {"csu_economic_interest_pct": lu_pct},
        unit="percent, held as subordinate voting shares (post March 2024 mandatory conversion)",
        note=f"[holdings:lumine:csu_economic_interest_pct] source={lu_pct_src}",
    ),
    "market_cap_native_low": m(
        round(lu_mcap_low_cadm, 3),
        "holdings.lumine.fields.market_cap.value_1.value * 1000 (CAD billions -> CAD millions)",
        {"market_cap_cad_billions": lu_mcap_low["value"]},
        unit="CAD millions",
        note=f"[holdings:lumine:market_cap:value_1] period={lu_mcap_low['period']} source={lu_mcap_low['source_url']}. "
        "holdings.json records two conflicting Lumine market caps for September 2026 (see conflicts); both computed here, never averaged.",
    ),
    "market_cap_native_high": m(
        round(lu_mcap_high_cadm, 3),
        "holdings.lumine.fields.market_cap.value_2.value * 1000 (CAD billions -> CAD millions)",
        {"market_cap_cad_billions": lu_mcap_high["value"]},
        unit="CAD millions",
        note=f"[holdings:lumine:market_cap:value_2] period={lu_mcap_high['period']} source={lu_mcap_high['source_url']}",
    ),
    "look_through_value_native_low": m(
        round(lu_look_low, 3),
        "csu_economic_interest_pct/100 * market_cap_native_low",
        {"csu_economic_interest_pct": lu_pct, "market_cap_native_low": round(lu_mcap_low_cadm, 3)},
        unit="CAD millions",
    ),
    "look_through_value_native_high": m(
        round(lu_look_high, 3),
        "csu_economic_interest_pct/100 * market_cap_native_high",
        {"csu_economic_interest_pct": lu_pct, "market_cap_native_high": round(lu_mcap_high_cadm, 3)},
        unit="CAD millions",
    ),
    "usd_value": null_metric(
        "look_through_value_native / usdcad_rate",
        {"look_through_value_native_low": round(lu_look_low, 3), "look_through_value_native_high": round(lu_look_high, 3)},
        "no usdcad/eurcad/eurusd rate is sourced in holdings.json for Lumine (stage1 intake recorded no FX rate); "
        "left null per Stage 3 spec instruction rather than importing an unsourced rate.",
    ),
}

# --- Share of CSU market cap ---
csu_mcap_usd = L["market_cap_usd"]["2026-09"]["value"]  # 47950
csu_mcap_cad_reported = L["market_cap_cad"]["2026-09-08"]["value"]  # 65183
fx_rates = [1.25, 1.30, 1.35, 1.3594]  # first report's post_review fx_sensitivity rates

share_of_csu = {}
for slug, values in (("topicus", {"single": t_look_value_native}),
                     ("lumine", {"low": lu_look_low, "high": lu_look_high})):
    entry = {}
    # (a) using ledger's reported CAD market cap directly -- no conversion needed
    reported = {}
    for k, v in values.items():
        reported[k] = m(
            round(v / csu_mcap_cad_reported, 6),
            "look_through_value_native / market_cap_cad[2026-09-08]",
            {"look_through_value_native": round(v, 3), "market_cap_cad.2026-09-08": csu_mcap_cad_reported},
            unit="fraction of CSU market cap",
            note="[ledger:market_cap_cad:2026-09-08] both figures are CAD; no currency conversion needed.",
        )
    entry["share_of_csu_market_cap_reported_cad"] = reported
    # (b) sensitivity: convert ledger market_cap_usd to CAD at each fx_sensitivity rate
    sensitivity = []
    for rate in fx_rates:
        csu_mcap_cad_at_rate = csu_mcap_usd * rate
        row = {"usdcad": rate, "csu_market_cap_cad": round(csu_mcap_cad_at_rate, 3)}
        for k, v in values.items():
            row[f"share_{k}"] = round(v / csu_mcap_cad_at_rate, 6)
        sensitivity.append(row)
    entry["share_of_csu_market_cap_fx_sensitivity"] = m(
        sensitivity,
        "look_through_value_native / (market_cap_usd[2026-09] * usdcad_rate), for usdcad in [1.25, 1.30, 1.35, 1.3594]",
        {"market_cap_usd.2026-09": csu_mcap_usd, "fx_rates": fx_rates},
        note="[ledger:market_cap_usd:2026-09] rates per first report's post_review.fx_sensitivity [metrics:post_review:fx_sensitivity]",
    )
    share_of_csu[slug] = entry

look_through["share_of_csu_market_cap"] = share_of_csu

# --- Implied value of the private groups = CSU market cap (CAD) - look-through value of listed stakes (CAD) ---
implied_private = {}
implied_private["using_reported_cad_market_cap"] = {
    "with_lumine_low": m(
        round(csu_mcap_cad_reported - t_look_value_native - lu_look_low, 3),
        "market_cap_cad[2026-09-08] - topicus.look_through_value_native - lumine.look_through_value_native_low",
        {"market_cap_cad.2026-09-08": csu_mcap_cad_reported,
         "topicus_look_through": round(t_look_value_native, 3),
         "lumine_look_through_low": round(lu_look_low, 3)},
        unit="CAD millions",
    ),
    "with_lumine_high": m(
        round(csu_mcap_cad_reported - t_look_value_native - lu_look_high, 3),
        "market_cap_cad[2026-09-08] - topicus.look_through_value_native - lumine.look_through_value_native_high",
        {"market_cap_cad.2026-09-08": csu_mcap_cad_reported,
         "topicus_look_through": round(t_look_value_native, 3),
         "lumine_look_through_high": round(lu_look_high, 3)},
        unit="CAD millions",
    ),
}
sensitivity_rows = []
for rate in fx_rates:
    csu_mcap_cad_at_rate = csu_mcap_usd * rate
    sensitivity_rows.append({
        "usdcad": rate,
        "csu_market_cap_cad": round(csu_mcap_cad_at_rate, 3),
        "implied_private_groups_value_with_lumine_low": round(csu_mcap_cad_at_rate - t_look_value_native - lu_look_low, 3),
        "implied_private_groups_value_with_lumine_high": round(csu_mcap_cad_at_rate - t_look_value_native - lu_look_high, 3),
    })
implied_private["using_fx_sensitivity"] = m(
    sensitivity_rows,
    "market_cap_usd[2026-09] * usdcad_rate - topicus.look_through_value_native - lumine.look_through_value_native_{low,high}",
    {"market_cap_usd.2026-09": csu_mcap_usd, "fx_rates": fx_rates},
    unit="CAD millions",
)
look_through["implied_value_private_groups"] = implied_private

results["look_through"] = look_through

# ===========================================================================
# 2. REINVESTMENT GRID (identity, not a forecast)
# ===========================================================================
reinvestment_rates = [0.5, 0.75, 1.0, 1.25, 1.5]
returns = [0.08, 0.10, 0.12, 0.15, 0.20, 0.25]
organic_rates = [0.0, 0.02, 0.04]
organic_pass_through = 1.0

grid_rows = []
for rr in reinvestment_rates:
    for ret in returns:
        g = rr * ret
        row = {"reinvestment_rate": rr, "return_on_deployed_capital": ret, "g": round(g, 6)}
        for og in organic_rates:
            g_total = g + og * organic_pass_through
            row[f"g_total_organic_{og}"] = round(g_total, 6)
        grid_rows.append(row)

results["reinvestment_grid"] = {
    "label": "This is the algebraic identity g = reinvestment_rate * return_on_deployed_capital that the ten-year "
             "reinvestment case rests on. It is NOT a forecast of Constellation's future growth; it shows what "
             "combination of deployment rate and ROIC is required to produce a given FCFA2S-per-share growth rate.",
    "formula": "g = reinvestment_rate * return_on_deployed_capital; g_total = g + organic_growth * organic_pass_through_rate",
    "organic_pass_through_rate": organic_pass_through,
    "reinvestment_rate_axis": reinvestment_rates,
    "return_on_deployed_capital_axis": returns,
    "organic_growth_axis": organic_rates,
    "grid": grid_rows,
}

# ===========================================================================
# 3. TEN YEAR HOLD GRID (IRR via bisection)
# ===========================================================================
def irr_bisection(cashflows, lo=-0.99, hi=10.0, tol=1e-9, max_iter=200):
    """cashflows: list of (t, amount) for t=1..N, discounted; solves for r s.t. PV(cashflows) = 0
    where cashflows already include the negative of entry price at t=0 folded in by the caller
    (i.e. this solves f(r) = sum(amount / (1+r)**t) = 0, entry price passed in as a t=0 negative cashflow)."""
    def pv(r):
        return sum(amount / ((1 + r) ** t) for t, amount in cashflows)

    f_lo, f_hi = pv(lo), pv(hi)
    if f_lo == 0:
        return lo
    if f_hi == 0:
        return hi
    if (f_lo > 0) == (f_hi > 0):
        # No sign change in range; cannot bracket a root.
        return None
    for _ in range(max_iter):
        mid = (lo + hi) / 2
        f_mid = pv(mid)
        if abs(f_mid) < tol:
            return mid
        if (f_mid > 0) == (f_lo > 0):
            lo, f_lo = mid, f_mid
        else:
            hi, f_hi = mid, f_mid
    return (lo + hi) / 2


base_fcfa2s_ps = metrics["scenario_inputs"]["current_fcfa2s_per_share"]["value"]  # 95.7999...
entry_price_report = metrics["scenario_inputs"]["entry_price_usd"]["value"]  # 2262.8598...
entry_price_1_3594 = None
for row in metrics["post_review"]["fx_sensitivity"]["value"]:
    if row["usdcad"] == 1.3594:
        entry_price_1_3594 = row["entry_price_usd"]
        break

dividend_per_share = 4.00
n_years = 10
cagr_axis = [0, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15]
exit_multiple_axis = [12, 15, 20, 25, 30]

entry_scenarios = {
    "entry_usd_2262_86_first_report": {
        "entry_price": entry_price_report,
        "source_note": "[metrics:scenario_inputs:entry_price_usd] first report's headline entry price.",
    },
    "entry_usd_2080_29_at_usdcad_1_3594": {
        "entry_price": entry_price_1_3594,
        "source_note": "[metrics:post_review:fx_sensitivity:entry_price_usd @ usdcad=1.3594] corrected-FX entry price.",
    },
}

hold_grid = {}
for scen_key, scen in entry_scenarios.items():
    entry_price = scen["entry_price"]
    rows = []
    for cagr in cagr_axis:
        for exit_mult in exit_multiple_axis:
            exit_fcfa2s_ps = base_fcfa2s_ps * ((1 + cagr) ** n_years)
            exit_value = exit_fcfa2s_ps * exit_mult
            cashflows = [(t, dividend_per_share) for t in range(1, n_years + 1)]
            cashflows.append((n_years, exit_value))
            # Solve entry_price = sum(cf / (1+r)^t) -> f(r) = sum(cf/(1+r)^t) - entry_price = 0
            cashflows_with_entry = cashflows + [(0, -entry_price)]
            # shift: treat entry at t=0 as amount -entry_price undiscounted (t=0 => /(1+r)^0 = amount)
            r = irr_bisection(cashflows_with_entry)
            rows.append({
                "fcfa2s_cagr": cagr,
                "exit_multiple": exit_mult,
                "exit_fcfa2s_per_share": round(exit_fcfa2s_ps, 4),
                "exit_value": round(exit_value, 2),
                "irr_10yr": round(r, 6) if r is not None else None,
            })
    hold_grid[scen_key] = {
        "entry_price_usd": entry_price,
        "source_note": scen["source_note"],
        "base_fcfa2s_per_share": base_fcfa2s_ps,
        "base_fcfa2s_per_share_source": "[metrics:scenario_inputs:current_fcfa2s_per_share]",
        "dividend_per_share_per_year": dividend_per_share,
        "n_years": n_years,
        "formula": "entry_price = sum_{t=1..10}(dividend/(1+r)^t) + exit_value/(1+r)^10, "
                   "exit_value = base_fcfa2s_per_share*(1+cagr)^10 * exit_multiple, solved for r via bisection. "
                   "Dividends are held as uninvested cash (not reinvested at any assumed return) -- each is a "
                   "separate cash flow at its own year, discounted individually.",
        "cagr_axis": cagr_axis,
        "exit_multiple_axis": exit_multiple_axis,
        "grid": rows,
    }

results["hold_grid_10yr"] = hold_grid

# ===========================================================================
# 4. TEN YEAR HISTORY (from parent_long_run)
# ===========================================================================
PLR = holdings["parent_long_run"]


import re as _re

_YEAR_RE = _re.compile(r"(19|20)\d{2}")


def year_int(period_key):
    """Extract a single 4-digit year (19xx/20xx) from a period label like 'FY2020', '~2022',
    'Q1 2026', or 'six months ended June 30, 2026'. Returns None if no such token is found,
    or if more than one distinct year token is found (ambiguous)."""
    if not isinstance(period_key, str):
        return None
    full_years = set(_re.findall(r"(?:19|20)\d{2}", period_key))
    if len(full_years) == 1:
        return int(next(iter(full_years)))
    return None


def series(key):
    """Return {year:int -> value} for a parent_long_run top-level key."""
    out = {}
    for period_key, entry in PLR.get(key, {}).items():
        yr = year_int(period_key)
        if yr is not None and isinstance(entry, dict) and "value" in entry:
            out[yr] = entry["value"]
    return out


def cagr(start_val, end_val, n_years_span):
    if start_val is None or end_val is None or n_years_span <= 0 or start_val <= 0:
        return None
    return (end_val / start_val) ** (1.0 / n_years_span) - 1.0


def window_cagr(sr, window=None):
    """sr: {year: value}. window: (start_year, end_year) or None for longest available."""
    years = sorted(sr.keys())
    if not years:
        return None, {}
    if window is None:
        start_y, end_y = years[0], years[-1]
    else:
        start_y, end_y = window
        if start_y not in sr or end_y not in sr:
            return None, {"missing": f"need both {start_y} and {end_y} in series; have {years}"}
    span = end_y - start_y
    val = cagr(sr[start_y], sr[end_y], span)
    return val, {f"value_{start_y}": sr[start_y], f"value_{end_y}": sr[end_y], "n_years": span}


def avg_series(sr, window=None):
    years = sorted(sr.keys())
    if window is not None:
        years = [y for y in years if window[0] <= y <= window[1]]
    if not years:
        return None, {}
    vals = [sr[y] for y in years]
    return sum(vals) / len(vals), {"years_used": years, "values": vals}


revenue_sr = series("revenue")
fcfa2s_sr = series("fcfa2s")
organic_sr = {y: v for y, v in series("organic_growth_pct").items()}
acq_cash_sr = series("acquisitions_cash_spent")
shares_sr = series("shares_outstanding")

ten_year_history = {}
for window_name, window in (("longest_available", None), ("2015_2020", (2015, 2020)), ("2020_2025", (2020, 2025))):
    block = {}

    val, inputs = window_cagr(revenue_sr, window)
    if val is None:
        block["revenue_cagr"] = null_metric(
            "(revenue[end]/revenue[start])^(1/n_years) - 1",
            inputs,
            f"revenue_cagr[{window_name}]: missing endpoint(s) in parent_long_run.revenue -- {inputs.get('missing', '')}",
        )
    else:
        block["revenue_cagr"] = m(round(val, 6), "(revenue[end]/revenue[start])^(1/n_years) - 1", inputs)

    val, inputs = window_cagr(fcfa2s_sr, window)
    if val is None:
        block["fcfa2s_cagr"] = null_metric(
            "(fcfa2s[end]/fcfa2s[start])^(1/n_years) - 1",
            inputs,
            f"fcfa2s_cagr[{window_name}]: missing endpoint(s) in parent_long_run.fcfa2s (only FY2018-FY2021 on file) -- {inputs.get('missing', '')}",
        )
    else:
        block["fcfa2s_cagr"] = m(round(val, 6), "(fcfa2s[end]/fcfa2s[start])^(1/n_years) - 1", inputs)

    # fcfa2s per share CAGR: needs a shares_outstanding series (only one year on file) -> always null
    block["fcfa2s_per_share_cagr"] = null_metric(
        "(fcfa2s[end]/shares[end]) / (fcfa2s[start]/shares[start]))^(1/n_years) - 1",
        {"shares_outstanding_years_on_file": sorted(shares_sr.keys())},
        f"fcfa2s_per_share_cagr[{window_name}]: parent_long_run.shares_outstanding has only one year on file "
        f"({sorted(shares_sr.keys())}); no historical share-count series exists to compute a per-share CAGR.",
    )

    val, inputs = avg_series(organic_sr, window)
    if val is None:
        block["average_organic_growth_pct"] = null_metric(
            "mean(organic_growth_pct[years in window])",
            inputs,
            f"average_organic_growth_pct[{window_name}]: no organic_growth_pct entries fall in this window.",
        )
    else:
        note = None
        all_years_present = {
            "longest_available": {2015, 2016, 2017, 2018, 2019, 2020, 2021},
            "2015_2020": {2015, 2016, 2017, 2018, 2019, 2020},
            "2020_2025": {2020, 2021, 2022, 2023, 2024, 2025},
        }[window_name]
        missing_years = sorted(all_years_present - set(inputs.get("years_used", [])))
        if missing_years:
            note = f"average excludes years with no parent_long_run.organic_growth_pct figure: {missing_years}"
        block["average_organic_growth_pct"] = m(round(val, 4), "mean(organic_growth_pct[years in window])", inputs, note=note)

    # acquisitions to fcfa2s ratio, averaged over years where both exist within window
    years_common = sorted(set(acq_cash_sr) & set(fcfa2s_sr))
    if window is not None:
        years_common = [y for y in years_common if window[0] <= y <= window[1]]
    if not years_common:
        block["average_acquisitions_to_fcfa2s"] = null_metric(
            "mean(acquisitions_cash_spent[y]/fcfa2s[y] for y in years where both exist)",
            {"acquisitions_years": sorted(acq_cash_sr.keys()), "fcfa2s_years": sorted(fcfa2s_sr.keys())},
            f"average_acquisitions_to_fcfa2s[{window_name}]: no year in this window has both "
            f"acquisitions_cash_spent and fcfa2s on file.",
        )
    else:
        ratios = [acq_cash_sr[y] / fcfa2s_sr[y] for y in years_common]
        block["average_acquisitions_to_fcfa2s"] = m(
            round(sum(ratios) / len(ratios), 6),
            "mean(acquisitions_cash_spent[y]/fcfa2s[y] for y in years where both exist)",
            {"years_used": years_common, "ratios": [round(r, 4) for r in ratios]},
        )

    ten_year_history[window_name] = block

results["ten_year_history"] = ten_year_history

# ===========================================================================
# 5. LISTED SUBSIDIARIES (Topicus, Lumine)
# ===========================================================================
def period_year_quarter(label):
    return label  # keys already carry period labels like 'FY2024', 'Q2 2026', 'H1 2026'


def yoy_pairs(period_list):
    """Map a period like 'FY2025' -> 'FY2024', 'Q2 2026' -> 'Q2 2025', 'H1 2026' -> 'H1 2025'."""
    pairs = {}
    for p in period_list:
        yr = year_int(p)
        if yr is None:
            continue
        prev_label = p.replace(str(yr), str(yr - 1))
        pairs[p] = prev_label
    return pairs


def compute_listed_sub(slug):
    f = H[slug]["fields"]
    rev = f.get("revenue", {})
    rev = {k: v for k, v in rev.items() if isinstance(v, dict) and "value" in v}
    fcfa2s = f.get("fcfa2s", {})
    fcfa2s = {k: v for k, v in fcfa2s.items() if isinstance(v, dict) and "value" in v}
    acq = f.get("acquisitions_cash_spent", {})
    acq = {k: v for k, v in acq.items() if isinstance(v, dict) and "value" in v}
    organic = f.get("organic_growth_pct", {})
    organic = {k: v for k, v in organic.items() if isinstance(v, dict) and "value" in v}

    out = {}

    # revenue growth yoy, computed from raw revenue values only
    growth = {}
    pairs = yoy_pairs(list(rev.keys()))
    for cur, prev in pairs.items():
        if prev in rev:
            g = rev[cur]["value"] / rev[prev]["value"] - 1.0
            growth[cur] = m(round(g, 6), f"revenue[{cur}]/revenue[{prev}] - 1",
                             {f"revenue.{cur}": rev[cur]["value"], f"revenue.{prev}": rev[prev]["value"]})
        else:
            growth[cur] = null_metric(f"revenue[{cur}]/revenue[{prev}] - 1", {f"revenue.{cur}": rev[cur]["value"]},
                                       f"{slug} revenue_growth_yoy[{cur}]: no {prev} revenue in holdings.json.")
    out["revenue_growth_yoy"] = growth

    # organic growth: cite directly, already disclosed (not computed)
    out["organic_growth_pct"] = {
        k: m(v["value"], "holdings.<slug>.fields.organic_growth_pct.<period>.value (disclosed, not computed)",
             {"organic_growth_pct": v["value"]}, unit=v.get("unit"), note=f"[holdings:{slug}:organic_growth_pct:{k}]")
        for k, v in organic.items()
    }

    # maintenance share: cite directly where present (already a %)
    maint = f.get("maintenance_recurring_revenue")
    if isinstance(maint, dict) and "value" in maint:
        out["maintenance_share_of_revenue"] = m(
            maint["value"], "holdings.<slug>.fields.maintenance_recurring_revenue.value (disclosed percentage, not computed)",
            {"maintenance_recurring_revenue_pct": maint["value"]}, unit=maint.get("unit"),
            note=f"[holdings:{slug}:maintenance_recurring_revenue]",
        )
    else:
        out["maintenance_share_of_revenue"] = null_metric(
            "maintenance_recurring_revenue / revenue", {}, f"{slug}: no maintenance_recurring_revenue field in holdings.json.")

    # fcfa2s margin = fcfa2s / revenue, matching periods
    margin = {}
    for p, entry in fcfa2s.items():
        if p in rev:
            margin[p] = m(round(entry["value"] / rev[p]["value"], 6), f"fcfa2s[{p}]/revenue[{p}]",
                           {f"fcfa2s.{p}": entry["value"], f"revenue.{p}": rev[p]["value"]})
        else:
            margin[p] = null_metric(f"fcfa2s[{p}]/revenue[{p}]", {f"fcfa2s.{p}": entry["value"]},
                                     f"{slug} fcfa2s_margin[{p}]: no revenue figure for {p} in holdings.json.")
    out["fcfa2s_margin"] = margin

    # acquisitions to fcfa2s, matching periods
    a2f = {}
    for p, entry in acq.items():
        if p in fcfa2s:
            a2f[p] = m(round(entry["value"] / fcfa2s[p]["value"], 6), f"acquisitions_cash_spent[{p}]/fcfa2s[{p}]",
                        {f"acquisitions_cash_spent.{p}": entry["value"], f"fcfa2s.{p}": fcfa2s[p]["value"]})
        else:
            a2f[p] = null_metric(f"acquisitions_cash_spent[{p}]/fcfa2s[{p}]", {f"acquisitions_cash_spent.{p}": entry["value"]},
                                  f"{slug} acquisitions_to_fcfa2s[{p}]: no fcfa2s figure for {p} in holdings.json.")
    out["acquisitions_to_fcfa2s"] = a2f

    # net debt = total_debt - cash, matching periods (structures differ per group, handled specially below)
    out["net_debt"] = {}
    return out


listed_subsidiaries = {"topicus": compute_listed_sub("topicus"), "lumine": compute_listed_sub("lumine")}

# Topicus net debt: cash and total_debt both flat entries at Q2 2026
tf = H["topicus"]["fields"]
if "cash" in tf and "total_debt" in tf:
    p = tf["cash"]["period"]
    nd = tf["total_debt"]["value"] - tf["cash"]["value"]
    listed_subsidiaries["topicus"]["net_debt"][p] = m(
        round(nd, 3), "total_debt - cash", {"total_debt": tf["total_debt"]["value"], "cash": tf["cash"]["value"]},
        unit="EUR millions",
    )

# Lumine net debt: cash only at FY2025 (third_party), total_debt has FY2025 USD entry -- match FY2025
lf = H["lumine"]["fields"]
cash_fy2025 = lf.get("cash", {}).get("FY2025")
debt_fy2025 = lf.get("total_debt", {}).get("value_usd_2025")
if cash_fy2025 and debt_fy2025:
    nd = debt_fy2025["value"] - cash_fy2025["value"]
    listed_subsidiaries["lumine"]["net_debt"]["FY2025"] = m(
        round(nd, 3), "total_debt.value_usd_2025 - cash.FY2025",
        {"total_debt": debt_fy2025["value"], "cash": cash_fy2025["value"]},
        unit="USD millions",
        note="cash figure is third_party (CB Insights), not independently verified against the audited FY2025 balance sheet [holdings:lumine:cash:FY2025]",
    )
else:
    listed_subsidiaries["lumine"]["net_debt"]["FY2025"] = null_metric(
        "total_debt.value_usd_2025 - cash.FY2025", {}, "lumine net_debt[FY2025]: missing cash or total_debt input.")

results["listed_subsidiaries"] = listed_subsidiaries

# ===========================================================================
# 6. CONCENTRATION
# ===========================================================================
parent_revenue_sr = revenue_sr  # {year:int -> USD millions}
parent_headcount_sr = series("headcount")  # {year:int -> approx employees}
# parent business_unit_count: confirmed empty/gap in parent_long_run -- see holdings.json parent_long_run.business_unit_count
parent_business_unit_count_available = bool(PLR.get("business_unit_count"))

concentration = {"revenue_share": {}, "headcount_share": {}, "business_count_share": {}}


def group_revenue_points(slug):
    """Return list of (year, value, unit, currency_ok) for a group's revenue field, only for USD entries
    matching the parent's USD reporting currency (no currency conversion performed anywhere in this script)."""
    f = H[slug]["fields"]
    rev = f.get("revenue")
    pts = []
    if isinstance(rev, dict) and "value" in rev:
        pts.append((year_int(rev.get("period", "")), rev["value"], rev.get("unit", "")))
    elif isinstance(rev, dict):
        for k, v in rev.items():
            if isinstance(v, dict) and "value" in v:
                pts.append((year_int(v.get("period", k)), v["value"], v.get("unit", "")))
    return pts


for slug in H:
    pts = group_revenue_points(slug)
    usd_pts = [(yr, val, unit) for (yr, val, unit) in pts if yr is not None and "usd" in unit.lower()]
    if not usd_pts:
        reason = "no USD-denominated revenue figure in holdings.json for this group" if pts else "no revenue figure in holdings.json for this group (see gaps)"
        concentration["revenue_share"][slug] = null_metric(
            "group_revenue[year] / parent_revenue[year]", {}, f"{slug} revenue_share: {reason}.")
        continue
    entries = {}
    for yr, val, unit in usd_pts:
        if yr in parent_revenue_sr:
            share = val / parent_revenue_sr[yr]
            note = None
            if slug in ("volaris", "vela"):
                note = f"[{slug}] this group's figures carry a conflict/flag in holdings.json (see conflicts); share computed from the sourced value as-is."
            entries[f"FY{yr}"] = m(round(share, 6), f"{slug}_revenue[FY{yr}] / parent_revenue[FY{yr}]",
                                    {f"{slug}_revenue": val, "parent_revenue": parent_revenue_sr[yr]}, note=note)
        else:
            entries[f"FY{yr}"] = null_metric(f"{slug}_revenue[FY{yr}] / parent_revenue[FY{yr}]", {f"{slug}_revenue": val},
                                              f"{slug} revenue_share[FY{yr}]: parent_long_run.revenue has no FY{yr} figure.")
    concentration["revenue_share"][slug] = entries


def group_headcount_points(slug):
    f = H[slug]["fields"]
    emp = f.get("employees")
    pts = []
    if isinstance(emp, dict) and "value" in emp:
        pts.append((year_int(emp.get("period", "")), emp["value"]))
    elif isinstance(emp, dict):
        for k, v in emp.items():
            if isinstance(v, dict) and "value" in v:
                pts.append((year_int(v.get("period", k)), v["value"]))
    return pts


for slug in H:
    pts = [(yr, val) for (yr, val) in group_headcount_points(slug) if yr is not None]
    if not pts:
        concentration["headcount_share"][slug] = null_metric(
            "group_headcount[year] / parent_headcount[year]", {}, f"{slug} headcount_share: no employees figure in holdings.json for this group.")
        continue
    entries = {}
    for yr, val in pts:
        if yr in parent_headcount_sr:
            share = val / parent_headcount_sr[yr]
            entries[f"~{yr}"] = m(round(share, 6), f"{slug}_headcount[~{yr}] / parent_headcount[~{yr}]",
                                   {f"{slug}_headcount": val, "parent_headcount": parent_headcount_sr[yr]},
                                   note="parent headcount figure is a low-confidence third-party approximation [holdings:parent_long_run:headcount]")
        else:
            entries[f"~{yr}"] = null_metric(f"{slug}_headcount[~{yr}] / parent_headcount[~{yr}]", {f"{slug}_headcount": val},
                                             f"{slug} headcount_share[~{yr}]: parent_long_run.headcount has no figure for year {yr}.")
    concentration["headcount_share"][slug] = entries

for slug in H:
    concentration["business_count_share"][slug] = null_metric(
        "group_business_count / parent_business_unit_count", {},
        f"{slug} business_count_share: parent_long_run.business_unit_count is empty -- stage1 parent_long_run.json "
        f"confirmed no business-unit-count-by-year figure was found for Constellation (see its own gaps list). "
        f"Not estimated.",
    )

results["concentration"] = concentration

# ===========================================================================
# 7. SPOT CHECKS (recomputed by hand from raw inputs, asserted equal)
# ===========================================================================
spot_checks = []

# Spot check 1: Lumine H1 2026 revenue = Q1 2026 + Q2 2026 (exact match expected)
lu_rev = H["lumine"]["fields"]["revenue"]
q1, q2, h1 = lu_rev["Q1 2026"]["value"], lu_rev["Q2 2026"]["value"], lu_rev["H1 2026"]["value"]
recomputed = round(q1 + q2, 4)
diff_pct = abs(recomputed - h1) / h1 * 100
spot_checks.append({
    "name": "lumine_h1_2026_revenue_reconciliation",
    "formula": "revenue.Q1_2026 + revenue.Q2_2026 == revenue.H1_2026",
    "inputs": {"revenue.Q1 2026": q1, "revenue.Q2 2026": q2, "revenue.H1 2026": h1},
    "recomputed_value": recomputed,
    "reported_value": h1,
    "pct_diff": round(diff_pct, 4),
    "tolerance_pct": 1.0,
    "assert_equal_within_tolerance": diff_pct <= 1.0,
})

# Spot check 2: Topicus H1 2025 revenue = Q1 2025 + Q2 2025 (within 1%, per gate rule)
to_rev = H["topicus"]["fields"]["revenue"]
q1t, q2t, h1t = to_rev["Q1 2025"]["value"], to_rev["Q2 2025"]["value"], to_rev["H1 2025"]["value"]
recomputed_t = round(q1t + q2t, 4)
diff_pct_t = abs(recomputed_t - h1t) / h1t * 100
spot_checks.append({
    "name": "topicus_h1_2025_revenue_reconciliation",
    "formula": "revenue.Q1_2025 + revenue.Q2_2025 == revenue.H1_2025 (within 1%)",
    "inputs": {"revenue.Q1 2025": q1t, "revenue.Q2 2025": q2t, "revenue.H1 2025": h1t},
    "recomputed_value": recomputed_t,
    "reported_value": h1t,
    "pct_diff": round(diff_pct_t, 4),
    "tolerance_pct": 1.0,
    "assert_equal_within_tolerance": diff_pct_t <= 1.0,
})

# Spot check 3: Topicus look-through value, recomputed independently from raw holdings.json fields
t_pct_check = H["topicus"]["fields"]["csu_economic_interest_pct"]["value"]
t_mcap_check = H["topicus"]["fields"]["market_cap"]["value"]
recomputed_lt = round(t_pct_check / 100.0 * t_mcap_check, 3)
reported_lt = results["look_through"]["topicus"]["look_through_value_native"]["value"]
diff_lt = abs(recomputed_lt - reported_lt)
spot_checks.append({
    "name": "topicus_look_through_value_cross_check",
    "formula": "csu_economic_interest_pct/100 * market_cap, recomputed independently of the look_through section",
    "inputs": {"csu_economic_interest_pct": t_pct_check, "market_cap": t_mcap_check},
    "recomputed_value": recomputed_lt,
    "reported_value": reported_lt,
    "pct_diff": round(diff_lt / reported_lt * 100, 6) if reported_lt else None,
    "tolerance_pct": 0.001,
    "assert_equal_within_tolerance": diff_lt < 0.001,
})

results["spot_checks"] = spot_checks

all_spot_checks_pass = all(sc["assert_equal_within_tolerance"] for sc in spot_checks)
for sc in spot_checks:
    assert sc["assert_equal_within_tolerance"], f"SPOT CHECK FAILED: {sc['name']} ({sc})"

# ===========================================================================
# WRITE hold_metrics.json
# ===========================================================================
null_count = 0


def count_nulls(node):
    global null_count
    if isinstance(node, dict):
        if "value" in node and node["value"] is None and "formula" in node:
            null_count += 1
        else:
            for v in node.values():
                count_nulls(v)
    elif isinstance(node, list):
        for item in node:
            count_nulls(item)


count_nulls(results)

output = {
    "generated_from": ["holdings.json", "../ledger.json", "../metrics.json"],
    "date": "2026-09-14",
    "null_metric_count": null_count,
    "spot_checks_all_pass": all_spot_checks_pass,
    **results,
}

out_json_path = os.path.join(HERE, "hold_metrics.json")
with open(out_json_path, "w") as f:
    json.dump(output, f, indent=2, sort_keys=False)

print(f"Wrote {out_json_path}")
print(f"Null metrics: {null_count}")
print(f"Spot checks all pass: {all_spot_checks_pass}")

# ===========================================================================
# WRITE hold_metrics.xlsx (openpyxl, with live formulas where inputs are single cells)
# ===========================================================================
wb = Workbook()
wb.remove(wb.active)

# --- Sheet: Look Through ---
ws = wb.create_sheet("Look Through")
ws.append(["Metric", "Value", "Unit", "Note"])
ws.append(["Topicus economic interest pct", t_pct, "percent"])
ws.append(["Topicus market cap (native)", t_mcap, t_mcap_unit])
ws.append(["Topicus look-through value (native)", None, "CAD millions"])
ws.cell(row=4, column=2).value = "=B2/100*B3"
ws.append([])
ws.append(["Lumine economic interest pct", lu_pct, "percent"])
ws.append(["Lumine market cap low (CAD millions)", round(lu_mcap_low_cadm, 3)])
ws.append(["Lumine market cap high (CAD millions)", round(lu_mcap_high_cadm, 3)])
ws.append(["Lumine look-through value low", None])
ws.cell(row=9, column=2).value = "=B6/100*B7"
ws.append(["Lumine look-through value high", None])
ws.cell(row=10, column=2).value = "=B6/100*B8"
ws.append([])
ws.append(["CSU market cap (CAD, reported, 2026-09-08)", csu_mcap_cad_reported, "CAD millions"])
ws.append(["CSU market cap (USD, 2026-09)", csu_mcap_usd, "USD millions"])
ws.append(["Implied private-groups value (reported CAD, Lumine low)", None])
ws.cell(row=14, column=2).value = "=B12-B4-B9"
ws.append(["Implied private-groups value (reported CAD, Lumine high)", None])
ws.cell(row=15, column=2).value = "=B12-B4-B10"
for col, width in ((1, 46), (2, 18), (3, 22), (4, 60)):
    ws.column_dimensions[get_column_letter(col)].width = width

# --- Sheet: Reinvestment Grid ---
ws = wb.create_sheet("Reinvestment Grid")
ws.cell(row=1, column=1, value="g = reinvestment_rate x return_on_deployed_capital (identity, not a forecast)")
ws.cell(row=2, column=1, value="Reinvestment rate ->")
for j, rr in enumerate(reinvestment_rates):
    ws.cell(row=2, column=2 + j, value=rr)
ws.cell(row=3, column=1, value="Return on deployed capital (rows)")
for i, ret in enumerate(returns):
    r = 3 + i
    ws.cell(row=r, column=1, value=ret)
    for j, rr in enumerate(reinvestment_rates):
        col = 2 + j
        rr_cell = f"{get_column_letter(col)}2"
        ret_cell = f"A{r}"
        ws.cell(row=r, column=col, value=f"={rr_cell}*{ret_cell}")
ws.column_dimensions["A"].width = 30

# --- Sheet: Hold Grid 10yr ---
ws = wb.create_sheet("Hold Grid 10yr")
ws.append(["Scenario", "Entry Price (USD)", "Base FCFA2S/sh", "Dividend/sh/yr", "N years"])
row_i = 2
scenario_start_rows = {}
for scen_key, grid in hold_grid.items():
    ws.append([scen_key, grid["entry_price_usd"], grid["base_fcfa2s_per_share"], grid["dividend_per_share_per_year"], grid["n_years"]])
    scenario_start_rows[scen_key] = row_i
    row_i += 1
ws.append([])
row_i += 1
ws.append(["Scenario", "FCFA2S CAGR", "Exit Multiple", "Exit FCFA2S/sh", "Exit Value", "IRR (10yr, Python bisection)", "IRR (Excel RATE, live formula)"])
header_row = row_i
row_i += 1
for scen_key, grid in hold_grid.items():
    entry_price = grid["entry_price_usd"]
    dividend = grid["dividend_per_share_per_year"]
    n = grid["n_years"]
    for row in grid["grid"]:
        ws.cell(row=row_i, column=1, value=scen_key)
        ws.cell(row=row_i, column=2, value=row["fcfa2s_cagr"])
        ws.cell(row=row_i, column=3, value=row["exit_multiple"])
        ws.cell(row=row_i, column=4, value=row["exit_fcfa2s_per_share"])
        ws.cell(row=row_i, column=5, value=row["exit_value"])
        ws.cell(row=row_i, column=6, value=row["irr_10yr"])
        # Live Excel formula cross-check via RATE(nper, pmt, pv, fv)
        exit_cell = f"E{row_i}"
        ws.cell(row=row_i, column=7, value=f"=RATE({n},{dividend},-{entry_price},{exit_cell})")
        row_i += 1
for col, width in ((1, 42), (2, 14), (3, 14), (4, 16), (5, 14), (6, 26), (7, 30)):
    ws.column_dimensions[get_column_letter(col)].width = width

# --- Sheet: Ten Year History ---
ws = wb.create_sheet("Ten Year History")
ws.append(["Window", "Metric", "Value", "Formula/Note"])
for window_name, block in ten_year_history.items():
    for metric_name, entry in block.items():
        ws.append([window_name, metric_name, entry["value"], entry.get("note", entry["formula"])])
for col, width in ((1, 18), (2, 30), (3, 14), (4, 70)):
    ws.column_dimensions[get_column_letter(col)].width = width

# --- Sheet: Listed Subsidiaries ---
ws = wb.create_sheet("Listed Subsidiaries")
ws.append(["Holding", "Metric group", "Period", "Value", "Note"])
for slug, block in listed_subsidiaries.items():
    for metric_group, periods in block.items():
        if not isinstance(periods, dict):
            continue
        for period, entry in periods.items():
            if isinstance(entry, dict) and "value" in entry:
                ws.append([slug, metric_group, period, entry["value"], entry.get("note", "")])
for col, width in ((1, 12), (2, 24), (3, 14), (4, 14), (5, 60)):
    ws.column_dimensions[get_column_letter(col)].width = width

# --- Sheet: Concentration ---
ws = wb.create_sheet("Concentration")
ws.append(["Share type", "Holding", "Period", "Value", "Note"])
for share_type, per_group in concentration.items():
    for slug, entry_or_periods in per_group.items():
        if isinstance(entry_or_periods, dict) and "value" in entry_or_periods:
            ws.append([share_type, slug, "", entry_or_periods["value"], entry_or_periods.get("note", "")])
        elif isinstance(entry_or_periods, dict):
            for period, entry in entry_or_periods.items():
                ws.append([share_type, slug, period, entry.get("value"), entry.get("note", "")])
for col, width in ((1, 20), (2, 12), (3, 10), (4, 14), (5, 60)):
    ws.column_dimensions[get_column_letter(col)].width = width

# --- Sheet: Spot Checks ---
ws = wb.create_sheet("Spot Checks")
ws.append(["Name", "Input A", "Input B", "Recomputed (live formula)", "Reported", "Pct diff", "Pass"])
# Row 2: Lumine H1 2026
ws.append(["lumine_h1_2026_revenue_reconciliation", q1, q2, None, h1, None, None])
ws.cell(row=2, column=4, value="=B2+C2")
ws.cell(row=2, column=6, value="=ABS(D2-E2)/E2*100")
ws.cell(row=2, column=7, value="=F2<=1")
# Row 3: Topicus H1 2025
ws.append(["topicus_h1_2025_revenue_reconciliation", q1t, q2t, None, h1t, None, None])
ws.cell(row=3, column=4, value="=B3+C3")
ws.cell(row=3, column=6, value="=ABS(D3-E3)/E3*100")
ws.cell(row=3, column=7, value="=F3<=1")
# Row 4: Topicus look-through cross-check
ws.append(["topicus_look_through_cross_check", t_pct_check, t_mcap_check, None, reported_lt, None, None])
ws.cell(row=4, column=4, value="=B4/100*C4")
ws.cell(row=4, column=6, value="=ABS(D4-E4)/E4*100")
ws.cell(row=4, column=7, value="=F4<=0.001")
for col, width in ((1, 38), (2, 12), (3, 12), (4, 26), (5, 14), (6, 12), (7, 8)):
    ws.column_dimensions[get_column_letter(col)].width = width

out_xlsx_path = os.path.join(HERE, "hold_metrics.xlsx")
wb.save(out_xlsx_path)
print(f"Wrote {out_xlsx_path}")

# ===========================================================================
# Verify the workbook opens with openpyxl
# ===========================================================================
from openpyxl import load_workbook
wb_check = load_workbook(out_xlsx_path)
assert set(wb_check.sheetnames) == set(wb.sheetnames)
print(f"Verified hold_metrics.xlsx opens with openpyxl. Sheets: {wb_check.sheetnames}")

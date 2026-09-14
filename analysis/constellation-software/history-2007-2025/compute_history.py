#!/usr/bin/env python3
"""Stage 3: compute history_metrics.json and history_metrics.xlsx from history_ledger.json.

Standard library plus openpyxl. All arithmetic lives here. Every computed metric carries
value, formula, inputs, and (when null) a note naming the missing input.
"""
import json
import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from openpyxl.utils import get_column_letter

BASE = "/home/user/Sample_R/analysis/constellation-software/history-2007-2025"

with open(f"{BASE}/history_ledger.json") as f:
    HL = json.load(f)

with open(f"{BASE}/brief.json") as f:
    BRIEF = json.load(f)

LEDGER = HL["ledger"]
YEARS = HL["years"]  # FY2007..FY2025


def yr_num(period):
    return int(period[2:])


def get(metric, period):
    return LEDGER.get(metric, {}).get(period)


def val(metric, period):
    entry = get(metric, period)
    return entry["value"] if entry else None


def cash_metric(period):
    """Return (value, label, source_note) preferring FCFA2S, else adjusted_net_income."""
    fc = get("fcfa2s", period)
    if fc:
        return fc["value"], "fcfa2s", "USD millions"
    an = get("adjusted_net_income", period)
    if an:
        return an["value"], "adjusted_net_income", "USD millions"
    return None, None, None


def null_metric(formula, inputs, missing):
    return {"value": None, "formula": formula, "inputs": inputs, "note": f"null: missing {missing}"}


def computed(value, formula, inputs, note=None):
    d = {"value": value, "formula": formula, "inputs": inputs}
    if note:
        d["note"] = note
    return d


# ============================================================ 1. annual
annual = {}
for period in YEARS:
    y = yr_num(period)
    prev = f"FY{y-1}"
    m = {}

    rev = val("revenue", period)
    rev_prev = val("revenue", prev)
    if rev is not None and rev_prev is not None:
        g = (rev - rev_prev) / rev_prev * 100
        m["revenue_growth_pct"] = computed(round(g, 2), "(revenue[y] - revenue[y-1]) / revenue[y-1] * 100",
                                            {"revenue[y]": rev, "revenue[y-1]": rev_prev})
    else:
        missing = "revenue[y]" if rev is None else "revenue[y-1]"
        m["revenue_growth_pct"] = null_metric("(revenue[y] - revenue[y-1]) / revenue[y-1] * 100",
                                               {"revenue[y]": rev, "revenue[y-1]": rev_prev}, missing)

    aebita = val("adjusted_ebita", period)
    if aebita is not None and rev:
        m["adjusted_ebita_margin_pct"] = computed(round(aebita / rev * 100, 2), "adjusted_ebita / revenue * 100",
                                                   {"adjusted_ebita": aebita, "revenue": rev})
    else:
        missing = "adjusted_ebita" if aebita is None else "revenue"
        m["adjusted_ebita_margin_pct"] = null_metric("adjusted_ebita / revenue * 100",
                                                      {"adjusted_ebita": aebita, "revenue": rev}, missing)

    ni = val("net_income_attributable", period)
    if ni is not None and rev:
        m["net_margin_pct"] = computed(round(ni / rev * 100, 2), "net_income_attributable / revenue * 100",
                                        {"net_income_attributable": ni, "revenue": rev})
    else:
        missing = "net_income_attributable" if ni is None else "revenue"
        m["net_margin_pct"] = null_metric("net_income_attributable / revenue * 100",
                                           {"net_income_attributable": ni, "revenue": rev}, missing)

    cfo = val("cash_from_operations", period)
    if cfo is not None and rev:
        m["cfo_margin_pct"] = computed(round(cfo / rev * 100, 2), "cash_from_operations / revenue * 100",
                                        {"cash_from_operations": cfo, "revenue": rev})
    else:
        missing = "cash_from_operations" if cfo is None else "revenue"
        m["cfo_margin_pct"] = null_metric("cash_from_operations / revenue * 100",
                                           {"cash_from_operations": cfo, "revenue": rev}, missing)

    cm_val, cm_label, cm_unit = cash_metric(period)
    if cm_val is not None and rev:
        m["cash_metric_margin_pct"] = computed(round(cm_val / rev * 100, 2), f"{cm_label} / revenue * 100",
                                                {cm_label: cm_val, "revenue": rev},
                                                note=f"cash proxy used: {cm_label}")
    else:
        missing = "fcfa2s or adjusted_net_income" if cm_val is None else "revenue"
        m["cash_metric_margin_pct"] = null_metric(f"{cm_label or 'fcfa2s_or_adjusted_net_income'} / revenue * 100",
                                                   {"cash_metric": cm_val, "revenue": rev}, missing)

    if cfo is not None and ni:
        m["cash_conversion_ratio"] = computed(round(cfo / ni, 2), "cash_from_operations / net_income_attributable",
                                               {"cash_from_operations": cfo, "net_income_attributable": ni})
    else:
        missing = "cash_from_operations" if cfo is None else "net_income_attributable"
        m["cash_conversion_ratio"] = null_metric("cash_from_operations / net_income_attributable",
                                                  {"cash_from_operations": cfo, "net_income_attributable": ni}, missing)

    acq = val("acquisitions_cash_spent", period)
    if acq is not None and cfo:
        m["acquisitions_to_cfo_pct"] = computed(round(acq / cfo * 100, 2), "acquisitions_cash_spent / cash_from_operations * 100",
                                                 {"acquisitions_cash_spent": acq, "cash_from_operations": cfo})
    else:
        missing = "acquisitions_cash_spent" if acq is None else "cash_from_operations"
        m["acquisitions_to_cfo_pct"] = null_metric("acquisitions_cash_spent / cash_from_operations * 100",
                                                    {"acquisitions_cash_spent": acq, "cash_from_operations": cfo}, missing)

    if acq is not None and cm_val:
        m["acquisitions_to_cash_metric_pct"] = computed(round(acq / cm_val * 100, 2), f"acquisitions_cash_spent / {cm_label} * 100",
                                                          {"acquisitions_cash_spent": acq, cm_label: cm_val},
                                                          note=f"cash proxy used: {cm_label}")
    else:
        missing = "acquisitions_cash_spent" if acq is None else "fcfa2s or adjusted_net_income"
        m["acquisitions_to_cash_metric_pct"] = null_metric("acquisitions_cash_spent / (fcfa2s_or_adjusted_net_income) * 100",
                                                            {"acquisitions_cash_spent": acq, "cash_metric": cm_val}, missing)

    shares = val("shares_outstanding", period)
    if rev is not None and shares:
        m["per_share_revenue"] = computed(round(rev / shares, 2), "revenue / shares_outstanding",
                                           {"revenue": rev, "shares_outstanding": shares})
    else:
        missing = "revenue" if rev is None else "shares_outstanding"
        m["per_share_revenue"] = null_metric("revenue / shares_outstanding", {"revenue": rev, "shares_outstanding": shares}, missing)

    if cfo is not None and shares:
        m["per_share_cfo"] = computed(round(cfo / shares, 2), "cash_from_operations / shares_outstanding",
                                       {"cash_from_operations": cfo, "shares_outstanding": shares})
    else:
        missing = "cash_from_operations" if cfo is None else "shares_outstanding"
        m["per_share_cfo"] = null_metric("cash_from_operations / shares_outstanding",
                                          {"cash_from_operations": cfo, "shares_outstanding": shares}, missing)

    if cm_val is not None and shares:
        m["per_share_cash_metric"] = computed(round(cm_val / shares, 2), f"{cm_label} / shares_outstanding",
                                               {cm_label: cm_val, "shares_outstanding": shares},
                                               note=f"cash proxy used: {cm_label}")
    else:
        missing = "fcfa2s or adjusted_net_income" if cm_val is None else "shares_outstanding"
        m["per_share_cash_metric"] = null_metric("(fcfa2s_or_adjusted_net_income) / shares_outstanding",
                                                  {"cash_metric": cm_val, "shares_outstanding": shares}, missing)

    reg = get("dividends_per_share_regular", period)
    spec = get("dividends_per_share_special", period)
    if reg is not None:
        total = reg["value"] + (spec["value"] if spec else 0)
        note = None
        if spec:
            note = f"regular {reg['value']} ({reg['unit']}) + special {spec['value']} ({spec['unit']})"
        m["dividends_per_share_total"] = computed(round(total, 2), "dividends_per_share_regular + dividends_per_share_special",
                                                   {"dividends_per_share_regular": reg["value"],
                                                    "dividends_per_share_special": spec["value"] if spec else 0},
                                                   note=note)
    else:
        m["dividends_per_share_total"] = null_metric("dividends_per_share_regular + dividends_per_share_special",
                                                      {"dividends_per_share_regular": None,
                                                       "dividends_per_share_special": spec["value"] if spec else None},
                                                      "dividends_per_share_regular")

    if cm_val is not None and acq is not None:
        cash_after_acq = cm_val - acq
        m["cash_after_acquisitions"] = computed(round(cash_after_acq, 2), f"{cm_label} - acquisitions_cash_spent",
                                                 {cm_label: cm_val, "acquisitions_cash_spent": acq},
                                                 note=f"cash proxy used: {cm_label}, USD millions")
    else:
        missing = "fcfa2s or adjusted_net_income" if cm_val is None else "acquisitions_cash_spent"
        cash_after_acq = None
        m["cash_after_acquisitions"] = null_metric("(fcfa2s_or_adjusted_net_income) - acquisitions_cash_spent",
                                                    {"cash_metric": cm_val, "acquisitions_cash_spent": acq}, missing)

    # cash after acquisitions and dividends: needs dividends in USD millions aggregate,
    # which requires dividends_per_share currency to be USD (never convert currency) and
    # shares_outstanding to exist.
    div_total_entry = m["dividends_per_share_total"]
    reg_unit = reg["unit"] if reg else None
    is_usd_div = bool(reg_unit) and "USD" in reg_unit and "CAD" not in reg_unit
    if cash_after_acq is not None and div_total_entry["value"] is not None and shares and is_usd_div:
        div_dollars = div_total_entry["value"] * shares
        cash_after_both = cash_after_acq - div_dollars
        m["cash_after_acquisitions_and_dividends"] = computed(
            round(cash_after_both, 2),
            f"{cm_label} - acquisitions_cash_spent - (dividends_per_share_total * shares_outstanding)",
            {cm_label: cm_val, "acquisitions_cash_spent": acq,
             "dividends_per_share_total": div_total_entry["value"], "shares_outstanding": shares},
            note=f"cash proxy used: {cm_label}, USD millions"
        )
    else:
        reasons = []
        if cash_after_acq is None:
            reasons.append("cash_after_acquisitions")
        if div_total_entry["value"] is None:
            reasons.append("dividends_per_share_total")
        if not shares:
            reasons.append("shares_outstanding")
        if reg and not is_usd_div:
            reasons.append("dividends_per_share currency is not USD (never convert currency)")
        m["cash_after_acquisitions_and_dividends"] = null_metric(
            "(fcfa2s_or_adjusted_net_income) - acquisitions_cash_spent - (dividends_per_share_total * shares_outstanding)",
            {"cash_after_acquisitions": cash_after_acq, "dividends_per_share_total": div_total_entry["value"],
             "shares_outstanding": shares},
            " and ".join(reasons) if reasons else "unknown")

    annual[period] = m

# ============================================================ 2. eras
ERA_DEFS = []
for era in BRIEF["eras"]:
    years_str = era["years"]  # e.g. "2006 to 2011"
    parts = years_str.replace(" to ", "-").split("-")
    start_y, end_y = int(parts[0]), int(parts[1])
    # Ledger coverage starts FY2007
    start_y = max(start_y, 2007)
    ERA_DEFS.append({"name": era["name"], "start": start_y, "end": end_y})

ERA_DEFS.append({"name": "Full window", "start": 2007, "end": 2025})


def cagr(start_val, end_val, n_years):
    if start_val is None or end_val is None or n_years <= 0 or start_val <= 0:
        return None
    return (end_val / start_val) ** (1 / n_years) - 1


def era_years(start, end):
    return [f"FY{y}" for y in range(start, end + 1) if f"FY{y}" in YEARS]


eras_out = {}
for era in ERA_DEFS:
    start_p, end_p = f"FY{era['start']}", f"FY{era['end']}"
    n = era["end"] - era["start"]
    yrs = era_years(era["start"], era["end"])
    e = {"years": f"{start_p} to {end_p}", "n_years": n}

    # Revenue CAGR
    r0, r1 = val("revenue", start_p), val("revenue", end_p)
    if r0 and r1 and n > 0:
        e["revenue_cagr_pct"] = computed(round(cagr(r0, r1, n) * 100, 2),
                                          "(revenue[end]/revenue[start])^(1/n_years) - 1",
                                          {"revenue[start]": r0, "revenue[end]": r1, "n_years": n})
    else:
        e["revenue_cagr_pct"] = null_metric("(revenue[end]/revenue[start])^(1/n_years) - 1",
                                             {"revenue[start]": r0, "revenue[end]": r1, "n_years": n},
                                             "revenue at era start or end year")

    # CFO CAGR
    c0, c1 = val("cash_from_operations", start_p), val("cash_from_operations", end_p)
    if c0 and c1 and n > 0:
        e["cfo_cagr_pct"] = computed(round(cagr(c0, c1, n) * 100, 2),
                                      "(cfo[end]/cfo[start])^(1/n_years) - 1",
                                      {"cfo[start]": c0, "cfo[end]": c1, "n_years": n})
    else:
        e["cfo_cagr_pct"] = null_metric("(cfo[end]/cfo[start])^(1/n_years) - 1",
                                         {"cfo[start]": c0, "cfo[end]": c1, "n_years": n},
                                         "cash_from_operations at era start or end year")

    # Cash metric (FCFA2S or adj NI) CAGR -- only if same label at both ends
    cm0, lab0, _ = cash_metric(start_p)
    cm1, lab1, _ = cash_metric(end_p)
    if cm0 and cm1 and n > 0 and lab0 == lab1:
        e["cash_metric_cagr_pct"] = computed(round(cagr(cm0, cm1, n) * 100, 2),
                                              f"({lab0}[end]/{lab0}[start])^(1/n_years) - 1",
                                              {f"{lab0}[start]": cm0, f"{lab0}[end]": cm1, "n_years": n},
                                              note=f"basis: {lab0}")
    elif cm0 and cm1 and lab0 != lab1:
        e["cash_metric_cagr_pct"] = null_metric("(cash_metric[end]/cash_metric[start])^(1/n_years) - 1",
                                                 {f"start ({lab0})": cm0, f"end ({lab1})": cm1},
                                                 f"start and end years use different cash-metric definitions ({lab0} vs {lab1}), not a valid CAGR basis")
    else:
        e["cash_metric_cagr_pct"] = null_metric("(cash_metric[end]/cash_metric[start])^(1/n_years) - 1",
                                                 {"start": cm0, "end": cm1},
                                                 "fcfa2s or adjusted_net_income at era start or end year")

    # Per-share CAGRs (revenue, CFO, cash metric) -- need shares at both ends
    s0, s1 = val("shares_outstanding", start_p), val("shares_outstanding", end_p)
    for key, label, v0, v1 in [("revenue_per_share_cagr_pct", "revenue", r0, r1),
                                ("cfo_per_share_cagr_pct", "cfo", c0, c1),
                                ("cash_metric_per_share_cagr_pct", "cash_metric", cm0, cm1)]:
        if v0 and v1 and s0 and s1 and n > 0:
            ps0, ps1 = v0 / s0, v1 / s1
            e[key] = computed(round((cagr(ps0, ps1, n) or 0) * 100, 2),
                               f"({label}_per_share[end]/{label}_per_share[start])^(1/n_years) - 1",
                               {f"{label}[start]": v0, f"{label}[end]": v1,
                                "shares_outstanding[start]": s0, "shares_outstanding[end]": s1, "n_years": n})
        else:
            missing = []
            if not v0 or not v1:
                missing.append(label)
            if not s0 or not s1:
                missing.append("shares_outstanding at era start and/or end")
            e[key] = null_metric(f"({label}_per_share[end]/{label}_per_share[start])^(1/n_years) - 1",
                                  {f"{label}[start]": v0, f"{label}[end]": v1,
                                   "shares_outstanding[start]": s0, "shares_outstanding[end]": s1},
                                  " and ".join(missing) if missing else "unknown")

    # Average organic growth
    og_vals = [val("organic_growth_pct", p) for p in yrs if val("organic_growth_pct", p) is not None]
    if og_vals:
        e["avg_organic_growth_pct"] = computed(round(sum(og_vals) / len(og_vals), 2),
                                                "mean(organic_growth_pct for years with data in era)",
                                                {"years_used": len(og_vals), "years_in_era": len(yrs)},
                                                note=None if len(og_vals) == len(yrs) else f"only {len(og_vals)} of {len(yrs)} era years had organic_growth_pct")
    else:
        e["avg_organic_growth_pct"] = null_metric("mean(organic_growth_pct for years with data in era)", {}, "organic_growth_pct for any year in era")

    # Average acquisitions to CFO (from annual results)
    a2c_vals = [annual[p]["acquisitions_to_cfo_pct"]["value"] for p in yrs if annual[p]["acquisitions_to_cfo_pct"]["value"] is not None]
    if a2c_vals:
        e["avg_acquisitions_to_cfo_pct"] = computed(round(sum(a2c_vals) / len(a2c_vals), 2),
                                                      "mean(acquisitions_to_cfo_pct for years with data in era)",
                                                      {"years_used": len(a2c_vals), "years_in_era": len(yrs)})
    else:
        e["avg_acquisitions_to_cfo_pct"] = null_metric("mean(acquisitions_to_cfo_pct for years with data in era)", {}, "acquisitions_to_cfo_pct for any year in era")

    # Total acquisitions spent
    acq_vals = [val("acquisitions_cash_spent", p) for p in yrs]
    acq_found = [a for a in acq_vals if a is not None]
    if acq_found:
        e["total_acquisitions_spent"] = computed(round(sum(acq_found), 2),
                                                   "sum(acquisitions_cash_spent for years with data in era)",
                                                   {"years_used": len(acq_found), "years_in_era": len(yrs)},
                                                   note=None if len(acq_found) == len(yrs) else f"partial sum: only {len(acq_found)} of {len(yrs)} era years had acquisitions_cash_spent")
    else:
        e["total_acquisitions_spent"] = null_metric("sum(acquisitions_cash_spent for years with data in era)", {}, "acquisitions_cash_spent for any year in era")

    # Total dividends paid per share
    div_vals = [annual[p]["dividends_per_share_total"]["value"] for p in yrs]
    div_found = [d for d in div_vals if d is not None]
    if div_found:
        e["total_dividends_per_share"] = computed(round(sum(div_found), 2),
                                                     "sum(dividends_per_share_total for years with data in era)",
                                                     {"years_used": len(div_found), "years_in_era": len(yrs)},
                                                     note=(None if len(div_found) == len(yrs)
                                                           else f"partial sum: only {len(div_found)} of {len(yrs)} era years had a dividend figure; currencies are not converted across years (some early years are CAD, later years USD)"))
    else:
        e["total_dividends_per_share"] = null_metric("sum(dividends_per_share_total for years with data in era)", {}, "dividends_per_share_total for any year in era")

    # Share price CAGR in CAD -- year end prices are gap for every year (known issue 9)
    e["share_price_cagr_cad_pct"] = null_metric("(share_price_cad_year_end[end]/share_price_cad_year_end[start])^(1/n_years) - 1",
                                                 {}, "share_price_cad_year_end is gap for every fiscal year (known issue 9); no era-boundary year-end prices exist")

    eras_out[era["name"]] = e

# ============================================================ 3. ipo_targets
rev_ps_2006 = None  # no FY2006 revenue or shares_outstanding in ledger
rev_ps_2010 = None
ebita_ps_2006 = None
ebita_ps_2010 = None
ipo_targets = {
    "target_pct": 20,
    "target_period": "FY2006 to FY2010 (per IPO objective)",
    "revenue_per_share_cagr_pct": null_metric(
        "(revenue_per_share[FY2010]/revenue_per_share[FY2006])^(1/4) - 1", {},
        "revenue and shares_outstanding for FY2006 are not in the ledger (ledger begins FY2007; shares_outstanding is gap for FY2006-FY2010)"),
    "adjusted_ebita_per_share_cagr_pct": null_metric(
        "(adjusted_ebita_per_share[FY2010]/adjusted_ebita_per_share[FY2006])^(1/4) - 1", {},
        "adjusted_ebita for FY2006 is not in the ledger (ledger's earliest adjusted_ebita figure is FY2009) and shares_outstanding is gap for FY2006-FY2010"),
    "met_target": None,
    "note": "Both CAGRs are null for lack of FY2006 revenue/EBITDA-per-share and shares_outstanding data; the target comparison cannot be computed. Third-party commentary (recorded as an event in history_ledger.json) claims the target was exceeded, but this project found no primary-source confirmation.",
}

# ============================================================ 4. reinvestment
reinvestment = {}
for period in YEARS:
    acq = val("acquisitions_cash_spent", period)
    cm_val, cm_label, _ = cash_metric(period)
    roic = val("roic_pct", period)
    r = {}
    if acq is not None and cm_val:
        rate = acq / cm_val
        r["reinvestment_rate_pct"] = computed(round(rate * 100, 2), f"acquisitions_cash_spent / {cm_label} * 100",
                                               {"acquisitions_cash_spent": acq, cm_label: cm_val},
                                               note=f"cash proxy used: {cm_label}")
    else:
        missing = "acquisitions_cash_spent" if acq is None else "fcfa2s or adjusted_net_income"
        rate = None
        r["reinvestment_rate_pct"] = null_metric("acquisitions_cash_spent / (fcfa2s_or_adjusted_net_income) * 100",
                                                  {"acquisitions_cash_spent": acq, "cash_metric": cm_val}, missing)

    if rate is not None and roic is not None:
        implied = rate * roic
        r["implied_per_share_growth_pct"] = computed(round(implied, 2), "reinvestment_rate * roic_pct",
                                                       {"reinvestment_rate": round(rate, 4), "roic_pct": roic},
                                                       note="identity from the long-term-hold report: per-share growth ~= reinvestment rate x ROIC")
    else:
        missing = "reinvestment_rate (acquisitions_cash_spent or cash metric)" if rate is None else "roic_pct"
        r["implied_per_share_growth_pct"] = null_metric("reinvestment_rate * roic_pct",
                                                          {"reinvestment_rate": rate, "roic_pct": roic}, missing)
    reinvestment[period] = r

# ============================================================ 5. tsr
IPO_PRICE = LEDGER["share_price_cad_year_end"]["IPO 2006-05-17"]["value"]
IPO_DATE = datetime.date(2006, 5, 17)
END_PRICE = 2827.94  # ../ledger.json share_price_cad["2026-09-11"], read-only reuse
END_DATE = datetime.date(2026, 9, 11)
days = (END_DATE - IPO_DATE).days
frac_years = days / 365.25

price_cagr = (END_PRICE / IPO_PRICE) ** (1 / frac_years) - 1

tsr = {
    "ipo_to_2026_price_cagr_cad_pct": computed(
        round(price_cagr * 100, 3),
        "(share_price_cad[2026-09-11] / ipo_price_cad[2006-05-17])^(1/fractional_years) - 1",
        {"ipo_price_cad": IPO_PRICE, "ipo_date": str(IPO_DATE), "end_price_cad": END_PRICE,
         "end_date": str(END_DATE), "days_elapsed": days, "fractional_years": round(frac_years, 4)},
        note="Reads ../ledger.json share_price_cad['2026-09-11'] (read only). Price-only CAGR; no dividends reinvested, since a per-year CAD price series to hold dividends against does not exist (known issue 9)."
    ),
    "aggregate_third_party_returns": {
        "total_return_10yr_pct": {
            "value": LEDGER["aggregate_returns"]["total_return_10yr_pct"]["value"],
            "unit": LEDGER["aggregate_returns"]["total_return_10yr_pct"]["unit"],
            "source_url": LEDGER["aggregate_returns"]["total_return_10yr_pct"]["source_url"],
            "confidence": LEDGER["aggregate_returns"]["total_return_10yr_pct"]["confidence"],
        },
        "total_return_15yr_pct": {
            "value": LEDGER["aggregate_returns"]["total_return_15yr_pct"]["value"],
            "unit": LEDGER["aggregate_returns"]["total_return_15yr_pct"]["unit"],
            "source_url": LEDGER["aggregate_returns"]["total_return_15yr_pct"]["source_url"],
            "confidence": LEDGER["aggregate_returns"]["total_return_15yr_pct"]["confidence"],
        },
        "annualized_return_10yr_pct": {
            "value": LEDGER["aggregate_returns"]["annualized_return_10yr_pct"]["value"],
            "unit": LEDGER["aggregate_returns"]["annualized_return_10yr_pct"]["unit"],
            "source_url": LEDGER["aggregate_returns"]["annualized_return_10yr_pct"]["source_url"],
            "confidence": LEDGER["aggregate_returns"]["annualized_return_10yr_pct"]["confidence"],
        },
    },
    "note": "Per the Stage 2/3 spec addendum: year end CAD share prices are gap for every fiscal year (known issue 9), so only two things are computed here -- (a) the CAD price CAGR from the IPO price to the 2026-09-11 close, with exact fractional years, and (b) a restatement of the third-party aggregate return figures with their sources. Every other year-by-year TSR figure (e.g. FYxxxx-to-FY2025 total return) is null below.",
}
for period in YEARS:
    tsr[f"{period}_to_FY2025_total_return_cad_pct"] = null_metric(
        "(share_price_cad_year_end[FY2025] + dividends_held_as_cash) / share_price_cad_year_end[period] - 1",
        {}, "share_price_cad_year_end is gap for every fiscal year (known issue 9); labelled null per the Stage 3 tsr instruction")

# ============================================================ 6. spot_checks
spot_checks = []

# Check 1: FY2010 revenue growth
r09, r10 = val("revenue", "FY2009"), val("revenue", "FY2010")
computed_growth = (r10 - r09) / r09 * 100
stated_growth = val("revenue_growth_pct", "FY2010")
ok1 = abs(computed_growth - stated_growth) <= 1.0
spot_checks.append({
    "check": "FY2010 revenue growth vs FY2009",
    "formula": "(revenue[FY2010] - revenue[FY2009]) / revenue[FY2009] * 100",
    "inputs": {"revenue[FY2010]": r10, "revenue[FY2009]": r09},
    "computed": round(computed_growth, 2),
    "stated": stated_growth,
    "tolerance": "within 1 percentage point",
    "passed": ok1,
})
assert ok1, "Spot check 1 failed"

# Check 2: FY2023 diluted_eps * shares_outstanding vs net_income_attributable
eps23 = val("diluted_eps", "FY2023")
sh23 = val("shares_outstanding", "FY2023")
ni23 = val("net_income_attributable", "FY2023")
implied23 = eps23 * sh23
diff23 = abs(implied23 - ni23) / ni23 * 100
ok2 = diff23 <= 3.0
spot_checks.append({
    "check": "FY2023 diluted_eps x shares_outstanding vs net_income_attributable",
    "formula": "diluted_eps * shares_outstanding",
    "inputs": {"diluted_eps": eps23, "shares_outstanding": sh23, "net_income_attributable": ni23},
    "computed": round(implied23, 2),
    "stated": ni23,
    "diff_pct": round(diff23, 2),
    "tolerance": "within 3 percent",
    "passed": ok2,
})
assert ok2, "Spot check 2 failed"

# Check 3: FY2013 adjusted EBITA margin, hand-recomputed against the script's own annual output
aebita13 = val("adjusted_ebita", "FY2013")
rev13 = val("revenue", "FY2013")
hand_margin = round(aebita13 / rev13 * 100, 2)
script_margin = annual["FY2013"]["adjusted_ebita_margin_pct"]["value"]
ok3 = hand_margin == script_margin
spot_checks.append({
    "check": "FY2013 adjusted EBITA margin, hand recompute vs script output",
    "formula": "adjusted_ebita / revenue * 100",
    "inputs": {"adjusted_ebita": aebita13, "revenue": rev13},
    "computed": hand_margin,
    "stated": script_margin,
    "tolerance": "exact match",
    "passed": ok3,
})
assert ok3, "Spot check 3 failed"

# ============================================================ coverage_summary
CORE_METRICS = ["revenue", "net_income_attributable", "cash_from_operations", "acquisitions_cash_spent", "organic_growth_pct"]
coverage_summary = {}
for period in YEARS:
    count = 0
    present = []
    for metric in CORE_METRICS:
        if val(metric, period) is not None:
            count += 1
            present.append(metric)
    cm_val, cm_label, _ = cash_metric(period)
    if cm_val is not None:
        count += 1
        present.append(f"cash_metric ({cm_label})")
    coverage_summary[period] = {"core_metrics_present": count, "out_of": 6, "present": present}

# ============================================================ assemble & write JSON
history_metrics = {
    "company": "Constellation Software Inc.",
    "generated_from": "history_ledger.json",
    "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
    "annual": annual,
    "eras": eras_out,
    "ipo_targets": ipo_targets,
    "reinvestment": reinvestment,
    "tsr": tsr,
    "spot_checks": spot_checks,
    "coverage_summary": coverage_summary,
}

with open(f"{BASE}/history_metrics.json", "w") as f:
    json.dump(history_metrics, f, indent=2)

# ============================================================ xlsx
wb = Workbook()
bold = Font(bold=True)


def write_table(ws, headers, rows, start_row=1):
    for c, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=c, value=h)
        cell.font = bold
    for r, row in enumerate(rows, start_row + 1):
        for c, v in enumerate(row, 1):
            ws.cell(row=r, column=c, value=v)
    for c in range(1, len(headers) + 1):
        ws.column_dimensions[get_column_letter(c)].width = 22


ws1 = wb.active
ws1.title = "Annual"
annual_metrics_order = ["revenue_growth_pct", "adjusted_ebita_margin_pct", "net_margin_pct", "cfo_margin_pct",
                         "cash_metric_margin_pct", "cash_conversion_ratio", "acquisitions_to_cfo_pct",
                         "acquisitions_to_cash_metric_pct", "per_share_revenue", "per_share_cfo",
                         "per_share_cash_metric", "dividends_per_share_total", "cash_after_acquisitions",
                         "cash_after_acquisitions_and_dividends"]
headers = ["Fiscal Year"] + annual_metrics_order
rows = []
for period in YEARS:
    row = [period]
    for metric in annual_metrics_order:
        row.append(annual[period][metric]["value"])
    rows.append(row)
write_table(ws1, headers, rows)

ws2 = wb.create_sheet("Ledger Raw")
led_headers = ["Metric", "Period", "Value", "Unit", "Confidence", "Source URL", "Note"]
led_rows = []
for metric, periods in LEDGER.items():
    for period, entry in periods.items():
        led_rows.append([metric, period, entry.get("value"), entry.get("unit"), entry.get("confidence"),
                          entry.get("source_url"), entry.get("note", "")])
write_table(ws2, led_headers, led_rows)

ws3 = wb.create_sheet("Eras")
era_metric_keys = ["revenue_cagr_pct", "cfo_cagr_pct", "cash_metric_cagr_pct", "revenue_per_share_cagr_pct",
                    "cfo_per_share_cagr_pct", "cash_metric_per_share_cagr_pct", "avg_organic_growth_pct",
                    "avg_acquisitions_to_cfo_pct", "total_acquisitions_spent", "total_dividends_per_share",
                    "share_price_cagr_cad_pct"]
headers3 = ["Era", "Years"] + era_metric_keys
rows3 = []
for name, e in eras_out.items():
    row = [name, e["years"]]
    for k in era_metric_keys:
        row.append(e[k]["value"])
    rows3.append(row)
write_table(ws3, headers3, rows3)

ws4 = wb.create_sheet("IPO Targets")
write_table(ws4, ["Metric", "Value", "Note"], [
    ["Target", f"{ipo_targets['target_pct']}% per year, {ipo_targets['target_period']}", ""],
    ["Revenue per share CAGR", ipo_targets["revenue_per_share_cagr_pct"]["value"], ipo_targets["revenue_per_share_cagr_pct"]["note"]],
    ["Adjusted EBITA per share CAGR", ipo_targets["adjusted_ebita_per_share_cagr_pct"]["value"], ipo_targets["adjusted_ebita_per_share_cagr_pct"]["note"]],
    ["Met target?", ipo_targets["met_target"], ipo_targets["note"]],
])

ws5 = wb.create_sheet("Reinvestment")
headers5 = ["Fiscal Year", "reinvestment_rate_pct", "implied_per_share_growth_pct"]
rows5 = []
for period in YEARS:
    rows5.append([period, reinvestment[period]["reinvestment_rate_pct"]["value"],
                  reinvestment[period]["implied_per_share_growth_pct"]["value"]])
write_table(ws5, headers5, rows5)

ws6 = wb.create_sheet("TSR")
write_table(ws6, ["Metric", "Value", "Note"], [
    ["IPO (2006-05-17) to 2026-09-11 price CAGR, CAD, %", tsr["ipo_to_2026_price_cagr_cad_pct"]["value"], tsr["ipo_to_2026_price_cagr_cad_pct"]["note"]],
    ["Fractional years used", tsr["ipo_to_2026_price_cagr_cad_pct"]["inputs"]["fractional_years"], ""],
    ["Aggregate 10yr total return, %, third party", tsr["aggregate_third_party_returns"]["total_return_10yr_pct"]["value"], tsr["aggregate_third_party_returns"]["total_return_10yr_pct"]["source_url"]],
    ["Aggregate 15yr total return, %, third party", tsr["aggregate_third_party_returns"]["total_return_15yr_pct"]["value"], tsr["aggregate_third_party_returns"]["total_return_15yr_pct"]["source_url"]],
    ["Aggregate 10yr annualized return, %, third party", tsr["aggregate_third_party_returns"]["annualized_return_10yr_pct"]["value"], tsr["aggregate_third_party_returns"]["annualized_return_10yr_pct"]["source_url"]],
    ["All other year-by-year TSR figures", "null", "share_price_cad_year_end is gap for every fiscal year (known issue 9)"],
])

ws7 = wb.create_sheet("Spot Checks")
write_table(ws7, ["Check", "Computed", "Stated", "Passed"],
            [[sc["check"], sc["computed"], sc["stated"], sc["passed"]] for sc in spot_checks])

ws8 = wb.create_sheet("Coverage Summary")
write_table(ws8, ["Fiscal Year", "Core metrics present", "Out of", "Present metrics"],
            [[p, coverage_summary[p]["core_metrics_present"], 6, ", ".join(coverage_summary[p]["present"])] for p in YEARS])

ws9 = wb.create_sheet("Ledger Coverage")
write_table(ws9, ["Metric", "Years found", "Company sourced", "Third party"],
            [[m, c["years_found"], c["company_sourced"], c["third_party"]] for m, c in HL["coverage"].items()])

ws10 = wb.create_sheet("Conflicts")
write_table(ws10, ["Metric", "Period", "Values", "Sources", "Resolution"],
            [[c["metric"], c["period"], str(c["values"]), str(c["sources"]), c["resolution"]] for c in HL["conflicts"]])

wb.save(f"{BASE}/history_metrics.xlsx")

print("Wrote history_metrics.json and history_metrics.xlsx")
print("\nSpot checks:")
for sc in spot_checks:
    print(" ", sc["check"], "->", "PASS" if sc["passed"] else "FAIL")

null_count = 0
for period in YEARS:
    for metric, d in annual[period].items():
        if d["value"] is None:
            null_count += 1
for name, e in eras_out.items():
    for k in era_metric_keys:
        if e[k]["value"] is None:
            null_count += 1
for period in YEARS:
    for metric, d in reinvestment[period].items():
        if d["value"] is None:
            null_count += 1
if ipo_targets["revenue_per_share_cagr_pct"]["value"] is None:
    null_count += 1
if ipo_targets["adjusted_ebita_per_share_cagr_pct"]["value"] is None:
    null_count += 1
for k, d in tsr.items():
    if isinstance(d, dict) and "value" in d and d["value"] is None:
        null_count += 1

print("\nApproximate null-metric count (annual+eras+reinvestment+ipo_targets+tsr):", null_count)

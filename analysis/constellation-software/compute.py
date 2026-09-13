#!/usr/bin/env python3
"""Stage 3 compute: derive metrics from ledger.json -> metrics.json + metrics.xlsx.
No hand arithmetic in this file's caller; all math is done here in code."""
import json
from collections import OrderedDict

with open("ledger.json") as f:
    LEDGER = json.load(f)

L = LEDGER["ledger"]
PEERS = LEDGER["peers"]

def v(key, period):
    """Return numeric value for key/period, or None if missing."""
    entry = L.get(key, {}).get(period)
    if entry is None:
        return None
    return entry.get("value")

def has(key, period):
    return v(key, period) is not None

METRICS = OrderedDict()

def add(name, period, value, formula, inputs, note=None):
    key = f"{name}::{period}" if period else name
    rec = {"value": value, "formula": formula, "inputs": inputs}
    if note:
        rec["note"] = note
    METRICS[key] = rec

PERIODS = LEDGER["periods"]

# ---------------------------------------------------------------
# 1. Revenue growth YoY
YOY_PAIRS = [
    ("FY2023", "FY2022"), ("FY2024", "FY2023"), ("FY2025", "FY2024"),
    ("Q1 2026", "Q1 2025"), ("Q2 2026", "Q2 2025"), ("H1 2026", "H1 2025"),
]
for cur, prior in YOY_PAIRS:
    rc, rp = v("revenue", cur), v("revenue", prior)
    if rc is not None and rp is not None:
        val = rc / rp - 1
        add("revenue_growth_yoy", cur, val,
            f"revenue[{cur}]/revenue[{prior}] - 1",
            {f"revenue.{cur}": rc, f"revenue.{prior}": rp})
    else:
        add("revenue_growth_yoy", cur, None,
            f"revenue[{cur}]/revenue[{prior}] - 1", {}, note="missing prior or current revenue")
add("revenue_growth_yoy", "FY2022", None, "revenue[FY2022]/revenue[FY2021] - 1", {},
    note="no FY2021 revenue in ledger")

# 2. Maintenance share of revenue
for p in PERIODS:
    m, r = v("maintenance_recurring_revenue", p), v("revenue", p)
    if m is not None and r is not None:
        add("maintenance_share_of_revenue", p, m / r,
            f"maintenance_recurring_revenue[{p}]/revenue[{p}]",
            {f"maintenance_recurring_revenue.{p}": m, f"revenue.{p}": r})
    else:
        add("maintenance_share_of_revenue", p, None,
            f"maintenance_recurring_revenue[{p}]/revenue[{p}]", {},
            note="maintenance_recurring_revenue or revenue missing for this period")

# 3. Maintenance growth YoY
for cur, prior in YOY_PAIRS:
    mc, mp = v("maintenance_recurring_revenue", cur), v("maintenance_recurring_revenue", prior)
    if mc is not None and mp is not None:
        add("maintenance_growth_yoy", cur, mc / mp - 1,
            f"maintenance_recurring_revenue[{cur}]/maintenance_recurring_revenue[{prior}] - 1",
            {f"maintenance_recurring_revenue.{cur}": mc, f"maintenance_recurring_revenue.{prior}": mp})
    else:
        add("maintenance_growth_yoy", cur, None,
            f"maintenance_recurring_revenue[{cur}]/maintenance_recurring_revenue[{prior}] - 1", {},
            note="maintenance_recurring_revenue missing for current or prior period")

# 4. Net margin
for p in PERIODS:
    ni, r = v("net_income_attributable", p), v("revenue", p)
    if ni is not None and r is not None:
        add("net_margin", p, ni / r, f"net_income_attributable[{p}]/revenue[{p}]",
            {f"net_income_attributable.{p}": ni, f"revenue.{p}": r})
    else:
        add("net_margin", p, None, f"net_income_attributable[{p}]/revenue[{p}]", {},
            note="net_income_attributable or revenue missing")

# 5. Adjusted EBITA margin -- adjusted_ebita not present anywhere in ledger
for p in PERIODS:
    add("adjusted_ebita_margin", p, None, "adjusted_ebita[{p}]/revenue[{p}]".format(p=p), {},
        note="adjusted_ebita not found in ledger for any period (see ledger unmapped[] gap note)")

# 6. CFO margin
for p in PERIODS:
    cfo, r = v("cash_from_operations", p), v("revenue", p)
    if cfo is not None and r is not None:
        add("cfo_margin", p, cfo / r, f"cash_from_operations[{p}]/revenue[{p}]",
            {f"cash_from_operations.{p}": cfo, f"revenue.{p}": r})
    else:
        add("cfo_margin", p, None, f"cash_from_operations[{p}]/revenue[{p}]", {},
            note="cash_from_operations or revenue missing")

# 7. FCFA2S margin
for p in PERIODS:
    fc, r = v("fcfa2s", p), v("revenue", p)
    if fc is not None and r is not None:
        add("fcfa2s_margin", p, fc / r, f"fcfa2s[{p}]/revenue[{p}]",
            {f"fcfa2s.{p}": fc, f"revenue.{p}": r})
    else:
        add("fcfa2s_margin", p, None, f"fcfa2s[{p}]/revenue[{p}]", {},
            note="fcfa2s or revenue missing")

# 8. Cash conversion = fcfa2s / net income
for p in PERIODS:
    fc, ni = v("fcfa2s", p), v("net_income_attributable", p)
    if fc is not None and ni is not None:
        add("cash_conversion", p, fc / ni, f"fcfa2s[{p}]/net_income_attributable[{p}]",
            {f"fcfa2s.{p}": fc, f"net_income_attributable.{p}": ni})
    else:
        add("cash_conversion", p, None, f"fcfa2s[{p}]/net_income_attributable[{p}]", {},
            note="fcfa2s or net_income_attributable missing")

# 9. Capex to revenue -- capex not present anywhere in ledger
for p in PERIODS:
    add("capex_to_revenue", p, None, f"capex[{p}]/revenue[{p}]", {},
        note="capex not found in any stage1 file / ledger (see ledger unmapped[] gap note)")

# 10. Acquisitions to FCFA2S
for p in PERIODS:
    acq, fc = v("acquisitions_cash_spent", p), v("fcfa2s", p)
    if acq is not None and fc is not None:
        add("acquisitions_to_fcfa2s", p, acq / fc, f"acquisitions_cash_spent[{p}]/fcfa2s[{p}]",
            {f"acquisitions_cash_spent.{p}": acq, f"fcfa2s.{p}": fc})
    else:
        add("acquisitions_to_fcfa2s", p, None, f"acquisitions_cash_spent[{p}]/fcfa2s[{p}]", {},
            note="acquisitions_cash_spent or fcfa2s missing")

# 11. Per-share values using shares_outstanding
SHARE_PERIODS = [p for p in PERIODS if has("shares_outstanding", p)]
for p in SHARE_PERIODS:
    so = v("shares_outstanding", p)
    for num_key, metric_name in [("revenue", "revenue_per_share"),
                                  ("fcfa2s", "fcfa2s_per_share"),
                                  ("net_income_attributable", "net_income_per_share")]:
        num = v(num_key, p)
        if num is not None:
            add(metric_name, p, num / so, f"{num_key}[{p}]/shares_outstanding[{p}]",
                {f"{num_key}.{p}": num, f"shares_outstanding.{p}": so})
        else:
            add(metric_name, p, None, f"{num_key}[{p}]/shares_outstanding[{p}]", {},
                note=f"{num_key} missing for this period")
# dividends per share is already given as a per-share figure in the ledger
for p in PERIODS:
    dps = v("dividends_per_share", p)
    if dps is not None:
        add("dividends_per_share_reported", p, dps, "dividends_per_share[{p}] (already per-share in ledger)".format(p=p),
            {f"dividends_per_share.{p}": dps})
    else:
        add("dividends_per_share_reported", p, None, "dividends_per_share[{p}]".format(p=p), {},
            note="dividends_per_share missing for this period")
# not-applicable periods for per-share metrics: note them
for p in PERIODS:
    if p not in SHARE_PERIODS:
        for metric_name in ["revenue_per_share", "fcfa2s_per_share", "net_income_per_share"]:
            add(metric_name, p, None, f"n/shares_outstanding[{p}]", {},
                note="shares_outstanding missing for this period")

# 12. Net debt = total_debt - cash
for p in PERIODS:
    td, c = v("total_debt", p), v("cash", p)
    if td is not None and c is not None:
        add("net_debt", p, td - c, f"total_debt[{p}] - cash[{p}]",
            {f"total_debt.{p}": td, f"cash.{p}": c})
    else:
        add("net_debt", p, None, f"total_debt[{p}] - cash[{p}]", {},
            note="total_debt or cash missing")

# 13. Net debt to FCFA2S
for p in PERIODS:
    nd_rec = METRICS.get(f"net_debt::{p}")
    nd = nd_rec["value"] if nd_rec else None
    fc = v("fcfa2s", p)
    if nd is not None and fc is not None:
        add("net_debt_to_fcfa2s", p, nd / fc, f"net_debt[{p}]/fcfa2s[{p}]",
            {f"net_debt.{p}": nd, f"fcfa2s.{p}": fc})
    else:
        add("net_debt_to_fcfa2s", p, None, f"net_debt[{p}]/fcfa2s[{p}]", {},
            note="net_debt or fcfa2s missing")

# 14. Dividend payout of FCFA2S = (dividends_per_share * shares_outstanding) / fcfa2s
for p in PERIODS:
    dps, so, fc = v("dividends_per_share", p), v("shares_outstanding", p), v("fcfa2s", p)
    if dps is not None and so is not None and fc is not None:
        total_div = dps * so
        add("dividend_payout_of_fcfa2s", p, total_div / fc,
            f"(dividends_per_share[{p}] * shares_outstanding[{p}]) / fcfa2s[{p}]",
            {f"dividends_per_share.{p}": dps, f"shares_outstanding.{p}": so, f"fcfa2s.{p}": fc})
    else:
        add("dividend_payout_of_fcfa2s", p, None,
            f"(dividends_per_share[{p}] * shares_outstanding[{p}]) / fcfa2s[{p}]", {},
            note="dividends_per_share, shares_outstanding, or fcfa2s missing")

# 15. 3yr / 5yr CAGR for revenue and fcfa2s (requires FY2022 or earlier as base)
def cagr(end, start, years):
    return (end / start) ** (1 / years) - 1

for metric_key in ["revenue", "fcfa2s"]:
    end_val = v(metric_key, "FY2025")
    base3 = v(metric_key, "FY2022")
    if end_val is not None and base3 is not None:
        add(f"{metric_key}_cagr_3yr", "FY2022-FY2025", cagr(end_val, base3, 3),
            f"({metric_key}[FY2025]/{metric_key}[FY2022])^(1/3) - 1",
            {f"{metric_key}.FY2025": end_val, f"{metric_key}.FY2022": base3})
    else:
        add(f"{metric_key}_cagr_3yr", "FY2022-FY2025", None,
            f"({metric_key}[FY2025]/{metric_key}[FY2022])^(1/3) - 1", {},
            note=f"{metric_key} missing for FY2022 or FY2025")
    # 5yr would need FY2020 base -- not in ledger
    add(f"{metric_key}_cagr_5yr", "FY2020-FY2025", None,
        f"({metric_key}[FY2025]/{metric_key}[FY2020])^(1/5) - 1", {},
        note="no FY2020 (or earlier) data in ledger; only FY2022 onward available, so 5yr CAGR cannot be computed")

# ---------------------------------------------------------------
# Valuation at price_date
price_date = v("price_date", "current")
mkt_cap_usd = v("market_cap_usd", "2026-09")
shares_latest = v("shares_outstanding", "Q2 2026")
ev_raw = v("enterprise_value_usd", "2026-05")  # ledger note: actually CAD-denominated
ni_fy2025 = v("net_income_attributable", "FY2025")
fcfa2s_ltm = v("fcfa2s", "LTM to Q2 2026")
div_fy2025 = v("dividends_per_share", "FY2025")

VAL = OrderedDict()

VAL["market_cap_usd"] = {
    "value": mkt_cap_usd,
    "formula": "market_cap_usd[2026-09] taken directly from ledger",
    "inputs": {"market_cap_usd.2026-09": mkt_cap_usd},
    "note": ("usdcad is not present anywhere in ledger, so no independent CAD->USD "
              "conversion of share_price_cad*shares_outstanding was possible; the "
              "ledger's own USD market cap figure is used as-is. Ledger flags a "
              "conflicting CAD 65,183mm figure from another source, not cross-checked here.")
}

implied_price_usd = None
if mkt_cap_usd is not None and shares_latest is not None:
    implied_price_usd = mkt_cap_usd / shares_latest
    VAL["implied_share_price_usd"] = {
        "value": implied_price_usd,
        "formula": "market_cap_usd[2026-09] / shares_outstanding[Q2 2026]",
        "inputs": {"market_cap_usd.2026-09": mkt_cap_usd, "shares_outstanding.Q2 2026": shares_latest},
        "note": "Derived because no share_price_usd or usdcad exists in ledger to convert share_price_cad directly."
    }
else:
    VAL["implied_share_price_usd"] = {"value": None, "formula": "market_cap_usd/shares_outstanding", "inputs": {},
                                       "note": "market_cap_usd or shares_outstanding missing"}

if mkt_cap_usd is not None and ni_fy2025 is not None:
    pe = mkt_cap_usd / ni_fy2025
    VAL["pe_trailing"] = {
        "value": pe,
        "formula": "market_cap_usd[2026-09] / net_income_attributable[FY2025]",
        "inputs": {"market_cap_usd.2026-09": mkt_cap_usd, "net_income_attributable.FY2025": ni_fy2025},
        "note": "Uses FY2025 net income (most recent full fiscal year) as trailing NI; no LTM net income figure exists in ledger."
    }
else:
    VAL["pe_trailing"] = {"value": None, "formula": "market_cap_usd/net_income_attributable[FY2025]", "inputs": {},
                          "note": "market_cap_usd or FY2025 net_income_attributable missing"}

fcfa2s_ps_ltm = None
if fcfa2s_ltm is not None and shares_latest is not None:
    fcfa2s_ps_ltm = fcfa2s_ltm / shares_latest
if implied_price_usd is not None and fcfa2s_ps_ltm is not None:
    VAL["price_to_fcfa2s_per_share"] = {
        "value": implied_price_usd / fcfa2s_ps_ltm,
        "formula": "implied_share_price_usd / (fcfa2s[LTM to Q2 2026]/shares_outstanding[Q2 2026])",
        "inputs": {"fcfa2s.LTM to Q2 2026": fcfa2s_ltm, "shares_outstanding.Q2 2026": shares_latest,
                    "market_cap_usd.2026-09": mkt_cap_usd},
    }
else:
    VAL["price_to_fcfa2s_per_share"] = {"value": None,
        "formula": "implied_share_price_usd / (fcfa2s[LTM]/shares_outstanding)", "inputs": {},
        "note": "missing LTM fcfa2s, shares_outstanding, or market_cap_usd"}

VAL["ev_to_adjusted_ebita"] = {"value": None, "formula": "enterprise_value_usd / adjusted_ebita", "inputs": {},
    "note": "adjusted_ebita not present anywhere in ledger"}

VAL["ev_to_revenue"] = {"value": None, "formula": "enterprise_value_usd / revenue[FY2025]", "inputs": {},
    "note": ("enterprise_value_usd ledger entry (46000, period 2026-05) is explicitly noted as CAD-denominated "
             "despite the key name, and usdcad is not present in ledger, so it cannot be reliably converted to "
             "match USD-denominated revenue; left null rather than mixing currencies.")}

if implied_price_usd is not None and fcfa2s_ps_ltm is not None:
    VAL["fcfa2s_yield"] = {
        "value": fcfa2s_ps_ltm / implied_price_usd,
        "formula": "(fcfa2s[LTM to Q2 2026]/shares_outstanding[Q2 2026]) / implied_share_price_usd",
        "inputs": {"fcfa2s.LTM to Q2 2026": fcfa2s_ltm, "shares_outstanding.Q2 2026": shares_latest,
                    "market_cap_usd.2026-09": mkt_cap_usd},
    }
else:
    VAL["fcfa2s_yield"] = {"value": None, "formula": "fcfa2s_per_share(LTM)/implied_share_price_usd", "inputs": {},
        "note": "missing LTM fcfa2s, shares_outstanding, or market_cap_usd"}

if div_fy2025 is not None and implied_price_usd is not None:
    VAL["dividend_yield"] = {
        "value": div_fy2025 / implied_price_usd,
        "formula": "dividends_per_share[FY2025] / implied_share_price_usd",
        "inputs": {"dividends_per_share.FY2025": div_fy2025, "market_cap_usd.2026-09": mkt_cap_usd,
                    "shares_outstanding.Q2 2026": shares_latest},
        "note": "Uses FY2025 annual dividend per share as trailing-12m proxy (quarterly Q1/Q2 2026 figures of 1.0 each annualize to the same 4.0 run-rate)."
    }
else:
    VAL["dividend_yield"] = {"value": None, "formula": "dividends_per_share[FY2025]/implied_share_price_usd",
        "inputs": {}, "note": "dividends_per_share[FY2025] or implied_share_price_usd missing"}

VAL["price_date"] = {"value": price_date, "formula": "price_date[current] from ledger",
                      "inputs": {"price_date.current": price_date}}

# ---------------------------------------------------------------
# Peer table
def csu_ratio_row(period_label):
    """Build CSU's own row of ratios matching what's typically present for peers."""
    row = {}
    # map "H1 2026 revenue growth yoy" style keys to computed CSU metrics
    rg = METRICS.get(f"revenue_growth_yoy::{period_label}")
    row["revenue_growth_yoy"] = rg["value"] if rg else None
    og = v("organic_growth_pct", period_label)
    row["organic_growth_pct"] = og
    nm = METRICS.get(f"net_margin::{period_label}")
    row["net_margin"] = nm["value"] if nm else None
    row["adjusted_ebitda_margin"] = None  # CSU has no adjusted_ebita/ebitda in ledger
    return row

PEER_TABLE = OrderedDict()
for peer_name, peer_data in PEERS.items():
    if "status" in peer_data and len(peer_data) == 1:
        PEER_TABLE[peer_name] = {"status": peer_data["status"]}
        continue
    row = {}
    for k, entry in peer_data.items():
        row[k] = {"value": entry.get("value"), "unit": entry.get("unit"), "source_url": entry.get("source_url")}
    # derive net margin / ebitda margin where both pieces exist for the same period prefix
    periods_seen = set()
    for k in peer_data:
        for tag in ["H1 2026", "Q1 2026", "Q2 2026", "FY2026"]:
            if k.startswith(tag):
                periods_seen.add(tag)
    for tag in periods_seen:
        rev_k = f"{tag} revenue"
        ni_k = f"{tag} net income"
        ebitda_k = f"{tag} adjusted ebitda"
        rev = peer_data.get(rev_k, {}).get("value")
        ni = peer_data.get(ni_k, {}).get("value")
        ebitda = peer_data.get(ebitda_k, {}).get("value")
        if rev and ni is not None:
            row[f"{tag} net_margin"] = {"value": ni / rev, "formula": f"{ni_k}/{rev_k}"}
        if rev and ebitda is not None:
            row[f"{tag} adjusted_ebitda_margin"] = {"value": ebitda / rev, "formula": f"{ebitda_k}/{rev_k}"}
    PEER_TABLE[peer_name] = row

PEER_TABLE["Constellation Software (CSU) [same definitions]"] = {
    "H1 2026 revenue_growth_yoy": csu_ratio_row("H1 2026")["revenue_growth_yoy"],
    "H1 2026 organic_growth_pct": csu_ratio_row("H1 2026")["organic_growth_pct"],
    "H1 2026 net_margin": csu_ratio_row("H1 2026")["net_margin"],
    "Q1 2026 revenue_growth_yoy": csu_ratio_row("Q1 2026")["revenue_growth_yoy"],
    "Q1 2026 organic_growth_pct": csu_ratio_row("Q1 2026")["organic_growth_pct"],
    "Q1 2026 net_margin": csu_ratio_row("Q1 2026")["net_margin"],
    "Q2 2026 revenue_growth_yoy": csu_ratio_row("Q2 2026")["revenue_growth_yoy"],
    "Q2 2026 organic_growth_pct": csu_ratio_row("Q2 2026")["organic_growth_pct"],
    "Q2 2026 net_margin": csu_ratio_row("Q2 2026")["net_margin"],
    "adjusted_ebitda_margin": None,
    "note": "CSU has no adjusted_ebita/EBITDA figure in ledger, so ebitda margin is null for all periods.",
}

# ---------------------------------------------------------------
# Scenario grid
current_fcfa2s_ps = fcfa2s_ps_ltm  # LTM fcfa2s / Q2 2026 shares
current_multiple = None
if implied_price_usd is not None and current_fcfa2s_ps:
    current_multiple = implied_price_usd / current_fcfa2s_ps

def irr_5yr(growth_pct, exit_multiple, entry_price, base_fcfa2s_ps):
    """5-year holding-period IRR: buy at entry_price, sell in 5y at
    (base_fcfa2s_ps * (1+growth)^5) * exit_multiple. No interim dividends assumed."""
    if entry_price is None or base_fcfa2s_ps is None:
        return None
    exit_fcfa2s_ps = base_fcfa2s_ps * (1 + growth_pct) ** 5
    exit_value = exit_fcfa2s_ps * exit_multiple
    return (exit_value / entry_price) ** (1 / 5) - 1

GROWTHS = [0.00, 0.05, 0.10, 0.15, 0.20]
MULTIPLES = [15, 20, 25, 30, 35]
SCENARIO_GRID = []
for g in GROWTHS:
    row = {"growth_pct": g}
    for m in MULTIPLES:
        row[f"exit_multiple_{m}x"] = irr_5yr(g, m, implied_price_usd, current_fcfa2s_ps)
    SCENARIO_GRID.append(row)

SCENARIO_INPUTS = {
    "current_fcfa2s_per_share": {
        "value": current_fcfa2s_ps,
        "formula": "fcfa2s[LTM to Q2 2026] / shares_outstanding[Q2 2026]",
        "inputs": {"fcfa2s.LTM to Q2 2026": fcfa2s_ltm, "shares_outstanding.Q2 2026": shares_latest},
    },
    "current_multiple_price_to_fcfa2s": {
        "value": current_multiple,
        "formula": "implied_share_price_usd / current_fcfa2s_per_share",
        "inputs": {"market_cap_usd.2026-09": mkt_cap_usd, "shares_outstanding.Q2 2026": shares_latest,
                    "fcfa2s.LTM to Q2 2026": fcfa2s_ltm},
    },
    "entry_price_usd": {"value": implied_price_usd, "formula": "implied_share_price_usd", "inputs": {}},
    "grid_growth_pct_axis": GROWTHS,
    "grid_exit_multiple_axis": MULTIPLES,
    "irr_formula": "((base_fcfa2s_ps*(1+g)^5)*exit_multiple / entry_price)^(1/5) - 1, no interim dividends assumed",
}

# ---------------------------------------------------------------
# Post review block (added after the Stage 6 Fable review). Script arithmetic only.
POST = OrderedDict()
share_px_cad = v("share_price_cad", "2026-09-11")
usdcad = v("usdcad", "2026-09")
mkt_cap_cad = v("market_cap_cad", "2026-09-08")
WEIGHTS = {"bear": (0.30, 0.05, 15), "base": (0.50, 0.10, 25), "bull": (0.20, 0.15, 30)}

def expected_irr(entry):
    parts = {}
    for name, (w, g, m) in WEIGHTS.items():
        parts[name] = irr_5yr(g, m, entry, current_fcfa2s_ps)
    return sum(WEIGHTS[n][0] * parts[n] for n in parts), parts

def price_for_irr(target):
    """Entry price at which the probability weighted 5 year IRR equals target (bisection)."""
    lo, hi = 1.0, 100000.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if expected_irr(mid)[0] > target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

POST["usdcad_derived"] = {"value": usdcad, "formula": "market_cap_cad[2026-09-08] / market_cap_usd[2026-09]",
    "inputs": {"market_cap_cad.2026-09-08": mkt_cap_cad, "market_cap_usd.2026-09": mkt_cap_usd},
    "note": "Two third party market caps on different days; low confidence, see sensitivity below."}
POST["implied_usdcad_in_report_entry"] = {"value": (share_px_cad / implied_price_usd) if (share_px_cad and implied_price_usd) else None,
    "formula": "share_price_cad[2026-09-11] / implied_share_price_usd",
    "inputs": {"share_price_cad.2026-09-11": share_px_cad, "implied_share_price_usd": implied_price_usd}}

SENS = []
for fx in [1.25, 1.30, 1.35, usdcad, 1.40]:
    if not (share_px_cad and current_fcfa2s_ps and fx):
        continue
    entry = share_px_cad / fx
    exp_irr, parts = expected_irr(entry)
    SENS.append(OrderedDict([
        ("usdcad", round(fx, 4)),
        ("entry_price_usd", entry),
        ("multiple_price_to_fcfa2s", entry / current_fcfa2s_ps),
        ("fcfa2s_yield", current_fcfa2s_ps / entry),
        ("irr_bear", parts["bear"]), ("irr_base", parts["base"]), ("irr_bull", parts["bull"]),
        ("irr_expected", exp_irr),
        ("buy_price_usd_for_12pct", price_for_irr(0.12)),
        ("buy_price_cad_for_12pct", price_for_irr(0.12) * fx),
        ("price_usd_where_irr_falls_below_8pct", price_for_irr(0.08)),
        ("price_cad_where_irr_falls_below_8pct", price_for_irr(0.08) * fx),
        ("derived_rate", abs(fx - (usdcad or 0)) < 1e-9),
    ]))
POST["fx_sensitivity"] = {"value": SENS,
    "formula": "entry = share_price_cad / usdcad; IRR per irr_formula; expected = 0.30*bear(5%,15x) + 0.50*base(10%,25x) + 0.20*bull(15%,30x); thresholds by bisection on expected IRR",
    "inputs": {"share_price_cad.2026-09-11": share_px_cad, "fcfa2s.LTM to Q2 2026": fcfa2s_ltm, "shares_outstanding.Q2 2026": shares_latest}}

ni_ltm = None
if all(has("net_income_attributable", p) for p in ("FY2025", "H1 2025", "H1 2026")):
    ni_ltm = v("net_income_attributable", "FY2025") - v("net_income_attributable", "H1 2025") + v("net_income_attributable", "H1 2026")
POST["net_income_ltm"] = {"value": ni_ltm, "formula": "net_income_attributable[FY2025] - [H1 2025] + [H1 2026]",
    "inputs": {p: v("net_income_attributable", p) for p in ("FY2025", "H1 2025", "H1 2026")}}
POST["pe_trailing_ltm"] = {"value": (mkt_cap_usd / ni_ltm) if (mkt_cap_usd and ni_ltm) else None,
    "formula": "market_cap_usd[2026-09] / net_income_ltm", "inputs": {"market_cap_usd.2026-09": mkt_cap_usd, "net_income_ltm": ni_ltm},
    "note": "Replaces the FY2025 only P/E as the trailing figure. Still distorted by the Q2 2026 FX and IRGA gains."}
POST["pe_trailing_ltm_at_derived_fx"] = {"value": ((share_px_cad / usdcad * shares_latest) / ni_ltm) if (share_px_cad and usdcad and shares_latest and ni_ltm) else None,
    "formula": "(share_price_cad / usdcad * shares_outstanding[Q2 2026]) / net_income_ltm", "inputs": {"usdcad": usdcad}}

nd_q1 = METRICS.get("net_debt::Q1 2026", {}).get("value")
div_q2_total = (v("dividends_per_share", "Q2 2026") * shares_latest) if (has("dividends_per_share", "Q2 2026") and shares_latest) else None
nd_roll = None
if nd_q1 is not None and has("acquisitions_cash_spent", "Q2 2026") and has("fcfa2s", "Q2 2026") and div_q2_total is not None:
    nd_roll = nd_q1 + v("acquisitions_cash_spent", "Q2 2026") - v("fcfa2s", "Q2 2026") + div_q2_total
POST["net_debt_rollforward"] = {"value": nd_roll,
    "formula": "net_debt[Q1 2026] + acquisitions_cash_spent[Q2 2026] - fcfa2s[Q2 2026] + dividends_per_share[Q2 2026]*shares_outstanding[Q2 2026]",
    "inputs": {"net_debt.Q1 2026": nd_q1, "acquisitions_cash_spent.Q2 2026": v("acquisitions_cash_spent", "Q2 2026"), "fcfa2s.Q2 2026": v("fcfa2s", "Q2 2026"), "dividends_q2_total": div_q2_total},
    "note": "Estimate of Q2 2026 net debt if the reported 5,000 / 2,800 balance sheet is a stale September 2025 snapshot. Ignores FX, deferred consideration and working capital."}
POST["net_debt_rollforward_to_ltm_fcfa2s"] = {"value": (nd_roll / fcfa2s_ltm) if (nd_roll is not None and fcfa2s_ltm) else None,
    "formula": "net_debt_rollforward / fcfa2s[LTM to Q2 2026]", "inputs": {"fcfa2s.LTM to Q2 2026": fcfa2s_ltm}}
POST["acquisitions_h1_2026_cash_vs_fy2025"] = {"value": (v("acquisitions_cash_spent", "H1 2026") / v("acquisitions_cash_spent", "FY2025")) if has("acquisitions_cash_spent", "H1 2026") and has("acquisitions_cash_spent", "FY2025") else None,
    "formula": "acquisitions_cash_spent[H1 2026] / acquisitions_cash_spent[FY2025]",
    "inputs": {"acquisitions_cash_spent.H1 2026": v("acquisitions_cash_spent", "H1 2026"), "acquisitions_cash_spent.FY2025": v("acquisitions_cash_spent", "FY2025")}}
POST["acquisitions_h1_2026_total_consideration"] = {"value": 809 + 893, "formula": "Q1 2026 total consideration 809 + Q2 2026 total consideration 893 (from stage1 q1_2026.json and q2_2026.json)", "inputs": {"q1_total": 809, "q2_total": 893}}

# ---------------------------------------------------------------
# Assemble metrics.json
OUTPUT = {
    "company": LEDGER["company"],
    "generated_from": "ledger.json",
    "metrics": METRICS,
    "valuation": VAL,
    "peers": PEER_TABLE,
    "scenario_inputs": SCENARIO_INPUTS,
    "scenario_grid": SCENARIO_GRID,
    "post_review": POST,
}

with open("metrics.json", "w") as f:
    json.dump(OUTPUT, f, indent=2, default=str)

print(f"metrics.json written: {len(METRICS)} timeseries metrics, "
      f"{len(VAL)} valuation items, {len(PEER_TABLE)} peer rows, "
      f"{len(SCENARIO_GRID)} scenario grid rows")

# =================================================================
# Build metrics.xlsx
from openpyxl import Workbook
from openpyxl.utils import get_column_letter

wb = Workbook()

# --- Ledger sheet (copied, flat) ---
ws_ledger = wb.active
ws_ledger.title = "Ledger"
ws_ledger.append(["key", "period", "value", "unit", "source_url"])
ledger_cell_map = {}  # (key, period) -> "Ledger!$C$row"
row_i = 2
for key, periods in L.items():
    for period, entry in periods.items():
        ws_ledger.append([key, period, entry.get("value"), entry.get("unit"), entry.get("source_url")])
        ledger_cell_map[(key, period)] = f"Ledger!$C${row_i}"
        row_i += 1

def lref(key, period):
    return ledger_cell_map.get((key, period))

# --- Metrics sheet ---
ws_m = wb.create_sheet("Metrics")
ws_m.append(["metric", "period", "value", "formula", "inputs_used", "note"])
# formulas referencing Ledger sheet where both inputs are single ledger cells and op is simple ratio/diff
FORMULA_BUILDERS = {
    "revenue_growth_yoy": lambda p, prior: f"={lref('revenue', p)}/{lref('revenue', prior)}-1" if lref('revenue', p) and lref('revenue', prior) else None,
    "maintenance_share_of_revenue": lambda p: f"={lref('maintenance_recurring_revenue', p)}/{lref('revenue', p)}" if lref('maintenance_recurring_revenue', p) and lref('revenue', p) else None,
    "net_margin": lambda p: f"={lref('net_income_attributable', p)}/{lref('revenue', p)}" if lref('net_income_attributable', p) and lref('revenue', p) else None,
    "cfo_margin": lambda p: f"={lref('cash_from_operations', p)}/{lref('revenue', p)}" if lref('cash_from_operations', p) and lref('revenue', p) else None,
    "fcfa2s_margin": lambda p: f"={lref('fcfa2s', p)}/{lref('revenue', p)}" if lref('fcfa2s', p) and lref('revenue', p) else None,
    "cash_conversion": lambda p: f"={lref('fcfa2s', p)}/{lref('net_income_attributable', p)}" if lref('fcfa2s', p) and lref('net_income_attributable', p) else None,
    "acquisitions_to_fcfa2s": lambda p: f"={lref('acquisitions_cash_spent', p)}/{lref('fcfa2s', p)}" if lref('acquisitions_cash_spent', p) and lref('fcfa2s', p) else None,
    "net_debt": lambda p: f"={lref('total_debt', p)}-{lref('cash', p)}" if lref('total_debt', p) and lref('cash', p) else None,
}
yoy_prior = {cur: prior for cur, prior in YOY_PAIRS}

for mkey, rec in METRICS.items():
    name, period = mkey.split("::", 1)
    val = rec["value"]
    excel_formula = None
    if name == "revenue_growth_yoy" and period in yoy_prior:
        excel_formula = FORMULA_BUILDERS["revenue_growth_yoy"](period, yoy_prior[period])
    elif name in FORMULA_BUILDERS and name != "revenue_growth_yoy":
        excel_formula = FORMULA_BUILDERS[name](period)
    ws_m.append([name, period, excel_formula if excel_formula else val, rec["formula"],
                 ", ".join(rec["inputs"].keys()) if rec["inputs"] else "", rec.get("note", "")])

for col, width in zip("ABCDEF", [30, 18, 14, 55, 45, 55]):
    ws_m.column_dimensions[col].width = width

# --- Valuation sheet ---
ws_v = wb.create_sheet("Valuation")
ws_v.append(["item", "value", "formula", "note"])
for k, rec in VAL.items():
    ws_v.append([k, rec["value"], rec["formula"], rec.get("note", "")])
for col, width in zip("ABCD", [28, 16, 60, 70]):
    ws_v.column_dimensions[col].width = width

# --- Peers sheet ---
ws_p = wb.create_sheet("Peers")
ws_p.append(["peer", "metric", "value", "unit/formula", "source_url"])
for peer_name, row in PEER_TABLE.items():
    if "status" in row and len(row) == 1:
        ws_p.append([peer_name, "status", row["status"], "", ""])
        continue
    for metric_key, val in row.items():
        if isinstance(val, dict):
            ws_p.append([peer_name, metric_key, val.get("value"),
                         val.get("unit") or val.get("formula", ""), val.get("source_url", "")])
        else:
            ws_p.append([peer_name, metric_key, val, "", ""])
for col, width in zip("ABCDE", [38, 32, 14, 30, 60]):
    ws_p.column_dimensions[col].width = width

# --- Scenario grid sheet ---
ws_s = wb.create_sheet("ScenarioGrid")
ws_s.append(["Scenario inputs"])
ws_s.append(["current_fcfa2s_per_share", current_fcfa2s_ps])
ws_s.append(["current_multiple", current_multiple])
ws_s.append(["entry_price_usd", implied_price_usd])
ws_s.append([])
ws_s.append(["5yr IRR grid (rows=fcfa2s growth, cols=exit multiple x fcfa2s)"])
header = ["growth \\ exit_mult"] + [f"{m}x" for m in MULTIPLES]
ws_s.append(header)
entry_row = ws_s.max_row  # not used further, just for reference
inputs_row = 2  # row with current_fcfa2s_per_share value
mult_row0 = 3
entry_price_row = 4
grid_header_row = ws_s.max_row
for g in GROWTHS:
    row_vals = [g]
    for m in MULTIPLES:
        # live formula: ((B$2*(1+$A{r})^5)*m/B$4)^(1/5)-1
        pass
    ws_s.append(row_vals)

# fill grid with live excel formulas
grid_start_row = grid_header_row + 1
for i, g in enumerate(GROWTHS):
    r = grid_start_row + i
    ws_s.cell(row=r, column=1, value=g)
    for j, m in enumerate(MULTIPLES):
        col = 2 + j
        col_letter = get_column_letter(col)
        formula = f"=(($B$2*(1+$A{r})^5)*{m}/$B$4)^(1/5)-1"
        ws_s.cell(row=r, column=col, value=formula)
for col, width in zip("ABCDEF", [22, 14, 14, 14, 14, 14]):
    ws_s.column_dimensions[col].width = width

ws_p = wb.create_sheet("PostReview")
ws_p.append(["item", "value", "formula", "note"])
for k, rec in POST.items():
    if k == "fx_sensitivity":
        continue
    ws_p.append([k, rec.get("value"), rec.get("formula"), rec.get("note")])
ws_p.append([])
ws_p.append(["FX sensitivity"] + (list(SENS[0].keys()) if SENS else []))
for r in SENS:
    ws_p.append([""] + list(r.values()))

wb.save("metrics.xlsx")
print("metrics.xlsx written")

# =================================================================
# Spot checks: verify three metrics by hand against ledger values
print("\n--- SPOT CHECKS ---")

# 1. revenue_growth_yoy FY2025
r25, r24 = v("revenue", "FY2025"), v("revenue", "FY2024")
expected = r25 / r24 - 1
computed = METRICS["revenue_growth_yoy::FY2025"]["value"]
print(f"1. revenue_growth_yoy FY2025: ledger revenue FY2025={r25}, FY2024={r24}; "
      f"hand calc = {r25}/{r24}-1 = {expected:.6f}; script value = {computed:.6f}; "
      f"match = {abs(expected-computed) < 1e-9}")

# 2. net_margin Q2 2026
ni, r = v("net_income_attributable", "Q2 2026"), v("revenue", "Q2 2026")
expected2 = ni / r
computed2 = METRICS["net_margin::Q2 2026"]["value"]
print(f"2. net_margin Q2 2026: ledger net_income={ni}, revenue={r}; "
      f"hand calc = {ni}/{r} = {expected2:.6f}; script value = {computed2:.6f}; "
      f"match = {abs(expected2-computed2) < 1e-9}")

# 3. net_debt Q2 2026 and net_debt_to_fcfa2s Q2 2026
td, c = v("total_debt", "Q2 2026"), v("cash", "Q2 2026")
fc = v("fcfa2s", "Q2 2026")
expected3_nd = td - c
expected3_ratio = expected3_nd / fc
computed3_nd = METRICS["net_debt::Q2 2026"]["value"]
computed3_ratio = METRICS["net_debt_to_fcfa2s::Q2 2026"]["value"]
print(f"3. net_debt_to_fcfa2s Q2 2026: ledger total_debt={td}, cash={c}, fcfa2s={fc}; "
      f"hand calc net_debt = {td}-{c} = {expected3_nd}, ratio = {expected3_nd}/{fc} = {expected3_ratio:.6f}; "
      f"script net_debt = {computed3_nd}, ratio = {computed3_ratio:.6f}; "
      f"match = {abs(expected3_nd-computed3_nd) < 1e-9 and abs(expected3_ratio-computed3_ratio) < 1e-9}")

# Count metrics lacking inputs (value is None)
missing = [k for k, rec in METRICS.items() if rec["value"] is None]
print(f"\nTotal timeseries metric entries: {len(METRICS)}")
print(f"Entries with no value (missing inputs): {len(missing)}")

#!/usr/bin/env python3
"""Recompute Unisys distress frameworks on filing grade inputs.

Standard library only. Run:  python3 -I compute_unisys.py
Reads  fy2025_10k_ledger.json, q2_2026_10q_ledger.json, market_inputs.json (same folder).
Writes unisys_metrics.json and unisys_metrics.md (same folder).
All arithmetic is in this file. Nothing is estimated: a missing input gives value null plus a note.
Units: USD millions unless stated.
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def path(name):
    return os.path.join(HERE, name)


FY_LEDGER = json.load(open(path("fy2025_10k_ledger.json")))
Q_LEDGER = json.load(open(path("q2_2026_10q_ledger.json")))
MKT_IN = json.load(open(path("market_inputs.json")))

# --------------------------------------------------------------------------------------
# Ledger lookup with an audit trail of every item matched
# --------------------------------------------------------------------------------------
AUDIT = []


class Ledger:
    def __init__(self, name, rows):
        self.name, self.rows = name, rows

    def find(self, item, period, why=""):
        """Exact item and exact period; falls back to unique item prefix / period prefix."""
        def pick(cond):
            return [r for r in self.rows if cond(r)]

        hits = pick(lambda r: r["item"] == item and r["period"] == period)
        if not hits:
            hits = pick(lambda r: r["item"] == item and r["period"].startswith(period))
        if not hits:
            hits = pick(lambda r: r["item"].startswith(item) and r["period"].startswith(period))
        if not hits:
            raise KeyError("no ledger match: %s | %s | %s" % (self.name, item, period))
        vals = {json.dumps(h["value"]) for h in hits}
        items = {h["item"] for h in hits}
        if len(vals) > 1 or len(items) > 1:
            raise KeyError("ambiguous ledger match: %s | %s | %s -> %s" % (self.name, item, period, sorted(items)))
        r = hits[0]
        AUDIT.append({"ledger": self.name, "item": r["item"], "period": r["period"], "value": r["value"],
                      "unit": r.get("unit"), "used_for": why})
        return r


FY = Ledger("fy2025_10k_ledger.json", FY_LEDGER)
Q = Ledger("q2_2026_10q_ledger.json", Q_LEDGER)

# Registry of inputs per period table. Entry = ledger sourced or derived.
R = {"FY2024": {}, "FY2025": {}, "Q2_2026": {}, "GUIDE": {}, "MKT": {}}


def inp(P, key, ledger, item, period, sign=1.0, note=""):
    rec = ledger.find(item, period, why="%s.%s" % (P, key))
    v = rec["value"]
    if isinstance(v, (int, float)):
        v = v * sign
    R[P][key] = {"value": v, "unit": rec.get("unit"), "ledger": ledger.name, "item": rec["item"],
                 "period": rec["period"], "section": rec.get("source_section") or rec.get("source_document"),
                 "url": rec.get("url"), "quote": rec.get("quote"), "note": note}
    return v


def der(P, key, value, formula, parts, note=""):
    R[P][key] = {"value": value, "derived": formula, "from": parts, "note": note}
    return value


def src(e):
    if "derived" in e:
        return "derived: " + e["derived"]
    return "%s | %s | %s" % (e["ledger"], e["item"], e["period"])


def M(P, value, formula, keys, note="", extra_inputs=None, **extra):
    """Metric record. keys index the registry R[P]."""
    ins = {k: {"value": R[P][k]["value"], "source": src(R[P][k])} for k in keys}
    if extra_inputs:
        ins.update(extra_inputs)
    if value is None and not note:
        raise AssertionError("null metric without a note naming the missing input: " + formula)
    out = {"value": value, "formula": formula, "inputs": ins, "note": note}
    out.update(extra)
    return out


def Phi(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def safe_div(a, b):
    return a / b


# --------------------------------------------------------------------------------------
# 1. INPUTS
# --------------------------------------------------------------------------------------
def load_fy(P, tag_bs, tag_fl):
    """tag_bs like 'FY2025 (31 Dec 2025)', tag_fl like 'FY2025'."""
    inp(P, "cash", FY, "Cash and cash equivalents", tag_bs)
    inp(P, "tca", FY, "Total current assets", tag_bs)
    inp(P, "ta", FY, "Total assets", tag_bs)
    inp(P, "tcl", FY, "Total current liabilities", tag_bs)
    inp(P, "ltd", FY, "Long-term debt", tag_bs)
    inp(P, "cur_debt", FY, "Current maturities of long-term debt (current debt)", tag_bs)
    inp(P, "pension_bs", FY, "Long-term pension and postretirement liabilities", tag_bs)
    inp(P, "re", FY, "Accumulated deficit", tag_bs)
    inp(P, "deficit_total", FY, "Total deficit", tag_bs)
    inp(P, "deficit_unisys", FY, "Total Unisys Corporation stockholders' deficit", tag_bs)
    inp(P, "total_debt", FY, "Total debt (long-term debt note total incl. finance leases)", tag_bs,
        note="Carrying amount (net of issuance costs, includes finance leases).")
    inp(P, "revenue", FY, "Revenue", tag_fl)
    inp(P, "ebit", FY, "Operating income (operating profit)", tag_fl)
    inp(P, "interest", FY, "Interest expense", tag_fl)
    inp(P, "ebt", FY, "Loss before income taxes (pretax)", tag_fl)
    inp(P, "ni", FY, "Net loss attributable to Unisys Corporation", tag_fl)
    inp(P, "ni_consol", FY, "Consolidated net loss (incl. noncontrolling interests)", tag_fl)
    inp(P, "ocf", FY, "Net cash (used for) provided by operating activities", tag_fl)
    inp(P, "capex", FY, "Total capex (marketable software + properties and other assets)", tag_fl, sign=-1.0,
        note="Ledger sign is negative; shown here as a positive outflow.")
    inp(P, "pension_contrib", FY, "Pension and postretirement contributions (cash flow line)", tag_fl, sign=-1.0,
        note="Cash flow line, pension plus postretirement; positive outflow.")
    inp(P, "da", FY, "Total depreciation and amortization (sum of four cash flow lines)", tag_fl)
    inp(P, "adj_ebitda", FY, "Adjusted EBITDA, earnings release", tag_fl)
    inp(P, "pension_deficit", FY, "Funded status, total defined benefit plans", tag_bs, sign=-1.0,
        note="Funding deficit of the defined benefit plans, positive number.")
    der(P, "tl", R[P]["ta"]["value"] - R[P]["deficit_total"]["value"], "total assets minus total deficit", ["ta", "deficit_total"],
        note="The balance sheet prints no total liabilities line.")
    der(P, "wc", R[P]["tca"]["value"] - R[P]["tcl"]["value"], "total current assets minus total current liabilities", ["tca", "tcl"])


load_fy("FY2024", "FY2024 (31 Dec 2024)", "FY2024")
load_fy("FY2025", "FY2025 (31 Dec 2025)", "FY2025")

# FCF as the company defines it (ledger item names differ by year)
inp("FY2025", "fcf_company", FY, "Free cash flow (company definition: cash from operations less capex), earnings release", "FY2025")
inp("FY2024", "fcf_company", FY, "Free cash flow (company definition), earnings release", "FY2024")
inp("FY2025", "fcf_prepension_company", FY, "Pre-pension and postretirement free cash flow, earnings release", "FY2025")
inp("FY2024", "fcf_prepension_company", FY, "Pre-pension and postretirement free cash flow, earnings release", "FY2024")
inp("FY2025", "abl_avail", FY, "ABL availability, net of letters of credit", "FY2025 (31 Dec 2025)")
inp("FY2025", "total_debt_face", Q, "Total debt at face value (derived)", "2025-12-31",
    note="Face value from the Q2 2026 ledger (notes 700.0 + finance leases + other debt).")
inp("FY2025", "pension_deficit_company", Q, "Defined benefit pension funding deficit, 31 Dec 2025 (company release)", "2025-12-31")
inp("FY2025", "prepaid_pension", FY, "Prepaid pension and postretirement assets", "FY2025 (31 Dec 2025)")
inp("FY2024", "tca_orig", FY, "Total current assets (as originally reported in FY2024 10-K)", "FY2024 (31 Dec 2024)")

# Q2 2026 balance sheet (30 Jun 2026)
P = "Q2_2026"
inp(P, "cash", Q, "Cash and cash equivalents", "2026-06-30")
inp(P, "tca", Q, "Total current assets", "2026-06-30")
inp(P, "ta", Q, "Total assets", "2026-06-30")
inp(P, "tcl", Q, "Total current liabilities", "2026-06-30")
inp(P, "ltd", Q, "Long-term debt", "2026-06-30")
inp(P, "cur_debt", Q, "Current maturities of long-term debt (current debt)", "2026-06-30")
inp(P, "pension_bs", Q, "Long-term pension and postretirement liabilities", "2026-06-30")
inp(P, "prepaid_pension", Q, "Prepaid pension and postretirement assets", "2026-06-30")
inp(P, "re", Q, "Accumulated deficit", "2026-06-30")
inp(P, "deficit_total", Q, "Total deficit", "2026-06-30")
inp(P, "deficit_unisys", Q, "Total Unisys Corporation stockholders' deficit", "2026-06-30")
inp(P, "total_debt", Q, "Total debt (carrying amount: notes + finance leases + other debt)", "2026-06-30",
    note="Carrying amount, used for balance sheet models. Face alternative in total_debt_face.")
inp(P, "total_debt_face", Q, "Total debt at face value (notes face + finance leases + other debt) (derived)", "2026-06-30",
    note="Face 745.0 = notes 698.4 + finance leases 37.3 + other debt 9.3. Alternative to carrying 733.5.")
inp(P, "notes_face", Q, "10.625% senior secured notes due 2031, face value outstanding", "2026-06-30")
inp(P, "notes_fv", Q, "2031 notes fair value (Level 2)", "2026-06-30")
inp(P, "abl_avail", Q, "ABL availability, net of letters of credit", "2026-06-30")
inp(P, "liquidity_ledger", Q, "Liquidity, cash plus ABL availability (derived)", "2026-06-30")
inp(P, "pension_deficit_stale", Q, "Defined benefit pension funding deficit, 31 Dec 2025 (company release)", "2025-12-31",
    note="Last figure stated by the company. No 30 Jun 2026 funding deficit exists in the filings.")
der(P, "tl", R[P]["ta"]["value"] - R[P]["deficit_total"]["value"], "total assets minus total deficit", ["ta", "deficit_total"])
der(P, "wc", R[P]["tca"]["value"] - R[P]["tcl"]["value"], "total current assets minus total current liabilities", ["tca", "tcl"])
der(P, "pension_bs_net", R[P]["pension_bs"]["value"] - R[P]["prepaid_pension"]["value"],
    "long term pension and postretirement liability minus prepaid pension asset", ["pension_bs", "prepaid_pension"],
    note="Balance sheet measure, not the funding deficit.")

# Flows for LTM = FY2025 - H1 2025 + H1 2026
H1_26 = "H1 2026 ("
H1_25 = "H1 2025 ("


def ltm(key, fy_key, item, fy_sign=1.0, h_sign=1.0, h25=None, h26=None, ledger=Q, note=""):
    """Build H1 2025, H1 2026 and LTM entries in the Q2_2026 registry."""
    a = inp(P, key + "_h1_25", ledger, item, h25 or H1_25, sign=h_sign)
    b = inp(P, key + "_h1_26", ledger, item, h26 or H1_26, sign=h_sign)
    fy_val = R["FY2025"][fy_key]["value"]
    v = fy_val - a + b
    der(P, key + "_ltm", v, "FY2025 %s - H1 2025 + H1 2026" % key, ["FY2025." + fy_key, key + "_h1_25", key + "_h1_26"], note=note)
    return v


ltm("revenue", "revenue", "Revenue")
ltm("ebit", "ebit", "Operating (loss) income")
ltm("interest", "interest", "Interest expense")
ltm("ebt", "ebt", "Loss before income taxes (pretax)")
ltm("ni", "ni", "Net loss attributable to Unisys Corporation")
ltm("ni_consol", "ni_consol", "Consolidated net loss")
ltm("ocf", "ocf", "Net cash used for operating activities (cash from operations)", h25="H1 2025", h26="H1 2026")
ltm("pension_contrib", "pension_contrib", "Pension and postretirement contributions (operating cash flow line)",
    h_sign=-1.0, h25="H1 2025", h26="H1 2026")
# Adjusted EBITDA
a = inp(P, "adj_ebitda_h1_25", Q, "Adjusted EBITDA (company definition), H1 2025", "H1 2025")
b = inp(P, "adj_ebitda_h1_26", Q, "Adjusted EBITDA (company definition)", "H1 2026")
der(P, "adj_ebitda_ltm", R["FY2025"]["adj_ebitda"]["value"] - a + b, "FY2025 278.8 - H1 2025 + H1 2026",
    ["FY2025.adj_ebitda", "adj_ebitda_h1_25", "adj_ebitda_h1_26"])
# Capex lines
cm25 = inp(P, "capex_sw_h1_25", Q, "Investment in marketable software (capex line 1)", "H1 2025", sign=-1.0)
cp25 = inp(P, "capex_pp_h1_25", Q, "Capital additions of properties and other assets (capex line 2)", "H1 2025", sign=-1.0)
cm26 = inp(P, "capex_sw_h1_26", Q, "Investment in marketable software (capex line 1)", "H1 2026", sign=-1.0)
cp26 = inp(P, "capex_pp_h1_26", Q, "Capital additions of properties and other assets (capex line 2)", "H1 2026", sign=-1.0)
der(P, "capex_h1_25", cm25 + cp25, "marketable software + properties H1 2025", ["capex_sw_h1_25", "capex_pp_h1_25"])
der(P, "capex_h1_26", cm26 + cp26, "marketable software + properties H1 2026", ["capex_sw_h1_26", "capex_pp_h1_26"])
der(P, "capex_ltm", R["FY2025"]["capex"]["value"] - R[P]["capex_h1_25"]["value"] + R[P]["capex_h1_26"]["value"],
    "FY2025 capex - H1 2025 + H1 2026", ["FY2025.capex", "capex_h1_25", "capex_h1_26"])
inp(P, "fcf_h1_26", Q, "Free cash flow (company definition: cash from operations less capital expenditures)", "H1 2026 (6 months)")
inp(P, "fcf_h1_25", Q, "Free cash flow (company definition: cash from operations less capital expenditures)", "H1 2025 (6 months)")
inp(P, "fcf_q2_26", Q, "Free cash flow (company definition: cash from operations less capital expenditures)", "Q2 2026 (3 months)")
der(P, "fcf_ltm_company", R["FY2025"]["fcf_company"]["value"] - R[P]["fcf_h1_25"]["value"] + R[P]["fcf_h1_26"]["value"],
    "FY2025 company FCF - H1 2025 + H1 2026", ["FY2025.fcf_company", "fcf_h1_25", "fcf_h1_26"])
inp(P, "fcf_prepension_h1_26", Q, "Pre-pension and postretirement free cash flow", "H1 2026 (6 months)")
# D&A for LTM: not in the 10-Q ledger
R[P]["da_ltm"] = {"value": None, "note": "Depreciation and amortization for H1 2025 and H1 2026 are not in the 10-Q ledger (no cash flow D&A lines), so LTM D&A and LTM funds from operations cannot be built.",
                  "derived": "FY2025 D&A - H1 2025 D&A + H1 2026 D&A", "from": []}
R[P]["ni_prior_ltm"] = {"value": None, "note": "Prior LTM net income (12 months to 30 Jun 2025) needs H1 2024 net income, which is in neither ledger.",
                        "derived": "FY2024 NI - H1 2024 NI + H1 2025 NI", "from": []}

# Market inputs registry (as is)
mk = MKT_IN
R["MKT"] = {
    "price": {"value": mk["equity"]["last_close"], "ledger": "market_inputs.json", "item": "equity.last_close", "period": mk["equity"]["last_close_date"]},
    "shares": {"value": mk["equity"]["shares"], "ledger": "market_inputs.json", "item": "equity.shares", "period": "30 Jun 2026"},
    "market_cap_musd": {"value": mk["equity"]["market_cap_usd"] / 1e6, "ledger": "market_inputs.json", "item": "equity.market_cap_usd", "period": mk["equity"]["last_close_date"]},
    "sigma_E": {"value": mk["equity"]["vol_252_annualised"], "ledger": "market_inputs.json", "item": "equity.vol_252_annualised", "period": "252d to 2026-10-09"},
    "return_1y": {"value": mk["equity"]["return_1y"], "ledger": "market_inputs.json", "item": "equity.return_1y", "period": "2025-10-09 to 2026-10-09"},
    "base_close_1y": {"value": mk["equity"]["base_close_1y"], "ledger": "market_inputs.json", "item": "equity.base_close_1y", "period": mk["equity"]["base_date_1y"]},
    "rf_1y_pct": {"value": mk["risk_free"]["y1"], "ledger": "market_inputs.json", "item": "risk_free.y1", "period": mk["risk_free"]["latest_date"]},
    "debt_F_musd": {"value": mk["merton_naive_main"]["F"] / 1e6, "ledger": "market_inputs.json", "item": "merton_naive_main.F", "period": "30 Jun 2026"},
    "bond_price": {"value": mk["bond"]["price"], "ledger": "market_inputs.json", "item": "bond.price", "period": mk["bond"]["quote_date"]},
    "bond_ytm_pct": {"value": mk["bond"]["ytm_reported"], "ledger": "market_inputs.json", "item": "bond.ytm_reported", "period": mk["bond"]["quote_date"]},
    "bond_treasury_pct": {"value": mk["bond"]["main"]["treasury"], "ledger": "market_inputs.json", "item": "bond.main.treasury", "period": mk["bond"]["quote_date"]},
    "bond_years": {"value": mk["bond"]["years_to_maturity"], "ledger": "market_inputs.json", "item": "bond.years_to_maturity", "period": mk["bond"]["quote_date"]},
}

# Cross check: market_inputs total debt equals the 10-Q carrying debt
assert abs(R["MKT"]["debt_F_musd"]["value"] - R["Q2_2026"]["total_debt"]["value"]) < 1e-9


def table(Pk, labels):
    out = []
    for k, label in labels:
        e = R[Pk][k]
        row = {"key": k, "label": label, "value": e["value"], "unit": e.get("unit") or "USD millions"}
        if "derived" in e:
            row["derived"] = e["derived"]
        else:
            row.update({"source_item": e["item"], "source_period": e["period"], "ledger": e["ledger"],
                        "url": e.get("url"), "quote": e.get("quote")})
        if e.get("note"):
            row["note"] = e["note"]
        out.append(row)
    return out


FY_LABELS = [("cash", "Cash and cash equivalents"), ("tca", "Total current assets"), ("tcl", "Total current liabilities"),
             ("wc", "Working capital"), ("ta", "Total assets"), ("tl", "Total liabilities"), ("re", "Accumulated deficit"),
             ("deficit_total", "Total deficit (incl. NCI)"), ("deficit_unisys", "Unisys stockholders deficit"),
             ("ltd", "Long term debt"), ("cur_debt", "Current maturities of debt"), ("total_debt", "Total debt, carrying"),
             ("pension_bs", "Long term pension and postretirement liabilities"), ("pension_deficit", "DB pension funding deficit"),
             ("revenue", "Revenue"), ("ebit", "Operating profit (EBIT)"), ("interest", "Interest expense"),
             ("ebt", "Pre tax loss"), ("ni", "Net loss attributable to Unisys"), ("ni_consol", "Consolidated net loss"),
             ("ocf", "Cash from operations"), ("capex", "Capex (software + properties)"), ("pension_contrib", "Pension and postretirement contributions"),
             ("fcf_company", "Free cash flow (company definition)"), ("fcf_prepension_company", "Pre pension free cash flow (company)"),
             ("da", "Depreciation and amortization"), ("adj_ebitda", "Adjusted EBITDA (company)")]
Q_LABELS = [("cash", "Cash and cash equivalents"), ("tca", "Total current assets"), ("tcl", "Total current liabilities"),
            ("wc", "Working capital"), ("ta", "Total assets"), ("tl", "Total liabilities"), ("re", "Accumulated deficit"),
            ("deficit_total", "Total deficit (incl. NCI)"), ("deficit_unisys", "Unisys stockholders deficit"),
            ("ltd", "Long term debt"), ("cur_debt", "Current maturities of debt"), ("total_debt", "Total debt, carrying"),
            ("total_debt_face", "Total debt, face"), ("notes_face", "2031 notes face"), ("notes_fv", "2031 notes fair value"),
            ("pension_bs", "Long term pension and postretirement liabilities"), ("prepaid_pension", "Prepaid pension asset"),
            ("pension_bs_net", "Net balance sheet pension position"), ("pension_deficit_stale", "DB funding deficit (last stated, 31 Dec 2025)"),
            ("abl_avail", "ABL availability"), ("revenue_ltm", "LTM revenue"), ("ebit_ltm", "LTM operating profit"),
            ("interest_ltm", "LTM interest expense"), ("ebt_ltm", "LTM pre tax loss"), ("ni_ltm", "LTM net loss attributable"),
            ("ni_consol_ltm", "LTM consolidated net loss"), ("ocf_ltm", "LTM cash from operations"), ("capex_ltm", "LTM capex"),
            ("pension_contrib_ltm", "LTM pension and postretirement contributions"), ("fcf_ltm_company", "LTM free cash flow"),
            ("adj_ebitda_ltm", "LTM Adjusted EBITDA"), ("da_ltm", "LTM depreciation and amortization"), ("ni_prior_ltm", "Prior LTM net loss")]

# ---- comparisons with the earlier snippet based round ----
SNIPPET = {
    "FY2025": {"ta": 1846.2, "tca": 1004.0, "tcl": 655.9, "wc": 348.1, "re": -2478.9, "deficit_total": -268.3, "deficit_unisys": -282.6,
               "tl": 2114.5, "cash": 413.9, "ltd": None, "total_debt": None, "pension_bs": 517.7, "pension_deficit": 448.5,
               "revenue": 1950.1, "ebit": 78.5, "interest": 53.4, "ebt": None, "ni": -339.8, "ocf": -140.0, "adj_ebitda": None},
    "FY2024": {"revenue": 2008.4, "ebit": 97.4, "interest": 31.9, "ni": -193.4, "pension_bs": None, "pension_deficit": 750.2, "tca": 982.4},
    "Q2_2026": {"ta": 1641.6, "tca": 846.1, "tcl": 600.3, "wc": 245.8, "re": -2610.0, "deficit_total": -351.9, "deficit_unisys": -367.4,
                "tl": 1993.5, "cash": 324.3, "ltd": 721.9, "total_debt": 733.5, "pension_bs": 485.1, "revenue_ltm": 1945.8,
                "ebit_ltm": 26.4, "ni_ltm": -421.3, "ocf_ltm": None, "ebt_ltm": None, "pension_deficit_stale": None},
}
SNIPPET_NOTES = {
    "FY2025.total_debt": "Earlier note: gap (aggregator 729 was long term debt only).",
    "FY2025.ltd": "Earlier note: gap.",
    "FY2025.ebt": "Earlier note: gap.",
    "FY2025.adj_ebitda": "Earlier note: not collected.",
    "Q2_2026.ocf_ltm": "Earlier note: gap.",
    "Q2_2026.ebt_ltm": "Earlier note: gap.",
    "Q2_2026.pension_deficit_stale": "Earlier note: gap; still not stated in filings for 30 Jun 2026.",
    "FY2024.tca": "Earlier snippet used 982.4 (FY2024 10-K as originally filed); the FY2025 10-K comparative is 979.3 (recast).",
    "FY2024.pension_bs": "Earlier note did not report it.",
}


def compare(Pk):
    rows = []
    for k, sv in SNIPPET.get(Pk, {}).items():
        if k not in R[Pk]:
            continue
        fv = R[Pk][k]["value"]
        diff = None if (fv is None or sv is None) else round(fv - sv, 6)
        rows.append({"key": k, "filing_value": fv, "snippet_value": sv, "difference_filing_minus_snippet": diff,
                     "note": SNIPPET_NOTES.get("%s.%s" % (Pk, k), "")})
    return rows


# ---- ledger vs ledger (31 Dec 2025 balance sheet appears in both) ----
CROSS = [
    ("Cash and cash equivalents", "Cash and cash equivalents"),
    ("Total current assets", "Total current assets"),
    ("Total assets", "Total assets"),
    ("Total current liabilities", "Total current liabilities"),
    ("Long-term debt", "Long-term debt"),
    ("Current maturities of long-term debt (current debt)", "Current maturities of long-term debt (current debt)"),
    ("Long-term pension and postretirement liabilities", "Long-term pension and postretirement liabilities"),
    ("Accumulated deficit", "Accumulated deficit"),
    ("Accumulated other comprehensive loss", "Accumulated other comprehensive loss"),
    ("Total Unisys Corporation stockholders' deficit", "Total Unisys Corporation stockholders' deficit"),
    ("Total deficit", "Total deficit"),
    ("Prepaid pension and postretirement assets", "Prepaid pension and postretirement assets"),
    ("Goodwill", "Goodwill"),
    ("Total liabilities (the balance sheet prints no total)", "Total liabilities (derived)"),
    ("Total debt (long-term debt note total incl. finance leases)", "Total debt (carrying amount)"),
]
cross_rows = []
for fi, qi in CROSS:
    a = FY.find(fi, "FY2025 (31 Dec 2025)", why="cross ledger check")
    b = Q.find(qi, "2025-12-31", why="cross ledger check")
    cross_rows.append({"fy_ledger_item": a["item"], "q2_ledger_item": b["item"], "fy_ledger_value": a["value"],
                       "q2_ledger_value": b["value"], "difference": round(a["value"] - b["value"], 6)})
a = FY.find("Adjusted EBITDA, earnings release", "FY2025", why="cross ledger check")
b = Q.find("Adjusted EBITDA (company definition)", "FY2025", why="cross ledger check")
cross_rows.append({"fy_ledger_item": a["item"], "q2_ledger_item": b["item"], "fy_ledger_value": a["value"], "q2_ledger_value": b["value"],
                   "difference": round(a["value"] - b["value"], 6)})
a = FY.find("Estimated cash contributions to global DB plans: 2027", "FY2027 estimate", why="cross ledger check")
b = Q.find("Expected 2027 global DB contributions (Q2 10-Q)", "FY2027", why="cross ledger check")
cross_rows.append({"fy_ledger_item": a["item"], "q2_ledger_item": b["item"], "fy_ledger_value": a["value"], "q2_ledger_value": b["value"],
                   "difference": round(a["value"] - b["value"], 6),
                   "note": "10-K and Q1 10-Q say 105; Q2 10-Q says 104. The spec schedule uses 105 (10-K)."})
a = FY.find("Estimated cash contributions to global DB plans: 2026", "FY2026 estimate", why="cross ledger check")
b = Q.find("Expected total 2026 global DB contributions (Q2 10-Q)", "FY2026", why="cross ledger check")
cross_rows.append({"fy_ledger_item": a["item"], "q2_ledger_item": b["item"], "fy_ledger_value": a["value"], "q2_ledger_value": b["value"],
                   "difference": round(a["value"] - b["value"], 6), "note": "87 (10-K, superseded) versus 97 (Q2 10-Q)."})
cross_rows.append({"fy_ledger_item": "Total current assets (FY2024 comparative)", "q2_ledger_item": "(same ledger) as originally reported in FY2024 10-K",
                   "fy_ledger_value": R["FY2024"]["tca"]["value"], "q2_ledger_value": R["FY2024"]["tca_orig"]["value"],
                   "difference": round(R["FY2024"]["tca"]["value"] - R["FY2024"]["tca_orig"]["value"], 6),
                   "note": "Recast: prepaid and other current assets 106.3 to 103.2. Recast figure 979.3 used."})

inputs_block = {
    "units": "USD millions unless stated",
    "FY2024": {"table": table("FY2024", [(k, l) for k, l in FY_LABELS if k in R["FY2024"]]),
               "vs_snippet": compare("FY2024")},
    "FY2025": {"table": table("FY2025", [(k, l) for k, l in FY_LABELS if k in R["FY2025"]]),
               "vs_snippet": compare("FY2025")},
    "Q2_2026": {"basis": "Balance sheet at 30 Jun 2026; flows are LTM = FY2025 minus H1 2025 plus H1 2026",
                "table": table("Q2_2026", [(k, l) for k, l in Q_LABELS if k in R["Q2_2026"]]),
                "vs_snippet": compare("Q2_2026")},
    "ledger_vs_ledger_31dec2025": cross_rows,
    "debt_choice_note": "Balance sheet models use carrying total debt (733.5 at 30 Jun 2026; 741.7 at 31 Dec 2025). Face alternatives: 745.0 and 754.5. "
                        "The 1,198.2 'total debt' on the Q1 2026 slide adds the pension deficit and is not funded debt.",
}

inputs_block["market_vs_snippet"] = [
    {"key": "share_price", "filing_or_market_value": R["MKT"]["price"]["value"], "snippet_value": 2.44, "difference": R["MKT"]["price"]["value"] - 2.44,
     "note": "Snippet price 2.44 (22 Sep 2026, third party); market_inputs.json close 2.22 on 9 Oct 2026."},
    {"key": "market_cap_musd", "filing_or_market_value": R["MKT"]["market_cap_musd"]["value"], "snippet_value": 177.9, "difference": R["MKT"]["market_cap_musd"]["value"] - 177.9,
     "note": "Same share count 72,915,955 (10-Q cover); different price date."},
]

# --------------------------------------------------------------------------------------
# 2. ACCOUNTING SCORES
# --------------------------------------------------------------------------------------
MCAP = R["MKT"]["market_cap_musd"]["value"]


def make_d(Pk, sales, ebit, ebt, ni, ffo, ni_prev, intwo, pension_key, label):
    e = R[Pk]
    return {"label": label, "TA": e["ta"]["value"], "TCA": e["tca"]["value"], "TCL": e["tcl"]["value"],
            "TL": e["tl"]["value"], "RE": e["re"]["value"], "EQ": e["deficit_total"]["value"],
            "EBIT": ebit, "SALES": sales, "EBT": ebt, "NI": ni, "FFO": ffo, "NI_PREV": ni_prev, "INTWO": intwo,
            "MCAP": MCAP, "PENSION": e[pension_key]["value"], "INTEREST": None}


FFO_FY25 = R["FY2025"]["ni"]["value"] + R["FY2025"]["da"]["value"]
der("FY2025", "ffo", FFO_FY25, "net loss attributable + depreciation and amortization (95.2)", ["ni", "da"],
    note="FFO is not a ledger item. Simple definition used: net income plus D&A. It does not add back the 227.7 non cash pension "
         "settlement loss, which would lift FFO to -16.9 (alternative shown in the Ohlson note).")

D25 = make_d("FY2025", R["FY2025"]["revenue"]["value"], R["FY2025"]["ebit"]["value"], R["FY2025"]["ebt"]["value"],
             R["FY2025"]["ni"]["value"], FFO_FY25, R["FY2024"]["ni"]["value"], 1, "pension_bs", "FY2025")
D25["INTEREST"] = R["FY2025"]["interest"]["value"]
DQ = make_d("Q2_2026", R["Q2_2026"]["revenue_ltm"]["value"], R["Q2_2026"]["ebit_ltm"]["value"], R["Q2_2026"]["ebt_ltm"]["value"],
            R["Q2_2026"]["ni_ltm"]["value"], None, None, 1, "pension_bs", "Q2 2026 LTM")
DQ["INTEREST"] = R["Q2_2026"]["interest_ltm"]["value"]


def zones_altman_z(z):
    return "safe" if z > 2.99 else ("grey" if z >= 1.81 else "distress")


def zones_altman_zp(z):
    return "safe" if z > 2.90 else ("grey" if z >= 1.23 else "distress")


def zones_altman_zpp(z):
    return "safe" if z > 2.6 else ("grey" if z >= 1.1 else "distress")


def f_altman_z(d):
    x = [(d["TCA"] - d["TCL"]) / d["TA"], d["RE"] / d["TA"], d["EBIT"] / d["TA"], d["MCAP"] / d["TL"], d["SALES"] / d["TA"]]
    c = [1.2, 1.4, 3.3, 0.6, 1.0]
    return sum(a * b for a, b in zip(c, x)), x, [a * b for a, b in zip(c, x)]


def f_altman_zp(d):
    x = [(d["TCA"] - d["TCL"]) / d["TA"], d["RE"] / d["TA"], d["EBIT"] / d["TA"], d["EQ"] / d["TL"], d["SALES"] / d["TA"]]
    c = [0.717, 0.847, 3.107, 0.420, 0.998]
    return sum(a * b for a, b in zip(c, x)), x, [a * b for a, b in zip(c, x)]


def f_altman_zpp(d):
    x = [(d["TCA"] - d["TCL"]) / d["TA"], d["RE"] / d["TA"], d["EBIT"] / d["TA"], d["EQ"] / d["TL"]]
    c = [6.56, 3.26, 6.72, 1.05]
    return sum(a * b for a, b in zip(c, x)), x, [a * b for a, b in zip(c, x)]


def f_ohlson(d):
    """Returns dict with terms, partial sum, missing list, value (None unless all terms known)."""
    terms, missing = {"intercept": -1.32}, []
    terms["TLTA"] = 6.03 * d["TL"] / d["TA"]
    terms["WCTA"] = -1.43 * (d["TCA"] - d["TCL"]) / d["TA"]
    terms["CLCA"] = 0.0757 * d["TCL"] / d["TCA"]
    terms["OENEG"] = -1.72 * (1 if d["TL"] > d["TA"] else 0)
    terms["NITA"] = -2.37 * d["NI"] / d["TA"]
    terms["INTWO"] = 0.285 * d["INTWO"]
    missing.append("SIZE (no GNP price level index in the inputs; no GDP deflator in the market note)")
    if d["FFO"] is None:
        missing.append("FFOTL (funds from operations needs LTM depreciation and amortization, not in the 10-Q ledger)")
    else:
        terms["FFOTL"] = -1.83 * d["FFO"] / d["TL"]
    if d["NI_PREV"] is None:
        missing.append("CHIN (prior LTM net income needs H1 2024 net income, in neither ledger)")
    else:
        terms["CHIN"] = -0.521 * (d["NI"] - d["NI_PREV"]) / (abs(d["NI"]) + abs(d["NI_PREV"]))
    partial = sum(terms.values())
    return {"terms": terms, "partial_sum_excluding_missing": partial, "missing": missing, "value": None}


def f_zmij(d, which):
    b = {"A": (-4.336, -4.513, 5.679, 0.004), "B": (-4.803, -3.599, 5.406, -0.100)}[which]
    x = b[0] + b[1] * d["NI"] / d["TA"] + b[2] * d["TL"] / d["TA"] + b[3] * d["TCA"] / d["TCL"]
    return x, Phi(x)


def f_springate(d):
    a, b, c, dd = (d["TCA"] - d["TCL"]) / d["TA"], d["EBIT"] / d["TA"], d["EBT"] / d["TCL"], d["SALES"] / d["TA"]
    return 1.03 * a + 3.07 * b + 0.66 * c + 0.4 * dd, [a, b, c, dd]


def f_grover(d):
    x1, x2, x3 = (d["TCA"] - d["TCL"]) / d["TA"], d["EBIT"] / d["TA"], d["NI"] / d["TA"]
    return 1.650 * x1 + 3.404 * x2 - 0.016 * x3 + 0.057, [x1, x2, x3]


def grover_zone(g):
    return "healthy" if g >= 0.01 else ("distressed" if g <= -0.02 else "grey")


def all_scores(d):
    z, zx, zt = f_altman_z(d)
    zp, zpx, zpt = f_altman_zp(d)
    zpp, zppx, zppt = f_altman_zpp(d)
    oh = f_ohlson(d)
    xa, pa = f_zmij(d, "A")
    xb, pb = f_zmij(d, "B")
    s, sx = f_springate(d)
    g, gx = f_grover(d)
    return {"altman_z_1968": z, "altman_zprime_1983": zp, "altman_zpp_no_constant": zpp, "altman_zpp_with_3.25": zpp + 3.25,
            "ohlson_partial_excl_missing": oh["partial_sum_excluding_missing"], "zmijewski_A_X": xa, "zmijewski_A_prob": pa,
            "zmijewski_B_X": xb, "zmijewski_B_prob": pb, "springate": s, "grover": g}


def score_block(Pk, d, label):
    e = R[Pk]
    base_keys = ["ta", "tca", "tcl", "wc", "tl", "re", "deficit_total"]
    z, zx, zt = f_altman_z(d)
    zp, zpx, zpt = f_altman_zp(d)
    zpp, zppx, zppt = f_altman_zpp(d)
    oh = f_ohlson(d)
    xa, pa = f_zmij(d, "A")
    xb, pb = f_zmij(d, "B")
    s, sx = f_springate(d)
    g, gx = f_grover(d)
    if Pk == "FY2025":
        flow_keys = ["revenue", "ebit", "ebt", "ni", "interest"]
        sfx = ""
    else:
        flow_keys = ["revenue_ltm", "ebit_ltm", "ebt_ltm", "ni_ltm", "interest_ltm"]
        sfx = " (LTM flows)"
    mc = {"market_cap_musd": {"value": MCAP, "source": "market_inputs.json | equity.market_cap_usd | 2026-10-09 (price 2.22 x 72,915,955 shares)"}}
    out = {"label": label}
    out["altman_z_1968"] = M(Pk, z, "1.2*WC/TA + 1.4*RE/TA + 3.3*EBIT/TA + 0.6*MktCap/TL + 1.0*Sales/TA" + sfx,
                             base_keys + flow_keys[:2], extra_inputs=mc,
                             note="Out of population (listed manufacturers). Market cap is the 9 Oct 2026 value for both periods.",
                             ratios=dict(zip(["X1", "X2", "X3", "X4", "X5"], zx)), weighted_terms=dict(zip(["X1", "X2", "X3", "X4", "X5"], zt)),
                             zone=zones_altman_z(z), cutoffs="safe > 2.99, grey 1.81 to 2.99, distress < 1.81")
    out["altman_zprime_1983"] = M(Pk, zp, "0.717*WC/TA + 0.847*RE/TA + 3.107*EBIT/TA + 0.420*BookEq/TL + 0.998*Sales/TA" + sfx,
                                  base_keys + flow_keys[:2],
                                  note="Private firm model; coefficients from the earlier note (background knowledge, not verified against the paper).",
                                  ratios=dict(zip(["X1", "X2", "X3", "X4", "X5"], zpx)), weighted_terms=dict(zip(["X1", "X2", "X3", "X4", "X5"], zpt)),
                                  zone=zones_altman_zp(zp), cutoffs="safe > 2.90, grey 1.23 to 2.90, distress < 1.23")
    out["altman_zpp"] = {
        "no_constant": M(Pk, zpp, "6.56*WC/TA + 3.26*RE/TA + 6.72*EBIT/TA + 1.05*BookEq/TL" + sfx, base_keys + flow_keys[:2],
                         ratios=dict(zip(["X1", "X2", "X3", "X4"], zppx)), weighted_terms=dict(zip(["X1", "X2", "X3", "X4"], zppt)),
                         zone=zones_altman_zpp(zpp), cutoffs="safe > 2.6, grey 1.1 to 2.6, distress < 1.1",
                         note="Book equity is total deficit incl. noncontrolling interests (as in the earlier note); the Unisys-only deficit changes X4 by under 0.001."),
        "with_3.25_constant": M(Pk, zpp + 3.25, "Z'' no constant + 3.25" + sfx, base_keys + flow_keys[:2],
                                zone=zones_altman_zpp(zpp + 3.25), cutoffs="same cutoffs as the no constant version"),
    }
    # Ohlson
    ow = dict(oh)
    note = ("Value is null: " + "; ".join(oh["missing"]) + ". Partial sum shown covers every other term. ")
    o_extra = {"terms": oh["terms"], "partial_sum_excluding_missing": oh["partial_sum_excluding_missing"],
               "missing_terms": oh["missing"], "probability": None, "zone": None}
    if Pk == "FY2025":
        ffo_alt = d["NI"] + R["FY2025"]["da"]["value"] + 227.7
        note += ("FFO defined as net income plus D&A = %.1f (FFOTL term %.3f). Adding back the 227.7 non cash pension settlement loss "
                 "would give FFO %.1f. CHIN uses FY2024 and FY2025 attributable net loss. INTWO = 1 (losses in FY2024 and FY2025). "
                 "To reach O <= 0 the SIZE term -0.407*ln(TA/index) would have to be <= -%.2f, i.e. TA/index >= %.0f "
                 "(unit convention of TA, thousands versus millions, is itself undefined without the index)."
                 % (d["FFO"], oh["terms"]["FFOTL"], ffo_alt, oh["partial_sum_excluding_missing"],
                    math.exp(oh["partial_sum_excluding_missing"] / 0.407)))
        o_extra["breakeven_TA_over_index_for_O_equal_zero"] = math.exp(oh["partial_sum_excluding_missing"] / 0.407)
    else:
        note += ("INTWO = 1 (net loss in FY2024, FY2025 and the LTM). Partial sum above excludes SIZE, FFOTL and CHIN; "
                 "the CHIN term can only lie between -0.521 and +0.521 (arithmetic bound), SIZE and FFOTL are unbounded here.")
    out["ohlson"] = M(Pk, None,
                      "O = -1.32 - 0.407 SIZE + 6.03 TLTA - 1.43 WCTA + 0.0757 CLCA - 1.72 OENEG - 2.37 NITA - 1.83 FFOTL + 0.285 INTWO - 0.521 CHIN; P = e^O/(1+e^O)",
                      base_keys + flow_keys[3:4], note=note, **o_extra)
    # Zmijewski
    zmij_note = ("Probit probability = Phi(X). Cutoff X > 0 (P > 0.5) classifies as bankrupt. Set A (TradingView) and set B (recalled, unsourced) from the earlier note; "
                 "a 2026 arXiv paper prints the CACL coefficient of set A with the opposite sign (-0.004), which would move X by about %.3f."
                 % (2 * 0.004 * d["TCA"] / d["TCL"]))
    out["zmijewski"] = {
        "set_A": M(Pk, xa, "X = -4.336 - 4.513*NI/TA + 5.679*TL/TA + 0.004*CA/CL" + sfx, base_keys + [flow_keys[3]], note=zmij_note,
                   probability=pa, zone="distressed" if xa > 0 else "not distressed", coefficient_set="A: -4.336, -4.513, 5.679, 0.004"),
        "set_B": M(Pk, xb, "X = -4.803 - 3.599*NI/TA + 5.406*TL/TA - 0.100*CA/CL" + sfx, base_keys + [flow_keys[3]], note=zmij_note,
                   probability=pb, zone="distressed" if xb > 0 else "not distressed", coefficient_set="B: -4.803, -3.599, 5.406, -0.100"),
    }
    out["springate"] = M(Pk, s, "1.03*WC/TA + 3.07*EBIT/TA + 0.66*EBT/CL + 0.4*Sales/TA" + sfx, base_keys + flow_keys[:3],
                         ratios=dict(zip(["A", "B", "C", "D"], sx)), zone="failing" if s < 0.862 else "not failing", cutoffs="S < 0.862 is failing",
                         note="C uses pre tax loss, now available (earlier note could only bound it).")
    out["grover"] = M(Pk, g, "1.650*WC/TA + 3.404*EBIT/TA - 0.016*NI/TA + 0.057" + sfx, base_keys + [flow_keys[1], flow_keys[3]],
                      ratios=dict(zip(["X1", "X2", "X3"], gx)), zone=grover_zone(g), cutoffs="healthy >= 0.01, distressed <= -0.02, grey between",
                      note="Ignores retained earnings and equity, so it reads healthy.")
    out["taffler"] = M(Pk, None, "Taffler Z (1983)", [],
                       note="Null: the earlier note found no verified coefficients (sources conflict or were never published), and the no credit interval needs cash operating costs not collected.")
    return out


def sens_block(d, Pk):
    base = all_scores(d)
    # scenario A: pension liability moved from liabilities to equity one for one
    dA = dict(d)
    dA["TL"] = d["TL"] - d["PENSION"]
    dA["EQ"] = d["EQ"] + d["PENSION"]
    # scenario B: accumulated deficit set to zero
    dB = dict(d)
    dB["RE"] = 0.0
    # scenario C: EBIT redefined as pre tax result plus interest expense (below operating line pension and other costs included)
    dC = dict(d)
    dC["EBIT"] = d["EBT"] + d["INTEREST"]
    sa, sb, sc = all_scores(dA), all_scores(dB), all_scores(dC)

    def zone_for(name, v):
        if name == "altman_z_1968":
            return zones_altman_z(v)
        if name == "altman_zprime_1983":
            return zones_altman_zp(v)
        if name.startswith("altman_zpp"):
            return zones_altman_zpp(v)
        if name.endswith("_X"):
            return "distressed" if v > 0 else "not distressed"
        if name.endswith("_prob"):
            return None
        if name == "springate":
            return "failing" if v < 0.862 else "not failing"
        if name == "grover":
            return grover_zone(v)
        return None

    def block(sc_, applies):
        out = {}
        for k, v in sc_.items():
            if k in applies.get("na", []):
                out[k] = {"applicable": False, "reason": applies["na_note"]}
                continue
            out[k] = {"value": v, "zone": zone_for(k, v), "change_vs_base": v - base[k]}
        return out

    na_re = ["ohlson_partial_excl_missing", "zmijewski_A_X", "zmijewski_A_prob", "zmijewski_B_X", "zmijewski_B_prob", "springate", "grover"]
    ohA_oenegs = 1 if dA["TL"] > dA["TA"] else 0
    res = {
        "base": {k: {"value": v, "zone": zone_for(k, v)} for k, v in base.items()},
        "pension_moved_from_liabilities_to_equity": {
            "definition": "TL minus %.1f, equity plus %.1f (balance sheet long term pension and postretirement liability moved one for one; ignores tax and AOCI effects)" % (d["PENSION"], d["PENSION"]),
            "adjusted_TL": dA["TL"], "adjusted_equity": dA["EQ"], "OENEG_after": ohA_oenegs,
            "scores": block(sa, {"na": ["springate", "grover"], "na_note": "No liability or equity term in this score; unchanged."}),
        },
        "accumulated_deficit_term_set_to_zero": {
            "definition": "RE set to 0 in every score that has a retained earnings term",
            "scores": block(sb, {"na": na_re, "na_note": "No accumulated deficit term in this score, so not applicable."}),
        },
        "ebit_as_pretax_plus_interest": {
            "definition": "EBIT = pre tax result + interest expense (%.1f + %.1f = %.1f) instead of GAAP operating profit; pulls non operating pension and other costs into EBIT" % (d["EBT"], d["INTEREST"], dC["EBIT"]),
            "scores": block(sc, {"na": ["zmijewski_A_X", "zmijewski_A_prob", "zmijewski_B_X", "zmijewski_B_prob"], "na_note": "No EBIT term in this score."}),
        },
    }
    # Z'' drivers
    zpp, zppx, zppt = f_altman_zpp(d)
    res["zpp_term_decomposition"] = dict(zip(["WC/TA", "RE/TA", "EBIT/TA", "BookEq/TL"], zppt))
    res["zpp_with_constant_if_RE_term_removed"] = zpp - zppt[1] + 3.25
    return res


accounting_scores = {
    "method_notes": [
        "EBIT is GAAP operating profit. Book equity is total deficit incl. noncontrolling interests. Total liabilities = total assets minus total deficit.",
        "Debt is not an input to these scores except through total liabilities, which uses the balance sheet (carrying) basis.",
        "Original Altman Z uses market cap 161.87 (9 Oct 2026) for both periods; period end market caps are not in market_inputs.json.",
        "Taffler: null, no verified coefficients.",
        "Ohlson size term: no GNP price level index in the inputs and no GDP deflator in the market note, so SIZE is null and O is null; partial sums are reported.",
    ],
    "FY2025": score_block("FY2025", D25, "FY2025 (balance sheet 31 Dec 2025, FY2025 flows)"),
    "Q2_2026_LTM": score_block("Q2_2026", DQ, "Q2 2026 (balance sheet 30 Jun 2026, LTM flows to 30 Jun 2026)"),
    "sensitivity": {"FY2025": sens_block(D25, "FY2025"), "Q2_2026_LTM": sens_block(DQ, "Q2_2026")},
}

# Alternative Z with Q2 period end market cap from the market note (price 3.66 on 30 Jun 2026)
mcap_jun = 3.66 * R["MKT"]["shares"]["value"] / 1e6
dQ_alt = dict(DQ)
dQ_alt["MCAP"] = mcap_jun
z_alt = f_altman_z(dQ_alt)[0]
accounting_scores["Q2_2026_LTM"]["altman_z_1968"]["alternative"] = {
    "value": z_alt, "market_cap_musd": mcap_jun,
    "note": "Alternative with the 30 Jun 2026 close of 3.66 quoted in market_data_and_ratings.md (price text only, not in market_inputs.json) times 72,915,955 shares."}

# Comparison with earlier snippet based results
EARLIER = {
    "FY2025": {"altman_z": -0.406, "altman_zp": 0.131, "zpp": -2.988, "zpp_c": 0.262, "zmij_A": 3.005, "zmij_B": 1.898, "grover": 0.516, "springate_ex_C": 0.747, "ohlson_partial": 4.51},
    "Q2_2026_LTM": {"altman_z": -0.754, "altman_zp": -0.081, "zpp": -4.278, "zpp_c": -1.028, "zmij_A": 3.724, "zmij_B": 2.545, "grover": 0.363, "springate_ex_C": 0.678, "ohlson_partial": 4.73},
}
cmp_rows = {}
for per in ("FY2025", "Q2_2026_LTM"):
    s = accounting_scores[per]
    cur = {"altman_z": s["altman_z_1968"]["value"], "altman_zp": s["altman_zprime_1983"]["value"],
           "zpp": s["altman_zpp"]["no_constant"]["value"], "zpp_c": s["altman_zpp"]["with_3.25_constant"]["value"],
           "zmij_A": s["zmijewski"]["set_A"]["value"], "zmij_B": s["zmijewski"]["set_B"]["value"], "grover": s["grover"]["value"]}
    cmp_rows[per] = [{"metric": k, "now": cur[k], "earlier_note": EARLIER[per][k], "difference": cur[k] - EARLIER[per][k]} for k in cur]
accounting_scores["comparison_with_earlier_note"] = cmp_rows
accounting_scores["comparison_with_earlier_note_remarks"] = (
    "Differences come from: market cap 161.87 versus 177.9 in original Z; none for Z'', Zmijewski and Grover, which use the same "
    "balance sheet and flow inputs. Springate and Ohlson earlier values were bounds or partial sums, now complete or partial with a different term set.")

# --------------------------------------------------------------------------------------
# 3. CASH AND LEVERAGE
# --------------------------------------------------------------------------------------
def lev_row(Pk, debt_key, cash_key, deficit_val, deficit_src, ebitda_key, label, deficit_note=""):
    e = R[Pk]
    debt, cash, ebitda = e[debt_key]["value"], e[cash_key]["value"], e[ebitda_key]["value"]
    r = {
        "label": label,
        "gross_debt_plus_pension_over_adj_ebitda": (debt + deficit_val) / ebitda,
        "net_debt_plus_pension_over_adj_ebitda": (debt + deficit_val - cash) / ebitda,
        "gross_debt_over_adj_ebitda_excl_pension": debt / ebitda,
        "net_debt_over_adj_ebitda_excl_pension": (debt - cash) / ebitda,
        "inputs": {"debt": {"value": debt, "source": src(e[debt_key])}, "pension_deficit": {"value": deficit_val, "source": deficit_src},
                   "cash": {"value": cash, "source": src(e[cash_key])}, "adj_ebitda": {"value": ebitda, "source": src(e[ebitda_key])}},
        "formula": "(debt + pension deficit [- cash]) / Adjusted EBITDA",
        "note": deficit_note,
    }
    return r


lev = {}
lev["FY2024"] = lev_row("FY2024", "total_debt", "cash", R["FY2024"]["pension_deficit"]["value"], src(R["FY2024"]["pension_deficit"]),
                        "adj_ebitda", "31 Dec 2024, FY2024 Adjusted EBITDA 292.1, carrying debt")
lev["FY2025"] = lev_row("FY2025", "total_debt", "cash", R["FY2025"]["pension_deficit"]["value"], src(R["FY2025"]["pension_deficit"]),
                        "adj_ebitda", "31 Dec 2025, FY2025 Adjusted EBITDA 278.8, carrying debt (primary)")
lev["FY2025"]["alt_face_debt"] = {
    "gross_incl_pension": (R["FY2025"]["total_debt_face"]["value"] + R["FY2025"]["pension_deficit"]["value"]) / R["FY2025"]["adj_ebitda"]["value"],
    "net_incl_pension": (R["FY2025"]["total_debt_face"]["value"] + R["FY2025"]["pension_deficit"]["value"] - R["FY2025"]["cash"]["value"]) / R["FY2025"]["adj_ebitda"]["value"],
    "net_excl_pension": (R["FY2025"]["total_debt_face"]["value"] - R["FY2025"]["cash"]["value"]) / R["FY2025"]["adj_ebitda"]["value"],
    "note": "Face debt 754.5 at 31 Dec 2025 (source: Q2 ledger derived face). Matches the earlier derived 2.83x and 1.22x."}
lev["Q2_2026_LTM"] = lev_row("Q2_2026", "total_debt", "cash", R["Q2_2026"]["pension_deficit_stale"]["value"], src(R["Q2_2026"]["pension_deficit_stale"]),
                             "adj_ebitda_ltm", "30 Jun 2026, LTM Adjusted EBITDA 276.9, carrying debt (primary), pension deficit 448.5 stale from 31 Dec 2025",
                             deficit_note="No 30 Jun 2026 funding deficit is stated in the filings; 448.5 (31 Dec 2025) is the last stated figure, so these are upper bound style figures if the deficit has fallen.")
lev["Q2_2026_LTM"]["alt_face_debt"] = {
    "gross_incl_pension": (R["Q2_2026"]["total_debt_face"]["value"] + R["Q2_2026"]["pension_deficit_stale"]["value"]) / R["Q2_2026"]["adj_ebitda_ltm"]["value"],
    "net_incl_pension": (R["Q2_2026"]["total_debt_face"]["value"] + R["Q2_2026"]["pension_deficit_stale"]["value"] - R["Q2_2026"]["cash"]["value"]) / R["Q2_2026"]["adj_ebitda_ltm"]["value"],
    "net_excl_pension": (R["Q2_2026"]["total_debt_face"]["value"] - R["Q2_2026"]["cash"]["value"]) / R["Q2_2026"]["adj_ebitda_ltm"]["value"],
    "note": "Face debt 745.0. Gives the 3.14x and 1.52x in the 10-Q note."}
lev["Q2_2026_LTM"]["alt_balance_sheet_pension"] = {
    "pension_measure": R["Q2_2026"]["pension_bs_net"]["value"],
    "net_incl_pension": (R["Q2_2026"]["total_debt"]["value"] + R["Q2_2026"]["pension_bs_net"]["value"] - R["Q2_2026"]["cash"]["value"]) / R["Q2_2026"]["adj_ebitda_ltm"]["value"],
    "gross_incl_pension": (R["Q2_2026"]["total_debt"]["value"] + R["Q2_2026"]["pension_bs_net"]["value"]) / R["Q2_2026"]["adj_ebitda_ltm"]["value"],
    "note": "Uses the 30 Jun 2026 balance sheet net pension position (485.1 liability less 38.2 prepaid asset = 446.9). Different measure from the funding deficit."}

# interest coverage
def cover(label, adj_ebitda, ocf, interest, pension_contrib, src_note):
    return {"label": label, "interest_expense": interest, "adj_ebitda": adj_ebitda, "cash_from_operations": ocf,
            "pension_contributions": pension_contrib,
            "adj_ebitda_over_interest": adj_ebitda / interest,
            "ocf_over_interest": ocf / interest,
            "ocf_before_pension_over_interest": (ocf + pension_contrib) / interest,
            "formula": "Adjusted EBITDA / interest expense; cash from operations / interest expense; (cash from operations + pension and postretirement contributions) / interest expense",
            "note": src_note}


h26_ebitda = R["Q2_2026"]["adj_ebitda_h1_26"]["value"]
coverage = {
    "FY2024": cover("FY2024", R["FY2024"]["adj_ebitda"]["value"], R["FY2024"]["ocf"]["value"], R["FY2024"]["interest"]["value"], R["FY2024"]["pension_contrib"]["value"], "Interest expense is the income statement line (gross)."),
    "FY2025": cover("FY2025", R["FY2025"]["adj_ebitda"]["value"], R["FY2025"]["ocf"]["value"], R["FY2025"]["interest"]["value"], R["FY2025"]["pension_contrib"]["value"], "FY2025 interest only includes six months of the 10.625% notes and the old 6.875% notes for part of the year."),
    "H1_2026": cover("H1 2026", h26_ebitda, R["Q2_2026"]["ocf_h1_26"]["value"], R["Q2_2026"]["interest_h1_26"]["value"], R["Q2_2026"]["pension_contrib_h1_26"]["value"], "Half year ratios, not annualised."),
    "LTM_Jun_2026": cover("LTM to 30 Jun 2026", R["Q2_2026"]["adj_ebitda_ltm"]["value"], R["Q2_2026"]["ocf_ltm"]["value"], R["Q2_2026"]["interest_ltm"]["value"], R["Q2_2026"]["pension_contrib_ltm"]["value"], "LTM = FY2025 minus H1 2025 plus H1 2026."),
}

# free cash flow
def fcf_row(label, ocf, capex, contrib, company_val):
    f = ocf - capex
    return {"label": label, "cash_from_operations": ocf, "capex": capex, "fcf_company_definition_computed": f,
            "fcf_company_definition_reported": company_val, "difference_computed_vs_reported": (None if company_val is None else f - company_val),
            "pension_and_postretirement_contributions": contrib,
            "fcf_before_pension_contributions": f + contrib,
            "note": "The company definition (cash from operations less capex) is already after pension contributions, because they sit in operating cash flow. "
                    "The 'before pension' line adds them back (matches the company's pre pension FCF)."}


fcf = {
    "FY2024": fcf_row("FY2024", R["FY2024"]["ocf"]["value"], R["FY2024"]["capex"]["value"], R["FY2024"]["pension_contrib"]["value"], R["FY2024"]["fcf_company"]["value"]),
    "FY2025": fcf_row("FY2025", R["FY2025"]["ocf"]["value"], R["FY2025"]["capex"]["value"], R["FY2025"]["pension_contrib"]["value"], R["FY2025"]["fcf_company"]["value"]),
    "H1_2026": fcf_row("H1 2026", R["Q2_2026"]["ocf_h1_26"]["value"], R["Q2_2026"]["capex_h1_26"]["value"], R["Q2_2026"]["pension_contrib_h1_26"]["value"], R["Q2_2026"]["fcf_h1_26"]["value"]),
    "LTM_Jun_2026": fcf_row("LTM to 30 Jun 2026", R["Q2_2026"]["ocf_ltm"]["value"], R["Q2_2026"]["capex_ltm"]["value"], R["Q2_2026"]["pension_contrib_ltm"]["value"], R["Q2_2026"]["fcf_ltm_company"]["value"]),
}

# liquidity
liq = {
    "FY2025": {"cash": R["FY2025"]["cash"]["value"], "abl_availability": R["FY2025"]["abl_avail"]["value"],
               "liquidity": R["FY2025"]["cash"]["value"] + R["FY2025"]["abl_avail"]["value"],
               "source": [src(R["FY2025"]["cash"]), src(R["FY2025"]["abl_avail"])]},
    "Q2_2026": {"cash": R["Q2_2026"]["cash"]["value"], "abl_availability": R["Q2_2026"]["abl_avail"]["value"],
                "liquidity": R["Q2_2026"]["cash"]["value"] + R["Q2_2026"]["abl_avail"]["value"],
                "ledger_derived_check": R["Q2_2026"]["liquidity_ledger"]["value"],
                "source": [src(R["Q2_2026"]["cash"]), src(R["Q2_2026"]["abl_avail"])],
                "note": "Of the 324.3 cash, 197.6 is held by foreign subsidiaries (10-Q ledger)."},
}

# --- runway ---
G = "GUIDE"
inp(G, "fcf_2026", Q, "FY2026 free cash flow guidance (Investor Day deck)", "2026-06-02")
inp(G, "capex_2026", Q, "FY2026 capital expenditures guidance (Investor Day deck)", "2026-06-02")
inp(G, "taxes_2026", Q, "FY2026 cash taxes guidance (Investor Day deck)", "2026-06-02")
inp(G, "net_interest_2026", Q, "FY2026 net interest payments guidance (Investor Day deck)", "2026-06-02")
inp(G, "other_2026", Q, "FY2026 other payments (primarily restructuring) guidance (Investor Day deck)", "2026-06-02")
inp(G, "pension_2026", Q, "2026 pension and postretirement contributions guidance (Investor Day deck)", "FY2026")
inp(G, "pension_2027", FY, "Estimated cash contributions to global DB plans: 2027", "FY2027 estimate")
inp(G, "pension_2028_30_agg", FY, "Estimated cash contributions to global DB plans: 2028 to 2030 in aggregate", "FY2028-FY2030")
inp(G, "notes_face", Q, "10.625% senior secured notes due 2031, face value outstanding", "2026-06-30")
inp(G, "coupon_pct", Q, "2031 notes coupon", "2025-06-27")
inp(G, "revenue_2025", Q, "Revenue, FY2025 (base for guidance dollar translation)", "FY2025")
inp(G, "h2_fcf_ledger", Q, "FY2026 implied H2 free cash flow if the full-year guide of ~(25) is met (derived)", "H2 2026")
# guidance ranges are text in the ledger; parse the numbers once, explicitly
GUIDE_CC_LOW, GUIDE_CC_HIGH = -5.0, -3.5      # (5.0)% to (3.5)% constant currency, ledger text
MARGIN_LOW, MARGIN_HIGH = 9.0, 11.0           # 9.0% to 11.0% non GAAP operating margin, ledger text
rg = Q.find("FY2026 revenue guidance, Q2 release: reaffirmed previously raised range", "2026-07-29", why="runway guidance range")
assert rg["unit"] == "(5.0)% to (3.5)%"
mg = Q.find("FY2026 non-GAAP operating profit margin guidance (Q2 release, maintained)", "2026-07-29", why="runway guidance range")
assert mg["unit"] == "9.0% to 11.0%"
g = {k: R[G][k]["value"] for k in R[G]}
cash0 = R["Q2_2026"]["cash"]["value"]
fcf_h1 = R["Q2_2026"]["fcf_h1_26"]["value"]
h2 = g["fcf_2026"] - fcf_h1
assert abs(h2 - g["h2_fcf_ledger"]) < 1e-9
decline = (GUIDE_CC_LOW + GUIDE_CC_HIGH) / 2.0 / 100.0    # -4.25% midpoint
margin = (MARGIN_LOW + MARGIN_HIGH) / 2.0 / 100.0          # 10% midpoint
rev = {2025: g["revenue_2025"]}
rev[2026] = rev[2025] * (1 + decline)
op_profit = {2026: rev[2026] * margin}
base_pre = g["fcf_2026"] + g["capex_2026"] + g["taxes_2026"] + g["net_interest_2026"] + g["other_2026"] + g["pension_2026"]
K = base_pre - op_profit[2026]            # D&A and other non profit cash items implied by guidance, held flat
interest_cash = g["notes_face"] * g["coupon_pct"] / 100.0
pension_sched = {2027: g["pension_2027"], 2028: g["pension_2028_30_agg"] / 3.0, 2029: g["pension_2028_30_agg"] / 3.0, 2030: g["pension_2028_30_agg"] / 3.0}


def runway(method):
    rows = []
    cash = cash0
    rows.append({"year": "30 Jun 2026 (start)", "revenue": None, "fcf_after_pension": None, "cash_end": cash0})
    cash = cash0 + h2
    r26 = {"year": "2026", "revenue": rev[2026], "fcf_full_year_guidance": g["fcf_2026"], "fcf_h1_actual": fcf_h1,
           "fcf_h2_remainder": h2, "fcf_after_pension": h2, "cash_end": cash,
           "shortfall_vs_698_4": g["notes_face"] - cash, "note": "H2 only counts from the 30 Jun 2026 start; full year guidance is about -25."}
    rows.append(r26)
    r = rev[2026]
    for y in (2027, 2028, 2029, 2030):
        r = r * (1 + decline)
        rev[y] = r
        op = r * margin
        if method == "margin":
            pre = op + K
        else:   # scale the whole pre item base with revenue
            pre = base_pre * (r / rev[2026])
        f = pre - g["capex_2026"] - g["taxes_2026"] - g["other_2026"] - interest_cash - pension_sched[y]
        cash = cash + f
        rows.append({"year": str(y), "revenue": r, "non_gaap_op_profit_at_10pct": op, "pre_item_cash": pre, "capex": g["capex_2026"],
                     "cash_taxes": g["taxes_2026"], "other_payments": g["other_2026"], "cash_interest": interest_cash,
                     "pension_contributions": pension_sched[y], "fcf_after_pension": f, "cash_end": cash,
                     "shortfall_vs_698_4": g["notes_face"] - cash})
    final_coupon = g["notes_face"] * g["coupon_pct"] / 100.0 / 2.0
    rows.append({"year": "15 Jan 2031 (maturity)", "cash_end": cash, "principal_due": g["notes_face"], "final_coupon_due": final_coupon,
                 "shortfall_vs_698_4": g["notes_face"] - cash, "shortfall_incl_final_coupon": g["notes_face"] + final_coupon - cash,
                 "note": "Cash before any 2031 flows equals end 2030 cash; the final coupon is paid with the principal."})
    return rows


rw_margin = runway("margin")
rw_scale = runway("scale")


def break_even(start_cash, start_label, h2_flow):
    """FCF after pension equal to zero for the remaining years."""
    rows = [{"year": "30 Jun 2026 (start)", "cash_end": cash0}]
    c = cash0 + h2_flow
    rows.append({"year": "2026", "fcf_after_pension": h2_flow, "cash_end": c, "shortfall_vs_698_4": g["notes_face"] - c})
    for y in (2027, 2028, 2029, 2030):
        rows.append({"year": str(y), "fcf_after_pension": 0.0, "cash_end": c, "shortfall_vs_698_4": g["notes_face"] - c})
    rows.append({"year": "15 Jan 2031 (maturity)", "cash_end": c, "shortfall_vs_698_4": g["notes_face"] - c,
                 "shortfall_incl_final_coupon": g["notes_face"] + g["notes_face"] * g["coupon_pct"] / 200.0 - c})
    return {"label": start_label, "rows": rows}


be_zero_from_july = break_even(cash0, "FCF after pension zero from 1 Jul 2026 (H2 2026 also zero)", 0.0)
be_after_guided_h2 = break_even(cash0, "H2 2026 at guidance (+49.5), then zero for 2027 to 2030", h2)
cash_end_2026 = cash0 + h2
req_fcf = (g["notes_face"] - cash_end_2026) / 4.0
req_fcf_coupon = (g["notes_face"] + g["notes_face"] * g["coupon_pct"] / 200.0 - cash_end_2026) / 4.0

runway_block = {
    "label": "Arithmetic on stated guidance held flat, not a forecast.",
    "inputs": {"cash_30_jun_2026": R["Q2_2026"]["cash"]["value"], "fcf_h1_2026_actual": fcf_h1,
               "fcf_2026_guidance": g["fcf_2026"], "h2_2026_remainder": h2, "capex_per_year": g["capex_2026"],
               "cash_taxes_per_year": g["taxes_2026"], "other_payments_per_year": g["other_2026"],
               "net_interest_2026_guidance": g["net_interest_2026"], "pension_and_postretirement_2026": g["pension_2026"],
               "notes_face": g["notes_face"], "coupon_pct": g["coupon_pct"], "cash_interest_2027_30": interest_cash,
               "revenue_decline_per_year_constant_currency_midpoint": decline, "non_gaap_margin_midpoint": margin,
               "revenue_2025": rev[2025], "pension_2027_10k": g["pension_2027"], "pension_2028_30_aggregate_10k": g["pension_2028_30_agg"],
               "pension_2028_29_30_each": g["pension_2028_30_agg"] / 3.0,
               "pre_item_cash_base_2026": base_pre, "implied_non_profit_cash_items_K": K},
    "sources": {k: src(R[G][k]) for k in R[G]},
    "method": [
        "Start: cash 324.3 at 30 Jun 2026. H2 2026 FCF = full year guidance (-25) minus H1 actual (-74.5) = +49.5; end 2026 cash = 373.8.",
        "2026 pre item cash base = FCF guidance + capex 85 + cash taxes 70 + net interest 70 + other payments 30 + pension and postretirement 102 = 332 (arithmetic on the Investor Day guidance items).",
        "2027 to 2030: revenue falls 4.25% a year (midpoint of constant currency (5.0)% to (3.5)%); non GAAP operating margin held at 10% (midpoint of 9% to 11%); "
        "pre item cash = revenue x 10% + K, K = 332 - 2026 margin profit (D&A and other non profit items implied by guidance, held flat).",
        "Deductions each year: capex 85, cash taxes 70, other payments 30 (all held at 2026 guidance), cash interest 698.4 x 10.625% = 74.2, pension per the 10-K schedule: 105 for 2027; 241 for 2028 to 2030 spread evenly (80.33 a year; the 10-K gives no split by year).",
        "Not modelled: the other debt amortisation and finance lease payments (5.4, 4.3, 2.4, 1.2, 0.0 scheduled excl. leases), FX, any ABL draw, any note repurchases, postretirement contributions after 2026 (about 3 a year, not in the 10-K DB schedule), working capital swings.",
        "The 2027 DB figure is 105 in the 10-K and Q1 10-Q, 104 in the Q2 10-Q; the spec figure 105 is used.",
        "Pension 2026 uses the 102 Investor Day figure (pension plus postretirement) because the 332 base is built from the deck items. The 10-Q basis is 97 + 3 = 100.",
    ],
    "table_margin_method_primary": rw_margin,
    "table_scale_all_alternative": rw_scale,
    "alternative_note": "Alternative scales the whole 332 base with revenue (more conservative because D&A style items fall too).",
    "break_even_rows": {"fcf_after_pension_zero_from_1_jul_2026": be_zero_from_july, "h2_2026_at_guidance_then_zero": be_after_guided_h2},
    "required_average_fcf_2027_30_to_repay_principal": req_fcf,
    "required_average_fcf_2027_30_to_repay_principal_and_final_coupon": req_fcf_coupon,
    "shortfall_jan_2031_primary": rw_margin[-1]["shortfall_vs_698_4"],
    "shortfall_jan_2031_scale_alternative": rw_scale[-1]["shortfall_vs_698_4"],
    "shortfall_after_using_current_abl_availability_primary": rw_margin[-1]["shortfall_vs_698_4"] - R["Q2_2026"]["abl_avail"]["value"],
    "abl_note": "ABL (125 commitment, 99.7 available at 30 Jun 2026) matures June 2030, before the January 2031 notes, so it is not treated as a source for the maturity.",
}

cash_and_leverage = {
    "pension_adjusted_leverage": lev,
    "interest_coverage": coverage,
    "free_cash_flow": fcf,
    "liquidity": liq,
    "runway": runway_block,
}

# --------------------------------------------------------------------------------------
# 4. MARKET
# --------------------------------------------------------------------------------------
E = R["MKT"]["market_cap_musd"]["value"]
F = R["MKT"]["debt_F_musd"]["value"]
sigE = R["MKT"]["sigma_E"]["value"]


def naive_dd(E_, F_, sig_e, mu, T=1.0):
    V = E_ + F_
    sig_d = 0.05 + 0.25 * sig_e
    sig_v = E_ / V * sig_e + F_ / V * sig_d
    dd = (math.log(V / F_) + (mu - 0.5 * sig_v ** 2) * T) / (sig_v * math.sqrt(T))
    return {"V": V, "sigma_D": sig_d, "sigma_V": sig_v, "DD": dd, "PD": Phi(-dd)}


mu_main = R["MKT"]["return_1y"]["value"]
mu_rf = R["MKT"]["rf_1y_pct"]["value"] / 100.0
dd_main = naive_dd(E, F, sigE, mu_main)
dd_rf = naive_dd(E, F, sigE, mu_rf)
F_face = R["Q2_2026"]["total_debt_face"]["value"]
dd_main_face = naive_dd(E, F_face, sigE, mu_main)
dd_rf_face = naive_dd(E, F_face, sigE, mu_rf)

dd_formula = "V = E + F; sigma_D = 0.05 + 0.25 sigma_E; sigma_V = E/V sigma_E + F/V sigma_D; DD = [ln(V/F) + (mu - 0.5 sigma_V^2) T] / (sigma_V sqrt T); PD = N(-DD); T = 1"
mk_in = lambda keys: {k: {"value": R["MKT"][k]["value"], "source": "%s | %s | %s" % (R["MKT"][k]["ledger"], R["MKT"][k]["item"], R["MKT"][k]["period"])} for k in keys}

bond = mk["bond"]


def bond_pd(ytm_pct, tsy_pct, years, R_):
    s = (ytm_pct - tsy_pct) / 100.0
    lam = s / (1 - R_)
    return {"spread": s, "hazard": lam, "pd_1y": 1 - math.exp(-lam), "pd_cum_to_maturity": 1 - math.exp(-lam * years), "recovery": R_}


bond_main = {R_: bond_pd(bond["ytm_reported"], bond["main"]["treasury"], bond["years_to_maturity"], R_) for R_ in (0.4, 0.6)}
fv_ytm = bond["q2_10q_fair_value"]["ytm_recomputed"]
fv_tsy = bond["q2_10q_fair_value"]["treasury"]
bond_fv = {R_: bond_pd(fv_ytm, fv_tsy, bond["years_to_maturity"], R_) for R_ in (0.4, 0.6)}

mcap_base_1y = R["MKT"]["base_close_1y"]["value"] * R["MKT"]["shares"]["value"] / 1e6

market = {
    "naive_distance_to_default": {
        "drift_mu_equals_1y_stock_return": M("MKT", dd_main["DD"], dd_formula + "; mu = past 1 year stock return",
                                             ["market_cap_musd", "debt_F_musd", "sigma_E", "return_1y"],
                                             note="Debt F is 10-Q carrying total debt 733.5; volatility taken as is from market_inputs.json.",
                                             PD=dd_main["PD"], V=dd_main["V"], sigma_D=dd_main["sigma_D"], sigma_V=dd_main["sigma_V"], mu=mu_main,
                                             published_in_market_inputs={"DD": mk["merton_naive_main"]["DD"], "PD": mk["merton_naive_main"]["PD"]}),
        "drift_mu_equals_1y_treasury": M("MKT", dd_rf["DD"], dd_formula + "; mu = 1 year Treasury 4.47%",
                                         ["market_cap_musd", "debt_F_musd", "sigma_E", "rf_1y_pct"],
                                         note="Sensitivity drift; the two rows are not averaged.",
                                         PD=dd_rf["PD"], V=dd_rf["V"], sigma_D=dd_rf["sigma_D"], sigma_V=dd_rf["sigma_V"], mu=mu_rf,
                                         published_in_market_inputs={"DD": mk["merton_naive_mu_equals_1y_treasury"]["DD"], "PD": mk["merton_naive_mu_equals_1y_treasury"]["PD"]}),
        "alt_face_debt_745": {"drift_1y_return": dd_main_face, "drift_1y_treasury": dd_rf_face,
                              "note": "Same model with F = face debt 745.0 instead of carrying 733.5."},
    },
    "bond_implied_default_probability": {
        "quote": {"price": bond["price"], "ytm_pct": bond["ytm_reported"], "date": bond["quote_date"],
                  "treasury_matched_pct": bond["main"]["treasury"], "years_to_maturity": bond["years_to_maturity"],
                  "source": "market_inputs.json bond (FINRA feed via TradingView); one print, 200,000 face on the bar; indicative"},
        "formula": "spread s = YTM - matched Treasury; hazard = s/(1-R); PD(1y) = 1 - exp(-hazard); cumulative = 1 - exp(-hazard*T)",
        "recovery_40": bond_main[0.4],
        "recovery_60": bond_main[0.6],
        "alt_10q_fair_value_30jun2026": {"recovery_40": bond_fv[0.4], "recovery_60": bond_fv[0.6], "ytm_pct": fv_ytm, "treasury_pct": fv_tsy,
                                          "note": "10-Q Level 2 fair value 658.0 on face 698.4 (implied price 94.2), Treasury 4.18% on 30 Jun 2026."},
        "published_cross_check": {"pd_1y_R40_in_market_inputs": bond["main"]["pd_1y"], "pd_1y_R30": bond["alt_R30"]["pd_1y"], "pd_1y_R50": bond["alt_R50"]["pd_1y"]},
        "caveat": "Risk neutral hazard including liquidity and risk premia; overstates the real world PD. A single thinly traded print.",
    },
    "equity_value_over_total_debt": {
        "carrying_debt": M("MKT", E / F, "market cap / total debt (carrying 733.5)", ["market_cap_musd", "debt_F_musd"]),
        "face_debt": {"value": E / F_face, "formula": "market cap / total debt face 745.0"},
        "equity_over_debt_plus_equity": E / (E + F),
    },
    "one_year_change_in_market_cap": M("MKT", E - mcap_base_1y, "market cap now - (close on 2025-10-09 x 72,915,955 shares)",
                                       ["market_cap_musd", "base_close_1y", "shares"],
                                       note="Constant share count (72,915,955) applied to both dates, so the percentage equals the price return. Shares in Oct 2025 were fewer (about 71.3m in Jan 2026 per 10-K cover), so the true market cap change is slightly different.",
                                       base_market_cap_musd=mcap_base_1y, pct_change=E / mcap_base_1y - 1),
}

# --------------------------------------------------------------------------------------
# 5. RATING MAP
# --------------------------------------------------------------------------------------
rt = Q_ = FY.find("Credit ratings", "FY2025 (31 Dec 2025)", why="rating")
sp_B = mk["default_tables"]["sp_2024_study_table24_1981_2024_global_corporates_secondary"]["B"]
sp_C = mk["default_tables"]["sp_2024_study_table24_1981_2024_global_corporates_secondary"]["CCC/C"]
bond_pd1 = bond_main[0.4]["pd_1y"]
frac = (bond_pd1 * 100 - sp_B["1y"]) / (sp_C["1y"] - sp_B["1y"])
rating_map = {
    "ratings": {"sp": "B (stable)", "moodys": "B2 (stable)", "value_text": rt["value"], "source_grade": "primary",
                "source": "FY2025 10-K risk factor (ledger item 'Credit ratings')", "quote": rt["quote"], "url": rt["url"],
                "caveat": "Status at 25 Feb 2026. The Q2 2026 10-Q has no rating sentence; no 2026 rating action found; issue rating on the 2031 notes not found (null)."},
    "default_rate_table_B_sp_pct": {
        "values": sp_B, "grade": "secondary", "source": mk["default_tables"]["sp_2024_study_table24_1981_2024_global_corporates_secondary"]["source"],
        "ccc_c_pct": sp_C, "bb_pct": mk["default_tables"]["sp_2024_study_table24_1981_2024_global_corporates_secondary"]["BB"]},
    "issue_rating_2031_notes": {"value": None, "grade": None,
                                "note": "Null: no issue level rating or recovery rating on the 10.625% 2031 notes found from either agency (market_inputs.json ratings.issue_rating_2031_notes is null)."},
    "default_rate_table_B2_moodys": {
        "value": None, "grade": None,
        "note": mk["default_tables"]["moodys_annual_default_study"] + " Null: no current Moody's table retrieved; a 2004 snippet exists but is too old to use."},
    "compare_to_market_signals": {
        "bond_implied_pd_1y_R40_pct": bond_pd1 * 100, "sp_B_1y_pct": sp_B["1y"], "ratio_bond_to_B_1y": bond_pd1 * 100 / sp_B["1y"],
        "bond_pd_1y_position_between_B_and_CCC_C": frac,
        "bond_cumulative_to_maturity_4.27y_R40_pct": bond_main[0.4]["pd_cum_to_maturity"] * 100, "sp_B_5y_pct": sp_B["5y"], "sp_CCC_C_5y_pct": sp_C["5y"],
        "naive_dd_pd_pct": {"mu_1y_return": dd_main["PD"] * 100, "mu_1y_treasury": dd_rf["PD"] * 100},
        "note": "Historical agency default rates are physical probabilities; the bond figure is risk neutral. The comparison shows the market prices Unisys between B and CCC/C, not that default is 11.5% likely."},
}

# --------------------------------------------------------------------------------------
# 6. CONFLICTS RESOLVED
# --------------------------------------------------------------------------------------
def qref(ledger, item, period):
    r = ledger.find(item, period, why="conflict quote")
    return {"ledger": ledger.name, "item": r["item"], "period": r["period"], "value": r["value"] if r["value"] is not None else r["unit"],
            "quote": r["quote"], "url": r["url"]}


cash_mar = Q.find("Cash and cash equivalents", "2026-03-31", why="conflict 2 reproduction")["value"]
face_mar = Q.find("Total debt at face value (derived)", "2026-03-31", why="conflict 2 reproduction")["value"]
q1_25 = Q.find("Adjusted EBITDA (company definition)", "Q1 2025", why="conflict 2 reproduction")["value"]
q1_26 = Q.find("Adjusted EBITDA (company definition)", "Q1 2026", why="conflict 2 reproduction")["value"]
ebitda_mar = R["FY2025"]["adj_ebitda"]["value"] - q1_25 + q1_26
dfc_dec = R["FY2025"]["pension_deficit_company"]["value"]
lev_mar_incl = (face_mar + dfc_dec - cash_mar) / ebitda_mar
lev_mar_excl = (face_mar - cash_mar) / ebitda_mar
stated_mar = Q.find("Net leverage including pension as stated by company at 31 Mar 2026 (Investor Day deck)", "2026-03-31", why="conflict 2")["value"]
slide_total = Q.find("Total debt including pension, company slide figure", "2026-03-31", why="conflict 1")["value"]

fcf_q2_parts = (Q.find("Cash used for operations (release FCF table)", "Q2 2026 (3 months", why="conflict 5")["value"],
                Q.find("Additions to marketable software (release FCF table)", "Q2 2026 (3 months", why="conflict 5")["value"],
                Q.find("Additions to properties and other assets (release FCF table)", "Q2 2026 (3 months", why="conflict 5")["value"])
fcf_q2_calc = sum(fcf_q2_parts)

rev25 = rev[2025]
conflicts = [
    {"n": 1, "topic": "Total debt", "supported_figure": "733.5 carrying at 30 Jun 2026 (741.7 at 31 Dec 2025); face 745.0",
     "value": R["Q2_2026"]["total_debt"]["value"],
     "detail": {"carrying_30_jun_2026": 733.5, "face_30_jun_2026": R["Q2_2026"]["total_debt_face"]["value"], "carrying_31_dec_2025": R["FY2025"]["total_debt"]["value"],
                "slide_1198_2_is_debt_plus_pension": slide_total, "slide_reconciliation": "face 749.7 (31 Mar 2026) + pension deficit 448.5 = %.1f" % (face_mar + dfc_dec),
                "aggregator_729": "is the 31 Dec 2025 long term debt line (729.0), not total debt"},
     "quote_refs": [qref(Q, "Total debt, carrying amount (current plus long-term), MD&A statement", "2026-06-30"), qref(Q, "Total debt (carrying amount)", "2025-12-31"),
                    qref(Q, "Total debt including pension, company slide figure", "2026-03-31")]},
    {"n": 2, "topic": "Net leverage", "supported_figure": "About 1.5x excluding pension and about 3.1x including pension at 30 Jun 2026; company stated 2.9x at 31 Mar 2026",
     "value": lev["Q2_2026_LTM"]["alt_face_debt"]["net_incl_pension"],
     "detail": {"30_jun_2026_net_excl_pension_face": lev["Q2_2026_LTM"]["alt_face_debt"]["net_excl_pension"],
                "30_jun_2026_net_excl_pension_carrying": lev["Q2_2026_LTM"]["net_debt_over_adj_ebitda_excl_pension"],
                "30_jun_2026_net_incl_pension_face": lev["Q2_2026_LTM"]["alt_face_debt"]["net_incl_pension"],
                "30_jun_2026_net_incl_pension_carrying": lev["Q2_2026_LTM"]["net_debt_plus_pension_over_adj_ebitda"],
                "31_mar_2026_net_incl_pension_recomputed": lev_mar_incl, "31_mar_2026_net_excl_pension_recomputed": lev_mar_excl,
                "31_mar_2026_company_stated": stated_mar, "31_dec_2025_net_incl_pension_face": lev["FY2025"]["alt_face_debt"]["net_incl_pension"],
                "31_dec_2025_net_excl_pension_face": lev["FY2025"]["alt_face_debt"]["net_excl_pension"],
                "dates": "2.8x is 31 Dec 2025, 2.9x is 31 Mar 2026, 3.1x is 30 Jun 2026 if the deficit did not move. The company states no 30 Jun 2026 ratio and no '1.3x excluding pension' (1.30x is the 31 Mar 2026 figure)."},
     "quote_refs": [qref(Q, "Net leverage including pension as stated by company at 31 Mar 2026 (Investor Day deck)", "2026-03-31"),
                    qref(Q, "LTM adjusted EBITDA at 2026-06-30", "2026-06-30")]},
    {"n": 3, "topic": "2026 pension contributions", "supported_figure": "97 for the defined benefit plans (Q2 10-Q); 100 with postretirement; 102 in the Investor Day deck; 87 is superseded",
     "value": Q.find("Expected total 2026 global DB contributions (Q2 10-Q)", "FY2026", why="conflict 3")["value"],
     "detail": {"db_q2_10q": 97.0, "us": 47.0, "international": 50.0, "postretirement": 3.0, "db_plus_postretirement": 100.0, "investor_day": 102.0,
                "superseded_10k": 87.0, "paid_h1_2026_db": 57.4, "expected_h2_2026_db": 40.0, "gap_between_100_and_102": "not explained in any filing read"},
     "quote_refs": [qref(Q, "Expected total 2026 global DB contributions (Q2 10-Q)", "FY2026"),
                    qref(Q, "2026 pension and postretirement contributions guidance (Investor Day deck)", "FY2026"),
                    qref(Q, "Expected total 2026 global DB contributions (FY2025 10-K, superseded)", "FY2026")]},
    {"n": 4, "topic": "Mid 2026 pension deficit", "supported_figure": "Not stated in any filing. Last stated: 448.5 funding deficit at 31 Dec 2025. Balance sheet net position at 30 Jun 2026 is 446.9 (different measure)",
     "value": None,
     "note": "Null: the Q2 2026 filings say only that the estimated global deficit is improving; no 30 Jun 2026 funding deficit exists to quote. The 30 million improvement in secondary sources is not in the filings (the nearest filed number is the 32.6 fall in the long term liability line).",
     "detail": {"last_stated_31_dec_2025": dfc_dec, "bs_net_position_30_jun_2026": R["Q2_2026"]["pension_bs_net"]["value"],
                "bs_net_position_31_dec_2025": Q.find("Net balance sheet pension position (derived)", "2025-12-31", why="conflict 4")["value"],
                "bs_liability_change_h1_2026": Q.find("Reported long-term pension and postretirement liability change in H1 2026 (derived)", "H1 2026", why="conflict 4")["value"]},
     "quote_refs": [qref(Q, "Defined benefit pension funding deficit, 31 Dec 2025 (company release)", "2025-12-31"),
                    qref(Q, "Net balance sheet pension position, long-term liability less prepaid asset", "2026-06-30")]},
    {"n": 5, "topic": "Q2 2026 free cash flow", "supported_figure": "Negative 49.0 (cash used for operations -26.3, software -10.7, properties -12.0); H1 2026 is -74.5",
     "value": R["Q2_2026"]["fcf_q2_26"]["value"],
     "detail": {"parts_sum": fcf_q2_calc, "q1_2026": Q.find("Free cash flow, Q1 2026", "Q1 2026", why="conflict 5")["value"], "h1_2026": R["Q2_2026"]["fcf_h1_26"]["value"],
                "h1_less_q1": R["Q2_2026"]["fcf_h1_26"]["value"] - Q.find("Free cash flow, Q1 2026", "Q1 2026", why="conflict 5")["value"],
                "aggregator_38_3": "not supported by any filing"},
     "quote_refs": [qref(Q, "Free cash flow, Q2 2026 stated in release highlights", "Q2 2026"),
                    qref(Q, "Free cash flow (company definition: cash from operations less capital expenditures)", "H1 2026 (6 months)")]},
    {"n": 6, "topic": "FY2026 revenue guidance", "supported_figure": "Raised once, on 2 Jun 2026 (Investor Day), from (6.5)% to (4.5)% to (5.0)% to (3.5)% constant currency; reaffirmed 29 Jul 2026; never lowered",
     "value": "(5.0)% to (3.5)% constant currency",
     "detail": {"cc_range_dollars_on_fy2025_revenue": [rev25 * (1 + GUIDE_CC_LOW / 100), rev25 * (1 + GUIDE_CC_HIGH / 100)],
                "jun_reported_range_(2.0)_to_(0.5)_dollars": [rev25 * (1 - 0.020), rev25 * (1 - 0.005)],
                "jul_reported_range_(2.6)_to_(1.1)_dollars": [rev25 * (1 - 0.026), rev25 * (1 - 0.011)],
                "benzinga_basis_mix": "1,853 to 1,882 is the constant currency range; 1,911 to 1,940 is the June reported currency range. Both Investor Day numbers on different bases.",
                "margin_guidance": "9.0% to 11.0% non GAAP operating margin, unchanged"},
     "quote_refs": [qref(Q, "FY2026 revenue growth guidance RAISED at Investor Day: new constant currency range", "2026-06-02"),
                    qref(Q, "FY2026 revenue guidance, Q2 release: reaffirmed previously raised range", "2026-07-29")]},
]

# --------------------------------------------------------------------------------------
# 7. SPOT CHECKS (independent recomputation, asserted)
# --------------------------------------------------------------------------------------
spot = []


def spot_check(name, independent, reference, ref_source, tol, how):
    ok = abs(independent - reference) <= tol
    spot.append({"name": name, "independent_value": independent, "reference_value": reference, "reference_source": ref_source,
                 "tolerance": tol, "how": how, "passed": ok})
    assert ok, "SPOT CHECK FAILED: %s independent=%r reference=%r" % (name, independent, reference)


# 1. Z'' FY2025 from raw balance sheet literals read back through a different path (hand sum of the four weighted terms)
ta, tca, tcl, re_, deficit = 1846.2, 1004.0, 655.9, -2478.9, -268.3
tl_h = ta - deficit
zpp_h = 6.56 * (tca - tcl) / ta + 3.26 * re_ / ta + 6.72 * 78.5 / ta + 1.05 * deficit / tl_h
spot_check("Altman Z'' (no constant) FY2025 hand sum vs script", zpp_h, accounting_scores["FY2025"]["altman_zpp"]["no_constant"]["value"],
           "script output", 1e-9, "Literals typed independently of the ledger lookup (1846.2, 1004.0, 655.9, -2478.9, -268.3, 78.5).")
spot_check("Altman Z'' FY2025 versus earlier note value -2.988", zpp_h, -2.988, "accounting_ratio_models.md", 0.0015, "Earlier snippet round, same inputs.")
# 2. Pension adjusted net leverage at 31 Mar 2026 versus the company's stated 2.9x, and LTM 30 Jun 2026 Adjusted EBITDA 276.9 versus ledger
ltm_ebitda_h = 278.8 - 101.6 + 99.7
spot_check("LTM Adjusted EBITDA to 30 Jun 2026", ltm_ebitda_h, Q.find("LTM adjusted EBITDA at 2026-06-30", "2026-06-30", why="spot check")["value"],
           "q2 ledger derived item", 1e-9, "278.8 - 101.6 + 99.7")
spot_check("Net leverage incl pension 31 Mar 2026 versus company stated 2.9x", round(lev_mar_incl, 1), stated_mar, "q2 ledger, Investor Day deck", 1e-9,
           "(749.7 + 448.5 - 380.2) / 284.8 = %.4f rounded to one decimal" % lev_mar_incl)
# 3. Naive DD recomputed from first principles with math.erf and the published inputs
Ev, Fv, sE, mu = 161.8734221861422, 733.5, 0.6423517009345578, -0.43797468308587995
Vv = Ev + Fv
sD = 0.05 + 0.25 * sE
sV = (Ev * sE + Fv * sD) / Vv
dd_i = (math.log(Vv / Fv) + (mu - 0.5 * sV * sV)) / sV
pd_i = 0.5 * math.erfc(dd_i / math.sqrt(2.0))
spot_check("Naive DD (mu = 1y return) recomputed", dd_i, mk["merton_naive_main"]["DD"], "market_inputs.json merton_naive_main.DD", 1e-9, "Independent literals and erfc form of N(-DD).")
spot_check("Naive PD (mu = 1y return) recomputed", pd_i, mk["merton_naive_main"]["PD"], "market_inputs.json merton_naive_main.PD", 1e-9, "N(-DD) via erfc.")
# 4. LTM free cash flow two ways
spot_check("LTM FCF: cash from operations less capex versus company FCF roll", R["Q2_2026"]["ocf_ltm"]["value"] - R["Q2_2026"]["capex_ltm"]["value"],
           R["Q2_2026"]["fcf_ltm_company"]["value"], "company FCF FY2025 - H1 2025 + H1 2026", 1e-9, "112.2 - 81.0 = 31.2 versus -217.6 + 323.3 - 74.5")
spot_check("Q2 2026 FCF from release components", fcf_q2_calc, R["Q2_2026"]["fcf_q2_26"]["value"], "release FCF line", 1e-9, "-26.3 - 10.7 - 12.0")
spot_check("Total liabilities 30 Jun 2026 = assets - deficit", 1641.6 + 351.9, Q.find("Total liabilities (derived: total assets minus total deficit", "2026-06-30", why="spot check")["value"],
           "q2 ledger derived item", 1e-9, "1,641.6 + 351.9")
spot_check("Bond spread arithmetic: PD 1y at 40% recovery", 1 - math.exp(-((12.290376271467363 - 4.971902806297057) / 100.0) / 0.6),
           bond["main"]["pd_1y"], "market_inputs.json bond.main.pd_1y", 1e-9, "1 - exp(-s/(1-R))")

# --------------------------------------------------------------------------------------
# ASSEMBLE, NULL AUDIT, WRITE
# --------------------------------------------------------------------------------------
result = {
    "meta": {"as_of": mk["as_of"], "units": "USD millions unless stated", "script": "compute_unisys.py", "python": sys.version.split()[0],
             "run_flags": "python3 -I, standard library only",
             "debt_basis": "Carrying value for balance sheet models; face shown as alternative in notes.",
             "labels": "Runway is arithmetic on stated guidance, not a forecast."},
    "inputs": inputs_block,
    "accounting_scores": accounting_scores,
    "cash_and_leverage": cash_and_leverage,
    "market": market,
    "rating_map": rating_map,
    "conflicts_resolved": conflicts,
    "spot_checks": spot,
}


def collect_nulls(node, trail, out):
    if isinstance(node, dict):
        if "value" in node and node["value"] is None and ("note" in node or "formula" in node or "derived" in node or "grade" in node):
            out.append({"path": trail, "reason": node.get("note") or node.get("formula") or ""})
        for k, v in node.items():
            collect_nulls(v, trail + "." + str(k) if trail else str(k), out)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            collect_nulls(v, "%s[%d]" % (trail, i), out)


nulls = []
collect_nulls(result, "", nulls)
# Ohlson probability/zone are null alongside the null value: counted once under the Ohlson metric.
result["null_audit"] = {"count": len(nulls), "items": nulls}
result["ledger_items_matched"] = AUDIT

# Round floats for readability
def rnd(x):
    if isinstance(x, float):
        if math.isnan(x) or math.isinf(x):
            raise ValueError("non finite value")
        return round(x, 6)
    if isinstance(x, dict):
        return {k: rnd(v) for k, v in x.items()}
    if isinstance(x, list):
        return [rnd(v) for v in x]
    return x


result = rnd(result)
with open(path("unisys_metrics.json"), "w") as fh:
    json.dump(result, fh, indent=1, ensure_ascii=False)

# --------------------------------------------------------------------------------------
# MARKDOWN
# --------------------------------------------------------------------------------------
def f2(x, n=2):
    return "null" if x is None else ("%.*f" % (n, x))


def pct(x, n=1):
    return "null" if x is None else ("%.*f%%" % (n, x * 100))


L = []
a = L.append
S25, SQ = result["accounting_scores"]["FY2025"], result["accounting_scores"]["Q2_2026_LTM"]
a("# Unisys frameworks recomputed on filing grade inputs")
a("")
a("Run date basis: %s. USD millions unless stated. Generated by compute_unisys.py (python3 -I, standard library). Carrying value of debt is used for balance sheet models; face is shown as the alternative." % mk["as_of"])
a("")
a("## Headline values")
a("")
a("| Metric | FY2025 | Q2 2026 (LTM) |")
a("|---|---|---|")
a("| Altman Z'' no constant | %s (%s) | %s (%s) |" % (f2(S25["altman_zpp"]["no_constant"]["value"], 3), S25["altman_zpp"]["no_constant"]["zone"], f2(SQ["altman_zpp"]["no_constant"]["value"], 3), SQ["altman_zpp"]["no_constant"]["zone"]))
a("| Altman Z'' with 3.25 | %s (%s) | %s (%s) |" % (f2(S25["altman_zpp"]["with_3.25_constant"]["value"], 3), S25["altman_zpp"]["with_3.25_constant"]["zone"], f2(SQ["altman_zpp"]["with_3.25_constant"]["value"], 3), SQ["altman_zpp"]["with_3.25_constant"]["zone"]))
a("| Altman Z 1968 | %s (%s) | %s (%s) |" % (f2(S25["altman_z_1968"]["value"], 3), S25["altman_z_1968"]["zone"], f2(SQ["altman_z_1968"]["value"], 3), SQ["altman_z_1968"]["zone"]))
a("| Altman Z' 1983 | %s (%s) | %s (%s) |" % (f2(S25["altman_zprime_1983"]["value"], 3), S25["altman_zprime_1983"]["zone"], f2(SQ["altman_zprime_1983"]["value"], 3), SQ["altman_zprime_1983"]["zone"]))
a("| Ohlson O | null (partial %s) | null (partial %s) |" % (f2(S25["ohlson"]["partial_sum_excluding_missing"], 3), f2(SQ["ohlson"]["partial_sum_excluding_missing"], 3)))
a("| Zmijewski set A X, probability | %s, %s | %s, %s |" % (f2(S25["zmijewski"]["set_A"]["value"], 3), pct(S25["zmijewski"]["set_A"]["probability"], 2), f2(SQ["zmijewski"]["set_A"]["value"], 3), pct(SQ["zmijewski"]["set_A"]["probability"], 2)))
a("| Zmijewski set B X, probability | %s, %s | %s, %s |" % (f2(S25["zmijewski"]["set_B"]["value"], 3), pct(S25["zmijewski"]["set_B"]["probability"], 2), f2(SQ["zmijewski"]["set_B"]["value"], 3), pct(SQ["zmijewski"]["set_B"]["probability"], 2)))
a("| Springate (cutoff 0.862) | %s (%s) | %s (%s) |" % (f2(S25["springate"]["value"], 3), S25["springate"]["zone"], f2(SQ["springate"]["value"], 3), SQ["springate"]["zone"]))
a("| Grover | %s (%s) | %s (%s) |" % (f2(S25["grover"]["value"], 3), S25["grover"]["zone"], f2(SQ["grover"]["value"], 3), SQ["grover"]["zone"]))
a("| Taffler | null | null |")
a("")
a("Ohlson is null: the size term needs a GNP price level index that is in neither the inputs nor the market note. Taffler is null: no verified coefficients.")
a("")
lv = result["cash_and_leverage"]["pension_adjusted_leverage"]
a("## Cash and leverage")
a("")
a("| Pension adjusted leverage (x Adjusted EBITDA) | Gross incl pension | Net incl pension | Gross excl | Net excl |")
a("|---|---|---|---|---|")
for k in ("FY2024", "FY2025", "Q2_2026_LTM"):
    v = lv[k]
    a("| %s | %s | %s | %s | %s |" % (v["label"], f2(v["gross_debt_plus_pension_over_adj_ebitda"]), f2(v["net_debt_plus_pension_over_adj_ebitda"]), f2(v["gross_debt_over_adj_ebitda_excl_pension"]), f2(v["net_debt_over_adj_ebitda_excl_pension"])))
a("")
a("Face debt alternative at 30 Jun 2026 (745.0): gross incl pension %s, net incl pension %s, net excl pension %s. Pension deficit used is 448.5 (31 Dec 2025), the last figure the company states; no 30 Jun 2026 deficit is disclosed." % (
    f2(lv["Q2_2026_LTM"]["alt_face_debt"]["gross_incl_pension"]), f2(lv["Q2_2026_LTM"]["alt_face_debt"]["net_incl_pension"]), f2(lv["Q2_2026_LTM"]["alt_face_debt"]["net_excl_pension"])))
a("")
a("| Coverage and FCF | Adj EBITDA / interest | OCF / interest | OCF before pension / interest | FCF (company, after pension) | FCF before pension |")
a("|---|---|---|---|---|---|")
for k in ("FY2024", "FY2025", "H1_2026", "LTM_Jun_2026"):
    c = result["cash_and_leverage"]["interest_coverage"][k]
    fz = result["cash_and_leverage"]["free_cash_flow"][k]
    a("| %s | %s | %s | %s | %s | %s |" % (c["label"], f2(c["adj_ebitda_over_interest"]), f2(c["ocf_over_interest"]), f2(c["ocf_before_pension_over_interest"]), f2(fz["fcf_company_definition_computed"], 1), f2(fz["fcf_before_pension_contributions"], 1)))
a("")
lq = result["cash_and_leverage"]["liquidity"]
a("Liquidity (cash plus ABL availability): FY2025 %s; 30 Jun 2026 %s (cash %s plus ABL %s)." % (f2(lq["FY2025"]["liquidity"], 1), f2(lq["Q2_2026"]["liquidity"], 1), f2(lq["Q2_2026"]["cash"], 1), f2(lq["Q2_2026"]["abl_availability"], 1)))
a("")
rwb = result["cash_and_leverage"]["runway"]
a("### Runway: arithmetic on stated guidance held flat, not a forecast")
a("")
a("| Year | Revenue | FCF after pension | Cash at year end | Shortfall vs 698.4 |")
a("|---|---|---|---|---|")
for r in rwb["table_margin_method_primary"]:
    dash = lambda x: "-" if x is None else f2(x, 1)
    a("| %s | %s | %s | %s | %s |" % (r["year"], dash(r.get("revenue")), dash(r.get("fcf_after_pension")), dash(r.get("cash_end")), dash(r.get("shortfall_vs_698_4"))))
a("")
for key, lab in (("fcf_after_pension_zero_from_1_jul_2026", "Break even A: FCF after pension zero from 1 Jul 2026"), ("h2_2026_at_guidance_then_zero", "Break even B: H2 2026 at guidance, then zero")):
    rr = rwb["break_even_rows"][key]["rows"]
    a("- %s: cash stays at %s, shortfall %s (%s including the final coupon)." % (lab, f2(rr[-1]["cash_end"], 1), f2(rr[-1]["shortfall_vs_698_4"], 1), f2(rr[-1]["shortfall_incl_final_coupon"], 1)))
a("- Conservative alternative (scale whole base with revenue): shortfall %s." % f2(rwb["shortfall_jan_2031_scale_alternative"], 1))
a("- Average FCF needed in 2027 to 2030 to repay principal from end 2026 cash: %s a year (%s including the final coupon)." % (f2(rwb["required_average_fcf_2027_30_to_repay_principal"], 1), f2(rwb["required_average_fcf_2027_30_to_repay_principal_and_final_coupon"], 1)))
a("")
for m_ in rwb["method"]:
    a("- " + m_)
a("")
mkt = result["market"]
a("## Market")
a("")
a("| Measure | Value |")
a("|---|---|")
a("| Naive DD, drift = 1y stock return (%s) | DD %s, PD %s |" % (pct(mkt["naive_distance_to_default"]["drift_mu_equals_1y_stock_return"]["mu"], 2), f2(mkt["naive_distance_to_default"]["drift_mu_equals_1y_stock_return"]["value"], 3), pct(mkt["naive_distance_to_default"]["drift_mu_equals_1y_stock_return"]["PD"], 1)))
a("| Naive DD, drift = 1y Treasury (4.47%%) | DD %s, PD %s |" % (f2(mkt["naive_distance_to_default"]["drift_mu_equals_1y_treasury"]["value"], 3), pct(mkt["naive_distance_to_default"]["drift_mu_equals_1y_treasury"]["PD"], 1)))
bi = mkt["bond_implied_default_probability"]
a("| Bond implied PD 1y, recovery 40%% | %s (hazard %s, cumulative to maturity %s) |" % (pct(bi["recovery_40"]["pd_1y"], 1), pct(bi["recovery_40"]["hazard"], 2), pct(bi["recovery_40"]["pd_cum_to_maturity"], 1)))
a("| Bond implied PD 1y, recovery 60%% | %s (hazard %s, cumulative to maturity %s) |" % (pct(bi["recovery_60"]["pd_1y"], 1), pct(bi["recovery_60"]["hazard"], 2), pct(bi["recovery_60"]["pd_cum_to_maturity"], 1)))
a("| Equity value over total debt | %s (carrying), %s (face) |" % (f2(mkt["equity_value_over_total_debt"]["carrying_debt"]["value"], 3), f2(mkt["equity_value_over_total_debt"]["face_debt"]["value"], 3)))
oy = mkt["one_year_change_in_market_cap"]
a("| One year change in market cap | %s (%s), from %s to 161.9 |" % (f2(oy["value"], 1), pct(oy["pct_change"], 1), f2(oy["base_market_cap_musd"], 1)))
a("")
a("The bond figure is risk neutral from a single thin print (94.5, 12.29% yield, 7 Oct 2026). The two naive DD rows differ only by drift and are not averaged.")
a("")
rm = result["rating_map"]
a("## Rating map")
a("")
a("- Ratings: S&P B, Moody's B2, both stable at the FY2025 10-K date. Source grade: primary.")
a("- S&P 2024 study, global corporates B: 1y %s%%, 3y %s%%, 5y %s%%, 10y %s%%, 15y %s%%. Source grade: secondary." % tuple(rm["default_rate_table_B_sp_pct"]["values"][k] for k in ("1y", "3y", "5y", "10y", "15y")))
a("- Moody's B2 table: null, not retrieved.")
cm = rm["compare_to_market_signals"]
a("- Bond implied 1y PD %s%% is %sx the B one year rate and sits %s of the way from B to CCC/C." % (f2(cm["bond_implied_pd_1y_R40_pct"], 1), f2(cm["ratio_bond_to_B_1y"], 1), pct(cm["bond_pd_1y_position_between_B_and_CCC_C"], 0)))
a("")
a("## Sensitivity: what drives the distress reading")
a("")
for per, lab in (("FY2025", "FY2025"), ("Q2_2026_LTM", "Q2 2026 LTM")):
    sb = result["accounting_scores"]["sensitivity"][per]
    a("**%s**" % lab)
    a("")
    a("| Score | Base | Pension to equity | Accumulated deficit zero | EBIT = pretax + interest |")
    a("|---|---|---|---|---|")
    for k, nm in (("altman_z_1968", "Z 1968"), ("altman_zprime_1983", "Z' 1983"), ("altman_zpp_no_constant", "Z'' no constant"), ("altman_zpp_with_3.25", "Z'' with 3.25"),
                  ("zmijewski_A_prob", "Zmijewski A probability"), ("zmijewski_B_prob", "Zmijewski B probability"), ("springate", "Springate"), ("grover", "Grover")):
        def cell(blk):
            v = sb[blk]["scores"][k].get("value")
            return "n/a" if v is None else f2(v, 3)
        a("| %s | %s | %s | %s | %s |" % (nm, f2(sb["base"][k]["value"], 3), cell("pension_moved_from_liabilities_to_equity"), cell("accumulated_deficit_term_set_to_zero"), cell("ebit_as_pretax_plus_interest")))
    a("")
    a("Z'' term contributions: " + ", ".join("%s %s" % (k, f2(v, 3)) for k, v in sb["zpp_term_decomposition"].items()) + ". With the retained earnings term removed, Z'' with constant would be %s." % f2(sb["zpp_with_constant_if_RE_term_removed"], 3))
    a("")
a("## Six conflicts resolved")
a("")
for c in result["conflicts_resolved"]:
    a("%d. **%s.** %s" % (c["n"], c["topic"], c["supported_figure"]))
a("")
a("## Spot checks")
a("")
for s_ in result["spot_checks"]:
    a("- %s: independent %s, reference %s, %s." % (s_["name"], f2(s_["independent_value"], 6), f2(s_["reference_value"], 6), "passed" if s_["passed"] else "FAILED"))
a("")
a("## Nulls (%d)" % result["null_audit"]["count"])
a("")
for n_ in result["null_audit"]["items"]:
    a("- `%s`: %s" % (n_["path"], (n_["reason"] or "")[:260]))
a("")
a("## Inputs: filing versus earlier snippet (differences)")
a("")
for per in ("FY2025", "Q2_2026"):
    a("**%s**" % per)
    a("")
    a("| Item | Filing | Snippet | Difference |")
    a("|---|---|---|---|")
    for r_ in result["inputs"][per]["vs_snippet"]:
        a("| %s | %s | %s | %s |" % (r_["key"], f2(r_["filing_value"], 1), f2(r_["snippet_value"], 1), f2(r_["difference_filing_minus_snippet"], 1)))
    a("")
a("Ledger versus ledger, 31 Dec 2025 balance sheet: non zero differences are listed in unisys_metrics.json under inputs.ledger_vs_ledger_31dec2025.")
a("")
a("Matched ledger items (%d lookups) are listed in unisys_metrics.json under ledger_items_matched." % len(result["ledger_items_matched"]))
with open(path("unisys_metrics.md"), "w") as fh:
    fh.write("\n".join(L) + "\n")

print("OK  null_count=%d  spot_checks=%d  ledger_lookups=%d" % (result["null_audit"]["count"], len(spot), len(AUDIT)))

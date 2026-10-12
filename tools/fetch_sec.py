"""Pull 10 fiscal years of annual financials from SEC EDGAR XBRL and map them to template inputs.

Usage: python3 tools/fetch_sec.py TICKER [--years 10]
Writes output/TICKER/inputs.json (amounts in USD millions, template sign convention).
"""
import argparse
import datetime as dt
import sys

from common import http_json, out_dir, save_json

# Ordered fallbacks. Per year, the first tag with a value wins.
TAGS = {
    "revenue": ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax",
                "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet",
                "SalesRevenueGoodsNet", "RevenuesNetOfInterestExpense"],
    "cogs": ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices",
             "CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization"],
    "gross_profit": ["GrossProfit"],
    "sga": ["SellingGeneralAndAdministrativeExpense", "GeneralAndAdministrativeExpense"],
    "rnd": ["ResearchAndDevelopmentExpense",
            "ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost"],
    "operating_income": ["OperatingIncomeLoss"],
    "pretax": ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
               "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
               "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"],
    "taxes": ["IncomeTaxExpenseBenefit"],
    "net_income": ["NetIncomeLoss", "ProfitLoss"],
    "da": ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization",
           "DepreciationAmortizationAndAccretionNet", "Depreciation"],
    "capex": ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"],
    "cash": ["CashAndCashEquivalentsAtCarryingValue",
             "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "Cash"],
    "sec_cur": ["MarketableSecuritiesCurrent", "ShortTermInvestments",
                "AvailableForSaleSecuritiesDebtSecuritiesCurrent"],
    "sec_nc": ["MarketableSecuritiesNoncurrent", "LongTermInvestments",
               "AvailableForSaleSecuritiesDebtSecuritiesNoncurrent"],
    "debt_cur": ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"],
    "cp_stb": ["CommercialPaper", "ShortTermBorrowings"],
    "lease_cur": ["OperatingLeaseLiabilityCurrent"],
    "inventories": ["InventoryNet", "InventoryFinishedGoodsNetOfReserves"],
    "ar": ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent"],
    "tca": ["AssetsCurrent"],
    "ppe_net": ["PropertyPlantAndEquipmentNet",
                "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization"],
    "rou": ["OperatingLeaseRightOfUseAsset"],
    "ta": ["Assets"],
    "ap": ["AccountsPayableCurrent", "AccountsPayableAndAccruedLiabilitiesCurrent"],
    "tcl": ["LiabilitiesCurrent"],
    "ltd": ["LongTermDebtNoncurrent", "LongTermDebtAndCapitalLeaseObligations",
            "LongTermDebtAndFinanceLeaseObligationsNoncurrent" , "LongTermNotesPayable",
            "SeniorLongTermNotes"],
    "lease_liab": ["OperatingLeaseLiabilityNoncurrent"],
    "tl": ["Liabilities"],
    "equity_total": ["StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
                     "StockholdersEquity"],
    "goodwill": ["Goodwill"],
    "intangibles_ex_gw": ["IntangibleAssetsNetExcludingGoodwill", "FiniteLivedIntangibleAssetsNet"],
    "ppe_gross": ["PropertyPlantAndEquipmentGross"],
    "accum_dep": ["AccumulatedDepreciationDepletionAndAmortizationPropertyPlantAndEquipment"],
}
DURATION = {"revenue", "cogs", "gross_profit", "sga", "rnd", "operating_income", "pretax", "taxes",
            "net_income", "da", "capex"}
SHARE_TAGS = ["WeightedAverageNumberOfDilutedSharesOutstanding",
              "WeightedAverageNumberOfShareOutstandingBasicAndDiluted",
              "WeightedAverageNumberOfSharesOutstandingBasic"]


def d(s):
    return dt.date.fromisoformat(s)


def fy_label(end):
    # 52/53 week years ending in the first days of January belong to the prior year.
    return end.year - 1 if end.month == 1 and end.day <= 7 else end.year


def annual_facts(facts, tag, unit, duration):
    """All 10-K facts for a tag, keyed by end date.

    A period appears in up to three 10-Ks. If later filings only flip the sign (a common tagging
    error in comparative columns), the original filing wins. Otherwise the value reported by the
    most filings wins, ties going to the latest filing (restatements).
    """
    entries = facts.get("us-gaap", {}).get(tag, {}).get("units", {}).get(unit, [])
    groups = {}
    for e in entries:
        if not e.get("form", "").startswith("10-K"):
            continue
        end = d(e["end"])
        if duration:
            if "start" not in e:
                continue
            days = (end - d(e["start"])).days
            if not 340 <= days <= 380:
                continue
        elif "start" in e:
            continue
        groups.setdefault(end, {}).setdefault(round(e["val"]), []).append(e)
    best = {}
    for end, by_val in groups.items():
        if len(by_val) == 2 and sum(by_val) == 0:
            first = min((x for es in by_val.values() for x in es), key=lambda x: x["filed"])
            best[end] = first
            continue
        votes = max(by_val.values(), key=lambda es: (len(es), max(x["filed"] for x in es)))
        best[end] = max(votes, key=lambda x: x["filed"])
    return best


def near(series, end, tol=10):
    for k in sorted(series, key=lambda k: abs((k - end).days)):
        if abs((k - end).days) <= tol:
            return series[k]
        break
    return None


def lookup(facts, field, end, unit="USD"):
    """Return (value, tag, filed) for the first tag with a value at this FY end."""
    for tag in TAGS[field]:
        e = near(annual_facts(facts, tag, unit, field in DURATION), end)
        if e is not None:
            return e["val"], tag, e["filed"]
    return None, None, None


def lookup_shares(facts, end):
    for tag in SHARE_TAGS:
        e = near(annual_facts(facts, tag, "shares", True), end)
        if e is not None:
            return e["val"], tag, e["filed"]
    return None, None, None


def cik_for(ticker):
    data = http_json("https://www.sec.gov/files/company_tickers.json")
    for row in data.values():
        if row["ticker"].upper() == ticker.upper():
            return row["cik_str"], row["title"]
    sys.exit(f"Ticker {ticker} not found in SEC company list (non SEC filer?)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker")
    ap.add_argument("--years", type=int, default=10)
    a = ap.parse_args()
    t = a.ticker.upper()

    cik, name = cik_for(t)
    facts = http_json(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json")["facts"]

    # Fiscal year ends anchored on net income (always reported).
    anchor = {}
    for tag in TAGS["net_income"]:
        for end in annual_facts(facts, tag, "USD", True):
            anchor.setdefault(fy_label(end), end)
        if anchor:
            break
    years = sorted(anchor)[-a.years:]
    if len(years) < a.years:
        print(f"warning: only {len(years)} fiscal years available", file=sys.stderr)

    raw, src, notes = {}, {}, []
    for f in TAGS:
        raw[f], src[f] = {}, {}
        for y in years:
            v, tag, _ = lookup(facts, f, anchor[y])
            if v is not None:
                raw[f][y] = v / 1e6
                src[f][y] = tag
    shares = {}
    for y in years:
        v, tag, filed = lookup_shares(facts, anchor[y])
        if v is not None:
            shares[y] = {"shares_m": v / 1e6, "tag": tag, "filed": filed}

    g = lambda f, y: raw[f].get(y)
    z = lambda f, y: raw[f].get(y) or 0.0
    fields = {k: {} for k in ["revenue", "cogs", "sga", "other_opex", "int_other", "taxes", "minority",
                              "cash", "nc_securities", "inventories", "ar", "tca", "ppe_lease", "ta",
                              "ap", "tcl", "cur_debt_lease", "ltd_lease", "tl", "intangibles", "da", "capex", "ppe_gross", "accum_dep"]}
    missing = set()
    checks = {"net_income": {}, "operating_income": {}, "assets": {}}

    no_debt = []
    for y in years:
        rev = g("revenue", y)
        if rev is None and g("gross_profit", y) is not None and g("cogs", y) is not None:
            rev = g("gross_profit", y) + g("cogs", y)
        cogs = g("cogs", y)
        if cogs is None and rev is not None and g("gross_profit", y) is not None:
            cogs = rev - g("gross_profit", y)
        oi, pretax, tax, ni = g("operating_income", y), g("pretax", y), g("taxes", y), g("net_income", y)
        # Filers flip the tax sign between filings. Keep the sign that makes pretax - tax = net income.
        if None not in (pretax, tax, ni) and abs(pretax + tax - ni) < abs(pretax - tax - ni):
            tax = -tax
            notes.append(f"{y}: tax sign flipped to {tax:.1f} so pretax - tax ties to net income")
        for f, v in [("revenue", rev), ("cogs", cogs), ("operating_income", oi), ("pretax", pretax),
                     ("taxes", tax), ("net_income", ni)]:
            if v is None:
                missing.add(f"{f}:{y}")
        rev, cogs, sga = rev or 0.0, cogs or 0.0, z("sga", y)
        fields["revenue"][y] = rev
        fields["cogs"][y] = -cogs  # template: Gross Profit = Revenue + COGS
        fields["sga"][y] = sga
        # Row 37 (unlabelled opex row) is the plug so Operating Profit ties to reported.
        fields["other_opex"][y] = (rev - cogs - sga - oi) if oi is not None else z("rnd", y)
        # Row 41 is the plug so Income Before Taxes ties to reported.
        fields["int_other"][y] = (pretax - oi) if (pretax is not None and oi is not None) else 0.0
        fields["taxes"][y] = tax or 0.0
        # Row 46 is the plug so Net Income ties to reported (NCI, equity income, discontinued ops).
        fields["minority"][y] = (ni - (pretax - tax)) if None not in (ni, pretax, tax) else 0.0
        checks["net_income"][y], checks["operating_income"][y], checks["assets"][y] = ni, oi, g("ta", y)

        # Row 53 = cash + current securities; row 59 = non-current securities (both reduce EV).
        fields["cash"][y] = z("cash", y) + z("sec_cur", y)
        fields["nc_securities"][y] = z("sec_nc", y)
        fields["inventories"][y] = z("inventories", y)
        fields["ar"][y] = z("ar", y)
        fields["tca"][y] = z("tca", y)
        fields["ppe_lease"][y] = z("ppe_net", y) + z("rou", y)
        fields["ta"][y] = z("ta", y)
        fields["ap"][y] = z("ap", y)
        fields["tcl"][y] = z("tcl", y)
        # Row 63 = current debt + commercial paper / short term borrowings + current operating lease.
        # DebtCurrent and LongTermDebtAndCapitalLeaseObligationsCurrent usually already include
        # commercial paper, so CP/STB is only added on top of LongTermDebtCurrent (or when no
        # current debt tag exists).
        cp = z("cp_stb", y) if src["debt_cur"].get(y) in (None, "LongTermDebtCurrent") else 0.0
        fields["cur_debt_lease"][y] = z("debt_cur", y) + cp + z("lease_cur", y)
        fields["ltd_lease"][y] = z("ltd", y) + z("lease_liab", y) + fields["cur_debt_lease"][y]
        tl = g("tl", y)
        if tl is None and g("ta", y) is not None and g("equity_total", y) is not None:
            tl = g("ta", y) - g("equity_total", y)
            src["tl"][y] = "Assets - " + src["equity_total"][y]
        fields["tl"][y] = tl or 0.0
        fields["intangibles"][y] = z("goodwill", y) + z("intangibles_ex_gw", y)
        fields["da"][y] = z("da", y)
        fields["capex"][y] = z("capex", y)
        fields["ppe_gross"][y] = g("ppe_gross", y)
        fields["accum_dep"][y] = g("accum_dep", y)

        for f in ["cash", "tca", "ppe_net", "ta", "tcl", "da", "capex"]:
            if g(f, y) is None:
                missing.add(f"{f}:{y}")
        if tl is None:
            missing.add(f"tl:{y}")
        if y not in shares:
            missing.add(f"shares:{y}")
        if g("ltd", y) is None:
            no_debt.append(y)
        if oi is None:
            notes.append(f"{y}: OperatingIncomeLoss not reported; row 37 uses R&D only, operating profit will not tie")

    if no_debt:
        notes.append(f"No long term debt tag for {no_debt[0]}-{no_debt[-1]} ({len(no_debt)} yrs): "
                     "debt set to 0 (lease liabilities still included). Confirm the company has no debt.")
    for f_, label in [("sec_cur", "current securities"), ("sec_nc", "non-current securities"),
                      ("debt_cur", "current debt"), ("cp_stb", "commercial paper / short term borrowings"),
                      ("lease_cur", "current operating lease")]:
        used = sorted({v for v in src[f_].values()})
        if used:
            notes.append(f"{label} tags used: {', '.join(used)}")
    for y in years:
        if src["debt_cur"].get(y) not in (None, "LongTermDebtCurrent") and g("cp_stb", y):
            notes.append(f"{y}: {src['cp_stb'][y]} not added because {src['debt_cur'][y]} already includes it")
    save_json(out_dir(t) / "inputs.json", {
        "ticker": t, "name": name, "cik": cik,
        "years": years, "fy_end": {y: anchor[y].isoformat() for y in years},
        "fields": fields, "shares": shares, "checks": checks,
        "sources": src, "missing": sorted(missing), "notes": notes,
    })
    print(f"{t} {name}: {years[0]}-{years[-1]}, missing={len(missing)}, notes={len(notes)}")


if __name__ == "__main__":
    main()

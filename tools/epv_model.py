"""Python replica of the template math (Financials sheet), formula for formula.

Usage: python3 tools/epv_model.py TICKER [--coc 0.10]
Writes output/TICKER/summary.json. Used to cross check the recalculated workbook and to report results.
Template quirks are replicated on purpose (see docs/model_review.md); do not "fix" them here alone.
"""
import argparse

from common import load_inputs, out_dir, save_json


def div(a, b):
    return a / b if b else None


def year_calc(f, y, price, shares, coc, ppe_old):
    v = lambda k: f.get(k, {}).get(y) or 0.0
    r = {}
    rev = v("revenue")
    gp = rev + v("cogs")                                   # row 33
    op = gp - (v("sga") + v("other_opex"))                 # row 38
    pretax = op + v("int_other")                           # row 42
    tax = v("taxes")                                       # row 44
    ni = pretax - tax + v("minority")                      # row 48
    tax_rate = div(tax, pretax)                            # row 45
    ebitda = ni + tax + v("int_other") + v("da")           # rows 76-80 (template adds row 41)
    ebitda_adj = ebitda + v("one_time")                    # row 84
    maint = v("da")                                        # row 107: maintenance capex = D&A
    nopat_simple = op - tax + v("da") - maint              # row 93
    pre_tax = ebitda_adj - maint                           # row 120
    nopat = pre_tax - pre_tax * (tax_rate or 0.0)          # row 123
    ppe = ppe_old if ppe_old is not None else v("ppe_lease")   # row 112
    nwc = (v("tca") - v("cash")) - v("tcl")                # row 129
    ic = ppe + nwc                                         # row 130
    mcap = price * shares if price is not None and shares else None
    ev = mcap - v("cash") + v("ltd_lease") if mcap is not None else None   # row 15
    epv = nopat / coc                                      # row 140
    r.update(revenue=rev, gross_profit=gp, operating_profit=op, op_margin=div(op, rev),
             pretax=pretax, taxes=tax, tax_rate=tax_rate, net_income=ni, ebitda=ebitda,
             ebitda_adj=ebitda_adj, nopat_row93=nopat_simple, nopat=nopat, nopat_margin=div(nopat, rev),
             ppe=ppe, nwc=nwc, invested_capital=ic, scale=div(rev, ic), roic=div(nopat, ic),
             cost_of_capital=coc, price=price, shares=shares, market_cap=mcap, ev=ev,
             book_value=v("ta") - v("tl"), epv=epv, pv_comp_adv=epv - ic,
             growth_value=(ev - epv) if ev is not None else None)
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker")
    ap.add_argument("--coc", type=float, default=0.10)
    a = ap.parse_args()
    t = a.ticker.upper()
    inp = load_inputs(t)
    f = inp["fields"]
    years = [str(y) for y in inp["years"]]

    by_year = {}
    for i, y in enumerate(years):
        ppe_old = None
        if i < 6:  # columns D..I: row 112 = row 110 - row 111 (as filled by fill_template.py)
            gross, acc = f["ppe_gross"].get(y), f["accum_dep"].get(y)
            if gross is not None and acc is not None:
                ppe_old = gross + max(f["ppe_lease"][y] - (gross - acc), 0.0) - acc
            else:
                ppe_old = f["ppe_lease"][y]
        by_year[y] = year_calc(f, y, inp.get("price", {}).get(y),
                               inp.get("shares_current_basis", {}).get(y), a.coc, ppe_old)

    last = by_year[years[-1]]
    sh = last["shares"]
    per_share = None
    if sh and last["ev"] is not None:
        per_share = {
            "invested_capital": last["invested_capital"] / sh,
            "pv_comp_adv": last["pv_comp_adv"] / sh,
            "epv": last["epv"] / sh,
            "growth_value": last["growth_value"] / sh,
            "ev": last["ev"] / sh,
            "price": last["price"],
        }
        per_share["pct_of_ev"] = {k: per_share[k] / per_share["ev"]
                                  for k in ["invested_capital", "pv_comp_adv", "epv", "growth_value"]}
    save_json(out_dir(t) / "summary.json", {
        "ticker": t, "name": inp["name"], "latest_year": years[-1], "cost_of_capital": a.coc,
        "per_share_latest": per_share, "by_year": by_year,
        "epv_alt_row100": (last["nopat_row93"] / a.coc / sh) if sh else None,
    })
    if per_share:
        print(f"{t} FY{years[-1]}: price {per_share['price']:.2f}, EV/sh {per_share['ev']:.2f}, "
              f"EPV/sh {per_share['epv']:.2f}, growth {per_share['pct_of_ev']['growth_value']:.0%} of EV")
    else:
        print(f"{t}: missing price or shares for latest year")


if __name__ == "__main__":
    main()

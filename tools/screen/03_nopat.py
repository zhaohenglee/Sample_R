"""Step 3: NOPAT for latest fiscal year for the top 700 by cap.
Usage: 03_nopat.py [--test]"""
import sys
from datetime import date
from _util import *

TEST = "--test" in sys.argv
C = json.loads((OUT / ("caps_test.json" if TEST else "caps.json")).read_text())["rows"]
TAGS = {"op": ["OperatingIncomeLoss"],
        "tax": ["IncomeTaxExpenseBenefit"],
        "pre": ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
                "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"]}

frames = {}  # (kind, year) -> {cik: (end, val)}
for kind, tags in TAGS.items():
    for yr in ("CY2025", "CY2024"):
        m = {}
        for tag in tags:
            j = cached(RAW / f"frame_{tag}_{yr}.json",
                       lambda: sec_get(f"https://data.sec.gov/api/xbrl/frames/us-gaap/{tag}/USD/{yr}.json") or {"data": []})
            for e in j["data"]:
                m.setdefault(e["cik"], (e["end"], e["val"]))  # first tag wins
        frames[(kind, yr)] = m


def annual_cf(cf, kind):
    """{end: val} for annual (330-380 day) duration facts; latest filed wins."""
    res = {}
    for tag in TAGS[kind]:
        arr = []
        for u in cf.get("facts", {}).get("us-gaap", {}).get(tag, {}).get("units", {}).get("USD", []):
            if "start" not in u or u.get("form") not in ("10-K", "10-KT", "10-K/A", "10-KT/A"):
                continue
            dur = (date.fromisoformat(u["end"]) - date.fromisoformat(u["start"])).days
            if 330 <= dur <= 380:
                arr.append(u)
        arr.sort(key=lambda u: u.get("filed", ""))
        for u in arr:
            res[u["end"]] = u["val"]
        if res:
            break
    return res


def fy_label(end):
    e = date.fromisoformat(end)
    return e.year if e.month >= 3 else e.year - 1


def money(x):
    a = abs(x)
    s = f"${a / 1e6:.1f}M" if a >= 1e5 else f"${a / 1e3:.1f}K"
    return s


out, src_cnt = [], {"frame": 0, "companyfacts": 0, "none": 0}
for r in C:
    cik = r["cik"]; cik10 = f"{cik:010d}"
    rec = dict(cik=cik, ticker=r["ticker"], op=None, tax=None, pre=None, end=None, src="none")
    for yr in ("CY2025", "CY2024"):
        if cik in frames[("op", yr)]:
            end, op = frames[("op", yr)][cik]
            rec.update(op=op, end=end, src="frame",
                       tax=(frames[("tax", yr)].get(cik) or (None, None))[1],
                       pre=(frames[("pre", yr)].get(cik) or (None, None))[1])
            break
    cf = cached(RAW / f"cf_{cik10}.json", lambda: sec_get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik10}.json") or {})
    ops = annual_cf(cf, "op")
    if ops:
        e = max(ops)
        if rec["end"] is None or e > rec["end"]:
            rec.update(op=ops[e], end=e, src="companyfacts",
                       tax=annual_cf(cf, "tax").get(e), pre=annual_cf(cf, "pre").get(e))
    src_cnt[rec["src"]] += 1
    # NOPAT
    if rec["op"] is None:
        rec.update(fy=None, tax_rate=None, nopat=None,
                   sentence="NOPAT unavailable: no operating income reported in XBRL.")
    else:
        fy = fy_label(rec["end"]); op = rec["op"]
        if op < 0:
            t, nopat = None, op
            sent = f"FY{fy} operating loss of {money(op)}; NOPAT negative."
        else:
            if rec["pre"] and rec["pre"] > 0 and rec["tax"] is not None:
                t = min(max(rec["tax"] / rec["pre"], 0.0), 0.35)
            else:
                t = 0.21
            nopat = op * (1 - t)
            sent = f"FY{fy} NOPAT ≈ {money(nopat)} (operating income {money(op)}, tax rate {t * 100:.0f}%)."
        rec.update(fy=fy, tax_rate=t, nopat=nopat, sentence=sent)
    out.append(rec)
(OUT / ("nopat_test.json" if TEST else "nopat.json")).write_text(json.dumps(out, indent=1))
print(src_cnt, "unavailable:", sum(1 for o in out if o["nopat"] is None))

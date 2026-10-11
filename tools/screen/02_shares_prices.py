"""Step 2: market cap = Yahoo price x SEC dei shares; guards; rank ascending; keep 700 (500 + 200 buffer).
Usage: 02_shares_prices.py [--test]  (--test reads universe_test.json)"""
import sys
from datetime import date, datetime, timezone
from _util import *

TEST = "--test" in sys.argv
U = json.loads((OUT / ("universe_test.json" if TEST else "universe.json")).read_text())
rows = U["rows"]
stats = {"universe_in": len(rows)}
today = date.fromisoformat(TODAY)
d = lambda s: date.fromisoformat(s)

# SEC shares frames
frames = {}
for p in ("CY2025Q4I", "CY2026Q1I", "CY2026Q2I", "CY2026Q3I"):
    j = cached(RAW / f"frame_shares_{p}.json",
               lambda: sec_get(f"https://data.sec.gov/api/xbrl/frames/dei/EntityCommonStockSharesOutstanding/shares/{p}.json") or {"data": []})
    for e in j["data"]:
        c = e["cik"]
        if c not in frames or e["end"] > frames[c]["end"]:
            frames[c] = {"val": e["val"], "end": e["end"]}


def cf_dei(cik):
    cik10 = f"{cik:010d}"
    cf = cached(RAW / f"cf_{cik10}.json",
                lambda: sec_get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik10}.json") or {})
    best = None
    for tag in ("EntityCommonStockSharesOutstanding",):
        for u, arr in ((cf.get("facts", {}).get("dei", {}).get(tag, {})).get("units", {})).items():
            for e in arr:
                if best is None or (e["end"], e.get("filed", "")) > (best["end"], best.get("filed", "")):
                    best = {"val": e["val"], "end": e["end"]}
    return best


# Yahoo quotes (cached by step 1)
quotes = json.loads((RAW / "yahoo_quotes_all.json").read_text())
cnt = dict(no_price=0, not_usd=0, stale_trade=0, no_shares=0, cap_ge_1B=0)
out = []
for r in rows:
    q = quotes.get(r["ticker"], {})
    px, rmt = q.get("regularMarketPrice"), q.get("regularMarketTime")
    if not px or px <= 0 or not rmt:
        cnt["no_price"] += 1; continue
    if q.get("currency") != "USD":
        cnt["not_usd"] += 1; continue
    pdate = datetime.fromtimestamp(rmt, timezone.utc).date()
    if (today - pdate).days > 30:
        cnt["stale_trade"] += 1; continue
    flags = []
    s = frames.get(r["cik"])
    if s and (today - d(s["end"])).days > 150:
        s = None  # frame value too old; try companyfacts
    src = "frame"
    if not s:
        s = cf_dei(r["cik"]); src = "companyfacts"
        if s and (today - d(s["end"])).days > 150:
            flags.append("shares_stale")
    ysh = q.get("sharesOutstanding")
    if not s and ysh:
        s = {"val": ysh, "end": pdate.isoformat()}; src = "yahoo"; flags.append("no_sec_shares")
        cnt["yahoo_shares_fallback"] = cnt.get("yahoo_shares_fallback", 0) + 1
    if not s:
        cnt["no_shares"] += 1; continue
    if ysh:
        ratio = s["val"] / ysh
        if not 0.5 <= ratio <= 2.0:
            n = cf_dei(r["cik"])
            if n and (n["end"], 0) > (s["end"], 0):
                s, src = n, "companyfacts"
                ratio = s["val"] / ysh
            if not 0.5 <= ratio <= 2.0:
                flags.append("split_check")
                # use the more recent-dated source: Yahoo is dated ~price date
                if (pdate - d(s["end"])).days > 45:
                    s = {"val": ysh, "end": pdate.isoformat()}; src = "yahoo"
                    flags = [f for f in flags if f != "shares_stale"]
    mc = px * s["val"]
    if mc >= 1e9:
        cnt["cap_ge_1B"] += 1; continue
    out.append(dict(r, price=px, price_date=pdate.isoformat(), shares=s["val"], shares_date=s["end"],
                    shares_src=src, market_cap=mc, yahoo_name=q.get("longName") or q.get("shortName"),
                    yahoo_cap=q.get("marketCap"), flags=flags))
out.sort(key=lambda x: x["market_cap"])
stats.update(cnt)
stats["priced_under_1B"] = len(out)
stats["kept"] = min(len(out), 700)
stats["split_check"] = sum("split_check" in o["flags"] for o in out[:700])
stats["shares_stale"] = sum("shares_stale" in o["flags"] for o in out[:700])
(OUT / ("caps_test.json" if TEST else "caps.json")).write_text(json.dumps({"stats": stats, "rows": out[:700]}, indent=1))
print(json.dumps(stats, indent=1))

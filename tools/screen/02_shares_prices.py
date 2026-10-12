"""Step 2: market cap = Yahoo price x SEC dei shares (split adjusted via Yahoo chart split events);
30-day volume check; rank ascending; keep 700 (500 + 200 buffer).
Usage: 02_shares_prices.py [--test]  (--test reads universe_test.json)"""
import sys
from datetime import date, datetime, timedelta, timezone
from _util import *

TEST = "--test" in sys.argv
U = json.loads((OUT / ("universe_test.json" if TEST else "universe.json")).read_text())
rows = U["rows"]
stats = {"universe_in": len(rows)}
today = date.fromisoformat(TODAY)
d = lambda s: date.fromisoformat(s)
now_ts = datetime(2026, 10, 11, 23, 59, tzinfo=timezone.utc).timestamp()

frames = share_frames()


def cf_dei(cik):
    cik10 = f"{cik:010d}"
    cf = cached(RAW / f"cf_{cik10}.json",
                lambda: sec_get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik10}.json") or {})
    best = None
    for u, arr in ((cf.get("facts", {}).get("dei", {}).get("EntityCommonStockSharesOutstanding", {})).get("units", {})).items():
        for e in arr:
            if best is None or (e["end"], e.get("filed", "")) > (best["end"], best.get("filed", "")):
                best = {"val": e["val"], "end": e["end"]}
    return best


quotes = json.loads((RAW / "yahoo_quotes_all.json").read_text())
y = Yahoo()


def chart(sym):
    fn = lambda: (y.get(f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}?range=1y&interval=1d&events=split", gap=0.25) or {})
    j = cached(RAW / f"chart_{sym.replace('/', '_')}.json", fn)
    try:
        res = j["chart"]["result"][0]
    except Exception:
        return None
    ts = res.get("timestamp") or []
    vol = (res["indicators"]["quote"][0].get("volume")) or []
    v30 = sum((v or 0) for t, v in zip(ts, vol) if t >= now_ts - 30 * 86400)
    splits = []
    for e in ((res.get("events") or {}).get("splits") or {}).values():
        if e.get("denominator") and e.get("numerator"):
            splits.append((datetime.fromtimestamp(e["date"], timezone.utc).date().isoformat(),
                           e["numerator"] / e["denominator"]))
    return {"vol30": v30, "splits": sorted(splits)}


def in_range(r):
    return 0.5 <= r <= 2.0


cnt = dict(no_price=0, not_usd=0, stale_trade=0, zero_volume_30d=0, no_chart=0, no_shares=0, cap_ge_1B=0, yahoo_shares_fallback=0)
out = []
for n, r in enumerate(rows):
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
    if s and ((today - d(s["end"])).days > 150 or s["val"] <= 0):
        s = None
    if not s:
        s = cf_dei(r["cik"])
        if s and (today - d(s["end"])).days > 150:
            flags.append("shares_stale")
    if s and s["val"] <= 0:
        s = None  # zero/invalid dei value (e.g. empty class); use Yahoo fallback below
    ysh = q.get("sharesOutstanding")
    # cheap pre-screen before the chart call: obviously huge caps skip the chart
    approx = px * (s["val"] if s else (ysh or 0))
    if approx >= 20e9:
        cnt["cap_ge_1B"] += 1; continue
    ch = chart(r["ticker"])
    if ch is None:
        cnt["no_chart"] += 1; continue
    if ch["vol30"] <= 0:
        cnt["zero_volume_30d"] += 1; continue
    src = "frame" if (s and r["cik"] in frames and frames[r["cik"]]["end"] == s["end"]) else "companyfacts"
    if not s:
        if not ysh:
            cnt["no_shares"] += 1; continue
        s = {"val": ysh, "end": pdate.isoformat()}; src = "yahoo"
        flags.append("no_sec_shares"); cnt["yahoo_shares_fallback"] += 1
        sh = ysh
    else:
        def factor(sd):
            f = 1.0
            for sdate, fac in ch["splits"]:
                if sdate > sd:
                    f *= fac
            return f
        chart_start = (today.replace(year=today.year - 1)).isoformat()
        F = factor(s["end"])
        sh = s["val"] * F          # always apply Yahoo split events dated after the SEC share date
        if ysh and not in_range(sh / ysh):
            nw = cf_dei(r["cik"])  # newer SEC value?
            if nw and nw["end"] > s["end"] and nw["val"] > 0:
                s, src = nw, "companyfacts"
                F = factor(s["end"]); sh = s["val"] * F
        stale = (today - d(s["end"])).days > 150
        unadjustable = s["end"] < chart_start  # older than the 1y chart window: split history unknown
        splits_after = any(sd > (d(s["end"]) - timedelta(days=120)).isoformat() for sd, _ in ch["splits"])  # split after, or shortly before, the SEC date
        if F != 1.0:
            flags.append("split_adjusted")
        if ysh and not in_range(sh / ysh):
            flags.append("split_check")
            if stale or unadjustable:
                sh, src = ysh, "yahoo"
            elif ysh > 2.0 * sh and not splits_after:
                sh, src = ysh, "yahoo"   # fresh SEC count covers one class / wrong scale; Yahoo is current
            # else keep (split adjusted) SEC shares
    mc = px * sh
    if mc >= 1e9:
        cnt["cap_ge_1B"] += 1; continue
    out.append(dict(r, price=px, price_date=pdate.isoformat(), shares=sh, shares_raw_sec=s["val"], shares_date=s["end"],
                    shares_src=src, market_cap=mc, vol30=ch["vol30"], yahoo_name=q.get("longName") or q.get("shortName"),
                    yahoo_cap=q.get("marketCap"), yahoo_shares=ysh, flags=flags))
    if n % 200 == 0:
        print(n, len(out), flush=True)
out.sort(key=lambda x: x["market_cap"])
stats.update(cnt)
stats["priced_under_1B"] = len(out)
stats["kept"] = min(len(out), 700)
for f in ("split_check", "split_adjusted", "shares_stale", "no_sec_shares"):
    stats[f] = sum(f in o["flags"] for o in out[:700])
(OUT / ("caps_test.json" if TEST else "caps.json")).write_text(json.dumps({"stats": stats, "rows": out[:700]}, indent=1))
print(json.dumps(stats, indent=1))

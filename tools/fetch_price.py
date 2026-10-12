"""Add fiscal year end share prices and split consistent share counts to inputs.json.

Usage: python3 tools/fetch_price.py TICKER
Prices: Yahoo daily close (split adjusted to today's basis), last close on or before FY end.
Shares: SEC diluted weighted average, restated to today's split basis using splits after the filing date.
"""
import argparse
import datetime as dt

from common import http_json, load_json, out_dir, save_json


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker")
    t = ap.parse_args().ticker.upper()
    path = out_dir(t) / "inputs.json"
    inp = load_json(path)

    first = dt.date.fromisoformat(min(inp["fy_end"].values())) - dt.timedelta(days=14)
    p1 = int(dt.datetime.combine(first, dt.time()).timestamp())
    p2 = int(dt.datetime.now().timestamp())
    url = (f"https://query2.finance.yahoo.com/v8/finance/chart/{t.replace('.', '-')}"
           f"?period1={p1}&period2={p2}&interval=1d&events=split")
    res = http_json(url)["chart"]["result"][0]
    days = [dt.datetime.fromtimestamp(s, dt.timezone.utc).date() for s in res["timestamp"]]
    closes = res["indicators"]["quote"][0]["close"]
    splits = [(dt.datetime.fromtimestamp(int(s["date"]), dt.timezone.utc).date(), s["numerator"] / s["denominator"])
              for s in res.get("events", {}).get("splits", {}).values()]

    prices, price_dates = {}, {}
    for y, end in inp["fy_end"].items():
        end = dt.date.fromisoformat(end)
        pts = [(dd, c) for dd, c in zip(days, closes) if dd <= end and c is not None]
        if pts:
            price_dates[y], prices[y] = pts[-1][0].isoformat(), pts[-1][1]

    shares = {}
    notes = [n for n in inp["notes"] if "for splits after filing" not in n]
    for y, s in inp["shares"].items():
        filed = dt.date.fromisoformat(s["filed"])
        factor = 1.0
        for sd, ratio in splits:
            if sd > filed:
                factor *= ratio
        shares[y] = s["shares_m"] * factor
        if factor != 1.0:
            notes.append(f"{y}: shares x{factor:g} for splits after filing {s['filed']}")

    missing = [m for m in inp["missing"] if not m.startswith("price:")]
    missing += [f"price:{y}" for y in inp["years"] if str(y) not in prices]
    inp.update(price=prices, price_date=price_dates, shares_current_basis=shares,
               splits=[(d.isoformat(), r) for d, r in splits], missing=sorted(set(missing)), notes=notes)
    save_json(path, inp)
    print(f"{t}: prices {len(prices)}/{len(inp['years'])}, splits {len(splits)}")


if __name__ == "__main__":
    main()

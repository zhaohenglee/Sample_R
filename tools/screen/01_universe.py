"""Step 1: universe. One primary ticker per CIK, Yahoo prefilter (<1.5B), submissions filter.
Usage: 01_universe.py [--limit N]   (N limits the pre-filter input for testing)"""
import re, sys
from _util import *

LIMIT = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
EXCH = {"Nasdaq": "Nasdaq", "NYSE": "NYSE", "CBOE": "CBOE", "OTC": "OTC", "TXSE": "TXSE"}
stats = {}

# Suffix patterns for non-common securities
BAD = re.compile(r"(-?(WS[A-Z]?|W|WT|WTS|U|UN|R|RT)$|[-.](P[A-Z]?|PR[A-Z]?|WS|W|U|R|RT)$|-[A-Z]$)")


def is_bad(sym):
    if re.search(r"[-.](P[A-Z]?|PR[A-Z]?|WS[A-Z]?|WT|W|U|UN|R|RT)$", sym):
        return True
    # SPAC style 5-letter symbols ending W/U/R handled only for 5+ char symbols
    if len(sym) >= 5 and sym[-1] in "WUR" and sym.isalpha():
        return True
    return False


raw = cached(RAW / "company_tickers_exchange.json",
             lambda: sec_get("https://www.sec.gov/files/company_tickers_exchange.json"))
fields = raw["fields"]
rows = [dict(zip(fields, r)) for r in raw["data"]]
stats["sec_rows"] = len(rows)
rows = [r for r in rows if (r.get("exchange") or "") in EXCH]
stats["after_exchange_filter"] = len(rows)
rows = [r for r in rows if not is_bad(r["ticker"])]
stats["after_suffix_filter"] = len(rows)
by = {}
for r in rows:
    by.setdefault(r["cik"], []).append(r)
prim = []
for cik, rs in by.items():
    rs.sort(key=lambda r: (len(r["ticker"]), r["ticker"]))
    prim.append(rs[0])
stats["one_ticker_per_cik"] = len(prim)
if LIMIT:
    import random; random.Random(1).shuffle(prim); prim = prim[:LIMIT]

# Yahoo quotes (cached per batch)
y = Yahoo()
quotes = {}
syms = [r["ticker"] for r in prim]
for i in range(0, len(syms), 150):
    batch = syms[i:i + 150]
    d = cached(RAW / f"yq_{batch[0]}_{batch[-1]}_{len(batch)}.json", lambda: y.quotes(batch))
    for q in d:
        quotes[q["symbol"]] = q
    print("quotes", i, len(quotes), flush=True)
(RAW / "yahoo_quotes_all.json").write_text(json.dumps(quotes))
stats["yahoo_quote_found"] = sum(1 for r in prim if r["ticker"] in quotes)
sfr = share_frames()
SPAC_RE = re.compile(r"Acquisition Corp|SPAC", re.I)
keep = []
dropc = {"quoteType_not_equity": 0, "no_valid_usd_price": 0, "spac_name": 0, "cap_ge_1.5B": 0}
for r in prim:
    q = quotes.get(r["ticker"])
    if not q or q.get("quoteType") != "EQUITY":
        dropc["quoteType_not_equity"] += 1; continue
    px = q.get("regularMarketPrice")
    if not px or px <= 0 or q.get("currency") != "USD":
        dropc["no_valid_usd_price"] += 1; continue
    if SPAC_RE.search(r["name"] or "") or SPAC_RE.search(q.get("longName") or ""):
        dropc["spac_name"] += 1; continue
    # prefilter: drop only when BOTH Yahoo cap and price x SEC frame shares say >= 1.5B
    mc = q.get("marketCap")
    fs = sfr.get(r["cik"])
    sec_cap = px * fs["val"] if fs else None
    if mc is not None and mc >= 1.5e9 and sec_cap is not None and sec_cap >= 1.5e9:
        dropc["cap_ge_1.5B"] += 1; continue
    keep.append(r)
stats["prefilter_drops"] = dropc
stats["after_yahoo_prefilter"] = len(keep)

# Submissions
INV = {"N-54A", "N-2", "N-2/A", "N-2ASR", "N-CSR", "N-CSRS", "40-17G", "40-17F2", "497", "N-8A"}
final, drop = [], {"investment_company_bdc": 0, "no_recent_10K_10Q": 0, "sic6770": 0, "foreign_only_20F_40F": 0, "submissions_missing": 0}
for n, r in enumerate(keep):
    cik10 = f"{r['cik']:010d}"
    s = cached(RAW / f"sub_{cik10}.json", lambda: sec_get(f"https://data.sec.gov/submissions/CIK{cik10}.json") or {})
    if not s:
        drop["submissions_missing"] += 1
        continue
    rec = s["filings"]["recent"]
    forms = list(zip(rec["form"], rec["filingDate"]))
    cutoff = "2025-07-11"  # 15 months before 2026-10-11
    ok = any(f in ("10-K", "10-Q", "10-KT", "10-K405", "10-KT/A", "10-K/A", "10-Q/A") and d >= cutoff
             and f in ("10-K", "10-Q", "10-KT") for f, d in forms)
    if (not s.get("sic") or str(s.get("sic")) == "0000") and (s.get("entityType") == "investment" or INV & {f for f, d in forms}):
        drop["investment_company_bdc"] += 1
        continue
    if SPAC_RE.search(s.get("name") or ""):
        drop["sic6770"] += 0; dropc["spac_name"] += 1
        continue
    if str(s.get("sic")) == "6770":
        drop["sic6770"] += 1
        continue
    if not ok:
        if any(f in ("20-F", "40-F") for f, d in forms) and not any(f.startswith("10-K") for f, d in forms):
            drop["foreign_only_20F_40F"] += 1
        else:
            drop["no_recent_10K_10Q"] += 1
        continue
    r = dict(r)
    r.update(sic=s.get("sic"), sic_desc=s.get("sicDescription"), sec_name=s.get("name"),
             last_periodic=max(d for f, d in forms if f in ("10-K", "10-Q", "10-KT")),
             fye=s.get("fiscalYearEnd"))
    final.append(r)
    if n % 200 == 0:
        print("sub", n, len(keep), flush=True)
stats["submissions_drops"] = drop
stats["prefilter_drops"] = dropc
stats["universe_final"] = len(final)
save = OUT / ("universe_test.json" if LIMIT else "universe.json")
save.write_text(json.dumps({"stats": stats, "rows": final}, indent=1))
print(json.dumps(stats, indent=1))

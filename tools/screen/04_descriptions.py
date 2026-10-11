"""Step 4: Yahoo longBusinessSummary -> first sentence <=160 chars; fallback SEC sicDescription.
Usage: 04_descriptions.py [--test] [--n N]"""
import re, sys
from _util import *

TEST = "--test" in sys.argv
N = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 700
C = json.loads((OUT / ("caps_test.json" if TEST else "caps.json")).read_text())["rows"][:N]
ABBR = {"inc", "corp", "ltd", "co", "l.p", "u.s", "no", "llc", "plc", "s.a", "n.v", "st", "mr", "dr", "e.g", "i.e", "vs", "etc", "jr", "sr", "n.a", "p.c", "u.k", "bancorp", "ag"}


def first_sentence(t):
    t = re.sub(r"\s+", " ", t).strip()
    for m in re.finditer(r"[.!?](?=\s+[A-Z\"'(])", t):
        pre = t[:m.start()].split(" ")[-1].lower().strip("(),;\"'")
        if pre in ABBR or len(pre) == 1:
            continue
        return t[:m.end()]
    return t


def clip(s, n=160):
    if len(s) <= n:
        return s
    cut = s[:n - 1]
    cut = cut[:cut.rfind(" ")] if " " in cut else cut
    return cut.rstrip(" ,;:-") + "…"


y = Yahoo()
res, miss = {}, 0
for i, r in enumerate(C):
    sym = r["ticker"]
    j = cached(RAW / f"prof_{sym.replace('/', '_')}.json",
               lambda: (y.get(f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{sym}?modules=assetProfile", gap=0.5) or {}))
    txt = None
    try:
        txt = j["quoteSummary"]["result"][0]["assetProfile"].get("longBusinessSummary")
    except Exception:
        pass
    if txt and len(txt.strip()) > 20:
        res[sym] = {"description": clip(first_sentence(txt)), "src": "yahoo"}
    else:
        miss += 1
        res[sym] = {"description": "Operates in: " + (r.get("sic_desc") or "unknown industry"), "src": "sic"}
    if i % 100 == 0:
        print(i, flush=True)
(OUT / ("desc_test.json" if TEST else "desc.json")).write_text(json.dumps(res, indent=1))
print("rows", len(res), "misses", miss)

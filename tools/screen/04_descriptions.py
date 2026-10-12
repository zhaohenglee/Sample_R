"""Step 4: Yahoo longBusinessSummary -> first sentence <=160 chars; fallback SEC sicDescription.
Usage: 04_descriptions.py [--test] [--n N]"""
import re, sys
from _util import *

TEST = "--test" in sys.argv
N = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 700
C = json.loads((OUT / ("caps_test.json" if TEST else "caps.json")).read_text())["rows"][:N]
ABBR = {"inc", "corp", "ltd", "co", "l.p", "u.s", "no", "llc", "plc", "s.a", "n.v", "st", "mr", "dr", "e.g", "i.e", "vs", "etc", "jr", "sr", "n.a", "p.c", "u.k", "bancorp", "ag"}


BOILER = re.compile(r"\b(incorporated|founded|formed|was organized|were organized|headquartered|was established|was originally|changed its name|is based in|is a (?:\w+ )?(?:corporation|company) (?:formed|incorporated|organized))\b", re.I)
SELL = re.compile(r"\b(provides?|offers?|sells?|develops?|manufactur\w*|designs?|distributes?|markets?|leases?|produces?|delivers?|commerciali[sz]\w*|engages? in|operates? (?!as\b)|owns? and operates?|owned and operated|owns?\b|focus(?:es|ed) on|is (?:a|an) [^.]{0,60}(?:bank|REIT|trust))", re.I)
NOT_SELL = re.compile(r"owned? (?:100%|all|a majority|\d+%)|general partner|operating partnership|subsidiar", re.I)
GENERIC = re.compile(r"operates? as an? [^.]{0,80}company", re.I)


def sentences(t):
    t = re.sub(r"\s+", " ", t).strip()
    out, last = [], 0
    for m in re.finditer(r"[.!?](?=\s+[A-Z\"'(])", t):
        pre = t[:m.start()].split(" ")[-1].lower().strip("(),;\"'")
        if pre in ABBR or len(pre) == 1:
            continue
        out.append(t[last:m.end()].strip()); last = m.end()
    if last < len(t):
        out.append(t[last:].strip())
    return out


def good(x):
    return bool(SELL.search(x)) and not NOT_SELL.search(x) and not (BOILER.search(x) and not re.search(r"\b(provides?|offers?|sells?|develops?|manufactur\w*)\b", x, re.I))


def first_sentence(t):
    ss = sentences(t)
    if not ss:
        return None
    a = ss[0]
    if not BOILER.search(a) and not GENERIC.search(a):
        return a
    for x in ss[1:]:
        if good(x):
            return x
    if BOILER.search(a):
        return None  # only boilerplate: caller falls back to SIC
    return a


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
    fs = first_sentence(txt) if txt and len(txt.strip()) > 20 else None
    if fs:
        res[sym] = {"description": clip(fs), "src": "yahoo"}
    else:
        miss += 1
        res[sym] = {"description": "Operates in: " + (r.get("sic_desc") or "unknown industry"), "src": "sic"}
    if i % 100 == 0:
        print(i, flush=True)

# shell company flag: iXBRL cover page dei:EntityShellCompany of the latest 10-K/10-Q (box checked = shell)
import urllib.request
def shell_flag(r):
    cik = r["cik"]; p = RAW / f"shell_{cik:010d}.json"
    if p.exists():
        return json.loads(p.read_text())
    sub = json.loads((RAW / f"sub_{cik:010d}.json").read_text())["filings"]["recent"]
    val = None
    for i, f in enumerate(sub["form"]):
        if f in ("10-K", "10-Q", "10-KT"):
            acc = sub["accessionNumber"][i].replace("-", ""); doc = sub["primaryDocument"][i]
            url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/{doc}"
            try:
                from _util import _sleep_to
                _sleep_to("sec", 0.15)
                req = urllib.request.Request(url, headers={"User-Agent": SEC_UA, "Accept-Encoding": "identity"})
                b = urllib.request.urlopen(req, timeout=60).read(500000).decode("utf8", "ignore")
                m = re.search(r'<ix:nonNumeric([^>]*name="dei:EntityShellCompany"[^>]*)>(.*?)</ix:nonNumeric>', b, re.S)
                if m:
                    attrs, body = m.group(1), re.sub(r"<[^>]+>", "", m.group(2)).strip().lower()
                    fm = re.search(r'format="([^"]+)"', attrs)
                    fm = fm.group(1).lower() if fm else ""
                    if fm.endswith("fixed-true") or fm.endswith("booleantrue"):
                        val = True
                    elif fm.endswith("fixed-false") or fm.endswith("booleanfalse"):
                        val = False
                    elif "ballotbox" in fm or not fm:
                        if body in ("&#9746;", "\u2612", "&#x2612;", "true", "yes"): val = True
                        elif body in ("&#9744;", "\u2610", "&#x2610;", "false", "no"): val = False
            except Exception:
                val = None
            break
    p.write_text(json.dumps({"shell": val}))
    return {"shell": val}


shells = {}
for r in C:
    shells[r["ticker"]] = shell_flag(r)["shell"]
    dsc = res[r["ticker"]]["description"].lower()
    if shells[r["ticker"]] is not True and re.search(r"does not have significant operations|shell (company|corporation)|no operations", dsc):
        shells[r["ticker"]] = "text"
(OUT / ("shell_test.json" if TEST else "shell.json")).write_text(json.dumps(shells, indent=1))
print("shell flags:", sum(1 for v in shells.values() if v), "undetermined:", sum(1 for v in shells.values() if v is None))
(OUT / ("desc_test.json" if TEST else "desc.json")).write_text(json.dumps(res, indent=1))
print("rows", len(res), "misses", miss)

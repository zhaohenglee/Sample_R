"""Shared helpers for the micro cap screen (independent of the EPV tools)."""
import http.cookiejar, json, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "output" / "microcaps" / "raw"
OUT = ROOT / "output" / "microcaps"
RAW.mkdir(parents=True, exist_ok=True)
TODAY = "2026-10-11"
SEC_UA = "Sample_R EPV research qtcmrg9hbj@privaterelay.appleid.com"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
_last = {"sec": 0.0, "yq": 0.0}


def _sleep_to(key, gap):
    d = _last[key] + gap - time.time()
    if d > 0:
        time.sleep(d)
    _last[key] = time.time()


def sec_get(url, retries=5):
    """SEC JSON GET, ~8 req/s max. Returns None on 404."""
    for i in range(retries):
        _sleep_to("sec", 0.125)
        req = urllib.request.Request(url, headers={"User-Agent": SEC_UA, "Accept-Encoding": "identity"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if i == retries - 1:
                raise
            time.sleep(2 ** (i + 1))
        except Exception:
            if i == retries - 1:
                raise
            time.sleep(2 ** (i + 1))


def cached(path, fn):
    p = Path(path)
    if p.exists():
        return json.loads(p.read_text())
    d = fn()
    p.write_text(json.dumps(d))
    return d


class Yahoo:
    def __init__(self):
        self.cj = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))
        self.op.addheaders = [("User-Agent", BROWSER_UA), ("Accept", "*/*")]
        self.crumb = None
        self.login()

    def login(self):
        try:
            self.op.open("https://fc.yahoo.com", timeout=30).read()
        except urllib.error.HTTPError:
            pass  # 404 still sets cookie
        self.crumb = self.op.open("https://query2.finance.yahoo.com/v1/test/getcrumb", timeout=30).read().decode()

    def get(self, url, gap=0.5, retries=6):
        for i in range(retries):
            _sleep_to("yq", gap)
            u = url + ("&" if "?" in url else "?") + "crumb=" + urllib.parse.quote(self.crumb)
            try:
                return json.load(self.op.open(u, timeout=60))
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return None
                if e.code in (401, 403):
                    try: self.login()
                    except Exception: pass
                if i == retries - 1:
                    raise
                time.sleep(2 ** (i + 1))
            except Exception:
                if i == retries - 1:
                    raise
                time.sleep(2 ** (i + 1))

    def quotes(self, symbols):
        s = urllib.parse.quote(",".join(symbols), safe=",")
        d = self.get("https://query2.finance.yahoo.com/v7/finance/quote?symbols=" + s)
        return (d or {}).get("quoteResponse", {}).get("result", [])


def share_frames():
    """Latest dei shares outstanding per CIK across CY2025Q4I..CY2026Q3I frames."""
    frames = {}
    for p in ("CY2025Q4I", "CY2026Q1I", "CY2026Q2I", "CY2026Q3I"):
        j = cached(RAW / f"frame_shares_{p}.json",
                   lambda: sec_get(f"https://data.sec.gov/api/xbrl/frames/dei/EntityCommonStockSharesOutstanding/shares/{p}.json") or {"data": []})
        for e in j["data"]:
            c = e["cik"]
            if c not in frames or e["end"] > frames[c]["end"]:
                frames[c] = {"val": e["val"], "end": e["end"]}
    return frames

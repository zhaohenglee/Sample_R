"""Shared paths and HTTP helpers for the EPV pipeline."""
import json
import os
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "template" / "epv_template.xlsx"
OUTPUT = ROOT / "output"

# SEC requires a descriptive User-Agent with contact info.
USER_AGENT = os.environ.get("SEC_USER_AGENT", "Sample_R EPV research contact@example.com")

# Template years: D..M = 10 fiscal years.
YEAR_COLS = list("DEFGHIJKLM")


def out_dir(ticker):
    d = OUTPUT / ticker.upper()
    d.mkdir(parents=True, exist_ok=True)
    return d


def http_json(url, retries=4):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for i in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception:
            if i == retries - 1:
                raise
            time.sleep(2 ** (i + 1))


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, sort_keys=False)


def load_inputs(ticker):
    """inputs.json with output/TICKER/overrides.json applied ({"field": {"year": value}})."""
    d = out_dir(ticker)
    inp = load_json(d / "inputs.json")
    ov_path = d / "overrides.json"
    if ov_path.exists():
        for field, by_year in load_json(ov_path).items():
            target = {"price": inp.setdefault("price", {}),
                      "shares": inp.setdefault("shares_current_basis", {})}.get(field)
            if target is None:
                target = inp["fields"].setdefault(field, {})
            for y, v in by_year.items():
                target[str(y)] = v
        inp["overrides_applied"] = True
    return inp

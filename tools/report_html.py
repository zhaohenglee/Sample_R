"""Render output/TICKER/report.html from summary.json, inputs.json (with overrides),
validation.json and optional report_notes.json.

Usage: python3 tools/report_html.py TICKER

The output is an HTML fragment (no doctype/html/head/body) for publishing as an artifact.
"""
import datetime
import html
import math
import re
import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from common import load_inputs, load_json, out_dir  # noqa: E402

esc = html.escape
SUFFIXES = {"INC", "CORP", "CORPORATION", "CO", "COM", "LTD", "PLC", "HOLDINGS", "COMPANY", "THE", "GROUP"}


def short_name(name):
    words = [w for w in re.split(r"[\s,.]+", name or "") if w]
    keep = [w for w in words if w.upper() not in SUFFIXES] or words
    return " ".join(w.capitalize() if w.isupper() else w for w in keep)


def nice_step(span, n=5):
    raw = span / n
    p = 10 ** math.floor(math.log10(raw))
    for m in (1, 2, 2.5, 5, 10):
        if raw <= m * p:
            return m * p
    return 10 * p


def ticks(lo, hi, n=5):
    step = nice_step(hi - lo, n)
    t = math.floor(lo / step) * step
    out = []
    while t <= hi + step * 0.999:
        out.append(round(t, 10))
        if t >= hi - 1e-9:
            break
        t += step
    return out


def b(v, d=1):
    return f"{v / 1000:,.{d}f}"


def pct(v, d=1):
    return f"{v * 100:.{d}f}%"


# ---------- SVG charts ----------

def svg_decomp(ps, price):
    W, H, L, R = 720, 150, 16, 16
    ev = ps["ev"]
    sc = (W - L - R) / max(ev, price)
    x = lambda v: L + v * sc
    y0, bh = 50, 40
    parts = [("seg-ic", ps["invested_capital"]), ("seg-pv", ps["pv_comp_adv"]), ("seg-gr", ps["growth_value"])]
    s = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="EV per share split into invested capital, '
         f'PV of competitive advantage and market implied growth" style="min-width:480px">']
    cur = 0
    for cls, v in parts:
        s.append(f'<rect class="{cls}" x="{x(cur):.1f}" y="{y0}" width="{max(v * sc, 0):.1f}" height="{bh}" fill="var(--c-ic)"/>')
        if v * sc > 46:
            s.append(f'<text class="lab-in {cls}-t" x="{x(cur + v / 2):.1f}" y="{y0 + bh / 2 + 4}" text-anchor="middle">{pct(v / ev, 0)}</text>')
        cur += v
    epv = ps["epv"]
    # EPV bracket under bar
    s.append(f'<path class="mk" d="M{x(epv):.1f} {y0 + bh}V{y0 + bh + 14}" fill="none"/>')
    s.append(f'<text class="lab" x="{x(epv):.1f}" y="{y0 + bh + 30}" text-anchor="middle">EPV ${epv:,.2f}</text>')
    # EV end
    s.append(f'<path class="mk" d="M{x(ev):.1f} {y0 + bh}V{y0 + bh + 14}" fill="none"/>')
    s.append(f'<text class="lab" x="{x(ev):.1f}" y="{y0 + bh + 30}" text-anchor="end">EV ${ev:,.2f}</text>')
    # price marker above
    px = x(price)
    s.append(f'<path class="mk-price" d="M{px:.1f} {y0 - 12}V{y0 + bh}" fill="none"/>')
    s.append(f'<path class="price-tri" d="M{px - 5:.1f} {y0 - 14}h10l-5 8z" fill="var(--price)"/>')
    s.append(f'<text class="lab-price" x="{px:.1f}" y="{y0 - 20}" text-anchor="end">Price ${price:,.2f}</text>')
    s.append(f'<text class="lab-dim" x="{L}" y="{y0 - 20}">$ per share, drawn to scale</text>')
    s.append("</svg>")
    return "".join(s)


def svg_stack(years, by):
    W, H, L, R, T, B = 720, 360, 60, 16, 28, 34
    stacks = []
    for y in years:
        d = by[y]
        vals = [d["invested_capital"], d["pv_comp_adv"], d["growth_value"]]
        stacks.append((y, [v / 1000 for v in vals], d["ev"] / 1000))
    hi = max(max(sum(v for v in vs if v > 0), ev) for _, vs, ev in stacks)
    lo = min(min(sum(v for v in vs if v < 0) for _, vs, _ in stacks), 0)
    tk = ticks(lo, hi)
    lo, hi = min(tk), max(tk)
    y = lambda v: T + (hi - v) / (hi - lo) * (H - T - B)
    slot = (W - L - R) / len(years)
    bw = slot * 0.6
    s = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Enterprise value by year split into invested '
         f'capital, PV of competitive advantage and growth value, in billions of dollars" style="min-width:560px">']
    for t in tk:
        s.append(f'<path class="grid" d="M{L} {y(t):.1f}H{W - R}" fill="none"/>')
        s.append(f'<text class="tick" x="{L - 6}" y="{y(t) + 4:.1f}" text-anchor="end">{t:,.0f}</text>')
    s.append(f'<text class="lab-dim" x="{L - 6}" y="{T - 14}" text-anchor="end">$B</text>')
    classes = ["seg-ic", "seg-pv", "seg-gr"]
    for i, (yr, vs, ev) in enumerate(stacks):
        x = L + i * slot + (slot - bw) / 2
        pos = neg = 0
        for cls, v in zip(classes, vs):
            if v >= 0:
                top, bot = pos + v, pos
                pos = top
            else:
                top, bot = neg, neg + v
                neg = bot
            s.append(f'<rect class="{cls}" x="{x:.1f}" y="{y(top):.1f}" width="{bw:.1f}" height="{max(y(bot) - y(top), 0):.1f}" fill="var(--c-ic)"/>')
        cx = x + bw / 2
        s.append(f'<path class="ev-tick" d="M{x - 3:.1f} {y(ev):.1f}H{x + bw + 3:.1f}" fill="none"/>')
        s.append(f'<circle class="ev-dot" cx="{cx:.1f}" cy="{y(ev):.1f}" r="4" fill="var(--ev)"/>')
        s.append(f'<text class="tick" x="{cx:.1f}" y="{H - 12}" text-anchor="middle">{yr}</text>')
    s.append(f'<path class="axis" d="M{L} {y(0):.1f}H{W - R}" fill="none"/>')
    s.append("</svg>")
    return "".join(s)


def svg_roic(years, by, coc):
    W, H, L, R, T, B = 720, 330, 52, 100, 36, 58
    vals = [by[y]["roic"] for y in years]
    tk = ticks(min(0, min(vals)), max(vals + [coc]) * 1.05, 5)
    lo, hi = min(tk), max(tk)
    y = lambda v: T + (hi - v) / (hi - lo) * (H - T - B)
    slot = (W - L - R) / (len(years) - 1)
    x = lambda i: L + 0.5 * slot * 0 + i * slot
    s = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Return on invested capital by year against the '
         f'cost of capital" style="min-width:560px">']
    for t in tk:
        s.append(f'<path class="grid" d="M{L} {y(t):.1f}H{W - R}" fill="none"/>')
        s.append(f'<text class="tick" x="{L - 6}" y="{y(t) + 4:.1f}" text-anchor="end">{t * 100:.0f}%</text>')
    s.append(f'<path class="coc" d="M{L} {y(coc):.1f}H{W - R}" fill="none"/>')
    s.append(f'<text class="lab-coc" x="{W - R + 8}" y="{y(coc) - 2:.1f}">{coc * 100:.0f}% cost</text>')
    s.append(f'<text class="lab-coc" x="{W - R + 8}" y="{y(coc) + 13:.1f}">of capital</text>')
    pts = " ".join(f"{x(i):.1f},{y(v):.1f}" for i, v in enumerate(vals))
    s.append(f'<polyline class="line" points="{pts}" fill="none"/>')
    # lease break
    if "2019" in years and "2018" in years:
        i = years.index("2019")
        xm = x(i) - slot / 2
        s.append(f'<path class="note-line" d="M{xm:.1f} {T - 10}V{H - B}" fill="none"/>')
        s.append(f'<text class="note" x="{xm + 6:.1f}" y="{T - 2}">2019: leases enter IC</text>')
    for i, (yr, v) in enumerate(zip(years, vals)):
        s.append(f'<circle class="dot" cx="{x(i):.1f}" cy="{y(v):.1f}" r="4" fill="var(--accent)"/>')
        lmin = 0 < i < len(vals) - 1 and v < vals[i - 1] and v < vals[i + 1]
        ty = y(v) + 17 if lmin else y(v) - 9
        s.append(f'<text class="vlab" x="{x(i):.1f}" y="{ty:.1f}" text-anchor="middle">{pct(v)}</text>')
        s.append(f'<text class="tick" x="{x(i):.1f}" y="{H - 14}" text-anchor="middle">{yr}</text>')
        tr = by[yr].get("tax_rate")
        if tr is not None and tr > 0.4:
            s.append(f'<text class="note" x="{x(i):.1f}" y="{ty + 13:.1f}" text-anchor="middle">{tr * 100:.0f}% tax rate</text>')
    s.append("</svg>")
    return "".join(s)


# ---------- page ----------

CSS = """
:root{--bg:#f6f8f9;--fg:#18242b;--muted:#5a6b75;--card:#ffffff;--line:#d9e1e5;--grid:#e6ecef;
--accent:#0b6b73;--c-ic:#8a9ba5;--c-pv:#0b6b73;--c-gr:#bcd9dc;--ev:#18242b;--price:#b3401d;--on-seg:#ffffff;--on-light:#18242b;
--warn-bg:#fdf1d3;--warn-fg:#6b4800;--warn-bd:#e0b03a;--ok-bg:#dff1e4;--ok-fg:#1c5a2e;--bad-bg:#fbe0dc;--bad-fg:#8a1f12;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0f171b;--fg:#e4ecef;--muted:#92a4ad;--card:#162127;--line:#2a3a42;--grid:#223037;
--accent:#4fc3cc;--c-ic:#5d7380;--c-pv:#4fc3cc;--c-gr:#1f4a50;--ev:#f2f6f7;--price:#ff9a73;--on-seg:#0b1418;--on-light:#e4ecef;
--warn-bg:#3a2d0b;--warn-fg:#f3cf79;--warn-bd:#8a6a1c;--ok-bg:#16351f;--ok-fg:#9ad7ac;--bad-bg:#401a15;--bad-fg:#f4a99f;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f171b;--fg:#e4ecef;--muted:#92a4ad;--card:#162127;--line:#2a3a42;--grid:#223037;
--accent:#4fc3cc;--c-ic:#5d7380;--c-pv:#4fc3cc;--c-gr:#1f4a50;--ev:#f2f6f7;--price:#ff9a73;--on-seg:#0b1418;--on-light:#e4ecef;
--warn-bg:#3a2d0b;--warn-fg:#f3cf79;--warn-bd:#8a6a1c;--ok-bg:#16351f;--ok-fg:#9ad7ac;--bad-bg:#401a15;--bad-fg:#f4a99f;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:'IBM Plex Sans',system-ui,sans-serif;line-height:1.5;font-size:16px}
.wrap{max-width:960px;margin:0 auto;padding-inline:16px;padding-block:28px 48px}
h1,h2,.read{font-family:'Source Serif 4',Georgia,serif;font-weight:600}
h1{font-size:clamp(1.7rem,5vw,2.4rem);line-height:1.15;margin:0 0 4px}
h2{font-size:1.3rem;margin:36px 0 10px}
.sub{color:var(--muted);margin:0}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;margin-top:14px}
.meta span{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;font-size:.9rem}
.pill{display:inline-block;padding:3px 12px;border-radius:999px;font-size:.78rem;font-weight:600;letter-spacing:.04em;border:1px solid}
.pill.warn{background:var(--warn-bg);color:var(--warn-fg);border-color:var(--warn-bd)}
.pill.ok{background:var(--ok-bg);color:var(--ok-fg);border-color:var(--ok-fg)}
.pill.bad{background:var(--bad-bg);color:var(--bad-fg);border-color:var(--bad-fg)}
.read{font-size:clamp(1.25rem,3.6vw,1.65rem);line-height:1.35;margin:28px 0 0;padding-left:16px;border-left:4px solid var(--accent);font-weight:500}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
svg.chart{display:block;width:100%;height:auto}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.85rem;color:var(--muted);margin:0 0 8px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.legend .dot{border-radius:50%;background:var(--ev)}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{padding:6px 10px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--line);font-size:.9rem}
th:first-child,td:first-child{text-align:left}
td,.num{font-family:'IBM Plex Mono',monospace}
td:first-child{font-family:'IBM Plex Sans',sans-serif}
thead th{font-weight:600;color:var(--muted);font-size:.8rem}
.fin th:first-child,.fin td:first-child{position:sticky;left:0;background:var(--card)}
.sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px}
tr.sum td{font-weight:600}
table:not(.fin) td:first-child{white-space:normal}
ul{padding-left:20px;margin:0}
li{margin:6px 0}
.warnlist li::marker{color:var(--warn-bd)}
.warnbox{background:var(--warn-bg);color:var(--warn-fg);border:1px solid var(--warn-bd);border-radius:10px;padding:12px 16px 12px 12px}
.warnbox ul{padding-left:22px}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}
footer p{margin:4px 0}
code{font-family:'IBM Plex Mono',monospace;font-size:.85em;word-break:break-all}
.seg-ic{fill:var(--c-ic)}.seg-pv{fill:var(--c-pv)}.seg-gr{fill:var(--c-gr)}
.sw.seg-ic{background:var(--c-ic)}.sw.seg-pv{background:var(--c-pv)}.sw.seg-gr{background:var(--c-gr)}
.legend .seg-ic{background:var(--c-ic)}.legend .seg-pv{background:var(--c-pv)}.legend .seg-gr{background:var(--c-gr)}
svg text{font-family:'IBM Plex Mono',monospace;font-size:12px;fill:var(--fg);font-variant-numeric:tabular-nums}
svg .tick,svg .lab-dim{fill:var(--muted);font-size:11.5px}
svg .lab-in{fill:var(--on-light);font-size:12px;font-weight:600}
svg .seg-pv-t{fill:var(--on-seg)}
svg .lab-price{fill:var(--price);font-weight:600}
svg .lab{font-weight:600}
svg .lab-coc{fill:var(--muted);font-size:11.5px}
svg .vlab{font-size:11px;paint-order:stroke;stroke:var(--card);stroke-width:3px}
svg .note{fill:var(--price);font-size:11px;paint-order:stroke;stroke:var(--card);stroke-width:3px}
svg .grid{stroke:var(--grid);stroke-width:1}
svg .axis{stroke:var(--muted);stroke-width:1}
svg .mk{stroke:var(--fg);stroke-width:1.5}
svg .mk-price{stroke:var(--price);stroke-width:2}
svg .price-tri{fill:var(--price)}
svg .ev-tick{stroke:var(--ev);stroke-width:2}
svg .ev-dot{fill:var(--ev);stroke:var(--card);stroke-width:1.5}
svg .coc{stroke:var(--price);stroke-width:1.5;stroke-dasharray:6 4}
svg .line{stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round}
svg .dot{fill:var(--accent);stroke:var(--card);stroke-width:1.5}
svg .note-line{stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3}
"""

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600'
         '&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">')


def covered(warn, notes_warnings):
    tokens = {t for t in re.findall(r"\d+(?:\.\d+)?%?", warn) if t.endswith("%") or len(t) == 4}
    if not tokens:
        return False
    for n in notes_warnings:
        if tokens <= set(re.findall(r"\d+(?:\.\d+)?%?", n)):
            return True
    return False


def build(ticker):
    ticker = ticker.upper()
    d = out_dir(ticker)
    summary = load_json(d / "summary.json")
    inp = load_inputs(ticker)
    val = load_json(d / "validation.json") if (d / "validation.json").exists() else {}
    notes = load_json(d / "report_notes.json") if (d / "report_notes.json").exists() else {}

    ly = str(summary["latest_year"])
    by = summary["by_year"]
    years = sorted(by)
    ps = summary["per_share_latest"]
    coc = summary["cost_of_capital"]
    name = short_name(summary.get("name") or inp.get("name") or ticker)
    price = ps["price"]
    pdates = inp.get("price_date") or {}
    pdate = pdates.get(ly) if isinstance(pdates, dict) else pdates
    verdict = notes.get("verdict") or {"PASS": "PASS", "WARN": "PASS WITH WARNINGS", "FAIL": "FAIL"}.get(val.get("status"), "UNVALIDATED")
    vcls = "bad" if "FAIL" in verdict else "warn" if "WARN" in verdict else "ok"

    h = [f"<title>{esc(name)} EPV Valuation</title>", FONTS, f"<style>{CSS}</style>", '<div class="wrap">']
    h.append(f'<header><h1>{esc(name)} <span class="sub">({esc(ticker)})</span></h1>'
             f'<p class="sub">EPV valuation, FY{esc(ly)}</p><div class="meta">'
             f'<span>Price ${price:,.2f}{" on " + esc(pdate) if pdate else ""}</span>'
             f'<span>Cost of capital {coc * 100:.0f}%</span>'
             f'<span class="pill {vcls}">{esc(verdict)}</span></div></header>')
    if notes.get("read"):
        h.append(f'<p class="read">{esc(notes["read"])}</p>')

    # 3 decomposition
    pc = ps["pct_of_ev"]
    h.append(f'<h2>EV per share, FY{esc(ly)}</h2><div class="card"><div class="scroll">{svg_decomp(ps, price)}</div>'
             '<div class="scroll"><table><thead><tr><th>Item</th><th>$/share</th><th>% of EV</th></tr></thead><tbody>'
             f'<tr><td><span class="sw seg-ic"></span>Invested capital</td><td>{ps["invested_capital"]:,.2f}</td><td>{pct(pc["invested_capital"])}</td></tr>'
             f'<tr><td><span class="sw seg-pv"></span>PV of competitive advantage</td><td>{ps["pv_comp_adv"]:,.2f}</td><td>{pct(pc["pv_comp_adv"])}</td></tr>'
             f'<tr class="sum"><td>EPV (invested capital + PV of competitive advantage)</td><td>{ps["epv"]:,.2f}</td><td>{pct(pc["epv"])}</td></tr>'
             f'<tr><td><span class="sw seg-gr"></span>Market implied growth</td><td>{ps["growth_value"]:,.2f}</td><td>{pct(pc["growth_value"])}</td></tr>'
             f'<tr class="sum"><td>Enterprise value</td><td>{ps["ev"]:,.2f}</td><td>100.0%</td></tr>'
             f'<tr><td>Share price</td><td>{price:,.2f}</td><td>{pct(price / ps["ev"])}</td></tr>'
             '</tbody></table></div></div>')

    # 4 stacked columns
    h.append('<h2>Enterprise value by year</h2><div class="card"><p class="legend">'
             '<span><i class="seg-ic"></i>Invested capital</span><span><i class="seg-pv"></i>PV of competitive advantage</span>'
             '<span><i class="seg-gr"></i>Growth value</span><span><i class="dot"></i>Enterprise value</span></p>'
             f'<div class="scroll">{svg_stack(years, by)}</div></div>')

    # 5 ROIC
    h.append(f'<h2>ROIC against the {coc * 100:.0f}% cost of capital</h2><div class="card">'
             f'<div class="scroll">{svg_roic(years, by, coc)}</div></div>')

    # 6 financials
    rows = [("Revenue ($B)", lambda r: b(r["revenue"])), ("Operating profit ($B)", lambda r: b(r["operating_profit"])),
            ("Operating margin", lambda r: pct(r["op_margin"])), ("Tax rate", lambda r: pct(r["tax_rate"])),
            ("NOPAT ($B)", lambda r: b(r["nopat"])), ("Invested capital ($B)", lambda r: b(r["invested_capital"])),
            ("ROIC", lambda r: pct(r["roic"])), ("EV ($B)", lambda r: b(r["ev"])), ("EPV ($B)", lambda r: b(r["epv"])),
            ("Price ($)", lambda r: f'{r["price"]:,.2f}'), ("Shares (B)", lambda r: f'{r["shares"] / 1000:,.2f}')]
    t = ['<h2>Key financials</h2><div class="scroll card"><table class="fin"><thead><tr><th>Fiscal year</th>'
         + "".join(f"<th>{y}</th>" for y in years) + "</tr></thead><tbody>"]
    for label, fn in rows:
        t.append(f"<tr><td>{label}</td>" + "".join(f"<td>{fn(by[y])}</td>" for y in years) + "</tr>")
    t.append("</tbody></table></div>")
    h.append("".join(t))

    # 7 decisions and warnings
    if notes.get("decisions"):
        h.append("<h2>Model decisions</h2><ul>" + "".join(f"<li>{esc(x)}</li>" for x in notes["decisions"]) + "</ul>")
    nw = list(notes.get("warnings", []))
    extra = [w for w in val.get("warn", []) if not covered(w, nw)]
    fails = val.get("fail", [])
    if nw or extra or fails:
        h.append('<h2>Validation warnings</h2><div class="warnbox"><ul class="warnlist">'
                 + "".join(f"<li>{esc(x)}</li>" for x in fails + nw + extra) + "</ul></div>")

    h.append(f'<footer><p>Data: SEC EDGAR XBRL 10-K filings; Yahoo Finance prices (split adjusted).</p>'
             f'<p>Workbook: <code>output/{esc(ticker)}/{esc(ticker)}_EPV.xlsx</code></p>'
             f'<p>Generated {datetime.date.today().isoformat()}</p></footer></div>')
    path = d / "report.html"
    path.write_text("\n".join(h), encoding="utf-8")
    return path


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: report_html.py TICKER")
    print(build(sys.argv[1]))

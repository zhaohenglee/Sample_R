"""Step 6: render output/microcaps/report.html from microcaps_500.csv + checks.json."""
import csv, json, statistics
from html import escape
from pathlib import Path
from collections import Counter

OUT = Path(__file__).resolve().parents[2] / "output" / "microcaps"
rows = list(csv.DictReader(open(OUT / "microcaps_500.csv", newline="", encoding="utf-8")))
checks = json.loads((OUT / "checks.json").read_text())
N = len(rows)


def fnum(x):
    try:
        return float(x) if x not in ("", None) else None
    except ValueError:
        return None


def fmt_cap(v):
    if v is None:
        return "n/a"
    if v < 0.01:
        return f"{v:.4f}"
    if v < 1:
        return f"{v:.3f}"
    return f"{v:,.2f}"


def fmt_price(v):
    if v is None:
        return "n/a"
    return f"{v:.4f}" if v < 0.1 else f"{v:,.2f}"


caps = [fnum(r["market_cap_usd_m"]) for r in rows]
valid = [c for c in caps if c is not None]
asof = max(r["price_date"] for r in rows)
ex = Counter(r["exchange"] for r in rows)
npos = sum(1 for r in rows if (fnum(r["nopat_m"]) or 0) > 0)
nneg = sum(1 for r in rows if fnum(r["nopat_m"]) is not None and fnum(r["nopat_m"]) <= 0)
nun = sum(1 for r in rows if fnum(r["nopat_m"]) is None)
shells = sum(1 for r in rows if "shell_company" in r["flags"].split(";"))
fc = checks.get("flag_counts", {})
n_split, n_yh = fc.get("split_check", 44), fc.get("shares_from_yahoo", 30)

data = []
for r, c in zip(rows, caps):
    data.append({
        "rank": int(r["rank"]), "t": r["ticker"], "c": r["company"], "e": r["exchange"],
        "m": c, "p": fnum(r["price"]), "d": r["description"], "n": fnum(r["nopat_m"]),
        "s": r["nopat_sentence"], "f": [f for f in r["flags"].split(";") if f],
    })


def chips(fl):
    return "".join(f'<span class="chip{" warn" if f in ("split_check","shares_from_yahoo","shell_company","shell_undetermined") else ""}">{escape(f)}</span>' for f in fl)


def row_html(d):
    nc = "pos" if (d["n"] or 0) > 0 else ("neg" if d["n"] is not None else "na")
    return (f'<tr><td class="num">{d["rank"]}</td><td class="tk">{escape(d["t"])}</td><td class="co">{escape(d["c"])}</td>'
            f'<td>{escape(d["e"])}</td><td class="num">{fmt_cap(d["m"])}</td><td class="num">{fmt_price(d["p"])}</td>'
            f'<td class="desc">{escape(d["d"])}</td><td class="np {nc}">{escape(d["s"])}</td><td class="fl">{chips(d["f"])}</td></tr>')


static_rows = "\n".join(row_html(d) for d in data)
json_data = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600'
         '&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet">')

CSS = """
:root{--bg:#f6f8f9;--fg:#18242b;--muted:#5a6b75;--card:#ffffff;--line:#d9e1e5;--grid:#e6ecef;
--accent:#0b6b73;--on-accent:#ffffff;--pos:#1c5a2e;--neg:#8a1f12;
--warn-bg:#fdf1d3;--warn-fg:#6b4800;--warn-bd:#e0b03a;--chip-bg:#e6ecef;--head-bg:#eef3f5;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0f171b;--fg:#e4ecef;--muted:#92a4ad;--card:#162127;--line:#2a3a42;--grid:#223037;
--accent:#4fc3cc;--on-accent:#0b1418;--pos:#9ad7ac;--neg:#f4a99f;
--warn-bg:#3a2d0b;--warn-fg:#f3cf79;--warn-bd:#8a6a1c;--chip-bg:#223037;--head-bg:#1b2a31;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f171b;--fg:#e4ecef;--muted:#92a4ad;--card:#162127;--line:#2a3a42;--grid:#223037;
--accent:#4fc3cc;--on-accent:#0b1418;--pos:#9ad7ac;--neg:#f4a99f;
--warn-bg:#3a2d0b;--warn-fg:#f3cf79;--warn-bd:#8a6a1c;--chip-bg:#223037;--head-bg:#1b2a31;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 "IBM Plex Sans",system-ui,sans-serif}
.wrap{max-width:1200px;margin:0 auto;padding:24px 16px 48px}
h1{font:600 clamp(1.6rem,5vw,2.4rem)/1.15 "Source Serif 4",Georgia,serif;margin:0 0 8px}
.sub{color:var(--muted);margin:0 0 20px;max-width:80ch}
.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.stat .k{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.stat .v{font:600 .95rem "IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.note{background:var(--warn-bg);color:var(--warn-fg);border:1px solid var(--warn-bd);border-radius:8px;padding:12px 16px;margin-bottom:20px}
.note strong{display:block;margin-bottom:4px}.note ul{margin:0;padding-left:20px}.note li{margin:3px 0}
.controls{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:end;margin-bottom:10px}
.field{display:flex;flex-direction:column;gap:3px;min-width:0}
.field label,.lbl{font-size:.75rem;color:var(--muted)}
input[type=search]{font:inherit;color:var(--fg);background:var(--card);border:1px solid var(--line);border-radius:6px;padding:7px 10px;width:min(320px,100%)}
.btns{display:flex;flex-wrap:wrap;gap:6px}
.btns button,th button{font:inherit;color:var(--fg);background:var(--card);border:1px solid var(--line);border-radius:6px;padding:6px 12px;cursor:pointer}
.btns button[aria-pressed=true]{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.chk{display:flex;gap:6px;align-items:center;padding-bottom:7px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.count{font:.85rem "IBM Plex Mono",monospace;color:var(--muted);margin:0 0 8px}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--card);max-height:80vh}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:.85rem}
th,td{padding:7px 10px;border-bottom:1px solid var(--grid);text-align:left;vertical-align:top}
thead th{position:sticky;top:env(safe-area-inset-top,0px);background:var(--head-bg);z-index:1;white-space:nowrap;font-weight:600;border-bottom:1px solid var(--line)}
th button{border:0;background:none;padding:0;font-weight:600}
th button::after{content:" \\2195";color:var(--muted)}
th[aria-sort=ascending] button::after{content:" \\2191";color:var(--accent)}
th[aria-sort=descending] button::after{content:" \\2193";color:var(--accent)}
.num{text-align:right;font-variant-numeric:tabular-nums;font-family:"IBM Plex Mono",monospace;white-space:nowrap}
th.r{text-align:right}
.tk{font:600 .85rem "IBM Plex Mono",monospace}
.co{min-width:150px}.desc{min-width:220px;max-width:360px}.np{min-width:200px;max-width:260px}
.np.pos{color:var(--pos)}.np.neg{color:var(--neg)}.np.na{color:var(--muted)}
.fl{min-width:140px}
.chip{display:inline-block;background:var(--chip-bg);border-radius:999px;padding:1px 8px;margin:1px 2px 1px 0;font-size:.7rem;white-space:nowrap}
.chip.warn{background:var(--warn-bg);color:var(--warn-fg)}
footer{margin-top:24px;color:var(--muted);font-size:.85rem}footer p{margin:6px 0}
code{font-family:"IBM Plex Mono",monospace;font-size:.85em}
"""

JS = r"""
(function(){
var D=JSON.parse(document.getElementById('data').textContent);
var st={q:'',ex:'All',pos:false,key:'rank',dir:1};
var tb=document.getElementById('tbody'),cnt=document.getElementById('count');
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function cap(v){if(v===null)return 'n/a';if(v<0.01)return v.toFixed(4);if(v<1)return v.toFixed(3);return v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function pr(v){if(v===null)return 'n/a';return v<0.1?v.toFixed(4):v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
var W={split_check:1,shares_from_yahoo:1,shell_company:1,shell_undetermined:1};
function row(d){var nc=d.n>0?'pos':(d.n!==null?'neg':'na');
return '<tr><td class="num">'+d.rank+'</td><td class="tk">'+esc(d.t)+'</td><td class="co">'+esc(d.c)+'</td><td>'+esc(d.e)+'</td><td class="num">'+cap(d.m)+'</td><td class="num">'+pr(d.p)+'</td><td class="desc">'+esc(d.d)+'</td><td class="np '+nc+'">'+esc(d.s)+'</td><td class="fl">'+d.f.map(function(f){return '<span class="chip'+(W[f]?' warn':'')+'">'+esc(f)+'</span>';}).join('')+'</td></tr>';}
function val(d){return st.key==='rank'?d.rank:(st.key==='m'?d.m:d.n);}
function render(){
var q=st.q.trim().toLowerCase();
var L=D.filter(function(d){
if(st.ex!=='All'&&d.e!==st.ex)return false;
if(st.pos&&!(d.n>0))return false;
if(q&&(d.t+' '+d.c+' '+d.d).toLowerCase().indexOf(q)<0)return false;
return true;});
L.sort(function(a,b){var x=val(a),y=val(b);
if(x===null&&y===null)return a.rank-b.rank;if(x===null)return 1;if(y===null)return -1;
return x===y?a.rank-b.rank:(x-y)*st.dir;});
tb.innerHTML=L.map(row).join('');
cnt.textContent='Showing '+L.length+' of '+D.length+' companies';
}
document.getElementById('q').addEventListener('input',function(e){st.q=e.target.value;render();});
document.getElementById('pos').addEventListener('change',function(e){st.pos=e.target.checked;render();});
var eb=document.querySelectorAll('[data-ex]');
Array.prototype.forEach.call(eb,function(b){b.addEventListener('click',function(){
st.ex=b.getAttribute('data-ex');Array.prototype.forEach.call(eb,function(o){o.setAttribute('aria-pressed',o===b?'true':'false');});render();});});
var ths=document.querySelectorAll('th[data-k]');
Array.prototype.forEach.call(ths,function(th){th.querySelector('button').addEventListener('click',function(){
var k=th.getAttribute('data-k');
if(st.key===k)st.dir=-st.dir;else{st.key=k;st.dir=1;}
Array.prototype.forEach.call(ths,function(o){o.setAttribute('aria-sort',o===th?(st.dir===1?'ascending':'descending'):'none');});
render();});});
render();
})();
"""

exmix = ", ".join(f"{k} {v}" for k, v in ex.most_common())
strip = [
    ("Companies", f"{N}"),
    ("Market cap, $M (min / median / max)", f"{fmt_cap(min(valid))} / {fmt_cap(statistics.median(valid))} / {fmt_cap(max(valid))}"),
    ("Exchange mix", exmix),
    ("NOPAT positive / negative / n/a", f"{npos} / {nneg} / {nun}"),
    ("Shells flagged", f"{shells}"),
]
strip_html = "".join(f'<div class="stat"><div class="k">{escape(k)}</div><div class="v">{escape(v)}</div></div>' for k, v in strip)

html = f"""<title>Smallest 500 US Listed Companies</title>
{FONTS}
<style>{CSS}</style>
<div class="wrap">
<h1>Smallest 500 US Listed Companies</h1>
<p class="sub">Data as of {escape(asof)} (newest price date), ranked by market cap ascending. Scope: SEC 10-K/10-Q filers on Nasdaq, NYSE and OTC. SPACs, funds/BDCs, subsidiary preferreds/notes, 20-F filers and names with no trades in 30 days are excluded. No liquidity floor.</p>
<div class="strip">{strip_html}</div>
<div class="note" role="note"><strong>Validated: pass with warnings.</strong><ul>
<li>ADTX market cap is about $3M, not ~$2K (heavy dilution after its last reverse split; Nasdaq delisting filed 2026-10-07, now OTC).</li>
<li>WHLR share count is unverified after serial reverse splits.</li>
<li>Several bottom names (e.g. STAI) are delinquent or defunct filers.</li>
<li>Rows flagged split_check ({n_split}) or shares_from_yahoo ({n_yh}) carry lower confidence on market cap.</li>
</ul></div>
<div class="controls">
<div class="field"><label for="q">Search ticker, company or description</label><input type="search" id="q" autocomplete="off" placeholder="Search"></div>
<div class="field"><span class="lbl" id="exl">Exchange</span><div class="btns" role="group" aria-labelledby="exl">
<button type="button" id="ex-all" data-ex="All" aria-pressed="true">All</button>
<button type="button" id="ex-nasdaq" data-ex="Nasdaq" aria-pressed="false">Nasdaq</button>
<button type="button" id="ex-nyse" data-ex="NYSE" aria-pressed="false">NYSE</button>
<button type="button" id="ex-otc" data-ex="OTC" aria-pressed="false">OTC</button></div></div>
<div class="chk"><input type="checkbox" id="pos"><label for="pos">Positive NOPAT only</label></div>
</div>
<p class="count" id="count" aria-live="polite">Showing {N} of {N} companies</p>
<div class="tw"><table>
<thead><tr>
<th class="r" data-k="rank" aria-sort="ascending"><button type="button" id="s-rank">Rank</button></th><th>Ticker</th><th>Company</th><th>Exchange</th>
<th class="r" data-k="m" aria-sort="none"><button type="button" id="s-cap">Market cap ($M)</button></th><th class="r">Price ($)</th><th>Description</th>
<th data-k="n" aria-sort="none"><button type="button" id="s-nopat">NOPAT</button></th><th>Flags</th></tr></thead>
<tbody id="tbody">
{static_rows}
</tbody></table></div>
<footer>
<p>Sources: SEC EDGAR submissions, XBRL frames and companyfacts; Yahoo Finance quotes, charts and company profiles.</p>
<p>Files: <code>output/microcaps/microcaps_500.xlsx</code></p>
<p>NOPAT method: operating income × (1 − tax rate), where tax rate = tax / pretax income clamped to 0–35%, with 21% as default. Operating loss: NOPAT = operating income.</p>
</footer>
</div>
<script type="application/json" id="data">{json_data}</script>
<script>{JS}</script>
"""
(OUT / "report.html").write_text(html, encoding="utf-8")
print(f"wrote {OUT/'report.html'} ({len(html.encode())/1024:.0f} KB)")

#!/usr/bin/env python3
"""Render report.md into report.html (the artifact page). Deterministic, no model."""
import re, json, html

md = open("report.md").read()
M = json.load(open("metrics.json"))
POST = M["post_review"]
sens = {round(s["usdcad"], 4): s for s in POST["fx_sensitivity"]["value"]}
d = sens[1.3594]; lo = sens[1.25]

TAG = re.compile(r"\s*\[(metrics|ledger|peer):([^\]]+)\]")

def inline(t):
    t = html.escape(t, quote=False)
    t = TAG.sub(lambda m: f'<span class="cite" title="{html.escape(m.group(1)+":"+m.group(2))}">{html.escape(m.group(1))}:{html.escape(m.group(2))}</span>', t)
    t = re.sub(r"(</span>)\s+([.,;:)])", r"\1\2", t)
    t = re.sub(r"(https?://[^\s<]+)", r'<a href="\1">\1</a>', t)
    return t

def pct_class(cell):
    m = re.match(r"^\s*(-?\d+(?:\.\d+)?)%\s*$", cell)
    if not m: return ""
    v = float(m.group(1))
    if v < 0: return "neg"
    if v < 8: return "low"
    if v < 12: return "mid"
    return "high"

out = []
lines = md.split("\n")
i = 0
in_list = None
def close_list():
    global in_list
    if in_list:
        out.append(f"</{in_list}>"); in_list = None

section_id = 0
while i < len(lines):
    ln = lines[i]
    if ln.startswith("# "):
        i += 1; continue  # page title handled by template
    if ln.startswith("## "):
        close_list(); section_id += 1
        title = ln[3:].strip()
        if section_id > 1: out.append("</section>")
        out.append(f'<section id="s{section_id}"><h2>{inline(title)}</h2>')
        i += 1; continue
    if ln.startswith("### "):
        close_list(); out.append(f"<h3>{inline(ln[4:].strip())}</h3>"); i += 1; continue
    if ln.startswith("|"):
        close_list()
        rows = []
        while i < len(lines) and lines[i].startswith("|"):
            rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
        header, body = rows[0], [r for r in rows[1:] if not all(re.match(r"^-+$", c) for c in r)]
        grid = header[0].lower() == "growth"
        cls = "grid" if grid else ""
        out.append(f'<div class="scroll"><table class="{cls}"><thead><tr>' + "".join(f"<th>{inline(h)}</th>" for h in header) + "</tr></thead><tbody>")
        for r in body:
            cells = []
            for j, c in enumerate(r):
                k = pct_class(c) if grid and j > 0 else ""
                num = "num" if re.match(r"^[\d,.\-%x ]+$", TAG.sub("", c).strip()) else ""
                cells.append(f'<td class="{k} {num}">{inline(c)}</td>')
            out.append("<tr>" + "".join(cells) + "</tr>")
        out.append("</tbody></table></div>")
        continue
    m = re.match(r"^(\d+)\. (.*)", ln)
    if m:
        if in_list != "ol": close_list(); out.append("<ol>"); in_list = "ol"
        out.append(f"<li>{inline(m.group(2))}</li>"); i += 1; continue
    if ln.startswith("- "):
        if in_list != "ul": close_list(); out.append("<ul>"); in_list = "ul"
        out.append(f"<li>{inline(ln[2:])}</li>"); i += 1; continue
    if ln.strip() == "":
        nxt = next((l for l in lines[i+1:] if l.strip() != ""), "")
        cont = (in_list == "ol" and re.match(r"^\d+\. ", nxt)) or (in_list == "ul" and nxt.startswith("- "))
        if not cont: close_list()
        i += 1; continue
    close_list()
    txt = ln.strip()
    if txt.startswith("Verdict:"):
        out.append(f'<p class="verdict-line">{inline(txt)}</p>')
    elif txt in ("Reasons that carry the call", "Your thesis"):
        out.append(f'<p class="label">{inline(txt)}</p>')
    else:
        out.append(f"<p>{inline(txt)}</p>")
    i += 1
close_list(); out.append("</section>")
body_html = "\n".join(out)

toc = re.findall(r'<section id="(s\d+)"><h2>(.*?)</h2>', body_html)
toc_html = "".join(f'<a href="#{i}">{t}</a>' for i, t in toc)

page = f"""<title>Constellation Software Verdict</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&family=Source+Sans+3:wght@400;600&family=Source+Code+Pro:wght@400;500&display=swap">
<style>
:root {{
  --paper:#F2F4F6; --surface:#FFFFFF; --ink:#18232E; --ink2:#41505E; --muted:#6F7C89; --line:#D6DCE2;
  --accent:#1F5F8B; --accent-ink:#164A6E; --accent-bg:#E4EEF5;
  --neg-bg:#F6DEDB; --neg-fg:#8A2A22; --low-bg:#EEF0F2; --low-fg:#41505E; --mid-bg:#E1EEE6; --mid-fg:#245A3C; --high-bg:#BFDCCB; --high-fg:#173F29;
  --verdict-bg:#F5E8D8; --verdict-fg:#7A3E0C; --verdict-line:#C98A4B;
  --cite-bg:#EAEEF2; --cite-fg:#5B6975;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --paper:#12181E; --surface:#1A2229; --ink:#E6EBEF; --ink2:#B4BEC8; --muted:#8593A0; --line:#2C3740;
  --accent:#6FB0DC; --accent-ink:#9CC9EA; --accent-bg:#1E3140;
  --neg-bg:#4A2320; --neg-fg:#F0A79F; --low-bg:#232C34; --low-fg:#B4BEC8; --mid-bg:#1F3A2B; --mid-fg:#A9DBBB; --high-bg:#25563A; --high-fg:#D2F0DC;
  --verdict-bg:#3A2A18; --verdict-fg:#F1C892; --verdict-line:#9A6A34;
  --cite-bg:#232C34; --cite-fg:#8FA0AE;
}} }}
:root[data-theme="dark"] {{
  --paper:#12181E; --surface:#1A2229; --ink:#E6EBEF; --ink2:#B4BEC8; --muted:#8593A0; --line:#2C3740;
  --accent:#6FB0DC; --accent-ink:#9CC9EA; --accent-bg:#1E3140;
  --neg-bg:#4A2320; --neg-fg:#F0A79F; --low-bg:#232C34; --low-fg:#B4BEC8; --mid-bg:#1F3A2B; --mid-fg:#A9DBBB; --high-bg:#25563A; --high-fg:#D2F0DC;
  --verdict-bg:#3A2A18; --verdict-fg:#F1C892; --verdict-line:#9A6A34;
  --cite-bg:#232C34; --cite-fg:#8FA0AE;
}}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--paper); color:var(--ink); font-family:"Source Sans 3","Helvetica Neue",Arial,sans-serif; font-size:16px; line-height:1.55; padding-block:40px 80px; padding-inline:20px; }}
.page {{ max-width:800px; margin:0 auto; display:grid; gap:36px; }}
h1,h2,h3 {{ font-family:"Source Serif 4",Georgia,serif; margin:0; text-wrap:balance; letter-spacing:-0.005em; }}
h1 {{ font-size:34px; font-weight:600; line-height:1.15; }}
h2 {{ font-size:22px; font-weight:600; padding-top:8px; }}
h3 {{ font-size:17px; font-weight:600; margin-top:6px; }}
p {{ margin:0; max-width:70ch; }}
a {{ color:var(--accent); word-break:break-all; }}
.eyebrow {{ font-size:11.5px; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); font-weight:600; }}
header {{ display:grid; gap:14px; padding-bottom:24px; border-bottom:1px solid var(--line); }}
.meta {{ display:flex; flex-wrap:wrap; gap:6px 24px; font-size:13.5px; color:var(--ink2); }}
.meta b {{ color:var(--ink); font-weight:600; }}
.num, td.num, .tile .val {{ font-family:"Source Code Pro",Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; }}
.banner {{ background:var(--verdict-bg); color:var(--verdict-fg); border-left:4px solid var(--verdict-line); padding:18px 20px; display:grid; gap:14px; }}
.banner .big {{ font-family:"Source Serif 4",Georgia,serif; font-size:30px; font-weight:600; line-height:1.1; }}
.banner .sub {{ font-size:14px; }}
.tiles {{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }}
.tile {{ background:var(--surface); border:1px solid var(--line); padding:12px 14px; display:grid; gap:4px; align-content:start; }}
.tile .lab {{ font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:600; }}
.tile .val {{ font-size:22px; font-weight:500; color:var(--ink); }}
.tile .note {{ font-size:12.5px; color:var(--ink2); }}
nav.toc {{ display:flex; flex-wrap:wrap; gap:6px 14px; font-size:13.5px; padding:12px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }}
nav.toc a {{ text-decoration:none; color:var(--accent-ink); }}
nav.toc a:hover, nav.toc a:focus-visible {{ text-decoration:underline; }}
section {{ display:grid; gap:14px; }}
.verdict-line {{ font-family:"Source Serif 4",Georgia,serif; font-size:19px; font-weight:600; color:var(--verdict-fg); }}
.label {{ font-size:12px; letter-spacing:.07em; text-transform:uppercase; color:var(--muted); font-weight:600; margin-top:6px; }}
ol,ul {{ margin:0; padding-left:22px; display:grid; gap:10px; max-width:70ch; }}
.scroll {{ overflow-x:auto; border:1px solid var(--line); background:var(--surface); }}
table {{ border-collapse:collapse; width:100%; font-size:13.5px; }}
th,td {{ text-align:left; vertical-align:top; padding:9px 11px; border-bottom:1px solid var(--line); }}
th {{ font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:600; white-space:nowrap; }}
tbody tr:last-child td {{ border-bottom:0; }}
td.num {{ text-align:right; white-space:nowrap; }}
table.grid td {{ text-align:right; }}
table.grid td.neg {{ background:var(--neg-bg); color:var(--neg-fg); }}
table.grid td.low {{ background:var(--low-bg); color:var(--low-fg); }}
table.grid td.mid {{ background:var(--mid-bg); color:var(--mid-fg); }}
table.grid td.high {{ background:var(--high-bg); color:var(--high-fg); font-weight:500; }}
.cite {{ display:none; margin-left:4px; font-family:"Source Code Pro",monospace; font-size:10.5px; background:var(--cite-bg); color:var(--cite-fg); padding:0 4px; border-radius:2px; white-space:nowrap; vertical-align:baseline; }}
body.show-cites .cite {{ display:inline; }}
.toggle {{ display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--ink2); }}
.toggle input {{ width:16px; height:16px; }}
.toggle input:focus-visible {{ outline:2px solid var(--accent); outline-offset:2px; }}
footer {{ color:var(--muted); font-size:12.5px; border-top:1px solid var(--line); padding-top:16px; display:grid; gap:6px; }}
@media (max-width:720px) {{ .tiles {{ grid-template-columns:1fr 1fr; }} h1 {{ font-size:28px; }} }}
@media (max-width:420px) {{ .tiles {{ grid-template-columns:1fr; }} }}
@media (prefers-reduced-motion: no-preference) {{ html {{ scroll-behavior:smooth; }} }}
</style>
<div class="page">
<header>
  <div class="eyebrow">Equity research note · TSX: CSU · reports in USD</div>
  <h1>Constellation Software: Buy or Not Buy</h1>
  <div class="meta"><span>Price <b class="num">CAD 2,827.94</b> on 2026-09-11</span><span>Executive summary and audit by <b>Fable 5.1</b>, one pass</span><span>Analysis by <b>Opus 5</b>, arithmetic by <b>script</b></span><span>Written 2026-09-13</span></div>
</header>

<div class="banner">
  <div class="big">Verdict: Not Buy at CAD 2,827.94</div>
  <div class="sub">Expected five year return of 8.5 to 10.4 percent depending on the exchange rate, under a 12 percent hurdle. Flips to Buy near CAD {d['buy_price_cad_for_12pct']:,.0f}, or on two quarters of FX adjusted organic growth at 3 percent or better. If your hurdle is 8 to 10 percent, the price already pays it.</div>
  <div class="tiles">
    <div class="tile"><div class="lab">Multiple</div><div class="val">{lo['multiple_price_to_fcfa2s']:.1f}x to {d['multiple_price_to_fcfa2s']:.1f}x</div><div class="note">Price to LTM FCFA2S, at USDCAD 1.25 to 1.36</div></div>
    <div class="tile"><div class="lab">Expected IRR</div><div class="val">{lo['irr_expected']*100:.1f}% to {d['irr_expected']*100:.1f}%</div><div class="note">Bear 0.30, base 0.50, bull 0.20</div></div>
    <div class="tile"><div class="lab">Organic growth</div><div class="val">1%</div><div class="note">FX adjusted, Q2 and H1 2026, from 4% a year earlier</div></div>
    <div class="tile"><div class="lab">FCFA2S CAGR</div><div class="val">25.4%</div><div class="note">FY2022 to FY2025, share count flat at 21.19m</div></div>
  </div>
</div>

<nav class="toc" aria-label="Sections">{toc_html}</nav>
<label class="toggle"><input type="checkbox" id="cite-toggle"> Show citation tags (every number traces to a ledger or metric key)</label>

{body_html}

<footer>
  <div>Seven stage pipeline: Haiku 4.5 intake, Sonnet 5 normalize and compute script, Opus 5 analysis in three lenses, Sonnet 5 draft, Fable 5.1 audit and executive summary. Rates: Anthropic API, June 2026.</div>
  <div>Data reached this environment through web search results only. Filing pages were not fetchable. Figures carry source URLs in ledger.json; ten random numbers were traced end to end in review.md. This is analysis, not investment advice.</div>
</footer>
</div>
<script>
(function(){{
  var t=document.getElementById('cite-toggle');
  try {{ if(localStorage.getItem('csu-cites')==='1'){{t.checked=true;document.body.classList.add('show-cites');}} }} catch(e){{}}
  t.addEventListener('change',function(){{
    document.body.classList.toggle('show-cites',t.checked);
    try {{ localStorage.setItem('csu-cites',t.checked?'1':'0'); }} catch(e){{}}
  }});
}})();
</script>
"""
open("report.html", "w").write(page)
print("report.html written,", len(page), "bytes,", len(toc), "sections")

#!/usr/bin/env python3
"""Render report.md into report.html (the artifact page). Deterministic, no model."""
import re, json, html

md = open("report.md").read()
HM = json.load(open("history_metrics.json"))
HL = json.load(open("history_ledger.json"))

FW = HM["eras"]["Full window"]
revenue_fy2007 = HL["ledger"]["revenue"]["FY2007"]["value"]
revenue_fy2025 = HL["ledger"]["revenue"]["FY2025"]["value"]
revenue_cagr_full = FW["revenue_cagr_pct"]["value"]
cash_metric_per_share_cagr_full = FW["cash_metric_per_share_cagr_pct"]["value"]
special_div_total = HL["ledger"]["dividends_per_share_special"]["FY2018"]["value"]

TAG = re.compile(r"\s*\[(metrics|ledger|peer|hold|holdings|stage1|hist|hm|event):([^\]]+)\]")

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
        grid = header[0].strip().lower() in ("year", "growth")
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

cash_metric_tile = f"{cash_metric_per_share_cagr_full:.2f}%" if cash_metric_per_share_cagr_full is not None else "gap"
cash_metric_note = "Two incompatible bases, adj net income to FCFA2S; see Gaps" if cash_metric_per_share_cagr_full is None else "FCFA2S basis"

page = f"""<title>Constellation Software: Nineteen Years on the Record</title>
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
h1 {{ font-size:32px; font-weight:600; line-height:1.15; }}
h2 {{ font-size:22px; font-weight:600; padding-top:8px; }}
h3 {{ font-size:17px; font-weight:600; margin-top:6px; }}
p {{ margin:0; max-width:70ch; }}
a {{ color:var(--accent); word-break:break-all; }}
.eyebrow {{ font-size:11.5px; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); font-weight:600; }}
header {{ display:grid; gap:14px; padding-bottom:24px; border-bottom:1px solid var(--line); }}
.meta {{ display:flex; flex-wrap:wrap; gap:6px 24px; font-size:13.5px; color:var(--ink2); }}
.meta b {{ color:var(--ink); font-weight:600; }}
.num, td.num, .tile .val {{ font-family:"Source Code Pro",Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; }}
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
@media (max-width:720px) {{ .tiles {{ grid-template-columns:1fr 1fr; }} h1 {{ font-size:26px; }} }}
@media (max-width:420px) {{ .tiles {{ grid-template-columns:1fr; }} }}
@media (prefers-reduced-motion: no-preference) {{ html {{ scroll-behavior:smooth; }} }}
</style>
<div class="page">
<header>
  <div class="eyebrow">Fundamental analysis 2007 to 2025, designed on Fable 5.1, 2026-09-14</div>
  <h1>Constellation Software: Nineteen Years on the Record</h1>
  <div class="meta"><span>TSX: CSU · OTC: CNSWF · reports in USD</span><span>Four eras and year by year record by <b>Opus 5</b>, arithmetic by <b>script</b></span><span>Written by <b>Sonnet 5</b></span><span>Executive summary reserved for <b>Fable 5.1</b> at Stage 6</span></div>
  <div class="tiles">
    <div class="tile"><div class="lab">Revenue, FY2007</div><div class="val">${revenue_fy2007:,.2f}M</div><div class="note">USD millions, third party</div></div>
    <div class="tile"><div class="lab">Revenue, FY2025</div><div class="val">${revenue_fy2025:,.0f}M</div><div class="note">USD millions</div></div>
    <div class="tile"><div class="lab">Revenue CAGR, full window</div><div class="val">{revenue_cagr_full:.2f}%</div><div class="note">FY2007 to FY2025, 18 years</div></div>
    <div class="tile"><div class="lab">Cash metric per share CAGR</div><div class="val">{cash_metric_tile}</div><div class="note">{cash_metric_note}</div></div>
  </div>
  <div class="tiles">
    <div class="tile" style="grid-column: span 4"><div class="lab">Total special dividends per share paid, FY2007 to FY2025</div><div class="val">USD {special_div_total:.2f}</div><div class="note">One special ever, FY2018, no earlier special found across five intake sweeps</div></div>
  </div>
</header>

<nav class="toc" aria-label="Sections">{toc_html}</nav>
<label class="toggle"><input type="checkbox" id="cite-toggle"> Show citation tags (every number traces to a hist, hm, event, ledger, metrics or stage1 key)</label>

{body_html}

<footer>
  <div>Six stage pipeline: Sonnet 5 low, five parallel intake sweeps; Sonnet 5 low, normalise into history_ledger.json; a Python script written by Sonnet 5 compute history_metrics.json; Opus 5 at xhigh effort write the eras, year by year and cash and capital findings; Sonnet 5 at medium effort assemble this report; Fable 5.1 reserved for the Stage 6 review and executive summary.</div>
  <div>Data reached this environment through web search results only. Every figure carries a source URL, and figures unavailable at intake are marked gap rather than estimated. This is analysis, not investment advice.</div>
</footer>
</div>
<script>
(function(){{
  var t=document.getElementById('cite-toggle');
  try {{ if(localStorage.getItem('csu-history-cites')==='1'){{t.checked=true;document.body.classList.add('show-cites');}} }} catch(e){{}}
  t.addEventListener('change',function(){{
    document.body.classList.toggle('show-cites',t.checked);
    try {{ localStorage.setItem('csu-history-cites',t.checked?'1':'0'); }} catch(e){{}}
  }});
}})();
</script>
"""
open("report.html", "w").write(page)
print("report.html written,", len(page), "bytes,", len(toc), "sections")

"""Write inputs into the EPV template without touching formulas, charts, or formatting.

Usage: python3 tools/fill_template.py TICKER [--coc 0.10]
Edits the sheet XML directly (openpyxl would drop chart formatting) and sets full recalculation on open.
Output: output/TICKER/TICKER_EPV.xlsx
"""
import argparse
import re
import zipfile

from lxml import etree

from common import TEMPLATE, YEAR_COLS, load_inputs, out_dir

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
N = "{%s}" % NS
SHEETS = {"Financials": "xl/worksheets/sheet1.xml", "Call-out": "xl/worksheets/sheet3.xml"}

# Template row per input field (Financials sheet, columns D..M).
ROWS = {
    "revenue": 31, "cogs": 32, "sga": 36, "other_opex": 37, "int_other": 41, "taxes": 44,
    "minority": 46, "cash": 53, "inventories": 54, "ar": 55, "tca": 56, "ppe_lease": 57,
    "ta": 58, "ap": 60, "tcl": 62, "ltd_lease": 64, "tl": 65, "intangibles": 69, "da": 79,
    "one_time": 83, "capex": 106,
}
OLD_PPE_COLS = YEAR_COLS[:6]  # D..I use rows 110/111; J..M link to row 57.


def col_index(ref):
    letters = re.match(r"[A-Z]+", ref).group()
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n


def set_cell(root, ref, value):
    row_num = int(re.search(r"\d+", ref).group())
    sheet_data = root.find(N + "sheetData")
    row = next((r for r in sheet_data.findall(N + "row") if int(r.get("r")) == row_num), None)
    if row is None:
        row = etree.Element(N + "row", r=str(row_num))
        after = [r for r in sheet_data.findall(N + "row") if int(r.get("r")) < row_num]
        sheet_data.insert(sheet_data.index(after[-1]) + 1 if after else 0, row)
    cell = next((c for c in row.findall(N + "c") if c.get("r") == ref), None)
    if cell is None:
        cell = etree.Element(N + "c", r=ref)
        later = [c for c in row.findall(N + "c") if col_index(c.get("r")) > col_index(ref)]
        if later:
            later[0].addprevious(cell)
        else:
            row.append(cell)
    for child in list(cell):
        cell.remove(child)
    cell.attrib.pop("t", None)
    if isinstance(value, str):
        cell.set("t", "inlineStr")
        is_ = etree.SubElement(cell, N + "is")
        etree.SubElement(is_, N + "t").text = value
    else:
        etree.SubElement(cell, N + "v").text = repr(float(value))


def build_cells(inp, coc):
    years = [str(y) for y in inp["years"]]
    if len(years) != 10:
        raise SystemExit(f"Template needs 10 fiscal years, got {len(years)}")
    f = inp["fields"]
    fin = {"B2": inp["name"], "B8": inp["ticker"],
           "B9": "Share price date (latest FY): " + inp.get("price_date", {}).get(years[-1], "n/a"),
           "B37": "Other Opex (R&D, other; ties to reported EBIT)",
           "D7": float(years[0]), "C97": coc}
    for col, y in zip(YEAR_COLS, years):
        if y in inp.get("price", {}):
            fin[f"{col}10"] = inp["price"][y]
        if y in inp.get("shares_current_basis", {}):
            fin[f"{col}11"] = inp["shares_current_basis"][y]
        for field, row in ROWS.items():
            v = f.get(field, {}).get(y)
            fin[f"{col}{row}"] = v if v is not None else 0.0
        fin[f"{col}134"] = coc
        if col in OLD_PPE_COLS:
            gross, acc = f["ppe_gross"].get(y), f["accum_dep"].get(y)
            if gross is not None and acc is not None:
                rou = f["ppe_lease"][y] - (gross - acc)
                fin[f"{col}110"], fin[f"{col}111"] = gross + max(rou, 0.0), acc
            else:
                fin[f"{col}110"], fin[f"{col}111"] = f["ppe_lease"][y], 0.0
    callout = {"C7": coc, "L7": coc}
    return {"Financials": fin, "Call-out": callout}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker")
    ap.add_argument("--coc", type=float, default=0.10)
    a = ap.parse_args()
    t = a.ticker.upper()
    inp = load_inputs(t)
    cells = build_cells(inp, a.coc)
    dest = out_dir(t) / f"{t}_EPV.xlsx"

    with zipfile.ZipFile(TEMPLATE) as zin, zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            sheet = next((s for s, p in SHEETS.items() if p == item.filename), None)
            if sheet:
                root = etree.fromstring(data)
                for ref, v in cells[sheet].items():
                    set_cell(root, ref, v)
                data = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
            elif item.filename == "xl/workbook.xml":
                data = re.sub(rb"<calcPr([^>]*?)/>", rb'<calcPr\1 fullCalcOnLoad="1"/>', data)
            zout.writestr(item, data)
    print(f"wrote {dest}")


if __name__ == "__main__":
    main()

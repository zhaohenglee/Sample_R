"""Patch template/epv_template.xlsx formulas for model_review issues 1 and 4 (idempotent).

Usage: python3 tools/patch_template.py
Edits xl/worksheets/sheet1.xml (Financials) directly with lxml so the charts survive.
Changes:
  row 78  = -row 41 (EBITDA no longer adds interest and other income a second time)
  row 59  new input: non-current marketable securities
  row 63  new input: of which current debt + current operating lease
  row 13  = row 53 + row 59 (cash + securities)
  row 128 = row 62 - row 63 (current liabilities ex debt and leases)
Every touched formula is written as an explicit normal formula (shared groups in these rows are
fully rewritten). The formula cells keep their positions, so xl/calcChain.xml stays valid.
"""
import shutil
import tempfile
import zipfile

from lxml import etree

from common import TEMPLATE, YEAR_COLS
from fill_template import N, set_cell

SHEET = "xl/worksheets/sheet1.xml"
LABELS = {
    "B13": "Less: Cash + securities",
    "B53": "Cash, Equivalents + Current Securities",
    "B59": "Non-current marketable securities",
    "B63": "  of which: current debt + current op. lease",
    "B64": "Total Debt + Operating Leases",
    "B78": "Less: Interest and other income",
    "B128": "    Current Liabilities (ex debt and leases)",
}
FORMULAS = {13: "{c}53+{c}59", 78: "-{c}41", 128: "+{c}62-{c}63"}
STYLE = {"B59": "93", "B63": "93"}  # label style copied from B60 when the label cell is new/blank


def set_formula(root, ref, formula):
    set_cell(root, ref, 0.0)  # makes sure the cell exists, clears children and type
    row_num = int("".join(ch for ch in ref if ch.isdigit()))
    for row in root.find(N + "sheetData").findall(N + "row"):
        if int(row.get("r")) == row_num:
            cell = next(c for c in row.findall(N + "c") if c.get("r") == ref)
            for child in list(cell):
                cell.remove(child)
            etree.SubElement(cell, N + "f").text = formula  # no cached <v>


def patch(data):
    root = etree.fromstring(data)
    for ref, text in LABELS.items():
        cell_style = None
        for c in root.iter(N + "c"):
            if c.get("r") == ref:
                cell_style = c.get("s")
        set_cell(root, ref, text)
        if ref in STYLE:
            for c in root.iter(N + "c"):
                if c.get("r") == ref and cell_style in (None, "11"):
                    c.set("s", STYLE[ref])
                    c.set("t", c.attrib.pop("t"))  # keep attribute order stable across reruns
    for row, tmpl in FORMULAS.items():
        for col in YEAR_COLS:
            set_formula(root, f"{col}{row}", tmpl.format(c=col))
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def main():
    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    tmp.close()
    with zipfile.ZipFile(TEMPLATE) as zin, zipfile.ZipFile(tmp.name, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == SHEET:
                data = patch(data)
            zout.writestr(item, data)
    shutil.move(tmp.name, TEMPLATE)
    print(f"patched {TEMPLATE}")


if __name__ == "__main__":
    main()

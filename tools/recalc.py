"""Force a full recalculation of a workbook with headless LibreOffice and save a copy.

Usage: python3 tools/recalc.py IN.xlsx OUT.xlsx
A plain `soffice --convert-to` keeps stale cached values, so this drives calculateAll() over UNO.
"""
import os
import subprocess
import sys
import tempfile
import time

import uno
from com.sun.star.beans import PropertyValue


def prop(name, value):
    p = PropertyValue()
    p.Name, p.Value = name, value
    return p


def recalc(src, dst):
    port = 2002 + os.getpid() % 1000
    profile = tempfile.mkdtemp(prefix="lo_profile_")
    proc = subprocess.Popen(
        ["soffice", "--headless", "--invisible", "--norestore", "--nologo",
         f"-env:UserInstallation=file://{profile}",
         f"--accept=socket,host=127.0.0.1,port={port};urp;"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        resolver = uno.getComponentContext().ServiceManager.createInstanceWithContext(
            "com.sun.star.bridge.UnoUrlResolver", uno.getComponentContext())
        for _ in range(60):
            try:
                ctx = resolver.resolve(f"uno:socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext")
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("LibreOffice did not start")
        desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath(src)), "_blank", 0,
                                           (prop("Hidden", True),))
        doc.calculateAll()
        doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath(dst)),
                       (prop("FilterName", "Calc Office Open XML"),))
        doc.close(True)
    finally:
        proc.terminate()
        proc.wait(timeout=30)


if __name__ == "__main__":
    recalc(sys.argv[1], sys.argv[2])

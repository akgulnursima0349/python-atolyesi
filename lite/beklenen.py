"""Test için: sitedeki defter listesinden "dosya=kod_özeti" çiftlerini yazar."""
import re, sys
s = open(sys.argv[1] if len(sys.argv) > 1 else "site/src/data/lessons.js", encoding="utf-8").read()
print(" ".join(f"{f}={h}" for f, h in re.findall(r'file: "([^"]+\.ipynb)", kodOzet: "([0-9a-f]{64})"', s)))

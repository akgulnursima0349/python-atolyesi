"""Defterlerin tarayıcı sürümünü (JupyterLite + Pyodide) derler.

    python lite/derle.py --cikti site/dist/defter

1. notebooks/*.ipynb (öğrenci sürümleri) → Colab'a özel kısımları tarayıcıya uyarlanmış kopyalar
2. jupyter lite build → statik site (yalnızca "notebooks" ve "tree" arayüzleri)
3. Pyodide ve gereken paketler sitenin içine konur (okulda dış CDN'e bağımlı kalmasın):
   seaborn (örnek veri setleri paketin içine gömülü) ve atolye_tarayici yardımcısı eklenir.
"""
import argparse
import base64
import copy
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile

KOK = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(KOK)
PYODIDE_SURUM = "314.0.6"
CDN = f"https://cdn.jsdelivr.net/pyodide/v{PYODIDE_SURUM}/full/"
CEKIRDEK = ["pyodide.mjs", "pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]
# Defterlerin ve çekirdeğin (ipython, micropip) ihtiyaç duyduğu paketler; bağımlılıkları kendiliğinden eklenir
KOKLER = ["micropip", "ipython", "numpy", "pandas", "matplotlib", "scikit-learn", "scipy", "pillow", "packaging", "jedi"]
EK_WHEEL = {  # PyPI'den alınan saf Python paketleri: (sürüm, bağımlılıklar, import adları)
    "seaborn": ("0.13.2", ["numpy", "pandas", "matplotlib"], ["seaborn"]),
    "comm": ("0.2.3", ["traitlets"], ["comm"]),
}


# ---------------------------------------------------------------- 1. defterler
def kaynak(h):
    return "".join(h["source"]) if isinstance(h["source"], list) else h["source"]


def ayarla(h, metin):
    h["source"] = metin.splitlines(keepends=True)


def md(metin):
    return {"cell_type": "markdown", "metadata": {}, "source": metin.splitlines(keepends=True)}


GIRIS = """> 💻 **Bu defter doğrudan tarayıcında çalışıyor**: Google hesabına gerek yok.
> - İlk hücreyi çalıştırdığında Python birkaç saniyede yüklenir; ilk seferde biraz beklemen normal. ⏳
> - ⚠️ Sayfayı yenilersen ya da kapatırsan yaptığın değişiklikler silinir ve defter baştan açılır. Bitirmeden sayfayı kapatma!
"""

CIZIM = '''from atolye_tarayici import ciz        # tarayıcı sürümü: çizim tuvalini gösteren yardımcı

async def ciz_ve_tahmin_et():
    resim = await ciz()                 # await (bekle): sen "Tahmin Et" düğmesine basana kadar bekler
    tahmin_goster(resmi_hazirla(resim), "Senin çizimin (8x8 hali)")

await ciz_ve_tahmin_et()
'''

RAKAM_YUKLE = '''import io
from atolye_tarayici import dosya_yukle   # tarayıcı sürümü: dosya yükleme aracı

yuklenen = await dosya_yukle()            # "Dosya Seç" düğmesi çıkar, sen dosya seçene kadar bekler
for dosya_adi, icerik in yuklenen.items():
    foto = Image.open(io.BytesIO(icerik))
    tahmin_goster(resmi_hazirla(foto), f"{dosya_adi} (8x8 hali)")
'''

POPART_YUKLE = '''from PIL import Image
import io
from atolye_tarayici import dosya_yukle, indir   # tarayıcı sürümü: dosya yükleme ve indirme araçları

yuklenen = await dosya_yukle()            # "Dosya Seç" düğmesi çıkar, sen fotoğraf seçene kadar bekler
for dosya_adi, icerik in yuklenen.items():
    foto = Image.open(io.BytesIO(icerik)).convert("RGB")     # convert("RGB"): her fotoğrafı 3 kanallı RGB formatına çevir
    foto.thumbnail((640, 640))                               # thumbnail (küçük resim): en fazla 640 piksele küçült
    foto = np.array(foto)

    kareler = pop_art(foto, PALETLER)
    tablo = np.vstack([np.hstack(kareler[:2]), np.hstack(kareler[2:])])
    plt.figure(figsize=(14, 14 * tablo.shape[0] / tablo.shape[1]))
    plt.imshow(tablo)
    plt.axis("off")
    plt.title(f"{dosya_adi} — Pop-Art", fontsize=16)
    plt.show()

    Image.fromarray(tablo).save("pop_art.png")             # tabloyu dosyaya kaydet
    indir("pop_art.png", "Pop-Art tablomu indir 🎁")        # bilgisayarına indirme düğmesi
'''

METIN = [  # (eski, yeni): markdown ve kod hücrelerindeki Colab'a özel ifadeler
    ("(ya da soldaki ▶️ düğmesine tıkla)", "(ya da üstteki ▶ düğmesine tıkla)"),
    ("Defter Drive'ındaki kopyanda hep duracak.",
     "Defteri istediğin zaman siteden yeniden açabilirsin (temiz bir kopya açılır)."),
    ("Google Colab'da bu kütüphanelerin hepsi **zaten yüklü**, sadece çağırmamız yeterli.",
     "Bu kütüphaneler, onları ilk çağırdığımızda kendiliğinden yüklenir (ilk seferde birkaç saniye sürebilir), sadece çağırmamız yeterli."),
    (" *(Sadece Google Colab'da çalışır)*", ""),
    (" *(Google Colab'da çalışır)*", ""),
    ("> 🎚️ **Google Colab'da** sağ tarafta **kaydırma çubukları** (*slider*) göreceksin. Değerleri değiştirince hücre otomatik çalışır!\n"
     "> (Colab dışında kullanıyorsan sayıları elle değiştirip hücreyi tekrar çalıştır.)",
     "> 🎚️ Aşağıdaki hücrede ölçümleri **değiştir** ve hücreyi **tekrar çalıştır**. Her satırın yanında hangi aralıkta değer verebileceğin yazıyor."),
    ("internetten hazır veriyi indirir", "hazır örnek veriyi yükler"),
    ("Seaborn'un internetteki veri setlerinden birini indir", "Seaborn'un hazır örnek veri setlerinden birini yükle"),
]


def uyarla(nb, ad):
    nb = copy.deepcopy(nb)
    nb["metadata"] = {
        "kernelspec": {"name": "python", "display_name": "Python (Pyodide)", "language": "python"},
        "language_info": {"name": "python"},
    }
    for h in nb["cells"]:
        s = kaynak(h)
        for eski, yeni in METIN:
            s = s.replace(eski, yeni)
        if h["cell_type"] == "code":
            if "from google.colab.output import eval_js" in s:
                s = CIZIM
            elif "from google.colab import files" in s:
                s = POPART_YUKLE if "pop_art" in s else RAKAM_YUKLE
            # Colab form söz dizimi: "# @title X {...}" → "# X", "# @param {...min:a, max:b...}" → "# a ile b arası"
            s = re.sub(r"^# @title (.*?)\s*\{.*\}\s*$", r"# \1", s, flags=re.M)
            s = re.sub(r"#\s*@param\s*\{[^}]*min:\s*([\d.]+),\s*max:\s*([\d.]+)[^}]*\}", r"# \1 ile \2 arası", s)
            h["outputs"], h["execution_count"] = [], None
        h.get("metadata", {}).pop("colab", None)
        h.get("metadata", {}).pop("id", None)
        ayarla(h, s)
    kalan = [m for m in ("google.colab", "eval_js", "@param", "Drive'") if any(m in kaynak(h) for h in nb["cells"])]
    if kalan:
        sys.exit(f"{ad}: uyarlanmamış Colab ifadesi kaldı: {kalan}")
    nb["cells"].insert(1, md(GIRIS))
    return nb


def defterler(hedef):
    os.makedirs(hedef, exist_ok=True)
    kaynak_dizin = os.path.join(REPO, "notebooks")
    for ad in sorted(os.listdir(kaynak_dizin)):
        if ad.endswith(".ipynb"):
            nb = json.load(open(os.path.join(kaynak_dizin, ad), encoding="utf-8"))
            json.dump(uyarla(nb, ad), open(os.path.join(hedef, ad), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            print("defter:", ad)


# ---------------------------------------------------------------- 3. pyodide
def indir_dosya(url, hedef, sha=None):
    if not os.path.exists(hedef):
        with urllib.request.urlopen(url, timeout=120) as r, open(hedef + ".tmp", "wb") as f:
            shutil.copyfileobj(r, f)
        os.replace(hedef + ".tmp", hedef)
    if sha and hashlib.sha256(open(hedef, "rb").read()).hexdigest() != sha:
        os.remove(hedef)
        sys.exit(f"sha256 tutmuyor: {url}")


def wheel_yaz(yol, dosyalar, ad, surum):
    """Saf Python wheel'i oluşturur. dosyalar: {arşiv_yolu: bayt}"""
    di = f"{ad}-{surum}.dist-info"
    dosyalar = dict(dosyalar)
    dosyalar[f"{di}/METADATA"] = f"Metadata-Version: 2.1\nName: {ad}\nVersion: {surum}\n".encode()
    dosyalar[f"{di}/WHEEL"] = b"Wheel-Version: 1.0\nGenerator: atolye\nRoot-Is-Purelib: true\nTag: py3-none-any\n"
    kayit = []
    for k, v in dosyalar.items():
        oz = base64.urlsafe_b64encode(hashlib.sha256(v).digest()).rstrip(b"=").decode()
        kayit.append(f"{k},sha256={oz},{len(v)}")
    dosyalar[f"{di}/RECORD"] = ("\n".join(kayit + [f"{di}/RECORD,,"]) + "\n").encode()
    with zipfile.ZipFile(yol, "w", zipfile.ZIP_DEFLATED) as z:
        for k, v in dosyalar.items():
            z.writestr(k, v)


def seaborn_yamala(yol):
    """seaborn.load_dataset internetten indirmesin: örnek veriler paketin içinde, varsayılan klasör orası."""
    with zipfile.ZipFile(yol) as z:
        icerik = {n: z.read(n) for n in z.namelist() if not n.endswith("/RECORD")}
    utils = icerik["seaborn/utils.py"].decode()
    eski = 'data_home = os.environ.get("SEABORN_DATA", user_cache_dir("seaborn"))'
    assert eski in utils, "seaborn utils.py beklenen biçimde değil"
    icerik["seaborn/utils.py"] = utils.replace(
        eski, 'data_home = os.environ.get("SEABORN_DATA", os.path.join(os.path.dirname(__file__), "_veri"))').encode()
    for csv in sorted(os.listdir(os.path.join(KOK, "veri"))):
        icerik[f"seaborn/_veri/{csv}"] = open(os.path.join(KOK, "veri", csv), "rb").read()
    os.remove(yol)
    surum = EK_WHEEL["seaborn"][0]
    wheel_yaz(yol, {k: v for k, v in icerik.items() if ".dist-info/" not in k}, "seaborn", surum)


def pyodide(hedef, onbellek):
    os.makedirs(hedef, exist_ok=True)
    os.makedirs(onbellek, exist_ok=True)
    for f in CEKIRDEK:
        indir_dosya(CDN + f, os.path.join(onbellek, f))
        shutil.copy(os.path.join(onbellek, f), os.path.join(hedef, f))
    kilit = json.load(open(os.path.join(onbellek, "pyodide-lock.json")))
    paketler = kilit["packages"]
    norm = lambda n: n.lower().replace("_", "-")
    secilen = set()

    def ekle(n):
        n = norm(n)
        if n in secilen or n not in paketler:
            return
        secilen.add(n)
        for b in paketler[n]["depends"]:
            ekle(b)

    for k in KOKLER + [b for _, (_, bag, _) in EK_WHEEL.items() for b in bag] + ["pillow"]:
        ekle(k)
    for n in sorted(secilen):
        p = paketler[n]
        indir_dosya(CDN + p["file_name"], os.path.join(onbellek, p["file_name"]), p["sha256"])
        shutil.copy(os.path.join(onbellek, p["file_name"]), os.path.join(hedef, p["file_name"]))
    yeni = {n: paketler[n] for n in sorted(secilen)}

    # PyPI'den saf Python paketleri
    for ad, (surum, bag, imp) in EK_WHEEL.items():
        tmp = os.path.join(onbellek, "pypi")
        subprocess.run([sys.executable, "-m", "pip", "download", "-q", "--no-deps", "--only-binary=:all:",
                        "-d", tmp, f"{ad}=={surum}"], check=True)
        whl = next(f for f in os.listdir(tmp) if f.lower().startswith(ad + "-" + surum))
        hedef_whl = os.path.join(hedef, whl)
        shutil.copy(os.path.join(tmp, whl), hedef_whl)
        if ad == "seaborn":
            seaborn_yamala(hedef_whl)
        yeni[ad] = lock_kaydi(ad, surum, whl, hedef_whl, bag, imp)

    # Atölye yardımcısı
    src = open(os.path.join(KOK, "atolye_tarayici", "__init__.py"), "rb").read()
    whl = "atolye_tarayici-1.0.0-py3-none-any.whl"
    wheel_yaz(os.path.join(hedef, whl), {"atolye_tarayici/__init__.py": src}, "atolye_tarayici", "1.0.0")
    yeni["atolye-tarayici"] = lock_kaydi("atolye-tarayici", "1.0.0", whl, os.path.join(hedef, whl), ["pillow"], ["atolye_tarayici"])

    kilit["packages"] = yeni
    json.dump(kilit, open(os.path.join(hedef, "pyodide-lock.json"), "w"))
    boyut = sum(os.path.getsize(os.path.join(hedef, f)) for f in os.listdir(hedef)) / 1e6
    print(f"pyodide: {len(yeni)} paket, {boyut:.0f} MB")


def lock_kaydi(ad, surum, whl, yol, bag, imp):
    return {"name": ad, "version": surum, "file_name": whl, "install_dir": "site", "package_type": "package",
            "sha256": hashlib.sha256(open(yol, "rb").read()).hexdigest(), "imports": imp, "depends": bag,
            "unvendored_tests": False}


# ---------------------------------------------------------------- ana akış
def main():
    a = argparse.ArgumentParser()
    a.add_argument("--cikti", required=True)
    a.add_argument("--onbellek", default=os.path.join(KOK, ".onbellek"))
    a.add_argument("--pyodide-yok", action="store_true", help="yalnızca defterleri ve arayüzü derle")
    x = a.parse_args()
    cikti = os.path.abspath(x.cikti)
    icerik = os.path.join(x.onbellek, "icerik")
    shutil.rmtree(icerik, ignore_errors=True)
    defterler(icerik)
    shutil.rmtree(cikti, ignore_errors=True)
    for f in os.listdir(KOK):  # doit önbelleği: silinmiş çıktıya "güncel" demesin
        if f.startswith(".jupyterlite.doit"):
            os.remove(os.path.join(KOK, f))
    subprocess.run(["jupyter", "lite", "build", "--lite-dir", KOK, "--contents", icerik, "--output-dir", cikti,
                    "--apps", "notebooks", "--apps", "tree", "--no-unused-shared-packages"], check=True, cwd=KOK)
    if not x.pyodide_yok:
        pyodide(os.path.join(cikti, "pyodide"), os.path.join(x.onbellek, "pyodide"))


if __name__ == "__main__":
    main()

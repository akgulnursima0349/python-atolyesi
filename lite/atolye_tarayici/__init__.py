"""Python Atölyesi — tarayıcı defterleri için yardımcılar.

Google Colab'daki `google.colab.files` ve `eval_js` araçlarının tarayıcıda (JupyterLite/Pyodide)
çalışan karşılıkları. Python bir web worker'da çalıştığı için sayfadaki düğmelerle
BroadcastChannel üzerinden haberleşir; hücre `await` ile kullanıcının işlemini bekler.

    resim = await ciz()              # çizim tuvali → PIL.Image
    yuklenen = await dosya_yukle()   # {"dosya.jpg": b"..."}
    indir("pop_art.png")             # indirme düğmesi gösterir
"""
import asyncio
import base64
import io
import json
import os
import uuid

from IPython.display import HTML, display

__all__ = ["ciz", "dosya_yukle", "indir"]

_DUGME = ("font-size:16px;margin:6px;padding:6px 14px;border-radius:6px;border:1px solid #bbb;"
          "background:#fff;cursor:pointer;font-family:sans-serif")
_YESIL = "font-size:16px;margin:6px;padding:6px 14px;border-radius:6px;border:none;background:#2e7d32;color:#fff;cursor:pointer;font-family:sans-serif"


def _bekle(html_uret):
    """Bir kanal açar, HTML'i gösterir ve sayfadan gelecek ilk mesajı bekleyen bir future döndürür."""
    from js import BroadcastChannel
    from pyodide.ffi import create_proxy

    kimlik = "atolye-" + uuid.uuid4().hex[:10]
    kanal = BroadcastChannel.new(kimlik)
    sonuc = asyncio.get_event_loop().create_future()

    def al(olay):
        if not sonuc.done():
            sonuc.set_result(str(olay.data))

    vekil = create_proxy(al)
    kanal.onmessage = vekil
    display(HTML(html_uret(kimlik)))

    def kapat(_):
        try:
            kanal.close()
            vekil.destroy()
        except Exception:
            pass

    sonuc.add_done_callback(kapat)
    return sonuc


async def ciz():
    """Siyah bir tuval gösterir; "Tahmin Et"e basılınca çizimi PIL.Image olarak döndürür."""
    from PIL import Image

    def html(k):
        return f"""
<div id="{k}" style="font-family:sans-serif">
  <canvas width="280" height="280" style="background:black;border-radius:12px;touch-action:none;cursor:crosshair"></canvas><br>
  <button data-r="temizle" style="{_DUGME}">🧽 Temizle</button>
  <button data-r="bitti" style="{_YESIL}">Tahmin Et 🤖</button>
  <span data-r="durum" style="color:#666"></span>
</div>
<script>
(function () {{
  var kok = document.getElementById("{k}");
  var tuval = kok.querySelector("canvas"), ctx = tuval.getContext("2d");
  ctx.fillStyle = "black"; ctx.fillRect(0, 0, 280, 280);
  ctx.strokeStyle = "white"; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.lineJoin = "round";
  var ciziyor = false;
  function konum(e) {{ var r = tuval.getBoundingClientRect(); return [(e.clientX - r.left) * 280 / r.width, (e.clientY - r.top) * 280 / r.height]; }}
  tuval.addEventListener("pointerdown", function (e) {{ ciziyor = true; var p = konum(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]); }});
  tuval.addEventListener("pointermove", function (e) {{ if (!ciziyor) return; var p = konum(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); }});
  window.addEventListener("pointerup", function () {{ ciziyor = false; }});
  kok.querySelector('[data-r="temizle"]').onclick = function () {{ ctx.fillRect(0, 0, 280, 280); }};
  kok.querySelector('[data-r="bitti"]').onclick = function () {{
    new BroadcastChannel("{k}").postMessage(tuval.toDataURL("image/png"));
    this.disabled = true; kok.querySelector('[data-r="durum"]').textContent = "Çizim gönderildi. Tekrar denemek için hücreyi yeniden çalıştır.";
  }};
}})();
</script>"""

    veri = await _bekle(html)
    return Image.open(io.BytesIO(base64.b64decode(veri.split(",", 1)[1])))


async def dosya_yukle(tur="image/*"):
    """"Dosya Seç" düğmesi gösterir; seçilen dosyaları {ad: bayt} sözlüğü olarak döndürür."""

    def html(k):
        return f"""
<div id="{k}" style="font-family:sans-serif;margin:4px 0">
  <label style="{_YESIL};display:inline-block">📁 Dosya Seç<input type="file" accept="{tur}" multiple style="display:none"></label>
  <span data-r="durum" style="color:#666">Bir dosya seç…</span>
</div>
<script>
(function () {{
  var kok = document.getElementById("{k}"), girdi = kok.querySelector("input");
  girdi.onchange = function () {{
    var liste = Array.from(girdi.files); if (!liste.length) return;
    kok.querySelector('[data-r="durum"]').textContent = "Yükleniyor…";
    Promise.all(liste.map(function (f) {{
      return new Promise(function (ok) {{ var r = new FileReader(); r.onload = function () {{ ok({{ ad: f.name, veri: r.result }}); }}; r.readAsDataURL(f); }});
    }})).then(function (dosyalar) {{
      new BroadcastChannel("{k}").postMessage(JSON.stringify(dosyalar));
      girdi.disabled = true;
      kok.querySelector('[data-r="durum"]').textContent = "Yüklendi: " + dosyalar.map(function (d) {{ return d.ad; }}).join(", ");
    }});
  }};
}})();
</script>"""

    dosyalar = json.loads(await _bekle(html))
    return {d["ad"]: base64.b64decode(d["veri"].split(",", 1)[1]) for d in dosyalar}


def indir(yol, etiket=None):
    """Bir dosyayı bilgisayara indirmek için düğme gösterir."""
    with open(yol, "rb") as f:
        veri = base64.b64encode(f.read()).decode()
    ad = os.path.basename(yol)
    tur = "image/png" if ad.lower().endswith(".png") else "application/octet-stream"
    display(HTML(f'<a download="{ad}" href="data:{tur};base64,{veri}" style="{_YESIL};text-decoration:none;display:inline-block">'
                 f'⬇️ {etiket or ad + " dosyasını indir"}</a>'))

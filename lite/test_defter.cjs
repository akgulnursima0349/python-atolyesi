// Tarayıcı defterlerini gerçek bir tarayıcıda baştan sona çalıştırır.
//   node lite/test_defter.cjs http://localhost:8000/defter 00_Python_Giris.ipynb=1878DA ...
// Her defter için: bütün hücreleri çalıştırır, input() kutularını doldurur, çizim tuvaline rakam çizer,
// dosya yükleme düğmesine fotoğraf verir; hata çıkan hücreleri ve tamamlama kodunu raporlar.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os");

const [BASE, ...DEFTERLER] = process.argv.slice(2);
const CEVAPLAR = ["Test", "2013", "12", "30", "77", "8", ...Array.from({ length: 51 }, (_, i) => String(50 + i)), ...Array.from({ length: 49 }, (_, i) => String(1 + i))];

// Yükleme testi için küçük bir PNG (renkli zemin üzerine koyu "7" benzeri çizgi)
function ornekPng() {
  const zlib = require("zlib"), W = 64, H = 64, satir = [];
  for (let y = 0; y < H; y++) { const r = [0]; for (let x = 0; x < W; x++) { const ciz = (y > 8 && y < 16 && x > 12 && x < 52) || (x + y > 54 && x + y < 66 && y > 14); r.push(ciz ? 10 : 160 + x, ciz ? 10 : 150 + y, ciz ? 10 : 255 - x - y); } satir.push(Buffer.from(r)); }
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const parca = (tip, veri) => { const u = Buffer.alloc(4); u.writeUInt32BE(veri.length); const tv = Buffer.concat([Buffer.from(tip), veri]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(tv)); return Buffer.concat([u, tv, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), parca("IHDR", ihdr), parca("IDAT", zlib.deflateSync(Buffer.concat(satir))), parca("IEND", Buffer.alloc(0))]);
}

(async () => {
  const png = path.join(os.tmpdir(), "rakam.png"); fs.writeFileSync(png, ornekPng());
  const tarayici = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  let basarisiz = 0;
  for (const arg of DEFTERLER) {
    const [ad, beklenen] = arg.split("=");
    const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 900 } });
    const konsol = [];
    sayfa.on("console", (m) => { if (m.type() === "error") konsol.push(m.text().slice(0, 300)); });
    sayfa.on("pageerror", (e) => konsol.push(String(e).slice(0, 300)));
    const t0 = Date.now();
    await sayfa.goto(`${BASE}/notebooks/index.html?path=${ad}`);
    await sayfa.waitForFunction(() => window.jupyterapp && document.querySelector(".jp-Notebook .jp-Cell"), null, { timeout: 120000 });
    // çekirdek hazır olsun
    await sayfa.waitForFunction(() => {
      const w = window.jupyterapp.shell.currentWidget; const k = w && w.sessionContext && w.sessionContext.session && w.sessionContext.session.kernel;
      return k && k.status === "idle";
    }, null, { timeout: 300000 });
    const tHazir = Date.now();
    await sayfa.evaluate(() => { window.jupyterapp.commands.execute("notebook:run-all-cells"); });
    let cevap = 0, cizildi = 0, yuklendi = 0, son = Date.now();
    const bitti = () => sayfa.evaluate(() => {
      const w = window.jupyterapp.shell.currentWidget, k = w.sessionContext.session.kernel;
      const hucreler = [...w.content.widgets].filter((c) => c.model.type === "code");
      const bekleyen = hucreler.filter((c) => c.model.executionState === "running" || (c.promptNode && /\*/.test(c.promptNode.textContent))).length;
      return { durum: k.status, bekleyen };
    });
    while (true) {
      // input() kutusu
      const girdi = await sayfa.$(".jp-Stdin-input");
      if (girdi) { try { await girdi.fill(CEVAPLAR[cevap] || "1", { timeout: 3000 }); await girdi.press("Enter"); cevap++; } catch (_) {} son = Date.now(); await sayfa.waitForTimeout(200); continue; }
      // çizim tuvali
      const tuval = await sayfa.$('.jp-OutputArea-output canvas[width="280"]:not([data-test])');
      if (tuval) {
        await tuval.scrollIntoViewIfNeeded(); const b = await tuval.boundingBox();
        await sayfa.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.2); await sayfa.mouse.down();
        await sayfa.mouse.move(b.x + b.width * 0.75, b.y + b.height * 0.2, { steps: 8 });
        await sayfa.mouse.move(b.x + b.width * 0.45, b.y + b.height * 0.85, { steps: 8 }); await sayfa.mouse.up();
        await tuval.evaluate((c) => c.setAttribute("data-test", "1"));
        await sayfa.click('button[data-r="bitti"]:not([disabled])'); cizildi++; son = Date.now(); continue;
      }
      // dosya yükleme
      const dosya = await sayfa.$('.jp-OutputArea-output input[type="file"]:not([disabled]):not([data-test])');
      if (dosya) { await dosya.evaluate((d) => d.setAttribute("data-test", "1")); await dosya.setInputFiles(png); yuklendi++; son = Date.now(); continue; }
      const d = await bitti();
      if (d.durum === "idle" && d.bekleyen === 0) break;
      if (Date.now() - son > 600000) { console.log("  ZAMAN AŞIMI", d); break; }
      await sayfa.waitForTimeout(500);
    }
    const sonuc = await sayfa.evaluate(() => {
      const w = window.jupyterapp.shell.currentWidget;
      const hucreler = [...w.content.widgets].filter((c) => c.model.type === "code");
      const hatalar = [], calismayan = []; let kod = null, resim = 0;
      hucreler.forEach((c, i) => {
        const cikti = c.model.outputs.toJSON(), src = c.model.sharedModel.getSource();
        for (const o of cikti) {
          if (o.output_type === "error") hatalar.push(`#${i} ${o.ename}: ${String(o.evalue).slice(0, 200)} <<< ${src.slice(0, 80).replace(/\n/g, " ")}`);
          if (o.output_type === "stream" && o.name === "stderr") hatalar.push(`#${i} stderr: ${[].concat(o.text).join("").slice(0, 200)}`);
          const metin = [].concat((o.text) || (o.data && o.data["text/plain"]) || "").join("");
          const m = metin.match(/Tamamlama kodun: ([0-9A-F]{6})/); if (m) kod = m[1];
          if (o.data && (o.data["image/png"] || o.data["text/html"])) resim++;
        }
        if (c.model.executionCount == null) calismayan.push(i);
      });
      return { hatalar, calismayan, kod, hucre: hucreler.length, resim };
    });
    const kodTutuyor = beklenen && beklenen.length === 64
      ? !!sonuc.kod && require("crypto").createHash("sha256").update(sonuc.kod).digest("hex") === beklenen
      : sonuc.kod === beklenen;
    const ok = kodTutuyor && !sonuc.hatalar.length && !sonuc.calismayan.length;
    if (!ok) basarisiz++;
    console.log(`${ok ? "TAMAM" : "HATA "} ${ad}: kod=${sonuc.kod} (${kodTutuyor ? "doğru" : "beklenen " + beklenen}), ${sonuc.hucre} kod hücresi, ${sonuc.resim} grafik/resim, ` +
      `input=${cevap}, çizim=${cizildi}, yükleme=${yuklendi}, çekirdek ${((tHazir - t0) / 1000).toFixed(0)} sn, toplam ${((Date.now() - t0) / 1000).toFixed(0)} sn`);
    sonuc.hatalar.forEach((h) => console.log("   hücre hatası", h));
    if (sonuc.calismayan.length) console.log("   çalışmayan hücreler:", sonuc.calismayan.join(","));
    konsol.filter((k) => !/favicon|DevTools|service worker|404/i.test(k)).slice(0, 8).forEach((k) => console.log("   konsol:", k));
    await sayfa.screenshot({ path: path.join(process.env.EKRAN || os.tmpdir(), ad.replace(".ipynb", ".png")), fullPage: false });
    await sayfa.close();
  }
  await tarayici.close();
  process.exit(basarisiz ? 1 : 0);
})();

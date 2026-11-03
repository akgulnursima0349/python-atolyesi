import { TR_ALFABE, sezar, ML_INTENTS, MEYVELER, TEST_MEYVELERI, jsUzaklik, jsOlcekle, jsKnn } from "../data/stations.js";
/* =====================================================================
   MOTOR — Python'u (Skulpt) tarayıcıda çalıştırır, görevleri kontrol eder.
   ===================================================================== */
export var Atolye = (function () {
  var G = typeof window !== "undefined" ? window : globalThis;
  var LINE_LIMIT = 80000;

  var COLORS = {
    kirmizi: "#ef4444", turuncu: "#f97316", sari: "#facc15", yesil: "#22c55e", mavi: "#3b82f6",
    acikmavi: "#7dd3fc", lacivert: "#1e3a8a", mor: "#a855f7", pembe: "#f472b6", kahverengi: "#92400e",
    beyaz: "#ffffff", gri: "#9ca3af", siyah: "#111827", turkuaz: "#14b8a6"
  };
  var LETTERS = { K: "kirmizi", T: "turuncu", S: "sari", Y: "yesil", M: "mavi", A: "acikmavi", L: "lacivert", O: "mor", P: "pembe", H: "kahverengi", B: "beyaz", G: "gri", Z: "siyah" };

  function trFold(s) {
    return String(s).toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/̇/g, "").replace(/\s+/g, "");
  }
  function lower(s) { return String(s).toLocaleLowerCase("tr").replace(/\s+/g, " ").trim(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stripCode(code) { return code.replace(/("[^"\n]*"?|'[^'\n]*'?)/g, '""').replace(/#.*$/gm, ""); }
  function countLines(code) { return code.split("\n").filter(function (l) { var t = l.trim(); return t && t[0] !== "#"; }).length; }

  function robiErr(msg) { var e = new Error(msg); e.atolye = true; return e; }

  /* ---------- hata mesajlarını Türkçeleştirme ---------- */
  function syntaxHelp(code, line) {
    var lines = code.split("\n"), L = lines[line - 1] || "", t = L.trim(), prev = "", pi = line - 2;
    while (pi >= 0 && !lines[pi].trim()) pi--;
    if (pi >= 0) prev = lines[pi];
    if (/^(for|if|elif|else|while|def)\b/.test(t) && !/:\s*(#.*)?$/.test(t))
      return "Satırın sonunda iki nokta <code>:</code> eksik. <code>" + esc(t.split(/[\s(]/)[0]) + "</code> ile başlayan satırlar <code>:</code> ile biter.";
    if (/^(if|elif|while)\b/.test(t) && /[^=!<>]=[^=]/.test(t.replace(/"[^"]*"/g, "")))
      return "Koşulda tek <code>=</code> var. Karşılaştırmak için iki eşittir <code>==</code> yazılır. Tek <code>=</code> kutuya değer koymak içindir.";
    if (/^(for|if|elif|else|while|def)\b/.test(prev.trim()) && /:\s*(#.*)?$/.test(prev.trim()) && L.search(/\S/) <= prev.search(/\S/))
      return "Girinti hatası. <code>" + esc(prev.trim()) + "</code> satırının altındaki komutlar <b>4 boşluk içeride</b> olmalı.";
    var cand = [t, prev.trim()];
    for (var k = 0; k < cand.length; k++) {
      var u = cand[k].replace(/#.*$/, "");
      if ((u.match(/"/g) || []).length % 2 || (u.match(/'/g) || []).length % 2) return "Bir tırnak işareti kapanmamış. Yazının başında ve sonunda aynı tırnak olmalı.";
      var o = (u.match(/\(/g) || []).length, c = (u.match(/\)/g) || []).length;
      if (o !== c) return "Parantez sayısı tutmuyor: <code>" + esc(cand[k]) + "</code> satırında " + o + " parantez açılmış, " + c + " kapanmış.";
      var ob = (u.match(/\[/g) || []).length, cb = (u.match(/\]/g) || []).length;
      if (ob !== cb) return "Köşeli parantez sayısı tutmuyor: " + ob + " açılmış, " + cb + " kapanmış.";
    }
    return null;
  }

  function translate(e, line, code) {
    if (e && e.atolye) return { type: "Atölye", raw: "", msg: e.message, line: line };
    if (e && e.nativeError && e.nativeError.atolye) return { type: "Atölye", raw: "", msg: e.nativeError.message, line: line };
    var name = "", raw = String(e);
    try { name = e.tp$name || ""; } catch (_) {}
    try { if (e.traceback && e.traceback.length) line = e.traceback[0].lineno; } catch (_) {}
    raw = raw.replace(/ on line \d+[\s\S]*$/, "");
    var detail = raw.replace(/^\w+: /, ""), msg;
    if (name === "NameError") {
      var m = detail.match(/name '([^']+)'/), nm = m ? m[1] : "?";
      var known = ["print", "range", "len", "input", "int", "str", "float", "piksel", "ciz", "cevap", "sorted", "type"];
      var close = known.filter(function (k) { return k !== nm && (trFold(k) === trFold(nm) || (k.length > 3 && k.split("").sort().join("") === nm.toLowerCase().split("").sort().join(""))); })[0];
      msg = "Python <code>" + esc(nm) + "</code> diye bir şey tanımıyor.";
      if (close) msg += " Bunu mu demek istedin: <code>" + close + "</code>?";
      else msg += " Yazım hatası olabilir (büyük/küçük harf de önemli). Bir değişkense önce <code>" + esc(nm) + " = ...</code> ile oluştur. Bir yazıysa tırnak içine al.";
    } else if (name === "IndentationError") {
      msg = (code && syntaxHelp(code, line)) || "Girinti hatası. <code>:</code> ile biten satırın altındaki komutlar 4 boşluk içeride olmalı, aynı bloktakiler hizalı durmalı.";
    } else if (name === "SyntaxError" || name === "ParseError" || name === "TokenError") {
      msg = (code && syntaxHelp(code, line)) || "Yazım (dilbilgisi) hatası. <code>:</code>, parantez ve tırnakları kontrol et.";
    } else if (name === "TypeError") {
      if (/concatenate|unsupported operand/.test(detail)) msg = "Farklı tipleri karıştırdın: metin (str) ile sayıyı (int) <code>+</code> ile birleştiremezsin. Sayıyı <code>str()</code> ile metne çevir ya da f-string kullan.";
      else if (/not callable/.test(detail)) msg = "Bir değeri fonksiyon gibi çağırdın. Parantezleri kontrol et.";
      else if (/argument/.test(detail)) msg = "Fonksiyona yanlış sayıda bilgi (parametre) verdin. Parantezin içine bak.";
      else msg = "Tip hatası: bu işlem bu tip değerlerle yapılamıyor.";
    } else if (name === "IndexError") {
      msg = "Listenin (ya da metnin) dışına çıktın. 3 elemanlı bir listede sıra numaraları 0, 1, 2'dir.";
    } else if (name === "KeyError") {
      msg = "Sözlükte böyle bir anahtar yok: " + esc(detail);
    } else if (name === "ValueError") {
      msg = /int\(\)|invalid literal/.test(detail) ? "Bu metin sayıya çevrilemiyor. <code>int(\"12\")</code> olur ama <code>int(\"on iki\")</code> olmaz." : /not in/.test(detail) ? "Aradığın şey listede/metinde yok." : "Değer hatası: " + esc(detail);
    } else if (name === "ZeroDivisionError") {
      msg = "Sıfıra bölme yapılamaz!";
    } else if (name === "AttributeError") {
      msg = "Bu tipte öyle bir özellik/komut yok. Nokta sonrası yazdığın adı kontrol et.";
    } else if (name === "TimeLimitError") {
      msg = "Program durmadan çalıştı. Hiç bitmeyen bir döngü olabilir mi?";
    } else {
      msg = "Python bir hata verdi.";
    }
    return { type: name || "Hata", raw: raw, msg: msg, line: line };
  }

  function lineOf(s) { var c = s, ln = 0; while (c) { if (c.$lineno != null) ln = c.$lineno; c = c.child; } return ln; }

  /* ---------- çalıştırıcı: Skulpt'u eşzamanlı sürer, satır sayar ---------- */
  function Runner(builtins, globalsIn) {
    var Sk = G.Sk, st = { line: 0, steps: 0 }, out = [], buf = "";
    function flush(final) {
      var parts = buf.split("\n"); buf = parts.pop();
      if (final && buf) { parts.push(buf); buf = ""; }
      parts.forEach(function (p) { out.push(p); });
    }
    function drive(r) {
      while (r instanceof Sk.misceval.Suspension) {
        if (r.data && r.data.type === "Sk.debug") {
          st.line = lineOf(r);
          if (++st.steps > LINE_LIMIT) throw robiErr("Program durmadan çalıştı ve durduruldu. Hiç bitmeyen bir döngü olabilir mi? <code>while</code> koşulunun bir gün yanlış olacağından emin ol.");
        }
        r = r.resume();
      }
      return r;
    }
    function setup() {
      Sk.configure({
        output: function (t) { buf += t; if (t.indexOf("\n") >= 0) flush(false); },
        read: function (x) { if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined) throw "Dosya yok: " + x; return Sk.builtinFiles.files[x]; },
        inputfun: function () { throw robiErr("Atölyede <code>input()</code> kullanmıyoruz. Değeri doğrudan bir değişkene yaz: <code>isim = \"Ali\"</code>"); },
        inputfunTakesPrompt: true,
        __future__: Sk.python3, debugging: true, execLimit: null, yieldLimit: null
      });
      Sk.breakpoints = function () { return true; };
      ["piksel", "ciz", "temizle", "mesaj", "alfabe", "meyveler", "test_meyveleri"].forEach(function (k) { delete Sk.builtins[k]; });
      Object.keys(builtins || {}).forEach(function (k) {
        var v = builtins[k];
        Sk.builtins[k] = typeof v === "function" ? new Sk.builtin.func(v) : Sk.ffi.remapToPy(v);
      });
    }
    return {
      run: function (code) {
        setup();
        var mod = null, error = null;
        var bad = stripCode(code).split("\n").map(function (l, i) { var m = l.match(/[A-Za-z_çğıöşüÇĞİÖŞÜ]*[çğıöşüÇĞİÖŞÜ][\wçğıöşüÇĞİÖŞÜ]*/); return m ? { i: i, w: m[0] } : null; }).filter(Boolean)[0];
        if (bad) return { mod: null, out: out, error: { type: "Atölye", raw: "", line: bad.i + 1, msg: "<code>" + esc(bad.w) + "</code> adında Türkçe harf var. Değişken ve fonksiyon adlarında ç, ğ, ı, ö, ş, ü kullanmıyoruz (bu tarayıcıdaki Python izin vermiyor, programcılar da genelde kullanmaz). Tırnak içindeki yazılarda serbest." } };
        try { mod = drive(Sk.importMainWithBody("<atolye>", false, code, true)); }
        catch (e) { error = translate(e, st.line, code); }
        flush(true);
        return { mod: mod, out: out, error: error };
      },
      call: function (mod, name, args) {
        var Sk = G.Sk, fn = mod && mod.$d[name];
        if (!fn) return { error: { type: "Atölye", raw: "", line: 0, msg: "<code>" + name + "</code> fonksiyonunu bulamadım. <code>def " + name + "(...):</code> satırı var mı?" } };
        var o0 = out.length;
        try {
          st.steps = 0;
          var res = drive(Sk.misceval.callsimOrSuspendArray(fn, args.map(function (a) { return Sk.ffi.remapToPy(a); })));
          flush(true);
          return { value: Sk.ffi.remapToJs(res), isNone: res === Sk.builtin.none.none$, printed: out.slice(o0) };
        } catch (e) { flush(true); return { error: translate(e, st.line, "") }; }
      },
      getVar: function (mod, name) { var v = mod && mod.$d[name]; if (v === undefined) v = G.Sk.builtins[name]; return v === undefined ? undefined : G.Sk.ffi.remapToJs(v); },
      out: out
    };
  }

  /* ---------- kurallar ---------- */
  function checkRules(rules, code) {
    var r = rules || {}, s = stripCode(code), probs = [];
    if (r.maxLines && countLines(code) > r.maxLines) probs.push("Kodun " + countLines(code) + " satır. Bu görevde en fazla " + r.maxLines + " satır yazabilirsin.");
    (r.need || []).forEach(function (n) {
      if (n === "for" && !/\bfor\b/.test(s)) probs.push("Bu görevde bir <code>for</code> döngüsü kullanmalısın.");
      if (n === "nestedFor" && (s.match(/\bfor\b/g) || []).length < 2) probs.push("Bu görevde iç içe iki <code>for</code> döngüsü kullanmalısın.");
      if (n === "if" && !/\bif\b/.test(s)) probs.push("Bu görevde bir <code>if</code> koşulu kullanmalısın.");
      if (n === "list" && !/\[[^\]\n]*,[^\]\n]*\]/.test(code.replace(/#.*$/gm, ""))) probs.push("Bu görevde bir liste kullanmalısın: <code>[\"a\", \"b\"]</code>");
      if (n === "dict" && !/\{[\s\S]*?:[\s\S]*?\}/.test(code.replace(/#.*$/gm, ""))) probs.push("Bu görevde bir sözlük kullanmalısın: <code>{\"anahtar\": \"değer\"}</code>");
    });
    return probs;
  }

  /* ---------- istasyonlara göre kontrol ---------- */
  function sameOut(out, expected) {
    var a = out.map(function (l) { return l.replace(/\s+$/, ""); });
    while (a.length && !a[a.length - 1]) a.pop();
    return a.length === expected.length && a.every(function (l, i) { return l === expected[i]; });
  }

  function checkFix(task, code) {
    var R = Runner({}), res = R.run(code);
    var ok = !res.error && sameOut(res.out, task.expected);
    var msg = res.error ? null : ok ? null : "Program çalıştı ama çıktı beklenenden farklı.";
    return { ok: ok, error: res.error, out: res.out, msg: msg, rules: [] };
  }

  function cipherText(task) { return task.make(task.plain || ""); }
  function checkCipher(task, code) {
    var R = Runner({ mesaj: cipherText(task), alfabe: TR_ALFABE }), res = R.run(code);
    var rules = checkRules(task.rules, code);
    if (res.error) return { ok: false, error: res.error, out: res.out, rules: rules };
    if (task.funcs) {
      var tests = [["ali", 1, "bmj"], ["zeytin", 2, null], ["gizli üs", 5, null], ["ajan 007", 28, null]], rows = [], allOk = true;
      tests.forEach(function (t) {
        var expect = t[2] || sezar(t[0], t[1]);
        var s = R.call(res.mod, "sifrele", [t[0], t[1]]);
        var okS = !s.error && s.value === expect;
        var c = okS ? R.call(res.mod, "coz", [expect, t[1]]) : null;
        var okC = !!c && !c.error && c.value === t[0];
        rows.push({ input: t[0], k: t[1], enc: s.error ? "hata" : s.value, expect: expect, dec: c ? (c.error ? "hata" : c.value) : "—", okS: okS, okC: okC, err: (s.error || (c && c.error)) });
        if (!okS || !okC) allOk = false;
      });
      return { ok: allOk && !rules.length, out: res.out, rules: rules, funcRows: rows, msg: allOk ? null : "Fonksiyonlarından en az biri gizli testte yanlış sonuç verdi." };
    }
    var said = lower(res.out.join(" ")), want = lower(task.plain);
    var ok = said === want;
    return { ok: ok && !rules.length, out: res.out, rules: ok ? rules : [], msg: ok ? null : (res.out.length ? "Ekrana yazdırdığın şey çözülmüş mesaj değil. Biraz daha uğraş!" : "Ekrana hiçbir şey yazdırmadın. <code>print()</code> kullan.") };
  }

  function colorKey(v) {
    if (Array.isArray(v)) {
      if (v.length !== 3 || v.some(function (n) { return typeof n !== "number" || n < 0 || n > 255 || n !== Math.floor(n); })) return null;
      return "#" + v.map(function (n) { return ("0" + n.toString(16)).slice(-2); }).join("");
    }
    if (typeof v !== "string") return null;
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    var k = trFold(v).replace(/_/g, "");
    return COLORS[k] || null;
  }

  function checkPixel(task, code) {
    var W = task.w, H = task.h, grid = [], events = [], y, x;
    for (y = 0; y < H; y++) { grid.push([]); for (x = 0; x < W; x++) grid[y].push(null); }
    var Sk = G.Sk, NONE;
    function put(px, py, c) { grid[py][px] = c; events.push([px, py, c]); if (events.length > 20000) throw robiErr("Çok fazla piksel çizildi. Bitmeyen bir döngü olabilir mi?"); }
    var R = Runner({
      piksel: function (px, py, renk) {
        var X = px === undefined ? undefined : Sk.ffi.remapToJs(px), Y = py === undefined ? undefined : Sk.ffi.remapToJs(py);
        if (renk === undefined) throw robiErr("<code>piksel(x, y, renk)</code> üç bilgi ister: x, y ve renk.");
        if (typeof X !== "number" || typeof Y !== "number" || X !== Math.floor(X) || Y !== Math.floor(Y)) throw robiErr("x ve y tam sayı olmalı.");
        if (X < 0 || X >= W || Y < 0 || Y >= H) throw robiErr("(" + X + ", " + Y + ") tuvalin dışında. x 0 ile " + (W - 1) + ", y 0 ile " + (H - 1) + " arasında olmalı.");
        var rv = Sk.ffi.remapToJs(renk), c = colorKey(rv);
        if (!c) throw robiErr(Array.isArray(rv) ? "RGB rengi 0 ile 255 arasında 3 tam sayı olmalı: <code>(255, 120, 0)</code>" : "<code>" + esc(rv) + "</code> rengini tanımıyorum. Bildiğim renkler: " + Object.keys(COLORS).join(", ") + ".");
        put(X, Y, c);
        return Sk.builtin.none.none$;
      },
      ciz: function (liste) {
        var rows = Sk.ffi.remapToJs(liste);
        if (!Array.isArray(rows) || rows.some(function (r) { return typeof r !== "string"; })) throw robiErr("<code>ciz()</code> içine metinlerden oluşan bir liste vermelisin.");
        if (rows.length > H) throw robiErr("Listede " + rows.length + " satır var ama tuval " + H + " satır.");
        rows.forEach(function (r, yy) {
          if (r.length > W) throw robiErr((yy + 1) + ". satır " + r.length + " karakter ama tuval " + W + " karakter genişliğinde.");
          for (var xx = 0; xx < r.length; xx++) {
            var ch = r[xx];
            if (ch === "." || ch === " ") continue;
            if (!LETTERS[ch]) throw robiErr("<code>" + esc(ch) + "</code> harfi bir renk değil. Kullanabileceğin harfler: " + Object.keys(LETTERS).join(" ") + " ve boş için nokta.");
            put(xx, yy, COLORS[LETTERS[ch]]);
          }
        });
        return Sk.builtin.none.none$;
      },
      temizle: function () { for (var a = 0; a < H; a++) for (var b = 0; b < W; b++) grid[a][b] = null; events.push(["clear"]); return Sk.builtin.none.none$; }
    });
    var res = R.run(code), rules = checkRules(task.rules, code);
    var count = 0; grid.forEach(function (r) { r.forEach(function (c) { if (c) count++; }); });
    if (res.error) return { ok: false, error: res.error, out: res.out, grid: grid, events: events, rules: rules };
    if (task.free) {
      var base = task._base || (task._base = checkPixel({ w: W, h: H, free: 0, starter: "" }, task.starter).grid), diff = 0;
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (grid[y][x] !== base[y][x]) diff++;
      var okF = diff >= task.free;
      return { ok: okF, out: res.out, grid: grid, events: events, rules: [], msg: okF ? null : "Örnek resimden sadece " + diff + " piksel farklı. Kendi çizimini ekle: en az " + task.free + " piksel." };
    }
    var tgt = targetGrid(task), wrong = 0, miss = 0, extra = 0;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var a = grid[y][x], b = tgt[y][x];
      if (b && !a) miss++; else if (!b && a) extra++; else if (a && b && a !== b) wrong++;
    }
    var okP = !miss && !wrong && !extra, p = [];
    if (miss) p.push(miss + " piksel eksik"); if (wrong) p.push(wrong + " piksel yanlış renk"); if (extra) p.push(extra + " piksel fazladan boyanmış");
    return { ok: okP && !rules.length, out: res.out, grid: grid, events: events, rules: okP ? rules : [], msg: okP ? null : "Hedef resimle aynı değil: " + p.join(", ") + "." };
  }
  function targetGrid(task) {
    var g = [], y, x;
    for (y = 0; y < task.h; y++) {
      g.push([]);
      for (x = 0; x < task.w; x++) {
        var c = null;
        if (task.target) { var ch = (task.target[y] || "")[x]; c = ch && LETTERS[ch] ? COLORS[LETTERS[ch]] : null; }
        else if (task.targetFn) c = colorKey(task.targetFn(x, y));
        g[y].push(c);
      }
    }
    return g;
  }

  /* --- sohbet botu --- */
  function compileBot(code) {
    var R = Runner({}), res = R.run(code);
    return { R: R, mod: res.mod, error: res.error, out: res.out };
  }
  function askBot(bot, text) {
    if (bot.error || !bot.mod) return { error: bot.error };
    var r = bot.R.call(bot.mod, "cevap", [text]);
    if (r.error) return { error: r.error };
    if (r.isNone) return { error: { type: "Atölye", raw: "", line: 0, msg: "Fonksiyon bir cevap döndürmedi (<code>None</code>). Her durumda bir <code>return \"...\"</code> satırına ulaşmalı." } };
    if (typeof r.value !== "string") return { answer: String(r.value), warn: "Cevap bir yazı (str) değil." };
    return { answer: r.value };
  }
  function checkBot(task, code) {
    var bot = compileBot(code), rules = checkRules(task.rules, code), rows = [];
    if (bot.error) return { ok: false, error: bot.error, out: bot.out, rules: rules, tests: [] };
    if (!bot.mod.$d.cevap) return { ok: false, error: { type: "Atölye", raw: "", line: 0, msg: "<code>cevap</code> fonksiyonunu bulamadım. <code>def cevap(mesaj):</code> satırını silme." }, rules: rules, tests: [] };
    var tests = task.tests;
    if (tests === "compare") return { ok: null, bot: bot, tests: [], rules: [] };
    if (tests === "dict") {
      var d = bot.R.getVar(bot.mod, "cevaplar");
      if (!d || typeof d !== "object" || Array.isArray(d)) return { ok: false, bot: bot, rules: rules, tests: [], msg: "<code>cevaplar</code> adında bir sözlük bulamadım." };
      var keys = Object.keys(d);
      tests = keys.map(function (k) { return { msg: "bot, " + k + "?", kind: "eq", val: d[k] }; });
      tests.push({ msg: "zxqv bilinmeyen", kind: "notIn", val: keys.map(function (k) { return d[k]; }) });
      if (keys.length < 5) rows.push({ msg: "(sözlükteki soru sayısı)", answer: keys.length + " tane", pass: false, need: "en az 5" });
    }
    if (tests === "random") {
      var seen = {}, okR = true, sakalar = bot.R.getVar(bot.mod, "sakalar");
      for (var i = 0; i < 25; i++) { var a = askBot(bot, i % 2 ? "Bir şaka yap" : "şaka anlat"); if (a.error) { okR = false; rows.push({ msg: "şaka anlat", answer: "hata", pass: false, err: a.error }); break; } seen[a.answer] = 1; }
      var n = Object.keys(seen).length;
      if (okR) rows.push({ msg: "\"şaka anlat\" × 25 kez", answer: n + " farklı espri", pass: n >= 3, need: "en az 3 farklı espri" });
      var o = askBot(bot, "uzay gemisi");
      rows.push({ msg: "uzay gemisi", answer: o.error ? "hata" : o.answer, pass: !o.error && !/şaka|espri/i.test(o.answer || "") && !(sakalar || []).some(function (s) { return s === o.answer; }), need: "espri yapmamalı" });
      var allR = rows.every(function (r) { return r.pass; });
      return { ok: allR && !rules.length, bot: bot, tests: rows, rules: rules };
    }
    tests.forEach(function (t) {
      var a = askBot(bot, t.msg), pass = false, need = "";
      if (!a.error) {
        var ans = lower(a.answer);
        if (t.kind === "nonempty") { pass = ans.length > 0; need = "boş olmayan bir cevap"; }
        if (t.kind === "has") { pass = trFold(ans).indexOf(trFold(t.val)) >= 0; need = "içinde \"" + t.val + "\" geçmeli"; }
        if (t.kind === "eq") { pass = a.answer === t.val; need = "\"" + t.val + "\""; }
        if (t.kind === "notIn") { pass = t.val.indexOf(a.answer) < 0; need = "sözlükteki cevaplardan biri olmamalı"; }
      }
      rows.push({ msg: t.msg, answer: a.error ? "hata" : a.answer, pass: pass, need: need, err: a.error });
    });
    var all = rows.every(function (r) { return r.pass; });
    return { ok: all && !rules.length, bot: bot, tests: rows, rules: all ? rules : [] };
  }

  /* --- örneklerden öğrenen bot: harf üçlüleri + en yakın komşu --- */
  function grams(s) {
    var t = "  " + trFold(s.replace(/[^\p{L}\p{N} ]/gu, " ")).replace(/\s+/g, " ") + "  ", g = {};
    for (var i = 0; i < t.length - 2; i++) g[t.substr(i, 3)] = (g[t.substr(i, 3)] || 0) + 1;
    return g;
  }
  function cosine(a, b) {
    var dot = 0, na = 0, nb = 0, k;
    for (k in a) { na += a[k] * a[k]; if (b[k]) dot += a[k] * b[k]; }
    for (k in b) nb += b[k] * b[k];
    return na && nb ? dot / Math.sqrt(na * nb) : 0;
  }
  function mlTeach(text, intentName) {
    var it = ML_INTENTS.filter(function (i) { return i.name === intentName; })[0];
    if (it && text.trim()) it.examples.push(text.trim());
  }
  function mlBot(text) {
    var g = grams(text), best = { score: 0 };
    ML_INTENTS.forEach(function (it) {
      it.examples.forEach(function (ex) { var s = cosine(g, grams(ex)); if (s > best.score) best = { score: s, intent: it, example: ex }; });
    });
    if (best.score < 0.2) return { answer: "Emin değilim, bunu öğrenmedim.", score: best.score, example: best.example || "—" };
    return { answer: best.intent.answer, score: best.score, example: best.example, intent: best.intent.name };
  }

  /* Başlangıç dersleri: kod alıştırmalarını kontrol et */
  function checkLesson(step, code) {
    var R = Runner({}), res = R.run(code), c = step.check || {}, probs = [];
    if (res.error) return { ok: false, error: res.error, out: res.out };
    var lines = res.out.filter(function (l) { return l.trim(); }), all = lower(res.out.join("\n"));
    if (c.expect && !sameOut(res.out, c.expect)) probs.push(res.out.length ? "Çıktı beklenenden farklı. Beklenen:<pre>" + esc(c.expect.join("\n")) + "</pre>" : "Program ekrana hiçbir şey yazmadı. <code>print()</code> kullanmayı unutma.");
    if (c.minLines && lines.length < c.minLines) probs.push("Ekrana en az " + c.minLines + " satır yazmalısın. Şu an " + lines.length + " satır var.");
    (c.contains || []).forEach(function (w) { if (all.indexOf(lower(w)) < 0) probs.push("Çıktıda <b>" + esc(w) + "</b> görünmüyor."); });
    (c.notContains || []).forEach(function (w) { if (all.indexOf(lower(w)) >= 0) probs.push("Çıktıda hâlâ <b>" + esc(w) + "</b> var. Onu değiştirmeyi unutma."); });
    var s = stripCode(code);
    (c.need || []).forEach(function (n) {
      if (n === "assign" && !/^\s*[A-Za-z_]\w*\s*=[^=]/m.test(s)) probs.push("Değişken kullanmalısın: <code>a = 7</code> gibi.");
      if (n === "for" && !/\bfor\b/.test(s)) probs.push("Bir <code>for</code> döngüsü kullanmalısın.");
      if (n === "if" && !/\bif\b/.test(s)) probs.push("Bir <code>if</code> kullanmalısın.");
      if (n === "while" && !/\bwhile\b/.test(s)) probs.push("Bir <code>while</code> döngüsü kullanmalısın.");
      if (n === "comment" && !/^\s*#/m.test(code)) probs.push("Satırı silmek yerine başına <code>#</code> koyarak sustur.");
    });
    return { ok: !probs.length, out: res.out, probs: probs };
  }

  /* Kod yapbozu: birleştirilen program çalışır, çıktısı beklenenle karşılaştırılır. */
  function checkParsons(task, code) {
    if (!code.trim()) return { ok: false, out: [], rules: [], msg: "Programın boş. Soldaki parçalara tıklayarak ekle." };
    var R = Runner({}), res = R.run(code), want = task.expect;
    if (res.error) return { ok: false, error: res.error, out: res.out, rules: [] };
    var ok = sameOut(res.out, want);
    return { ok: ok, out: res.out, rules: [], msg: ok ? null : "Program çalıştı ama çıktı beklenenden farklı. Sırayı ve girintileri kontrol et." };
  }

  /* --- Model atölyesi: öğrencinin KNN kodu --- */
  function modelRunner(code) {
    var R = Runner({ meyveler: JSON.parse(JSON.stringify(MEYVELER)), test_meyveleri: JSON.parse(JSON.stringify(TEST_MEYVELERI)) });
    var res = R.run(code);
    return { R: R, mod: res.mod, error: res.error, out: res.out };
  }
  function near(a, b) {
    if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && a.every(function (x, i) { return near(x, b[i]); });
    if (typeof b === "number") return typeof a === "number" && Math.abs(a - b) < 1e-6;
    return a === b;
  }
  function show(v) { return Array.isArray(v) ? "[" + v.map(function (x) { return typeof x === "number" ? +x.toFixed(2) : JSON.stringify(x); }).join(", ") + "]" : typeof v === "number" ? String(+v.toFixed(3)) : v == null ? "None" : String(v); }
  function js1nn(p, veri) { var best = 1e9, t = ""; (veri || MEYVELER).forEach(function (m) { var d = jsUzaklik(p, m); if (d < best) { best = d; t = m[2]; } }); return t; }
  var PTS = [[137.5, 2.5], [152.5, 4.5], [171.5, 7.5], [196.5, 3.5], [160.5, 5.5], [127.5, 8.5], [183.5, 1.5], [142.5, 6.5]];
  function checkModel(task, code) {
    var M = modelRunner(code), rows = [];
    if (M.error) return { ok: false, error: M.error, out: M.out, rules: [], tests: [], sess: null };
    function call(fn, args) { var r = M.R.call(M.mod, fn, args); return r.error ? { err: r.error } : { v: r.isNone ? null : r.value }; }
    function row(label, fn, args, want) {
      var r = call(fn, args), pass = !r.err && near(r.v, want);
      rows.push({ label: label, got: r.err ? "hata" : show(r.v), want: show(want), pass: pass, err: r.err });
      return pass;
    }
    var v = task.verify;
    if (Array.isArray(v)) v.forEach(function (t) { row(t.fn + "(" + t.args.map(show).join(", ") + ")", t.fn, t.args, t.want); });
    else if (v === "knn1") PTS.slice(0, 6).forEach(function (p) { row("tahmin(" + show(p) + ")", "tahmin", [p], js1nn(p)); });
    else if (v === "knnk") {
      [[[196, 3], 1], [[196, 3], 3]].concat(PTS.slice(0, 4).map(function (p, i) { return [p, [1, 3, 5, 3][i]]; })).forEach(function (pk) { row("tahmin(" + show(pk[0]) + ", " + pk[1] + ")", "tahmin", [pk[0], pk[1]], jsKnn(pk[0], pk[1])); });
    } else if (v === "scale") {
      row("olcekle([200, 9])", "olcekle", [[200, 9]], [10, 9]);
      row("olcekle([120, 5])", "olcekle", [[120, 5]], [0, 5]);
      row("olcekle([160, 3])", "olcekle", [[160, 3]], jsOlcekle([160, 3]));
      row("tahmin([158, 6], 3)", "tahmin", [[158, 6], 3], jsKnn([158, 6], 3, null, true));
    } else if (v === "acc") {
      [1, 3, 5, 7].forEach(function (k) {
        var ok = 0; TEST_MEYVELERI.forEach(function (m) { if (jsKnn(m, k, null, true) === m[2]) ok++; });
        row("dogruluk(" + k + ")", "dogruluk", [k], ok / TEST_MEYVELERI.length * 100);
      });
    } else if (v === "three") {
      var data = M.R.getVar(M.mod, "meyveler") || [];
      var nM = data.filter(function (m) { return m && m[2] === "mandalina"; }).length;
      rows.push({ label: "listedeki mandalina sayısı", got: String(nM), want: "en az 4", pass: nM >= 4 });
      [[[102, 7], 3], [[140, 2], 3], [[185, 9], 3], [[112, 6], 1]].forEach(function (pk) { row("tahmin(" + show(pk[0]) + ", " + pk[1] + ")", "tahmin", [pk[0], pk[1]], jsKnn(pk[0], pk[1], data)); });
    }
    var all = rows.length > 0 && rows.every(function (r) { return r.pass; });
    var firstErr = rows.filter(function (r) { return r.err; })[0];
    return { ok: all, out: M.out, rules: [], tests: rows, sess: M, error: firstErr ? firstErr.err : null, msg: all ? null : "Fonksiyonun bazı testlerde beklenenden farklı sonuç verdi." };
  }
  /* Bölge boyamak için öğrencinin tahmin fonksiyonunu çağır */
  function modelPredict(sess, fn, args) {
    if (!sess || !sess.mod || !sess.mod.$d[fn]) return null;
    var r = sess.R.call(sess.mod, fn, args);
    return r.error || r.isNone ? null : r.value;
  }

  function check(station, task, code) {
    if (station.kind === "fix") return checkFix(task, code);
    if (station.kind === "cipher") return checkCipher(task, code);
    if (station.kind === "pixel") return checkPixel(task, code);
    if (station.kind === "bot") return checkBot(task, code);
    if (station.kind === "parsons") return checkParsons(task, code);
    if (station.kind === "model") return checkModel(task, code);
    return null;
  }
  function runSnippet(code) { var R = Runner({}); return R.run(code); }

  return { check: check, checkLesson: checkLesson, checkParsons: checkParsons, modelPredict: modelPredict, modelRunner: modelRunner, runSnippet: runSnippet, compileBot: compileBot, askBot: askBot, mlBot: mlBot, mlTeach: mlTeach, targetGrid: targetGrid,
    cipherText: cipherText, countLines: countLines, COLORS: COLORS, LETTERS: LETTERS, esc: esc };
})();

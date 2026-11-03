/* İstasyon sayfaları: kodlu görevler (hata, ajan, piksel, bot) ve tahmin kartları. */
import { TR_ALFABE, ML_INTENTS, MEYVELER, TEST_MEYVELERI, jsKnn } from "../data/stations.js";
import { Atolye } from "../engine/atolye.js";
import { $, $$, esc, icon, save, persist, S, taskCount, reqCount, doneCount, isBonus, unlocked, setHue, HUES, PHASES, shell, setupEditor, getCode, setCode, markErr, clearErr, errorHtml, pythonReady, confetti } from "./core.js";
import { hintLadder, whereHint, mountParsons } from "./widgets.js";
import { bindShell } from "./pages.js";

const root = () => $("#root");
let ST = null, T = null, IDX = 0, chatCount = 0, bot = null, typeTimer = null, drawRAF = null, ladder = null, PZ = null, MV = null;

function head(st, idx) {
  const steps = Array.from({ length: taskCount(st) }, (_, i) => {
    const done = save.done[st.id + "-" + i], open = unlocked(st, i), b = isBonus(st, i);
    const label = st.kind === "quiz" ? "Tur " + (i + 1) : b ? icon("star") : String(i + 1);
    const title = st.kind === "quiz" ? st.rounds[i].title : st.tasks[i].title;
    return `<button class="step${done ? " done" : ""}${b ? " step--bonus" : ""}${i === idx ? " cur" : ""}" data-step="${i}"${open ? "" : " disabled"} title="${esc(b ? "Yıldızlı görev: " + title : title)}">${done && !b ? icon("check") : open || b ? "" : icon("lock")}${label}</button>`;
  }).join("");
  const ph = PHASES[st.phase];
  return `<header class="work-head"><nav class="crumbs"><a href="#asama-${st.phase + 1}">${ph.title}</a>${icon("chev")}<span>${st.no ? "İstasyon " + st.no : st.name}</span></nav>
    <h1><span class="hue-tile">${icon(HUES[st.id].icon)}</span>${st.name}</h1>
    <p class="muted" style="font-size:15px">${st.nb}</p><nav class="steps" aria-label="Görevler">${steps}</nav></header>`;
}
function bindSteps(st) { $$("[data-step]").forEach((b) => { b.onclick = () => { location.hash = st.id + "-" + (+b.dataset.step + 1); }; }); }

export function showStation(id, idx) {
  const st = S[id];
  if (!st) { location.hash = "asama-3"; return; }
  if (idx == null) { idx = 0; for (let i = 0; i < taskCount(st); i++) if (unlocked(st, i)) idx = i; }
  if (idx >= taskCount(st) || !unlocked(st, idx)) { location.hash = id; return; }
  setHue(st.id); chatCount = 0;
  if (st.kind === "quiz") showQuiz(st, idx); else if (st.kind === "parsons") showParsons(st, idx); else showTask(st, idx);
  window.scrollTo(0, 0);
}
function markDone(st, idx) {
  const k = st.id + "-" + idx, first = !save.done[k];
  save.done[k] = true; persist();
  const b = $(`[data-step="${idx}"]`);
  if (b) { b.classList.add("done"); if (!/svg/.test(b.innerHTML)) b.innerHTML = icon("check") + b.innerHTML; }
  for (let j = 0; j < taskCount(st); j++) { const nb = $(`[data-step="${j}"]`); if (nb && nb.disabled && unlocked(st, j)) { nb.disabled = false; if (!isBonus(st, j)) nb.innerHTML = nb.innerHTML.replace(/<span class="icon"[\s\S]*?<\/span>/, ""); } }
  if (first) confetti();
}

/* =========================== KODLU GÖREVLER =========================== */
const FILES = { bot: "bot.py", pixel: "resim.py", cipher: "cozucu.py", fix: "program.py", model: "model.py" };
const RULE_TXT = { for: "for kullan", nestedFor: "iç içe for", if: "if kullan", list: "liste kullan", dict: "sözlük kullan" };

function showTask(st, idx) {
  ST = st; IDX = idx; T = st.tasks[idx]; MV = null;
  const r = T.rules || {}, rules = [];
  if (r.maxLines) rules.push("en fazla " + r.maxLines + " satır");
  (r.need || []).forEach((n) => rules.push(RULE_TXT[n]));
  const key = st.id + "-" + idx, starter = st.kind === "fix" ? T.code : T.starter;
  const code = save.code[key] != null ? save.code[key] : starter;
  const content = head(st, idx) + `<div class="split"><div class="stack">
      <article class="sheet">${kicker(st, idx)}<h2>${T.title}</h2>
        <div class="prose" style="margin-top:8px"><p>${T.story}</p></div>
        <div class="goal">${icon("target")}<span>${st.kind === "fix" ? "Programı düzelt: çıktısı <b>beklenen çıktı</b> ile aynı olsun." : T.goal}</span></div>
        ${rules.length ? `<div class="rules">${rules.map((x) => `<span>${x}</span>`).join("")}</div>` : ""}</article>
      <div class="editor-wrap"><div class="editor"><div class="editor-top"><span class="file">${FILES[st.kind]}</span><span id="lineInfo"></span></div><div id="cmHost"></div></div>
        <div class="editor-bar"><button class="btn btn--hue" id="runBtn">${icon("play")} Çalıştır</button><button class="btn" id="hintBtn">${icon("bulb")} İpucu</button>
        <button class="btn btn--quiet" id="resetBtn">${icon("reset")} Baştan al</button>${save.teacher && T.solution ? `<button class="btn btn--quiet" id="solBtn">${icon("eye")} Çözüm</button>` : ""}<span class="sp"></span><span class="kbd">Ctrl + Enter</span></div></div>
      <div id="feedback"></div><div class="stack" id="hints"></div>
    </div><div class="stack" id="screen"></div></div>`;
  root().innerHTML = shell(content, st.phase);
  bindShell(); bindSteps(st);
  setupEditor($("#cmHost"), code, () => { save.code[key] = getCode(); persist(); lineInfo(); }, run);
  $("#runBtn").onclick = run;
  ladder = hintLadder({ btn: $("#hintBtn"), list: $("#hints"), hints: T.hints, solution: T.solution, extra: st.kind === "fix" ? () => whereHint(T.code, T.solution) : null });
  $("#resetBtn").onclick = () => { setCode(starter); $("#feedback").innerHTML = ""; renderScreen(null); };
  if ($("#solBtn")) $("#solBtn").onclick = () => setCode(T.solution);
  renderScreen(null); lineInfo();
}
function lineInfo() { const n = Atolye.countLines(getCode()), lim = (T.rules || {}).maxLines; $("#lineInfo").textContent = n + " satır" + (lim ? " / en fazla " + lim : ""); }
function kicker(st, idx) {
  const t = st.tasks[idx];
  return t.bonus ? `<span class="k k--bonus">${icon("star")} Yıldızlı görev · isteğe bağlı <code>${esc(t.tag.replace(/^★\s*/, ""))}</code></span>` : `<span class="k">Görev ${idx + 1} <code>${esc(t.tag)}</code></span>`;
}
/* Görev bitince: sıradaki görev, yıldızlı görev ya da istasyon listesi */
function nextLinks(st, idx) {
  const n = taskCount(st), back = `#asama-${st.phase + 1}`;
  let nx = -1;
  for (let j = idx + 1; j < n; j++) { if (!isBonus(st, j) || unlocked(st, j)) { nx = j; break; } }
  if (nx >= 0 && !isBonus(st, nx)) return `<a class="btn btn--hue" href="#${st.id}-${nx + 1}">Sonraki görev ${icon("right")}</a>`;
  const allReq = doneCount(st) === reqCount(st);
  const bonusLeft = st.tasks.map((t, j) => j).filter((j) => isBonus(st, j) && !save.done[st.id + "-" + j]);
  return (allReq && bonusLeft.length && !isBonus(st, idx) ? `<a class="btn btn--hue" href="#${st.id}-${bonusLeft[0] + 1}">${icon("star")} Yıldızlı görev</a>` : "") +
    `<a class="btn${allReq && bonusLeft.length && !isBonus(st, idx) ? "" : " btn--hue"}" href="${back}">${allReq ? "İstasyon bitti · listeye dön" : "İstasyon listesi"} ${icon("right")}</a>`;
}
function run() {
  const fb = $("#feedback");
  if (!pythonReady()) { fb.innerHTML = `<div class="fb fb--bad"><h3>Python yüklenemedi</h3><p>Sayfayı yenileyip tekrar dene.</p></div>`; return; }
  const code = getCode(); clearErr();
  const res = Atolye.check(ST, T, code);
  renderScreen(res);
  if (res.error) { ladder.fail(); markErr(res.error.line); fb.innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}${res.error.line ? res.error.line + ". satırda hata" : "Hata"}</h3>${errorHtml(res.error, code, T)}</div>`; return; }
  if (res.ok === null) { fb.innerHTML = ""; return; }
  if (!res.ok) {
    const parts = [];
    if (res.msg) parts.push(`<p>${res.msg}</p>`);
    (res.rules || []).forEach((x) => parts.push(`<p>${x}</p>`));
    ladder.fail();
    fb.innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}Henüz olmadı</h3>${parts.join("")}<p class="muted">Takıldıysan <b>İpucu</b> düğmesine bas.</p></div>`;
    return;
  }
  markDone(ST, IDX);
  const extra = T.after || (ST.kind === "fix" ? "Hatayı buldun ve düzelttin. Programcılar zamanlarının büyük kısmını tam olarak bunu yaparak geçirir." :
    ST.kind === "cipher" ? (T.funcs ? "Şifre makinen bütün gizli testleri geçti." : "Dosya çözüldü.") : ST.kind === "pixel" ? "Resim hedefle birebir aynı." : ST.kind === "model" ? "Modelin bütün testleri geçti." : "Botun bütün testleri geçti.");
  fb.innerHTML = `<div class="fb fb--ok"><h3>${icon(T.bonus ? "star" : "check")}${T.bonus ? "Yıldızı kaptın" : "Görev tamamlandı"}</h3><p>${extra}</p><div class="row">${nextLinks(ST, IDX)}</div></div>`;
}

/* =========================== ÇIKTI EKRANLARI =========================== */
function renderScreen(res) {
  const box = $("#screen");
  if (ST.kind === "fix") return screenFix(box, res);
  if (ST.kind === "cipher") return screenCipher(box, res);
  if (ST.kind === "pixel") return screenPixel(box, res);
  if (ST.kind === "bot") return T.compare ? screenCompare(box, res) : screenBot(box, res);
  if (ST.kind === "model") return screenModel(box, res);
}

function screenFix(box, res) {
  const exp = T.expected, out = res ? res.out.slice() : null;
  if (out) while (out.length && !out[out.length - 1].trim()) out.pop();
  let h = `<section class="sheet"><div class="label"><span>Beklenen çıktı</span></div><div class="term">${exp.map((l, i) => `<div class="l"><i>${i + 1}</i><span>${esc(l)}</span></div>`).join("")}</div>
    <div class="label" style="margin-top:16px"><span>Senin programının çıktısı</span></div><div class="term">`;
  if (!out) h += `<span class="note">Programı çalıştırınca burada görünecek.</span>`;
  else if (!out.length) h += `<span class="note">${res.error ? "Program hata verdiği için hiçbir şey yazamadı." : "Program ekrana hiçbir şey yazmadı."}</span>`;
  else {
    h += out.slice(0, 40).map((l, i) => { const ok = l.replace(/\s+$/, "") === exp[i]; return `<div class="l ${ok ? "okl" : "badl"}"><i>${ok ? "✓" : "✗"}</i><span>${esc(l) || "&nbsp;"}</span></div>`; }).join("");
    if (out.length > 40) h += `<span class="note">… ve ${out.length - 40} satır daha</span>`;
    if (out.length < exp.length) h += `<span class="note">${exp.length - out.length} satır eksik.</span>`;
  }
  h += `</div></section><section class="sheet"><div class="label"><span>Hata mesajı nasıl okunur?</span></div><div class="prose"><p>Python'un mesajı İngilizcedir ve hep aynı düzendedir: önce <b>hatanın türü</b> (<code>NameError</code>, <code>SyntaxError</code>…), sonra <b>açıklaması</b>, bir de <b>satır numarası</b>. Önce türüne ve satırına bak, sorunun yarısını bulmuş olursun.</p><p>Bazen hiç hata mesajı çıkmaz ama sonuç yanlıştır. Bunlara <b>mantık hatası</b> denir ve en zor yakalananlar bunlardır.</p></div></section>`;
  box.innerHTML = h;
}

function screenCipher(box, res) {
  clearInterval(typeTimer);
  const ctext = Atolye.cipherText(T), solved = res && res.ok;
  let h = `<section class="dossier"><span class="stamp${solved ? " solved" : ""}">${solved ? "ÇÖZÜLDÜ" : "GİZLİ"}</span>
    <h3>DOSYA #${String(IDX + 1).padStart(2, "0")} · ${esc(T.title.toLocaleUpperCase("tr"))}</h3>
    <div class="cipher">${T.funcs ? "<em>Bu dosyada mesaj yok: ajans fonksiyonlarını gizli test mesajlarıyla deneyecek.</em>" : `<em>mesaj = </em>"${esc(ctext)}"`}</div>
    ${T.alfabe ? `<div class="cipher" style="font-size:14px"><em>alfabe = </em>"${TR_ALFABE}"</div>` : ""}
    <div class="decoder" id="decoder"><span class="dim">Çözücü ekranı · <code>print()</code> ile yazdırdığın şey burada görünür.</span></div></section>`;
  if (T.funcs && res && res.funcRows) {
    h += `<section class="sheet"><div class="label"><span>Ajansın gizli testleri</span></div><div class="tbl"><table class="t"><thead><tr><th>metin</th><th>kaydır</th><th>sifrele()</th><th>coz()</th><th></th></tr></thead><tbody>${res.funcRows.map((r) => {
      const ok = r.okS && r.okC;
      return `<tr><td>${esc(r.input)}</td><td>${r.k}</td><td>${esc(r.enc)}${r.okS ? "" : `<br><span class="muted">olmalıydı: ${esc(r.expect)}</span>`}</td><td>${esc(r.dec)}</td><td class="${ok ? "pass" : "fail"}">${ok ? "✓" : "✗"}</td></tr>`;
    }).join("")}</tbody></table></div></section>`;
  }
  box.innerHTML = h;
  if (res && res.out && res.out.length) {
    const text = res.out.join("\n"), d = $("#decoder"); let i = 0;
    d.innerHTML = '<span id="typed"></span><span class="cursor"></span>';
    const tEl = $("#typed"), stepN = Math.max(1, Math.ceil(text.length / 60));
    typeTimer = setInterval(() => { i += stepN; tEl.textContent = text.slice(0, i); if (i >= text.length) clearInterval(typeTimer); }, 22);
  } else if (res && !res.error) $("#decoder").innerHTML = '<span class="dim">Ekrana hiçbir şey yazdırılmadı.</span>';
}

function screenPixel(box, res) {
  cancelAnimationFrame(drawRAF);
  const W = T.w, H = T.h, usesLetters = T.target && !T.targetFn;
  const list = usesLetters ? Object.keys(Atolye.LETTERS).map((k) => `<span class="sw"><i style="background:${Atolye.COLORS[Atolye.LETTERS[k]]}"></i>${k} = ${Atolye.LETTERS[k]}</span>`).join("")
    : Object.keys(Atolye.COLORS).map((k) => `<span class="sw"><i style="background:${Atolye.COLORS[k]}"></i>${k}</span>`).join("");
  box.innerHTML = `<section class="sheet"><div class="label"><span>Tuval · ${W} × ${H}</span><span>x sağa, y aşağı doğru artar</span></div>
    <div class="canvas-row"><canvas class="main" id="cv"></canvas>${T.free ? "" : `<div class="thumb"><canvas id="tgt"></canvas>Hedef</div>`}</div>
    <div class="pix-status" id="pixStatus"></div>
    <div class="label" style="margin-top:16px"><span>${usesLetters ? "Harfler ve renkleri" : "Renk adları · ya da (r, g, b)"}</span></div><div class="swatches">${list}</div></section>`;
  const cv = $("#cv"), size = Math.min(560, cv.parentElement.clientWidth || 400), cell = Math.max(8, Math.floor(size / Math.max(W, H)));
  cv.width = W * cell; cv.height = H * cell;
  const ctx = cv.getContext("2d");
  const base = () => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.fillStyle = (x + y) % 2 ? "#1e2230" : "#1a1d28"; ctx.fillRect(x * cell, y * cell, cell, cell); } };
  const dot = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2); };
  base();
  if (!T.free) {
    const tg = Atolye.targetGrid(T), tc = $("#tgt"), tcell = Math.floor(112 / Math.max(W, H));
    tc.width = W * tcell; tc.height = H * tcell; const tx = tc.getContext("2d");
    tx.fillStyle = "#181b24"; tx.fillRect(0, 0, tc.width, tc.height);
    tg.forEach((row, y) => row.forEach((c, x) => { if (c) { tx.fillStyle = c; tx.fillRect(x * tcell, y * tcell, tcell, tcell); } }));
    if (!res) { ctx.globalAlpha = .18; tg.forEach((row, y) => row.forEach((c, x) => { if (c) dot(x, y, c); })); ctx.globalAlpha = 1; }
  }
  const status = $("#pixStatus");
  if (!res) { status.innerHTML = T.free ? "Çalıştır'a basınca resmin burada çizilecek." : "Soluk kareler hedef resim. Çalıştır'a basınca senin resmin çizilecek."; return; }
  const ev = res.events || []; let i = 0; const per = Math.max(1, Math.ceil(ev.length / 70));
  (function frame() {
    for (let k = 0; k < per && i < ev.length; k++, i++) { const e = ev[i]; if (e[0] === "clear") base(); else dot(e[0], e[1], e[2]); }
    status.innerHTML = `Çizilen piksel: <b>${i}</b> / ${ev.length}`;
    if (i < ev.length) drawRAF = requestAnimationFrame(frame);
    else {
      let cnt = 0; (res.grid || []).forEach((r) => r.forEach((c) => { if (c) cnt++; }));
      status.innerHTML = `Boyalı piksel: <b>${cnt}</b>` + (res.ok ? ` · <b style="color:var(--ok)">Hedefle aynı ✓</b>` : res.error ? "" : ` · <span style="color:var(--bad)">Hedefle aynı değil</span>`);
    }
  })();
}

function addMsg(who, text, note, target) {
  const m = target || $("#msgs"); if (!m) return null;
  const d = document.createElement("div"); d.className = "bub " + who;
  if (who === "err") d.innerHTML = text; else d.textContent = text;
  if (note) { const s = document.createElement("small"); s.textContent = note; d.appendChild(s); }
  m.appendChild(d); m.scrollTop = m.scrollHeight;
  return d;
}
function screenBot(box, res) {
  bot = res && res.bot ? res.bot : null;
  let h = `<section class="sheet"><div class="label"><span>Botunla konuş</span><span>${bot ? "bot hazır" : "önce Çalıştır"}</span></div>
    <div class="chat"><div class="msgs" id="msgs"><div class="bub sys">${bot ? "Botun hazır. Bir şey yaz." : "Önce <b>Çalıştır</b>'a bas. Bot kodunu öğrensin, sonra burada sohbet edebilirsin."}</div></div>
    <form id="chatForm"><input id="chatIn" autocomplete="off" placeholder="Bota bir mesaj yaz…" aria-label="Mesaj"${bot ? "" : " disabled"}><button class="btn btn--hue"${bot ? "" : " disabled"}>Gönder</button></form></div></section>`;
  if (res && res.tests && res.tests.length) {
    h += `<section class="sheet"><div class="label"><span>Otomatik testler</span><span>${res.tests.filter((t) => t.pass).length} / ${res.tests.length}</span></div><div class="tbl"><table class="t"><thead><tr><th>mesaj</th><th>botun cevabı</th><th>beklenen</th><th></th></tr></thead><tbody>${res.tests.map((t) => `<tr><td>${esc(t.msg)}</td><td>${esc(t.answer)}${t.err ? `<br><span style="color:var(--bad);font-family:var(--f-body)">${t.err.msg}</span>` : ""}</td><td class="plain">${esc(t.need || "")}</td><td class="${t.pass ? "pass" : "fail"}">${t.pass ? "✓" : "✗"}</td></tr>`).join("")}</tbody></table></div></section>`;
  }
  box.innerHTML = h;
  if (res && res.tests) res.tests.slice(0, 3).forEach((t) => { if (/×/.test(t.msg) || /^\(/.test(t.msg)) return; addMsg("me", t.msg, "test"); if (t.err) addMsg("err", t.err.msg); else addMsg("bot", t.answer); });
  $("#chatForm").onsubmit = (e) => {
    e.preventDefault();
    const inp = $("#chatIn"), text = inp.value.trim(); if (!text || !bot) return;
    inp.value = ""; addMsg("me", text);
    const a = Atolye.askBot(bot, text);
    if (a.error) addMsg("err", a.error.msg); else addMsg("bot", a.answer);
  };
}
function screenCompare(box, res) {
  bot = res && res.bot ? res.bot : null;
  const nEx = ML_INTENTS.reduce((a, i) => a + i.examples.length, 0);
  box.innerHTML = `<section class="sheet"><div class="label"><span>İki bot yan yana</span><span id="cmpCount"></span></div>
    <div class="compare"><div class="chat"><h4>Senin kural botun</h4><div class="msgs" id="msgsA"><div class="bub sys">${bot ? "Hazır." : "Önce kodu <b>Çalıştır</b>."}</div></div></div>
    <div class="chat"><h4 style="color:#0b6e60">Örneklerden öğrenen bot</h4><div class="msgs" id="msgsB"><div class="bub sys">Hiç kural yazılmadı. Sadece ${nEx} örnek cümle gördü.</div></div></div></div>
    <form class="compare-form" id="cmpForm"><input id="cmpIn" autocomplete="off" placeholder="İki bota da yaz: merhbaa, naslsın…" aria-label="Mesaj"${bot ? "" : " disabled"}><button class="btn btn--hue"${bot ? "" : " disabled"}>Gönder</button></form>
    <div id="learnNote" style="margin-top:16px"></div></section>
    <section class="sheet"><div class="label"><span>Öğrenen bot nasıl çalışıyor?</span></div><div class="prose"><p>Her mesajı üçer harflik parçalara böler (<code>mer</code>, <code>erh</code>, <code>rha</code>…) ve gördüğü örnek cümlelerin hangisiyle en çok parçası ortaksa onu seçer. <b>En yakın örneği</b> bulur ve o örneğin cevabını verir. Lab 1'de rakamları tanıyan <b>K-En Yakın Komşu</b> modeli de tam olarak böyle düşünüyor.</p></div></section>`;
  $("#cmpCount").textContent = chatCount ? chatCount + " mesaj" : "";
  $("#cmpForm").onsubmit = (e) => {
    e.preventDefault();
    const inp = $("#cmpIn"), text = inp.value.trim(); if (!text || !bot) return;
    inp.value = "";
    addMsg("me", text, null, $("#msgsA")); addMsg("me", text, null, $("#msgsB"));
    const a = Atolye.askBot(bot, text);
    if (a.error) addMsg("err", a.error.msg, null, $("#msgsA")); else addMsg("bot", a.answer, null, $("#msgsA"));
    const m = Atolye.mlBot(text);
    const b = addMsg("bot", m.answer, `en yakın örnek: "${m.example}" · benzerlik %${Math.round(m.score * 100)}`, $("#msgsB"));
    if (!m.intent) {
      const t = document.createElement("div"); t.className = "teach";
      t.innerHTML = `Öğret: bu mesaj <select aria-label="Niyet">${ML_INTENTS.map((it) => `<option>${it.name}</option>`).join("")}</select><button class="btn btn--sm" type="button">Öğret</button>`;
      b.appendChild(t);
      $("button", t).onclick = () => { Atolye.mlTeach(text, $("select", t).value); t.innerHTML = "✓ Öğrendi. Aynı mesajı tekrar yaz."; };
    }
    chatCount++; $("#cmpCount").textContent = chatCount + " mesaj";
    if (chatCount >= 4 && !save.done[ST.id + "-" + IDX]) {
      markDone(ST, IDX);
      $("#learnNote").innerHTML = `<div class="fb fb--ok"><h3>${icon("check")}Görev tamamlandı: makine öğrenmesine hoş geldin</h3>
        <p>Kural botu sadece <b>senin yazdığın</b> kelimeleri tanıyor, bir harf eksik olsa yakalayamıyor. Öğrenen bota ise kimse kural yazmadı: <b>örneklere bakarak</b> benzer mesajları kendisi buluyor. Bilmediği bir şey olunca ona bir örnek daha göstermek yetiyor.</p>
        <p>Makine öğrenmesi tam olarak budur: <b>kuralları biz yazmıyoruz, makine örneklerden öğreniyor.</b> Sonraki adımlarda aynı fikirle el yazısı rakamları tanıyan bir model kuracağız.</p></div>`;
    }
  };
}

/* =========================== KOD YAPBOZU =========================== */
function showParsons(st, idx) {
  ST = st; IDX = idx; T = st.tasks[idx];
  const key = st.id + "-" + idx;
  const content = head(st, idx) + `<div class="stack">
      <article class="sheet">${kicker(st, idx)}<h2>${T.title}</h2><div class="prose" style="margin-top:8px"><p>${T.story}</p></div>
        <div class="goal">${icon("target")}<span>${T.goal}</span></div>${T.extra ? `<div class="rules"><span>${T.extra.length} şaşırtmaca parça var</span></div>` : ""}</article>
      <div id="pzHost"></div>
      <div class="pz-bar"><button class="btn btn--hue" id="runBtn">${icon("play")} Çalıştır</button><button class="btn" id="hintBtn">${icon("bulb")} İpucu</button><button class="btn btn--quiet" id="resetBtn">${icon("reset")} Baştan al</button></div>
      <div class="split"><div class="stack"><div id="feedback"></div><div class="stack" id="hints"></div></div>
        <section class="sheet"><div class="label"><span>Beklenen çıktı</span></div><div class="term">${T.expect.map((l, i) => `<div class="l"><i>${i + 1}</i><span>${esc(l)}</span></div>`).join("")}</div>
        <div class="label" style="margin-top:16px"><span>Programının çıktısı</span></div><div class="term" id="pzOut"><span class="note">Çalıştır'a basınca burada görünecek.</span></div></section></div></div>`;
  root().innerHTML = shell(content, st.phase);
  bindShell(); bindSteps(st);
  PZ = mountParsons($("#pzHost"), T, save.code[key], (state) => { save.code[key] = state; persist(); });
  ladder = hintLadder({ btn: $("#hintBtn"), list: $("#hints"), hints: T.hints, solution: T.solution });
  $("#resetBtn").onclick = () => { PZ.reset(); $("#feedback").innerHTML = ""; };
  $("#runBtn").onclick = () => {
    if (!pythonReady()) return;
    const res = Atolye.check(st, T, PZ.code()), out = res.out.slice(), fb = $("#feedback");
    while (out.length && !out[out.length - 1].trim()) out.pop();
    $("#pzOut").innerHTML = out.length ? out.map((l, i) => { const ok = l.replace(/\s+$/, "") === T.expect[i]; return `<div class="l ${ok ? "okl" : "badl"}"><i>${ok ? "✓" : "✗"}</i><span>${esc(l) || "&nbsp;"}</span></div>`; }).join("")
      : `<span class="note">${res.error ? "Program hata verdiği için hiçbir şey yazamadı." : "Program ekrana hiçbir şey yazmadı."}</span>`;
    if (res.error) { ladder.fail(); fb.innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}${res.error.line ? res.error.line + ". satırda hata" : "Hata"}</h3><p>${res.error.msg}</p></div>`; return; }
    if (!res.ok) { if (PZ.count) ladder.fail(); fb.innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}Henüz olmadı</h3><p>${res.msg}</p></div>`; return; }
    markDone(st, idx);
    fb.innerHTML = `<div class="fb fb--ok"><h3>${icon(T.bonus ? "star" : "check")}${T.bonus ? "Yıldızı kaptın" : "Yapboz tamam"}</h3><p>Satırların sırası ve girintisi doğru. Python'da bir satırın <b>nerede</b> durduğu, ne yazdığı kadar önemli.</p><div class="row">${nextLinks(st, idx)}</div></div>`;
  };
}

/* =========================== MODEL ATÖLYESİ =========================== */
const FRUIT = { elma: "#d7262e", portakal: "#f08c00", mandalina: "#c9a400" };
function screenModel(box, res) {
  cancelAnimationFrame(drawRAF);
  if (!MV) MV = { k: 3, p: T.three ? [102, 7] : [158, 6], raw: false, cache: null };
  MV.cache = null;
  const sess = res && res.sess && !res.error ? res.sess : null;
  const data = (sess && Atolye.modelRunner && sess.R.getVar(sess.mod, "meyveler")) || MEYVELER;
  const legend = Object.keys(FRUIT).filter((k) => k !== "mandalina" || T.three).map((k) => `<span><i style="background:${FRUIT[k]}"></i>${k}</span>`).join("");
  let h = `<section class="sheet"><div class="label"><span>Meyve grafiği</span><span>${sess ? "tıkla: yeni meyveyi taşı" : "önce Çalıştır"}</span></div>
    <div class="plot-wrap"><canvas id="mv" aria-label="Ağırlık ve renk grafiği"></canvas></div>
    <div class="plot-legend">${legend}<span>★ yeni meyve</span>${T.showTest ? "<span><i class=\"ring\"></i>test meyvesi</span>" : ""}</div>
    ${T.withK ? `<div class="kctl"><label for="kIn">K = <b id="kVal">${MV.k}</b></label><input type="range" id="kIn" min="1" max="9" step="2" value="${MV.k}"><span class="muted">kaç komşuya sorulsun?</span></div>` : ""}
    ${T.compareScale ? `<div class="toggle2"><button data-sc="0" class="${MV.raw ? "" : "on"}">Senin modelin (ölçekli)</button><button data-sc="1" class="${MV.raw ? "on" : ""}">Eski model (ölçeksiz)</button></div>` : ""}
    <div class="pred-out" id="predOut"></div></section>`;
  if (res && res.tests && res.tests.length) {
    h += `<section class="sheet"><div class="label"><span>Otomatik testler</span><span>${res.tests.filter((t) => t.pass).length} / ${res.tests.length}</span></div><div class="tbl"><table class="t"><thead><tr><th>çağrı</th><th>senin sonucun</th><th>beklenen</th><th></th></tr></thead><tbody>${res.tests.map((t) => `<tr><td>${esc(t.label)}</td><td>${esc(t.got)}</td><td>${esc(t.want)}</td><td class="${t.pass ? "pass" : "fail"}">${t.pass ? "✓" : "✗"}</td></tr>`).join("")}</tbody></table></div></section>`;
  }
  box.innerHTML = h;
  const cv = $("#mv"), ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
  const W = Math.max(280, cv.parentElement.clientWidth), H = Math.round(W * 0.62);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(document.documentElement), ink3 = css.getPropertyValue("--ink-3").trim() || "#667", rule = css.getPropertyValue("--rule").trim() || "#ddd", ink = css.getPropertyValue("--ink").trim() || "#111";
  const X0 = T.three ? 80 : 110, X1 = 210, Y0 = 0, Y1 = 11, L = 40, R = 10, TOP = 10, B = 34;
  const px = (x) => L + (x - X0) / (X1 - X0) * (W - L - R), py = (y) => TOP + (1 - (y - Y0) / (Y1 - Y0)) * (H - TOP - B);
  const GX = Math.round((W - L - R) / 10), GY = Math.round((H - TOP - B) / 10);
  const predictAt = (p) => {
    if (T.compareScale && MV.raw) return jsKnn(p, MV.k, data, false);
    if (!sess) return null;
    return Atolye.modelPredict(sess, "tahmin", T.withK ? [p, MV.k] : [p]);
  };
  function draw(cells) {
    ctx.clearRect(0, 0, W, H);
    if (cells) {
      /* bölgeleri önce ızgara çözünürlüğünde ayrı bir tuvale boya, sonra tek seferde büyüt: hücre aralarında çizgi kalmaz */
      const off = document.createElement("canvas"); off.width = GX; off.height = GY;
      const o = off.getContext("2d");
      cells.forEach((row, j) => row.forEach((c, i) => { if (c && FRUIT[c]) { o.fillStyle = FRUIT[c]; o.fillRect(i, j, 1, 1); } }));
      ctx.save(); ctx.globalAlpha = 0.2; ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, GX, cells.length, L, TOP, W - L - R, (H - TOP - B) * cells.length / GY);
      ctx.restore();
    }
    ctx.strokeStyle = rule; ctx.lineWidth = 1; ctx.fillStyle = ink3; ctx.font = "12px 'Source Sans 3', system-ui, sans-serif"; ctx.textAlign = "center";
    for (let x = Math.ceil(X0 / 20) * 20; x <= X1; x += 20) { ctx.beginPath(); ctx.moveTo(px(x), TOP); ctx.lineTo(px(x), H - B); ctx.stroke(); ctx.fillText(x + " g", px(x), H - B + 16); }
    ctx.textAlign = "right";
    for (let y = 0; y <= 10; y += 2) { ctx.beginPath(); ctx.moveTo(L, py(y)); ctx.lineTo(W - R, py(y)); ctx.stroke(); ctx.fillText(String(y), L - 6, py(y) + 4); }
    ctx.save(); ctx.translate(12, TOP + (H - TOP - B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText("renk (0 kırmızı · 10 turuncu)", 0, 0); ctx.restore();
    // uzaklık çizgileri
    let near = null;
    if (T.view === "lines" && sess) {
      const ds = data.map((m) => ({ m, d: Atolye.modelPredict(sess, "uzaklik", [MV.p, [m[0], m[1]]]) }));
      if (ds.every((x) => typeof x.d === "number")) {
        near = ds.reduce((a, b) => (b.d < a.d ? b : a));
        ds.forEach((x) => { ctx.strokeStyle = x === near ? ink : rule; ctx.lineWidth = x === near ? 2.5 : 1; ctx.beginPath(); ctx.moveTo(px(MV.p[0]), py(MV.p[1])); ctx.lineTo(px(x.m[0]), py(x.m[1])); ctx.stroke(); });
      }
    }
    data.forEach((m) => { ctx.beginPath(); ctx.arc(px(m[0]), py(m[1]), 6, 0, 7); ctx.fillStyle = FRUIT[m[2]] || ink3; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#fff"; ctx.stroke(); });
    if (T.showTest) TEST_MEYVELERI.forEach((m) => { ctx.beginPath(); ctx.arc(px(m[0]), py(m[1]), 6.5, 0, 7); ctx.lineWidth = 2.5; ctx.strokeStyle = FRUIT[m[2]]; ctx.stroke(); });
    star(px(MV.p[0]), py(MV.p[1]));
    const out = $("#predOut"); if (!out) return;
    if (T.view === "lines") {
      out.innerHTML = near ? `Yeni meyve: <b>${MV.p[0]} g, renk ${MV.p[1]}</b> · en yakın meyve: <b>${near.m[0]} g, renk ${near.m[1]}</b> (${near.m[2]}) · uzaklık <b>${+near.d.toFixed(2)}</b>` : `<span class="muted">${sess ? "uzaklik fonksiyonun bir sayı döndürünce çizgiler görünecek." : "Çalıştır'a basınca mesafeler burada görünecek."}</span>`;
    } else {
      const a = predictAt(MV.p);
      out.innerHTML = a ? `Yeni meyve: <b>${MV.p[0]} g, renk ${MV.p[1]}</b> → ${T.compareScale && MV.raw ? "eski model" : "senin modelin"}: <b style="color:${FRUIT[a] || "inherit"}">${esc(String(a))}</b>` : `<span class="muted">${sess ? "tahmin fonksiyonun henüz bir cevap döndürmüyor." : "Çalıştır'a basınca modelin karar bölgelerini boyayacak."}</span>`;
    }
  }
  function star(x, y) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 5 : 12, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
    ctx.closePath(); ctx.fillStyle = ink; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function paint() {
    cancelAnimationFrame(drawRAF);
    const key = MV.k + "|" + MV.raw;
    if (T.view !== "region" || (!sess && !(T.compareScale && MV.raw))) { draw(null); return; }
    if (MV.cache && MV.cache.key === key) { draw(MV.cache.cells); return; }
    const cells = []; let j = 0;
    (function step() {
      const t0 = performance.now();
      while (j < GY && performance.now() - t0 < 24) {
        const row = [];
        for (let i = 0; i < GX; i++) { const x = X0 + (i + 0.5) / GX * (X1 - X0), y = Y1 - (j + 0.5) / GY * (Y1 - Y0); row.push(predictAt([+x.toFixed(2), +y.toFixed(2)])); }
        cells.push(row); j++;
      }
      draw(cells);
      if (j < GY) drawRAF = requestAnimationFrame(step); else MV.cache = { key, cells };
    })();
  }
  cv.onclick = (e) => {
    const r = cv.getBoundingClientRect(), x = X0 + (e.clientX - r.left - L) / (W - L - R) * (X1 - X0), y = Y0 + (1 - (e.clientY - r.top - TOP) / (H - TOP - B)) * (Y1 - Y0);
    MV.p = [Math.round(Math.min(X1, Math.max(X0, x))), Math.round(Math.min(10, Math.max(0, y)))];
    draw(MV.cache ? MV.cache.cells : null);
  };
  if ($("#kIn")) $("#kIn").oninput = (e) => { MV.k = +e.target.value; $("#kVal").textContent = MV.k; paint(); };
  $$("[data-sc]").forEach((b) => { b.onclick = () => { MV.raw = b.dataset.sc === "1"; $$("[data-sc]").forEach((x) => x.classList.toggle("on", x === b)); paint(); }; });
  paint();
}

/* =========================== TAHMİN KARTLARI =========================== */
function showQuiz(st, r) {
  ST = st;
  const round = st.rounds[r];
  let state = { i: 0, results: [] };
  function render() {
    if (state.i >= round.cards.length) return summary();
    const c = round.cards[state.i];
    const dots = round.cards.map((_, k) => { const x = state.results[k]; return `<i class="${x === true ? "r" : x === false ? "w" : k === state.i ? "c" : ""}"></i>`; }).join("");
    root().innerHTML = shell(head(st, r) + `<div class="qgrid"><div class="stack">
        <div class="label"><span>${round.title} · kart ${state.i + 1} / ${round.cards.length}</span><span class="dots">${dots}</span></div>
        <pre class="qcode">${esc(c.code)}</pre><div id="reveal" class="stack"></div></div>
      <div class="stack"><div class="label"><span>Bu kod ekrana ne yazar?</span></div>
        <div class="opts">${c.options.map((o, k) => `<button class="opt" data-o="${k}">${esc(o)}</button>`).join("")}</div><div id="afterOpts" class="stack"></div></div></div>`, st.phase);
    bindShell(); bindSteps(st);
    $$(".opt").forEach((b) => { b.onclick = () => answer(+b.dataset.o); });
  }
  function answer(k) {
    const c = round.cards[state.i], ok = k === c.answer;
    state.results[state.i] = ok;
    $$(".opt").forEach((b, j) => { b.disabled = true; if (j === c.answer) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
    const res = Atolye.runSnippet(c.code), outTxt = res.error ? res.error.raw || res.error.msg : res.out.join("\n");
    $("#reveal").innerHTML = `<div class="label"><span>Python'un gerçek çıktısı</span></div><div class="term">${esc(outTxt)}</div>
      <div class="fb ${ok ? "fb--ok" : "fb--bad"}"><h3>${ok ? icon("check") + "Doğru" : icon("x") + "Bu sefer olmadı"}</h3><p>${c.why}</p></div>`;
    $("#afterOpts").innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn--hue" id="nextCard">${state.i + 1 < round.cards.length ? "Sonraki kart" : "Sonucu gör"} ${icon("right")}</button><button class="btn btn--quiet" id="playBtn">${icon("code")} Kodla oyna</button></div><div id="sandbox"></div>`;
    $("#nextCard").onclick = () => { state.i++; render(); };
    $("#playBtn").onclick = () => sandbox(c.code);
    $("#nextCard").focus();
  }
  function sandbox(code) {
    $("#sandbox").innerHTML = `<div class="sandbox stack"><div class="label"><span>Kodu değiştir, tekrar çalıştır</span></div><textarea id="sbCode" spellcheck="false" aria-label="Kod">${esc(code)}</textarea><div><button class="btn btn--hue btn--sm" id="sbRun">${icon("play")} Çalıştır</button></div><div class="term" id="sbOut"><span class="note">Çıktı burada görünecek.</span></div></div>`;
    const ta = $("#sbCode");
    ta.addEventListener("keydown", (e) => { if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); } });
    $("#sbRun").onclick = () => {
      const r2 = Atolye.runSnippet(ta.value), o = $("#sbOut");
      if (r2.error) o.innerHTML = `<span style="color:#ffb3ab">${esc(r2.error.raw || "")}</span>\n<span class="note">${r2.error.msg}</span>`;
      else o.textContent = r2.out.join("\n") || "(çıktı yok)";
    };
    ta.focus();
  }
  function summary() {
    const right = state.results.filter(Boolean).length, n = round.cards.length;
    save.quiz[st.id + "-" + r] = Math.max(save.quiz[st.id + "-" + r] || 0, right);
    root().innerHTML = shell(head(st, r) + `<section class="sheet summary"><span class="label">${round.title}</span><span class="big">${right} / ${n}</span>
      <p>${right === n ? "Hepsini bildin. Python'un aklını okuyorsun." : right >= n - 2 ? "Çok iyi. Yanlış yaptığın kartları bir daha dene." : "Python bazen şaşırtır. Kartlardaki açıklamaları okuyup turu bir daha oyna."}</p>
      <div class="row"><button class="btn" id="again">Turu tekrar oyna</button>${r + 1 < st.rounds.length ? `<a class="btn btn--hue" href="#${st.id}-${r + 2}">Sonraki tur ${icon("right")}</a>` : `<a class="btn btn--hue" href="#asama-3">Diğer istasyonlar ${icon("right")}</a>`}</div></section>`, st.phase);
    bindShell();
    markDone(st, r); bindSteps(st);
    $("#again").onclick = () => { state = { i: 0, results: [] }; render(); };
  }
  render();
}

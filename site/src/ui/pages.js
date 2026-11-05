/* Giriş sayfası, aşama sayfaları ve başlangıç dersleri. */
import { LESSONS, NOTEBOOKS, colabUrl, defterUrl } from "../data/lessons.js";
import { STATIONS } from "../data/stations.js";
import { Atolye } from "../engine/atolye.js";
import { $, $$, esc, icon, save, persist, hooks, PHASES, phaseDone, totals, lessonOpen, doneCount, reqCount, bonusDone, isBonus, PHASE_STATIONS, testDone, hueVars, setHue, art, imageUrl, shell, setupEditor, getCode, setCode, markErr, clearErr, errorHtml, pythonReady, confetti } from "./core.js";
import { hintLadder, mountParsons } from "./widgets.js";
import { openTracer, mountTracer } from "./tracer.js";
import { mountScene, SCENES } from "./scenes.js";
import { testCard } from "./assess.js";
import { cloud } from "../cloud/index.js";

const root = () => $("#root");

/* ---------- notebook kartı ---------- */
export function nbCard(id) {
  const nb = NOTEBOOKS[id], done = !!save.done["nb-" + id], t = !!save.teacher;
  let act;
  if (done) act = `<span class="nb-done">${icon("check")} Tamamlandı</span>${t ? `<button class="btn btn--quiet btn--sm" data-nbundo="${id}">İşareti kaldır</button>` : ""}`;
  else act = `<form class="nb-code" data-nbform="${id}"><label for="kod-${id}">Tamamlama kodu</label>
      <input id="kod-${id}" maxlength="6" autocomplete="off" spellcheck="false" placeholder="6 karakter" aria-describedby="kodnot-${id}">
      <button class="btn">Onayla</button>${t ? `<button class="btn btn--quiet btn--sm" type="button" data-nbforce="${id}">Kodsuz işaretle</button>` : ""}</form>
      <p class="nb-tip" id="kodnot-${id}">Kodu, defterin <b>en sonundaki</b> hücreyi çalıştırınca alırsın. O hücre, önemli bölümleri çalıştırıp çalıştırmadığını kontrol eder.</p><div class="nb-msg" id="kodmsg-${id}" role="alert"></div>`;
  return `<article class="nb${done ? " done" : ""}"><span class="nb-mark">${icon("notebook")}</span><div>
    <h3>${nb.title}</h3><span class="file">${nb.file}</span><p>${nb.desc}</p>
    <div class="nb-actions"><a class="btn btn--primary" href="${defterUrl(nb.file)}" target="_blank" rel="noopener">Defteri aç ${icon("ext")}</a>
      <a class="btn btn--quiet" href="${colabUrl(nb.file)}" target="_blank" rel="noopener">Colab'da aç ${icon("ext")}</a>
      ${t ? `<a class="btn" href="${colabUrl(nb.file, true)}" target="_blank" rel="noopener">Çözümlü sürüm (Colab) ${icon("ext")}</a>` : ""}</div>
    <p class="nb-tip">Defter tarayıcıda açılır, <b>hesap gerekmez</b>. İlk açılış biraz sürebilir. Sayfayı yenilersen ya da kapatırsan çalışman silinir; defteri bitirene kadar sekmeyi açık tut. Google hesabın varsa <b>Colab'da</b> açıp Drive'ına kopyalayabilirsin.${t ? " <b>Çözümlü sürüm</b> sadece öğretmen hesabında görünür." : ""}</p>
    <div class="nb-finish">${act}</div></div></article>`;
}
/* SHA-256: tarayıcının kendi aracı (https'te), yoksa küçük yedek uygulama */
function sha256js(ascii) {
  const r = (v, a) => (v >>> a) | (v << (32 - a)), K = [], H = [];
  let p = 2;
  for (let c = 0; c < 64; p++) { let ok = true; for (let d = 2; d * d <= p; d++) if (p % d === 0) { ok = false; break; } if (ok) { if (c < 8) H[c] = (Math.pow(p, 1 / 2) * 2 ** 32) | 0; K[c++] = (Math.pow(p, 1 / 3) * 2 ** 32) | 0; } }
  const bytes = Array.from(new TextEncoder().encode(ascii)), bits = bytes.length * 8;
  bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bits >>> (i * 8)) & 255);
  for (let j = 0; j < bytes.length; j += 64) {
    const w = [];
    for (let i = 0; i < 64; i++) {
      if (i < 16) w[i] = (bytes[j + i * 4] << 24) | (bytes[j + i * 4 + 1] << 16) | (bytes[j + i * 4 + 2] << 8) | bytes[j + i * 4 + 3];
      else { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + w[i - 7] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) | 0; }
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
async function sha256(txt) {
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch (_) { return sha256js(txt); }
}
function bindNb(rerender) {
  const mark = (id, v) => { save.done["nb-" + id] = v; persist(); rerender(); };
  $$("[data-nbundo]").forEach((b) => { b.onclick = () => mark(b.dataset.nbundo, false); });
  $$("[data-nbforce]").forEach((b) => { b.onclick = () => mark(b.dataset.nbforce, true); });
  $$("[data-nbform]").forEach((f) => {
    const id = f.dataset.nbform, inp = $("input", f), msg = $("#kodmsg-" + id);
    inp.oninput = () => { inp.value = inp.value.toUpperCase().replace(/[^0-9A-F]/g, ""); msg.innerHTML = ""; };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const kod = inp.value.trim();
      if (kod.length !== 6) { msg.innerHTML = `<p class="bad">Kod 6 karakter olmalı.</p>`; return; }
      let ok = false;
      try { ok = (await sha256(kod)) === NOTEBOOKS[id].kodOzet; } catch (_) { ok = false; }
      if (ok) { confetti(); mark(id, true); }
      else msg.innerHTML = `<p class="bad">Bu kod bu deftere ait değil. Defterin en sonundaki hücreyi çalıştırıp çıkan kodu aynen yaz.</p>`;
    };
  });
}

/* =========================== GİRİŞ SAYFASI =========================== */
export function showLanding() {
  setHue("brand");
  const t = totals();
  let resume = 0;
  for (let i = 0; i < PHASES.length; i++) { resume = i; if (!phaseDone(i)) break; }
  const started = t.done > 0;
  root().innerHTML = `<div class="landing">
    <div class="landing-top"><div class="container"><span></span>${save.teacher ? '<span class="teacher-badge" title="Öğretmen modu açık">Öğretmen</span>' : ""}</div></div>
    <section class="landing-hero"><div class="container">
      <div class="landing-intro">
        <img class="landing-logo" id="landingLogo" src="${imageUrl("logo")}" alt="Sivas Robotik Akademi" width="176" height="176">
        <p class="eyebrow">Sivas Robotik Akademi · Ortaokul</p>
        <h1>Python <em>Atölyesi</em></h1>
        <p class="lead">Python'u temelden öğren, gerçek Python defterleriyle çalış ve kursun sonunda kendi makine öğrenmesi modellerini kur.</p>
        <div class="meta" style="margin-top:16px"><span>${icon("cap")} ${LESSONS.length} başlangıç dersi</span><span>${icon("notebook")} ${Object.keys(NOTEBOOKS).length} Python defteri</span><span>${icon("layers")} ${STATIONS.length} uygulama istasyonu</span><span>${icon("clipboard")} ön test ve son test</span></div>
        <div class="landing-cta">${landingCta(started, resume, t)}</div>
      </div>
      ${art("hero", "brand", "cpu", "Robotik atölyesinde Python çalışan öğrenciler")}
    </div></section>
    <section class="course-outline"><div class="container">
      <h2>Kurs nasıl ilerliyor?</h2>
      <ol class="outline">${PHASES.map((p, i) => `<li class="${phaseDone(i) ? "done" : ""}"><span class="k">${i + 1}. adım${phaseDone(i) ? " · tamamlandı" : ""}</span><b>${p.title}</b><p>${p.outline}</p></li>`).join("")}</ol>
    </div></section>
  </div>`;
  if ($("#startBtn")) $("#startBtn").onclick = () => { location.hash = "asama-" + (resume + 1); };
  if (cloud.mode === "yerel") teacherHold($("#landingLogo"));
  window.scrollTo(0, 0);
}

function landingCta(started, resume, t) {
  const cont = `<button class="btn btn--primary btn--lg" id="startBtn">${started ? "Kaldığın yerden devam et" : "Kursa başla"} ${icon("right")}</button>
    ${started ? `<span class="muted" style="font-size:14.5px">${t.done} / ${t.total} adım tamamlandı · sıradaki: ${PHASES[resume].short}</span>` : ""}`;
  if (cloud.mode === "yerel") return cont;
  if (cloud.me.rol === "ogretmen") return `<a class="btn btn--primary btn--lg" href="#ogretmen">Öğretmen paneli ${icon("right")}</a><a class="btn btn--lg" href="#asama-1">Kursu gez</a>`;
  if (cloud.me.rol === "ogrenci") return `<span class="hello">Merhaba <b>${esc(cloud.me.takma_ad)}</b> · ${esc(cloud.me.sinif)}</span>` + cont;
  return `<a class="btn btn--primary btn--lg" href="#giris">Giriş yap ${icon("right")}</a><span class="muted" style="font-size:14.5px">Sınıf kodun ve PIN'in öğretmeninde.</span>`;
}

/* öğretmen modu: logoya 2 sn basılı tut (sadece hesapsız modda) */
export function teacherHold(el) {
  if (!el) return;
  let t = null;
  el.addEventListener("pointerdown", () => { t = setTimeout(() => { toggleTeacher(); }, 2000); });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => clearTimeout(t)));
}
export function toggleTeacher() { if (cloud.mode !== "yerel") return; save.teacher = !save.teacher; persist(); window.dispatchEvent(new HashChangeEvent("hashchange")); }

/* =========================== AŞAMA SAYFALARI =========================== */
export function showPhase(n) {
  const p = PHASES[n];
  setHue(p.hue);
  let body = "", meta = "";
  if (n === 0) {
    const ld = LESSONS.filter((_, i) => save.done["ders-" + i]).length;
    meta = `<span>${icon("book")} ${LESSONS.length} ders</span><span>${icon("check")} ${ld} tamamlandı</span><span>${icon("clock")} ders başına ~20 dk</span>`;
    body = testCard("on") + `<ol class="lesson-list">${LESSONS.map((L, i) => {
      const d = !!save.done["ders-" + i], open = lessonOpen(i), nb = L.steps.filter((x) => x.bonus).length;
      const bd = L.steps.filter((x, k) => x.bonus && save.done["ders-" + i + "-b" + k]).length;
      return `<li class="lesson-row${d ? " done" : ""}${open ? "" : " locked"}"><span class="num">${d ? icon("check") : i + 1}</span>
        <div><h3>${L.title}</h3><p>${L.blurb}${nb ? ` <span class="stars" title="Yıldızlı görevler">${icon("star")} ${bd} / ${nb}</span>` : ""}</p></div>
        ${open ? `<button class="btn${!d && (i === 0 || save.done["ders-" + (i - 1)]) ? " btn--primary" : ""}" data-ders="${i + 1}">${d ? "Tekrar aç" : "Başla"} ${icon("right")}</button>` : `<span class="status">${icon("lock")} ${i === 0 ? "Önce ön testi çöz" : "Önceki dersi bitir"}</span>`}</li>`;
    }).join("")}</ol>`;
  } else if (n === 1) {
    meta = `<span>${icon("notebook")} 1 defter</span><span>${icon("clock")} 4–5 ders saati</span>`;
    body = `<div class="nb-list" style="max-width:760px">${nbCard("nb00")}</div>`;
  } else if (n === 2) {
    const list = PHASE_STATIONS(2), sd = list.reduce((a, s) => a + doneCount(s), 0), st = list.reduce((a, s) => a + reqCount(s), 0);
    meta = `<span>${icon("layers")} ${list.length} istasyon</span><span>${icon("check")} ${sd} / ${st} görev</span><span>${icon("star")} her istasyonda yıldızlı görev</span>`;
    body = (save.done["nb-nb00"] || save.teacher ? "" : `<div class="notice">${icon("bulb")}<span>Önce Notebook 00'ı bitirmen önerilir. İstasyonlar o defterdeki konuları kullanıyor.</span></div>`) +
      `<div class="station-grid">${list.map(stationCard).join("")}</div>`;
  } else if (n === 3) {
    meta = `<span>${icon("notebook")} 1 defter</span><span>${icon("apple")} Model Atölyesi</span><span>${icon("clock")} 4–5 ders saati</span>`;
    body = `<div class="nb-list" style="max-width:760px">${nbCard("nb01")}</div>
      <div class="sub-head"><h2>Defterden sonra: kendi modelini sıfırdan yaz</h2><p class="muted">Defterde <code>KNeighborsClassifier</code> ile tek satırda kurduğun modeli, burada kendi Python kodunla adım adım kuracaksın.</p></div>
      <div class="station-grid station-grid--one">${PHASE_STATIONS(3).map(stationCard).join("")}</div>`;
  } else {
    meta = `<span>${icon("flask")} 3 laboratuvar</span><span>${icon("clock")} her biri ~2 ders saati</span>`;
    body = `<div class="nb-list cols">${nbCard("lab1")}${nbCard("lab2")}${nbCard("lab3")}</div>`;
  }
  body += `<div class="test-row">${testCard("kontrol-" + (n + 1))}${n === 4 ? testCard("son") : ""}</div>`;
  const prev = n > 0 ? PHASES[n - 1] : null, next = n < PHASES.length - 1 ? PHASES[n + 1] : null;
  const content = `<section class="phase-hero"><div><span class="eyebrow">${n + 1}. adım / ${PHASES.length}</span><h1>${p.title}</h1><p class="lead">${p.lead}</p><div class="meta">${meta}</div></div>${art(p.slot, p.hue, p.icon)}</section>
    ${body}
    <nav class="pager">${prev ? `<a class="btn btn--quiet" href="#asama-${n}">${icon("left")}<span><small>Önceki adım</small>${prev.short}</span></a>` : `<a class="btn btn--quiet" href="#ana">${icon("left")}<span><small>Geri</small>Giriş</span></a>`}
    ${next ? `<a class="btn btn--hue" style="${hueVars(next.hue)}" href="#asama-${n + 2}"><span><small>Sonraki adım</small>${next.short}</span>${icon("right")}</a>` : `<span class="muted">Kursun son adımı</span>`}</nav>`;
  root().innerHTML = shell(content, n);
  bindShell();
  $$("[data-ders]").forEach((b) => { b.onclick = () => { location.hash = "ders-" + b.dataset.ders; }; });
  $$("[data-st]").forEach((b) => { b.onclick = () => { location.hash = b.dataset.st; }; });
  bindNb(() => showPhase(n));
  window.scrollTo(0, 0);
}
export function bindShell() {
  const b = $("#brand");
  if (b) { b.onclick = () => { location.hash = "ana"; }; if (cloud.mode === "yerel") teacherHold(b); }
  if (hooks.afterShell) hooks.afterShell();
}

export function stationCard(s) {
  const d = doneCount(s), c = reqCount(s), nb = (s.tasks || []).filter((t) => t.bonus).length;
  return `<button class="station-card" style="${hueVars(s.id)}" data-st="${s.id}">${art("st-" + s.id, s.id)}
    <div class="body"><span class="k">${s.no ? "İstasyon " + s.no : "Uygulama"}</span><h3>${s.name}</h3><p>${s.blurb}</p>
    <p class="topics"><b>Konular:</b> ${s.concepts.join(", ")}</p>
    <div class="foot"><div class="bar"><i style="width:${Math.round(100 * d / c)}%"></i></div><b>${d} / ${c}</b>${nb ? `<span class="stars" title="Yıldızlı görevler">${icon("star")} ${bonusDone(s)} / ${nb}</span>` : ""}</div></div></button>`;
}

/* =========================== BAŞLANGIÇ DERSLERİ =========================== */
let LS = { li: -1, si: 0, ok: {} };
export function showLesson(li) {
  if (!lessonOpen(li)) { location.hash = "asama-1"; return; }
  setHue("brand");
  LS = { li, si: 0, ok: {} };
  renderStep();
}
const reqSteps = (L) => L.steps.filter((s) => !s.bonus).length;
const lessonDone = () => !!save.done["ders-" + LS.li];
const PASSIVE = { read: 1, trace: 1, scene: 1 };
const stepDone = (i) => { if (i < 0) return true; const st = LESSONS[LS.li].steps[i]; return !!PASSIVE[st.type] || LS.ok[i] || save.teacher || lessonDone(); };
const stepOpen = (i) => { const st = LESSONS[LS.li].steps[i]; if (st.bonus) return lessonDone() || save.teacher; return i <= LS.si || stepDone(i - 1); };

function renderStep() {
  const L = LESSONS[LS.li], step = L.steps[LS.si], req = reqSteps(L);
  const finishReq = LS.si === req - 1, lastAll = LS.si === L.steps.length - 1;
  const seg = L.steps.map((s, i) => `<button class="seg${s.bonus ? " seg--bonus" : ""}${i < LS.si || LS.ok[i] || (s.bonus && save.done["ders-" + LS.li + "-b" + i]) ? " ok" : ""}${i === LS.si ? " cur" : ""}" data-seg="${i}" aria-label="${s.bonus ? "Yıldızlı görev" : "Adım " + (i + 1)}"${stepOpen(i) ? "" : " disabled"}>${s.bonus ? icon("star") : ""}</button>`).join("");
  let h = `<header class="work-head"><nav class="crumbs"><a href="#asama-1">Başlangıç dersleri</a>${icon("chev")}<span>Ders ${LS.li + 1}</span></nav>
    <h1>${L.title}</h1><div class="segbar">${seg}</div></header>`;
  const kicker = (t) => step.bonus ? `<span class="k k--bonus">${icon("star")} Yıldızlı görev · isteğe bağlı</span>` : `<span class="k">${t}</span>`;
  if (step.type === "read") {
    h += `<article class="sheet"><div class="prose"><h2>${step.title}</h2>${step.html}</div>${step.colab ? `<div style="margin-top:16px">${nbCard(step.colab)}</div>` : ""}</article>`;
  } else if (step.type === "quiz") {
    h += `<article class="sheet">${kicker(icon("target") + " Soru")}<div class="prose"><h2>${step.q}</h2>${step.code ? `<pre class="code-show">${esc(step.code)}</pre>` : ""}</div>
      <div class="opts" style="margin-top:16px">${step.options.map((o, k) => `<button class="opt" data-o="${k}">${esc(o)}</button>`).join("")}</div><div id="qfb" style="margin-top:16px"></div></article>`;
  } else if (step.type === "sort") {
    h += `<article class="sheet">${kicker(icon("target") + " Alıştırma")}<div class="prose"><h2>${step.title}</h2>${step.html}</div>
      <div class="sort-list" style="margin-top:16px">${step.items.map((it, k) => `<div class="sort-row" data-row="${k}"><code>${esc(it[0])}</code><span class="sort-btns">${step.cats.map((c, ci) => `<button class="btn btn--sm" data-c="${ci}">${c}</button>`).join("")}</span></div>`).join("")}</div>
      <div id="qfb" style="margin-top:16px"></div></article>`;
  } else if (step.type === "trace") {
    h += `<article class="sheet">${kicker(icon("eye") + " Adım adım izle")}<div class="prose"><h2>${step.title}</h2>${step.html || ""}</div><div id="trHost" style="margin-top:16px"></div></article>`;
  } else if (step.type === "scene") {
    h += `<article class="sheet">${kicker(icon("play") + " Canlı anlatım")}<div class="prose"><h2>${step.title}</h2>${step.html || ""}</div><div id="scHost" style="margin-top:16px"></div></article>`;
  } else if (step.type === "predict") {
    const n = step.code.split("\n").filter((l) => /print\(/.test(l)).length;
    h += `<div class="split"><article class="sheet">${kicker(icon("eye") + " Önce tahmin et")}<div class="prose"><h2>${step.title}</h2>${step.html}</div><pre class="code-show">${esc(step.code)}</pre></article>
      <section class="sheet"><div class="label"><span>Tahminin</span><span>her satıra bir çıktı satırı</span></div>
        <textarea id="pGuess" class="guess" rows="${Math.max(3, n + 1)}" spellcheck="false" placeholder="Ekranda ne görünecek? Çalıştırmadan önce yaz."></textarea>
        <div class="row" style="margin-top:12px"><button class="btn btn--primary" id="pCheck">${icon("play")} Tahminimi kontrol et</button></div><div id="pRes"></div></section></div>`;
  } else if (step.type === "parsons") {
    h += `<article class="sheet">${kicker(icon("puzzle") + " Kod yapbozu")}<div class="prose"><h2>${step.title}</h2>${step.html}</div></article>
      <div id="pzHost"></div>
      <div class="pz-bar"><button class="btn btn--primary" id="lRun">${icon("play")} Çalıştır</button><button class="btn" id="lTrace">${icon("eye")} Adım adım</button><button class="btn" id="lHint">${icon("bulb")} İpucu</button><button class="btn btn--quiet" id="lReset">${icon("reset")} Baştan al</button></div>
      <div class="split"><div class="stack"><div id="lHints" class="stack"></div><div id="qfb"></div></div><section class="sheet"><div class="label"><span>Çıktı</span></div><div class="term" id="lOut"><span class="note">Çalıştır'a basınca programın çıktısı burada görünecek.</span></div></section></div>`;
  } else {
    h += `<div class="split"><div class="stack"><article class="sheet">${kicker(icon("code") + " Alıştırma")}<div class="prose"><h2>${step.title}</h2>${step.html}</div></article>
      <div class="editor-wrap"><div class="editor"><div class="editor-top"><span class="file">alistirma.py</span><span>Ctrl + Enter ile çalıştır</span></div><div id="cmHost"></div></div>
      <div class="editor-bar"><button class="btn btn--primary" id="lRun">${icon("play")} Çalıştır</button><button class="btn" id="lTrace" title="Kodunu satır satır izle">${icon("eye")} Adım adım</button><button class="btn" id="lHint">${icon("bulb")} İpucu</button><button class="btn btn--quiet" id="lReset">${icon("reset")} Baştan al</button>${save.teacher ? `<button class="btn btn--quiet" id="lSol">${icon("eye")} Çözüm</button>` : ""}</div></div>
      <div id="lHints" class="stack"></div></div>
      <div class="stack"><section class="sheet"><div class="label"><span>Çıktı</span></div><div class="term" id="lOut"><span class="note">Çalıştır'a basınca programının çıktısı burada görünecek.</span></div></section><div id="qfb"></div></div></div>`;
  }
  let nextLbl;
  if (step.bonus) nextLbl = lastAll ? "Bitir " + icon("check") : "Sonraki yıldızlı görev " + icon("right");
  else nextLbl = finishReq ? "Dersi bitir " + icon("check") : "İleri " + icon("right");
  const nextOk = step.bonus ? true : stepDone(LS.si);
  h += `<nav class="lnav"><button class="btn btn--quiet" id="lPrev"${LS.si === 0 ? " disabled" : ""}>${icon("left")} Geri</button><span class="lnav-info">${step.bonus ? "Yıldızlı görev" : `Adım ${LS.si + 1} / ${req}`}</span>
    <button class="btn btn--primary" id="lNext"${nextOk ? "" : " disabled"}>${nextLbl}</button></nav>`;
  root().innerHTML = shell(h, 0);
  bindShell();
  $$("[data-seg]").forEach((b) => { b.onclick = () => { LS.si = +b.dataset.seg; renderStep(); }; });
  $("#lPrev").onclick = () => { LS.si--; renderStep(); window.scrollTo(0, 0); };
  $("#lNext").onclick = () => {
    if (step.bonus) { if (lastAll) lessonEnd(); else { LS.si++; renderStep(); window.scrollTo(0, 0); } return; }
    if (!finishReq) { LS.si++; renderStep(); window.scrollTo(0, 0); return; }
    const first = !lessonDone();
    save.done["ders-" + LS.li] = true; persist(); if (first) confetti();
    lessonEnd();
  };
  bindNb(renderStep);
  if (step.type === "quiz") bindQuiz(step);
  if (step.type === "sort") bindSort(step);
  if (step.type === "code") bindCode(step);
  if (step.type === "predict") bindPredict(step);
  if (step.type === "parsons") bindParsons(step);
  if (step.type === "trace") mountTracer($("#trHost"), { code: step.code });
  if (step.type === "scene") mountScene($("#scHost"), step.scene);
}
function unlockNext() {
  LS.ok[LS.si] = true;
  const st = LESSONS[LS.li].steps[LS.si];
  if (st.bonus) { save.done["ders-" + LS.li + "-b" + LS.si] = true; persist(); }
  const n = $("#lNext"); if (n) n.disabled = false;
  const s = $(`[data-seg="${LS.si}"]`); if (s) s.classList.add("ok");
  const s2 = $(`[data-seg="${LS.si + 1}"]`); if (s2 && !LESSONS[LS.li].steps[LS.si + 1].bonus) s2.disabled = false;
}
function bindQuiz(step) {
  $$(".opt").forEach((b) => {
    b.onclick = () => {
      const k = +b.dataset.o, ok = k === step.answer;
      if (ok) { $$(".opt").forEach((x) => { x.disabled = true; }); b.classList.add("right"); unlockNext(); }
      else { b.classList.add("wrong"); b.disabled = true; }
      $("#qfb").innerHTML = `<div class="fb ${ok ? "fb--ok" : "fb--bad"}"><h3>${ok ? icon("check") + "Doğru" : icon("x") + "Tekrar dene"}</h3><p>${ok ? step.why : "Bu değil. Bir daha düşün ve başka bir seçenek dene."}</p></div>`;
    };
  });
}
function bindSort(step) {
  const right = {};
  $$(".sort-row").forEach((row) => {
    const k = +row.dataset.row;
    $$("[data-c]", row).forEach((b) => {
      b.onclick = () => {
        const ok = +b.dataset.c === step.items[k][1];
        $$("[data-c]", row).forEach((x) => x.classList.remove("pick-ok", "pick-bad"));
        b.classList.add(ok ? "pick-ok" : "pick-bad");
        right[k] = ok; row.classList.toggle("ok", ok);
        const n = step.items.filter((_, i) => right[i]).length;
        if (n === step.items.length) { $("#qfb").innerHTML = `<div class="fb fb--ok"><h3>${icon("check")}Hepsi doğru</h3><p>${step.why}</p></div>`; unlockNext(); }
        else $("#qfb").innerHTML = `<p class="muted" style="font-size:14.5px">${n} / ${step.items.length} doğru</p>`;
      };
    });
  });
}
function okMsg() {
  const st = LESSONS[LS.li].steps[LS.si];
  if (st.bonus) return "Yıldızı kaptın!";
  return LS.si === reqSteps(LESSONS[LS.li]) - 1 ? "Dersi bitirebilirsin." : "Bir sonraki adıma geçebilirsin.";
}
function bindCode(step) {
  const key = "ders-" + LS.li + "-" + LS.si;
  const ladder = hintLadder({ btn: $("#lHint"), list: $("#lHints"), hints: step.hints, solution: step.solution });
  const run = () => {
    if (!pythonReady()) { $("#qfb").innerHTML = `<div class="fb fb--bad"><h3>Python yüklenemedi</h3><p>Sayfayı yenileyip tekrar dene.</p></div>`; return; }
    clearErr();
    const code = getCode(), r = Atolye.checkLesson(step, code), out = $("#lOut");
    out.innerHTML = r.out.length ? esc(r.out.join("\n")) : `<span class="note">${r.error ? "Program hata verdiği için bir şey yazamadı." : "(çıktı yok)"}</span>`;
    if (r.error) { ladder.fail(); markErr(r.error.line); $("#qfb").innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}${r.error.line ? r.error.line + ". satırda hata" : "Hata"}</h3>${errorHtml(r.error, code, null)}</div>`; return; }
    if (!r.ok) { ladder.fail(); $("#qfb").innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}Henüz olmadı</h3>${r.probs.map((p) => `<p>${p}</p>`).join("")}</div>`; return; }
    $("#qfb").innerHTML = `<div class="fb fb--ok"><h3>${icon(step.bonus ? "star" : "check")}Çalıştı</h3><p>${okMsg()}</p></div>`;
    unlockNext();
  };
  setupEditor($("#cmHost"), save.code[key] != null ? save.code[key] : step.starter, () => { save.code[key] = getCode(); persist(); }, run);
  $("#lRun").onclick = run;
  $("#lTrace").onclick = () => openTracer({ code: getCode(), title: step.title });
  $("#lReset").onclick = () => setCode(step.starter);
  if ($("#lSol")) $("#lSol").onclick = () => setCode(step.solution);
}
const norm = (l) => l.replace(/\s+/g, " ").trim();
function bindPredict(step) {
  const key = "ders-" + LS.li + "-" + LS.si, ta = $("#pGuess");
  if (save.code[key] != null) ta.value = save.code[key];
  ta.oninput = () => { save.code[key] = ta.value; persist(); };
  $("#pCheck").onclick = () => {
    const guess = ta.value.replace(/\s+$/, "").split("\n");
    if (!ta.value.trim()) { $("#pRes").innerHTML = `<p class="muted" style="margin-top:12px">Önce tahminini yaz. Yanlış olması sorun değil, önemli olan önce düşünmek.</p>`; ta.focus(); return; }
    const r = Atolye.runSnippet(step.code), real = r.out.slice(); while (real.length && !real[real.length - 1].trim()) real.pop();
    const n = Math.max(real.length, guess.length); let hit = 0;
    const rows = Array.from({ length: n }, (_, i) => { const g = guess[i] == null ? "" : guess[i], t = real[i] == null ? "" : real[i], ok = norm(g) === norm(t) && t !== ""; if (ok) hit++; return `<tr class="${ok ? "okr" : "badr"}"><td>${i + 1}</td><td>${esc(g) || '<span class="muted">—</span>'}</td><td>${esc(t) || '<span class="muted">—</span>'}</td><td>${ok ? "✓" : "✗"}</td></tr>`; }).join("");
    const all = hit === real.length && guess.filter((g) => g.trim()).length === real.length;
    $("#pRes").innerHTML = `<div class="tbl" style="margin-top:16px"><table class="t t--guess"><thead><tr><th></th><th>Tahminin</th><th>Python'un çıktısı</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="fb ${all ? "fb--ok" : "fb--info"}" style="margin-top:12px"><h3>${all ? icon("check") + "Tam isabet" : `${hit} / ${real.length} satırı bildin`}</h3><p>${step.why}</p><div class="row"><button class="btn btn--sm" id="pTrace">${icon("eye")} Nasıl çıktığını adım adım izle</button></div></div>`;
    $("#pTrace").onclick = () => openTracer({ code: step.code, title: step.title });
    ta.readOnly = true; $("#pCheck").disabled = true;
    unlockNext();
  };
}
function bindParsons(step) {
  const key = "ders-" + LS.li + "-" + LS.si;
  const ladder = hintLadder({ btn: $("#lHint"), list: $("#lHints"), hints: step.hints, solution: null });
  const pz = mountParsons($("#pzHost"), step, save.code[key], (state) => { save.code[key] = state; persist(); });
  $("#lReset").onclick = () => pz.reset();
  $("#lTrace").onclick = () => { if (pz.code().trim()) openTracer({ code: pz.code(), title: step.title }); };
  $("#lRun").onclick = () => {
    const r = Atolye.checkParsons(step, pz.code()), out = $("#lOut");
    out.innerHTML = r.out.length ? esc(r.out.join("\n")) : `<span class="note">${r.error ? "Program hata verdiği için bir şey yazamadı." : "(çıktı yok)"}</span>`;
    if (r.error) { ladder.fail(); $("#qfb").innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}${r.error.line ? r.error.line + ". satırda hata" : "Hata"}</h3><p>${r.error.msg}</p></div>`; return; }
    if (!r.ok) { if (pz.count) ladder.fail(); $("#qfb").innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}Henüz olmadı</h3><p>${r.msg}</p></div>`; return; }
    $("#qfb").innerHTML = `<div class="fb fb--ok"><h3>${icon("check")}Program çalıştı</h3><p>${okMsg()}</p></div>`;
    unlockNext();
  };
}
function lessonEnd() {
  const L = LESSONS[LS.li], next = LS.li + 1 < LESSONS.length, req = reqSteps(L);
  const bonus = L.steps.map((s, i) => ({ s, i })).filter((x) => x.s.bonus), bd = bonus.filter((x) => save.done["ders-" + LS.li + "-b" + x.i]).length;
  root().innerHTML = shell(`<section class="sheet summary"><span class="big">${icon("check")}</span><h2>${L.title} tamamlandı</h2>
    <p>${next ? "Sıradaki ders: <b>" + LESSONS[LS.li + 1].title + "</b>" : "Başlangıç dersleri bitti. Şimdi aşama kontrolünü çöz, sonra ilk gerçek Python defterine geç."}</p>
    ${bonus.length && bd < bonus.length ? `<div class="bonus-offer">${icon("star")}<div><b>Erken mi bitirdin?</b><p>Bu derste ${bonus.length} yıldızlı görev var. Zorunlu değil, ama biraz daha zorlar.</p></div><button class="btn" id="goBonus">Yıldızlı göreve geç ${icon("right")}</button></div>` : ""}
    <div class="row"><a class="btn" href="#asama-1">Bütün dersler</a><a class="btn btn--primary" href="${next ? "#ders-" + (LS.li + 2) : "#kontrol-1"}">${next ? "Sonraki ders" : "Aşama kontrolü"} ${icon("right")}</a></div></section>`, 0);
  bindShell();
  if ($("#goBonus")) $("#goBonus").onclick = () => { LS.si = bonus.find((x) => !save.done["ders-" + LS.li + "-b" + x.i]).i; renderStep(); window.scrollTo(0, 0); };
  window.scrollTo(0, 0);
}

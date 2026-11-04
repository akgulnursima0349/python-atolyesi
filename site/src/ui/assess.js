/* Ölçme sayfaları: ön test, aşama kontrolleri, son test ve gelişim raporu. */
import { KAZANIMLAR, ON_TEST, SON_TEST, KONTROLLER } from "../data/tests.js";
import { $, $$, esc, icon, save, persist, hooks, PHASES, phaseWorkDone, testDone, setHue, hueVars, shell, confetti } from "./core.js";
import { bindShell } from "./pages.js";

const root = () => $("#root");
const PASS = 3;
const KILIT = ["Önce bütün dersleri bitir", "Önce defteri bitirip tamamlama kodunu gir", "Önce istasyon görevlerini bitir", "Önce defteri ve Model Atölyesi'ni bitir", "Önce üç lab'ı bitirip kodlarını gir"]; /* aşama kontrolünü geçmek için 5 sorudan en az 3 doğru */

function def(key) {
  if (key === "on") return { key, title: "Ön test", qs: ON_TEST, diag: true, phase: 0, mins: 10 };
  if (key === "son") return { key, title: "Son test", qs: SON_TEST, diag: true, phase: 4, mins: 10 };
  const n = +key.split("-")[1];
  return { key, title: KONTROLLER[n - 1].title, qs: KONTROLLER[n - 1].sorular, diag: false, phase: n - 1, mins: 5 };
}
export const testOpen = (key) => {
  if (save.teacher || testDone(key)) return true;
  if (key === "on") return true;
  if (key === "son") return testDone("kontrol-5");
  const n = +key.split("-")[1];
  return phaseWorkDone(n - 1);
};

/* ---------- aşama sayfalarında görünen kartlar ---------- */
export function testCard(key) {
  const d = def(key), t = save.tests[key], open = testOpen(key);
  const done = testDone(key);
  let status, action;
  if (d.diag) {
    status = done ? `<b>${t.score} / ${d.qs.length}</b> doğru · ${new Date(t.date).toLocaleDateString("tr-TR")}` : `${d.qs.length} soru · yaklaşık ${d.mins} dakika · not yok`;
    action = done ? (key === "son" ? `<a class="btn btn--primary" href="#sonuc">${icon("chart")} Gelişim raporunu gör</a>` : `<span class="muted">Tamamlandı</span>`)
      : open ? `<a class="btn btn--primary" href="#${key}-test">${key === "on" ? "Ön teste başla" : "Son teste başla"} ${icon("right")}</a>` : `<span class="status">${icon("lock")} Önce 5. aşamanın kontrolünü bitir</span>`;
  } else {
    const best = t ? t.best : null;
    status = best == null ? `5 soru · en az ${PASS} doğru gerekiyor` : `En iyi sonucun: <b>${best} / 5</b>${done ? " · geçtin" : ` · geçmek için en az ${PASS}`}`;
    action = open ? `<a class="btn${done ? "" : " btn--primary"}" href="#${key}">${best == null ? "Kontrole başla" : "Tekrar çöz"} ${icon("right")}</a>` : `<span class="status">${icon("lock")} ${KILIT[d.phase]}</span>`;
  }
  const txt = key === "on" ? "Başlamadan önce ne bildiğine bakalım. Bilmediğin soruda <b>Bilmiyorum</b>'u seç. Kursun sonunda aynı konulardan tekrar soracağız ve ne kadar ilerlediğini göreceksin."
    : key === "son" ? "Kursun başındaki ön testle aynı konular, farklı sorular. Bitirince ne kadar ilerlediğini konu konu görürsün."
    : "Bu aşamada öğrendiklerini 5 kısa soruyla kontrol et. Her sorudan sonra açıklamasını görürsün.";
  return `<article class="test-card${done ? " done" : ""}" style="${hueVars("test")}"><span class="test-mark">${icon(done ? "check" : "clipboard")}</span>
    <div><span class="k">${d.diag ? (key === "on" ? "Kursun başında" : "Kursun sonunda") : "Aşama sonu"}</span><h3>${d.title}</h3><p>${txt}</p>
    <div class="test-foot"><span class="muted">${status}</span>${action}</div></div></article>`;
}

/* ---------- test akışı ---------- */
export function showTest(key) {
  const d = def(key);
  if (!testOpen(key)) { location.hash = "asama-" + (d.phase + 1); return; }
  setHue("test");
  let i = 0, answers = [], started = false;
  const back = `#asama-${d.phase + 1}`;
  function intro() {
    const msg = d.diag
      ? `<p>Bu bir sınav değil, <b>not almayacaksın</b>. Amaç, kursa başlarken ve bitirirken ne bildiğini karşılaştırmak.</p>
         <ul class="plain-list"><li>${d.qs.length} soru var, yaklaşık ${d.mins} dakika sürer.</li><li>Bilmediğin soruda tahmin etme, <b>Bilmiyorum</b>'u seç. Böylece sonuç gerçekten ne bildiğini gösterir.</li><li>Sorular bitene kadar doğru cevaplar gösterilmez.</li></ul>`
      : `<p>Bu aşamada öğrendiklerini 5 kısa soruyla kontrol edeceğiz. Her cevaptan sonra doğrusunu ve açıklamasını göreceksin.</p><p>Aşamayı tamamlamak için en az <b>${PASS} doğru</b> gerekiyor. İstediğin kadar tekrar çözebilirsin.</p>`;
    root().innerHTML = shell(`<section class="sheet test-intro"><span class="k">${icon("clipboard")} ${d.diag ? "Değerlendirme" : "Aşama kontrolü"}</span><h1>${d.title}</h1>${msg}
      <div class="row"><a class="btn btn--quiet" href="${back}">${icon("left")} Geri</a><button class="btn btn--primary" id="tStart">Başla ${icon("right")}</button></div></section>`, d.phase);
    bindShell();
    $("#tStart").onclick = () => { started = true; render(); };
  }
  function render() {
    if (i >= d.qs.length) return finish();
    const q = d.qs[i];
    const dots = d.qs.map((_, k) => `<i class="${k < i ? (d.diag ? "a" : answers[k] === d.qs[k].answer ? "r" : "w") : k === i ? "c" : ""}"></i>`).join("");
    const opts = q.options.map((o, k) => `<button class="opt" data-o="${k}">${esc(o)}</button>`).join("") + (d.diag ? `<button class="opt opt--idk" data-o="-1">Bilmiyorum</button>` : "");
    root().innerHTML = shell(`<header class="work-head"><nav class="crumbs"><a href="${back}">${PHASES[d.phase].title}</a>${icon("chev")}<span>${d.title}</span></nav></header>
      <section class="sheet test-q"><div class="label"><span>Soru ${i + 1} / ${d.qs.length}</span><span class="dots">${dots}</span></div>
        <div class="prose"><h2>${q.q}</h2>${q.code ? `<pre class="code-show">${esc(q.code)}</pre>` : ""}</div>
        <div class="opts">${opts}</div><div id="tfb"></div>
        ${d.diag && i > 0 ? `<div class="row" style="margin-top:12px"><button class="btn btn--quiet btn--sm" id="tPrev">${icon("left")} Önceki soru</button></div>` : ""}</section>`, d.phase);
    bindShell();
    if (d.diag && answers[i] != null) { const b = $(`[data-o="${answers[i]}"]`); if (b) b.classList.add("picked"); }
    $$(".opt").forEach((b) => { b.onclick = () => pick(+b.dataset.o); });
    if ($("#tPrev")) $("#tPrev").onclick = () => { i--; render(); };
  }
  function pick(k) {
    answers[i] = k;
    if (d.diag) { i++; render(); return; }
    const q = d.qs[i], ok = k === q.answer;
    $$(".opt").forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
    $("#tfb").innerHTML = `<div class="fb ${ok ? "fb--ok" : "fb--bad"}" style="margin-top:16px"><h3>${ok ? icon("check") + "Doğru" : icon("x") + "Doğrusu işaretli"}</h3><p>${q.why}</p>
      <div class="row"><button class="btn btn--primary" id="tNext">${i + 1 < d.qs.length ? "Sonraki soru" : "Sonucu gör"} ${icon("right")}</button></div></div>`;
    $("#tNext").onclick = () => { i++; render(); };
    $("#tNext").focus();
  }
  function finish() {
    const score = answers.filter((a, k) => a === d.qs[k].answer).length;
    const prev = save.tests[key] || {};
    if (d.diag) save.tests[key] = { done: true, answers, score, date: Date.now() };
    else {
      const best = Math.max(prev.best || 0, score);
      save.tests[key] = { done: best >= PASS, best, last: score, date: Date.now() };
    }
    persist();
    if (key === "son") { confetti(); location.hash = "sonuc"; return; }
    const passed = d.diag || score >= PASS;
    if (!d.diag && passed && !prev.done) confetti();
    const wrong = d.qs.map((q, k) => ({ q, k })).filter((x) => answers[x.k] !== x.q.answer);
    let body;
    if (key === "on") {
      const known = KAZANIMLAR.filter((_, k) => answers[k] === ON_TEST[k].answer);
      body = `<p>Teşekkürler! ${known.length ? `Şu konuları şimdiden biliyorsun: <b>${known.map((x) => x.kisa).join(", ")}</b>.` : "Konuların çoğu senin için yeni. Bu çok normal, kurs tam da bunun için var."}</p>
        <p>Kalan konuları kurs boyunca öğreneceksin. Sonunda aynı konulardan tekrar soracağız.</p>
        <div class="row"><a class="btn btn--primary" href="#ders-1">İlk derse başla ${icon("right")}</a><a class="btn" href="#asama-1">Bütün dersler</a></div>`;
    } else {
      const next = d.phase + 1 < PHASES.length;
      body = `<p>${score === 5 ? "Hepsini bildin, harika!" : passed ? "Aşamayı geçtin. Yanlış yaptığın soruların açıklamalarına bir göz at." : `Geçmek için en az ${PASS} doğru gerekiyor. Açıklamaları oku, sonra tekrar dene.`}</p>
        ${wrong.length ? `<div class="review">${wrong.map((x) => `<div class="review-row"><b>${x.q.q}</b><p>Doğru cevap: <code>${esc(x.q.options[x.q.answer])}</code></p><p class="muted">${x.q.why}</p></div>`).join("")}</div>` : ""}
        <div class="row"><button class="btn" id="tAgain">${icon("reset")} Tekrar çöz</button>${passed ? (next ? `<a class="btn btn--primary" href="#asama-${d.phase + 2}">Sonraki aşama: ${PHASES[d.phase + 1].short} ${icon("right")}</a>` : `<a class="btn btn--primary" href="#asama-5">Son teste geç ${icon("right")}</a>`) : `<a class="btn" href="${back}">Aşamaya dön</a>`}</div>`;
    }
    root().innerHTML = shell(`<section class="sheet summary test-done"><span class="label">${d.title}</span><span class="big">${score} / ${d.qs.length}</span>${body}</section>`, d.phase);
    bindShell();
    if ($("#tAgain")) $("#tAgain").onclick = () => { i = 0; answers = []; render(); };
    window.scrollTo(0, 0);
  }
  intro();
  window.scrollTo(0, 0);
}

/* ---------- gelişim raporu ---------- */
export function showReport() {
  setHue("test");
  const on = save.tests.on, son = save.tests.son;
  if (!testDone("on") || !testDone("son")) {
    root().innerHTML = shell(`<section class="sheet summary"><span class="big">${icon("chart")}</span><h2>Gelişim raporu henüz hazır değil</h2>
      <p>Rapor, kursun başındaki ön testle sonundaki son testi karşılaştırır. ${testDone("on") ? "Son testi bitirince burada göreceksin." : "Önce ön testi çözmelisin."}</p>
      <div class="row"><a class="btn btn--primary" href="${testDone("on") ? "#asama-5" : "#asama-1"}">${testDone("on") ? "5. aşamaya git" : "Ön teste git"} ${icon("right")}</a></div></section>`, 4);
    bindShell(); return;
  }
  const a = (f, t, k) => (t.answers[k] === f[k].answer ? 1 : t.answers[k] === -1 ? -1 : 0);
  const rows = KAZANIMLAR.map((kz, k) => ({ kz, o: a(ON_TEST, on, k), s: a(SON_TEST, son, k) }));
  const learned = rows.filter((r) => r.o !== 1 && r.s === 1).length, review = rows.filter((r) => r.s !== 1);
  const mark = (v) => v === 1 ? `<span class="mk ok" title="Doğru">${icon("check")}</span>` : v === -1 ? `<span class="mk idk" title="Bilmiyorum">?</span>` : `<span class="mk no" title="Yanlış">${icon("x")}</span>`;
  const badge = (r) => r.s === 1 ? (r.o === 1 ? `<span class="pill">Zaten biliyordun</span>` : `<span class="pill pill--ok">Yeni öğrendin</span>`) : `<span class="pill pill--warn">Tekrar et</span>`;
  const checks = KONTROLLER.map((k, i) => { const t = save.tests["kontrol-" + (i + 1)]; return `<li><span>${PHASES[i].short}</span><b>${t ? t.best + " / 5" : "—"}</b></li>`; }).join("");
  const n = KAZANIMLAR.length, pct = (x) => Math.round(100 * x / n);
  root().innerHTML = shell(`<header class="work-head"><span class="eyebrow">Kursun sonu</span><h1>Gelişim raporun</h1>
      <p class="lead">Kursun başında ve sonunda aynı ${n} konudan soru çözdün. İşte aradaki fark.</p></header>
    <section class="report-top">
      <div class="score-bars">
        <div class="sb"><span>Ön test</span><div class="bar"><i style="width:${pct(on.score)}%"></i></div><b>${on.score} / ${n}</b></div>
        <div class="sb sb--son"><span>Son test</span><div class="bar"><i style="width:${pct(son.score)}%"></i></div><b>${son.score} / ${n}</b></div>
      </div>
      <div class="report-sum"><span class="big">+${Math.max(0, son.score - on.score)}</span><p>${learned ? `<b>${learned} konuyu</b> kurs boyunca yeni öğrendin.` : "Ön testte zaten çoğunu biliyordun."}${review.length ? ` Tekrar etmen gereken ${review.length} konu var.` : " Bütün konularda son testi doğru çözdün!"}</p></div>
    </section>
    <section class="sheet"><div class="label"><span>Konu konu</span><span>ön · son</span></div>
      <ol class="kz-list">${rows.map((r) => `<li><span class="kz-no">${r.kz.no}</span><span class="kz-ad">${r.kz.ad}</span><span class="kz-mk">${mark(r.o)}${mark(r.s)}</span>${badge(r)}</li>`).join("")}</ol></section>
    <section class="sheet"><div class="label"><span>Aşama kontrolleri</span><span>en iyi sonuç</span></div><ul class="check-scores">${checks}</ul></section>
    <p class="muted" style="font-size:14px">${hooks.bulut ? "Bu rapor öğretmeninin panelinde de görünüyor." : "Bu rapor şimdilik sadece bu bilgisayarda saklanıyor. Öğretmenine göstermeyi unutma."}</p>`, 4);
  bindShell();
  window.scrollTo(0, 0);
}

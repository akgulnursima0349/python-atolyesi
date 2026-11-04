/* Hesaplar: giriş ekranı, üst bardaki kullanıcı rozeti ve öğretmen paneli. */
import { $, $$, esc, icon, save, hooks, PHASES, setHue, shell } from "./core.js";
import { cloud, onCloud, hataMetni, studentLogin, teacherLogin, teacherSignup, teacherComplete, hasAccountSession, logout, teacherApi } from "../cloud/index.js";
import { ozet, kazanimSonucu, KAZANIMLAR } from "./summary.js";
import { bindShell } from "./pages.js";

const root = () => $("#root");

/* ---------- üst bardaki rozet ---------- */
const STATUS = { kaydediliyor: "Kaydediliyor…", kaydedildi: "Kaydedildi", hata: "Kaydedilemedi, tekrar denenecek", hazir: "" };
hooks.userChip = () => {
  if (cloud.mode !== "bulut" || !cloud.me.rol) return "";
  if (cloud.me.rol === "ogretmen") return `<a class="user-chip" href="#ogretmen" title="${cloud.me.mudur ? "Müdür paneli" : "Öğretmen paneli"}">${icon("clipboard")}<span class="uc-name">Panel</span></a><button class="icon-btn" id="logoutBtn" title="Çıkış yap" aria-label="Çıkış yap">${icon("logout")}</button>`;
  return `<span class="user-chip" title="${esc(cloud.me.sinif)}">${icon("user")}<span class="uc-name">${esc(cloud.me.takma_ad)}</span><span class="save-dot ${cloud.status}" id="saveDot" title="${STATUS[cloud.status] || ""}"></span></span><button class="icon-btn" id="logoutBtn" title="Çıkış yap" aria-label="Çıkış yap">${icon("logout")}</button>`;
};
hooks.afterShell = () => {
  const b = $("#logoutBtn");
  if (b) b.onclick = async () => { b.disabled = true; await logout(); location.hash = "giris"; window.dispatchEvent(new HashChangeEvent("hashchange")); };
};
onCloud(() => { const d = $("#saveDot"); if (d) { d.className = "save-dot " + cloud.status; d.title = STATUS[cloud.status] || ""; } });

/* =========================== GİRİŞ EKRANI =========================== */
export function showLogin(view) {
  setHue("brand");
  view = view || "ogrenci";
  const tab = (k, t) => `<button class="seg-tab${view === k ? " on" : ""}" data-v="${k}">${t}</button>`;
  let form = "";
  if (view === "ogrenci") form = `<form id="fStudent" class="login-form" autocomplete="off">
      <label>Sınıf kodu<input id="lKod" maxlength="8" required placeholder="6 harfli kod" autocapitalize="characters" spellcheck="false"></label>
      <label>Takma adın<input id="lAd" maxlength="30" required placeholder="Öğretmeninin verdiği kartta yazıyor" spellcheck="false"></label>
      <label>PIN<input id="lPin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required placeholder="4 rakam" autocomplete="off"></label>
      <button class="btn btn--primary btn--lg" type="submit">Giriş yap ${icon("right")}</button>
      <p class="muted small">PIN'ini unuttuysan öğretmenine söyle, sana yenisini verir.</p></form>`;
  else if (view === "ogretmen") form = `<form id="fTeacher" class="login-form">
      <label>E-posta<input id="tMail" type="email" required autocomplete="username"></label>
      <label>Şifre<input id="tPass" type="password" required autocomplete="current-password"></label>
      <button class="btn btn--primary btn--lg" type="submit">Öğretmen girişi ${icon("right")}</button>
      <p class="muted small">Hesabın yok mu? <a href="#" id="toSignup">Öğretmen hesabı oluştur</a></p></form>`;
  else if (view === "kayit") form = `<form id="fSignup" class="login-form">
      <label>E-posta<input id="sMail" type="email" required autocomplete="username"></label>
      <label>Şifre<input id="sPass" type="password" required minlength="6" autocomplete="new-password"></label>
      <button class="btn btn--primary btn--lg" type="submit">Hesap oluştur ${icon("right")}</button>
      <p class="muted small">Zaten hesabın var mı? <a href="#" id="toLogin">Giriş yap</a></p></form>`;
  else form = `<form id="fComplete" class="login-form">
      <p>Son bir adım: adını ve kurumunun verdiği <b>kurum kodunu</b> yaz. Kurum kodu, sadece kurumdaki öğretmenlerin hesap açabilmesi içindir. Kurum müdürü, müdür koduyla kaydolur.</p>
      <label>Adın (öğrenciler görmez)<input id="cAd" required maxlength="60" placeholder="ör. Nur Hoca"></label>
      <label>Kurum kodu<input id="cKod" required spellcheck="false"></label>
      <button class="btn btn--primary btn--lg" type="submit">Öğretmen hesabını tamamla ${icon("right")}</button></form>`;
  const title = view === "ogrenci" ? "Öğrenci girişi" : view === "ogretmen" ? "Öğretmen girişi" : view === "kayit" ? "Öğretmen hesabı oluştur" : "Öğretmen kaydını tamamla";
  root().innerHTML = `<div class="login-page"><div class="login-card">
    <a href="#ana" class="login-logo"><img src="${$("link[rel=icon]") ? $("link[rel=icon]").href : ""}" alt="Sivas Robotik Akademi" width="88" height="88"></a>
    <span class="eyebrow">Sivas Robotik Akademi · Python Atölyesi</span><h1>${title}</h1>
    ${view === "tamamla" ? "" : `<div class="seg-tabs">${tab("ogrenci", "Öğrenciyim")}${tab("ogretmen", "Öğretmenim")}</div>`}
    ${cloud.error && cloud.status === "hata" && !cloud.me.rol ? `<div class="notice">${icon("bulb")}<span>${cloud.error}</span></div>` : ""}
    ${form}<div id="loginMsg" role="alert"></div></div></div>`;
  $$("[data-v]").forEach((b) => { b.onclick = () => showLogin(b.dataset.v); });
  const msg = (t, ok) => { $("#loginMsg").innerHTML = t ? `<div class="fb ${ok ? "fb--ok" : "fb--bad"}"><p>${t}</p></div>` : ""; };
  const busy = (f, on) => { const b = $("button[type=submit]", f); b.disabled = on; b.classList.toggle("is-busy", on); };
  async function run(f, fn) { busy(f, true); msg(""); try { await fn(); } catch (e) { msg(hataMetni(e)); } busy(f, false); }
  if ($("#fStudent")) {
    $("#lKod").oninput = (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); };
    $("#lPin").oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, ""); };
    $("#fStudent").onsubmit = (e) => { e.preventDefault(); run(e.target, async () => { await studentLogin($("#lKod").value, $("#lAd").value, $("#lPin").value); location.hash = "ana"; }); };
    $("#lKod").focus();
  }
  if ($("#fTeacher")) {
    $("#toSignup").onclick = (e) => { e.preventDefault(); showLogin("kayit"); };
    $("#fTeacher").onsubmit = (e) => { e.preventDefault(); run(e.target, async () => { const me = await teacherLogin($("#tMail").value.trim(), $("#tPass").value); if (me.rol === "ogretmen") location.hash = "ogretmen"; else if (me.pasif) { await logout(true); msg("Bu öğretmen hesabının erişimi kurum müdürü tarafından kapatılmış."); } else showLogin("tamamla"); }); };
  }
  if ($("#fSignup")) {
    $("#toLogin").onclick = (e) => { e.preventDefault(); showLogin("ogretmen"); };
    $("#fSignup").onsubmit = (e) => { e.preventDefault(); run(e.target, async () => {
      const r = await teacherSignup($("#sMail").value.trim(), $("#sPass").value);
      if (r.needsConfirm) msg("Hesabın oluşturuldu. E-postana gelen <b>onay bağlantısına</b> tıkla, sonra buradan <b>Öğretmen girişi</b> yap.", true);
      else showLogin("tamamla");
    }); };
  }
  if ($("#fComplete")) {
    $("#fComplete").onsubmit = (e) => { e.preventDefault(); run(e.target, async () => {
      if (!(await hasAccountSession())) { showLogin("ogretmen"); return; }
      await teacherComplete($("#cAd").value.trim(), $("#cKod").value.trim()); location.hash = "ogretmen";
    }); };
  }
  window.scrollTo(0, 0);
}

/* =========================== ÖĞRETMEN PANELİ =========================== */
const fmtWhen = (iso) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 2) return "şimdi"; if (m < 60) return m + " dk önce";
  const h = Math.round(m / 60); if (h < 24) return h + " sa önce";
  const g = Math.round(h / 24); if (g < 30) return g + " gün önce";
  return new Date(iso).toLocaleDateString("tr-TR");
};
function guard() { if (cloud.me.rol !== "ogretmen") { location.hash = "giris"; return false; } return true; }
function panelShell(inner) { root().innerHTML = shell(inner, -1); bindShell(); }

export async function showTeacher() {
  if (!guard()) return;
  setHue("test");
  const m = !!cloud.me.mudur;
  panelShell(`<header class="work-head"><span class="eyebrow">${m ? "Kurum müdürü paneli" : "Öğretmen paneli"}</span><h1>Merhaba, ${esc(cloud.me.ad)}</h1>
    <p class="lead">${m ? "Kurumdaki bütün sınıfları ve öğretmenleri buradan görürsün. Her sınıfa girip öğretmenler gibi yönetebilirsin." : "Sınıflarını buradan yönet, öğrencilerin nerede olduğunu gör."} Kursu öğrenci gibi gezmek için üstteki adımları kullanabilirsin: bu hesapta her şey açık.</p></header>
    <section class="sheet"><div class="label"><span>Sınıflarım</span></div><div id="classList" class="class-list"><p class="muted">Yükleniyor…</p></div>
    <form id="newClass" class="inline-form"><input id="ncAd" required maxlength="60" placeholder="Yeni sınıfın adı (ör. Cumartesi 10:00 grubu)" aria-label="Sınıf adı"><button class="btn btn--primary">Sınıf oluştur</button></form><div id="ncMsg"></div></section>
    ${m ? `<section class="sheet"><div class="label"><span>Kurumdaki diğer sınıflar</span></div><div id="otherList" class="class-list"><p class="muted">Yükleniyor…</p></div></section>
      <section class="sheet"><div class="label"><span>Öğretmenler</span></div><div id="teacherList"><p class="muted">Yükleniyor…</p></div>
      <p class="muted small" style="margin-top:12px">Kurumdan ayrılan bir öğretmenin erişimini kapatabilirsin. Sınıfları ve öğrencileri silinmez; o sınıfları başka bir öğretmene devretmek için sınıfın <b>Öğretmenler</b> sekmesini kullan.</p></section>` : ""}
    <section class="sheet prose small"><h2>Nasıl başlarım?</h2><ol><li>Bir sınıf oluştur. Sistem ona 6 harfli bir <b>sınıf kodu</b> verir.</li><li>Sınıfın içinde öğrencilerin <b>takma adlarını</b> ekle. Her öğrenciye 4 haneli bir PIN üretilir. Listeyi yazdırıp kes ya da kopyala.</li><li>Öğrenciler giriş ekranında sınıf kodu, takma ad ve PIN'le girer. İlerlemeleri her bilgisayarda aynıdır.</li><li>Sınıfa başka bir öğretmen de girecekse sınıfın <b>Öğretmenler</b> sekmesinden onu <b>ortak öğretmen</b> olarak ekle.</li></ol>
    <p class="muted">Gizlilik için gerçek ad-soyad yerine takma ad ya da ad ve soyadın baş harfini kullanın (ör. <b>Elif K.</b>). Sistem öğrenciden e-posta ya da başka kişisel bilgi istemez.</p></section>`);
  const row = (c) => `<a class="class-row" href="#sinif-${c.id}"><span class="class-code">${esc(c.kod)}</span><span><b>${esc(c.ad)}</b><small>${c.ogrenci_sayisi} öğrenci${c.benim ? "" : " · " + (c.ortak ? "ortak öğretmensin · " : "") + "sahibi: " + esc(c.sahip_ad)}</small></span>${icon("right")}</a>`;
  async function load() {
    try {
      const cs = await teacherApi.siniflar(), mine = cs.filter((c) => c.benim || c.ortak), other = cs.filter((c) => !c.benim && !c.ortak);
      $("#classList").innerHTML = mine.length ? mine.map(row).join("") : `<p class="muted">Henüz sınıfın yok. Aşağıdan ilk sınıfını oluştur.</p>`;
      if ($("#otherList")) $("#otherList").innerHTML = other.length ? other.map(row).join("") : `<p class="muted">Başka öğretmenlerin sınıfı yok.</p>`;
      if ($("#teacherList")) loadTeachers();
    } catch (e) { $("#classList").innerHTML = `<div class="fb fb--bad"><p>${hataMetni(e)}</p></div>`; }
  }
  async function loadTeachers() {
    const box = $("#teacherList");
    try {
      const ts = await teacherApi.mudurOgretmenler();
      box.innerHTML = `<ul class="st-list">${ts.map((t) => `<li class="${t.aktif ? "" : "is-off"}"><span><b>${esc(t.ad)}</b>${t.mudur ? ` <span class="pill">müdür</span>` : ""}${t.aktif ? "" : ` <span class="pill pill--warn">erişim kapalı</span>`}</span>
        <span class="muted small">${t.sinif_sayisi} sınıf${t.ortak_sayisi ? ` · ${t.ortak_sayisi} ortak` : ""}</span>
        <span class="st-act">${t.id === cloud.me.id || t.mudur ? "" : `<button class="btn btn--sm${t.aktif ? " btn--quiet danger" : ""}" data-akt="${t.id}" data-to="${t.aktif ? 0 : 1}">${t.aktif ? "Erişimi kapat" : "Erişimi aç"}</button>`}</span></li>`).join("")}</ul>`;
      $$("[data-akt]", box).forEach((b) => confirmBtn(b, b.dataset.to === "1" ? "Açılsın mı?" : "Emin misin? Kapatılacak", async () => { await teacherApi.aktiflik(b.dataset.akt, b.dataset.to === "1"); loadTeachers(); }));
    } catch (e) { box.innerHTML = `<div class="fb fb--bad"><p>${hataMetni(e)}</p></div>`; }
  }
  $("#newClass").onsubmit = async (e) => {
    e.preventDefault(); const b = $("button", e.target); b.disabled = true;
    try { const c = await teacherApi.sinifOlustur($("#ncAd").value.trim()); location.hash = "sinif-" + c.id; }
    catch (er) { $("#ncMsg").innerHTML = `<div class="fb fb--bad"><p>${hataMetni(er)}</p></div>`; b.disabled = false; }
  };
  load();
  window.scrollTo(0, 0);
}

let CL = { id: null, tab: "ilerleme", data: null, cls: null, open: null, show: false, flash: null };
export async function showClass(id) {
  if (!guard()) return;
  setHue("test");
  if (CL.id !== id) CL = { id, tab: "ilerleme", data: null, cls: null, open: null, show: false, flash: null };
  panelShell(`<p class="muted" style="padding:40px 0">Yükleniyor…</p>`);
  try {
    const [cs, rows] = await Promise.all([teacherApi.siniflar(), teacherApi.rapor(id)]);
    CL.cls = cs.find((c) => c.id === id); CL.all = cs;
    if (!CL.cls) { location.hash = "ogretmen"; return; }
    CL.data = rows.map((r) => ({ ...r, o: ozet(r.veri) }));
    renderClass();
  } catch (e) {
    panelShell(`<div class="fb fb--bad"><p>${hataMetni(e)}</p><div class="row"><a class="btn" href="#ogretmen">Panele dön</a></div></div>`);
  }
}
function renderClass() {
  const c = CL.cls, rows = CL.data;
  const tab = (k, t) => `<button class="seg-tab${CL.tab === k ? " on" : ""}" data-tab="${k}">${t}</button>`;
  let body = "";
  if (CL.tab === "ilerleme") body = progressTab(rows);
  else if (CL.tab === "testler") body = testsTab(rows);
  else if (CL.tab === "ogretmenler") body = `<div id="teachersTab"><p class="muted">Yükleniyor…</p></div>`;
  else body = studentsTab(rows);
  panelShell(`<header class="work-head"><nav class="crumbs"><a href="#ogretmen">Öğretmen paneli</a>${icon("chev")}<span>${esc(c.ad)}</span></nav>
      <div class="class-head"><div><h1>${esc(c.ad)}</h1><p class="muted">${rows.length} öğrenci${c.benim ? "" : " · sahibi: " + esc(c.sahip_ad)}</p></div>
      <div class="code-box"><span>Sınıf kodu</span><b>${esc(c.kod)}</b><small>Öğrenciler girişte bunu yazacak</small></div></div>
      <div class="seg-tabs">${tab("ilerleme", "İlerleme")}${tab("testler", "Ön test · son test")}${tab("ogrenciler", "Öğrenciler ve PIN'ler")}${tab("ogretmenler", "Öğretmenler")}</div></header>${body}`);
  $$("[data-tab]").forEach((b) => { b.onclick = () => { CL.tab = b.dataset.tab; CL.show = false; CL.flash = null; renderClass(); }; });
  bindClass();
  if (CL.tab === "ogretmenler") teachersTab();
}

/* --- Öğretmenler sekmesi: ortak öğretmen ekle/çıkar, devret --- */
const canManage = () => !!(CL.cls && (CL.cls.benim || cloud.me.mudur));
async function teachersTab() {
  const box = $("#teachersTab");
  try {
    const [inC, all] = await Promise.all([teacherApi.sinifOgretmenleri(CL.id), teacherApi.ogretmenListesi()]);
    const ids = new Set(inC.map((t) => t.id)), cand = all.filter((t) => !ids.has(t.id));
    const man = canManage(), meIn = inC.find((t) => t.id === cloud.me.id);
    box.innerHTML = `<section class="sheet"><div class="label"><span>Bu sınıfın öğretmenleri</span><span>${inC.length}</span></div>
      <ul class="st-list">${inC.map((t) => `<li><span><b>${esc(t.ad)}</b> ${t.sahip ? `<span class="pill pill--ok">sahibi</span>` : `<span class="pill">ortak</span>`}</span><span></span>
        <span class="st-act">${!t.sahip && (man || t.id === cloud.me.id) ? `<button class="btn btn--sm btn--quiet danger" data-cikar="${t.id}">${t.id === cloud.me.id ? "Sınıftan ayrıl" : "Çıkar"}</button>` : ""}</span></li>`).join("")}</ul>
      <p class="muted small" style="margin-top:12px">Ortak öğretmenler sınıfı görür, öğrenci ekler, PIN yeniler ve öğrenci taşır. Sınıfı silmek, öğretmen eklemek ve devretmek sadece sınıfın sahibine ve kurum müdürüne açıktır.</p></section>
      ${man ? `<section class="sheet"><div class="label"><span>Ortak öğretmen ekle</span></div>
        ${cand.length ? `<form id="addT" class="inline-form"><select id="addTSel" aria-label="Öğretmen">${cand.map((t) => `<option value="${t.id}">${esc(t.ad)}${t.mudur ? " (müdür)" : ""}</option>`).join("")}</select><button class="btn btn--primary">Ekle</button></form>`
          : `<p class="muted small">Kurumda eklenebilecek başka öğretmen yok. Öğretmenler önce kurum koduyla hesap açmalı.</p>`}</section>
      <section class="sheet"><div class="label"><span>Sınıfı devret</span></div><p class="muted small">Sınıfın sahibi değişir. Eski sahibi ortak öğretmen olarak kalır.</p>
        <form id="devT" class="inline-form"><select id="devTSel" aria-label="Yeni sahip">${all.filter((t) => !inC.find((x) => x.id === t.id && x.sahip)).map((t) => `<option value="${t.id}">${esc(t.ad)}</option>`).join("")}</select><button class="btn" id="devBtn">Devret</button></form></section>` : ""}
      <div id="tMsg"></div>`;
    $$("[data-cikar]", box).forEach((b) => confirmBtn(b, "Emin misin?", async () => {
      await teacherApi.ogretmenCikar(CL.id, b.dataset.cikar);
      if (b.dataset.cikar === cloud.me.id && !cloud.me.mudur) { location.hash = "ogretmen"; return; }
      teachersTab();
    }));
    if ($("#addT")) $("#addT").onsubmit = async (e) => { e.preventDefault(); try { await teacherApi.ogretmenEkle(CL.id, $("#addTSel").value); teachersTab(); } catch (er) { $("#tMsg").innerHTML = `<div class="fb fb--bad"><p>${hataMetni(er)}</p></div>`; } };
    if ($("#devT")) { $("#devT").onsubmit = (e) => e.preventDefault(); confirmBtn($("#devBtn"), "Emin misin? Devredilecek", async () => { await teacherApi.devret(CL.id, $("#devTSel").value); showClass(CL.id); }); }
  } catch (e) { box.innerHTML = `<div class="fb fb--bad"><p>${hataMetni(e)}</p></div>`; }
}

/* --- İlerleme sekmesi --- */
const cell = (txt, state, title) => `<td class="pc ${state || ""}"${title ? ` title="${esc(title)}"` : ""}>${txt}</td>`;
const frac = (a, b) => cell(`${a}/${b}`, a === b ? "full" : a ? "part" : "none");
const yes = (x, t) => cell(x ? icon("check") : "—", x ? "full" : "none", t);
function progressTab(rows) {
  if (!rows.length) return `<section class="sheet"><p class="muted">Bu sınıfta henüz öğrenci yok. <b>Öğrenciler ve PIN'ler</b> sekmesinden ekle.</p></section>`;
  const head = `<tr><th class="sticky">Öğrenci</th><th>Son görülme</th><th>Aşama</th><th>Ön test</th><th>Dersler</th><th>NB 00</th><th>İstasyonlar</th><th>NB 01</th><th>Model</th><th>Lab'lar</th><th>Kontroller</th><th>Son test</th><th title="Yıldızlı görevler">${icon("star")}</th></tr>`;
  const body = rows.map((r) => {
    const o = r.o, k = o.kontrol.map((x, i) => `<i class="kc ${x ? (x.gecti ? "ok" : "no") : ""}" title="${PHASES[i].short}: ${x ? x.best + "/5" : "çözülmedi"}">${i + 1}</i>`).join("");
    return `<tr class="${CL.open === r.id ? "open" : ""}" data-row="${r.id}"><th class="sticky"><button class="linkish" data-open="${r.id}">${esc(r.takma_ad)}</button></th>
      ${cell(fmtWhen(r.guncelleme || r.son_giris), "", r.guncelleme ? new Date(r.guncelleme).toLocaleString("tr-TR") : "")}
      ${cell(o.asama >= 5 ? "Bitti" : `${o.asama + 1}. ${PHASES[o.asama].short}`, o.asama >= 5 ? "full" : "")}
      ${cell(o.on ? `${o.on.score}/12` : "—", o.on ? "part" : "none")}
      ${frac(o.dersler, o.dersToplam)}${yes(o.nb00)}${frac(o.ist.done, o.ist.total)}${yes(o.nb01)}${frac(o.model.done, o.model.total)}${frac(o.labs, 3)}
      <td class="pc"><span class="kcs">${k}</span></td>
      ${cell(o.son ? `${o.son.score}/12` : "—", o.son ? "full" : "none")}${cell(String(o.yildiz), o.yildiz ? "star" : "none")}</tr>
      ${CL.open === r.id ? `<tr class="detail"><td colspan="13">${studentDetail(r)}</td></tr>` : ""}`;
  }).join("");
  const n = rows.length, avg = (f) => Math.round(rows.reduce((a, r) => a + f(r.o), 0) / n);
  const stuck = rows.filter((r) => !r.guncelleme || Date.now() - new Date(r.guncelleme) > 7 * 864e5);
  return `<section class="stat-row"><div class="stat"><span>Ortalama ilerleme</span><b>%${avg((o) => o.yuzde)}</b></div>
      <div class="stat"><span>Ön testi çözen</span><b>${rows.filter((r) => r.o.on).length} / ${n}</b></div>
      <div class="stat"><span>Son testi çözen</span><b>${rows.filter((r) => r.o.son).length} / ${n}</b></div>
      <div class="stat${stuck.length ? " warn" : ""}"><span>7 gündür girmeyen</span><b>${stuck.length}</b></div></section>
    <section class="sheet"><div class="label"><span>Sınıfın ilerlemesi</span><span><button class="btn btn--quiet btn--sm" id="refresh">${icon("reset")} Yenile</button></span></div>
      <div class="tbl prog-tbl"><table class="t"><thead>${head}</thead><tbody>${body}</tbody></table></div>
      <p class="muted small" style="margin-top:12px">Bir öğrencinin adına tıklayınca ayrıntısı açılır. Kontroller: yeşil geçti, kırmızı 3'ün altında kaldı, gri çözülmedi.</p></section>`;
}
function studentDetail(r) {
  const o = r.o, on = kazanimSonucu(o, "on"), son = kazanimSonucu(o, "son");
  const mk = (v) => v === 1 ? `<span class="mk ok">${icon("check")}</span>` : v === 0 ? `<span class="mk no">${icon("x")}</span>` : v === -1 ? `<span class="mk idk">?</span>` : `<span class="mk">–</span>`;
  return `<div class="student-detail"><div><h3>${esc(r.takma_ad)}</h3><p class="muted small">Genel ilerleme %${o.yuzde} · ${o.yildiz}/${o.yildizToplam} yıldız · Kontroller: ${o.kontrol.map((k, i) => `${PHASES[i].short} ${k ? k.best + "/5" : "—"}`).join(", ")}</p></div>
    <ol class="kz-list kz-list--mini">${KAZANIMLAR.map((kz, k) => `<li><span class="kz-no">${kz.no}</span><span class="kz-ad">${kz.ad}</span><span class="kz-mk">${mk(on[k])}${mk(son[k])}</span></li>`).join("")}</ol>
    <p class="muted small">İşaretler: ön test · son test. ? = "Bilmiyorum" seçti, – = henüz çözmedi.</p></div>`;
}

/* --- Ön test / son test sekmesi --- */
function testsTab(rows) {
  const ons = rows.filter((r) => r.o.on), sons = rows.filter((r) => r.o.son);
  if (!ons.length && !sons.length) return `<section class="sheet"><p class="muted">Henüz kimse ön testi çözmedi. Öğrenciler kursa başlarken ön testi çözünce burada konu konu sınıf sonucu görünecek.</p></section>`;
  const pct = (list, h, k) => { const v = list.map((r) => kazanimSonucu(r.o, h)[k]); return list.length ? Math.round(100 * v.filter((x) => x === 1).length / list.length) : null; };
  const avg = (list, h) => list.length ? (list.reduce((a, r) => a + r.o[h].score, 0) / list.length).toFixed(1) : "—";
  const rowsH = KAZANIMLAR.map((kz, k) => {
    const a = pct(ons, "on", k), b = pct(sons, "son", k), weak = b != null ? b < 50 : a != null && a < 50;
    return `<li class="${weak && sons.length ? "weak" : ""}"><span class="kz-no">${kz.no}</span><span class="kz-ad">${kz.ad}</span>
      <span class="kz-bars"><span class="mini"><i style="width:${a || 0}%"></i></span><b>${a == null ? "—" : "%" + a}</b><span class="mini son"><i style="width:${b || 0}%"></i></span><b>${b == null ? "—" : "%" + b}</b></span></li>`;
  }).join("");
  return `<section class="stat-row"><div class="stat"><span>Ön test ortalaması</span><b>${avg(ons, "on")} / 12</b><small>${ons.length} öğrenci</small></div>
      <div class="stat"><span>Son test ortalaması</span><b>${avg(sons, "son")} / 12</b><small>${sons.length} öğrenci</small></div></section>
    <section class="sheet"><div class="label"><span>Konu konu doğru cevaplayanlar</span><span><span class="lg on"></span>ön test <span class="lg son"></span>son test</span></div>
      <ol class="kz-list kz-list--bars">${rowsH}</ol>
      ${sons.length ? `<p class="muted small" style="margin-top:12px">Son testte %50'nin altında kalan konular vurgulandı: bunları sınıfta tekrar etmek iyi olur.</p>` : ""}</section>`;
}

/* --- Öğrenciler sekmesi ---
   PIN'ler her zaman görülebilir; ama sınıfta ekran yansıtılıyor olabileceği için varsayılan olarak gizli. */
function studentsTab(rows) {
  const others = (CL.all || []).filter((c) => c.id !== CL.id);
  const withPin = rows.filter((r) => r.pin), noPin = rows.filter((r) => !r.pin), show = !!CL.show;
  const pinOf = (r) => r.pin ? (show ? esc(r.pin) : "••••") : "—";
  const flash = CL.flash ? `<div class="fb fb--ok pin-flash"><p>${CL.flash}</p>${CL.skipped && CL.skipped.length ? `<p class="muted small">Eklenmeyenler (çok kısa ya da bu sınıfta zaten var): ${CL.skipped.map(esc).join(", ")}</p>` : ""}</div>` : "";
  const cards = withPin.length ? `<section class="sheet pin-sheet"><div class="label"><span>PIN kartları</span><span>${withPin.length} öğrenci</span></div>
      <p class="muted small">PIN'ler sadece bu sınıfın öğretmenlerine ve müdüre görünür. Tahtaya yansıtırken gizli tut.</p>
      <div class="row"><button class="btn" id="togglePins">${icon(show ? "eyeOff" : "eye")} ${show ? "PIN'leri gizle" : "PIN'leri göster"}</button><button class="btn btn--primary" id="printPins">Kartları yazdır</button><button class="btn" id="copyPins">Listeyi kopyala</button></div><div id="copyMsg"></div>
      <div class="pin-cards" id="pinCards"${show ? "" : " hidden"}>${withPin.map((p) => `<div class="pin-card"><small>Python Atölyesi · ${esc(CL.cls.ad)}</small><span>Sınıf kodu <b>${esc(CL.cls.kod)}</b></span><span>Takma ad <b>${esc(p.takma_ad)}</b></span><span>PIN <b>${esc(p.pin)}</b></span></div>`).join("")}</div></section>` : "";
  const old = noPin.length ? `<section class="sheet"><div class="fb fb--warn"><p><b>${noPin.length} öğrencinin PIN'i görünmüyor.</b> Bu öğrenciler PIN'ler gizli saklanırken eklenmişti; eski PIN'leri hâlâ çalışır ama okunamaz. Yeni PIN üretirsen buradan her zaman görebilirsin. (Bu öğrenciler bir sonraki girişte yeni PIN'i yazmalı.)</p>
      <div class="row"><button class="btn btn--primary" id="renewMissing">Bu ${noPin.length} öğrenciye yeni PIN üret</button></div></div></section>` : "";
  return flash + old + cards + `<section class="sheet"><div class="label"><span>Öğrenci ekle</span></div>
      <form id="addStudents" class="stack"><textarea id="names" rows="5" placeholder="Her satıra bir takma ad yaz&#10;Elif K.&#10;Mert A.&#10;Kartal" aria-label="Takma adlar"></textarea>
      <div class="row"><button class="btn btn--primary">Öğrencileri ekle ve PIN üret</button><span class="muted small">Gerçek ad-soyad yerine takma ad ya da ad + soyadın baş harfi.</span></div><div id="addMsg"></div></form></section>
    <section class="sheet"><div class="label"><span>Sınıftaki öğrenciler</span><span>${rows.length}</span></div>
      ${rows.length ? `<ul class="st-list">${rows.map((r) => `<li><span class="st-name"><b>${esc(r.takma_ad)}</b><span class="pin-chip${r.pin ? "" : " none"}" title="${r.pin ? "PIN" : "PIN görünmüyor: yenile"}">PIN <code>${pinOf(r)}</code></span></span><span class="muted small">${r.son_giris ? "son giriş " + fmtWhen(r.son_giris) : "hiç girmedi"}</span>
        <span class="st-act"><button class="btn btn--sm" data-pin="${r.id}">PIN yenile</button>${others.length ? `<button class="btn btn--sm" data-move="${r.id}">Taşı</button>` : ""}<button class="btn btn--sm btn--quiet danger" data-del="${r.id}">Sil</button></span>
        <div class="move-row" id="mv-${r.id}" hidden><select aria-label="Hedef sınıf">${others.map((c) => `<option value="${c.id}">${esc(c.ad)} (${esc(c.kod)})</option>`).join("")}</select><button class="btn btn--sm btn--primary" data-moveok="${r.id}">Bu sınıfa taşı</button><span class="muted small">İlerlemesi ve PIN'i aynı kalır, girişte yeni sınıfın kodunu yazar.</span></div></li>`).join("")}</ul>` : `<p class="muted">Henüz öğrenci yok.</p>`}
    </section>
    ${CL.cls && (CL.cls.benim || cloud.me.mudur) ? "" : "<!--"}<section class="sheet danger-zone"><div class="label"><span>Sınıfı sil</span></div><p class="muted small">Sınıf, içindeki bütün öğrenciler ve ilerleme kayıtları kalıcı olarak silinir.</p><button class="btn btn--quiet danger" id="delClass">Sınıfı sil</button></section>${CL.cls && (CL.cls.benim || cloud.me.mudur) ? "" : "-->"}`;
}
async function reloadRows() { CL.data = (await teacherApi.rapor(CL.id)).map((x) => ({ ...x, o: ozet(x.veri) })); }

/* İki aşamalı onay: ilk tıklamada "Emin misin?" olur, 4 sn içinde ikinci tıklama işlemi yapar */
function confirmBtn(b, label, fn) {
  b.onclick = async () => {
    if (!b.dataset.arm) { b.dataset.arm = "1"; const old = b.innerHTML; b.innerHTML = label; b.classList.add("armed"); setTimeout(() => { if (b.isConnected) { delete b.dataset.arm; b.innerHTML = old; b.classList.remove("armed"); } }, 4000); return; }
    b.disabled = true; try { await fn(); } catch (e) { alertBox(hataMetni(e)); b.disabled = false; }
  };
}
function alertBox(t) { const m = $("#addMsg") || $("#copyMsg"); if (m) m.innerHTML = `<div class="fb fb--bad"><p>${t}</p></div>`; }

function bindClass() {
  if ($("#refresh")) $("#refresh").onclick = () => showClass(CL.id);
  $$("[data-open]").forEach((b) => { b.onclick = () => { CL.open = CL.open === b.dataset.open ? null : b.dataset.open; renderClass(); }; });
  if ($("#addStudents")) $("#addStudents").onsubmit = async (e) => {
    e.preventDefault();
    const names = $("#names").value.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const b = $("button", e.target); b.disabled = true;
    try {
      const r = await teacherApi.ogrenciEkle(CL.id, names);
      CL.skipped = r.atlanan; CL.show = true;
      CL.flash = r.eklenen.length ? `<b>${r.eklenen.length} öğrenci eklendi.</b> PIN'leri aşağıdaki kartlarda; istediğin zaman bu sekmeden yeniden yazdırabilirsin.` : "Kimse eklenmedi.";
      await reloadRows(); renderClass();
    } catch (er) { $("#addMsg").innerHTML = `<div class="fb fb--bad"><p>${hataMetni(er)}</p></div>`; b.disabled = false; }
  };
  $$("[data-pin]").forEach((b) => confirmBtn(b, "Yeni PIN üretilsin mi?", async () => {
    const r = await teacherApi.pinYenile(b.dataset.pin); CL.skipped = [];
    CL.flash = `<b>${esc(r.takma_ad)}</b> için yeni PIN: <code class="pin-big">${esc(r.pin)}</code> · Eski PIN artık çalışmaz, açık oturumları da kapandı.`;
    await reloadRows(); renderClass();
  }));
  $$("[data-del]").forEach((b) => confirmBtn(b, "Emin misin? Silinecek", async () => {
    await teacherApi.ogrenciSil(b.dataset.del); CL.data = CL.data.filter((r) => r.id !== b.dataset.del); renderClass();
  }));
  $$("[data-move]").forEach((b) => { b.onclick = () => { const r = $("#mv-" + b.dataset.move); r.hidden = !r.hidden; }; });
  $$("[data-moveok]").forEach((b) => { b.onclick = async () => {
    const id = b.dataset.moveok, hedef = $("select", $("#mv-" + id)).value; b.disabled = true;
    try { await teacherApi.ogrenciTasi(id, hedef); CL.data = CL.data.filter((r) => r.id !== id); CL.all = await teacherApi.siniflar(); renderClass(); }
    catch (e) { $("#addMsg").innerHTML = `<div class="fb fb--bad"><p>${hataMetni(e)}</p></div>`; b.disabled = false; }
  }; });
  if ($("#delClass") && canManage()) confirmBtn($("#delClass"), "Emin misin? Her şey silinecek", async () => { await teacherApi.sinifSil(CL.id); CL = { id: null }; location.hash = "ogretmen"; });
  if ($("#togglePins")) $("#togglePins").onclick = () => { CL.show = !CL.show; renderClass(); };
  if ($("#renewMissing")) confirmBtn($("#renewMissing"), "Emin misin? Yeni PIN'ler üretilecek", async () => {
    const list = CL.data.filter((r) => !r.pin);
    for (const r of list) await teacherApi.pinYenile(r.id);
    CL.show = true; CL.skipped = []; CL.flash = `<b>${list.length} öğrenciye yeni PIN üretildi.</b> Kartları yazdırıp dağıtabilirsin.`;
    await reloadRows(); renderClass();
  });
  if ($("#printPins")) $("#printPins").onclick = () => { document.body.classList.add("print-pins"); window.print(); setTimeout(() => document.body.classList.remove("print-pins"), 500); };
  if ($("#copyPins")) $("#copyPins").onclick = async () => {
    const txt = `Python Atölyesi · ${CL.cls.ad} · Sınıf kodu: ${CL.cls.kod}\n` + CL.data.filter((p) => p.pin).map((p) => `${p.takma_ad}\tPIN: ${p.pin}`).join("\n");
    try { await navigator.clipboard.writeText(txt); $("#copyMsg").innerHTML = `<p class="muted small">Kopyalandı.</p>`; }
    catch (_) { $("#copyMsg").innerHTML = `<textarea class="copy-fallback" rows="6" readonly>${esc(txt)}</textarea>`; $("#copyMsg textarea").select(); }
  };
}

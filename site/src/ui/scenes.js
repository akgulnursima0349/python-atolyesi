/* =====================================================================
   KAVRAM SAHNELERİ — derslerdeki uzun açıklamaların yerine oynanabilir küçük sahneler.
   Her sahne: (host) => temizleme fonksiyonu
   ===================================================================== */
import { Atolye } from "../engine/atolye.js";
import { $, $$, esc, icon } from "./core.js";

const say = (host, h) => { const b = $(".sc-say", host); if (b) b.innerHTML = h; };
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Harfler 0 ve 1 olunca ---------- */
function ikilik(host) {
  host.innerHTML = `<div class="sc">
    <label class="sc-field">Bir kelime yaz <input id="bkW" maxlength="8" value="Robot" spellcheck="false"></label>
    <div class="bits" id="bkOut"></div>
    <div class="sc-say"></div></div>`;
  const inp = $("#bkW", host);
  function draw() {
    const w = Array.from(inp.value.slice(0, 8));
    $("#bkOut", host).innerHTML = w.map((ch, k) => {
      const n = ch.codePointAt(0), b = n.toString(2).padStart(n > 255 ? 16 : 8, "0");
      return `<div class="bit-row" style="--d:${k * 80}ms"><span class="bit-ch">${esc(ch === " " ? "␣" : ch)}</span><span class="bit-n">${n}</span><span class="bit-lamps">${Array.from(b).map((x, j) => `<i class="${x === "1" ? "on" : ""}" style="--j:${j}"></i>`).join("")}</span><code>${b}</code></div>`;
    }).join("") || `<p class="muted small">Bir şey yaz.</p>`;
    const total = w.reduce((a, ch) => a + (ch.codePointAt(0) > 255 ? 16 : 8), 0);
    say(host, w.length ? `Her harfin bir <b>numarası</b> var (R = 82). Bilgisayar bu numarayı <b>yanan (1) ve sönük (0) lambalarla</b> saklar. "${esc(inp.value)}" kelimesi için tam <b>${total} lamba</b> gerekiyor.${w.some((c) => c.codePointAt(0) > 255) ? " Türkçe harflerin (ğ, ş, ı…) numarası büyük olduğu için daha çok lamba istiyor." : ""}` : "");
  }
  inp.oninput = draw; draw();
  return () => {};
}

/* ---------- 2. Dil merdiveni ---------- */
const LADDER = [
  { ad: "Python", seviye: "Yüksek seviye", kod: `print("Merhaba")`, not: "Tek satır. Neredeyse İngilizce bir cümle gibi okunuyor." },
  { ad: "C++ (Arduino)", seviye: "Orta seviye", kod: `#include <iostream>\nint main() {\n  std::cout << "Merhaba";\n  return 0;\n}`, not: "Aynı iş için 5 satır. Tipler, parantezler, noktalı virgüller var." },
  { ad: "Assembly", seviye: "Düşük seviye", kod: `mov edx, 7\nmov ecx, mesaj\nmov ebx, 1\nmov eax, 4\nint 0x80`, not: "Artık işlemcinin komutlarıyla konuşuyoruz: hangi kutuya ne konacağını tek tek söylemek gerek." },
  { ad: "Makine dili", seviye: "En alt", kod: `10111010 00000111 00000000\n10111001 00001000 10010000\n10111011 00000001 00000000\n10111000 00000100 00000000\n11001101 10000000`, not: "Sadece 0 ve 1. İşlemcinin doğrudan anladığı tek dil bu. İnsan için okumak neredeyse imkânsız." }
];
function merdiven(host) {
  let k = 0;
  host.innerHTML = `<div class="sc"><div class="ladder2" id="ld"></div>
    <div class="row"><button class="btn" data-a="up">↑ Yukarı çık</button><button class="btn btn--primary" data-a="down">↓ Bir basamak in</button></div><div class="sc-say"></div></div>`;
  function draw() {
    $("#ld", host).innerHTML = LADDER.map((L, i) => `<div class="ld-step${i === k ? " cur" : ""}${i < k ? " past" : ""}" style="--i:${i}">
      <div class="ld-head"><b>${L.ad}</b><span>${L.seviye}</span></div>
      ${i === k ? `<pre class="ld-code">${esc(L.kod)}</pre>` : ""}</div>`).join("");
    say(host, `<b>${LADDER[k].ad}:</b> ${LADDER[k].not}`);
    $('[data-a="up"]', host).disabled = k === 0; $('[data-a="down"]', host).disabled = k === LADDER.length - 1;
  }
  host.onclick = (e) => { const b = e.target.closest("[data-a]"); if (!b) return; k += b.dataset.a === "down" ? 1 : -1; draw(); };
  draw();
  return () => {};
}

/* ---------- 3. Derleyici ve yorumlayıcı yarışı ---------- */
function derleyici(host) {
  let alive = true, hata = true;
  const kod = () => [`print("1")`, `print("2")`, hata ? `print(sayi)` : `print("3")`, `print("4")`];
  host.innerHTML = `<div class="sc">
    <label class="sc-check"><input type="checkbox" id="dkFix"> Hatalı satırı düzelt (<code>sayi</code> yerine <code>"3"</code>)</label>
    <div class="race">
      ${["Derleyici · Arduino'daki gibi", "Yorumlayıcı · Python'daki gibi"].map((t, j) => `<div class="lane" data-j="${j}"><h4>${t}</h4><ol class="lane-code"></ol>
        <div class="lane-bar"><i></i><span></span></div><div class="lane-out"></div></div>`).join("")}
    </div>
    <div class="row"><button class="btn btn--primary" id="dkGo">${icon("play")} Yarışı başlat</button></div><div class="sc-say"></div></div>`;
  const lanes = $$(".lane", host);
  function reset() {
    lanes.forEach((ln) => { $(".lane-code", ln).innerHTML = kod().map((l) => `<li><code>${esc(l)}</code></li>`).join(""); $(".lane-bar i", ln).style.width = "0"; $(".lane-bar span", ln).textContent = ""; $(".lane-out", ln).innerHTML = ""; });
    say(host, `Aynı 4 satırlık program iki farklı yöntemle çalışacak. ${hata ? "3. satırda bir hata var: <code>sayi</code> diye bir kutu yok." : "Şimdi programda hata yok."} Ne olacağını tahmin et, sonra yarışı başlat.`);
  }
  const mark = (ln, i, c) => { const li = $$(".lane-code li", ln)[i]; if (li) li.className = c; };
  const out = (ln, h) => { $(".lane-out", ln).insertAdjacentHTML("beforeend", h); };
  async function compiler(ln) {
    const lines = kod(), bar = $(".lane-bar i", ln), lab = $(".lane-bar span", ln);
    lab.textContent = "Çeviriliyor…";
    for (let i = 0; i < lines.length; i++) {
      if (!alive) return; mark(ln, i, "scan"); bar.style.width = ((i + 1) / lines.length * 100) + "%"; await T(reduced() ? 0 : 650);
      if (hata && i === 2) { mark(ln, i, "bad"); lab.textContent = "Çeviri durdu"; out(ln, `<div class="err">3. satırda hata! Program karta <b>hiç yüklenmedi</b>, tek satır bile çalışmadı.</div>`); return "hata"; }
      mark(ln, i, "ok");
    }
    lab.textContent = "Çeviri bitti, çalışıyor"; await T(reduced() ? 0 : 300);
    for (let i = 0; i < lines.length; i++) { if (!alive) return; out(ln, `<div>${i + 1}</div>`); await T(reduced() ? 0 : 120); }
    lab.textContent = "Bitti"; return "tamam";
  }
  async function interp(ln) {
    const lines = kod(), bar = $(".lane-bar i", ln), lab = $(".lane-bar span", ln);
    lab.textContent = "Satır satır çalışıyor";
    for (let i = 0; i < lines.length; i++) {
      if (!alive) return; mark(ln, i, "scan"); await T(reduced() ? 0 : 650); bar.style.width = ((i + 1) / lines.length * 100) + "%";
      if (hata && i === 2) { mark(ln, i, "bad"); lab.textContent = "Durdu"; out(ln, `<div class="err">3. satırda hata, program burada durdu. Ama 1 ve 2 <b>çoktan yazıldı</b>.</div>`); return "hata"; }
      mark(ln, i, "ok"); out(ln, `<div>${i + 1}</div>`);
    }
    lab.textContent = "Bitti"; return "tamam";
  }
  $("#dkFix", host).onchange = (e) => { hata = !e.target.checked; reset(); };
  $("#dkGo", host).onclick = async (e) => {
    e.target.disabled = true; reset();
    await Promise.all([compiler(lanes[0]), interp(lanes[1])]);
    if (!alive) return;
    say(host, hata ? `<b>Derleyici</b> önce programın tamamını çevirir; hatayı bulunca hiçbir şey çalıştırmaz. <b>Yorumlayıcı</b> satır satır gider: hataya kadar olan satırlar çalışır, sonra durur.`
      : `Hata yokken ikisi de aynı sonucu verir. <b>Derleyici</b> önce bekletir ama sonra çok hızlı çalışır. <b>Yorumlayıcı</b> hemen başlar; bu yüzden Python'da bir satırı değiştirip hemen deneyebiliriz.`);
    e.target.disabled = false;
  };
  reset();
  return () => { alive = false; };
}

/* ---------- 4. range kurucu ---------- */
function rangeKur(host) {
  const st = { a: 0, b: 5, c: 1 };
  host.innerHTML = `<div class="sc">
    <div class="rg-ctl">${[["a", "başla", 0, 10], ["b", "dur", 1, 15], ["c", "adım", 1, 5]].map(([k, l, mn, mx]) => `<label class="rg-${k}">${l} <b id="rgv-${k}">${st[k]}</b><input type="range" min="${mn}" max="${mx}" value="${st[k]}" data-k="${k}"></label>`).join("")}</div>
    <div class="rg-codes"><div><span class="rg-lang">Python</span><code id="rgPy"></code></div><div><span class="rg-lang">Arduino (C++)</span><code id="rgCpp"></code></div></div>
    <div class="rg-line" id="rgLine"></div><div class="sc-say"></div></div>`;
  function draw() {
    const { a, b, c } = st, nums = []; for (let i = a; i < b; i += c) nums.push(i);
    $("#rgPy", host).innerHTML = `<span class="kw">for</span> i <span class="kw">in</span> range(<span class="ca">${a}</span>, <span class="cb">${b}</span>, <span class="cc">${c}</span>):`;
    $("#rgCpp", host).innerHTML = `<span class="kw">for</span> (int i = <span class="ca">${a}</span>; i &lt; <span class="cb">${b}</span>; i += <span class="cc">${c}</span>) {`;
    const max = Math.max(b, 15);
    $("#rgLine", host).innerHTML = Array.from({ length: max + 1 }, (_, n) => {
      const on = nums.includes(n), stop = n === b;
      return `<span class="rg-n${on ? " on" : ""}${stop ? " stop" : ""}" style="--o:${nums.indexOf(n)}">${n}${on ? `<i>${nums.indexOf(n) + 1}. tur</i>` : stop ? "<i>dur</i>" : ""}</span>`;
    }).join("");
    say(host, nums.length ? `Döngü <b>${nums.length} kere</b> döner: i sırayla <b>${nums.join(", ")}</b> olur. ${b} sayısına <b>gelmeden</b> durur. Renkler, Python'daki sayıların C++'ta nereye karşılık geldiğini gösteriyor.` : `Başlangıç, durma sayısından küçük değil: döngü <b>hiç dönmez</b>.`);
  }
  $$("input[data-k]", host).forEach((r) => { r.oninput = () => { st[r.dataset.k] = +r.value; $("#rgv-" + r.dataset.k, host).textContent = r.value; draw(); }; });
  draw();
  return () => {};
}

/* ---------- 5. Girinti blokları ---------- */
function girinti(host) {
  const L = [{ t: `for i in range(3):`, ind: 0, fixed: true }, { t: `print("Merhaba")`, ind: 1 }, { t: `print("Bitti")`, ind: 0 }];
  host.innerHTML = `<div class="sc"><div class="gi-wrap"><div class="gi-code" id="giCode"></div><div><div class="tr-l">Çıktı</div><div class="tr-out" id="giOut"></div></div></div><div class="sc-say"></div></div>`;
  function draw() {
    const code = L.map((l) => "    ".repeat(l.ind) + l.t).join("\n") + "\n";
    $("#giCode", host).innerHTML = L.map((l, k) => `<div class="gi-ln${l.ind ? " in" : ""}"><span class="gi-txt" style="--ind:${l.ind}"><code>${esc(l.t)}</code></span>
      ${l.fixed ? "" : `<span class="gi-btns"><button class="btn btn--sm" data-k="${k}" data-d="-1"${l.ind ? "" : " disabled"} aria-label="Sola al">←</button><button class="btn btn--sm" data-k="${k}" data-d="1"${l.ind ? " disabled" : ""} aria-label="İçeri it">→</button></span>`}</div>`).join("");
    const r = Atolye.runSnippet(code), o = $("#giOut", host);
    o.innerHTML = r.error ? `<span class="err-t">${r.error.type}</span>\n<span class="note">${r.error.msg}</span>` : r.out.map((x) => esc(x)).join("\n") || '<span class="note">(çıktı yok)</span>';
    const a = L[1].ind, b = L[2].ind;
    say(host, r.error ? `<b>Hata!</b> <code>:</code> ile biten satırın altında en az bir satır <b>içeride</b> olmalı. Python döngünün neyi tekrarlayacağını bilemiyor.`
      : a && b ? `İki <code>print</code> de içeride: ikisi de döngünün parçası, <b>3 kere</b> tekrar ediyor. "Bitti" her turda yazılıyor!`
      : a ? `Sadece "Merhaba" içeride: o <b>3 kere</b> yazılıyor, "Bitti" döngü bitince <b>bir kere</b>. Satırları sağa sola itip farkı gör.` : "");
  }
  host.onclick = (e) => { const b = e.target.closest("[data-k]"); if (!b) return; const l = L[+b.dataset.k]; l.ind = Math.max(0, Math.min(1, l.ind + +b.dataset.d)); draw(); };
  draw();
  return () => {};
}

/* ---------- 6. Robot fabrikası ---------- */
const COLORS = [["kırmızı", "#d7262e"], ["mavi", "#3a73e0"], ["yeşil", "#2f9e44"], ["mor", "#7c5ce0"], ["turuncu", "#f08c00"]];
const NAMES = ["Volt", "Pırıl", "Bulut", "Kıvılcım", "Atom", "Fırtına"];
const robotSVG = (c) => `<svg viewBox="0 0 100 90" aria-hidden="true"><line x1="50" y1="6" x2="50" y2="16" stroke="${c}" stroke-width="3"/><circle cx="50" cy="5" r="4" fill="${c}"/><rect x="26" y="16" width="48" height="30" rx="8" fill="${c}"/><circle cx="40" cy="31" r="5" fill="#fff"/><circle cx="60" cy="31" r="5" fill="#fff"/><circle cx="41" cy="32" r="2.3" fill="#15171c"/><circle cx="61" cy="32" r="2.3" fill="#15171c"/><rect x="30" y="48" width="40" height="26" rx="6" fill="${c}" opacity=".85"/><rect x="40" y="55" width="20" height="8" rx="3" fill="#fff" opacity=".7"/><circle cx="36" cy="80" r="7" fill="#15171c" stroke="#8c93a8" stroke-width="2"/><circle cx="64" cy="80" r="7" fill="#15171c" stroke="#8c93a8" stroke-width="2"/></svg>`;
function fabrika(host) {
  let color = 0, bots = [], sel = null, ni = 0;
  host.innerHTML = `<div class="sc fab">
    <div class="mold"><div class="mold-icon">${robotSVG("#767d8f")}</div><pre><span class="kw">class</span> Robot:            <span class="cm"># kalıp</span>
  ad, renk          <span class="cm"># özellikler</span>
  pil = 100
  <span class="kw">def</span> ilerle(adim)  <span class="cm"># metot</span></pre></div>
    <form class="maker"><input maxlength="12" value="Şimşek" aria-label="Robotun adı"><span class="sw">${COLORS.map(([n, c], i) => `<button type="button" style="background:${c}" aria-label="${n}" aria-pressed="${i === 0}" data-c="${i}"></button>`).join("")}</span><button class="btn btn--primary">Üret</button></form>
    <div class="belt"><div class="empty">Bant boş. Kalıptan henüz nesne çıkmadı.</div></div>
    <div class="row"><button class="btn" data-go disabled>ilerle(2)</button><button class="btn" data-paint disabled>Rengini değiştir</button><span class="muted small" data-sel>Bir robota tıklayıp seç.</span></div>
    <div class="fab-log"><div class="cm"># Yaptığın her şeyin Python karşılığı burada yazılacak</div></div>
    <div class="sc-say">Fabrika hazır. Bir ad yaz, renk seç ve <b>Üret</b>'e bas.</div></div>`;
  const belt = $(".belt", host), log = (c, n) => { const d = document.createElement("div"); d.innerHTML = esc(c) + (n ? ` <span class="cm"># ${esc(n)}</span>` : ""); $(".fab-log", host).appendChild(d); $(".fab-log", host).scrollTop = 1e6; };
  const draw = (drop) => {
    belt.innerHTML = bots.length ? bots.map((b) => `<button class="bot${sel === b.id ? " sel" : ""}${drop === b.id ? " drop" : ""}" data-id="${b.id}" aria-pressed="${sel === b.id}">${robotSVG(COLORS[b.c][1])}<div class="nm">${esc(b.ad)}</div><div class="attrs">renk: ${COLORS[b.c][0]}<br>pil: ${b.pil}</div><div class="battery"><i style="width:${b.pil}%;background:${b.pil > 30 ? "#4ade80" : "#f87171"}"></i></div></button>`).join("") : `<div class="empty">Bant boş.</div>`;
  };
  $(".sw", host).onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b) return; color = +b.dataset.c; $$(".sw button", host).forEach((x) => x.setAttribute("aria-pressed", x === b)); };
  $(".maker", host).onsubmit = (e) => {
    e.preventDefault(); const inp = $(".maker input", host), ad = inp.value.trim() || NAMES[ni % NAMES.length], id = bots.length + 1;
    bots.push({ id, ad, c: color, pil: 100 }); draw(id); belt.classList.add("moving"); setTimeout(() => belt.classList.remove("moving"), 1100);
    log(`r${id} = Robot("${ad}", "${COLORS[color][0]}")`, bots.length === 1 ? "kalıptan ilk nesne" : "aynı kalıptan yeni nesne");
    say(host, bots.length === 1 ? `Kalıptan ilk <b>nesne</b> çıktı: <b>${esc(ad)}</b>. Pili 100 ile başladı, çünkü kalıpta öyle yazıyor.` : `<b>${bots.length} robot</b> var ama kalıp hâlâ <b>bir tane</b>. Hepsinin ad, renk ve pil özelliği var; değerleri her birinde farklı.`);
    inp.value = NAMES[ni++ % NAMES.length];
  };
  belt.onclick = (e) => { const b = e.target.closest(".bot"); if (!b) return; sel = +b.dataset.id; draw(); $("[data-go]", host).disabled = $("[data-paint]", host).disabled = false; $("[data-sel]", host).textContent = "Seçili nesne: r" + sel; say(host, `<b>r${sel}</b> seçildi. Şimdi yapacağın her şey <b>sadece bu nesneyi</b> değiştirecek.`); };
  $("[data-go]", host).onclick = () => {
    const r = bots.find((x) => x.id === sel); if (!r) return;
    if (r.pil < 20) { log(`r${r.id}.ilerle(2)`, "pil yetersiz!"); say(host, `<b>${esc(r.ad)}</b> ilerleyemiyor: pili yetmiyor.`); return; }
    r.pil -= 20; draw(); const el = $(`.bot[data-id="${r.id}"]`, host); if (el) el.classList.add("go");
    log(`r${r.id}.ilerle(2)`, `r${r.id}.pil şimdi ${r.pil}`);
    const o = bots.find((x) => x.id !== r.id);
    say(host, `<b>ilerle</b> bir <b>metot</b>: nesnenin yapabildiği bir iş. Sadece <b>${esc(r.ad)}</b> robotunun pili azaldı, şimdi ${r.pil}.` + (o ? ` ${esc(o.ad)} hâlâ ${o.pil}.` : " Bir robot daha üretip farkı gör."));
  };
  $("[data-paint]", host).onclick = () => { const r = bots.find((x) => x.id === sel); if (!r) return; r.c = (r.c + 1) % COLORS.length; draw(); log(`r${r.id}.renk = "${COLORS[r.c][0]}"`, "özelliği değiştir"); say(host, `<b>renk</b> bir <b>özellik</b>. Değiştirince kalıp değişmez: yeni robotlar yine seçtiğin renkle çıkar.`); };
  return () => {};
}

/* ---------- 7. Colab hücreleri ---------- */
function hucre(host) {
  const CELLS = [`isim = "Ece"`, `sayac = 0`, `sayac = sayac + 1\nprint(isim, sayac)`];
  let ran = [], count = 0;
  host.innerHTML = `<div class="sc"><div class="cells">${CELLS.map((c, i) => `<div class="cell" data-i="${i}"><button class="cell-run" data-run="${i}" aria-label="${i + 1}. hücreyi çalıştır">${icon("play")}</button><span class="cell-n">[ ]</span><pre>${esc(c)}</pre><div class="cell-out"></div></div>`).join("")}</div>
    <div class="cell-mem"><div class="tr-l">Colab'ın hafızası</div><div class="tr-frame" id="clMem"><span class="muted small">Boş. Henüz hiçbir hücre çalışmadı.</span></div>
    <button class="btn btn--sm" id="clReset">${icon("reset")} Çalışma zamanını yeniden başlat</button></div><div class="sc-say">Hücreleri <b>istediğin sırayla</b> çalıştır. Önce 3. hücreyi denemek ister misin?</div></div>`;
  function run(i) {
    const prefix = ran.map((k) => CELLS[k]).join("\n"), full = (prefix ? prefix + "\n" : "") + "print('@@SINIR@@')\n" + CELLS[i] + "\n";
    const r = Atolye.trace(full, {}, 2000), outs = r.out.join("\n").split("@@SINIR@@\n"), mine = (outs[1] || "").replace(/\n$/, "");
    const cell = $(`.cell[data-i="${i}"]`, host); count++;
    $(".cell-n", cell).textContent = `[${count}]`;
    if (r.error) {
      $(".cell-out", cell).innerHTML = `<span class="err-t">${esc(r.error.type)}</span> ${r.error.msg}`;
      say(host, `<b>Hata!</b> Bu hücre, Colab'ın hafızasında henüz olmayan bir kutuyu kullanmaya çalıştı. Kutuyu oluşturan hücreyi <b>önce</b> çalıştırmalısın.`);
    } else {
      ran.push(i); $(".cell-out", cell).textContent = mine;
      say(host, i === 2 && ran.filter((k) => k === 2).length > 1 ? `Aynı hücreyi bir daha çalıştırdın: <b>sayac</b> kaldığı yerden bir arttı. Colab hafızayı <b>silmez</b>, hücreler hafızayı paylaşır.` : `Hücre çalıştı. Oluşturduğu kutular Colab'ın hafızasına eklendi; diğer hücreler de bunları kullanabilir.`);
    }
    const end = r.end.frames[0] ? r.end.frames[0].vars : {};
    const mem = Object.entries(r.error ? lastVars : end); if (!r.error) lastVars = end;
    $("#clMem", host).innerHTML = mem.length ? mem.map(([k, v]) => `<div class="tr-var"><span class="tr-vn">${esc(k)}</span><span class="tv">${esc(v.r || "…")}</span></div>`).join("") : `<span class="muted small">Boş.</span>`;
  }
  let lastVars = {};
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-run]"); if (b) run(+b.dataset.run);
    if (e.target.closest("#clReset")) { ran = []; count = 0; lastVars = {}; $$(".cell-n", host).forEach((x) => { x.textContent = "[ ]"; }); $$(".cell-out", host).forEach((x) => { x.innerHTML = ""; }); $("#clMem", host).innerHTML = `<span class="muted small">Boş. Hafıza silindi.</span>`; say(host, `Çalışma zamanı yeniden başladı: hafıza <b>tamamen silindi</b>. Hücreleri yine baştan, sırayla çalıştırman gerekiyor.`); }
  });
  return () => {};
}

/* ---------- 8. Dilimleme ---------- */
function pySlice(n, a, b, c) {
  const norm = (x, def) => (x == null ? def : x < 0 ? Math.max(x + n, c < 0 ? -1 : 0) : Math.min(x, c < 0 ? n - 1 : n));
  const out = [];
  if (c > 0) { for (let i = norm(a, 0); i < norm(b, n); i += c) out.push(i); }
  else { for (let i = norm(a, n - 1); i > norm(b, -1); i += c) out.push(i); }
  return out;
}
function dilim(host) {
  const st = { w: "Python", a: 0, b: 6, c: 1, na: false, nb: false };
  host.innerHTML = `<div class="sc">
    <label class="sc-field">Kelime <input id="dlW" maxlength="14" value="${st.w}" spellcheck="false"></label>
    <div class="dl-tiles" id="dlT"></div>
    <div class="rg-ctl">
      <label class="rg-a">başla <b id="dlva"></b><input type="range" data-k="a"><span class="sc-check small"><input type="checkbox" data-n="na"> boş bırak</span></label>
      <label class="rg-b">bitiş <b id="dlvb"></b><input type="range" data-k="b"><span class="sc-check small"><input type="checkbox" data-n="nb"> boş bırak</span></label>
      <label class="rg-c">adım <b id="dlvc"></b><input type="range" data-k="c" min="-3" max="3"></label></div>
    <div class="dl-res"><code id="dlE"></code><span>→</span><code id="dlR"></code></div><div class="sc-say"></div></div>`;
  const ranges = { a: $('input[data-k="a"]', host), b: $('input[data-k="b"]', host), c: $('input[data-k="c"]', host) };
  function draw() {
    const n = st.w.length;
    ranges.a.min = -n; ranges.a.max = n; ranges.b.min = -n; ranges.b.max = n;
    ["a", "b", "c"].forEach((k) => { ranges[k].value = st[k]; $("#dlv" + k, host).textContent = (k === "a" && st.na) || (k === "b" && st.nb) ? "boş" : st[k]; });
    if (st.c === 0) st.c = 1;
    const idx = pySlice(n, st.na ? null : st.a, st.nb ? null : st.b, st.c);
    $("#dlT", host).innerHTML = Array.from(st.w).map((ch, i) => { const o = idx.indexOf(i); return `<span class="dl-t${o >= 0 ? " on" : ""}" style="--o:${o}"><i>${i}</i><b>${esc(ch)}</b><i>${i - n}</i>${o >= 0 ? `<em>${o + 1}.</em>` : ""}</span>`; }).join("");
    const exp = `kelime[${st.na ? "" : st.a}:${st.nb ? "" : st.b}${st.c !== 1 ? ":" + st.c : ""}]`, res = idx.map((i) => st.w[i]).join("");
    $("#dlE", host).textContent = exp; $("#dlR", host).textContent = JSON.stringify(res);
    say(host, `Üstteki sayılar soldan, alttaki <b>eksi</b> sayılar sağdan sayar. ${st.c < 0 ? "Adım eksi olunca kelime <b>tersten</b> okunur." : "Başlangıçtaki harf dahil, bitişteki harf <b>dahil değil</b>."} Sonuç: <b>${idx.length} harf</b>.`);
  }
  $("#dlW", host).oninput = (e) => { st.w = e.target.value || "a"; st.b = Math.min(st.b, st.w.length); draw(); };
  Object.entries(ranges).forEach(([k, r]) => { r.oninput = () => { st[k] = +r.value; if (k === "a") st.na = false; if (k === "b") st.nb = false; $$("input[data-n]", host).forEach((x) => { x.checked = st[x.dataset.n]; }); draw(); }; });
  $$("input[data-n]", host).forEach((x) => { x.onchange = () => { st[x.dataset.n] = x.checked; draw(); }; });
  draw();
  return () => {};
}

export const SCENES = { ikilik, merdiven, derleyici, range: rangeKur, girinti, fabrika, hucre, dilim };
export function mountScene(host, id) {
  const f = SCENES[id]; if (!f || !host) return () => {};
  return f(host);
}

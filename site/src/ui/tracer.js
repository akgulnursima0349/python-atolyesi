/* =====================================================================
   ADIM ADIM KOD İZLEYİCİ
   Öğrencinin kodunu satır satır gösterir: sarı ok sıradaki satır, gri ok az önce
   çalışan satır. Değişkenler kutu olarak, fonksiyonlar ayrı çerçeve olarak,
   listeler vagon vagon, nesneler kart olarak çizilir. Her adımda ne olduğunu
   kısa bir Türkçe cümle anlatır.
   ===================================================================== */
import { Atolye } from "../engine/atolye.js";
import { $, $$, esc, icon } from "./core.js";

const SPEEDS = [["Yavaş", 1900], ["Normal", 1100], ["Hızlı", 450]];

/* ---------- kodun yapısı: girinti, döngü başlıkları, fonksiyon adları ---------- */
function structure(code) {
  const lines = code.split("\n");
  const ind = lines.map((l) => (l.trim() ? l.match(/^\s*/)[0].length : -1));
  const up = (ln, re) => {
    const i0 = ln - 1; if (i0 < 0 || ind[i0] < 0) return null;
    let need = ind[i0];
    for (let i = i0 - 1; i >= 0; i--) {
      if (ind[i] < 0 || ind[i] >= need) continue;
      need = ind[i];
      const m = re.exec(lines[i].trim());
      if (m) return { line: i + 1, m };
    }
    return null;
  };
  return {
    lines,
    loopOf: (ln) => up(ln, /^(for|while)\b(.*)$/),
    fnOf: (ln) => { const r = up(ln, /^def\s+(\w+)\s*\(/); return r ? r.m[1] : null; },
    isLoop: (ln) => /^(for|while)\b/.test((lines[ln - 1] || "").trim())
  };
}

/* Skulpt bir döngünün başlık satırında ikinci kez durmaz. Döngünün yeni turu
   başladığında (aynı derinlikte satır geriye gittiğinde) başlık için bir adım ekleriz. */
function buildSteps(code, raw) {
  const S = structure(code), out = [], last = [];
  raw.steps.forEach((st) => {
    const d = st.frames.length, top = st.frames[d - 1].line;
    last.length = Math.min(last.length, d + 1);
    const prev = last[d];
    if (prev != null && top <= prev) {
      const loop = S.loopOf(top);
      if (loop && loop.line !== top) {
        out.push({ ...st, line: loop.line, frames: st.frames.map((f, i) => (i === d - 1 ? { ...f, line: loop.line } : f)), loopHead: true });
        last[d] = top; out.push({ ...st, afterHead: true }); return;
      }
    }
    last[d] = top;
    out.push(st);
  });
  out.push({ ...raw.end, end: true, error: raw.error });
  return { S, steps: out };
}

/* ---------- değerlerin çizimi ---------- */
const key = (v) => JSON.stringify(v);
function valueHtml(v, small) {
  if (!v) return "";
  switch (v.t) {
    case "int": case "float": return `<span class="tv tv-num">${esc(v.r)}</span>`;
    case "str": return `<span class="tv tv-str">${esc(v.r)}</span>`;
    case "bool": return `<span class="tv tv-bool ${v.r === "True" ? "is-t" : "is-f"}">${v.r}</span>`;
    case "none": return `<span class="tv tv-none">None</span>`;
    case "list": case "tuple":
      return `<span class="tv-list${v.t === "tuple" ? " is-tuple" : ""}">${v.items.map((x, i) => `<span class="tv-cell"><i>${i}</i>${valueHtml(x, true)}</span>`).join("")}${v.n > v.items.length ? `<span class="tv-more">+${v.n - v.items.length}</span>` : ""}${!v.n ? `<span class="tv-empty">boş liste</span>` : ""}</span>`;
    case "dict":
      return `<span class="tv-dict">${v.entries.map(([k, x]) => `<span class="tv-kv">${valueHtml(k, true)}<b>→</b>${valueHtml(x, true)}</span>`).join("")}${!v.n ? `<span class="tv-empty">boş sözlük</span>` : ""}</span>`;
    case "obj":
      return `<span class="tv-obj"><em>${esc(v.cls)} nesnesi</em>${v.attrs.map(([k, x]) => `<span class="tv-kv"><code>${esc(k)}</code>${valueHtml(x, true)}</span>`).join("")}</span>`;
    case "func": case "class": case "module": return `<span class="tv tv-pill">${esc(v.r)}</span>`;
    default: return `<span class="tv">${esc(v.r || "?")}</span>`;
  }
}
const short = (v) => (!v ? "" : v.r != null ? v.r : v.t === "list" ? "[" + v.items.map(short).join(", ") + (v.n > v.items.length ? ", …" : "") + "]" : v.t === "dict" ? "{…}" : v.t === "obj" ? v.cls + " nesnesi" : "…");

/* ---------- anlatım: iki adım arasında ne değişti? ---------- */
function narrate(S, prev, cur, i) {
  if (cur.end) {
    if (cur.error) return `<b>Program hata verdi ve durdu.</b> ${cur.error.msg}`;
    return `<b>Program bitti.</b> ${cur.out.length ? "Ekranda gördüklerin, programın yazdırdığı her şey." : "Ekrana hiçbir şey yazdırılmadı."}`;
  }
  if (!prev) return `Program başlıyor. <b>Sarı ok</b> sıradaki çalışacak satırı gösterir. <b>İleri</b>'ye her bastığında bir satır çalışır.`;
  const parts = [], pd = prev.frames.length, cd = cur.frames.length;
  if (cd > pd) {
    const fn = S.fnOf(cur.line) || "fonksiyon";
    const args = Object.entries(cur.frames[cd - 1].vars).map(([k, v]) => `${k} = ${short(v)}`).join(", ");
    parts.push(`<b>${esc(fn)}</b> fonksiyonuna girildi${args ? ` (${esc(args)})` : ""}. Fonksiyonun kutuları ayrı bir çerçevede durur.`);
  } else if (cd < pd) {
    parts.push(`Fonksiyon bitti; sonucu, çağrıldığı satıra geri döndü. Fonksiyonun kutuları silindi.`);
  }
  const depth = Math.min(pd, cd);
  for (let f = 0; f < depth; f++) {
    const a = prev.frames[f].vars, b = cur.frames[f].vars;
    Object.keys(b).forEach((k) => {
      if (b[k].t === "func" || b[k].t === "class" || b[k].t === "module") { if (!(k in a)) parts.push(`<b>${esc(k)}</b> tanımlandı: artık çağrılabilir.`); return; }
      if (!(k in a)) parts.push(`Yeni kutu: <b>${esc(k)}</b> = <code>${esc(short(b[k]))}</code>`);
      else if (key(a[k]) !== key(b[k])) {
        if (cur.loopHead) parts.unshift(`Döngü başa döndü: <b>${esc(k)}</b> artık <code>${esc(short(b[k]))}</code>.`);
        else parts.push(`<b>${esc(k)}</b> değişti: <code>${esc(short(a[k]))}</code> → <code>${esc(short(b[k]))}</code>`);
      }
    });
  }
  const newOut = cur.out.slice(prev.out.length);
  if (cur.out.length === prev.out.length && cur.out.length && cur.out[cur.out.length - 1] !== prev.out[prev.out.length - 1]) newOut.push(cur.out[cur.out.length - 1]);
  if (newOut.length) parts.push(`Ekrana yazıldı: <code>${esc(newOut.join(" ⏎ "))}</code>`);
  if (cur.loopHead && !parts.some((p) => p.startsWith("Döngü"))) parts.unshift(`Döngünün başına dönüldü: koşul tekrar kontrol ediliyor.`);
  if (!parts.length && cur.afterHead) parts.push(`Döngünün içi bir tur daha çalışacak.`);
  if (!parts.length) {
    const t = (S.lines[prev.line - 1] || "").trim();
    if (/^(if|elif)\b/.test(t)) parts.push(`Koşul kontrol edildi ve ${cur.line === prev.line + 1 ? "<b>doğru</b> çıktı: içindeki satıra geçiliyor." : "sonuca göre başka bir satıra atlandı."}`);
    else if (/^else\b/.test(t)) parts.push(`Koşul yanlıştı, <b>else</b> kısmı çalışıyor.`);
    else if (/^def\b/.test(t)) parts.push(`Fonksiyon tanımlandı ama içi henüz çalışmadı. Çağrılınca çalışacak.`);
    else parts.push(`Satır çalıştı, kutularda bir değişiklik olmadı.`);
  }
  return parts.join(" ");
}

/* ---------- bileşen ---------- */
export function mountTracer(host, { code, builtins, note }) {
  const raw = Atolye.trace(code, builtins, 400);
  if (!raw.steps.length && raw.error) {
    host.innerHTML = `<div class="fb fb--bad"><h3>${icon("x")}Kod izlenemedi</h3><p>${raw.error.msg}</p><p class="muted small">Önce kodundaki hatayı düzelt, sonra tekrar izle.</p></div>`;
    return { destroy() {} };
  }
  const { S, steps } = buildSteps(code, raw);
  let i = 0, timer = null, speed = 1;
  host.innerHTML = `<div class="tr" tabindex="0" aria-label="Adım adım kod izleyici">
    ${note ? `<p class="tr-note">${note}</p>` : ""}
    <div class="tr-main">
      <div class="tr-code" aria-label="Kod">${S.lines.map((l, k) => `<div class="tr-ln" data-l="${k + 1}"><i>${k + 1}</i><b class="tr-arrow"></b><span>${esc(l) || " "}</span></div>`).join("")}</div>
      <div class="tr-side">
        <div><div class="tr-l">Değişken kutuları</div><div class="tr-frames" id="trFrames"></div></div>
        <div><div class="tr-l">Ekran</div><div class="tr-out" id="trOut"></div></div>
      </div>
    </div>
    <div class="tr-say" id="trSay" aria-live="polite"></div>
    <div class="tr-ctl">
      <button class="btn btn--sm" data-a="start" title="Baştan">${icon("reset")}</button>
      <button class="btn" data-a="back">← Geri</button>
      <button class="btn btn--primary" data-a="next">İleri →</button>
      <button class="btn" data-a="play">${icon("play")} Oynat</button>
      <button class="btn btn--quiet btn--sm" data-a="speed" title="Oynatma hızı">Hız: Normal</button>
      <input type="range" min="0" max="${steps.length - 1}" value="0" aria-label="Adım" class="tr-range">
      <span class="tr-n"></span>
    </div>
    ${raw.truncated ? `<p class="muted small">Bu program çok uzun sürüyor; ilk 400 adımı gösteriliyor.</p>` : ""}
  </div>`;
  const root = $(".tr", host), range = $(".tr-range", root);
  function frameHtml(st, prevSt) {
    return st.frames.map((f, fi) => {
      const pf = prevSt && prevSt.frames[fi], vars = Object.entries(f.vars);
      const title = fi === 0 ? "Ana program" : `${esc(S.fnOf(f.line) || "fonksiyon")}() çerçevesi`;
      const box = vars.map(([k, v]) => {
        const changed = pf && (!(k in pf.vars) || key(pf.vars[k]) !== key(v)) && !st.end;
        const plain = v.t === "func" || v.t === "class" || v.t === "module";
        return `<div class="tr-var${changed ? " chg" : ""}${plain ? " is-def" : ""}"><span class="tr-vn">${esc(k)}</span>${valueHtml(v)}</div>`;
      }).join("");
      return `<div class="tr-frame${fi === st.frames.length - 1 && fi > 0 ? " is-top" : ""}"><span class="tr-ft">${title}</span>${box || `<span class="muted small">Henüz kutu yok.</span>`}</div>`;
    }).join("") || `<span class="muted small">Henüz kutu yok.</span>`;
  }
  function render() {
    const st = steps[i], prev = steps[i - 1];
    $$(".tr-ln", root).forEach((el) => {
      const l = +el.dataset.l;
      el.classList.toggle("cur", !st.end && l === st.line);
      el.classList.toggle("was", !!prev && !prev.end && l === prev.line && (st.end || l !== st.line));
      el.classList.toggle("err", !!st.end && !!st.error && l === st.error.line);
    });
    const cur = $(".tr-ln.cur", root); if (cur) cur.scrollIntoView({ block: "nearest", inline: "nearest" });
    $("#trFrames", root).innerHTML = frameHtml(st, prev);
    $("#trOut", root).innerHTML = st.out.length ? st.out.map((l) => `<div>${esc(l) || "&nbsp;"}</div>`).join("") : `<span class="note">print() ile yazılanlar burada görünür.</span>`;
    $("#trSay", root).innerHTML = narrate(S, prev, st, i);
    range.value = i;
    $(".tr-n", root).textContent = st.end ? "Bitti" : `Adım ${i + 1} / ${steps.length - 1}`;
    $('[data-a="back"]', root).disabled = i === 0;
    $('[data-a="next"]', root).disabled = i === steps.length - 1;
  }
  const stop = () => { clearInterval(timer); timer = null; $('[data-a="play"]', root).innerHTML = icon("play") + " Oynat"; };
  const go = (n) => { i = Math.max(0, Math.min(steps.length - 1, n)); render(); };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "next") { stop(); go(i + 1); }
    if (a === "back") { stop(); go(i - 1); }
    if (a === "start") { stop(); go(0); }
    if (a === "speed") { speed = (speed + 1) % SPEEDS.length; b.textContent = "Hız: " + SPEEDS[speed][0]; if (timer) { stop(); play(); } }
    if (a === "play") { if (timer) stop(); else play(); }
  });
  function play() {
    if (i >= steps.length - 1) go(0);
    $('[data-a="play"]', root).innerHTML = "❚❚ Durdur";
    timer = setInterval(() => { if (i >= steps.length - 1) return stop(); go(i + 1); }, SPEEDS[speed][1]);
  }
  range.oninput = () => { stop(); go(+range.value); };
  root.addEventListener("keydown", (e) => {
    if (e.target === range) return;
    if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(i - 1); }
  });
  render();
  return { destroy: stop, get steps() { return steps; } };
}

/* Tam ekran pencere içinde aç (editörlerin yanındaki "Adım adım" düğmesi için) */
export function openTracer({ code, builtins, title, note }) {
  const wrap = document.createElement("div");
  wrap.className = "tr-modal";
  wrap.innerHTML = `<div class="tr-dialog" role="dialog" aria-modal="true" aria-label="${esc(title || "Adım adım izle")}">
    <div class="tr-head"><h2>${icon("eye")} ${esc(title || "Adım adım izle")}</h2><button class="icon-btn" data-close aria-label="Kapat">${icon("x")}</button></div>
    <div class="tr-body"></div></div>`;
  document.body.appendChild(wrap);
  document.body.classList.add("tr-open");
  const t = mountTracer($(".tr-body", wrap), { code, builtins, note });
  const close = () => { t.destroy(); wrap.remove(); document.body.classList.remove("tr-open"); document.removeEventListener("keydown", esc_); };
  const esc_ = (e) => { if (e.key === "Escape") close(); };
  wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", esc_);
  const f = $(".tr", wrap); if (f) f.focus();
  return close;
}

/* Ortak parçalar: kademeli ipucu merdiveni ve kod yapbozu. */
import { $, $$, esc, icon } from "./core.js";

/* =====================================================================
   KADEMELİ İPUCU
   1. ipucu her zaman açılır. Sonraki ipucu için öğrencinin arada en az bir
   kez daha denemiş olması gerekir. Çözüm, bütün ipuçları görüldükten ve
   en az MIN_FAILS başarısız denemeden sonra açılır.
   ===================================================================== */
const MIN_FAILS = 3;
export function hintLadder({ btn, list, hints, solution, extra, onSolution }) {
  const levels = (hints || []).slice();
  if (extra) levels.push(extra);
  let shown = 0, fails = 0, failsAtLast = -1, solShown = false;
  function canNext() { return shown === 0 || fails > failsAtLast; }
  function paint() {
    list.innerHTML = levels.slice(0, shown).map((h, i) => `<div class="hint"><b>İpucu ${i + 1} / ${levels.length}:</b> ${typeof h === "function" ? h() : h}</div>`).join("") +
      (solShown ? `<div class="hint hint--sol"><b>Örnek çözüm</b><pre>${esc(solution)}</pre><p>Kopyalamak yerine kendi kodunla karşılaştır: fark nerede? Sonra kendin düzelt.</p></div>` : "");
    if (!btn) return;
    if (shown < levels.length) {
      const ok = canNext();
      btn.disabled = !ok;
      btn.innerHTML = icon("bulb") + (ok ? (shown ? "Bir ipucu daha" : "İpucu") : "Yeni ipucu için bir kez daha dene");
    } else if (solution && !solShown) {
      const ok = fails >= MIN_FAILS;
      btn.disabled = !ok;
      btn.innerHTML = icon("eye") + (ok ? "Örnek çözümü göster" : `Çözüm ${MIN_FAILS} denemeden sonra açılır (${Math.min(fails, MIN_FAILS)}/${MIN_FAILS})`);
    } else {
      btn.disabled = true;
      btn.innerHTML = icon("bulb") + "Bütün ipuçları açık";
    }
  }
  function next() {
    if (shown < levels.length) { if (!canNext()) return; shown++; failsAtLast = fails; }
    else if (solution && fails >= MIN_FAILS && !solShown) { solShown = true; if (onSolution) onSolution(); }
    paint();
  }
  if (btn) btn.onclick = next;
  paint();
  return { next, fail() { fails++; paint(); }, get fails() { return fails; } };
}

/* Hata Avcısı için otomatik ipucu: bozuk kodla çözüm arasındaki ilk farklı satır. */
export function whereHint(broken, solution) {
  const a = broken.replace(/\s+$/, "").split("\n"), b = solution.replace(/\s+$/, "").split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || "").replace(/\s+$/, "") !== (b[i] || "").replace(/\s+$/, "")) {
      return `Sorun <b>${i + 1}. satırda</b>: <code>${esc((a[i] || "").trim() || "(boş satır)")}</code>. Bu satırı harf harf incele.`;
    }
  }
  return "Programın yapısı doğru görünüyor. Çıktıyı beklenenle satır satır karşılaştır.";
}

/* =====================================================================
   KOD YAPBOZU (Parsons problemi)
   Doğru program satırları + şaşırtmaca satırlar karışık verilir. Öğrenci
   parçaları programa ekler, sıralar ve girintisini ayarlar.
   task.solution: doğru program (girintiyle). task.extra: şaşırtmaca satırlar.
   ===================================================================== */
function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
export function parsonsBlocks(task) {
  const lines = task.solution.split("\n").filter((l) => l.trim()).map((l) => l.trim()).concat(task.extra || []);
  const rnd = seeded(task.title), ids = lines.map((_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  if (ids.every((v, i) => v === i) && ids.length > 1) ids.reverse();
  return { lines, order: ids };
}
export function mountParsons(host, task, saved, onChange) {
  const { lines, order } = parsonsBlocks(task);
  let prog = [];
  try { if (saved) prog = JSON.parse(saved).filter((b) => lines[b.id] != null); } catch (_) { prog = []; }
  let drag = null;
  const used = () => new Set(prog.map((b) => b.id));
  const code = () => prog.map((b) => "    ".repeat(b.ind) + lines[b.id]).join("\n") + (prog.length ? "\n" : "");
  function changed() { paint(); onChange && onChange(JSON.stringify(prog), code()); }
  function paint() {
    const u = used();
    const pool = order.filter((id) => !u.has(id));
    host.innerHTML = `<div class="pz">
      <section class="pz-col"><div class="label"><span>Parçalar</span><span>${pool.length} parça</span></div>
        <ul class="pz-list pz-pool" data-zone="pool">${pool.map((id) => `<li class="pz-blk" draggable="true" data-id="${id}" tabindex="0" role="button" aria-label="Programa ekle: ${esc(lines[id])}"><code>${esc(lines[id])}</code><span class="pz-add">${icon("right")}</span></li>`).join("") || `<li class="pz-empty">Bütün parçalar programda. Bazıları şaşırtmaca olabilir: gerekmeyeni geri gönder.</li>`}</ul></section>
      <section class="pz-col"><div class="label"><span>Programın</span><span>Girinti: ← →</span></div>
        <ol class="pz-list pz-prog" data-zone="prog">${prog.map((b, i) => `<li class="pz-row" draggable="true" data-i="${i}">
          <span class="pz-ln">${i + 1}</span><span class="pz-code" style="--ind:${b.ind}"><code>${esc(lines[b.id])}</code></span>
          <span class="pz-ctl"><button data-a="out" data-i="${i}" aria-label="Girintiyi azalt"${b.ind ? "" : " disabled"}>←</button><button data-a="in" data-i="${i}" aria-label="Girintiyi artır"${b.ind < 3 ? "" : " disabled"}>→</button><button data-a="up" data-i="${i}" aria-label="Yukarı taşı"${i ? "" : " disabled"}>↑</button><button data-a="down" data-i="${i}" aria-label="Aşağı taşı"${i < prog.length - 1 ? "" : " disabled"}>↓</button><button data-a="del" data-i="${i}" aria-label="Parçalara geri gönder">×</button></span></li>`).join("") ||
          `<li class="pz-empty">Soldaki parçalara tıkla, buraya sırayla eklensin.</li>`}</ol></section></div>`;
    $$(".pz-blk", host).forEach((el) => {
      const add = () => { prog.push({ id: +el.dataset.id, ind: 0 }); changed(); };
      el.onclick = add;
      el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); add(); } };
      el.ondragstart = (e) => { drag = { from: "pool", id: +el.dataset.id }; e.dataTransfer.effectAllowed = "move"; };
    });
    $$(".pz-ctl button", host).forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.i, a = b.dataset.a;
        if (a === "in") prog[i].ind = Math.min(3, prog[i].ind + 1);
        if (a === "out") prog[i].ind = Math.max(0, prog[i].ind - 1);
        if (a === "up" && i > 0) [prog[i - 1], prog[i]] = [prog[i], prog[i - 1]];
        if (a === "down" && i < prog.length - 1) [prog[i + 1], prog[i]] = [prog[i], prog[i + 1]];
        if (a === "del") prog.splice(i, 1);
        changed();
      };
    });
    $$(".pz-row", host).forEach((el) => {
      el.ondragstart = (e) => { drag = { from: "prog", i: +el.dataset.i }; e.dataTransfer.effectAllowed = "move"; };
      el.ondragover = (e) => { e.preventDefault(); el.classList.add("over"); };
      el.ondragleave = () => el.classList.remove("over");
      el.ondrop = (e) => { e.preventDefault(); e.stopPropagation(); dropAt(+el.dataset.i); };
    });
    const progZone = $(".pz-prog", host), poolZone = $(".pz-pool", host);
    progZone.ondragover = (e) => e.preventDefault();
    progZone.ondrop = (e) => { e.preventDefault(); dropAt(prog.length); };
    poolZone.ondragover = (e) => e.preventDefault();
    poolZone.ondrop = (e) => { e.preventDefault(); if (drag && drag.from === "prog") { prog.splice(drag.i, 1); drag = null; changed(); } };
  }
  function dropAt(at) {
    if (!drag) return;
    if (drag.from === "pool") prog.splice(at, 0, { id: drag.id, ind: 0 });
    else { const [b] = prog.splice(drag.i, 1); prog.splice(at > drag.i ? at - 1 : at, 0, b); }
    drag = null; changed();
  }
  paint();
  return { code, reset() { prog = []; changed(); }, get count() { return prog.length; } };
}

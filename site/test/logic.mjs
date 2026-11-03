// Bütün çözümler geçmeli, hiçbir başlangıç kodu geçmemeli.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require("../node_modules/skulpt/dist/skulpt.min.js"); require("../node_modules/skulpt/dist/skulpt-stdlib.js");
const { Atolye } = await import("../src/engine/atolye.js");
const { LESSONS, NOTEBOOKS } = await import("../src/data/lessons.js");
const { STATIONS } = await import("../src/data/stations.js");
const T = await import("../src/data/tests.js");
const { parsonsBlocks } = await import("../src/ui/parsons-logic.mjs").catch(() => ({}));
let f = 0; const fail = (...a) => { f++; console.log("FAIL", ...a); };
const verbose = process.argv.includes("-v");

LESSONS.forEach((L, li) => L.steps.forEach((s, si) => {
  const id = `ders${li + 1}.${si + 1}`;
  if (s.type === "code") {
    if (!s.hints || !s.hints.length) fail(id, "ipucu yok");
    const a = Atolye.checkLesson(s, s.solution), b = Atolye.checkLesson(s, s.starter);
    if (!a.ok) fail(id, "çözüm geçmiyor", a.error || a.probs);
    if (b.ok) fail(id, "başlangıç kodu geçiyor");
    if (verbose) console.log(id, "başlangıç →", b.error ? b.error.msg.slice(0, 80) : (b.probs || []).join(" | ").slice(0, 100));
  }
  if (s.type === "predict") { const r = Atolye.runSnippet(s.code); if (r.error) fail(id, "tahmin kodu hata veriyor", r.error.raw); if (verbose) console.log(id, "predict", JSON.stringify(r.out)); }
  if (s.type === "parsons") {
    const a = Atolye.checkParsons(s, s.solution + "\n"); if (!a.ok) fail(id, "yapboz çözümü geçmiyor", a.error || a.out);
  }
  if (s.type === "quiz" && s.code) { const r = Atolye.runSnippet(s.code); if (verbose) console.log(id, "quiz", JSON.stringify(r.out), r.error && r.error.raw); }
  if (s.colab && !NOTEBOOKS[s.colab]) fail(id, "colab");
}));

const t0 = Date.now();
STATIONS.forEach((st) => (st.tasks || []).forEach((t, i) => {
  const id = `${st.id}-${i + 1}${t.bonus ? "★" : ""}`;
  if (!t.hints || !t.hints.length) fail(id, "ipucu yok");
  const starter = st.kind === "fix" ? t.code : st.kind === "parsons" ? "" : t.starter;
  if (t.solution) {
    const a = Atolye.check(st, t, st.kind === "parsons" ? t.solution + "\n" : t.solution);
    if (!a.ok) fail(id, "çözüm geçmiyor", a.msg, a.error && (a.error.msg || a.error), JSON.stringify((a.tests || []).filter((r) => !r.pass)), (a.rules || []).join(";"));
  }
  if (st.kind !== "parsons" && !(t.tests === "compare")) {
    const b = Atolye.check(st, t, starter);
    if (b.ok) fail(id, "başlangıç kodu geçiyor");
    if (verbose) console.log(id, "başlangıç →", b.error ? (b.error.msg || "").slice(0, 70) : (b.msg || "") + " " + (b.rules || []).join(";"));
  }
  if (st.kind === "parsons") {
    // şaşırtmaca satırlar çözümde olmamalı, karışık sıra çözüm sırasıyla aynı olmamalı
    const lines = t.solution.split("\n").map((l) => l.trim());
    (t.extra || []).forEach((e) => { if (lines.includes(e)) fail(id, "şaşırtmaca çözümde var", e); });
    const all = lines.concat(t.extra || []); if (new Set(all).size !== all.length) fail(id, "aynı satır iki kere");
    // girintisiz birleştirme geçmemeli (bir döngü/koşul varsa)
    if (/:\s*$/m.test(t.solution)) { const flat = Atolye.check(st, t, lines.join("\n") + "\n"); if (flat.ok) fail(id, "girintisiz hali geçiyor"); }
  }
}));
console.log("istasyon testleri", Date.now() - t0, "ms");

// ölçme
[T.ON_TEST, T.SON_TEST].forEach((form, fi) => {
  if (form.length !== T.KAZANIMLAR.length) fail("form uzunluğu", fi);
  form.forEach((q, i) => {
    if (q.k !== i + 1) fail("kazanım sırası", fi, i);
    if (!(q.answer >= 0 && q.answer < q.options.length)) fail("cevap", fi, i);
    if (q.code) { const r = Atolye.runSnippet(q.code); const want = q.options[q.answer]; const got = r.out.join(" ").trim();
      if (verbose) console.log("test", fi ? "son" : "ön", i + 1, JSON.stringify(got), "→", want); }
  });
});
T.KONTROLLER.forEach((k, ki) => k.sorular.forEach((q, i) => {
  if (!(q.answer >= 0 && q.answer < q.options.length)) fail("kontrol cevap", ki, i);
  if (q.code && !/np\.|pd\./.test(q.code)) { const r = Atolye.runSnippet(q.code); if (verbose) console.log("kontrol", ki + 1, i + 1, JSON.stringify(r.out), r.error && r.error.raw); }
}));
console.log("fails", f);
process.exit(f ? 1 : 0);

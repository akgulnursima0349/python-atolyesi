/* Bir öğrencinin kayıt verisinden (save) öğretmen paneli için özet çıkarır.
   Ders ve aşama kuralları core.js'deki ile aynıdır, ama global kayıt yerine verilen veriyle çalışır. */
import { LESSONS, NOTEBOOKS } from "../data/lessons.js";
import { STATIONS } from "../data/stations.js";
import { KAZANIMLAR, ON_TEST, SON_TEST, KONTROLLER } from "../data/tests.js";

const req = (st) => st.kind === "quiz" ? st.rounds.length : st.tasks.filter((t) => !t.bonus).length;
const all = (st) => st.kind === "quiz" ? st.rounds.length : st.tasks.length;
const bonusIdx = (st) => st.kind === "quiz" ? [] : st.tasks.map((t, i) => (t.bonus ? i : -1)).filter((i) => i >= 0);

export function ozet(v) {
  v = v || {}; const d = v.done || {}, t = v.tests || {};
  const ph = (p) => STATIONS.filter((s) => (s.phase == null ? 2 : s.phase) === p);
  const stDone = (list) => list.reduce((a, s) => { let n = 0; for (let i = 0; i < all(s); i++) if (!(s.tasks && s.tasks[i].bonus) && d[s.id + "-" + i]) n++; return a + n; }, 0);
  const stReq = (list) => list.reduce((a, s) => a + req(s), 0);
  const dersler = LESSONS.filter((_, i) => d["ders-" + i]).length;
  const ist = { done: stDone(ph(2)), total: stReq(ph(2)) }, model = { done: stDone(ph(3)), total: stReq(ph(3)) };
  const labs = ["lab1", "lab2", "lab3"].filter((k) => d["nb-" + k]).length;
  const kontrol = KONTROLLER.map((_, i) => { const x = t["kontrol-" + (i + 1)]; return x ? { best: x.best, gecti: !!x.done } : null; });
  let yildiz = 0, yildizToplam = 0;
  LESSONS.forEach((L, li) => L.steps.forEach((s, si) => { if (s.bonus) { yildizToplam++; if (d["ders-" + li + "-b" + si]) yildiz++; } }));
  STATIONS.forEach((s) => bonusIdx(s).forEach((i) => { yildizToplam++; if (d[s.id + "-" + i]) yildiz++; }));
  const work = [dersler === LESSONS.length, !!d["nb-nb00"], ist.done === ist.total, !!d["nb-nb01"] && model.done === model.total, labs === 3];
  const asamaBitti = work.map((w, i) => w && !!(kontrol[i] && kontrol[i].gecti));
  let asama = asamaBitti.findIndex((x) => !x); if (asama < 0) asama = 5;
  const total = LESSONS.length + Object.keys(NOTEBOOKS).length + KONTROLLER.length + ist.total + model.total;
  const done = dersler + Object.keys(NOTEBOOKS).filter((k) => d["nb-" + k]).length + kontrol.filter((k) => k && k.gecti).length + ist.done + model.done;
  return {
    on: t.on && t.on.done ? { score: t.on.score, answers: t.on.answers || [] } : null,
    son: t.son && t.son.done ? { score: t.son.score, answers: t.son.answers || [] } : null,
    dersler, dersToplam: LESSONS.length, nb00: !!d["nb-nb00"], nb01: !!d["nb-nb01"], ist, model, labs, kontrol,
    yildiz, yildizToplam, asama, yuzde: Math.round(100 * done / total)
  };
}

/* Kazanım bazında: her öğrenci için 1 (doğru), 0 (yanlış), -1 (bilmiyorum), null (çözmedi) */
export function kazanimSonucu(o, hangi) {
  const form = hangi === "on" ? ON_TEST : SON_TEST, x = o[hangi];
  return KAZANIMLAR.map((_, k) => (!x ? null : x.answers[k] === form[k].answer ? 1 : x.answers[k] === -1 ? -1 : 0));
}
export { KAZANIMLAR };

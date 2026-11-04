/* Ortak yardımcılar: kayıt, ikonlar, renk temaları, görsel yuvaları, editör, kabuk (üst bar). */
import CodeMirror from "codemirror";
import "codemirror/mode/python/python.js";
import { STATIONS } from "../data/stations.js";
import { LESSONS, NOTEBOOKS } from "../data/lessons.js";
import { Atolye } from "../engine/atolye.js";

import iPlay from "lucide-static/icons/play.svg?raw";
import iReset from "lucide-static/icons/rotate-ccw.svg?raw";
import iBulb from "lucide-static/icons/lightbulb.svg?raw";
import iCheck from "lucide-static/icons/check.svg?raw";
import iX from "lucide-static/icons/x.svg?raw";
import iLock from "lucide-static/icons/lock.svg?raw";
import iRight from "lucide-static/icons/arrow-right.svg?raw";
import iLeft from "lucide-static/icons/arrow-left.svg?raw";
import iEye from "lucide-static/icons/eye.svg?raw";
import iBug from "lucide-static/icons/bug.svg?raw";
import iTerminal from "lucide-static/icons/terminal.svg?raw";
import iKey from "lucide-static/icons/key-round.svg?raw";
import iGrid from "lucide-static/icons/grid-3x3.svg?raw";
import iChat from "lucide-static/icons/message-circle.svg?raw";
import iBook from "lucide-static/icons/book-open.svg?raw";
import iNotebook from "lucide-static/icons/notebook.svg?raw";
import iFlask from "lucide-static/icons/flask-conical.svg?raw";
import iCap from "lucide-static/icons/graduation-cap.svg?raw";
import iCpu from "lucide-static/icons/cpu.svg?raw";
import iExt from "lucide-static/icons/external-link.svg?raw";
import iChev from "lucide-static/icons/chevron-right.svg?raw";
import iCode from "lucide-static/icons/code.svg?raw";
import iBrain from "lucide-static/icons/brain.svg?raw";
import iTrophy from "lucide-static/icons/trophy.svg?raw";
import iTarget from "lucide-static/icons/target.svg?raw";
import iClock from "lucide-static/icons/clock.svg?raw";
import iLayers from "lucide-static/icons/layers.svg?raw";
import iStar from "lucide-static/icons/star.svg?raw";
import iPuzzle from "lucide-static/icons/puzzle.svg?raw";
import iClipboard from "lucide-static/icons/clipboard-check.svg?raw";
import iApple from "lucide-static/icons/apple.svg?raw";
import iChart from "lucide-static/icons/chart-column.svg?raw";
import iUser from "lucide-static/icons/user.svg?raw";
import iLogout from "lucide-static/icons/log-out.svg?raw";

export const $ = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
export const esc = Atolye.esc;

/* ---------- ikonlar (Lucide) ---------- */
const RAW = { play: iPlay, reset: iReset, bulb: iBulb, check: iCheck, x: iX, lock: iLock, right: iRight, left: iLeft, eye: iEye, bug: iBug, terminal: iTerminal, key: iKey, grid: iGrid, chat: iChat, book: iBook, notebook: iNotebook, flask: iFlask, cap: iCap, cpu: iCpu, ext: iExt, chev: iChev, code: iCode, brain: iBrain, trophy: iTrophy, target: iTarget, clock: iClock, layers: iLayers, star: iStar, puzzle: iPuzzle, clipboard: iClipboard, apple: iApple, chart: iChart, user: iUser, logout: iLogout };
export function icon(name, cls) {
  const svg = (RAW[name] || "").replace(/<!--[\s\S]*?-->/, "").replace(/\swidth="24"|\sheight="24"/g, "").replace(/class="[^"]*"/, "");
  return '<span class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true">' + svg + "</span>";
}

/* ---------- kayıt: yalnızca bu tarayıcıda (hesap sistemi gelene kadar) ---------- */
const KEY = "python-atolyesi-v1";
export const save = { done: {}, code: {}, quiz: {}, tests: {}, teacher: false };
try { const raw = localStorage.getItem(KEY); if (raw) Object.assign(save, JSON.parse(raw)); } catch (_) {}
if (!save.tests) save.tests = {};
/* hooks.persist: bulut katmanı her kayıttan sonra buluta göndermek için bunu doldurur */
export const hooks = { persist: null, userChip: null, afterShell: null, bulut: false };
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) {}
  if (hooks.persist) hooks.persist();
}
/* Kaydı tamamen değiştir (giriş/çıkışta): başka bir öğrencinin verisi asla karışmaz */
export function replaceSave(obj) {
  Object.keys(save).forEach((k) => delete save[k]);
  Object.assign(save, { done: {}, code: {}, quiz: {}, tests: {}, teacher: false }, obj || {});
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) {}
}

/* ---------- istasyonlar ve ilerleme ---------- */
export const S = {};
/* phase: istasyonun hangi aşamada olduğu (2 = istasyonlar, 3 = Notebook 01 sonrası) */
let stNo = 0;
STATIONS.forEach((s) => { if (s.phase == null) s.phase = 2; if (s.phase === 2) s.no = ++stNo; S[s.id] = s; });
export const PHASE_STATIONS = (p) => STATIONS.filter((s) => s.phase === p);
/* taskCount: bütün görevler (yıldızlılar dahil). reqCount: zorunlu olanlar. */
export const taskCount = (st) => st.kind === "quiz" ? st.rounds.length : st.tasks.length;
export const isBonus = (st, i) => st.kind !== "quiz" && !!st.tasks[i].bonus;
export const reqCount = (st) => st.kind === "quiz" ? st.rounds.length : st.tasks.filter((t) => !t.bonus).length;
export function doneCount(st) { let n = 0; for (let i = 0; i < taskCount(st); i++) if (!isBonus(st, i) && save.done[st.id + "-" + i]) n++; return n; }
export function bonusDone(st) { let n = 0; for (let i = 0; i < taskCount(st); i++) if (isBonus(st, i) && save.done[st.id + "-" + i]) n++; return n; }
export const unlocked = (st, i) => {
  if (save.teacher || save.done[st.id + "-" + i]) return true;
  if (isBonus(st, i)) return doneCount(st) === reqCount(st);
  return i === 0 || !!save.done[st.id + "-" + (i - 1)];
};
export const testDone = (k) => !!(save.tests[k] && save.tests[k].done);
export const lessonOpen = (i) => save.teacher || (i === 0 ? testDone("on") : !!save.done["ders-" + (i - 1)]) || !!save.done["ders-" + i];

export const PHASES = [
  { short: "Başlangıç", title: "Başlangıç dersleri", hue: "brand", icon: "cap", slot: "phase-1",
    lead: "Programlama dili nedir, Python'u \"yüksek seviyeli\" yapan ne, Arduino'da yazdığınız C++ ile farkı ne, nesne nedir? Kısa dersler, her birinde alıştırmalar.",
    outline: "Programlama dili, Python ve Arduino karşılaştırması, nesneler." },
  { short: "Notebook 00", title: "Python'a Giriş", hue: "colab", icon: "notebook", slot: "phase-2",
    lead: "İlk gerçek Python defteri. Google Colab'da, öğretmeninle birlikte hücre hücre ilerleyeceksiniz.",
    outline: "Colab'da ilk gerçek Python defteri." },
  { short: "İstasyonlar", title: "Uygulama istasyonları", hue: "piksel", icon: "layers", slot: "phase-3",
    lead: "Notebook 00'da öğrendiklerini altı istasyonda kullan: çıktı tahmin et, kod yapbozu çöz, hata mesajı oku, şifre kır, piksel piksel resim yap, kendi sohbet botunu yaz.",
    outline: "Altı istasyonda öğrendiklerini uygula." },
  { short: "Notebook 01", title: "Yapay Zekânın Alet Çantası", hue: "bot", icon: "brain", slot: "phase-4",
    lead: "Sohbet botu istasyonunun sonunda gördüğün fikir: kurallar yerine örneklerden öğrenmek. Önce Colab'da bunun araçlarını tanı, sonra Model Atölyesi'nde aynı modeli kendi kodunla sıfırdan kur.",
    outline: "NumPy, Pandas, scikit-learn ve Model Atölyesi." },
  { short: "Lab'lar", title: "Makine öğrenmesi lab'ları", hue: "lab", icon: "flask", slot: "phase-5",
    lead: "Gerçek veriyle üç laboratuvar: el yazısı rakam tanıma, penguen türü tahmini ve K-Means ile renk sanatı.",
    outline: "Gerçek veriyle üç makine öğrenmesi uygulaması." }
];
/* Aşamanın asıl işi bitti mi? (kontrol testi hariç) */
export function phaseWorkDone(i) {
  const st = PHASE_STATIONS(i).every((s) => doneCount(s) === reqCount(s));
  if (i === 0) return LESSONS.every((_, k) => save.done["ders-" + k]);
  if (i === 1) return !!save.done["nb-nb00"];
  if (i === 2) return st;
  if (i === 3) return !!save.done["nb-nb01"] && st;
  return ["lab1", "lab2", "lab3"].every((k) => save.done["nb-" + k]);
}
export const phaseDone = (i) => phaseWorkDone(i) && testDone("kontrol-" + (i + 1));
export function totals() {
  let total = LESSONS.length + Object.keys(NOTEBOOKS).length + PHASES.length, done = 0;
  LESSONS.forEach((_, i) => { if (save.done["ders-" + i]) done++; });
  Object.keys(NOTEBOOKS).forEach((k) => { if (save.done["nb-" + k]) done++; });
  PHASES.forEach((_, i) => { if (testDone("kontrol-" + (i + 1))) done++; });
  STATIONS.forEach((s) => { total += reqCount(s); done += doneCount(s); });
  return { total, done };
}

/* ---------- renk temaları ---------- */
export const HUES = {
  brand: { hue: "#d7262e", ink: "#ae1d24", on: "#ffffff", tint: "#fcebeb", icon: "cap" },
  colab: { hue: "#e8a000", ink: "#8f5f00", on: "#241800", tint: "#fff4d6", icon: "notebook" },
  tahmin: { hue: "#e5a00d", ink: "#8a5b00", on: "#241800", tint: "#fff4d6", icon: "terminal" },
  hata: { hue: "#e1513b", ink: "#b2361f", on: "#ffffff", tint: "#fdece8", icon: "bug" },
  ajan: { hue: "#11a08b", ink: "#0b6e60", on: "#ffffff", tint: "#e3f5f2", icon: "key" },
  piksel: { hue: "#cf3e98", ink: "#a02674", on: "#ffffff", tint: "#fbe9f4", icon: "grid" },
  bot: { hue: "#3a73e0", ink: "#2556b5", on: "#ffffff", tint: "#e8effc", icon: "chat" },
  lab: { hue: "#6b4fdc", ink: "#5034b8", on: "#ffffff", tint: "#eeebfc", icon: "flask" },
  yapboz: { hue: "#2f9e44", ink: "#217a33", on: "#ffffff", tint: "#e6f4e9", icon: "puzzle" },
  model: { hue: "#6b4fdc", ink: "#5034b8", on: "#ffffff", tint: "#eeebfc", icon: "apple" },
  test: { hue: "#334155", ink: "#1e293b", on: "#ffffff", tint: "#e9edf2", icon: "clipboard" }
};
export function hueVars(k) { const t = HUES[k] || HUES.brand; return `--hue:${t.hue};--hue-ink:${t.ink};--hue-on:${t.on};--hue-tint:${t.tint}`; }
export function setHue(k) { const t = HUES[k] || HUES.brand, r = document.documentElement.style; r.setProperty("--hue", t.hue); r.setProperty("--hue-ink", t.ink); r.setProperty("--hue-on", t.on); r.setProperty("--hue-tint", t.tint); }

/* ---------- görsel yuvaları ----------
   src/assets/img/<yuva>.webp dosyası varsa o gösterilir, yoksa tasarlanmış bir yer tutucu. */
const FILES = import.meta.glob("../assets/img/*.{webp,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" });
const BY_NAME = {};
Object.keys(FILES).forEach((p) => { BY_NAME[p.split("/").pop().replace(/\.\w+$/, "")] = FILES[p]; });
export const imageUrl = (name) => BY_NAME[name] || null;
export function art(slot, hueKey, iconName, alt) {
  const url = imageUrl(slot);
  if (url) return `<figure class="art" style="${hueVars(hueKey)}"><img src="${url}" alt="${esc(alt || "")}" loading="lazy"></figure>`;
  return `<figure class="art art--ph" style="${hueVars(hueKey)}" aria-hidden="true"><span class="art-icon">${icon(iconName || (HUES[hueKey] || HUES.brand).icon)}</span>${save.teacher ? `<span class="slot-id">${slot}</span>` : ""}</figure>`;
}

/* ---------- kabuk ---------- */
function ring(done, total) {
  const r = 11, c = 2 * Math.PI * r, p = total ? done / total : 0;
  return `<svg class="ring" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--rule)" stroke-width="3"/><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 14 14)"/></svg>`;
}
export function shell(content, current) {
  const t = totals();
  const nav = PHASES.map((p, i) => `<a href="#asama-${i + 1}" class="${phaseDone(i) ? "done" : ""}"${current === i ? ' aria-current="page"' : ""}><span class="n">${phaseDone(i) ? icon("check") : i + 1}</span><span class="lbl">${p.short}</span></a>`).join("");
  return `<header class="appbar"><div class="container">
      <button class="brandmark" id="brand" title="Giriş sayfası"><img src="${imageUrl("logo")}" alt="Sivas Robotik Akademi logosu" width="54" height="54"><span><b>Sivas Robotik Akademi</b><small>Python Atölyesi</small></span></button>
      <nav class="coursenav" aria-label="Kurs aşamaları">${nav}</nav>
      <div class="appbar-right">${save.teacher && !hooks.userChip?.() ? '<span class="teacher-badge" title="Öğretmen modu açık">Öğretmen</span>' : ""}${save.teacher ? "" : `<span class="progress-chip" title="Toplam ilerleme">${ring(t.done, t.total)}${t.done} / ${t.total}</span>`}${hooks.userChip ? hooks.userChip() : ""}</div>
    </div></header>
    <main><div class="container page">${content}</div></main>
    <footer class="footer"><div class="container"><span>Sivas Robotik Akademi · Python Atölyesi</span><span>${hooks.bulut ? "İlerlemen hesabına kaydedilir, her bilgisayarda aynıdır." : "İlerleme bu tarayıcıda saklanır."}</span></div></footer>`;
}

/* ---------- editör ---------- */
let cm = null, errMark = null;
export function setupEditor(host, code, onChange, onRun) {
  cm = null;
  if (CodeMirror) {
    cm = CodeMirror(host, {
      value: code, mode: "python", lineNumbers: true, scrollbarStyle: "null", indentUnit: 4, tabSize: 4, viewportMargin: Infinity,
      extraKeys: {
        Tab: (c) => { if (c.somethingSelected()) c.indentSelection("add"); else c.replaceSelection("    "); },
        "Shift-Tab": (c) => c.indentSelection("subtract"),
        "Ctrl-Enter": () => onRun(), "Cmd-Enter": () => onRun()
      }
    });
    cm.on("change", () => { clearErr(); onChange(); });
  }
}
export const getCode = () => cm ? cm.getValue() : "";
export const setCode = (c) => { if (cm) cm.setValue(c); };
export function markErr(line) { clearErr(); if (cm && line > 0 && line <= cm.lineCount()) errMark = cm.addLineClass(line - 1, "background", "line-err"); }
export function clearErr() { if (cm && errMark) { cm.removeLineClass(errMark, "background", "line-err"); errMark = null; } }

export function errorHtml(err, code, task) {
  const raw = err.raw ? `<div class="errraw">${err.line ? `<span class="ln">${err.line}. satır · </span>` : ""}${esc(err.raw)}</div>` : "";
  const colab = task && task.colab && code === task.code ? `<p class="colab-note">Colab'da (bilgisayardaki Python'da) bu hata şöyle yazar: <code>${esc(task.colab)}</code></p>` : "";
  return raw + `<p>${err.msg}</p>` + colab;
}
export function pythonReady() { return !!window.Sk; }

/* ---------- konfeti ---------- */
export function confetti() {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  cv.hidden = false; cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#d7262e", "#15171c", "#e5a00d", "#11a08b", "#3a73e0", "#cf3e98"], ps = [];
  for (let i = 0; i < 110; i++) ps.push({ x: innerWidth * (.3 + Math.random() * .4), y: innerHeight * .3, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 3, r: Math.random() * 5 + 3, c: cols[i % cols.length], a: Math.random() * 6 });
  const t0 = performance.now();
  (function f(t) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => { p.vy += .32; p.x += p.vx; p.y += p.vy; p.a += .15; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
    if (t - t0 < 2200) requestAnimationFrame(f); else { ctx.clearRect(0, 0, cv.width, cv.height); cv.hidden = true; }
  })(t0);
}

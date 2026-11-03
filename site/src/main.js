import "./styles/app.css";
import { LESSONS } from "./data/lessons.js";
import { $, S, PHASES } from "./ui/core.js";
import { showLanding, showPhase, showLesson, toggleTeacher } from "./ui/pages.js";
import { showStation } from "./ui/stations.js";
import { showTest, showReport } from "./ui/assess.js";
import { cloud, initCloud } from "./cloud/index.js";
import { showLogin, showTeacher, showClass } from "./ui/account.js";

const OPEN = new Set(["", "ana", "giris"]);
function route() {
  const h = location.hash.replace("#", "");
  /* Hesaplı modda: giriş yapmayan sadece giriş sayfasını ve ana sayfayı görür */
  if (cloud.mode === "bulut" && !cloud.me.rol && !OPEN.has(h)) { location.hash = "giris"; return; }
  if (h === "giris") return cloud.mode === "bulut" ? showLogin() : showLanding();
  if (h === "ogretmen") return showTeacher();
  const sc = /^sinif-([0-9a-f-]{8,})$/.exec(h);
  if (sc) return showClass(sc[1]);
  if (h === "on-test") return showTest("on");
  if (h === "son-test") return showTest("son");
  if (h === "sonuc") return showReport();
  const kt = /^kontrol-([1-5])$/.exec(h);
  if (kt) return showTest("kontrol-" + kt[1]);
  const m = /^([a-z]+)(?:-(\d+))?$/.exec(h);
  if (m && m[1] === "asama" && m[2] && PHASES[+m[2] - 1]) return showPhase(+m[2] - 1);
  if (m && m[1] === "ders" && m[2] && LESSONS[+m[2] - 1]) return showLesson(+m[2] - 1);
  if (m && S[m[1]]) return showStation(m[1], m[2] ? +m[2] - 1 : null);
  showLanding();
}
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s")) { e.preventDefault(); toggleTeacher(); }
});
window.addEventListener("hashchange", route);
initCloud().then(() => {
  route(); $("#root").removeAttribute("aria-busy");
  if (window.ATOLYE_AYAR && window.ATOLYE_AYAR.mock) {
    const b = document.createElement("div"); b.className = "mock-band";
    b.innerHTML = "<b>Önizleme</b> Hesaplar ve veriler sadece bu tarayıcıda tutuluyor. Kurum kodları: öğretmen <code>TEST</code>, müdür <code>MUDUR</code>";
    document.body.appendChild(b);
  }
});

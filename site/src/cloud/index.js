/* =====================================================================
   BULUT KATMANI — hesaplar ve ilerlemenin veritabanında saklanması.
   public/ayarlar.js içinde Supabase adresi ve anahtarı varsa "bulut" modunda çalışır:
     öğrenci sınıf kodu + takma ad + PIN ile girer, ilerlemesi her cihazda aynıdır.
   Ayar yoksa "yerel" modda çalışır: hesap yok, ilerleme sadece bu tarayıcıda (bugünkü davranış).
   ===================================================================== */
import { save, replaceSave, hooks } from "../ui/core.js";

const AYAR = (typeof window !== "undefined" && window.ATOLYE_AYAR) || {};
export const cloud = {
  mode: AYAR.mock || (AYAR.supabaseUrl && AYAR.supabaseKey) ? "bulut" : "yerel",
  me: { rol: null },          // { rol: "ogrenci", takma_ad, sinif, sinif_kod } | { rol: "ogretmen", ad } | { rol: null }
  status: "hazir",            // hazir | kaydediliyor | kaydedildi | hata
  ready: false,
  listeners: new Set()
};
hooks.bulut = cloud.mode === "bulut";
let api = null;               // { rpc, signInAnon, signIn, signUp, signOut, session }
let timer = null, dirty = false, saving = false, retry = 0;

const MESAJ = {
  gecersiz_giris: "Sınıf kodu, takma ad veya PIN hatalı. Lütfen bilgileri kontrol edip tekrar deneyin.",
  cok_deneme: "Çok sayıda hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin veya öğretmeninize başvurun.",
  kurum_kodu_hatali: "Kurum kodu geçersiz.",
  yetki_yok: "Bu işlem için yetkiniz bulunmuyor.",
  oturum_yok: "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.",
  giris_gerekli: "Bu işlem için giriş yapmanız gerekiyor.",
  ogretmen_hesabi: "Bu tarayıcıda açık bir öğretmen oturumu var. Öğrenci girişi için önce çıkış yapın.",
  cok_fazla: "Tek seferde en fazla 60 öğrenci eklenebilir.",
  ad_cakisiyor: "Öğrenci taşınamadı: hedef sınıfta aynı takma ada sahip bir öğrenci var.",
  ogretmen_yok: "Öğretmen bulunamadı veya hesabı erişime kapalı.",
  kendini_kapatamazsin: "Kendi hesabınızın erişimini kapatamazsınız.",
  ag: "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
  "Invalid login credentials": "E-posta adresi veya şifre hatalı.",
  "Email not confirmed": "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki doğrulama bağlantısını kullanın.",
  "User already registered": "Bu e-posta adresiyle kayıtlı bir hesap zaten var."
};
/* Kullanıcıya sade bir mesaj gösterilir; teknik ayrıntı yalnızca tarayıcı konsoluna yazılır. */
export function hataMetni(e) {
  const k = (e && (e.code || e.message)) || String(e);
  for (const key of Object.keys(MESAJ)) if (k.includes(key)) return MESAJ[key];
  if (/fetch|network|Failed to/i.test(k)) return MESAJ.ag;
  if (/Password should be/i.test(k)) return "Şifre en az 6 karakter olmalıdır.";
  if (/rate limit|too many/i.test(k)) { console.warn("[atolye]", k); return "Çok sayıda istek gönderildi. Lütfen biraz bekleyip tekrar deneyin."; }
  if (/anonymous/i.test(k)) { console.error("[atolye] Anonim giriş kapalı:", k); return "Öğrenci girişi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin veya kurum yöneticisine bildirin."; }
  console.error("[atolye]", e);
  return "Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.";
}
function emit() { cloud.listeners.forEach((f) => { try { f(cloud); } catch (_) {} }); }
export const onCloud = (f) => { cloud.listeners.add(f); return () => cloud.listeners.delete(f); };

/* ---------- sunucu bağlantısı ---------- */
async function connect() {
  if (AYAR.mock) { const m = await import("./mock.js"); return m.mockApi(); }
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(AYAR.supabaseUrl, AYAR.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "python-atolyesi-auth" } });
  const unwrap = ({ data, error }) => { if (error) { const e = new Error(error.message); e.code = error.message; throw e; } return data; };
  return {
    rpc: async (fn, args) => unwrap(await sb.rpc(fn, args || {})),
    session: async () => unwrap(await sb.auth.getSession()).session,
    signInAnon: async () => unwrap(await sb.auth.signInAnonymously()),
    signIn: async (email, password) => unwrap(await sb.auth.signInWithPassword({ email, password })),
    signUp: async (email, password) => unwrap(await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split("#")[0] } })),
    signOut: async () => { await sb.auth.signOut(); }
  };
}

export async function initCloud() {
  if (cloud.mode !== "bulut") { cloud.ready = true; return; }
  try {
    api = await connect();
    const s = await api.session();
    cloud.me = s ? await api.rpc("ben") : { rol: null };
    if (cloud.me.rol === "ogrenci") await pullProgress();
    else if (cloud.me.rol === "ogretmen") { replaceSave({ teacher: true }); }
    else replaceSave({});
  } catch (e) {
    cloud.me = { rol: null }; cloud.status = "hata"; cloud.error = hataMetni(e);
  }
  hooks.persist = schedule;
  cloud.ready = true; emit();
}

/* ---------- ilerleme: bulutta tek kopya, tarayıcıda önbellek ---------- */
async function pullProgress() {
  const r = await api.rpc("ilerleme_getir");
  replaceSave((r && r.veri) || {});
  cloud.status = "kaydedildi";
}
function schedule() {
  if (cloud.me.rol !== "ogrenci") return;
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(push, retry ? Math.min(30000, 2000 * 2 ** retry) : 1200);
  if (cloud.status !== "kaydediliyor") { cloud.status = "kaydediliyor"; emit(); }
}
async function push() {
  if (saving || !dirty) return;
  saving = true; dirty = false;
  const veri = JSON.parse(JSON.stringify(save)); delete veri.teacher;
  try {
    await api.rpc("ilerleme_kaydet", { p_veri: veri });
    retry = 0; cloud.status = dirty ? "kaydediliyor" : "kaydedildi";
  } catch (e) {
    dirty = true; retry++; cloud.status = "hata"; cloud.error = hataMetni(e);
    if (/oturum_yok/.test(e.message || "")) { cloud.me = { rol: null }; replaceSave({}); location.hash = "giris"; }
  }
  saving = false; emit();
  if (dirty) { clearTimeout(timer); timer = setTimeout(push, retry ? Math.min(30000, 2000 * 2 ** retry) : 800); }
}
/* Sayfa kapanırken bekleyen kaydı hemen dene */
if (typeof window !== "undefined") window.addEventListener("pagehide", () => { if (dirty) push(); });
export const hasPending = () => dirty || saving;

/* ---------- giriş / çıkış ---------- */
export async function studentLogin(kod, ad, pin) {
  if (cloud.me.rol === "ogretmen") await logout(true);
  if (!(await api.session())) await api.signInAnon();
  const r = await api.rpc("ogrenci_giris", { p_kod: kod, p_takma_ad: ad, p_pin: pin });
  if (r && r.hata) { const e = new Error(r.hata); e.code = r.hata; throw e; }
  cloud.me = r;
  await pullProgress();
  emit();
  return r;
}
export async function teacherLogin(email, password) {
  if (cloud.me.rol) await logout(true);
  else if (await api.session()) await api.signOut();
  await api.signIn(email, password);
  cloud.me = await api.rpc("ben");
  if (cloud.me.rol === "ogretmen") replaceSave({ teacher: true });
  emit();
  return cloud.me;     // rol null ise: hesap var ama öğretmen kaydı tamamlanmamış
}
export async function teacherSignup(email, password) {
  if (await api.session()) { await api.signOut(); cloud.me = { rol: null }; }
  const r = await api.signUp(email, password);
  return { needsConfirm: !r.session };
}
export async function teacherComplete(ad, kurumKodu) {
  cloud.me = await api.rpc("ogretmen_kaydol", { p_ad: ad, p_kurum_kodu: kurumKodu });
  replaceSave({ teacher: true });
  emit();
  return cloud.me;
}
export async function hasAccountSession() { return !!(api && (await api.session())); }
export async function logout(silent) {
  clearTimeout(timer);
  if (dirty && cloud.me.rol === "ogrenci") { try { await push(); } catch (_) {} }
  try { if (cloud.me.rol === "ogrenci") await api.rpc("ogrenci_cikis"); } catch (_) {}
  try { await api.signOut(); } catch (_) {}
  cloud.me = { rol: null }; cloud.status = "hazir";
  replaceSave({});
  if (!silent) emit();
}

/* ---------- öğretmen işlemleri ---------- */
export const teacherApi = {
  siniflar: () => api.rpc("siniflarim"),
  sinifOlustur: (ad) => api.rpc("sinif_olustur", { p_ad: ad }),
  sinifSil: (id) => api.rpc("sinif_sil", { p_sinif: id }),
  ogrenciEkle: (id, adlar) => api.rpc("ogrenci_ekle", { p_sinif: id, p_adlar: adlar }),
  pinYenile: (id) => api.rpc("ogrenci_pin_yenile", { p_ogrenci: id }),
  ogrenciSil: (id) => api.rpc("ogrenci_sil", { p_ogrenci: id }),
  rapor: (id) => api.rpc("sinif_raporu", { p_sinif: id }),
  ogrenciTasi: (id, hedef) => api.rpc("ogrenci_tasi", { p_ogrenci: id, p_hedef: hedef }),
  sinifOgretmenleri: (id) => api.rpc("sinif_ogretmenleri", { p_sinif: id }),
  ogretmenListesi: () => api.rpc("ogretmen_listesi"),
  ogretmenEkle: (id, t) => api.rpc("sinif_ogretmen_ekle", { p_sinif: id, p_ogretmen: t }),
  ogretmenCikar: (id, t) => api.rpc("sinif_ogretmen_cikar", { p_sinif: id, p_ogretmen: t }),
  devret: (id, t) => api.rpc("sinif_devret", { p_sinif: id, p_ogretmen: t }),
  mudurOgretmenler: () => api.rpc("mudur_ogretmenler"),
  aktiflik: (t, aktif) => api.rpc("ogretmen_aktiflik", { p_ogretmen: t, p_aktif: aktif })
};

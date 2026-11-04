/* SADECE TEST VE ÖNİZLEME: Supabase'in yerine geçen, tarayıcıda çalışan sahte sunucu.
   public/ayarlar.js içinde { mock: true } yazılırsa kullanılır. Veriler bu tarayıcının
   localStorage'ında durur. Davranışı supabase/kurulum.sql'deki fonksiyonlarla aynıdır. */
const DBK = "atolye-sahte-db", SK = "atolye-sahte-oturum";
const load = () => { try { return JSON.parse(localStorage.getItem(DBK)) || null; } catch (_) { return null; } };
const store = (d) => localStorage.setItem(DBK, JSON.stringify(d));
const sess = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch (_) { return null; } };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const rnd = (a, n) => Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
const err = (c) => { const e = new Error(c); e.code = c; throw e; };
const low = (s) => String(s || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");

export function mockApi() {
  const db = load() || {};
  Object.entries({ kurum_kodu: "TEST", mudur_kodu: "MUDUR", users: {}, ogretmenler: {}, siniflar: [], ortaklar: [], ogrenciler: [], oturumlar: {}, ilerleme: {}, denemeler: [] }).forEach(([k, v]) => { if (db[k] == null) db[k] = v; });
  const save = () => store(db);
  const uid = () => { const s = sess(); return s && s.uid; };
  const T = () => db.ogretmenler[uid()];
  const isTeacher = () => !!(T() && T().aktif !== false);
  const isMudur = () => isTeacher() && !!T().mudur;
  const ortak = (sid, t) => db.ortaklar.some((o) => o.s === sid && o.t === (t || uid()));
  const access = (c) => isTeacher() && (isMudur() || c.ogretmen_id === uid() || ortak(c.id));
  const owner = (c) => isTeacher() && (isMudur() || c.ogretmen_id === uid());
  const mine = (sid) => { const c = db.siniflar.find((x) => x.id === sid); if (!c || !access(c)) err("yetki_yok"); return c; };
  const own = (sid) => { const c = db.siniflar.find((x) => x.id === sid); if (!c || !owner(c)) err("yetki_yok"); return c; };
  const ben = () => {
    const u = uid(); if (!u) return { rol: null };
    if (db.ogretmenler[u]) return db.ogretmenler[u].aktif === false ? { rol: null, pasif: true } : { rol: "ogretmen", id: u, ad: db.ogretmenler[u].ad, mudur: !!db.ogretmenler[u].mudur };
    const oid = db.oturumlar[u]; const o = db.ogrenciler.find((x) => x.id === oid);
    if (!o) return { rol: null };
    const c = db.siniflar.find((x) => x.id === o.sinif_id);
    return { rol: "ogrenci", takma_ad: o.takma_ad, sinif: c.ad, sinif_kod: c.kod };
  };
  const fns = {
    ben,
    ogretmen_kaydol({ p_ad, p_kurum_kodu }) {
      const s = sess(); if (!s || s.anon) err("giris_gerekli");
      const m = p_kurum_kodu === db.mudur_kodu; if (!m && p_kurum_kodu !== db.kurum_kodu) err("kurum_kodu_hatali");
      const old = db.ogretmenler[s.uid] || { aktif: true };
      db.ogretmenler[s.uid] = { ...old, ad: p_ad.trim(), mudur: !!old.mudur || m }; save(); return ben();
    },
    sinif_olustur({ p_ad }) {
      if (!isTeacher()) err("yetki_yok");
      let k; do { k = rnd("ABCDEFGHJKMNPRSTUVYZ23456789", 6); } while (db.siniflar.some((c) => c.kod === k));
      const c = { id: uuid(), ogretmen_id: uid(), ad: p_ad.trim(), kod: k, olusturma: new Date().toISOString() };
      db.siniflar.push(c); save(); return { id: c.id, ad: c.ad, kod: c.kod };
    },
    siniflarim() {
      if (!isTeacher()) err("yetki_yok");
      return db.siniflar.filter(access).map((c) => ({ ...c, sahip_id: c.ogretmen_id, sahip_ad: (db.ogretmenler[c.ogretmen_id] || {}).ad, benim: c.ogretmen_id === uid(), ortak: ortak(c.id), ogrenci_sayisi: db.ogrenciler.filter((o) => o.sinif_id === c.id).length }));
    },
    sinif_sil({ p_sinif }) {
      own(p_sinif); db.ortaklar = db.ortaklar.filter((o) => o.s !== p_sinif);
      const ids = db.ogrenciler.filter((o) => o.sinif_id === p_sinif).map((o) => o.id);
      db.ogrenciler = db.ogrenciler.filter((o) => o.sinif_id !== p_sinif);
      ids.forEach((id) => { delete db.ilerleme[id]; Object.keys(db.oturumlar).forEach((u) => { if (db.oturumlar[u] === id) delete db.oturumlar[u]; }); });
      db.siniflar = db.siniflar.filter((c) => c.id !== p_sinif); save(); return null;
    },
    ogrenci_ekle({ p_sinif, p_adlar }) {
      mine(p_sinif); if (p_adlar.length > 60) err("cok_fazla");
      const eklenen = [], atlanan = [];
      p_adlar.forEach((a) => {
        a = String(a).trim().replace(/\s+/g, " "); if (!a) return;
        if (a.length < 2 || a.length > 30 || db.ogrenciler.some((o) => o.sinif_id === p_sinif && low(o.takma_ad) === low(a))) { atlanan.push(a); return; }
        const pin = rnd("0123456789", 4);
        db.ogrenciler.push({ id: uuid(), sinif_id: p_sinif, takma_ad: a, pin, son_giris: null }); eklenen.push({ takma_ad: a, pin });
      });
      save(); return { eklenen, atlanan };
    },
    ogrenci_pin_yenile({ p_ogrenci }) {
      const o = db.ogrenciler.find((x) => x.id === p_ogrenci); if (!o) err("yetki_yok"); mine(o.sinif_id);
      o.pin = rnd("0123456789", 4); Object.keys(db.oturumlar).forEach((u) => { if (db.oturumlar[u] === o.id) delete db.oturumlar[u]; });
      save(); return { takma_ad: o.takma_ad, pin: o.pin };
    },
    ogrenci_sil({ p_ogrenci }) {
      const o = db.ogrenciler.find((x) => x.id === p_ogrenci); if (!o) err("yetki_yok"); mine(o.sinif_id);
      db.ogrenciler = db.ogrenciler.filter((x) => x.id !== o.id); delete db.ilerleme[o.id]; save(); return null;
    },
    sinif_raporu({ p_sinif }) {
      mine(p_sinif);
      return db.ogrenciler.filter((o) => o.sinif_id === p_sinif).sort((a, b) => low(a.takma_ad).localeCompare(low(b.takma_ad), "tr"))
        .map((o) => ({ id: o.id, takma_ad: o.takma_ad, pin: o.pin || null, son_giris: o.son_giris, guncelleme: db.ilerleme[o.id] ? db.ilerleme[o.id].guncelleme : null, veri: db.ilerleme[o.id] ? db.ilerleme[o.id].veri : {} }));
    },
    ogrenci_giris({ p_kod, p_takma_ad, p_pin }) {
      if (!uid()) err("giris_gerekli"); if (isTeacher()) err("ogretmen_hesabi");
      const k = String(p_kod).trim().toUpperCase(), a = low(p_takma_ad), now = Date.now();
      const fails = db.denemeler.filter((d) => d.k === k && d.a === a && !d.ok && now - d.t < 15 * 60000).length;
      if (fails >= 8) return { hata: "cok_deneme" };
      const c = db.siniflar.find((x) => x.kod === k), o = c && db.ogrenciler.find((x) => x.sinif_id === c.id && low(x.takma_ad) === a);
      if (!o || o.pin !== String(p_pin)) { db.denemeler.push({ k, a, ok: false, t: now }); save(); return { hata: "gecersiz_giris" }; }
      db.oturumlar[uid()] = o.id; o.son_giris = new Date().toISOString(); save();
      return { rol: "ogrenci", takma_ad: o.takma_ad, sinif: c.ad, sinif_kod: c.kod };
    },
    ogrenci_tasi({ p_ogrenci, p_hedef }) {
      const o = db.ogrenciler.find((x) => x.id === p_ogrenci); if (!o) err("yetki_yok"); mine(o.sinif_id); mine(p_hedef);
      if (o.sinif_id === p_hedef) return null;
      if (db.ogrenciler.some((x) => x.sinif_id === p_hedef && low(x.takma_ad) === low(o.takma_ad))) err("ad_cakisiyor");
      o.sinif_id = p_hedef; save(); return null;
    },
    sinif_ogretmenleri({ p_sinif }) {
      const c = mine(p_sinif), ad = (t) => (db.ogretmenler[t] || {}).ad;
      return [{ id: c.ogretmen_id, ad: ad(c.ogretmen_id), sahip: true }].concat(db.ortaklar.filter((o) => o.s === p_sinif).map((o) => ({ id: o.t, ad: ad(o.t), sahip: false })));
    },
    ogretmen_listesi() { if (!isTeacher()) err("yetki_yok"); return Object.entries(db.ogretmenler).filter(([, t]) => t.aktif !== false).map(([id, t]) => ({ id, ad: t.ad, mudur: !!t.mudur })).sort((a, b) => a.ad.localeCompare(b.ad, "tr")); },
    sinif_ogretmen_ekle({ p_sinif, p_ogretmen }) {
      const c = own(p_sinif); const t = db.ogretmenler[p_ogretmen]; if (!t || t.aktif === false) err("ogretmen_yok");
      if (c.ogretmen_id !== p_ogretmen && !ortak(p_sinif, p_ogretmen)) db.ortaklar.push({ s: p_sinif, t: p_ogretmen }); save(); return null;
    },
    sinif_ogretmen_cikar({ p_sinif, p_ogretmen }) {
      const c = db.siniflar.find((x) => x.id === p_sinif); if (!c || !(owner(c) || (p_ogretmen === uid() && access(c)))) err("yetki_yok");
      db.ortaklar = db.ortaklar.filter((o) => !(o.s === p_sinif && o.t === p_ogretmen)); save(); return null;
    },
    sinif_devret({ p_sinif, p_ogretmen }) {
      const c = own(p_sinif); const t = db.ogretmenler[p_ogretmen]; if (!t || t.aktif === false) err("ogretmen_yok");
      if (c.ogretmen_id === p_ogretmen) return null;
      const eski = c.ogretmen_id; c.ogretmen_id = p_ogretmen;
      db.ortaklar = db.ortaklar.filter((o) => !(o.s === p_sinif && o.t === p_ogretmen));
      if (!ortak(p_sinif, eski)) db.ortaklar.push({ s: p_sinif, t: eski }); save(); return null;
    },
    mudur_ogretmenler() {
      if (!isMudur()) err("yetki_yok");
      return Object.entries(db.ogretmenler).map(([id, t]) => ({ id, ad: t.ad, mudur: !!t.mudur, aktif: t.aktif !== false, sinif_sayisi: db.siniflar.filter((c) => c.ogretmen_id === id).length, ortak_sayisi: db.ortaklar.filter((o) => o.t === id).length }))
        .sort((a, b) => (b.aktif - a.aktif) || a.ad.localeCompare(b.ad, "tr"));
    },
    ogretmen_aktiflik({ p_ogretmen, p_aktif }) {
      if (!isMudur()) err("yetki_yok"); if (p_ogretmen === uid()) err("kendini_kapatamazsin");
      if (db.ogretmenler[p_ogretmen]) db.ogretmenler[p_ogretmen].aktif = !!p_aktif; save(); return null;
    },
    ogrenci_cikis() { delete db.oturumlar[uid()]; save(); return null; },
    ilerleme_getir() { const o = db.oturumlar[uid()]; if (!o) err("oturum_yok"); return db.ilerleme[o] || null; },
    ilerleme_kaydet({ p_veri }) {
      const o = db.oturumlar[uid()]; if (!o) err("oturum_yok");
      const t = new Date().toISOString(); db.ilerleme[o] = { veri: p_veri, guncelleme: t };
      const og = db.ogrenciler.find((x) => x.id === o); if (og) og.son_giris = t; save(); return t;
    }
  };
  const delay = () => new Promise((r) => setTimeout(r, 60));
  return {
    rpc: async (fn, args) => { await delay(); const f = fns[fn]; if (!f) err("bilinmeyen_fonksiyon"); return JSON.parse(JSON.stringify(f(args || {}) ?? null)); },
    session: async () => sess(),
    signInAnon: async () => { const s = { uid: uuid(), anon: true }; localStorage.setItem(SK, JSON.stringify(s)); return { session: s }; },
    signIn: async (email, password) => {
      await delay(); const u = db.users[email.toLowerCase()];
      if (!u || u.password !== password) err("Invalid login credentials");
      const s = { uid: u.id, anon: false }; localStorage.setItem(SK, JSON.stringify(s)); return { session: s };
    },
    signUp: async (email, password) => {
      await delay(); if (password.length < 6) err("Password should be at least 6 characters");
      if (db.users[email.toLowerCase()]) err("User already registered");
      const u = { id: uuid(), password }; db.users[email.toLowerCase()] = u; save();
      const s = { uid: u.id, anon: false }; localStorage.setItem(SK, JSON.stringify(s)); return { session: s };
    },
    signOut: async () => { localStorage.removeItem(SK); }
  };
}

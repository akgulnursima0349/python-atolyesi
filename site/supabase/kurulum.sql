-- =====================================================================
--  PYTHON ATÖLYESİ · VERİTABANI KURULUMU (Supabase)
--  Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
--  Dosya tekrar çalıştırılabilir; mevcut veriyi silmez.
--
--  Tasarım ilkeleri
--  - Öğrenciden e-posta, gerçek ad ya da doğum tarihi ALINMAZ. Öğrenci; öğretmenin
--    verdiği sınıf kodu + takma ad + 4 haneli PIN ile girer.
--  - Tablolara tarayıcıdan doğrudan erişim YOKTUR. Her işlem aşağıdaki fonksiyonlardan
--    geçer ve her fonksiyon çağıranın kim olduğunu (auth.uid()) kendisi kontrol eder.
--  - PIN'ler veritabanında açık halde değil, bcrypt özeti olarak saklanır.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tablolar ----------
create table if not exists public.ayarlar (
  anahtar text primary key,
  deger   text not null
);

create table if not exists public.ogretmenler (
  id         uuid primary key references auth.users(id) on delete cascade,
  ad         text not null check (char_length(ad) between 2 and 60),
  olusturma  timestamptz not null default now()
);

-- Sonradan eklenen sütunlar (dosya eski bir kurulumda tekrar çalıştırılırsa da eklenir)
alter table public.ogretmenler add column if not exists mudur boolean not null default false;  -- kurum müdürü: bütün sınıfları görür
alter table public.ogretmenler add column if not exists aktif boolean not null default true;   -- müdür bir öğretmenin erişimini kapatabilir

create table if not exists public.siniflar (
  id          uuid primary key default gen_random_uuid(),
  ogretmen_id uuid not null references public.ogretmenler(id) on delete cascade,
  ad          text not null check (char_length(ad) between 1 and 60),
  kod         text not null unique,
  olusturma   timestamptz not null default now()
);

create table if not exists public.ogrenciler (
  id         uuid primary key default gen_random_uuid(),
  sinif_id   uuid not null references public.siniflar(id) on delete cascade,
  takma_ad   text not null check (char_length(takma_ad) between 2 and 30),
  pin_hash   text not null,
  olusturma  timestamptz not null default now(),
  son_giris  timestamptz
);
create unique index if not exists ogrenciler_sinif_ad on public.ogrenciler (sinif_id, lower(takma_ad));

-- Bir sınıfa sonradan eklenen ortak öğretmenler (sınıfı açan öğretmen siniflar.ogretmen_id'dedir)
create table if not exists public.sinif_ogretmenleri (
  sinif_id    uuid not null references public.siniflar(id) on delete cascade,
  ogretmen_id uuid not null references public.ogretmenler(id) on delete cascade,
  primary key (sinif_id, ogretmen_id)
);
create index if not exists sinif_ogretmenleri_ogretmen on public.sinif_ogretmenleri (ogretmen_id);

-- Bir tarayıcı oturumu (Supabase anonim kullanıcısı) → hangi öğrenci
create table if not exists public.oturumlar (
  uid        uuid primary key references auth.users(id) on delete cascade,
  ogrenci_id uuid not null references public.ogrenciler(id) on delete cascade,
  olusturma  timestamptz not null default now()
);
create index if not exists oturumlar_ogrenci on public.oturumlar (ogrenci_id);

create table if not exists public.ilerleme (
  ogrenci_id uuid primary key references public.ogrenciler(id) on delete cascade,
  veri       jsonb not null default '{}'::jsonb,
  guncelleme timestamptz not null default now()
);

create table if not exists public.giris_denemeleri (
  id        bigint generated always as identity primary key,
  sinif_kod text not null,
  takma_ad  text not null,
  basarili  boolean not null,
  zaman     timestamptz not null default now()
);
create index if not exists giris_denemeleri_ara on public.giris_denemeleri (sinif_kod, takma_ad, zaman);

-- ---------- doğrudan erişimi kapat ----------
alter table public.ayarlar          enable row level security;
alter table public.ogretmenler      enable row level security;
alter table public.siniflar         enable row level security;
alter table public.ogrenciler       enable row level security;
alter table public.sinif_ogretmenleri enable row level security;
alter table public.oturumlar        enable row level security;
alter table public.ilerleme         enable row level security;
alter table public.giris_denemeleri enable row level security;
revoke all on public.ayarlar, public.ogretmenler, public.siniflar, public.ogrenciler, public.sinif_ogretmenleri,
              public.oturumlar, public.ilerleme, public.giris_denemeleri from anon, authenticated;

-- ---------- yardımcılar (dışarıya açık değil) ----------
create or replace function public._ogretmen_mi() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ogretmenler where id = auth.uid() and aktif);
$$;

create or replace function public._mudur_mu() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ogretmenler where id = auth.uid() and aktif and mudur);
$$;

-- Bu sınıfa erişebilir mi? (müdür, sınıfı açan öğretmen ya da ortak öğretmen)
create or replace function public._erisim(p_sinif uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public._ogretmen_mi() and (
    public._mudur_mu()
    or exists (select 1 from public.siniflar where id = p_sinif and ogretmen_id = auth.uid())
    or exists (select 1 from public.sinif_ogretmenleri where sinif_id = p_sinif and ogretmen_id = auth.uid()));
$$;

-- Sınıfı yönetebilir mi? (silme, öğretmen ekleme, devretme: sadece sahibi ve müdür)
create or replace function public._sahip_mi(p_sinif uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public._ogretmen_mi() and (public._mudur_mu() or exists (select 1 from public.siniflar where id = p_sinif and ogretmen_id = auth.uid()));
$$;

create or replace function public._oturum_ogrencisi() returns uuid
language sql stable security definer set search_path = public as $$
  select ogrenci_id from public.oturumlar where uid = auth.uid();
$$;

create or replace function public._sinifim(p_sinif uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public._erisim(p_sinif) then raise exception 'yetki_yok'; end if;
end $$;

create or replace function public._rastgele(p_alfabe text, p_uzunluk int) returns text
language plpgsql volatile set search_path = public, extensions as $$
declare s text := ''; b bytea := gen_random_bytes(p_uzunluk);
begin
  for i in 0 .. p_uzunluk - 1 loop
    s := s || substr(p_alfabe, (get_byte(b, i) % length(p_alfabe)) + 1, 1);
  end loop;
  return s;
end $$;

-- ---------- herkes ----------
-- Giriş yapan kişi kim? { rol: "ogretmen" | "ogrenci" | null, ... }
create or replace function public.ben() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('rol', null); end if;
  select case when aktif then jsonb_build_object('rol', 'ogretmen', 'id', id, 'ad', ad, 'mudur', mudur)
              else jsonb_build_object('rol', null, 'pasif', true) end
    into r from public.ogretmenler where id = auth.uid();
  if r is not null then return r; end if;
  select jsonb_build_object('rol', 'ogrenci', 'takma_ad', o.takma_ad, 'sinif', s.ad, 'sinif_kod', s.kod)
    into r from public.oturumlar t join public.ogrenciler o on o.id = t.ogrenci_id join public.siniflar s on s.id = o.sinif_id
   where t.uid = auth.uid();
  return coalesce(r, jsonb_build_object('rol', null));
end $$;

-- ---------- öğretmen ----------
create or replace function public.ogretmen_kaydol(p_ad text, p_kurum_kodu text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare kod text; mkod text; m boolean;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'giris_gerekli'; end if;
  select deger into kod from public.ayarlar where anahtar = 'kurum_kodu';
  select deger into mkod from public.ayarlar where anahtar = 'mudur_kodu';
  if mkod is not null and p_kurum_kodu = mkod then m := true;
  elsif kod is not null and p_kurum_kodu = kod then m := false;
  else raise exception 'kurum_kodu_hatali'; end if;
  insert into public.ogretmenler (id, ad, mudur) values (auth.uid(), trim(p_ad), m)
    on conflict (id) do update set ad = excluded.ad, mudur = public.ogretmenler.mudur or excluded.mudur;
  return public.ben();
end $$;

create or replace function public.sinif_olustur(p_ad text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare k text; r public.siniflar;
begin
  if not public._ogretmen_mi() then raise exception 'yetki_yok'; end if;
  loop
    k := public._rastgele('ABCDEFGHJKMNPRSTUVYZ23456789', 6);
    exit when not exists (select 1 from public.siniflar where kod = k);
  end loop;
  insert into public.siniflar (ogretmen_id, ad, kod) values (auth.uid(), trim(p_ad), k) returning * into r;
  return jsonb_build_object('id', r.id, 'ad', r.ad, 'kod', r.kod);
end $$;

-- Erişebildiğim sınıflar. Müdür için kurumdaki bütün sınıflar.
create or replace function public.siniflarim() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._ogretmen_mi() then raise exception 'yetki_yok'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'ad', s.ad, 'kod', s.kod, 'olusturma', s.olusturma,
           'sahip_id', s.ogretmen_id, 'sahip_ad', t.ad, 'benim', s.ogretmen_id = auth.uid(),
           'ortak', exists (select 1 from public.sinif_ogretmenleri so where so.sinif_id = s.id and so.ogretmen_id = auth.uid()),
           'ogrenci_sayisi', (select count(*) from public.ogrenciler o where o.sinif_id = s.id)) order by s.olusturma)
           from public.siniflar s join public.ogretmenler t on t.id = s.ogretmen_id
          where public._erisim(s.id)), '[]'::jsonb);
end $$;

-- Bir sınıfın öğretmenleri (sahibi + ortaklar)
create or replace function public.sinif_ogretmenleri(p_sinif uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._sinifim(p_sinif);
  return (select jsonb_agg(x order by (x ->> 'sahip') desc, x ->> 'ad') from (
    select jsonb_build_object('id', t.id, 'ad', t.ad, 'sahip', true) x from public.siniflar s join public.ogretmenler t on t.id = s.ogretmen_id where s.id = p_sinif
    union all
    select jsonb_build_object('id', t.id, 'ad', t.ad, 'sahip', false) from public.sinif_ogretmenleri so join public.ogretmenler t on t.id = so.ogretmen_id where so.sinif_id = p_sinif) q);
end $$;

-- Kurumdaki aktif öğretmenler (ortak öğretmen seçerken). Sadece ad görünür.
create or replace function public.ogretmen_listesi() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._ogretmen_mi() then raise exception 'yetki_yok'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'ad', ad, 'mudur', mudur) order by ad) from public.ogretmenler where aktif), '[]'::jsonb);
end $$;

create or replace function public.sinif_ogretmen_ekle(p_sinif uuid, p_ogretmen uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public._sahip_mi(p_sinif) then raise exception 'yetki_yok'; end if;
  if not exists (select 1 from public.ogretmenler where id = p_ogretmen and aktif) then raise exception 'ogretmen_yok'; end if;
  if exists (select 1 from public.siniflar where id = p_sinif and ogretmen_id = p_ogretmen) then return; end if;
  insert into public.sinif_ogretmenleri (sinif_id, ogretmen_id) values (p_sinif, p_ogretmen) on conflict do nothing;
end $$;

create or replace function public.sinif_ogretmen_cikar(p_sinif uuid, p_ogretmen uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  -- sahip ve müdür herkesi çıkarabilir; ortak öğretmen sadece kendini çıkarabilir
  if not (public._sahip_mi(p_sinif) or (p_ogretmen = auth.uid() and public._erisim(p_sinif))) then raise exception 'yetki_yok'; end if;
  delete from public.sinif_ogretmenleri where sinif_id = p_sinif and ogretmen_id = p_ogretmen;
end $$;

-- Sınıfı başka bir öğretmene devret. Eski sahibi ortak öğretmen olarak kalır.
create or replace function public.sinif_devret(p_sinif uuid, p_ogretmen uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare eski uuid;
begin
  if not public._sahip_mi(p_sinif) then raise exception 'yetki_yok'; end if;
  if not exists (select 1 from public.ogretmenler where id = p_ogretmen and aktif) then raise exception 'ogretmen_yok'; end if;
  select ogretmen_id into eski from public.siniflar where id = p_sinif;
  if eski = p_ogretmen then return; end if;
  update public.siniflar set ogretmen_id = p_ogretmen where id = p_sinif;
  delete from public.sinif_ogretmenleri where sinif_id = p_sinif and ogretmen_id = p_ogretmen;
  insert into public.sinif_ogretmenleri (sinif_id, ogretmen_id) values (p_sinif, eski) on conflict do nothing;
end $$;

-- ---------- kurum müdürü ----------
create or replace function public.mudur_ogretmenler() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._mudur_mu() then raise exception 'yetki_yok'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'ad', t.ad, 'mudur', t.mudur, 'aktif', t.aktif, 'olusturma', t.olusturma,
           'sinif_sayisi', (select count(*) from public.siniflar s where s.ogretmen_id = t.id),
           'ortak_sayisi', (select count(*) from public.sinif_ogretmenleri so where so.ogretmen_id = t.id)) order by t.aktif desc, t.ad)
           from public.ogretmenler t), '[]'::jsonb);
end $$;

-- Bir öğretmenin erişimini kapat/aç (ör. kurumdan ayrıldığında). Sınıfları ve öğrencileri silinmez.
create or replace function public.ogretmen_aktiflik(p_ogretmen uuid, p_aktif boolean) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public._mudur_mu() then raise exception 'yetki_yok'; end if;
  if p_ogretmen = auth.uid() then raise exception 'kendini_kapatamazsin'; end if;
  update public.ogretmenler set aktif = p_aktif where id = p_ogretmen;
end $$;

create or replace function public.sinif_sil(p_sinif uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public._sahip_mi(p_sinif) then raise exception 'yetki_yok'; end if;
  delete from public.siniflar where id = p_sinif;
end $$;

-- Öğrenci ekle: takma adların listesi → her biri için yeni PIN (PIN'ler yalnızca bu cevapta görünür)
create or replace function public.ogrenci_ekle(p_sinif uuid, p_adlar text[]) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare a text; pin text; sonuc jsonb := '[]'::jsonb; atlanan jsonb := '[]'::jsonb;
begin
  perform public._sinifim(p_sinif);
  if coalesce(array_length(p_adlar, 1), 0) > 60 then raise exception 'cok_fazla'; end if;
  foreach a in array p_adlar loop
    a := regexp_replace(trim(a), '\s+', ' ', 'g');
    continue when a = '';
    if char_length(a) < 2 or char_length(a) > 30
       or exists (select 1 from public.ogrenciler where sinif_id = p_sinif and lower(takma_ad) = lower(a)) then
      atlanan := atlanan || to_jsonb(a); continue;
    end if;
    pin := public._rastgele('0123456789', 4);
    insert into public.ogrenciler (sinif_id, takma_ad, pin_hash) values (p_sinif, a, crypt(pin, gen_salt('bf', 8)));
    sonuc := sonuc || jsonb_build_object('takma_ad', a, 'pin', pin);
  end loop;
  return jsonb_build_object('eklenen', sonuc, 'atlanan', atlanan);
end $$;

create or replace function public.ogrenci_pin_yenile(p_ogrenci uuid) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare s uuid; pin text; ad text;
begin
  select sinif_id, takma_ad into s, ad from public.ogrenciler where id = p_ogrenci;
  if s is null then raise exception 'yetki_yok'; end if;
  perform public._sinifim(s);
  pin := public._rastgele('0123456789', 4);
  update public.ogrenciler set pin_hash = crypt(pin, gen_salt('bf', 8)) where id = p_ogrenci;
  delete from public.oturumlar where ogrenci_id = p_ogrenci;   -- eski cihazlardan çıkış
  return jsonb_build_object('takma_ad', ad, 'pin', pin);
end $$;

create or replace function public.ogrenci_sil(p_ogrenci uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare s uuid;
begin
  select sinif_id into s from public.ogrenciler where id = p_ogrenci;
  if s is null then raise exception 'yetki_yok'; end if;
  perform public._sinifim(s);
  delete from public.ogrenciler where id = p_ogrenci;
end $$;

-- Öğrenciyi başka bir sınıfa taşı: ilerlemesi ve PIN'i aynen kalır, sadece sınıf kodu değişir.
create or replace function public.ogrenci_tasi(p_ogrenci uuid, p_hedef uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare s uuid; ad text;
begin
  select sinif_id, takma_ad into s, ad from public.ogrenciler where id = p_ogrenci;
  if s is null then raise exception 'yetki_yok'; end if;
  perform public._sinifim(s);
  perform public._sinifim(p_hedef);
  if s = p_hedef then return; end if;
  if exists (select 1 from public.ogrenciler where sinif_id = p_hedef and lower(takma_ad) = lower(ad)) then raise exception 'ad_cakisiyor'; end if;
  update public.ogrenciler set sinif_id = p_hedef where id = p_ogrenci;
end $$;

-- Sınıfın bütün öğrencileri ve ilerleme kayıtları (öğretmen paneli)
create or replace function public.sinif_raporu(p_sinif uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._sinifim(p_sinif);
  return coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'takma_ad', o.takma_ad, 'son_giris', o.son_giris,
           'guncelleme', i.guncelleme, 'veri', coalesce(i.veri, '{}'::jsonb)) order by lower(o.takma_ad))
           from public.ogrenciler o left join public.ilerleme i on i.ogrenci_id = o.id where o.sinif_id = p_sinif), '[]'::jsonb);
end $$;

-- ---------- öğrenci ----------
create or replace function public.ogrenci_giris(p_kod text, p_takma_ad text, p_pin text) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare k text := upper(trim(p_kod)); a text := lower(regexp_replace(trim(p_takma_ad), '\s+', ' ', 'g')); o record; hatali int;
begin
  if auth.uid() is null then raise exception 'giris_gerekli'; end if;
  if public._ogretmen_mi() then raise exception 'ogretmen_hesabi'; end if;
  select count(*) into hatali from public.giris_denemeleri
   where sinif_kod = k and takma_ad = a and not basarili and zaman > now() - interval '15 minutes';
  -- Hatalı girişler hata fırlatarak değil, cevapla bildirilir: böylece deneme kaydı geri alınmaz ve kilit çalışır.
  if hatali >= 8 then return jsonb_build_object('hata', 'cok_deneme'); end if;
  select og.id, og.takma_ad, og.pin_hash, s.ad as sinif_ad, s.kod into o
    from public.ogrenciler og join public.siniflar s on s.id = og.sinif_id
   where s.kod = k and lower(og.takma_ad) = a;
  if o.id is null or o.pin_hash <> crypt(coalesce(p_pin, ''), o.pin_hash) then
    insert into public.giris_denemeleri (sinif_kod, takma_ad, basarili) values (k, a, false);
    return jsonb_build_object('hata', 'gecersiz_giris');
  end if;
  insert into public.giris_denemeleri (sinif_kod, takma_ad, basarili) values (k, a, true);
  delete from public.giris_denemeleri where zaman < now() - interval '1 day';
  insert into public.oturumlar (uid, ogrenci_id) values (auth.uid(), o.id)
    on conflict (uid) do update set ogrenci_id = excluded.ogrenci_id, olusturma = now();
  update public.ogrenciler set son_giris = now() where id = o.id;
  return jsonb_build_object('rol', 'ogrenci', 'takma_ad', o.takma_ad, 'sinif', o.sinif_ad, 'sinif_kod', o.kod);
end $$;

create or replace function public.ogrenci_cikis() returns void
language sql volatile security definer set search_path = public as $$
  delete from public.oturumlar where uid = auth.uid();
$$;

create or replace function public.ilerleme_getir() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  return (select jsonb_build_object('veri', veri, 'guncelleme', guncelleme) from public.ilerleme where ogrenci_id = og);
end $$;

create or replace function public.ilerleme_kaydet(p_veri jsonb) returns timestamptz
language plpgsql volatile security definer set search_path = public as $$
declare og uuid := public._oturum_ogrencisi(); t timestamptz := now();
begin
  if og is null then raise exception 'oturum_yok'; end if;
  if jsonb_typeof(p_veri) <> 'object' or pg_column_size(p_veri) > 300000 then raise exception 'veri_gecersiz'; end if;
  insert into public.ilerleme (ogrenci_id, veri, guncelleme) values (og, p_veri, t)
    on conflict (ogrenci_id) do update set veri = excluded.veri, guncelleme = t;
  update public.ogrenciler set son_giris = t where id = og;
  return t;
end $$;

-- ---------- yetkiler: sadece giriş yapmış oturumlar (anonim öğrenci oturumu dahil) çağırabilir ----------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.ben(), public.ogretmen_kaydol(text, text), public.sinif_olustur(text), public.siniflarim(),
  public.sinif_sil(uuid), public.ogrenci_ekle(uuid, text[]), public.ogrenci_pin_yenile(uuid), public.ogrenci_sil(uuid),
  public.sinif_raporu(uuid), public.ogrenci_tasi(uuid, uuid), public.sinif_ogretmenleri(uuid), public.ogretmen_listesi(),
  public.sinif_ogretmen_ekle(uuid, uuid), public.sinif_ogretmen_cikar(uuid, uuid), public.sinif_devret(uuid, uuid),
  public.mudur_ogretmenler(), public.ogretmen_aktiflik(uuid, boolean), public.ogrenci_giris(text, text, text), public.ogrenci_cikis(), public.ilerleme_getir(),
  public.ilerleme_kaydet(jsonb) to authenticated;
revoke execute on function public._ogretmen_mi(), public._mudur_mu(), public._erisim(uuid), public._sahip_mi(uuid),
  public._oturum_ogrencisi(), public._sinifim(uuid), public._rastgele(text, int) from authenticated;

-- ---------- kurum kodları ----------
-- Hesap açarken girilen iki gizli kod var:
--   kurum_kodu → öğretmen hesabı açar
--   mudur_kodu → kurum müdürü hesabı açar (bütün sınıfları ve öğretmenleri görür)
-- Aşağıdaki iki satırı kendi kodlarınla değiştirip ayrı bir sorguda çalıştır. Kodlar birbirinden farklı olmalı.
-- (Kod girilmezse o türden hesap açılamaz; bu bilinçli bir güvenlik önlemi.)
-- insert into public.ayarlar (anahtar, deger) values ('kurum_kodu', 'OGRETMEN-GIZLI-KOD') on conflict (anahtar) do update set deger = excluded.deger;
-- insert into public.ayarlar (anahtar, deger) values ('mudur_kodu', 'MUDUR-GIZLI-KOD')    on conflict (anahtar) do update set deger = excluded.deger;

\set ON_ERROR_STOP 0
\set QUIET 1
-- kullanıcılar: öğretmen T1, başka öğretmen T2, iki anonim tarayıcı A1 A2, kötü niyetli X
insert into auth.users values ('00000000-0000-0000-0000-0000000000a1', false), ('00000000-0000-0000-0000-0000000000a2', false), ('00000000-0000-0000-0000-0000000000a3', false), ('00000000-0000-0000-0000-0000000000d1', false),
  ('00000000-0000-0000-0000-0000000000b1', true), ('00000000-0000-0000-0000-0000000000b2', true), ('00000000-0000-0000-0000-0000000000c1', true);
insert into public.ayarlar values ('kurum_kodu', 'SRA-2026'), ('mudur_kodu', 'MUDUR-2026');

create or replace function pg_temp.olarak(u text, anonim boolean) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', u, 'is_anonymous', anonim)::text, false); end $$;

set role authenticated;
\echo '--- 1. öğretmen yanlış kurum koduyla kaydolamaz'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false);
select public.ogretmen_kaydol('Nur Hoca', 'yanlis');
\echo '--- 2. anonim oturum öğretmen olamaz'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000b1', true);
select public.ogretmen_kaydol('Sahte', 'SRA-2026');
\echo '--- 3. doğru kodla kayıt + sınıf + öğrenci'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false);
select public.ogretmen_kaydol('Nur Hoca', 'SRA-2026');
select (public.sinif_olustur('7-A Python')) ->> 'kod' as kod \gset
\echo :kod
select (public.siniflarim() -> 0 ->> 'id') as sinif \gset
select public.ogrenci_ekle(:'sinif', array['Kartal', 'Yıldız Ece', 'kartal', ' ', 'X']) as ekle \gset
\echo :ekle
select (:'ekle'::jsonb -> 'eklenen' -> 0 ->> 'pin') as pin1 \gset
\echo '--- 4. tablolara doğrudan erişim yok'
select count(*) from public.ogrenciler;
select count(*) from public.ilerleme;
\echo '--- 5. başka öğretmen bu sınıfı göremez / silemez'
reset role; select pg_temp.olarak('00000000-0000-0000-0000-0000000000a2', false); set role authenticated;
select public.sinif_raporu(:'sinif');
select public.ogrenci_ekle(:'sinif', array['Sızma']);
\echo '--- 6. öğrenci yanlış PIN, sonra doğru PIN (büyük-küçük harf ve boşluk toleransı)'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000b1', true);
select public.ogrenci_giris(:'kod', 'Kartal', '0000x');
select public.ogrenci_giris(lower(:'kod'), '  KARTAL ', :'pin1');
select public.ben();
\echo '--- 7. ilerleme kaydet / getir'
select public.ilerleme_kaydet('{"done":{"ders-0":true},"tests":{"on":{"done":true,"score":5}}}') is not null as kaydedildi;
select public.ilerleme_getir() -> 'veri';
select public.ilerleme_kaydet('[1,2]');
\echo '--- 8. ikinci cihaz aynı öğrenciye girer ve aynı veriyi görür'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000b2', true);
select public.ogrenci_giris(:'kod', 'kartal', :'pin1') ->> 'takma_ad';
select public.ilerleme_getir() -> 'veri' -> 'done';
\echo '--- 9. öğrenci öğretmen fonksiyonlarını çağıramaz'
select public.sinif_raporu(:'sinif');
select public.siniflarim();
\echo '--- 10. giriş yapmamış oturum ilerleme kaydedemez'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000c1', true);
select public.ilerleme_kaydet('{}');
\echo '--- 11. kaba kuvvet: 8 hatalı denemeden sonra kilit'
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1111');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1112');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1113');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1114');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1115');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1116');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1117');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1118');
select public.ogrenci_giris(:'kod', 'Yıldız Ece', '1119');
\echo '--- 12. öğretmen raporu görür, PIN yeniler; eski cihazlar düşer'
reset role; select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false); set role authenticated;
select jsonb_array_length(public.sinif_raporu(:'sinif')) as ogrenci_sayisi, public.sinif_raporu(:'sinif') -> 0 -> 'veri' -> 'tests' as kartal_testler;
select (public.sinif_raporu(:'sinif') -> 0 ->> 'id') as kartal \gset
select public.ogrenci_pin_yenile(:'kartal') ->> 'takma_ad';
select pg_temp.olarak('00000000-0000-0000-0000-0000000000b1', true);
select public.ilerleme_getir();
\echo '--- 13. anon rolü hiçbir fonksiyonu çağıramaz'
reset role; set role anon;
select public.ben();
reset role;
\echo '--- 15. ikinci öğretmen + müdür kaydı'
reset role; select pg_temp.olarak('00000000-0000-0000-0000-0000000000a2', false); set role authenticated;
select public.ogretmen_kaydol('Ali Hoca', 'SRA-2026') ->> 'mudur' as ali_mudur;
select (public.sinif_olustur('8-B')) ->> 'id' as sinif2 \gset
select public.ogrenci_ekle(:'sinif2', array['Kartal', 'Deniz']) -> 'eklenen' -> 1 ->> 'takma_ad';
select pg_temp.olarak('00000000-0000-0000-0000-0000000000d1', false);
select public.ogretmen_kaydol('Müdür Bey', 'MUDUR-2026') ->> 'mudur' as mudur_mu;
select jsonb_array_length(public.siniflarim()) as mudurun_gordugu_sinif;
select jsonb_array_length(public.sinif_raporu(:'sinif2')) as mudur_rapor;
\echo '--- 16. Nur, Ali''nin sınıfını göremez; Ali Nur''u ortak öğretmen ekler, Nur görür'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false);
select jsonb_array_length(public.siniflarim()) as nur_sinif;
select public.sinif_raporu(:'sinif2');
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a2', false);
select public.sinif_ogretmen_ekle(:'sinif2', '00000000-0000-0000-0000-0000000000a1');
select jsonb_agg(x ->> 'ad') from jsonb_array_elements(public.sinif_ogretmenleri(:'sinif2')) x;
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false);
select jsonb_array_length(public.sinif_raporu(:'sinif2')) as nur_artik_goruyor;
\echo '--- 17. ortak öğretmen sınıfı silemez, başka öğretmen ekleyemez'
select public.sinif_sil(:'sinif2');
select public.sinif_ogretmen_ekle(:'sinif2', '00000000-0000-0000-0000-0000000000d1');
\echo '--- 18. öğrenci taşıma: ad çakışması, sonra başarılı taşıma ve ilerleme korunur'
select (public.sinif_raporu(:'sinif') -> 0 ->> 'id') as kartal1 \gset
select (public.sinif_raporu(:'sinif2') -> 0 ->> 'id') as deniz2 \gset
select public.ogrenci_tasi(:'kartal1', :'sinif2');
select public.ogrenci_tasi(:'deniz2', :'sinif');
select jsonb_agg(x ->> 'takma_ad') from jsonb_array_elements(public.sinif_raporu(:'sinif')) x;
\echo '--- 19. yabancı öğretmen öğrenci taşıyamaz'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a3', false);
select public.ogretmen_kaydol('Yeni Hoca', 'SRA-2026') ->> 'rol';
select public.ogrenci_tasi(:'deniz2', :'sinif2');
\echo '--- 20. devret: sahiplik Nur''a geçer, Ali ortak kalır'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a2', false);
select public.sinif_devret(:'sinif2', '00000000-0000-0000-0000-0000000000a1');
select jsonb_agg((x ->> 'ad') || ':' || (x ->> 'sahip')) from jsonb_array_elements(public.sinif_ogretmenleri(:'sinif2')) x;
\echo '--- 21. müdür bir öğretmeni pasif yapar: erişemez, ben() pasif der; öğretmen müdürlük alamaz'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000d1', false);
select public.ogretmen_aktiflik('00000000-0000-0000-0000-0000000000a2', false);
select public.ogretmen_aktiflik('00000000-0000-0000-0000-0000000000d1', false);
select jsonb_agg((x ->> 'ad') || ':' || (x ->> 'aktif')) from jsonb_array_elements(public.mudur_ogretmenler()) x;
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a2', false);
select public.ben();
select public.siniflarim();
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false);
select public.mudur_ogretmenler();
reset role;
\echo '--- 14. öğretmen sınıfı siler, her şey temizlenir'
select pg_temp.olarak('00000000-0000-0000-0000-0000000000a1', false); set role authenticated;
select public.sinif_sil(:'sinif');
reset role;
select (select count(*) from public.ogrenciler) ogr, (select count(*) from public.ilerleme) ilr, (select count(*) from public.oturumlar) otr;

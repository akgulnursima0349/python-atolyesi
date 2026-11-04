# Python Atölyesi · Hesaplı sürümün kurulumu

Toplam süre: yaklaşık 15 dakika. Bir kere yapılır.

## 1. Supabase projesi aç
1. https://supabase.com adresinde ücretsiz hesap aç, **New project** de.
2. Bölge (Region) olarak Avrupa'da bir bölge seç (ör. Frankfurt ya da Paris). Güçlü bir veritabanı şifresi belirle ve bir yere kaydet.

## 2. Veritabanını kur
1. Sol menüden **SQL Editor → New query**.
2. `kurulum.sql` dosyasının tamamını yapıştır, **Run** de. ("Success. No rows returned" görmelisin.)
3. Yeni bir sorguya şu iki satırı, kendi gizli kodlarınla yaz ve çalıştır. İki kod birbirinden farklı olmalı:
   ```sql
   insert into public.ayarlar (anahtar, deger) values ('kurum_kodu', 'OGRETMEN-GIZLI-KOD') on conflict (anahtar) do update set deger = excluded.deger;
   insert into public.ayarlar (anahtar, deger) values ('mudur_kodu', 'MUDUR-GIZLI-KOD') on conflict (anahtar) do update set deger = excluded.deger;
   ```
   - **kurum_kodu**: Öğretmenler hesap açarken bunu girer. Kurumdaki eğitmenlerle paylaş.
   - **mudur_kodu**: Bununla açılan hesap **kurum müdürü** olur: bütün sınıfları ve öğretmenleri görür, öğretmen erişimini kapatabilir. Sadece müdürle paylaş. Müdür hesabı açıldıktan sonra bu kodu değiştirmek iyi olur (aynı satırı yeni kodla tekrar çalıştır).

## 3. Giriş ayarları
1. **Authentication → Sign In / Providers**: **Allow anonymous sign-ins** seçeneğini aç. (Öğrenciler e-postasız, sınıf kodu + PIN ile bu sayede girer.)
2. Aynı sayfada **Email** sağlayıcısı açık kalsın. Öğretmenler e-posta ve şifreyle girer.
3. Site yayınlandıktan sonra **Authentication → URL Configuration → Site URL** alanına sitenin adresini yaz (onay e-postasındaki bağlantı oraya gider).

## 4. Bilgileri sitenin ayar dosyasına yaz
**Project Settings → API** sayfasından:
- **Project URL** → `ayarlar.js` içinde `supabaseUrl`
- **anon public** anahtarı → `supabaseKey`

Anon anahtarın sitede görünmesi normaldir; veriler kurulum.sql'deki kurallarla korunur. **service_role** anahtarını asla siteye koyma.

## 5. Yayın (GitHub Pages)
Repo ayarlarında **Settings → Pages → Source: GitHub Actions** seç. Her güncellemede site kendiliğinden derlenip yayınlanır.

## Roller
| | Öğrenci | Öğretmen | Kurum müdürü |
|---|---|---|---|
| Giriş | sınıf kodu + takma ad + PIN | e-posta + şifre | e-posta + şifre |
| Gördüğü sınıflar | kendi sınıfı | açtığı ve ortak olduğu sınıflar | bütün sınıflar |
| Öğrenci ekleme, PIN yenileme, taşıma | — | evet | evet |
| Sınıfa ortak öğretmen ekleme, sınıfı devretme ve silme | — | sadece kendi açtığı sınıfta | her sınıfta |
| Öğretmen erişimini kapatma | — | — | evet |

## Bilmen gerekenler
- Ücretsiz Supabase projesi **1 hafta hiç kullanılmazsa duraklatılır** (yaz tatili gibi). Panelden tek tıkla yeniden başlatılır, veriler kaybolmaz.
- Öğrenciden e-posta, gerçek ad ya da doğum tarihi alınmaz. Takma ad olarak ad + soyadın baş harfi (ör. "Elif K.") yeterli.
- Kurumunun velilere verdiği bilgilendirme metnine, öğrenci ilerlemesinin takma adla bir bulut veritabanında (Avrupa Birliği içinde) tutulduğunu eklemek iyi olur.
- PIN'ler sınıf sayfasındaki **Öğrenciler ve PIN'ler** sekmesinde her zaman görülebilir ve kartlar yeniden yazdırılabilir. Sadece o sınıfın öğretmenleri ve müdür görür. Ekran tahtaya yansıtılıyorsa PIN'ler gizli açılır, **PIN'leri göster** ile görünür.

## Güncellemeler
Sitede bir veritabanı değişikliği olduğunda (ör. PIN'lerin görünür olması) Supabase'de **SQL Editor → New query**'ye `kurulum.sql` dosyasının tamamını yeniden yapıştırıp **Run** demen yeterli. Dosya tekrar çalıştırılmaya uygundur: mevcut öğretmenler, sınıflar, öğrenciler ve ilerleme silinmez, kurum ve müdür kodların da aynı kalır.

/* =====================================================================
   ÖLÇME: ön test, aşama kontrolleri, son test.
   Ön test ile son test aynı 12 kazanımı ölçer. Sorular birbirinin "eşi"dir:
   aynı beceri, farklı soru. Böylece öğrenci son testte cevabı ezberden
   hatırlamaz, gelişim gerçekten görünür.
   Her soru: { k: kazanım no, q, code?, options, answer, why }
   ===================================================================== */

export var KAZANIMLAR = [
  { no: 1, ad: "Program ve programlama dili", kisa: "Program" },
  { no: 2, ad: "Yüksek seviyeli dil ve yorumlayıcı", kisa: "Dil seviyeleri" },
  { no: 3, ad: "Değişkenler ve veri tipleri", kisa: "Değişken ve tip" },
  { no: 4, ad: "Koşullar (if / else)", kisa: "Koşullar" },
  { no: 5, ad: "Döngüler (for / range)", kisa: "Döngüler" },
  { no: 6, ad: "Listeler ve sıra numarası", kisa: "Listeler" },
  { no: 7, ad: "Fonksiyonlar", kisa: "Fonksiyonlar" },
  { no: 8, ad: "Hata mesajlarını okumak", kisa: "Hata okuma" },
  { no: 9, ad: "Nesneler ve sınıflar", kisa: "Nesneler" },
  { no: 10, ad: "Makine öğrenmesinin temel fikri", kisa: "Makine öğrenmesi" },
  { no: 11, ad: "Eğitim / test verisi ve ezberleme", kisa: "Eğitim ve test" },
  { no: 12, ad: "Sınıflandırma ve kümeleme", kisa: "Model türleri" }
];

/* Ön test (A formu) */
export var ON_TEST = [
  { k: 1, q: "Bilgisayarın işlemcisi doğrudan hangisini anlar?", options: ["Türkçe cümleleri", "0 ve 1'lerden oluşan makine dilini", "Python kodunu", "Resimleri"], answer: 1,
    why: "İşlemci yalnızca 0 ve 1'leri anlar. Diğer her şey önce bunlara çevrilir." },
  { k: 2, q: "Python neden \"yüksek seviyeli\" bir dil sayılır?", options: ["Çok hızlı çalıştığı için", "İnsanın okuyup yazmasına yakın olduğu, donanım ayrıntılarını kendisi hallettiği için", "Sadece büyük bilgisayarlarda çalıştığı için", "En eski programlama dili olduğu için"], answer: 1,
    why: "Yüksek seviyeli dil insana yakındır. Bellek gibi ayrıntıları dil halleder." },
  { k: 3, q: "Bu kod ekrana ne yazar?", code: "a = \"5\"\nb = \"2\"\nprint(a + b)", options: ["7", "52", "a + b", "Hata verir"], answer: 1,
    why: "Tırnak içindeki 5 ve 2 metindir. Metinler + ile yan yana yapıştırılır: 52." },
  { k: 4, q: "Bu kod ekrana ne yazar?", code: "puan = 45\nif puan >= 50:\n    print(\"Geçti\")\nelse:\n    print(\"Kaldı\")", options: ["Geçti", "Kaldı", "Geçti ve Kaldı", "Hiçbir şey"], answer: 1,
    why: "45, 50'den küçük. Koşul yanlış olduğu için else kısmı çalışır." },
  { k: 5, q: "Bu döngü kaç kere \"Merhaba\" yazar?", code: "for i in range(4):\n    print(\"Merhaba\")", options: ["3", "4", "5", "Sonsuz kere"], answer: 1,
    why: "range(4) sırayla 0, 1, 2, 3 değerlerini verir. Toplam 4 tur." },
  { k: 6, q: "Bu kod ekrana ne yazar?", code: "renkler = [\"kırmızı\", \"mavi\", \"yeşil\"]\nprint(renkler[1])", options: ["kırmızı", "mavi", "yeşil", "1"], answer: 1,
    why: "Sıra numarası 0'dan başlar: kırmızı 0, mavi 1, yeşil 2." },
  { k: 7, q: "Bu kod ekrana ne yazar?", code: "def ucle_carp(x):\n    return x * 3\n\nprint(ucle_carp(4))", options: ["4", "7", "12", "x * 3"], answer: 2,
    why: "Fonksiyon kendisine verilen 4'ü 3 ile çarpıp geri döndürür: 12." },
  { k: 8, q: "Python şu hatayı verdi: <code>NameError: name 'skor' is not defined</code>. Bu ne demek?", options: ["skor diye bir değişken henüz oluşturulmamış ya da adı yanlış yazılmış", "skor sayısı çok büyük", "Satırın sonunda : eksik", "Program çok uzun"], answer: 0,
    why: "NameError, Python'un o ismi tanımadığını söyler. Ya değişken oluşturulmamıştır ya da adı yanlış yazılmıştır." },
  { k: 9, q: "<code>kalem = Kalem(\"mavi\")</code> satırında <code>Kalem</code> nedir?", options: ["Bir nesne", "Bir sınıf (kalıp)", "Bir metot", "Bir sayı"], answer: 1,
    why: "Kalem bir sınıftır, yani kalıptır. kalem ise o kalıptan üretilen nesnedir." },
  { k: 10, q: "Makine öğrenmesini normal programlamadan ayıran nedir?", options: ["Bilgisayarın daha hızlı çalışması", "Kuralları programcının değil, bilgisayarın örneklerden bulması", "İnternete bağlı olması", "Kodun daha kısa olması"], answer: 1,
    why: "Makine öğrenmesinde kuralları biz yazmayız. Model örneklerden kendisi çıkarır." },
  { k: 11, q: "Bir modeli neden eğitirken hiç görmediği verilerle test ederiz?", options: ["Test verisi daha ucuz olduğu için", "Ezberleyip ezberlemediğini, gerçekten öğrenip öğrenmediğini anlamak için", "Modeli daha hızlı yapmak için", "Gerek yok, eğitim verisiyle test etmek yeterli"], answer: 1,
    why: "Ders kitabındaki soruların aynısını soran bir sınav, ezberi ölçer. Yeni sorular gerçek öğrenmeyi gösterir." },
  { k: 12, q: "Elinde etiketsiz yüzlerce fotoğraf var ve bilgisayarın bunları benzerliklerine göre gruplara ayırmasını istiyorsun. Bu hangi tür bir iştir?", options: ["Kümeleme (gruplama)", "Sınıflandırma", "Toplama işlemi", "Hata ayıklama"], answer: 0,
    why: "Etiket yoksa ve amaç benzerleri bir araya toplamaksa buna kümeleme denir. K-Means bir kümeleme yöntemidir." }
];

/* Son test (B formu): aynı kazanımlar, eş sorular */
export var SON_TEST = [
  { k: 1, q: "\"Program\" ne demektir?", options: ["Bilgisayarın parçalarından biri", "Bilgisayara bir işi yaptırmak için verilen sıralı talimatlar", "Bir internet sitesi", "Bilgisayarın ekranı"], answer: 1,
    why: "Program, bilgisayarın adım adım uyguladığı talimatlar dizisidir." },
  { k: 2, q: "Arduino'da <b>Yükle</b>'ye basınca kodun tamamı önce makine diline çevrilir. Python ise kodu satır satır okuyup çalıştırır. Python'un çalışma şekline ne denir?", options: ["Derleyici (compiler)", "Yorumlayıcı (interpreter)", "Makine dili", "Assembly"], answer: 1,
    why: "Python bir yorumlayıcıyla çalışır: satır satır okur ve hemen çalıştırır." },
  { k: 3, q: "Bu kod ekrana ne yazar?", code: "a = 5\nb = 2\nprint(a + b)", options: ["7", "52", "a + b", "Hata verir"], answer: 0,
    why: "Tırnak yok, yani 5 ve 2 sayıdır. + gerçekten toplar: 7." },
  { k: 4, q: "Bu kod ekrana ne yazar?", code: "isik = 700\nif isik < 300:\n    print(\"Lamba açık\")\nelse:\n    print(\"Lamba kapalı\")", options: ["Lamba açık", "Lamba kapalı", "İkisi de", "Hiçbir şey"], answer: 1,
    why: "700, 300'den küçük değil. Koşul yanlış olduğu için else çalışır." },
  { k: 5, q: "Bu döngü ekrana hangi sayıları yazar?", code: "for i in range(1, 4):\n    print(i)", options: ["0 1 2 3", "1 2 3", "1 2 3 4", "4"], answer: 1,
    why: "range(1, 4) 1'den başlar ve 4'e gelmeden durur: 1, 2, 3." },
  { k: 6, q: "Bu kod ekrana ne yazar?", code: "sayilar = [10, 20, 30, 40]\nprint(sayilar[-1])", options: ["10", "40", "-1", "Hata verir"], answer: 1,
    why: "Eksi sıra numaraları sondan sayar. [-1] her zaman son elemandır." },
  { k: 7, q: "Bu kod ekrana ne yazar?", code: "def selam(ad):\n    return \"Merhaba \" + ad\n\nprint(selam(\"Ece\"))", options: ["Merhaba ad", "Merhaba Ece", "selam(Ece)", "Ece"], answer: 1,
    why: "Fonksiyon, verilen adı \"Merhaba \" metninin sonuna ekleyip geri döndürür." },
  { k: 8, q: "Python şu hatayı verdi: <code>SyntaxError: expected ':'</code>. Büyük ihtimalle sorun nedir?", options: ["Bir değişkenin adı yanlış", "if, for ya da def satırının sonunda iki nokta eksik", "Sıfıra bölme yapılmış", "Liste çok uzun"], answer: 1,
    why: "SyntaxError bir yazım hatasıdır. \"expected ':'\" ise iki noktanın unutulduğunu söyler." },
  { k: 9, q: "<code>robot.ilerle(3)</code> satırında <code>ilerle</code> nedir?", options: ["Bir sınıf", "Bir metot (nesnenin yapabildiği iş)", "Bir değişken", "Bir liste"], answer: 1,
    why: "Noktadan sonra gelip parantezle çağrılan şey nesnenin metodudur." },
  { k: 10, q: "Bir spam filtresi, binlerce \"spam\" ve \"spam değil\" diye işaretlenmiş e-postaya bakarak yeni e-postaları ayırmayı öğreniyor. Bu hangisinin örneğidir?", options: ["Programcının tek tek kural yazması", "Makine öğrenmesi: örneklerden öğrenme", "Bir oyun", "Bir hata"], answer: 1,
    why: "Model, etiketli örneklerden kendi kuralını çıkarıyor. Bu makine öğrenmesidir." },
  { k: 11, q: "Bir model eğitim verisinde %100, test verisinde %60 başarılı. Büyük ihtimalle ne oldu?", options: ["Model mükemmel öğrendi", "Model ezberledi (overfitting), yeni örneklere iyi genelleyemiyor", "Test verisi bozuk", "Model hiç eğitilmedi"], answer: 1,
    why: "Gördüğü verilerde kusursuz, yeni verilerde zayıf olmak ezberlemenin işaretidir." },
  { k: 12, q: "Her penguenin türü (etiketi) belli bir veriyle, yeni bir penguenin türünü tahmin eden model hangi türdendir?", options: ["Kümeleme", "Sınıflandırma", "Sıralama", "Çizim"], answer: 1,
    why: "Etiketli örneklerden öğrenip yeni örneğe etiket vermek sınıflandırmadır." }
];

/* Aşama sonu kontrolleri: her biri 5 soru. Hemen geri bildirim verir. */
export var KONTROLLER = [
  { title: "Başlangıç dersleri kontrolü", sorular: [
    { q: "Hangi satır Python'da doğru yazılmıştır?", options: ["Print(\"Selam\")", "print(\"Selam\");", "print(\"Selam\")", "print Selam"], answer: 2,
      why: "print küçük harfle yazılır, yazı tırnak içinde olur, sonda ; gerekmez." },
    { q: "C++'taki <code>{ }</code> süslü parantezlerin işini Python'da ne yapar?", options: ["Köşeli parantez", "Girinti (4 boşluk)", "Noktalı virgül", "Yorum satırı"], answer: 1,
      why: "Python blokları girintiyle belirler." },
    { q: "Bu kod ne yazar?", code: "x = 10\nx = x - 3\nprint(x)", options: ["10", "7", "13", "x - 3"], answer: 1,
      why: "Satırlar sırayla çalışır: x önce 10, sonra 10 - 3 = 7 olur." },
    { q: "<code>Servo motor;</code> satırında <code>motor</code> nedir?", options: ["Bir sınıf", "Servo sınıfından üretilmiş bir nesne", "Bir metot", "Bir yorum"], answer: 1,
      why: "Servo kalıp (sınıf), motor ise o kalıptan üretilen nesnedir." },
    { q: "Colab'da 1. hücreyi hiç çalıştırmadan 2. hücreyi çalıştırdın ve NameError aldın. Ne yapmalısın?", options: ["Bilgisayarı kapatıp açmak", "Önce 1. hücreyi çalıştırmak", "2. hücreyi silmek", "Hiçbir şey, hata normal"], answer: 1,
      why: "Değişken 1. hücrede oluşuyor. O hücre çalışmadıkça değişken yoktur." }
  ]},
  { title: "Notebook 00 kontrolü", sorular: [
    { q: "<code>yas = input(\"Kaç yaşındasın? \")</code> satırından sonra <code>yas</code> değişkeninin tipi nedir?", options: ["int (tam sayı)", "str (metin)", "float", "bool"], answer: 1,
      why: "input her zaman metin döndürür. Sayıya çevirmek için int() gerekir." },
    { q: "Bu kod ne yazar?", code: "ad = \"Mert\"\nprint(f\"{ad} {len(ad)} harf\")", options: ["Mert 4 harf", "{ad} {len(ad)} harf", "ad 4 harf", "Mert len(ad) harf"], answer: 0,
      why: "f-string içindeki süslü parantezlerin yerine değerler yazılır." },
    { q: "Bu döngü ne zaman durur?", code: "pil = 100\nwhile pil > 0:\n    pil = pil - 30", options: ["Hiç durmaz", "pil 0 ya da daha az olunca", "pil 30 olunca", "İlk turda"], answer: 1,
      why: "while, koşul doğru olduğu sürece döner. pil 100, 70, 40, 10, -20 olur ve koşul yanlışlanınca durur." },
    { q: "Bu kod ne yazar?", code: "baskentler = {\"Türkiye\": \"Ankara\", \"Japonya\": \"Tokyo\"}\nprint(baskentler[\"Japonya\"])", options: ["Japonya", "Tokyo", "Ankara", "Hata verir"], answer: 1,
      why: "Sözlükte anahtarı verince karşılığındaki değeri alırız." },
    { q: "<code>return</code> ile <code>print</code> arasındaki fark nedir?", options: ["Hiç fark yok", "print ekrana yazar, return değeri fonksiyonu çağıran yere geri verir", "return ekrana yazar, print değer döndürür", "return sadece sayılarla çalışır"], answer: 1,
      why: "print sadece gösterir. return ise sonucu geri verir, böylece başka işlemlerde kullanabiliriz." }
  ]},
  { title: "İstasyonlar kontrolü", sorular: [
    { q: "Program hiç hata vermeden çalışıyor ama yanlış sonuç veriyor. Bu ne tür bir hatadır?", options: ["SyntaxError", "NameError", "Mantık hatası", "IndentationError"], answer: 2,
      why: "Mantık hatasında Python itiraz etmez. Kod çalışır ama yapmasını istediğimiz şeyi yapmaz." },
    { q: "Sezar şifresinde her harf alfabede 3 ileri kaydırılıyor. Şifreyi çözmek için ne yapılır?", options: ["Harfler 3 geri kaydırılır", "Harfler 3 ileri kaydırılır", "Kelimeler ters çevrilir", "Sesli harfler silinir"], answer: 0,
      why: "Çözmek, şifrelemenin tersini yapmaktır: aynı miktarda geri kaydırmak." },
    { q: "10 × 10 bir tuvalin her pikselini boyamak için iç içe iki for döngüsü kullandın. <code>piksel()</code> kaç kere çağrılır?", options: ["10", "20", "100", "1000"], answer: 2,
      why: "Dıştaki döngü 10 tur, her turda içteki döngü 10 tur: 10 × 10 = 100." },
    { q: "Kod yapbozunda parçalar doğru sırada ama döngünün içindeki satır girintisiz. Ne olur?", options: ["Sorun olmaz", "Python IndentationError verir", "Satır iki kere çalışır", "Döngü hiç çalışmaz ama hata da vermez"], answer: 1,
      why: ": ile biten satırın altında en az bir girintili satır olmalı. Yoksa IndentationError alırsın." },
    { q: "Kural yazarak yapılan sohbet botu \"mrb\" mesajını anlamadı, örneklerden öğrenen bot anladı. Neden?", options: ["Öğrenen bot internete bağlı", "Öğrenen bot mesajı bildiği örneklere benzerliğine göre değerlendiriyor", "Kural botu bozuk", "Şans eseri"], answer: 1,
      why: "Kural botu sadece yazılan kelimeleri birebir tanır. Öğrenen bot en benzer örneği bulur." }
  ]},
  { title: "Notebook 01 kontrolü", sorular: [
    { q: "NumPy'da <code>dizi = np.array([1, 2, 3])</code> ise <code>dizi * 2</code> ne verir?", options: ["[1, 2, 3, 1, 2, 3]", "[2, 4, 6]", "12", "Hata verir"], answer: 1,
      why: "NumPy işlemi her elemana tek tek uygular. Listede olsaydı liste iki kere tekrarlanırdı." },
    { q: "Pandas'ta bir tablonun (DataFrame) adı nedir?", options: ["Sözlük", "DataFrame", "Dizi", "Fonksiyon"], answer: 1,
      why: "Pandas'taki satır ve sütunlu tabloya DataFrame denir." },
    { q: "Elma-portakal modelinde <code>X</code> ve <code>y</code> neyi gösterir?", options: ["X etiket, y özellikler", "X özellikler (ağırlık, renk), y etiket (elma ya da portakal)", "X ve y koordinatlar", "İkisi de aynı"], answer: 1,
      why: "X modelin baktığı bilgiler, y bulmasını istediğimiz cevaptır." },
    { q: "scikit-learn'de modeli örneklerle eğiten komut hangisidir?", options: ["model.predict()", "model.fit()", "model.show()", "model.print()"], answer: 1,
      why: "fit eğitir, predict tahmin ettirir." },
    { q: "Elma-portakal modeli neden neredeyse sadece ağırlığa bakıyordu?", options: ["Renk sensörü bozuktu", "Ağırlık sayıları renk sayılarından çok daha büyük olduğu için mesafeyi ağırlık belirliyordu", "Model rengi göremez", "Portakallar daha ağır olduğu için"], answer: 1,
      why: "KNN mesafe hesaplar. Büyük sayılar küçükleri ezer. Bu yüzden özellikler aynı ölçeğe getirilir (ölçekleme)." }
  ]},
  { title: "Lab'lar kontrolü", sorular: [
    { q: "Lab 1'de bilgisayar 8 × 8'lik bir rakam resmini nasıl görüyordu?", options: ["Bir fotoğraf olarak", "64 tane sayıdan oluşan bir tablo olarak", "Bir kelime olarak", "Renkli çizgiler olarak"], answer: 1,
      why: "Her piksel bir sayıdır. 8 × 8 = 64 sayı." },
    { q: "KNN'de K = 1 yerine K = 5 seçmek ne değiştirir?", options: ["Model en yakın 5 örneğin oyuna bakar, tek bir hatalı örnekten daha az etkilenir", "Model 5 kat hızlanır", "Model 5 sınıf tahmin eder", "Hiçbir şey"], answer: 0,
      why: "Daha çok komşuya sormak, tek bir tuhaf örneğin kararı bozmasını engeller." },
    { q: "Lab 2'de derinliği sınırsız bir karar ağacı eğitimde %100, testte daha düşük başarı aldı. Buna ne denir?", options: ["Ezberleme (overfitting)", "Kümeleme", "Ölçekleme", "Filtreleme"], answer: 0,
      why: "Ağaç eğitim verisindeki her ayrıntıyı ezberledi, yeni penguenlerde zorlandı." },
    { q: "K-Means'e etiket (doğru cevap) veriyor muyuz?", options: ["Evet, her örneğin etiketini veriyoruz", "Hayır, benzer olanları kendisi gruplara ayırıyor", "Sadece ilk örneğin etiketini", "Sadece test verisinde"], answer: 1,
      why: "K-Means denetimsiz öğrenmedir: etiket olmadan, benzerliğe göre gruplar." },
    { q: "Rastgele orman (random forest) nasıl karar verir?", options: ["Tek bir büyük ağacın cevabına bakar", "Birçok ağacın oylamasına bakar", "Rastgele tahmin eder", "En yakın komşuya bakar"], answer: 1,
      why: "Orman, farklı ağaçların oylarını toplar. Çoğunluğun dediği kazanır." }
  ]}
];

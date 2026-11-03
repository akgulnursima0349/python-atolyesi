/* =====================================================================
   BAŞLANGIÇ DERSLERİ — Colab'dan önce, tarayıcıda adım adım.
   Adım türleri: read (okuma), quiz (çoktan seçmeli), sort (iki gruba ayır), code (kod alıştırması),
   predict (önce tahmin et, sonra çalıştır), parsons (kod yapbozu).
   bonus: true olan adımlar yıldızlı görevdir: zorunlu değildir, dersin sonunda açılır.
   hints: kademeli ipuçları. Son ipucu bile cevabı tam vermez; çözüm 3 denemeden sonra açılır.
   ===================================================================== */
export var LESSONS = [
{
  title: "Bilgisayarla Konuşmak", tag: "program nedir?",
  blurb: "Program, programlama dili ve Python'la ilk tanışma.",
  steps: [
    { type: "read", title: "Bilgisayar ne kadar akıllı?", html:
      "<p>Bir bilgisayar saniyede milyarlarca işlem yapabilir. Ama kendi başına <b>hiçbir şeye karar veremez</b>: ona ne söylersen, harfiyen onu yapar.</p>" +
      "<p>Bilgisayara verdiğimiz sıralı talimatlara <b>program</b> denir. Kodla Büyü'de bu talimatları blokları üst üste koyarak veriyordunuz. Gerçek dünyada programcılar aynı talimatları <b>yazı olarak</b> yazar.</p>" +
      "<div class=\"big-fact\"><span>01001000 01101001</span><p>İşlemcinin anladığı tek şey <b>0 ve 1</b>'lerdir: elektrik var ya da yok. Yukarıdaki satır bilgisayar için \"Hi\" demek.</p></div>" +
      "<p>İnsanlar 0 ve 1 ile konuşamaz. Bu yüzden arada bir <b>tercüman</b> kullanırız: <b>programlama dili</b>. Biz anlaşılır bir dille yazarız, bilgisayar onu 0 ve 1'lere çevirir.</p>" },
    { type: "quiz", q: "Bilgisayarın işlemcisi doğrudan hangisini anlar?", options: ["Türkçe", "Python", "0 ve 1'ler", "Kodla Büyü blokları"], answer: 2,
      why: "İşlemci sadece 0 ve 1'leri anlar. Python, Türkçe ya da bloklar önce 0 ve 1'e çevrilmek zorundadır." },
    { type: "read", title: "Merhaba Python", html:
      "<p><b>Python</b> 1991'de Hollandalı programcı <b>Guido van Rossum</b> tarafından yazıldı. Adı yılandan değil, Guido'nun sevdiği İngiliz komedi grubu <b>Monty Python</b>'dan geliyor.</p>" +
      "<p>Bugün dünyanın en çok kullanılan dillerinden biri. YouTube, Instagram ve NASA'nın bazı programlarında Python var. Yapay zekâ modellerinin neredeyse hepsi de Python ile eğitiliyor.</p>" +
      "<p>Python bu kadar sevilir, çünkü <b>okuması İngilizce bir cümleye yakındır</b>. Mesela bu satır ne yapıyor, tahmin edebilir misin?</p>" +
      "<pre class=\"code-show\">print(\"Merhaba Dünya!\")</pre><p><code>print</code> İngilizcede \"yazdır\" demek. Bu satır ekrana <b>Merhaba Dünya!</b> yazar.</p>" },
    { type: "predict", title: "Tırnak varsa, tırnak yoksa", html: "<p>İki satır neredeyse aynı. Sadece birinde tırnak var. Python ekrana ne yazar? Her satırı ayrı ayrı tahmin et.</p>",
      code: "print(\"3 + 4\")\nprint(3 + 4)",
      why: "Tırnak içindeki her şey <b>yazı</b>dır, Python onu olduğu gibi yazar. Tırnak yoksa Python <b>hesap</b> yapar." },
    { type: "code", title: "İlk programın", html: "<p>Aşağıdaki program ekrana bir satır yazıyor. Altına bir <code>print</code> satırı daha ekle ve <b>kendi adını</b> yazdır. Sonra <b>Çalıştır</b>'a bas.</p><p class=\"tip\">Yazıları her zaman tırnak <code>\"...\"</code> içine yazarız.</p>",
      starter: "print(\"Merhaba Dünya!\")\n", check: { minLines: 2 },
      hints: ["Var olan satırın <b>altına</b> yeni bir satır aç ve yine <code>print( )</code> yaz.", "Adın bir yazı, o yüzden parantezin içinde <b>tırnak</b> içinde olmalı: <code>print(\"...\")</code>"],
      solution: "print(\"Merhaba Dünya!\")\nprint(\"Benim adım Elif\")" },
    { type: "code", title: "Python bir hesap makinesi", html: "<p>Tırnak <b>yoksa</b> Python yazıyı değil sayıları görür ve hesap yapar: <code>+</code> toplama, <code>-</code> çıkarma, <code>*</code> çarpma, <code>/</code> bölme.</p><p>Bir günde 24 saat, bir yılda 365 gün var. <b>Bir yılda kaç saat olduğunu</b> Python'a hesaplatıp yazdır.</p>",
      starter: "print(2 + 2)\n", check: { contains: ["8760"] },
      hints: ["Hesap yapacağın için <b>tırnak kullanma</b>. Tırnak olursa Python hesaplamaz, yazıyı olduğu gibi yazar.", "Çarpma işareti <code>*</code> (yıldız). Bir yılda 365 gün, her günde 24 saat var.", "Parantezin içinde iki sayıyı çarp: <code>print(... * ...)</code>"],
      solution: "print(365 * 24)" },
    { type: "code", bonus: true, title: "Hayatının saniyeleri", html: "<p>12 yaşındaki biri yaklaşık kaç <b>saniyedir</b> yaşıyor? Bir yılda 365 gün, bir günde 24 saat, bir saatte 60 dakika, bir dakikada 60 saniye var.</p><p>Tek bir <code>print</code> içinde hepsini çarparak hesapla.</p>",
      starter: "print(12 * 365)\n", check: { contains: ["378432000"] },
      hints: ["Şu an sadece kaç <b>gün</b> olduğunu hesaplıyor. Saate çevirmek için 24 ile çarp.", "Saatten dakikaya 60, dakikadan saniyeye yine 60. Toplam dört çarpma var.", "<code>print(12 * 365 * 24 * ... * ...)</code>"],
      solution: "print(12 * 365 * 24 * 60 * 60)" }
  ]
},
{
  title: "Seviye Seviye Diller", tag: "yüksek seviyeli dil",
  blurb: "Makine dilinden Python'a: neden bazı diller \"gelişmiş\" sayılır?",
  steps: [
    { type: "read", title: "Dillerin merdiveni", html:
      "<p>Programlama dilleri bir merdivenin basamakları gibidir. Aşağıdaki basamaklar <b>makineye</b>, yukarıdakiler <b>insana</b> yakındır.</p>" +
      "<div class=\"ladder\">" +
        "<div style=\"--c:#7aa7ff\"><b>Python</b><span>Yüksek seviye · İnsana en yakın. Detayları dil halleder.</span></div>" +
        "<div style=\"--c:#46d6c4\"><b>C / C++</b><span>Orta seviye · Arduino'da kullandığınız dil. Hızlı, ama daha çok kural var.</span></div>" +
        "<div style=\"--c:#ffc94a\"><b>Assembly</b><span>Düşük seviye · İşlemcinin komutlarına tek tek isim verilmiş hali.</span></div>" +
        "<div style=\"--c:#ff7a6b\"><b>Makine dili</b><span>En alt · Sadece 0 ve 1. İşlemcinin doğrudan anladığı tek dil.</span></div>" +
      "</div>" +
      "<p><b>Yüksek seviyeli</b> (gelişmiş) bir dil, bilgisayarın iç detaylarını senin yerine halleder. Sayının bellekte nerede duracağını, ne kadar yer kaplayacağını düşünmezsin. Sen sadece <b>ne yapmak istediğini</b> yazarsın.</p>" },
    { type: "read", title: "Aynı iş, farklı basamaklar", html:
      "<p>Ekrana <b>Merhaba</b> yazdırmak için her basamakta yazılması gereken kod (kısaltılmış örnekler):</p>" +
      "<div class=\"cmp-grid\">" +
        "<div><h4>Assembly</h4><pre>mov edx, 7\nmov ecx, mesaj\nmov ebx, 1\nmov eax, 4\nint 0x80</pre></div>" +
        "<div><h4>C++</h4><pre>#include &lt;iostream&gt;\nint main() {\n  std::cout &lt;&lt; \"Merhaba\";\n  return 0;\n}</pre></div>" +
        "<div><h4>Python</h4><pre>print(\"Merhaba\")</pre></div>" +
      "</div>" +
      "<p>Basamak yükseldikçe kod <b>kısalır ve okunur hale gelir</b>. Ama bedeli de var: alt basamaktaki diller genelde <b>daha hızlı</b> çalışır ve donanımı daha iyi kontrol eder. Her dilin işine göre bir yeri var.</p>" },
    { type: "quiz", q: "Bu dillerden hangisi en yüksek seviyelidir (insana en yakın)?", options: ["Makine dili", "Assembly", "C++", "Python"], answer: 3,
      why: "Python merdivenin en üstünde: insanın okuyabileceği bir dile en yakın olan o." },
    { type: "code", title: "0 ve 1'leri çöz", html: "<p>Bilgisayarın içinde her sayı 0 ve 1'lerle (ikilik sistemle) saklanır. Python bize bu çeviriyi yapan hazır bir araç sunar: <code>int(\"1010\", 2)</code> yazınca ikilik sayıyı bizim kullandığımız sayıya çevirir.</p><p>Gizli ikilik sayı <b>1100100</b>. Python'a çevirt ve yazdır.</p>",
      starter: "print(int(\"1010\", 2))\n", check: { contains: ["100"] },
      hints: ["Örnek satır <code>1010</code> sayısını çeviriyor ve ekrana 10 yazıyor. Sen tırnağın içindeki sayıyı değiştireceksin.", "Tırnağın içine gizli sayıyı yaz: <code>1100100</code>. Sondaki <code>2</code>'ye dokunma, o \"ikilik sistem\" demek."],
      solution: "print(int(\"1100100\", 2))" },
    { type: "read", title: "Derleyici ve yorumlayıcı", html:
      "<p>Yazdığımız kodun 0 ve 1'e çevrilmesinin iki yolu var:</p>" +
      "<div class=\"cmp-grid two\">" +
        "<div><h4>Derleyici (compiler)</h4><p>Arduino IDE'de <b>Yükle</b>'ye bastığında kodunun <b>tamamı</b> önce makine diline çevrilir, sonra karta yüklenir. Kitabın tamamını önceden çeviren bir çevirmen gibi.</p></div>" +
        "<div><h4>Yorumlayıcı (interpreter)</h4><p>Python kodu <b>satır satır</b> okur ve hemen çalıştırır. Konuşmayı anında çeviren bir tercüman gibi. Bu yüzden bir satırı değiştirip hemen sonucunu görebiliriz.</p></div>" +
      "</div>" },
    { type: "quiz", q: "Python bu programı çalıştırınca ekranda ne görürüz?", code: "print(\"1\")\nprint(\"2\")\nprint(sayi)\nprint(\"4\")",
      options: ["Hiçbir şey, program hiç çalışmaz", "1 ve 2 yazılır, 3. satırda hata verip durur", "1, 2 ve 4 yazılır, hatalı satır atlanır", "Sadece 4 yazılır"], answer: 1,
      why: "Yorumlayıcı satır satır çalışır. İlk iki satır sorunsuz çalışır. 3. satırda <code>sayi</code> diye bir şey tanımlanmadığı için hata verir ve <b>orada durur</b>. 4. satıra hiç gelmez." },
    { type: "code", title: "Yorumlayıcıyı durdurmayalım", html: "<p>Az önceki program 3. satırda takılıp kalıyordu. Programı düzelt: ekranda alt alta <b>1, 2, 3, 4</b> yazsın.</p><p class=\"tip\">Hatalı satırı silmek yok: <code>sayi</code> kutusunu kullanmaya devam et.</p>",
      starter: "print(\"1\")\nprint(\"2\")\nprint(sayi)\nprint(\"4\")\n", check: { expect: ["1", "2", "3", "4"], need: ["assign"] },
      hints: ["Python <code>sayi</code> kutusunu tanımıyor, çünkü onu hiç oluşturmadık.", "Kutuyu <b>kullanılmadan önce</b> oluşturmalısın. Yorumlayıcı yukarıdan aşağı okur.", "<code>print(sayi)</code> satırının <b>üstüne</b> <code>sayi = ...</code> diye bir satır ekle."],
      solution: "print(\"1\")\nprint(\"2\")\nsayi = 3\nprint(sayi)\nprint(\"4\")" },
    { type: "predict", title: "Satır satır", html: "<p>Yorumlayıcı satırları <b>sırayla</b> çalıştırır. <code>x</code> kutusunun içi program boyunca değişiyor. Ekrana ne yazar?</p>",
      code: "x = 5\nprint(x)\nx = x + 1\nprint(x)\nx = x * 2\nprint(x)",
      why: "Her <code>print</code>, <b>o anda</b> kutunun içinde ne varsa onu yazar: önce 5, sonra 5 + 1 = 6, sonra 6 × 2 = 12." }
  ]
},
{
  title: "Arduino'dan Python'a", tag: "C++ ↔ Python",
  blurb: "Arduino'da yazdığınız kodla Python'u yan yana koyuyoruz.",
  steps: [
    { type: "read", title: "Arduino hangi dili konuşuyor?", html:
      "<p>Arduino'da yazdığınız kod aslında <b>C++</b> dilidir. Arduino onu biraz kolaylaştırır (<code>setup</code> ve <code>loop</code> gibi). C++ ile Python aynı şeyleri yapabilir ama <b>yazılışları</b> farklıdır:</p>" +
      "<div class=\"tbl-wrap\"><table class=\"cmp\"><thead><tr><th></th><th>Arduino (C++)</th><th>Python</th></tr></thead><tbody>" +
        "<tr><td>Değişken</td><td><code>int sayi = 5;</code></td><td><code>sayi = 5</code></td></tr>" +
        "<tr><td>Ekrana yazdır</td><td><code>Serial.println(\"Merhaba\");</code></td><td><code>print(\"Merhaba\")</code></td></tr>" +
        "<tr><td>Koşul</td><td><code>if (isik &gt; 500) { ... }</code></td><td><code>if isik &gt; 500:</code></td></tr>" +
        "<tr><td>Döngü</td><td><code>for (int i = 0; i &lt; 3; i++) { ... }</code></td><td><code>for i in range(3):</code></td></tr>" +
        "<tr><td>Sonsuz döngü</td><td><code>void loop() { ... }</code></td><td><code>while True:</code></td></tr>" +
        "<tr><td>Blok</td><td>Süslü parantez <code>{ }</code></td><td>Girinti (4 boşluk)</td></tr>" +
        "<tr><td>Satır sonu</td><td>Noktalı virgül <code>;</code> şart</td><td>Hiçbir şey</td></tr>" +
        "<tr><td>Yorum</td><td><code>// not</code></td><td><code># not</code></td></tr>" +
      "</tbody></table></div>" +
      "<p>En büyük fark: C++'ta değişkenin <b>tipini</b> (<code>int</code>, <code>float</code>…) sen söylersin. Python ise tipi kendisi anlar.</p>" },
    { type: "sort", title: "Hangisi hangi dil?", html: "<p>Her satır için hangi dilde yazıldığını seç.</p>", cats: ["Arduino (C++)", "Python"],
      items: [["int x = 5;", 0], ["x = 5", 1], ["Serial.println(x);", 0], ["print(x)", 1], ["for i in range(10):", 1], ["if (x > 3) {", 0], ["// motoru çalıştır", 0], ["# motoru çalıştır", 1], ["while True:", 1], ["void loop() {", 0]],
      why: "İpuçları: <code>;</code> ve <code>{</code> görürsen C++. <code>:</code> ile biten satırlar ve <code>#</code> ile yorumlar Python." },
    { type: "code", title: "Çevirmen 1: değişkenler", html: "<p>Bu Arduino kodunu Python'a çevir. Aynı sonucu yazdırmalı.</p><pre class=\"code-show cpp\">int a = 7;\nint b = 5;\nSerial.println(a * b);</pre>",
      starter: "# Arduino kodunun Python hali\n", check: { expect: ["35"], need: ["assign"] },
      hints: ["Python'da değişkenin tipini (<code>int</code>) yazmazsın ve satır sonuna <code>;</code> koymazsın.", "<code>Serial.println( )</code> yerine Python'da <code>print( )</code> kullanılır.", "Üç satır yazacaksın: <code>a = ...</code>, <code>b = ...</code> ve çarpımı yazdıran satır."],
      solution: "a = 7\nb = 5\nprint(a * b)" },
    { type: "code", title: "Çevirmen 2: döngü", html: "<p>Bu döngüyü Python'a çevir.</p><pre class=\"code-show cpp\">for (int i = 0; i &lt; 5; i++) {\n  Serial.println(i);\n}</pre>",
      starter: "", check: { expect: ["0", "1", "2", "3", "4"], need: ["for"] },
      hints: ["C++'taki <code>i = 0; i &lt; 5; i++</code> kısmının Python'daki karşılığı <code>range(5)</code>: 0'dan başlar, 5'e gelmeden durur.", "Satır <code>for i in range(5)</code> ile başlar ve <code>:</code> ile biter.", "<code>print(i)</code> satırı döngünün <b>içinde</b> olmalı: başına 4 boşluk koy."],
      solution: "for i in range(5):\n    print(i)" },
    { type: "code", title: "Çevirmen 3: koşul", html: "<p>Bir sıcaklık sensörü 32 derece ölçtü. Bu kodu Python'a çevir.</p><pre class=\"code-show cpp\">int sicaklik = 32;\nif (sicaklik &gt; 30) {\n  Serial.println(\"Fan açık\");\n} else {\n  Serial.println(\"Fan kapalı\");\n}</pre>",
      starter: "sicaklik = 32\n", check: { expect: ["Fan açık"], need: ["if"] },
      hints: ["Python'da koşulun etrafına parantez gerekmez ve süslü parantez yerine <code>:</code> kullanılır: <code>if sicaklik > 30:</code>", "<code>else</code> da <code>:</code> ile biter: <code>else:</code>", "İki <code>print</code> satırı da kendi bloğunun içinde, yani 4 boşluk içeride olmalı."],
      solution: "sicaklik = 32\nif sicaklik > 30:\n    print(\"Fan açık\")\nelse:\n    print(\"Fan kapalı\")" },
    { type: "predict", title: "Üçer üçer saymak", html: "<p>Arduino'da <code>for (int i = 2; i &lt; 10; i += 3)</code> yazardın. Python'da aynı döngü <code>range</code>'e üçüncü bir sayı vererek yazılır. Bu sayı her turda ne kadar artacağını söyler. Ekrana ne yazar?</p>",
      code: "for i in range(2, 10, 3):\n    print(i)",
      why: "<code>range(2, 10, 3)</code>: 2'den başla, 10'a gelmeden dur, her seferinde 3 artır. 2, 5, 8. Bir sonraki 11 olurdu ama 10'u geçtiği için yazılmaz." },
    { type: "read", title: "Neden robotlarda C++, yapay zekâda Python?", html:
      "<p><b>Arduino</b> kartındaki işlemci küçük, belleği çok az. Orada hızlı ve hafif çalışan <b>C++</b> idealdir.</p>" +
      "<p><b>Yapay zekâ</b> ise çok büyük verilerle çalışır ve hazır araçlara ihtiyaç duyar. Python'da bunlar için hazır <b>kütüphaneler</b> var (NumPy, scikit-learn). Kursun ikinci yarısında bunları kullanacağız.</p>" +
      "<p>İşin sırrı şu: o Python kütüphanelerinin hızlı çalışan iç kısımları da <b>C/C++ ile</b> yazılmıştır. Yani bu iki dil rakip değil, <b>takım arkadaşı</b>. Bazı kartlar (Raspberry Pi Pico, ESP32 gibi) <b>MicroPython</b> sayesinde Python ile de programlanabiliyor.</p>" },
    { type: "code", bonus: true, title: "Çevirmen 4: while", html: "<p>Pil sensörü 100'den başlıyor ve robot her harekette 40 harcıyor. Bu Arduino kodunu Python'a çevir.</p><pre class=\"code-show cpp\">int pil = 100;\nwhile (pil &gt; 0) {\n  Serial.println(pil);\n  pil = pil - 40;\n}</pre>",
      starter: "", check: { expect: ["100", "60", "20"], need: ["while"] },
      hints: ["Python'da da <code>while</code> var. Koşulun etrafındaki parantezler ve süslü parantezler gitmeli.", "<code>while pil > 0:</code> satırının altındaki <b>iki</b> satır da 4 boşluk içeride olmalı.", "İlk satırda pili oluştur: <code>pil = 100</code>"],
      solution: "pil = 100\nwhile pil > 0:\n    print(pil)\n    pil = pil - 40" }
  ]
},
{
  title: "Python'un Altın Kuralları", tag: "sözdizimi",
  blurb: "Python'da kod yazarken uyulması gereken beş temel kural.",
  steps: [
    { type: "read", title: "Beş altın kural", html:
      "<ol class=\"rules-list\">" +
        "<li><b>Sıra önemlidir.</b> Satırlar yukarıdan aşağı, sırayla çalışır.</li>" +
        "<li><b>Büyük-küçük harf farklıdır.</b> <code>print</code> çalışır, <code>Print</code> çalışmaz. <code>ad</code> ile <code>Ad</code> iki farklı değişkendir.</li>" +
        "<li><b>Yazılar tırnak içinde.</b> <code>\"Merhaba\"</code> bir yazıdır. Tırnaksız <code>Merhaba</code> yazarsan Python onu bir değişken adı sanır.</li>" +
        "<li><b>İki nokta ve girinti.</b> <code>if</code>, <code>for</code>, <code>while</code>, <code>def</code> satırları <code>:</code> ile biter. Altındaki komutlar <b>4 boşluk içeride</b> yazılır. C++'taki <code>{ }</code> yerine girinti kullanılır.</li>" +
        "<li><b>Yorumlar <code>#</code> ile başlar.</b> Python o satırları okumaz. Kendine ve arkadaşlarına not bırakmak içindir.</li>" +
      "</ol>" },
    { type: "quiz", q: "Bu kod çalışınca ne olur?", code: "Print(\"Merhaba\")", options: ["Ekrana Merhaba yazar", "Ekrana Print yazar", "Hata verir", "Hiçbir şey olmaz"], answer: 2,
      why: "Python büyük-küçük harfe dikkat eder. <code>Print</code> diye bir komut yok, doğrusu <code>print</code>. Python <code>NameError</code> hatası verir." },
    { type: "predict", title: "Tırnaklı ad, tırnaksız ad", html: "<p>Kural 3'ü hatırla. Ekrana ne yazar?</p>",
      code: "ad = \"Ada\"\nprint(\"ad\")\nprint(ad)",
      why: "<code>\"ad\"</code> tırnak içinde olduğu için bir yazıdır, olduğu gibi yazılır. Tırnaksız <code>ad</code> ise kutunun adıdır: Python kutunun içindekini, yani <b>Ada</b>'yı yazar." },
    { type: "code", title: "Girintiyi düzelt", html: "<p>Bu program ekrana 3 kere <b>Python</b> yazmalı ama çalışmıyor. Kural 4'ü hatırla ve düzelt.</p>",
      starter: "for i in range(3):\nprint(\"Python\")\n", check: { expect: ["Python", "Python", "Python"] },
      hints: ["<code>:</code> ile biten satırın altındaki komut <b>içeride</b> olmalı.", "<code>print</code> satırının başına 4 boşluk koy (ya da Tab tuşuna bas)."],
      solution: "for i in range(3):\n    print(\"Python\")" },
    { type: "code", title: "Değişken kutusu", html: "<p><b>Değişken</b> içine bilgi koyduğumuz, üstünde isim etiketi olan bir kutudur. <code>=</code> işareti \"bu kutuya şunu koy\" demektir.</p><p><code>ad</code> kutusuna kendi adını koy, sonra <code>Merhaba</code> kelimesiyle birlikte yazdır.</p>",
      starter: "ad = \"...\"\nprint(\"Merhaba\", ad)\n", check: { contains: ["merhaba"], notContains: ["..."] },
      hints: ["<code>\"...\"</code> kutunun şu anki içeriği. Üç noktayı silip yerine adını yaz.", "Tırnakları silme: ad bir yazı, tırnak içinde kalmalı."],
      solution: "ad = \"Deniz\"\nprint(\"Merhaba\", ad)" },
    { type: "code", title: "Not bırak, satırı sustur", html: "<p>Kural 5: <code>#</code> ile başlayan satırı Python okumaz. Programcılar bir satırı silmek yerine geçici olarak <b>susturmak</b> için de bunu kullanır.</p><p>Robotun ekranına yanlışlıkla bir hata mesajı yazılıyor. O satırı <b>silmeden</b>, başına <code>#</code> koyarak sustur.</p>",
      starter: "print(\"Robot hazır\")\nprint(\"HATA: motor arızalı\")\nprint(\"Görev başladı\")\n", check: { expect: ["Robot hazır", "Görev başladı"], need: ["comment"] },
      hints: ["Hangi satır yanlışlıkla yazılıyor? Ortadaki.", "Ortadaki satırın <b>en başına</b> <code>#</code> işareti koy."],
      solution: "print(\"Robot hazır\")\n# print(\"HATA: motor arızalı\")\nprint(\"Görev başladı\")" },
    { type: "code", bonus: true, title: "Üç kural, üç hata", html: "<p>Bu program üç altın kuralı birden çiğniyor. Hepsini bul ve düzelt. Ekranda alt alta <b>Sayıyorum</b>, <b>1</b>, <b>2</b> yazmalı.</p>",
      starter: "Print(\"Sayıyorum)\nfor i in range(1, 3)\n    print(i)\n", check: { expect: ["Sayıyorum", "1", "2"] },
      hints: ["Hata mesajı hangi satırı gösteriyor? Önce oradan başla, düzelttikçe sıradaki hata görünecek.", "1. satırda iki sorun var: komutun yazılışı ve yazının sonu.", "2. satırın sonunda bir işaret eksik."],
      solution: "print(\"Sayıyorum\")\nfor i in range(1, 3):\n    print(i)" }
  ]
},
{
  title: "Nesneler ve Sınıflar", tag: "nesne yönelimli programlama",
  blurb: "Kurabiye kalıbı, kurabiyeler ve robot fabrikası.",
  steps: [
    { type: "read", title: "Dünya nesnelerle dolu", html:
      "<p>Etrafına bak: kalem, telefon, robot… Her birinin <b>özellikleri</b> (rengi, pili) ve <b>yapabildikleri</b> (yazmak, aramak, ilerlemek) var.</p>" +
      "<p><b>Nesne yönelimli programlama</b> (OOP, <i>Object Oriented Programming</i>) programı bu şekilde kurar: gerçek dünyadaki şeyleri koddaki <b>nesneler</b> olarak düşünürüz.</p>" +
      "<div class=\"cmp-grid two\">" +
        "<div><h4>Sınıf (class)</h4><p>Bir <b>kalıp</b> ya da plan. Kurabiye kalıbı gibi. Robot fabrikasındaki çizim gibi.</p></div>" +
        "<div><h4>Nesne (object)</h4><p>Kalıptan çıkan <b>gerçek şey</b>. Her kurabiye ayrı bir nesne. Aynı kalıptan istediğin kadar çıkarabilirsin.</p></div>" +
      "</div>" +
      "<p>Nesnenin bildiği şeylere <b>özellik</b> (<i>attribute</i>), yapabildiği şeylere <b>metot</b> (<i>method</i>) denir.</p>" },
    { type: "quiz", q: "Kurabiye kalıbı ve kurabiyeler örneğinde \"sınıf\" hangisidir?", options: ["Kurabiye kalıbı", "Her bir kurabiye", "Fırın", "Un"], answer: 0,
      why: "Sınıf kalıptır, nesneler o kalıptan çıkan kurabiyelerdir. Bir sınıftan çok sayıda nesne üretilebilir." },
    { type: "read", title: "Aslında hep nesne kullandın!", html:
      "<p>Python'da <b>her şey bir nesnedir</b>. Bir yazının sonuna nokta koyup bir metot çağırabilirsin:</p>" +
      "<pre class=\"code-show\">kelime = \"robot\"\nprint(kelime.upper())   # ROBOT</pre>" +
      "<p>Burada <code>kelime</code> bir nesne, <code>upper()</code> onun <b>metodu</b>. Metot, nesnenin yapabildiği bir iş.</p>" +
      "<p>Arduino'da da aynısını yaptınız: <code>Serial.println(\"Merhaba\")</code> satırında <code>Serial</code> bir nesne, <code>println</code> onun metodu. <code>Servo motor;</code> yazdığınızda <code>Servo</code> sınıfından <code>motor</code> adında bir nesne üretmiş oluyordunuz. Yani C++ da nesne yönelimli bir dil.</p>" },
    { type: "predict", title: "Metot nesneyi değiştirir mi?", html: "<p>Bir yazının birkaç metodunu art arda çağırıyoruz. <code>count</code> bir harfin kaç kere geçtiğini sayar. Ekrana ne yazar? Son satıra dikkat!</p>",
      code: "kelime = \"robot\"\nprint(kelime.upper())\nprint(kelime.count(\"o\"))\nprint(kelime)",
      why: "<code>upper()</code> büyük harfli <b>yeni bir yazı</b> üretir, ama <code>kelime</code> kutusundaki asıl yazı değişmez. Son satır hâlâ küçük harfle <b>robot</b> yazar." },
    { type: "quiz", q: "Arduino'daki <code>motor.write(90)</code> satırında metot hangisi?", options: ["motor", "write", "90", "Servo"], answer: 1,
      why: "<code>motor</code> nesne, noktadan sonra gelen <code>write</code> onun metodu, <code>90</code> ise metoda verdiğimiz bilgi (açı)." },
    { type: "code", title: "Robot fabrikası", html:
      "<p>Aşağıda bir <code>Robot</code> <b>sınıfı</b> var. <code>__init__</code> robot üretilirken çalışır ve özelliklerini ayarlar. <code>self</code> \"bu robotun kendisi\" demek.</p>" +
      "<p>Fabrikada bir robot zaten üretilmiş. <b>Volt</b> adında ikinci bir robot üret ve <b>2 adım</b> ilerlet.</p>",
      starter: "class Robot:\n    def __init__(self, ad):\n        self.ad = ad\n        self.pil = 100\n\n    def ilerle(self, adim):\n        self.pil = self.pil - adim * 10\n        print(f\"{self.ad} {adim} adım ilerledi. Pil: %{self.pil}\")\n\n\nr1 = Robot(\"Şimşek\")\nr1.ilerle(3)\n\n# Volt'u üret ve 2 adım ilerlet\n",
      check: { contains: ["volt 2 adım ilerledi"] },
      hints: ["Şimşek nasıl üretildi? <code>r1 = Robot(\"Şimşek\")</code> satırına bak. Aynısını yeni bir isimle yap.", "Yeni robotun değişken adı <code>r2</code> olabilir ama Python adında Türkçe harf olmamalı.", "Üretme satırının altına, Şimşek'te olduğu gibi <code>.ilerle(...)</code> metodunu çağıran satırı ekle."],
      solution: "class Robot:\n    def __init__(self, ad):\n        self.ad = ad\n        self.pil = 100\n\n    def ilerle(self, adim):\n        self.pil = self.pil - adim * 10\n        print(f\"{self.ad} {adim} adım ilerledi. Pil: %{self.pil}\")\n\n\nr1 = Robot(\"Şimşek\")\nr1.ilerle(3)\nr2 = Robot(\"Volt\")\nr2.ilerle(2)" },
    { type: "code", title: "Robota yeni bir yetenek", html:
      "<p>Sınıfa yeni bir metot eklersen, o sınıftan üretilen <b>bütün robotlar</b> bu yeteneği kazanır.</p>" +
      "<p><code>selamla</code> adında bir metot ekle. Metot <code>Merhaba, ben Şimşek!</code> gibi kendi adını söylesin. Sonra iki robotu da selamlat.</p>",
      starter: "class Robot:\n    def __init__(self, ad):\n        self.ad = ad\n\n    def selamla(self):\n        # f-string ile kendi adını söylesin\n        pass\n\n\nr1 = Robot(\"Şimşek\")\nr2 = Robot(\"Volt\")\nr1.selamla()\nr2.selamla()\n",
      check: { contains: ["merhaba, ben şimşek!", "merhaba, ben volt!"] },
      hints: ["<code>pass</code> \"şimdilik boş\" demek. Onu silip yerine bir <code>print</code> yazacaksın.", "Robotun adı <code>self.ad</code> içinde duruyor.", "f-string içinde süslü parantez kullan: <code>f\"Merhaba, ben {...}!\"</code>"],
      solution: "class Robot:\n    def __init__(self, ad):\n        self.ad = ad\n\n    def selamla(self):\n        print(f\"Merhaba, ben {self.ad}!\")\n\n\nr1 = Robot(\"Şimşek\")\nr2 = Robot(\"Volt\")\nr1.selamla()\nr2.selamla()" },
    { type: "code", bonus: true, title: "Pil yetmezse", html: "<p>Şimşek'in pili 100. 5 adım (50 pil) gidebilir ama sonra 6 adım daha (60 pil) gitmeye pili yetmez. Şu an robot eksi pile düşüyor!</p><p><code>ilerle</code> metoduna bir <code>if</code> ekle: pil yetmiyorsa <code>Şimşek: pil yetersiz!</code> yazsın ve ilerlemesin.</p>",
      starter: "class Robot:\n    def __init__(self, ad):\n        self.ad = ad\n        self.pil = 100\n\n    def ilerle(self, adim):\n        self.pil = self.pil - adim * 10\n        print(f\"{self.ad} {adim} adım ilerledi. Pil: %{self.pil}\")\n\n\nr1 = Robot(\"Şimşek\")\nr1.ilerle(5)\nr1.ilerle(6)\n",
      check: { expect: ["Şimşek 5 adım ilerledi. Pil: %50", "Şimşek: pil yetersiz!"], need: ["if"] },
      hints: ["Gereken pil <code>adim * 10</code>. Bunu <code>self.pil</code> ile karşılaştır.", "<code>if</code> koşulu doğruysa uyarıyı yazdır. <code>else:</code> kısmına da mevcut iki satırı taşı.", "<code>if self.pil < adim * 10:</code> satırını metodun ilk satırı yap."],
      solution: "class Robot:\n    def __init__(self, ad):\n        self.ad = ad\n        self.pil = 100\n\n    def ilerle(self, adim):\n        if self.pil < adim * 10:\n            print(f\"{self.ad}: pil yetersiz!\")\n        else:\n            self.pil = self.pil - adim * 10\n            print(f\"{self.ad} {adim} adım ilerledi. Pil: %{self.pil}\")\n\n\nr1 = Robot(\"Şimşek\")\nr1.ilerle(5)\nr1.ilerle(6)" }
  ]
},
{
  title: "Colab'a Hazırlık", tag: "Google Colab",
  blurb: "Gerçek Python defterlerine geçmeden önce bilmen gerekenler.",
  steps: [
    { type: "read", title: "Colab nedir?", html:
      "<p><b>Google Colab</b>, internet tarayıcısında çalışan ücretsiz bir Python defteridir. Bilgisayara hiçbir şey kurman gerekmez. Kodunu Google'ın güçlü bilgisayarları çalıştırır. Yapay zekâ için de bu yüzden çok kullanılır.</p>" +
      "<p>Bir Colab defteri iki tür <b>hücreden</b> oluşur:</p>" +
      "<div class=\"cmp-grid two\"><div><h4>Metin hücresi</h4><p>Açıklamalar, başlıklar, resimler. Okumak için.</p></div><div><h4>Kod hücresi</h4><p>Gri kutular. İçindeki kodu <b>Shift + Enter</b> ile ya da soldaki ▶ düğmesiyle çalıştırırsın.</p></div></div>" },
    { type: "read", title: "Üç önemli ipucu", html:
      "<ol class=\"rules-list\">" +
        "<li><b>Önce kopyala.</b> Defter açılınca <b>Dosya → Drive'a kopya kaydet</b> seçeneğine tıkla. Böylece yaptığın değişiklikler kendi Drive'ında saklanır. (Bir Google hesabı gerekir.)</li>" +
        "<li><b>Hücreleri sırayla çalıştır.</b> Bir hücrede oluşturduğun değişkeni sonraki hücreler hatırlar. Ama o hücreyi <b>çalıştırmadıysan</b> değişken hiç oluşmamıştır.</li>" +
        "<li><b>Bir şeyler karışırsa:</b> <b>Çalışma zamanı → Yeniden başlat</b> her şeyi sıfırlar. Sonra hücreleri baştan sırayla çalıştır.</li>" +
      "</ol>" },
    { type: "quiz", q: "1. hücreye <code>x = 5</code> yazdın ama <b>çalıştırmadın</b>. 2. hücrede <code>print(x)</code> çalıştırırsan ne olur?", options: ["5 yazar", "x yazar", "Hata verir: x tanımlı değil", "0 yazar"], answer: 2,
      why: "Hücre çalıştırılmadıkça içindeki kod hiç çalışmamış sayılır. <code>x</code> kutusu oluşmadığı için Python <code>NameError</code> verir." },
    { type: "predict", title: "Aynı hücreyi iki kere çalıştırmak", html: "<p>Colab'da 1. hücrede <code>sayac = 0</code> var. 2. hücrede <code>sayac = sayac + 1</code> ve <code>print(sayac)</code> var. 1. hücreyi bir kez, sonra 2. hücreyi <b>iki kez</b> çalıştırdın. Bu, aşağıdaki programla aynı şey. Ekranda ne görürsün?</p>",
      code: "sayac = 0\n# 2. hücre, 1. çalıştırma\nsayac = sayac + 1\nprint(sayac)\n# 2. hücre, 2. çalıştırma\nsayac = sayac + 1\nprint(sayac)",
      why: "Colab değişkenleri hatırlar. 2. hücreyi her çalıştırdığında <code>sayac</code> bir artar: önce 1, sonra 2. Sıfırdan başlamak istersen 1. hücreyi tekrar çalıştırırsın." },
    { type: "parsons", title: "Hücreleri sırala", html: "<p>Bir arkadaşın defterindeki kod satırları karıştı. Parçaları <b>çalışacak sırayla</b> programa ekle. Program ekrana <b>Merhaba Mert, puanın 90</b> yazmalı.</p><p class=\"tip\">Bir parça şaşırtmaca: ona ihtiyacın yok.</p>",
      solution: "isim = \"Mert\"\npuan = 85\npuan = puan + 5\nmesaj = f\"Merhaba {isim}, puanın {puan}\"\nprint(mesaj)",
      extra: ["print(\"mesaj\")"], expect: ["Merhaba Mert, puanın 90"],
      hints: ["Bir kutuyu kullanmadan önce oluşturmalısın. <code>mesaj</code> hangi kutuları kullanıyor?", "Puan önce 85 olmalı, sonra 5 artmalı. Mesaj, puan arttıktan <b>sonra</b> hazırlanmalı.", "<code>print(\"mesaj\")</code> tırnak içinde olduğu için ekrana \"mesaj\" kelimesini yazar."] },
    { type: "read", title: "Hazırsın!", html:
      "<p>Tebrikler, başlangıç eğitimini bitirdin! Artık gerçek Python defterine geçebilirsin.</p>" +
      "<p>Yol haritasındaki sıradaki adım: <b>Notebook 00 · Python'a Giriş</b>. Onu bitirince, öğrendiklerini atölyedeki <b>istasyonlarda</b> uygulayacaksın.</p>", colab: "nb00" }
  ]
}
];

/* =====================================================================
   COLAB DEFTERLERİ — GitHub'daki notebook'lar Colab'da açılır.
   Repo değişirse sadece REPO satırını güncellemek yeter.
   ===================================================================== */
export var REPO = "akgulnursima0349/python-atolyesi";
export function colabUrl(file) { return "https://colab.research.google.com/github/" + REPO + "/blob/main/notebooks/" + file; }
export var NOTEBOOKS = {
  nb00: { file: "00_Python_Giris.ipynb", title: "Python'a Giriş", desc: "print, değişkenler, matematik, metinler, if, listeler, döngüler, fonksiyonlar, sözlükler. Sonunda sayı tahmin oyunu ve robot simülatörü.", stations: ["tahmin", "hata", "ajan", "piksel", "bot"] },
  nb01: { file: "01_ML_Kutuphaneleri.ipynb", title: "Yapay Zekânın Alet Çantası", desc: "NumPy, Pandas, Matplotlib, Seaborn ve scikit-learn ile ilk tanışma. Elma mı portakal mı?" },
  lab1: { file: "02_Lab1_Rakam_Tanima.ipynb", title: "Lab 1 · Rakamları Okuyan Yapay Zekâ", desc: "KNN ile el yazısı rakam tanıma. Sonunda kendi çizdiğin rakamı tahmin ettiriyorsun." },
  lab2: { file: "03_Lab2_Penguen_Dedektifi.ipynb", title: "Lab 2 · Penguen Dedektifi", desc: "Karar ağaçları, ezberleme tuzağı ve rastgele orman." },
  lab3: { file: "04_Lab3_KMeans_Renk_Sanati.ipynb", title: "Lab 3 · Yapay Zekâ Ressamı", desc: "K-Means ile kümeleme, şarj istasyonları ve pop-art." }
};

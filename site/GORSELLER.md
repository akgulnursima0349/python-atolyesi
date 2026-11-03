# Python Atölyesi · Gemini ile üretilecek görseller

Sitede görsel yeri olan her alanda şu an kurum renginde bir yer tutucu duruyor. Görseller geldikçe ben yerleştireceğim, yer tutucular kendiliğinden kalkacak.

## Nasıl ilerleyeceğiz?

1. **Önce sadece 1 numaralı görseli (`hero`) üret.** Bu görsel bütün setin "stil çapası" olacak.
2. Beğendiğin hali bana gönder, birlikte bakalım.
3. Onaylarsak kalan 10 görseli üretirken **her istemde hero görselini de referans olarak Gemini'ye yükle** ve aşağıdaki ortak stil metnini istemin başına ekle. Seti tutarlı tutan şey bu ikisi.

## Ortak stil metni (her istemin başına, İngilizce)

```
Flat editorial vector illustration for a middle-school coding course website.
Clean geometric shapes, soft gradients only inside shapes, no outlines (or very thin
uniform charcoal lines), gentle soft shadows. Limited palette: signal red #D7262E,
charcoal #15171C, cool light grays #F4F5F7 and #E2E5EA, white, plus small accents of
teal #11A08B. Calm, modern, professional — like an illustration in a quality
educational product, not a cartoon for small children. Characters are 11–14 year old
students with simple faces, diverse, Turkish classroom context. No text, no letters,
no logos, no watermarks in the image. Plenty of empty space around the subject.
```

## Görsel listesi

| # | Dosya adı | Oran / boyut | Nerede görünüyor | İstem (ortak stil metninden sonra) |
|---|-----------|--------------|------------------|-------------------------------------|
| 1 | `hero.webp` | 4:3 · 1600×1200 | Giriş sayfası, sağ taraf | Two middle-school students at a robotics lab desk with a laptop showing colorful code lines, an Arduino board with wires, a small robot arm beside them, one student pointing at the screen. Warm daylight from a window. |
| 2 | `phase-1.webp` | 16:10 · 1600×1000 | 1. adım: Başlangıç dersleri | A staircase made of stacked blocks rising upward, each block slightly more refined, a student climbing it holding a laptop; at the top a glowing code bracket shape. |
| 3 | `phase-2.webp` | 16:10 · 1600×1000 | 2. adım: Notebook 00 | An open digital notebook on a laptop screen with alternating text and code cells, a play button on one cell, a student's hand on the trackpad. |
| 4 | `phase-3.webp` | 16:10 · 1600×1000 | 3. adım: İstasyonlar | Five small workstations arranged in an arc, each a different activity (a magnifying glass over a bug, a padlock, a pixel grid, chat bubbles, a terminal), students moving between them. |
| 5 | `phase-4.webp` | 16:10 · 1600×1000 | 4. adım: Notebook 01 | A toolbox opened on a desk, instead of tools it contains a bar chart, a data table, a scatter plot and a small brain made of nodes. |
| 6 | `phase-5.webp` | 16:10 · 1600×1000 | 5. adım: Lab'lar | A science lab bench with three experiments: a handwritten digit on a sheet being scanned, a penguin figurine next to a decision tree diagram, and color swatches being sorted into groups. |
| 7 | `st-tahmin.webp` | 16:9 · 1600×900 | İstasyon: Çıktıyı Tahmin Et | A large terminal window with a blinking cursor and a big question mark floating in front of it, a student thinking with hand on chin. |
| 8 | `st-hata.webp` | 16:9 · 1600×900 | İstasyon: Hata Avcısı | A friendly small beetle sitting on a line of code on a big screen, a student holding a magnifying glass looking at it. |
| 9 | `st-ajan.webp` | 16:9 · 1600×900 | İstasyon: Gizli Ajan | A manila case folder stamped with a blank red stamp shape, a padlock and a key, scrambled letter tiles being rearranged; spy-mystery mood but friendly. |
| 10 | `st-piksel.webp` | 16:9 · 1600×900 | İstasyon: Piksel Sanatı | A large grid canvas being filled square by square into a simple heart and rainbow pattern, a student with a stylus, small colored squares floating. |
| 11 | `st-bot.webp` | 16:9 · 1600×900 | İstasyon: Sohbet Botu | A phone-like chat window with speech bubbles between a student and a small friendly robot icon, some bubbles connected by dotted lines to example sentence cards. |
| 12 | `st-yapboz.webp` | 16:9 · 1600×900 | İstasyon: Kod Yapbozu | Large puzzle pieces shaped like horizontal code-line strips (colored bars, no readable text) being slotted into a vertical stack on a big screen, one piece slightly indented to the right, a student fitting the last piece. |
| 13 | `st-model.webp` | 16:9 · 1600×900 | Model Atölyesi (4. adım) | A scatter plot on a large screen with red apples and orange oranges as dots, the background split into soft red and orange regions by a diagonal boundary, a real apple and an orange on the desk in front of the screen, a student pointing at a star-shaped new point. |

## Teslim etmeden önce

- [ ] Dosya adları tablodakiyle birebir aynı (küçük harf, tire işareti).
- [ ] Görselde yazı, harf ya da logo yok. Gemini bazen sahte yazı ekler, varsa yeniden üret.
- [ ] WebP formatında, her biri 300 KB'tan küçük. PNG ya da JPG gönderirsen ben dönüştürürüm.
- [ ] Bütün set yan yana konunca aynı çizerin elinden çıkmış gibi görünüyor.

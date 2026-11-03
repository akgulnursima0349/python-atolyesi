"""dist/index.html -> artifact sayfası (doctype/html/head/body etiketleri olmadan) ve dosya listesi."""
import re, os, sys, json, shutil
# Kullanım: python3 to-artifact.py [çıktı_klasörü] [mock]
D='/home/claude/atolye-app/dist'; OUT=sys.argv[1] if len(sys.argv) > 1 else '/home/claude/atolye/site'
MOCK = len(sys.argv) > 2 and sys.argv[2] == 'mock'
h=open(D+'/index.html').read()
head=re.search(r'<head>(.*)</head>',h,re.S).group(1); body=re.search(r'<body>(.*)</body>',h,re.S).group(1)
head=re.sub(r'<meta charset[^>]*>\s*','',head); head=re.sub(r'<meta name="viewport"[^>]*>\s*','',head)
head=head.replace('<title>Python Atölyesi</title>','<title>Python Atölyesi</title>\n<meta name="claude:viewport-fit-sides" content="cover">')
os.makedirs(OUT,exist_ok=True)
for sub in ['assets','vendor']:
    p=OUT+'/'+sub
    if os.path.isdir(p): shutil.rmtree(p)
    shutil.copytree(D+'/'+sub,p)
open(OUT+'/index.html','w').write(head.strip()+'\n'+body.strip()+'\n')
if MOCK: open(OUT+'/ayarlar.js','w').write('/* Önizleme: sahte sunucu, veriler sadece bu tarayıcıda. */\nwindow.ATOLYE_AYAR = { mock: true };\n')
else: open(OUT+'/ayarlar.js','w').write('/* Claude önizlemesi: hesapsız mod (önizleme sayfaları dış sunuculara bağlanamaz). */\nwindow.ATOLYE_AYAR = {};\n')
files={'ayarlar.js':'ayarlar.js'}
for sub in ['assets','vendor']:
    for f in os.listdir(OUT+'/'+sub): files[sub+'/'+f]=sub+'/'+f
print(json.dumps(files))

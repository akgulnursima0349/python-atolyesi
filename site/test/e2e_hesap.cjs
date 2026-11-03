const { chromium } = require('/home/claude/robi-python/test/node_modules/playwright');
const path=require('path'), fs=require('fs');
const DIST=path.resolve(__dirname,'../dist');
const OUT='/tmp/claude-0/-home-claude/246b35d1-2152-56a4-aef3-201d53db8cc1/scratchpad/v4'; fs.mkdirSync(OUT,{recursive:true});
const log=(...a)=>console.log(...a);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const errs=[];
 const ctx=await b.newContext({viewport:{width:1360,height:900}});
 await ctx.route('**/*', r=>{ const u=r.request().url();
   if (u.startsWith('http://site/')) { const rel=decodeURIComponent(u.slice(12).split('#')[0].split('?')[0])||'index.html';
     if (rel==='ayarlar.js') return r.fulfill({body:'window.ATOLYE_AYAR={mock:true};', contentType:'application/javascript'});
     const f=path.join(DIST,rel); return fs.existsSync(f)&&fs.statSync(f).isFile()? r.fulfill({path:f, contentType: f.endsWith('.js')?'application/javascript':undefined}) : r.fulfill({status:404,body:''}); }
   return r.abort(); });
 const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
 const go=async(h)=>{ await p.evaluate(h=>location.hash=h,h); await p.waitForTimeout(400); };
 const txt=(s)=>p.$eval(s,e=>e.innerText).catch(()=>'(yok)');
 await p.goto('http://site/index.html'); await p.waitForTimeout(700);
 log('landing CTA:', await txt('.landing-cta'));
 await go('asama-1'); log('korumalı sayfa →', await p.evaluate(()=>location.hash));
 await p.screenshot({path:OUT+'/login.png'});
 // öğretmen kaydı
 await p.click('[data-v="ogretmen"]'); await p.click('#toSignup');
 await p.fill('#sMail','nur@kurum.com'); await p.fill('#sPass','gizli123'); await p.click('#fSignup button[type=submit]'); await p.waitForTimeout(400);
 await p.fill('#cAd','Nur Hoca'); await p.fill('#cKod','YANLIS'); await p.click('#fComplete button[type=submit]'); await p.waitForTimeout(300);
 log('yanlış kurum kodu:', await txt('#loginMsg'));
 await p.fill('#cKod','TEST'); await p.click('#fComplete button[type=submit]'); await p.waitForTimeout(500);
 log('panel:', await p.evaluate(()=>location.hash), '|', await txt('h1'));
 await p.fill('#ncAd','7-A Cumartesi'); await p.click('#newClass button'); await p.waitForTimeout(700);
 log('sınıf kodu:', await txt('.code-box b'));
 const kod = await txt('.code-box b'); const sinifHash = await p.evaluate(()=>location.hash);
 await p.click('[data-tab="ogrenciler"]'); await p.fill('#names','Kartal\nYıldız Ece\nkartal\nX'); await p.click('#addStudents button'); await p.waitForTimeout(700);
 const pins = await p.$$eval('.pin-card', cs=>cs.map(c=>({ad:c.querySelectorAll('b')[1].innerText, pin:c.querySelectorAll('b')[2].innerText})));
 log('PIN kartları:', JSON.stringify(pins), '| atlanan:', await txt('.pin-sheet p.muted'));
 await p.screenshot({path:OUT+'/pins.png', fullPage:true});
 await p.click('#logoutBtn'); await p.waitForTimeout(500);
 log('çıkış →', await p.evaluate(()=>location.hash));
 // öğrenci
 await p.fill('#lKod', kod.toLowerCase()); await p.fill('#lAd','kartal'); await p.fill('#lPin','0000'); await p.click('#fStudent button[type=submit]'); await p.waitForTimeout(400);
 log('yanlış PIN:', await txt('#loginMsg'));
 await p.fill('#lPin', pins[0].pin); await p.click('#fStudent button[type=submit]'); await p.waitForTimeout(600);
 log('öğrenci giriş →', await p.evaluate(()=>location.hash), '|', await txt('.hello'));
 await p.screenshot({path:OUT+'/student_landing.png'});
 await go('on-test'); await p.click('#tStart'); for (let i=0;i<12;i++){ await p.waitForTimeout(50); await p.click(i%2?'.opt[data-o="1"]':'.opt--idk'); }
 await p.waitForTimeout(300); log('kayıt durumu:', await p.$eval('#saveDot',e=>e.className)); await p.waitForTimeout(1800); log('kayıt durumu sonra:', await p.$eval('#saveDot',e=>e.className));
 await p.screenshot({path:OUT+'/student_bar.png'});
 await p.reload(); await p.waitForTimeout(800); await go('asama-1'); log('yeniden yüklemede ön test kartı:', (await txt('.test-card .test-foot')).replace(/\n/g,' '));
 // ikinci öğrenci aynı bilgisayarda
 await p.click('#logoutBtn'); await p.waitForTimeout(500);
 log('çıkıştan sonra yerel kayıt:', await p.evaluate(()=>localStorage.getItem('python-atolyesi-v1')));
 await p.fill('#lKod', kod); await p.fill('#lAd','Yıldız Ece'); await p.fill('#lPin', pins[1].pin); await p.click('#fStudent button[type=submit]'); await p.waitForTimeout(600);
 await go('asama-1'); log('ikinci öğrencide ön test:', (await txt('.test-card .test-foot')).replace(/\n/g,' '));
 // kaba kuvvet
 await p.click('#logoutBtn'); await p.waitForTimeout(400);
 for (let i=0;i<9;i++){ await p.fill('#lKod', kod); await p.fill('#lAd','Kartal'); await p.fill('#lPin','99'+String(i).padStart(2,'0')); await p.click('#fStudent button[type=submit]'); await p.waitForTimeout(150); }
 log('9 yanlış deneme:', await txt('#loginMsg'));
 // öğretmen raporu
 await p.click('[data-v="ogretmen"]'); await p.fill('#tMail','nur@kurum.com'); await p.fill('#tPass','gizli123'); await p.click('#fTeacher button[type=submit]'); await p.waitForTimeout(600);
 await go(sinifHash.slice(1)); await p.waitForTimeout(500);
 log('rapor satırları:', await p.$$eval('.prog-tbl tbody tr', rs=>rs.map(r=>r.innerText.replace(/\s+/g,' ').trim())));
 await p.click('[data-open]'); await p.waitForTimeout(200);
 await p.screenshot({path:OUT+'/class_progress.png', fullPage:true});
 await p.click('[data-tab="testler"]'); await p.waitForTimeout(200); await p.screenshot({path:OUT+'/class_tests.png', fullPage:true});
 await p.click('[data-tab="ogrenciler"]'); await p.click('[data-pin]'); await p.waitForTimeout(100); log('onay düğmesi:', await txt('[data-pin].armed')); await p.click('[data-pin]'); await p.waitForTimeout(400);
 log('yeni PIN kartı:', await txt('.pin-card'));
 await p.screenshot({path:OUT+'/class_students.png', fullPage:true});
 await go('asama-3'); log('öğretmen kursu gezebiliyor (kilitsiz):', await p.$$eval('.station-card', c=>c.length));
 // mobil
 const m=await ctx.newPage(); await m.setViewportSize({width:390,height:844}); await m.goto('http://site/index.html#'+sinifHash.slice(1)); await m.waitForTimeout(900);
 log('mobil sınıf genişlik', await m.evaluate(()=>document.documentElement.scrollWidth)); await m.screenshot({path:OUT+'/m_class.png', fullPage:true});
 await m.click('#logoutBtn'); await m.waitForTimeout(500); log('mobil giriş genişlik', await m.evaluate(()=>document.documentElement.scrollWidth)); await m.screenshot({path:OUT+'/m_login.png'});
 console.log('ERRORS', errs);
 await b.close();
})();

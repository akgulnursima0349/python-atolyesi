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
 const go=async(h)=>{ await p.evaluate(h=>location.hash=h,h); await p.waitForTimeout(500); };
 const txt=(s)=>p.$eval(s,e=>e.innerText).catch(()=>'(yok)');
 async function signup(mail, ad, kod){ await go('giris'); await p.click('[data-v="ogretmen"]'); await p.click('#toSignup'); await p.fill('#sMail',mail); await p.fill('#sPass','gizli123'); await p.click('#fSignup button[type=submit]'); await p.waitForTimeout(300); await p.fill('#cAd',ad); await p.fill('#cKod',kod); await p.click('#fComplete button[type=submit]'); await p.waitForTimeout(500); }
 async function login(mail){ await go('giris'); await p.click('[data-v="ogretmen"]'); await p.fill('#tMail',mail); await p.fill('#tPass','gizli123'); await p.click('#fTeacher button[type=submit]'); await p.waitForTimeout(500); }
 async function out(){ if (await p.$('#logoutBtn')) { await p.click('#logoutBtn'); await p.waitForTimeout(400); } }
 async function newClass(ad, names){ await go('ogretmen'); await p.fill('#ncAd',ad); await p.click('#newClass button'); await p.waitForTimeout(600); const h=await p.evaluate(()=>location.hash); await p.click('[data-tab="ogrenciler"]'); await p.fill('#names',names); await p.click('#addStudents button'); await p.waitForTimeout(600); return h.slice(1); }
 await p.goto('http://site/index.html'); await p.waitForTimeout(600);
 await signup('nur@k.com','Nur Hoca','TEST'); const A = await newClass('7-A', 'Kartal\nDeniz'); await out();
 await signup('ali@k.com','Ali Hoca','TEST'); const B = await newClass('8-B', 'Kartal'); await out();
 // Nur, Ali'yi A'ya ortak ekler
 await login('nur@k.com'); await go(A); await p.click('[data-tab="ogretmenler"]'); await p.waitForTimeout(400);
 log('A öğretmenleri:', (await txt('#teachersTab .st-list')).replace(/\n/g,' | '));
 await p.selectOption('#addTSel', {label:'Ali Hoca'}); await p.click('#addT button'); await p.waitForTimeout(500);
 log('ekledikten sonra:', (await txt('#teachersTab .st-list')).replace(/\n/g,' | '));
 await p.screenshot({path:OUT+'/r_teachers.png', fullPage:true});
 await p.click('[data-tab="ogrenciler"]'); log('Nur için Taşı düğmesi (tek sınıfı var):', await p.$$eval('[data-move]',x=>x.length));
 await out();
 // Ali: iki sınıfı görür, A'da ortak; taşıma
 await login('ali@k.com'); await go('ogretmen'); log('Ali sınıfları:', (await txt('#classList')).replace(/\n/g,' | '));
 await go(A); log('Ali A başlığı:', await txt('.class-head p')); await p.click('[data-tab="ogrenciler"]');
 log('Ali için sil düğmesi (ortak):', await p.$$eval('#delClass',x=>x.length));
 const rowsIds = await p.$$eval('[data-move]', x=>x.map(e=>e.dataset.move)); const names = await p.$$eval('.st-list .st-name > b', x=>x.map(e=>e.innerText));
 log('öğrenciler:', names);
 const iK = names.indexOf('Kartal'), iD = names.indexOf('Deniz');
 await p.click(`[data-move="${rowsIds[iK]}"]`); await p.click(`[data-moveok="${rowsIds[iK]}"]`); await p.waitForTimeout(400); log('Kartal taşıma:', await txt('#addMsg'));
 await p.click(`[data-move="${rowsIds[iD]}"]`); await p.click(`[data-moveok="${rowsIds[iD]}"]`); await p.waitForTimeout(500);
 log('Deniz taşındı, A kalan:', await p.$$eval('.st-list .st-name > b', x=>x.map(e=>e.innerText)));
 await p.screenshot({path:OUT+'/r_students.png', fullPage:true});
 await out();
 // müdür
 await signup('mudur@k.com','Müdür Bey','MUDUR'); await go('ogretmen');
 log('müdür eyebrow:', await txt('.work-head .eyebrow'), '| diğer sınıflar:', (await txt('#otherList')).replace(/\n/g,' | '));
 log('öğretmenler:', (await txt('#teacherList')).replace(/\n/g,' | '));
 await p.screenshot({path:OUT+'/r_mudur.png', fullPage:true});
 const ali = await p.$$eval('[data-akt]', x=>x.map(e=>({id:e.dataset.akt, t:e.closest('li').innerText}))); const aliId = ali.find(x=>x.t.includes('Ali')).id;
 await p.click(`[data-akt="${aliId}"]`); await p.click(`[data-akt="${aliId}"]`); await p.waitForTimeout(500);
 log('pasif sonrası:', (await txt('#teacherList')).replace(/\n/g,' | '));
 await go(B); await p.click('[data-tab="ogretmenler"]'); await p.waitForTimeout(400); await p.selectOption('#devTSel', {label:'Nur Hoca'}); await p.click('#devBtn'); await p.click('#devBtn'); await p.waitForTimeout(700);
 log('B devredildi, başlık:', await txt('.class-head p'));
 await out();
 await login('ali@k.com'); log('pasif Ali girişi:', await txt('#loginMsg'), '|', await p.evaluate(()=>location.hash));
 const m=await ctx.newPage(); await m.setViewportSize({width:390,height:844}); await login.call(null,'mudur@k.com').catch(()=>{});
 console.log('ERRORS', errs);
 await b.close();
})();

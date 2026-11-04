const { chromium } = require('/home/claude/robi-python/test/node_modules/playwright');
const path=require('path'), fs=require('fs');
const DIST=path.resolve(__dirname,'../dist');
const OUT='/tmp/claude-0/-home-claude/246b35d1-2152-56a4-aef3-201d53db8cc1/scratchpad/v3'; fs.mkdirSync(OUT,{recursive:true});
const log=(...a)=>console.log(...a);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const errs=[];
 async function page(w,h){ const p=await b.newPage({viewport:{width:w,height:h}});
   p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push(m.text()); });
   await p.route('**/*', r=>{ const u=r.request().url();
     if (u.startsWith('http://site/')) { if (u.includes('/ayarlar.js')) return r.fulfill({body:'window.ATOLYE_AYAR={};',contentType:'application/javascript'}); const f=path.join(DIST,decodeURIComponent(u.slice(12).split('#')[0].split('?')[0])||'index.html'); return fs.existsSync(f)&&fs.statSync(f).isFile()? r.fulfill({path:f, contentType: f.endsWith('.js')?'application/javascript':undefined}) : r.fulfill({status:404,body:''}); }
     return r.abort(); }); return p; }
 const go=async(p,h)=>{ await p.evaluate(h=>location.hash=h,h); await p.waitForTimeout(250); };
 const setCode=(p,c)=>p.evaluate(c=>document.querySelector('.CodeMirror').CodeMirror.setValue(c),c);
 const txt=(p,s)=>p.$eval(s,e=>e.innerText).catch(()=>'(yok)');
 const p=await page(1360,900);
 await p.goto('http://site/index.html'); await p.waitForTimeout(600);
 await p.click('#startBtn'); await p.waitForTimeout(300);
 await p.screenshot({path:OUT+'/a1.png', fullPage:true});
 log('ders1 kilitli mi:', await txt(p,'.lesson-row .status'));
 // ön test
 await p.click('a[href="#on-test"]'); await p.waitForTimeout(200); await p.screenshot({path:OUT+'/t0.png'});
 await p.click('#tStart');
 for (let i=0;i<12;i++){ await p.waitForTimeout(80); if(i===2) await p.screenshot({path:OUT+'/t1.png'}); const sel = i%3===0 ? '.opt--idk' : '.opt[data-o="1"]'; await p.click(sel); }
 await p.waitForTimeout(200); await p.screenshot({path:OUT+'/t2.png', fullPage:true});
 log('ön test sonuç:', (await txt(p,'.summary .big')));
 // ders 1
 await go(p,'ders-1'); await p.click('#lNext'); // read
 await p.click('.opt[data-o="2"]'); await p.click('#lNext'); await p.click('#lNext'); // quiz, read
 log('adım:', await txt(p,'.lnav-info'));
 await p.click('#pCheck'); log('boş tahmin:', await txt(p,'#pRes'));
 await p.fill('#pGuess','7\n7'); await p.click('#pCheck'); await p.waitForTimeout(150);
 await p.screenshot({path:OUT+'/l_predict.png', fullPage:true});
 log('tahmin sonucu:', (await txt(p,'#pRes .fb h3')));
 await p.click('#lNext');
 // kod adımı: ipucu merdiveni
 await p.click('#lHint'); log('ipucu1 sonrası düğme:', await txt(p,'#lHint'), '| disabled', await p.$eval('#lHint',e=>e.disabled));
 await p.click('#lRun'); await p.waitForTimeout(100); log('başarısız deneme sonrası:', await txt(p,'#lHint'));
 await p.click('#lHint'); log('ipucu2 sonrası:', await txt(p,'#lHint'));
 await p.click('#lRun'); await p.click('#lRun'); await p.waitForTimeout(100); log('3 deneme sonrası:', await txt(p,'#lHint'));
 await p.click('#lHint'); await p.waitForTimeout(100);
 await p.screenshot({path:OUT+'/l_hints.png', fullPage:true});
 await setCode(p,'print("Merhaba Dünya!")\nprint("Ben Ali")\n'); await p.click('#lRun'); await p.waitForTimeout(150);
 log('kod sonucu:', await txt(p,'#qfb h3'));
 await p.click('#lNext');
 await setCode(p,'print(365*24)\n'); await p.click('#lRun'); await p.waitForTimeout(100); await p.click('#lNext');
 await p.waitForTimeout(150); await p.screenshot({path:OUT+'/l_end.png', fullPage:true});
 log('ders sonu:', await txt(p,'.bonus-offer b'));
 await p.click('#goBonus'); await p.waitForTimeout(150); await p.screenshot({path:OUT+'/l_bonus.png', fullPage:true});
 log('bonus adım:', await txt(p,'.lnav-info'), await txt(p,'#lNext'));
 // öğretmen modu ile diğer derslere
 await p.keyboard.press('Control+Shift+S'); await p.waitForTimeout(200);
 await go(p,'ders-6'); for(let i=0;i<4;i++){ await p.click('#lNext'); await p.waitForTimeout(60);} 
 log('ders6 adım', await txt(p,'.lnav-info'));
 // yapboz: doğru sırayla tıkla
 const order=['isim = "Mert"','puan = 85','puan = puan + 5','mesaj = f"Merhaba {isim}, puanın {puan}"','print(mesaj)'];
 for (const o of order){ const blks=await p.$$('.pz-blk'); for(const bl of blks){ if((await bl.innerText()).trim()===o){ await bl.click(); break; } } await p.waitForTimeout(40); }
 await p.screenshot({path:OUT+'/l_parsons.png', fullPage:true});
 await p.click('#lRun'); await p.waitForTimeout(150); log('ders yapboz:', await txt(p,'#qfb h3'), '|', await txt(p,'#lOut'));
 // istasyonlar sayfası
 await go(p,'asama-3'); await p.screenshot({path:OUT+'/p3.png', fullPage:true});
 // yapboz istasyonu görev 3
 await go(p,'yapboz-3'); await p.waitForTimeout(150);
 for (const o of ['for i in range(1, 4):','print(i)','print("Bitti")']){ const blks=await p.$$('.pz-blk'); for(const bl of blks){ if((await bl.innerText()).trim()===o){ await bl.click(); break; } } await p.waitForTimeout(40); }
 await p.click('#runBtn'); await p.waitForTimeout(150); log('girintisiz:', await txt(p,'#feedback h3'));
 await p.click('.pz-row[data-i="1"] button[data-a="in"]'); await p.click('#runBtn'); await p.waitForTimeout(150);
 log('girintili:', await txt(p,'#feedback h3'));
 await p.screenshot({path:OUT+'/st_yapboz.png', fullPage:true});
 // hata istasyonu: konum ipucu
 await go(p,'hata-1'); await p.click('#hintBtn'); await p.click('#runBtn'); await p.waitForTimeout(100); await p.click('#hintBtn'); log('hata ipuçları:', (await txt(p,'#hints')).replace(/\n/g,' / '));
 // model istasyonu
 await go(p,'asama-4'); await p.screenshot({path:OUT+'/p4.png', fullPage:true});
 const { STATIONS } = await import(path.resolve(__dirname,'../src/data/stations.js'));
 const M = STATIONS.find(s=>s.id==='model');
 for (const ti of [0,1,2,3,4,5]){
   await go(p,'model-'+(ti+1)); await p.waitForTimeout(200);
   if (ti===1){ await p.click('#runBtn'); await p.waitForTimeout(400); log('model-2 başlangıç:', await txt(p,'#feedback h3'), await txt(p,'#predOut')); }
   await setCode(p, M.tasks[ti].solution); await p.click('#runBtn'); await p.waitForTimeout(1500);
   log('model-'+(ti+1)+':', await txt(p,'#feedback h3'), '|', await txt(p,'#predOut'));
   await p.screenshot({path:OUT+`/model${ti+1}.png`, fullPage:true});
 }
 // K kaydırıcı
 await go(p,'model-3'); await setCode(p, M.tasks[2].solution); await p.click('#runBtn'); await p.waitForTimeout(800);
 await p.$eval('#kIn', e=>{ e.value=1; e.dispatchEvent(new Event('input')); }); await p.waitForTimeout(1200);
 await p.screenshot({path:OUT+'/model3_k1.png'});
 const cv = await p.$('#mv'); const bb = await cv.boundingBox(); await p.mouse.click(bb.x+bb.width*0.85, bb.y+bb.height*0.75); await p.waitForTimeout(100);
 log('tıklama sonrası:', await txt(p,'#predOut'));
 // kontrol testi
 await go(p,'kontrol-1'); await p.click('#tStart'); 
 for (let i=0;i<5;i++){ await p.waitForTimeout(60); await p.click('.opt[data-o="1"]'); await p.waitForTimeout(60); if(i===0) await p.screenshot({path:OUT+'/k1.png'}); await p.click('#tNext'); }
 await p.waitForTimeout(150); await p.screenshot({path:OUT+'/k_end.png', fullPage:true}); log('kontrol:', await txt(p,'.summary .big'));
 // son test + rapor
 await go(p,'son-test'); await p.click('#tStart'); for (let i=0;i<12;i++){ await p.waitForTimeout(60); await p.click(i%4===0?'.opt[data-o="0"]':'.opt[data-o="1"]'); }
 await p.waitForTimeout(400); log('hash:', await p.evaluate(()=>location.hash));
 await p.screenshot({path:OUT+'/report.png', fullPage:true});
 await go(p,'asama-1'); await p.screenshot({path:OUT+'/p1_after.png', fullPage:true});
 await go(p,'asama-5'); await p.screenshot({path:OUT+'/p5.png', fullPage:true});
 // mobil
 const m=await page(390,844); await m.goto('http://site/index.html#ana'); await m.waitForTimeout(300);
 await m.evaluate(()=>{ localStorage.setItem('python-atolyesi-v1', JSON.stringify({done:{},code:{},quiz:{},tests:{},teacher:true})); });
 const over=async(h)=>{ await go(m,h); await m.waitForTimeout(300); return m.evaluate(()=>document.documentElement.scrollWidth); };
 await m.reload(); 
 for (const h of ['asama-1','ders-6','yapboz-7','model-3','on-test','kontrol-2','sonuc','asama-4']) { const w=await over(h); if (h==='ders-6'){ for(let i=0;i<4;i++){await m.click('#lNext');} } log('mobil',h,w); }
 await go(m,'yapboz-7'); for (const o of ['for satir in range(3):','sira = ""']){ const blks=await m.$$('.pz-blk'); for(const bl of blks){ if((await bl.innerText()).trim()===o){ await bl.click(); break; } } } await m.waitForTimeout(100);
 await m.screenshot({path:OUT+'/m_yapboz.png', fullPage:true}); log('mobil yapboz genişlik', await m.evaluate(()=>document.documentElement.scrollWidth));
 await go(m,'model-3'); await m.evaluate(c=>document.querySelector('.CodeMirror').CodeMirror.setValue(c), M.tasks[2].solution); await m.click('#runBtn'); await m.waitForTimeout(1200);
 await m.screenshot({path:OUT+'/m_model.png', fullPage:true}); log('mobil model genişlik', await m.evaluate(()=>document.documentElement.scrollWidth));
 console.log('ERRORS', errs);
 await b.close();
})();

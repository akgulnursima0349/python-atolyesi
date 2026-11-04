const { chromium } = require('/home/claude/robi-python/test/node_modules/playwright');
const path=require('path'), fs=require('fs'); const DIST=path.resolve(__dirname,'../dist');
const OUT='/tmp/claude-0/-home-claude/246b35d1-2152-56a4-aef3-201d53db8cc1/scratchpad/v6'; fs.mkdirSync(OUT,{recursive:true});
const log=(...a)=>console.log(...a);
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const errs=[];
 async function page(w,h){ const p=await b.newPage({viewport:{width:w,height:h}}); p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.route('**/*', r=>{ const u=r.request().url(); if (u.startsWith('http://site/')) { const rel=decodeURIComponent(u.slice(12).split('#')[0])||'index.html';
   if (rel==='ayarlar.js') return r.fulfill({body:'window.ATOLYE_AYAR={};',contentType:'application/javascript'});
   const f=path.join(DIST,rel); return fs.existsSync(f)&&fs.statSync(f).isFile()? r.fulfill({path:f, contentType: f.endsWith('.js')?'application/javascript':undefined}) : r.fulfill({status:404,body:''}); } return r.abort(); });
  await p.goto('http://site/index.html#ana'); await p.waitForTimeout(400);
  await p.evaluate(()=>{ localStorage.setItem('python-atolyesi-v1', JSON.stringify({done:{},code:{},quiz:{},tests:{},teacher:true})); }); await p.reload(); await p.waitForTimeout(500); return p; }
 const p=await page(1280,860);
 const go=async(h)=>{ await p.evaluate(h=>location.hash=h,h); await p.waitForTimeout(350); };
 const seg=async(n)=>{ await p.click(`[data-seg="${n}"]`); await p.waitForTimeout(300); };
 const say=async()=>p.$eval('.sc-say, .tr-say',e=>e.innerText.replace(/\s+/g,' ').slice(0,160)).catch(()=>'(yok)');
 // sahneler
 await go('ders-1'); await seg(1); await p.fill('#bkW','Ağ'); await p.waitForTimeout(600); log('ikilik:', await say()); await p.screenshot({path:OUT+'/s_ikilik.png'});
 await go('ders-2'); await seg(1); await p.click('[data-a="down"]'); await p.click('[data-a="down"]'); await p.waitForTimeout(300); log('merdiven:', await say()); await p.screenshot({path:OUT+'/s_merdiven.png'});
 await seg(6); await p.click('#dkGo'); await p.waitForTimeout(3600); log('yarış:', await say()); await p.screenshot({path:OUT+'/s_yaris.png'});
 await go('ders-3'); await seg(1); await p.$eval('input[data-k="a"]', e=>{e.value=2; e.dispatchEvent(new Event('input'));}); await p.$eval('input[data-k="c"]', e=>{e.value=3; e.dispatchEvent(new Event('input'));}); await p.waitForTimeout(800); log('range:', await say()); await p.screenshot({path:OUT+'/s_range.png'});
 await seg(7); await p.waitForTimeout(300); for(let i=0;i<6;i++) await p.click('[data-a="next"]'); await p.waitForTimeout(300); log('trace ders3:', await say(), '|', await p.$eval('.tr-n',e=>e.innerText)); await p.screenshot({path:OUT+'/t_ders3.png'});
 await go('ders-4'); await seg(1); log('girinti başta:', await say()); await p.click('[data-k="2"][data-d="1"]'); await p.waitForTimeout(200); log('girinti iki içeride:', await say(), '|', await p.$eval('#giOut',e=>e.innerText.replace(/\n/g,' '))); await p.click('[data-k="1"][data-d="-1"]'); await p.waitForTimeout(200); log('girinti hata:', await p.$eval('#giOut',e=>e.innerText.slice(0,80))); await p.screenshot({path:OUT+'/s_girinti.png'});
 await go('ders-5'); await seg(1); await p.click('.maker .btn'); await p.waitForTimeout(300); await p.click('.maker .btn'); await p.waitForTimeout(800); await p.click('.fab .bot[data-id="1"]'); await p.click('[data-go]'); await p.waitForTimeout(400); log('fabrika:', await say());
 await seg(6); for(let i=0;i<14;i++){ if (await p.$eval('[data-a="next"]',e=>e.disabled)) break; await p.click('[data-a="next"]'); } await p.waitForTimeout(300); log('trace nesne:', await say()); await p.screenshot({path:OUT+'/t_nesne.png'});
 await go('ders-6'); await seg(1); await p.click('[data-run="2"]'); await p.waitForTimeout(200); log('hücre hata:', await say()); await p.click('[data-run="0"]'); await p.click('[data-run="1"]'); await p.click('[data-run="2"]'); await p.click('[data-run="2"]'); await p.waitForTimeout(300); log('hücre:', await say(), '|', await p.$eval('#clMem',e=>e.innerText.replace(/\n/g,' '))); await p.screenshot({path:OUT+'/s_hucre.png'});
 // ders kod adımından izleyici
 await go('ders-3'); await seg(4); await p.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.setValue('for i in range(3):\n    print(i * 2)\n')); await p.click('#lTrace'); await p.waitForTimeout(400);
 for(let i=0;i<4;i++) await p.click('.tr-modal [data-a="next"]'); await p.waitForTimeout(300); log('modal:', await say()); await p.screenshot({path:OUT+'/t_modal.png'});
 await p.click('.tr-modal [data-a="play"]'); await p.waitForTimeout(6000); log('modal oynat son:', await p.$eval('.tr-modal .tr-n',e=>e.innerText), await say()); await p.keyboard.press('Escape'); await p.waitForTimeout(200); log('modal kapandı:', await p.$$eval('.tr-modal',x=>x.length));
 // predict
 await go('ders-1'); await seg(4); await p.fill('#pGuess','x'); await p.click('#pCheck'); await p.click('#pTrace'); await p.waitForTimeout(300); log('predict trace:', await p.$eval('.tr-modal .tr-n',e=>e.innerText)); await p.keyboard.press('Escape');
 // istasyonlar
 for (const [h,label] of [['hata-9','fix'],['ajan-1','cipher'],['piksel-3','pixel'],['bot-5','bot'],['model-3','model']]) {
   await go(h); await p.click('#traceBtn'); await p.waitForTimeout(500);
   const n = await p.$eval('.tr-modal .tr-n',e=>e.innerText).catch(async()=> 'HATA: '+await p.$eval('.tr-modal .tr-body',e=>e.innerText.slice(0,120)));
   await p.$eval('.tr-modal .tr-range', e=>{ e.value=e.max; e.dispatchEvent(new Event('input')); }).catch(()=>{}); await p.waitForTimeout(200);
   log('istasyon', label, n, '| son:', await say());
   if (label==='model') await p.screenshot({path:OUT+'/t_model.png'});
   await p.keyboard.press('Escape'); await p.waitForTimeout(150);
 }
 await go('ajan-2'); await p.click('#dlBox summary'); await p.waitForTimeout(300); await p.$eval('#dlHost input[data-k="c"]', e=>{e.value=2; e.dispatchEvent(new Event('input'));}); await p.$eval('#dlHost input[data-k="a"]', e=>{e.value=1; e.dispatchEvent(new Event('input'));}); await p.waitForTimeout(300);
 log('dilim:', await p.$eval('#dlE',e=>e.innerText), await p.$eval('#dlR',e=>e.innerText)); await p.screenshot({path:OUT+'/s_dilim.png'});
 await go('tahmin-3'); await p.click('.opt[data-o="0"]'); await p.click('#cardTrace'); await p.waitForTimeout(300); log('tahmin kartı trace:', await p.$eval('.tr-modal .tr-n',e=>e.innerText)); await p.keyboard.press('Escape');
 await go('yapboz-3'); for (const o of ['for i in range(1, 4):','print(i)']){ const bl=await p.$$('.pz-blk'); for(const x of bl){ if((await x.innerText()).trim()===o){ await x.click(); break; } } } await p.click('.pz-row[data-i="1"] button[data-a="in"]'); await p.click('#traceBtn'); await p.waitForTimeout(300); log('yapboz trace:', await p.$eval('.tr-modal .tr-n',e=>e.innerText)); await p.keyboard.press('Escape');
 // mobil
 const m=await page(390,844); for (const h of ['ders-3']) { await m.evaluate(h=>location.hash=h,h); await m.waitForTimeout(300); }
 await m.click('[data-seg="1"]'); await m.waitForTimeout(300); log('mobil range genişlik', await m.evaluate(()=>document.documentElement.scrollWidth)); await m.screenshot({path:OUT+'/m_range.png', fullPage:true});
 await m.click('[data-seg="7"]'); await m.waitForTimeout(300); for(let i=0;i<5;i++) await m.click('[data-a="next"]'); log('mobil trace genişlik', await m.evaluate(()=>document.documentElement.scrollWidth)); await m.screenshot({path:OUT+'/m_trace.png', fullPage:true});
 await m.evaluate(()=>location.hash='ders-5'); await m.waitForTimeout(300); await m.click('[data-seg="1"]'); await m.waitForTimeout(300); log('mobil fabrika genişlik', await m.evaluate(()=>document.documentElement.scrollWidth));
 await m.evaluate(()=>location.hash='bot-2'); await m.waitForTimeout(300); await m.click('#traceBtn'); await m.waitForTimeout(400); log('mobil modal genişlik', await m.evaluate(()=>document.documentElement.scrollWidth)); await m.screenshot({path:OUT+'/m_modal.png'});
 log('ERR', errs); await b.close(); })();

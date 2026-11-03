const { chromium } = require('/home/claude/robi-python/test/node_modules/playwright');
const path=require('path'), fs=require('fs');
const DIST=path.resolve(__dirname,'../dist');
const OUT='/tmp/claude-0/-home-claude/246b35d1-2152-56a4-aef3-201d53db8cc1/scratchpad/v2'; fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const errs=[];
 async function page(w,h){ const p=await b.newPage({viewport:{width:w,height:h}});
   p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
   await p.route('**/*', r=>{ const u=r.request().url();
     if (u.startsWith('http://site/')) { const f=path.join(DIST,decodeURIComponent(u.slice(12).split('#')[0].split('?')[0])||'index.html'); return fs.existsSync(f)&&fs.statSync(f).isFile()? r.fulfill({path:f, contentType: f.endsWith('.js')?'application/javascript':undefined}) : r.fulfill({status:404,body:''}); }
     if (u.includes('fonts.g')) return r.continue();
     return r.abort(); }); return p; }
 const shots = JSON.parse(process.argv[2]||'[]');
 const p=await page(1360,900);
 await p.goto('http://site/index.html'); await p.waitForTimeout(800);
 await p.screenshot({path:OUT+'/landing.png'});
 await p.click('#startBtn'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/p1.png', fullPage:true});
 await p.evaluate(()=>location.hash='asama-2'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/p2.png', fullPage:true});
 await p.evaluate(()=>location.hash='asama-3'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/p3.png', fullPage:true});
 await p.evaluate(()=>location.hash='asama-5'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/p5.png', fullPage:true});
 await p.keyboard.press('Control+Shift+S'); await p.waitForTimeout(200);
 // lesson flow
 await p.evaluate(()=>location.hash='ders-3'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/lesson_read.png', fullPage:true});
 await p.click('#lNext'); await p.waitForTimeout(150); await p.click('#lNext'); await p.waitForTimeout(200);
 await p.click('#lRun'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/lesson_code_fail.png', fullPage:true});
 await p.click('#lSol'); await p.click('#lRun'); await p.waitForTimeout(300);
 const ok=await p.evaluate(()=>document.querySelector('#qfb').innerText); console.log('lesson code:', JSON.stringify(ok.slice(0,40)));
 // stations
 for (const [h,name] of [['hata-1','hata'],['ajan-6','ajan'],['piksel-5','piksel'],['bot-4','bot']]){
   await p.evaluate(x=>location.hash=x,h); await p.waitForTimeout(300);
   if (name!=='hata') await p.click('#solBtn');
   await p.click('#runBtn'); await p.waitForTimeout(1500);
   await p.screenshot({path:OUT+'/st_'+name+'.png', fullPage:true});
   console.log(name, JSON.stringify((await p.evaluate(()=>document.querySelector('#feedback').innerText)).slice(0,60)));
 }
 await p.evaluate(()=>location.hash='bot-7'); await p.waitForTimeout(300); await p.click('#runBtn'); await p.waitForTimeout(300);
 for (const m of ['merhbaa','naslsın','görüşrüz','mrb']){ await p.fill('#cmpIn',m); await p.press('#cmpIn','Enter'); await p.waitForTimeout(120);} 
 await p.waitForTimeout(600); await p.screenshot({path:OUT+'/st_compare.png', fullPage:true});
 await p.evaluate(()=>location.hash='tahmin-1'); await p.waitForTimeout(300); await p.click('.opt[data-o="1"]'); await p.waitForTimeout(300);
 await p.screenshot({path:OUT+'/st_quiz.png', fullPage:true});
 const m=await page(390,844); await m.goto('http://site/index.html'); await m.waitForTimeout(700);
 await m.screenshot({path:OUT+'/m_landing.png', fullPage:true});
 console.log('m landing sw', await m.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]));
 for (const h of ['asama-1','asama-3','ajan-1','ders-3']) { await m.evaluate(x=>location.hash=x,h); await m.waitForTimeout(400); console.log('m',h, await m.evaluate(()=>[document.documentElement.scrollWidth,innerWidth])); }
 await m.screenshot({path:OUT+'/m_ders3.png', fullPage:true});
 console.log('ERRORS', errs); await b.close();
})();

const { chromium } = require('/home/claude/robi-python/test/node_modules/playwright');
const path=require('path'), fs=require('fs'); const DIST=path.resolve(__dirname,'../dist');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const w of [700,900,1000,1100,1218,1280,1440]) { const p=await b.newPage({viewport:{width:w,height:800}});
 await p.route('**/*', r=>{ const u=r.request().url(); if (u.startsWith('http://site/')) { const f=path.join(DIST,decodeURIComponent(u.slice(12).split('#')[0])); return fs.existsSync(f)&&fs.statSync(f).isFile()? r.fulfill({path:f, contentType: f.endsWith('.js')?'application/javascript':undefined}) : r.fulfill({status:404,body:''}); } return r.abort(); });
 await p.goto('http://site/index.html#ana'); await p.waitForTimeout(400);
 console.log(w, await p.evaluate(()=>[document.documentElement.scrollWidth, Math.round(document.querySelector('.landing-logo').getBoundingClientRect().left)]));
 if (process.argv[2]==String(w)) await p.screenshot({path:process.argv[3]}); await p.close(); }
 await b.close(); })();

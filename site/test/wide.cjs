const { chromium } = require('/home/claude/robi-python/test/node_modules/playwright');
const path=require('path'), fs=require('fs'); const DIST=path.resolve(__dirname,'../dist');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const p=await b.newPage({viewport:{width:390,height:844}});
 await p.route('**/*', r=>{ const u=r.request().url(); if (u.startsWith('http://site/')) { const f=path.join(DIST,decodeURIComponent(u.slice(12).split('#')[0])); return fs.existsSync(f)&&fs.statSync(f).isFile()? r.fulfill({path:f, contentType: f.endsWith('.js')?'application/javascript':undefined}) : r.fulfill({status:404,body:''}); } return r.abort(); });
 for (const h of process.argv.slice(2)) { await p.goto('http://site/index.html#'+h); await p.waitForTimeout(500);
 console.log(h, await p.evaluate(()=>{ const W=innerWidth, out=[]; document.querySelectorAll('body *').forEach(el=>{ const r=el.getBoundingClientRect(); if(r.right>W+1 && el.children.length<6) out.push(el.tagName+'.'+el.className+' '+Math.round(r.right)); }); return [document.documentElement.scrollWidth, out.slice(0,8)]; })); }
 await b.close(); })();

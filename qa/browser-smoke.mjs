import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const axePath=require.resolve('axe-core/axe.min.js');
const root=resolve('dist');
const out=resolve('qa-results');
const MIME={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 const target=resolve(root,'.'+(path==='/'?'/index.html':path));
 if(!target.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 const content=await readFile(target);
 res.writeHead(200,{'content-type':MIME[extname(target)]||'application/octet-stream'});res.end(content);
}catch{res.writeHead(404);res.end('Not found');}});
const results={scope:'Built site in headless Chromium; Firebase/API/third-party calls mocked; no production account writes',passed:[],failed:[],a11y:[],overflow:[],performance:[],screenshots:[]};
const fakeAuth=[
 'const auth={listeners:[],currentUser:null};',
 'export function getAuth(){return auth;}',
 'export function onAuthStateChanged(a,cb){a.listeners.push(cb);queueMicrotask(()=>cb(a.currentUser));return ()=>{};}',
 'export class GoogleAuthProvider {}',
 'export async function signInWithPopup(){throw Object.assign(new Error("popup blocked"),{code:"auth/popup-blocked"});}',
 'export async function signInWithEmailAndPassword(a,email,pw){throw Object.assign(new Error("invalid"),{code:"auth/invalid-credential"});}',
 'export async function createUserWithEmailAndPassword(){throw Object.assign(new Error("exists"),{code:"auth/email-already-in-use"});}',
 'export async function sendEmailVerification(){}',
 'export async function sendPasswordResetEmail(){return;}',
 'export async function signOut(){a.currentUser=null;}'
].join('\n');
const config={apiKey:'AIzaSyA5-fSev6Pi9AeXOK7wG7gYmEVklwYcCoc',authDomain:'lyricsverse-302a4.firebaseapp.com',projectId:'lyricsverse-302a4',appId:'1:919264230501:web:2e84216cbe271b9dddda8c'};
async function mock(context){
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='127.0.0.1')return route.continue();
  if(u.hostname==='www.gstatic.com'&&u.pathname.endsWith('/firebase-app.js'))return route.fulfill({status:200,contentType:'text/javascript',body:'export function initializeApp(config){return {config}}'});
  if(u.hostname==='www.gstatic.com'&&u.pathname.endsWith('/firebase-auth.js'))return route.fulfill({status:200,contentType:'text/javascript',body:fakeAuth});
  if(u.hostname==='www.gstatic.com'&&u.pathname.endsWith('/firebase-analytics.js'))return route.fulfill({status:200,contentType:'text/javascript',body:'export async function isSupported(){return false;} export function getAnalytics(){}'});
  if(u.hostname==='lyricsverse-api.onrender.com'){
   let data={data:[]};
   if(u.pathname==='/api/v1/auth/config')data={data:{authReady:true,firebaseConfig:config}};
   if(u.pathname==='/api/v1/ratings')data={data:{count:0,average:null}};
   if(u.pathname==='/api/v1/catalog/songs')data={data:[],total:0};
   if(u.pathname==='/api/v1/providers/discovery/search')data={data:{results:[],songs:[],sources:[]}};
   if(u.pathname==='/api/v1/media/videos/search')data={data:{videos:[],items:[],searchUrl:'https://www.youtube.com/results'}};
   return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)});
  }
  return route.abort('blockedbyclient');
 });
}
async function run(label,fn){try{await fn();results.passed.push(label);console.log('PASS',label);}catch(e){results.failed.push({label,error:String(e?.message||e)});console.log('FAIL',label,String(e?.message||e));}}
async function audit(page,label){
 await page.addScriptTag({path:axePath});
 const a=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 results.a11y.push({label,violations:a.violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.slice(0,8).map(n=>({target:n.target,summary:n.failureSummary,html:n.html.slice(0,240)}))}))});
 const elements=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left < -3||r.right>document.documentElement.clientWidth+3);}).slice(0,12).map(e=>e.tagName+'.'+e.className));
 const metrics=await page.evaluate(()=>{
  const nav=performance.getEntriesByType('navigation')[0];
  const doc=document.documentElement;
  return {viewport:doc.clientWidth,scrollWidth:doc.scrollWidth,hasHorizontalScroll:doc.scrollWidth>doc.clientWidth+3,
    domContentLoadedMs:Math.round(nav?.domContentLoadedEventEnd||0),
    loadEventMs:Math.round(nav?.loadEventEnd||0)};
 });
 results.overflow.push({label,elements,documentScrollWidth:metrics.scrollWidth,viewport:metrics.viewport,hasHorizontalScroll:metrics.hasHorizontalScroll});
 results.performance.push({label,...metrics,source:'LOCAL_FIXTURE—not production LCP/CLS/INP'});
 console.log('A11Y',label,JSON.stringify(results.a11y.at(-1).violations),'OVERFLOW',JSON.stringify({elements,scrollWidth:metrics.scrollWidth,viewport:metrics.viewport}));
 if(a.violations.some(v=>['critical','serious'].includes(v.impact)))throw Error('Serious WCAG accessibility violations: '+a.violations.map(v=>v.id).join(', '));

}
let browser;
try{
 await mkdir(out,{recursive:true});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},reducedMotion:'reduce'});
  await mock(context);
  const page=await context.newPage();page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const visit=async hash=>{await page.goto(base+hash,{waitUntil:'domcontentloaded'});await page.locator('main#app-main').first().waitFor();};
  await run(device.name+' homepage + ratings',async()=>{
   await visit('#/');
   assert.ok(await page.locator('.neon-hero h1').count());
   assert.ok(await page.locator('.rating-star').count()===5);
   assert.ok(await page.locator('a.song-card').count()>0);
   await audit(page,device.name+'-home');
   await page.screenshot({path:resolve(out,device.name+'-home.png'),fullPage:true,animations:'disabled'});
  });
  await run(device.name+' search interaction',async()=>{
   await visit('#/search');
   const input=page.locator('input[name="q"]:visible');
   assert.equal(await input.count(),1);
   assert.equal(await page.locator('.lv-search-prompt').count(),2);
   // Structural visual gate: introductory layout must span both results columns,
   // not inherit only the narrow external-sources track.
   const geometry=await page.evaluate(()=>{
     const content=document.querySelector('.neon-search-content');
     const panel=document.querySelector('.lv-search-welcome');
     const cards=[...document.querySelectorAll('.lv-search-prompt')];
     const c=content.getBoundingClientRect(),p=panel.getBoundingClientRect();
     const items=cards.map(card=>card.getBoundingClientRect());
     return {containerWidth:c.width,panelWidth:p.width,panelLeft:p.left,containerLeft:c.left,
       cardWidths:items.map(item=>item.width),cardTops:items.map(item=>item.top)};
   });
   assert.ok(geometry.panelWidth>=geometry.containerWidth*.97,
     'Empty-search panel is squeezed into a results-grid column: '+JSON.stringify(geometry));
   assert.ok(Math.abs(geometry.panelLeft-geometry.containerLeft)<=3,
     'Empty-search panel must align with full results grid');
   if(device.name==='desktop'){
     assert.ok(geometry.cardWidths[0]>geometry.cardWidths[1]*1.3,
       'Desktop bento tiles must preserve purposeful unequal spans');
   }else{
     assert.ok(Math.abs(geometry.cardTops[0]-geometry.cardTops[1])>=50,
       'Mobile search prompts should stack instead of clipping');
   }
   await page.screenshot({path:resolve(out,device.name+'-search-welcome.png'),fullPage:true,animations:'disabled'});
   await page.locator('[data-discovery-query="love"]').click();
   assert.equal(await input.inputValue(),'love');
   await input.fill('midnight');
   assert.equal(await page.locator('.neon-search-content').count(),1);
   await audit(page,device.name+'-search');
  });
  await run(device.name+' signed-out library',async()=>{
   await visit('#/library');
   assert.ok(await page.locator('.lv-library-empty').count());
   assert.ok(await page.locator('.lv-library-empty a[href="#/profile"]').count());
  });
  await run(device.name+' song reader',async()=>{
   await visit('#/');
   await page.locator('a.song-card').first().click();
   assert.match(new URL(page.url()).hash,/#\/(lyrics|original)\//);
   assert.ok(await page.locator('main').count());
   await audit(page,device.name+'-reader');
  });
  await run(device.name+' password input, signup, reset',async()=>{
   await visit('#/profile');
   assert.equal(await page.locator('.lv-auth-studio-bento').count(),0);
   assert.ok(await page.locator('.lv-auth-studio-discover').count());
   if(device.name==='mobile')assert.equal(await page.locator('.lv-auth-studio:visible').count(),0);
   await page.locator('#firebase-email').fill('tester@example.com');
   await page.locator('#firebase-password').fill('123');
   await page.locator('#firebase-auth-form button[type=submit]').click();
   assert.match(await page.locator('#firebase-form-error').innerText(),/at least 6 characters/i);
   await page.locator('#firebase-password').fill('wrongpassword');
   await page.locator('#firebase-auth-form button[type=submit]').click();
   await page.getByText(/Incorrect email or password/).first().waitFor();
   await page.locator('[data-action="firebase-mode"]').click();
   assert.ok(await page.locator('#firebase-confirm-password').count());
   await page.locator('[data-action="firebase-generate-password"]').click();
   assert.ok((await page.locator('#firebase-password').inputValue()).length>=16);
   await page.locator('[data-action="firebase-mode"]').click();
   await page.locator('[data-action="firebase-reset"]').click();
   assert.equal(await page.locator('#firebase-password').count(),0);
   await page.locator('#firebase-email').fill('tester@example.com');
   await page.locator('#firebase-auth-form button[type=submit]').click();
   await page.getByText(/If an account exists/).waitFor();
   await audit(page,device.name+'-auth');
   await page.screenshot({path:resolve(out,device.name+'-auth.png'),fullPage:true,animations:'disabled'});
  });
  await run(device.name+' no uncaught JavaScript exceptions',async()=>{assert.deepEqual(errors,[]);});
  await context.close();
 }
}catch(e){results.failed.push({label:'Browser harness',error:String(e?.stack||e)});}
finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
 await writeFile(resolve(out,'report.json'),JSON.stringify(results,null,2));
 console.log('RESULT',JSON.stringify({pass:results.passed.length,fail:results.failed.length,a11y:results.a11y,overflow:results.overflow}));
 if(results.failed.length)process.exitCode=1;
}

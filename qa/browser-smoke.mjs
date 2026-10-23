/**
 * Browser QA: real Chromium layout/event execution, isolated fixture data.
 * No real Firebase accounts, MongoDB writes, ratings or production mutations.
 * Run: npm run build && npm install --no-save --no-package-lock playwright@1.56.1 axe-core@4.10.3
 *      npx playwright install chromium && node qa/browser-smoke.mjs
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require=createRequire(import.meta.url);
const axeScript=require.resolve('axe-core/axe.min.js');
const reportDir=resolve('qa-results');
const root=resolve('dist');
const MIME={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const buf=await readFile(file);
  res.writeHead(200,{'Content-Type':MIME[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(buf);
 }catch{res.writeHead(404);res.end('Not found');}
});
const fakeFirebaseApp="export function initializeApp(config){return {options:config,name:'lyricsverse'};}\n";
const fakeFirebaseAuth=String.raw
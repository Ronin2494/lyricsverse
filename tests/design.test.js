import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('site uses locked Figma background, surface, violet and accent colors',()=>{
  for(const color of ['#090f22','#111a30','#17223d','#f8fafc','#a17aff','#64e6e7'])assert.ok(css.includes(color), color);
});
test('the song reader dimensions retain the approved Figma geometry',()=>{
 for(const rule of ['.reader-main { padding:50px','height:220px','width:170px','border-radius:18px','height:96px'])assert.ok(css.replaceAll(' ','').includes(rule.replaceAll(' ','')),rule);
});
test('original Figma SVG assets exist',()=>{
  for(const file of ['cover-orb.svg','mountain.svg','hero-orb.svg','record-ring.svg']){
    const b=fs.readFileSync(new URL('../public/assets/'+file,import.meta.url),'utf8');
    assert.ok(b.includes('<svg')&&b.length>100,file);
  }
});

test('approved Neon Music Universe visual tokens are present across routes',()=>{
 for(const color of ['#050a20','#0d1634','#15234a','#bf74ff','#69e5ff','#fa70e6'])assert.ok(css.includes(color),color);
 for(const selector of ['.hero-v2','.search-page-header','.song-profile-banner','.profile-panel','.bottom-nav'])assert.ok(css.includes(selector),selector);
});
test('neon theme retains accessible focus and reduced-motion support',()=>{
 assert.ok(css.includes(':focus-visible'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(app.includes('function searchPageHTML'));
 assert.ok(app.includes('function readerHTML'));
 assert.ok(app.includes('function profileHTML'));
});

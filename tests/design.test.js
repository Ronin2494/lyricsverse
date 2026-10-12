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

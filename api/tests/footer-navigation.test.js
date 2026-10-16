import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
test('footer has both section controls and homepage section targets',()=>{for(const target of ['how-it-works','moods']){assert.match(app,new RegExp('data-scroll-to="'+target+'"'));assert.match(app,new RegExp('id="'+target+'"'));}});
test('footer controls scroll in place and navigate home from other routes',()=>{assert.match(app,/document\.getElementById\(target\)/);assert.match(app,/section\.scrollIntoView/);assert.match(app,/safeStorageSet\('sessionStorage','lyricverse:pending-section',target\)/);assert.match(app,/location\.hash='#\/'/);});
test('hash route completion scrolls after homepage render and honors reduced motion',()=>{assert.match(app,/safeStorageGet\('sessionStorage','lyricverse:pending-section'\)/);assert.match(app,/currentRoute\(\)\.page==='home'/);assert.match(app,/requestAnimationFrame\(\(\)=>document\.getElementById\(pending\)\?\.scrollIntoView/);assert.match(app,/prefers-reduced-motion: reduce/);});

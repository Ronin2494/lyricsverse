import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('LRCLIB unavailable lyrics card provides honest status without a clickable promise',()=>{
 const s=src.slice(src.indexOf('function providerResultsHTML()'),src.indexOf('function searchPageHTML()'));
 assert.match(s,/Lyrics not published here/);
 assert.doesNotMatch(s,/data-lrclib-id/);
 assert.match(s,/role="group"/);
 assert.match(s,/return localHTML\+webHTML\+/);
});

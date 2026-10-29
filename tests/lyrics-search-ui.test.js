import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const section=(start,end)=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)+start.length));
test('search UI excludes unused metadata catalog and genre controls',()=>{const s=section('function searchPageHTML()','function libraryHTML()');assert.doesNotMatch(s,/realCatalog\.filter|realSongCard|realCatalogHTML|Filter catalog by genre|Search all songs|Browsing /);});
test('web fallback is identified as search rather than verified lyrics',()=>{const s=section('function providerResultsHTML()','function searchPageHTML()');assert.match(s,/Search lyrics across the web/);assert.match(s,/Find lyrics beyond the LyricVerse catalog/);});
test('original compositions remains untouched',()=>assert.match(src,/originalCompositionsHTML\(\)/));

test('web result is present even without provider matches',()=>{const s=section('function providerResultsHTML()','function searchPageHTML()');assert.match(s,/const webUrl=webResult\?\.url\|\|/);assert.match(s,/return localHTML\+webHTML\+/);});

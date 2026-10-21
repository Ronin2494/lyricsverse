import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const nav=src.slice(src.indexOf('function navHTML()'),src.indexOf('function bottomNavHTML()'));
test('desktop and mobile menus omit redundant Artists tab',()=>{
 assert.doesNotMatch(nav,/>Artists<\/a>/);
 assert.doesNotMatch(nav,/href="#\/search">Artists/);
 assert.match(nav,/class="desktop-links"/);
 assert.match(nav,/class="mobile-menu"/);
});
test('Discover, Search, and single header search remain intact',()=>{
 assert.equal((nav.match(/>Discover<\/a>/g)||[]).length,2);
 assert.equal((nav.match(/>Search<\/a>/g)||[]).length,2);
 assert.match(nav,/searchHTML\(true\)/);
 assert.match(nav,/site-nav--search-page/);
 assert.match(src,/function videoResultsHTML\(\)/);
});

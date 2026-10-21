import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const start=app.indexOf('function searchPageHTML()'),end=app.indexOf('function libraryEmptyHTML()',start);
assert.ok(start>=0&&end>start,'search page implementation');
const page=app.slice(start,end);
const navStart=app.indexOf('function navHTML()'),navEnd=app.indexOf('function bottomNavHTML()',navStart);
assert.ok(navStart>=0&&navEnd>navStart,'navigation implementation');
test('search page removes duplicate hero input but retains lyrics language selection',()=>{
 assert.doesNotMatch(page,/searchHTML\(/);
 assert.doesNotMatch(page,/neon-search-control/);
 assert.match(page,/class="search-language-bar"/);
 assert.match(page,/languageSwitchHTML\(\)/);
 assert.match(page,/providerResultsHTML\(\)/);
});
test('header preserves the only search form and distinguishes search page on mobile',()=>{
 const nav=app.slice(navStart,navEnd);
 assert.match(nav,/site-nav--search-page/);
 assert.match(nav,/searchHTML\(true\)/);
 assert.match(nav,/class="nav-search"/);
 assert.match(nav,/href="#\/search">Search<\/a>/);
 const forms=(nav.match(/searchHTML\(/g)||[]).length;
 assert.equal(forms,1);
});
test('responsive navigation displays original search form without adding a second control',()=>{
 assert.match(css,/@media \(max-width: 767px\)/);
 assert.match(css,/\.site-nav--search-page \.nav-search \{\s*display: block/);
 assert.match(css,/\.site-nav--search-page \.search-input/);
 assert.match(css,/\.site-nav--search-page \+ \.mobile-menu/);
 assert.match(css,/\.neon-search-page \.neon-search-header \{\s*min-height: 0/);
});
test('single search keeps live YouTube/lyrics search, suggestions and controls',()=>{
 assert.match(app,/function loadProviderSearch\(/);
 assert.match(app,/function startLiveMusicSearch\(\)/);
 assert.match(app,/updateSearchResults\(e\.target\.closest\('form'\)\)/);
 assert.match(app,/data-video-search-id/);
 assert.match(app,/function videoResultsHTML\(\)/);
 assert.match(app,/function floatingPearlsHTML\(songs\)/);
});

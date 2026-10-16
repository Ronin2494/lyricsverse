import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const catalog=readFileSync(new URL('../src/catalog.js',import.meta.url),'utf8');
const mongo=readFileSync(new URL('../api/src/mongo.mjs',import.meta.url),'utf8');
const api=readFileSync(new URL('../api/src/repository.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('homepage, catalog, original reader and floater components exist',()=>{
 for(const name of ['homeHTML','realCatalogHTML','mixedSongsHTML','mixedSongCard','originalReaderHTML','originalCompositionsHTML','render'])assert.match(app,new RegExp('function '+name+'\\('));
});
test('all genre selectors include Hindi-English Mix',()=>{
 for(const name of ['genresHindi','genresDesktop','genresMobile'])assert.match(catalog,new RegExp('export const '+name+'[^;]*Hindi-English Mix'));
});
test('mixed genre displays originals from same data source as floater',()=>{
 assert.match(app,/function mixedSongsHTML\(\)[\s\S]*?originalCompositions\.filter\(s=>s\.genre==='Hindi-English Mix'\)/);
 assert.match(app,/function originalCompositionsHTML\(\)[\s\S]*?originalCompositions\[0\]/);
});
test('genre click routes to bilingual song section',()=>{
 assert.match(app,/state\.filter=genre\.dataset\.genre/);
 assert.match(app,/getElementById\('hindi-english-songs'\)/);
});
test('song card navigates to original reader',()=>{
 assert.match(app,/function mixedSongCard\(s\)[\s\S]*?#\/original\//);
 assert.match(app,/function originalReaderHTML\(\)/);
});
test('published free originals are loaded from public API',()=>{
 assert.match(app,/\/api\/v1\/catalog\/songs\?limit=24/);
 assert.match(app,/s\.status==='published'/);
 assert.match(app,/s\.source==='original'/);assert.match(app,/s\.featuredOwnComposition===true/);assert.match(app,/deepak sharma/);
});
test('API and database layers exist',()=>{
 assert.match(mongo,/MONGODB_DATABASE/);
 assert.match(api,/getDatabase/);
});
test('frontend entry and accessibility landmarks exist',()=>{
 assert.match(html,/id="app"/);
 assert.match(app,/<main/);
 assert.match(app,/aria-label=/);
});

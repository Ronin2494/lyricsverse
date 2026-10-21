import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/app.js');
const css=read('styles.css');
const start=app.indexOf('function howHTML()');
const stop=app.indexOf('function socialIcon(',start);
assert.ok(start>=0&&stop>start);
const code=app.slice(start,stop);

const example={_id:'507f1f77bcf86cd799439011',title:'First Song',artist:'Artist',
  status:'published',accessTier:'free',lyrics:'An uploaded first line'};
const catalogSong={id:'first-catalog-song',title:'Catalog song',artist:'Another artist'};

function page({published=[],catalog=[catalogSong]}={}){
 const scope={publishedSongs:published,allSongs:catalog,encodeURIComponent,
  songHref:s=>'#/lyrics/'+encodeURIComponent(s.id)};
 vm.createContext(scope);
 vm.runInContext(code+'\nthis.how=howHTML;',scope);
 return scope.how();
}

test('homepage discovery cards are clickable and lead to distinct useful destinations',()=>{
 const html=page();
 assert.equal((html.match(/class="feature-card lv-feature-link"/g)||[]).length,3);
 assert.match(html,/href="#\/search" class="feature-card lv-feature-link"/);
 assert.match(html,/href="#\/lyrics\/first-catalog-song" class="feature-card lv-feature-link"/);
 assert.match(html,/href="#\/library" class="feature-card lv-feature-link"/);
 assert.match(html,/Search songs/);
 assert.match(html,/Your library/);
 assert.equal((html.match(/<a /g)||[]).length,3);
});

test('Read card prioritizes published, free real lyrics without inventing an external link',()=>{
 const html=page({published:[example]});
 assert.match(html,/href="#\/original\/507f1f77bcf86cd799439011"/);
 assert.doesNotMatch(html,/target="_blank"/);
 assert.doesNotMatch(html,/href="https:/);
});

test('Read card excludes drafts, premium records, invalid IDs and empty lyrics',()=>{
 for(const invalid of [
  {...example,status:'draft'},
  {...example,accessTier:'premium'},
  {...example,_id:'not-an-id'},
  {...example,lyrics:''}
 ]){
  const html=page({published:[invalid]});
  assert.match(html,/href="#\/lyrics\/first-catalog-song"/);
  assert.doesNotMatch(html,/href="#\/original\//);
 }
});

test('empty catalog degrades to a safe internal search link',()=>{
 const html=page({catalog:[]});
 assert.equal((html.match(/href="#\/search"/g)||[]).length,2);
 assert.match(html,/href="#\/library"/);
});

test('Portfolio-level linked cards retain Figma colors and accessible focus',()=>{
 assert.match(css,/\.feature-grid \.lv-feature-link/);
 assert.match(css,/\.lv-feature-open/);
 assert.match(css,/\.feature-grid \.lv-feature-link:focus-visible/);
 assert.match(css,/@media \(max-width: 650px\)/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 for(const hex of ['#090f22','#a17aff','#64e6e7'])assert.ok(css.includes(hex));
 assert.match(app,/function floatingPearlsHTML\(songs\)/);
 assert.match(app,/href="\$\{songHref\(song\)\}"/);
 assert.match(app,/function originalReaderHTMLForSong\(song\)/);
});

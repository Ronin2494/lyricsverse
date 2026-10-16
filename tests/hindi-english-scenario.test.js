import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function extractFunction(name,nextName){
 const start=app.indexOf('function '+name+'(');
 const end=app.indexOf('function '+nextName+'(',start+1);
 assert.ok(start>=0&&end>start,name+' implementation exists');
 return app.slice(start,end);
}
const cardSource=extractFunction('mixedSongCard','mixedSongsHTML');
const sectionSource=extractFunction('mixedSongsHTML','realCatalogHTML');
const songs=[
 {_id:'507f1f77bcf86cd799439011',title:'mylyrics',artist:'Deepak Sharma',genre:'Hindi-English Mix',source:'original',status:'published',accessTier:'free',lyrics:'Hindi line\\nEnglish line'},
 {_id:'507f1f77bcf86cd799439012',title:'Another',artist:'Someone',genre:'Pop',source:'original',status:'published',accessTier:'free'}
];
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function renderSection(filter,data=songs){
 const ctx={state:{filter},originalCompositions:data,generatedSongThumbnail:()=>'/fallback.svg',esc:escapeHtml,encodeURIComponent};
 vm.createContext(ctx);
 vm.runInContext(cardSource+'\n'+sectionSource+'\nthis.renderMixed=mixedSongsHTML;',ctx);
 return ctx.renderMixed();
}
test('Hindi-English genre renders mylyrics from the same originals collection',()=>{
 const html=renderSection('Hindi-English Mix');
 assert.match(html,/>mylyrics</);
 assert.match(html,/>Deepak Sharma</);
 assert.match(html,/Hindi-English Mix/);
 assert.match(html,/#\/original\/507f1f77bcf86cd799439011/);
 assert.doesNotMatch(html,/>Another</);
});
test('Hindi-English genre is hidden when another genre is selected',()=>{
 assert.equal(renderSection('Pop'),'');
});
test('unpublished originals are excluded by the catalog loading rule',()=>{
 const loader=app.slice(app.indexOf('async function loadOriginalCompositions'),app.indexOf('function thumbnailHTML'));
 assert.match(loader,/publishedSongs=\(data\.data\|\|\[\]\)\.filter\(s=>s\.status==='published'/);
 assert.match(loader,/originalCompositions=publishedSongs\.filter\(s=>s\.source==='original'/);
 assert.match(loader,/\(s\.accessTier\|\|'free'\)==='free'/);
});
test('empty Hindi-English category has a visible empty state',()=>{
 assert.match(renderSection('Hindi-English Mix',[]),/Published songs in this genre will appear here/);
});
test('original lyrics reader and floater remain separate from genre section',()=>{
 assert.match(app,/function originalReaderHTML\(\)/);
 assert.match(app,/function originalCompositionsHTML\(\)/);
 assert.match(app,/\$\{originalCompositionsHTML\(\)\}/);
});

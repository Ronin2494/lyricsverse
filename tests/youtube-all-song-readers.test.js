import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
function functionSource(from,to){
  const start=source.indexOf('function '+from+'(');
  const end=source.indexOf('function '+to+'(',start+1);
  assert.ok(start!==-1&&end>start,from+' and '+to+' must be present');
  return source.slice(start,end);
}
const previewSource=functionSource('youtubePreviewHTML','readerHTML');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function renderPreview(song,preview,loading=false){
  const sandbox={state:{youtubePreview:preview,youtubePreviewLoading:loading},encodeURIComponent,esc};
  vm.createContext(sandbox);
  vm.runInContext(previewSource+'\nthis.preview=youtubePreviewHTML;',sandbox);
  return sandbox.preview(song);
}

test('published lyrics reader always offers preview without external links',()=>{
  const fn=functionSource('originalReaderHTMLForSong','readLanguage');
  assert.match(fn,/data-action="preview"/);
  assert.match(fn,/youtubePreviewHTML\(song\)/);
  assert.match(fn,/aria-label="Published lyrics"/);
  assert.match(styles,/original-preview-actions/);
});
test('catalog reader keeps its existing preview action and panel',()=>{
  assert.match(source,/function songMetaBanner\(song\)/);
  assert.match(source,/data-action="preview"/);
  assert.match(source,/function readerHTML\(\)/);
  assert.match(source,/youtubePreviewHTML\(song\)/);
});
test('published song renders the returned video safely',()=>{
  const song={_id:'507f1f77bcf86cd799439011',title:'Demo Song',artist:'An Artist'};
  const html=renderPreview(song,{songId:song._id,videoId:'y38qQRg3UDI'});
  assert.match(html,/youtube-nocookie.com\/embed\/y38qQRg3UDI/);
  assert.match(html,/Watch full song on YouTube/);
});
test('every song can fall back to an artist-and-title YouTube search',()=>{
  const song={_id:'507f1f77bcf86cd799439011',title:'Sample & Song',artist:'Example Artist'};
  const html=renderPreview(song,{songId:song._id,videoId:null});
  assert.match(html,/youtube.com\/results\?search_query=Example%20Artist%20Sample%20%26%20Song%20official%20audio/);
  assert.doesNotMatch(html,/<iframe/);
});
test('changing songs does not reuse another track preview',()=>{
  const song={_id:'507f1f77bcf86cd799439011',title:'Next',artist:'Other'};
  const html=renderPreview(song,{songId:'507f1f77bcf86cd799439012',videoId:'y38qQRg3UDI'});
  assert.doesNotMatch(html,/<iframe/);
});
test('preview workflow finds original records, validates IDs, and checks route after fetch',()=>{
  assert.match(source,/route\.page==='original'\s*\?publishedSongs\.find/);
  assert.match(source,/String\(x\._id\)===route\.slug/);
  assert.match(source,/\^\[A-Za-z0-9_-\]\{11\}\$/);
  assert.match(source,/currentRoute\(\)\.page\+':'\+currentRoute\(\)\.slug===routeKey/);
});

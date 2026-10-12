import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topSongs, newSongs, allSongs, readerSong, findSongs, originalDemoLyrics, hindiSongs, hindiDemoLyrics } from '../src/catalog.js';
test('reference homepage card groups match approved 5 + 5 layout',()=>{
  assert.equal(topSongs.length,5);assert.equal(newSongs.length,5);
});
test('song identifiers are unique',()=>assert.equal(new Set(allSongs.map(s=>s.id)).size,allSongs.length));
test('reader references the approved track and only original demo lyrics',()=>{
  assert.equal(readerSong.title,'After the Rain');assert.equal(originalDemoLyrics.length,3);
});
test('search matches artist and song case insensitively',()=>{
  assert.ok(findSongs('NOVA VALE').length>=2);
  assert.equal(findSongs('Midnight Drive')[0].artist,'Solar Tide');
});

test('Hindi catalog has four unique fictional songs and original Devanagari lyrics',()=>{assert.equal(hindiSongs.length,4);assert.ok(hindiSongs.every(s=>s.language==='hi' && hindiDemoLyrics[s.id]?.length===2));});
test('search matches Hindi script and roman aliases',()=>{assert.equal(findSongs('बारिश')[0].id,'baarish-ke-baad');assert.equal(findSongs('Baarish Ke Baad')[0].id,'baarish-ke-baad');});

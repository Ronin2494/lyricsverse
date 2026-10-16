import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topSongs, newSongs, allSongs, readerSong, findSongs, originalDemoLyrics, hindiSongs, hindiDemoLyrics } from '../src/catalog.js';
test('real chart catalog has international Punjabi and Hindi tracks',()=>{assert.ok(topSongs.length>=20);assert.ok(newSongs.length>=20);assert.ok(hindiSongs.length>=10);assert.ok(allSongs.some(s=>s.language==='pa'));});
test('song identifiers are unique',()=>assert.equal(new Set(allSongs.map(s=>s.id)).size,allSongs.length));
test('reader references a real chart song and no fabricated lyrics',()=>{assert.equal(readerSong.title,'Patient Zero');assert.equal(originalDemoLyrics.length,0);assert.deepEqual(hindiDemoLyrics,{});});
test('search matches artist and title case insensitively',()=>{assert.ok(findSongs('TAYLOR SWIFT').length>=1);assert.equal(findSongs('Patient Zero')[0].artist,'Taylor Swift');});
test('Hindi tracks contain chart metadata and external lyrics discovery',()=>{assert.ok(hindiSongs.every(s=>s.language==='hi'&&s.lyricsSearchUrl.startsWith('https://genius.com/search?q=')));});
test('search matches Hindi and Punjabi titles',()=>{assert.equal(findSongs('Arz Kiya Hai')[0].language,'hi');assert.equal(findSongs('Ashke')[0].language,'pa');});

import test from 'node:test';
import assert from 'node:assert/strict';
import {searchLrclib} from '../api/src/lrclib.mjs';
test('LRCLIB maps and deduplicates search results',async()=>{
 const fetcher=async(url,options)=>{assert.match(url,/lrclib.net\/api\/search/);assert.match(options.headers['User-Agent'],/LyricVerse/);return {ok:true,json:async()=>[{id:42,trackName:'Pilot Track',artistName:'Pilot Artist',plainLyrics:'test'},{id:43,trackName:'Pilot Track',artistName:'Pilot Artist'}]};};
 const data=await searchLrclib('unique pilot query 42',fetcher);assert.equal(data.length,1);assert.equal(data[0].provider,'lrclib');assert.equal(data[0].lyricsLicensed,false);
});
test('LRCLIB rejects invalid queries without requesting upstream',async()=>{assert.deepEqual(await searchLrclib('a'),[]);assert.deepEqual(await searchLrclib('x'.repeat(121)),[]);});
test('LRCLIB provider errors are detectable',async()=>{await assert.rejects(()=>searchLrclib('unique unavailable pilot',async()=>({ok:false})),/lrclib_unavailable/);});

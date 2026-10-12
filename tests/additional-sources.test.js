import test from 'node:test';import assert from 'node:assert/strict';import {searchAdditionalSources} from '../api/src/additional-sources.mjs';
test('one result per LRCLIB Genius and MusicBrainz; no Apple',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>url.includes('lrclib')?[{id:1,trackName:'Track',artistName:'Artist',plainLyrics:'sample'}]:url.includes('genius')?{response:{sections:[{hits:[{result:{title:'Track',primary_artist:{name:'Artist'},url:'https://genius.com/track'}}]}]}}:{recordings:[{id:'12345678-1234-1234-1234-123456789abc',title:'Track','artist-credit':[{name:'Artist'}]}]}});
 const data=await searchAdditionalSources('unique three provider pilot',fetcher);assert.deepEqual(data.map(x=>x.provider),['LRCLIB','Genius','MusicBrainz']);assert.equal(data.length,3);
});
test('provider failures do not break remaining results',async()=>{const data=await searchAdditionalSources('unique partial provider failure',async url=>{if(url.includes('genius'))throw Error('down');return {ok:true,json:async()=>url.includes('lrclib')?[{id:1,trackName:'Track',artistName:'Artist',syncedLyrics:'sample'}]:{recordings:[]}};});assert.equal(data.length,1);assert.equal(data[0].provider,'LRCLIB');});
test('invalid queries skip upstream',async()=>{assert.deepEqual(await searchAdditionalSources('a'),[]);assert.deepEqual(await searchAdditionalSources('x'.repeat(121)),[]);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createHandler} from '../src/handler.mjs';
import {getWikidataSongs} from '../src/wikidata.mjs';

test('Wikidata mapping preserves metadata without manufacturing lyrics',async()=>{const songs=await getWikidataSongs('pa',async url=>{assert.match(url,/query.wikidata.org/);return {ok:true,json:async()=>({results:{bindings:[{item:{value:'http://www.wikidata.org/entity/Q12345'},itemLabel:{value:'Example Song'},artistLabel:{value:'Example Artist'}}]}})};});assert.equal(songs.length,1);assert.equal(songs[0].title,'Example Song');assert.equal(songs[0].lyricsStatus,'unavailable');assert.equal(songs[0].language,'pa');assert.equal(songs[0].source,'https://www.wikidata.org/wiki/Q12345');});

test('Wikidata endpoint returns real catalog and rejects invalid language',async()=>{const handler=createHandler({env:{CORS_ORIGIN:'https://lyricsverse.onrender.com'},fetchCatalog:async language=>[{id:'wd-q1',title:'Song',language,lyricsStatus:'unavailable'}]});const server=createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');try{const base='http://127.0.0.1:'+server.address().port;const ok=await fetch(base+'/api/v1/wikidata/songs?language=hi');assert.equal(ok.status,200);const body=await ok.json();assert.equal(body.data[0].language,'hi');assert.equal(body.lyricsLicensed,false);const bad=await fetch(base+'/api/v1/wikidata/songs?language=xx');assert.equal(bad.status,400);}finally{server.close();}});

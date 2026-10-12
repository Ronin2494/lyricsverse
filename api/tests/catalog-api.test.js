import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createHandler} from '../src/handler.mjs';

async function request(path, opts={}) {
 const server=createServer(createHandler({env:{CORS_ORIGIN:'https://lyricsverse.onrender.com'},listCatalog:async ({language})=>[{title:'Original',language:language||'en',status:'published'}],getCatalogSong:async ()=>null}));
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try {const res=await fetch('http://127.0.0.1:'+server.address().port+path,opts);return {status:res.status,body:await res.json()};}
 finally {await new Promise(resolve=>server.close(resolve));}
}
test('MongoDB catalog endpoint supports Punjabi',async()=>{const x=await request('/api/v1/catalog/songs?language=pa');assert.equal(x.status,200);assert.equal(x.body.data[0].language,'pa');});
test('MongoDB catalog rejects bad language and limit',async()=>{assert.equal((await request('/api/v1/catalog/songs?language=fr')).status,400);assert.equal((await request('/api/v1/catalog/songs?limit=9999')).status,400);});
test('Missing catalog record responds 404',async()=>{assert.equal((await request('/api/v1/catalog/songs/507f1f77bcf86cd799439011')).status,404);});

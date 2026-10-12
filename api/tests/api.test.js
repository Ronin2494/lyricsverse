import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../src/handler.mjs';

async function run(path, options = {}) {
  const server = createServer(createHandler({ env: { CORS_ORIGIN: 'https://lyricsverse.onrender.com' }, checkDb: async () => ({ available: false, reason: 'not_configured' }) }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  } finally { server.close(); }
}
test('health reports database readiness without fabricating a connection', async () => {const x=await run('/health');assert.equal(x.status,200);assert.equal(x.body.database,'not_connected');});
test('catalog returns eleven English and four Hindi demonstration songs', async () => {const x=await run('/api/v1/songs');assert.equal(x.body.data.length,15);});
test('search is case insensitive and returns known songs', async () => {const x=await run('/api/v1/search?q=AFTER');assert.equal(x.body.data[0].id,'after-the-rain');});
test('search input has length limit', async () => {const x=await run('/api/v1/search?q='+'a'.repeat(121));assert.equal(x.status,400);});
test('song lookup and 404', async () => {assert.equal((await run('/api/v1/songs/after-the-rain')).status,200);assert.equal((await run('/api/v1/songs/nonexistent')).status,404);});
test('unlicensed songs do not expose lyrics', async () => {const x=await run('/api/v1/lyrics/chasing-lights');assert.equal(x.body.data.status,'unavailable');assert.deepEqual(x.body.data.sections,[]);});
test('origin checking disallows unknown websites', async () => {const x=await run('/api/v1/songs',{headers:{Origin:'https://evil.example'}});assert.equal(x.status,403);});
test('writes are not allowed', async () => {const x=await run('/api/v1/songs',{method:'POST'});assert.equal(x.status,405);});

test('language discovery includes Hindi / हिन्दी', async () => {const x=await run('/api/v1/languages');assert.equal(x.status,200);assert.equal(x.body.data.find(x=>x.code==='hi').nativeName,'हिन्दी');});
test('Hindi catalog filter yields four songs with language metadata', async () => {const x=await run('/api/v1/songs?language=hi');assert.equal(x.status,200);assert.equal(x.body.total,4);assert.ok(x.body.data.every(s=>s.language==='hi'));});
test('Devanagari and Romanized search work', async () => {let x=await run('/api/v1/search?q='+encodeURIComponent('सितारों'));assert.equal(x.body.data[0].id,'sitaron-ki-baat');x=await run('/api/v1/search?q=sitaron');assert.equal(x.body.data[0].language,'hi');});
test('Hindi original lyrics are marked demonstrative and never described as licensed', async () => {const x=await run('/api/v1/lyrics/sitaron-ki-baat');assert.equal(x.body.data.status,'original_demo_only');assert.equal(x.body.data.language,'hi');assert.equal(x.body.data.sections.length,2);});
test('invalid language filters are rejected', async () => {const x=await run('/api/v1/songs?language=zz');assert.equal(x.status,400);});

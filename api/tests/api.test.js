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
test('catalog returns real international Punjabi and Hindi songs', async () => {const x=await run('/api/v1/songs');assert.equal(x.body.data.length,45);});
test('search is case insensitive and returns known songs', async () => {const x=await run('/api/v1/search?q=PATIENT');assert.equal(x.body.data[0].id,'patient-zero');});
test('search input has length limit', async () => {const x=await run('/api/v1/search?q='+'a'.repeat(121));assert.equal(x.status,400);});
test('song lookup and 404', async () => {assert.equal((await run('/api/v1/songs/after-the-rain')).status,200);assert.equal((await run('/api/v1/songs/nonexistent')).status,404);});
test('unlicensed songs do not expose lyrics', async () => {const x=await run('/api/v1/lyrics/patient-zero');assert.equal(x.body.data.status,'unavailable');assert.deepEqual(x.body.data.sections,[]);});
test('origin checking disallows unknown websites', async () => {const x=await run('/api/v1/songs',{headers:{Origin:'https://evil.example'}});assert.equal(x.status,403);});
test('writes are not allowed', async () => {const x=await run('/api/v1/songs',{method:'POST'});assert.equal(x.status,405);});

test('language discovery includes Hindi / हिन्दी', async () => {const x=await run('/api/v1/languages');assert.equal(x.status,200);assert.equal(x.body.data.find(x=>x.code==='hi').nativeName,'हिन्दी');});
test('Hindi catalog filter yields fifteen songs with language metadata', async () => {const x=await run('/api/v1/songs?language=hi');assert.equal(x.status,200);assert.equal(x.body.total,15);assert.ok(x.body.data.every(s=>s.language==='hi'));});
test('Hindi song search works', async () => {const x=await run('/api/v1/search?q='+encodeURIComponent('Arz Kiya Hai'));assert.equal(x.body.data[0].language,'hi');});
test('Hindi tracks do not expose unlicensed lyrics', async () => {const x=await run('/api/v1/lyrics/arz-kiya-hai');assert.equal(x.body.data.status,'unavailable');assert.deepEqual(x.body.data.sections,[]);});
test('invalid language filters are rejected', async () => {const x=await run('/api/v1/songs?language=zz');assert.equal(x.status,400);});

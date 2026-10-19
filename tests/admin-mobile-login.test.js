import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdminClient, adminErrorMessage } from '../src/admin-client.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('admin client validates session using an in-memory key on mobile', async () => {
  const requests = [];
  const client = createAdminClient({ fetcher: async (url, options) => {
    requests.push({ url, headers: options.headers });
    return { ok: true, json: async () => ({ authenticated: true }) };
  } });
  client.setKey('  example-key-with-sufficient-length  ');
  assert.equal(client.hasKey(), true);
  assert.deepEqual(await client.request('GET', undefined, '/api/v1/admin/session'), { authenticated: true });
  assert.equal(requests[0].headers.Authorization, 'Bearer example-key-with-sufficient-length');
  client.clearKey();
  assert.equal(client.hasKey(), false);
  await assert.rejects(() => client.request(), /invalid_admin_key/);
});

test('admin client distinguishes rejected key, missing configuration and network failures', async () => {
  const client = createAdminClient({
    fetcher: async () => ({ ok: false, status: 503,
      json: async () => ({ error: 'admin_key_not_configured' }) })
  });
  client.setKey('dummy-long-key-that-is-not-real');
  await assert.rejects(() => client.request(), /admin_key_not_configured/);
  const offline = createAdminClient({fetcher: async () => {throw new Error('offline');}});
  offline.setKey('dummy-long-key-that-is-not-real');
  await assert.rejects(() => offline.request(), /admin_connection_failed/);
  assert.match(adminErrorMessage('invalid_admin_key'), /not accepted/i);
  assert.match(adminErrorMessage('admin_key_not_configured'), /Render/i);
});

test('mobile admin form uses no browser storage, avoids keyboard substitutions and displays helpful errors', () => {
  const html=read('admin.html');
  const script=read('src/admin.js');
  assert.match(html, /id="key" type="password"/);
  assert.match(html, /autocapitalize="none"/);
  assert.match(html, /autocorrect="off"/);
  assert.match(html, /id="toggle-key"/);
  assert.match(script, /createAdminClient/);
  assert.match(script, /adminErrorMessage/);
  assert.match(script, /client\.clearKey\(\)/);
  assert.doesNotMatch(script, /sessionStorage|localStorage/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../src/handler.mjs';

const configured = {
  AUTH_SECRET: 'x'.repeat(32),
  RESEND_API_KEY: 'test-resend-key',
  AUTH_FROM_EMAIL: 'no-reply@example.com',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  MONGODB_URI: 'mongodb://127.0.0.1:27017'
};

async function readAuthConfig(env) {
  const server = createServer(createHandler({ env }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/v1/auth/config');
    assert.equal(response.status, 200);
    return (await response.json()).data;
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('auth config returns boolean readiness when all providers and MongoDB are configured', async () => {
  const data = await readAuthConfig(configured);
  assert.equal(data.authReady, true);
  assert.equal(typeof data.authReady, 'boolean');
  assert.equal(data.googleClientId, 'test-google-client-id');
  assert.equal(data.emailEnabled, true);
});

test('shared prerequisites are required regardless of provider', async () => {
  for (const key of ['AUTH_SECRET', 'MONGODB_URI']) {
    const env = { ...configured };
    delete env[key];
    const data = await readAuthConfig(env);
    assert.equal(data.authReady, false, key + ' missing');
    assert.equal(typeof data.authReady, 'boolean');
  }
});

test('one configured provider is sufficient for authentication readiness', async () => {
  for (const key of ['RESEND_API_KEY', 'AUTH_FROM_EMAIL', 'GOOGLE_CLIENT_ID']) {
    const env = { ...configured };
    delete env[key];
    const data = await readAuthConfig(env);
    assert.equal(data.authReady, true, key + ' missing should not disable the other provider');
    assert.equal(data.emailEnabled, key === 'GOOGLE_CLIENT_ID');
    assert.equal(Boolean(data.googleClientId), key !== 'GOOGLE_CLIENT_ID');
  }
});

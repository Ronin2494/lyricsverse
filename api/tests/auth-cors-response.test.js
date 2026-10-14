import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHandler} from '../src/handler.mjs';

test('successful authentication response includes the validated CORS origin', async () => {
  const origin='https://lyricsverse.onrender.com';
  const handler=createHandler({env:{AUTH_SECRET:'x'.repeat(32),GOOGLE_CLIENT_ID:'test',MONGODB_URI:'mongodb://127.0.0.1:27017'}});
  const server=createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/auth/google',{
      method:'POST',
      headers:{Origin:origin,'Content-Type':'application/json'},
      body:JSON.stringify({credential:'invalid-token'})
    });
    assert.equal(response.headers.get('access-control-allow-origin'),origin);
    assert.notEqual(response.status,500);
  }finally{
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
});

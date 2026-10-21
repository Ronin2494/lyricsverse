import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../src/handler.mjs';
const env={AUTH_SECRET:'x'.repeat(40),FIREBASE_PROJECT_ID:'lyricsverse-demo-123',FIREBASE_WEB_API_KEY:'AIzaTEST_PUBLIC_SAMPLE_KEY_ABC123',FIREBASE_APP_ID:'1:123456789:web:abc123abc123',MONGODB_URI:'mongodb://localhost:27017/test'};
async function getConfig(config){
 const server=createServer(createHandler({env:config}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/auth/config');
  assert.equal(res.status,200);return (await res.json()).data;
 }finally{await new Promise(done=>server.close(done));}
}
test('Firebase project, web key, app id and database are mandatory',async()=>{
 const configured=await getConfig(env);
 assert.equal(configured.authReady,true);
 assert.equal(typeof configured.authReady,'boolean');
 for(const key of ['FIREBASE_PROJECT_ID','FIREBASE_WEB_API_KEY','FIREBASE_APP_ID','MONGODB_URI']){
  const partial=await getConfig({...env,[key]:''});
  assert.equal(partial.authReady,false,key);
 }
});
test('legacy AUTH_SECRET, Resend and Google credentials no longer enable password or Google login',async()=>{
 const result=await getConfig({AUTH_SECRET:'x'.repeat(32),RESEND_API_KEY:'sample',AUTH_FROM_EMAIL:'a@example.com',GOOGLE_CLIENT_ID:'old',MONGODB_URI:env.MONGODB_URI});
 assert.equal(result.authReady,false);
});

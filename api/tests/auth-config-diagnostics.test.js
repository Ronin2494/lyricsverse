import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../src/handler.mjs';
const env={AUTH_SECRET:'x'.repeat(40),FIREBASE_PROJECT_ID:'lyricsverse-demo-123',FIREBASE_WEB_API_KEY:'AIzaTEST_PUBLIC_SAMPLE_KEY_ABC123',FIREBASE_APP_ID:'1:123456789:web:abc123abc123',MONGODB_URI:'mongodb://localhost:27017/test'};
async function config(settings){
 const server=createServer(createHandler({env:settings}));
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{
  const result=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/auth/config',{headers:{Origin:'https://lyricsverse.onrender.com'}});
  assert.equal(result.status,200);
  return (await result.json()).data;
 }finally{await new Promise(done=>server.close(done));}
}
test('Firebase-only setup publishes web config but no service account secrets',async()=>{
 const data=await config(env);
 assert.equal(data.authReady,true);
 assert.equal(data.firebaseConfig.projectId,env.FIREBASE_PROJECT_ID);
 assert.equal(data.firebaseConfig.apiKey,env.FIREBASE_WEB_API_KEY);
 assert.equal(data.firebaseConfig.authDomain,env.FIREBASE_PROJECT_ID+'.firebaseapp.com');
 assert.equal('googleClientId' in data,false);
 assert.equal('emailEnabled' in data,false);
});
test('missing Firebase project, web key, app ID or MongoDB disables sign-in',async()=>{
 for(const key of ['FIREBASE_PROJECT_ID','FIREBASE_WEB_API_KEY','FIREBASE_APP_ID','MONGODB_URI']){
  const data=await config({...env,[key]:''});
  assert.equal(data.authReady,false,key);
  assert.equal(data.firebaseConfig,null);
 }
});
test('old Google client and RESEND variables alone cannot enable auth',async()=>{
 const data=await config({GOOGLE_CLIENT_ID:'old',AUTH_SECRET:'z'.repeat(32),RESEND_API_KEY:'old',AUTH_FROM_EMAIL:'x@example.com',MONGODB_URI:'mongodb://local'});
 assert.equal(data.authReady,false);
});

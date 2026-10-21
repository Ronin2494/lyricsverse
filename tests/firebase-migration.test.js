import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { firebaseConfigured,publicFirebaseConfig,verifyFirebaseIdToken,firebaseSignIn } from '../api/src/firebase-auth.mjs';
import { validFirebaseConfig,describeFirebaseError } from '../src/firebase-client.js';
import { lyricverseFirebaseConfig } from '../src/firebase-config.js';
import { createHandler } from '../api/src/handler.mjs';
const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const fb=readFileSync(new URL('../src/firebase-client.js',import.meta.url),'utf8');
const backend=readFileSync(new URL('../api/src/firebase-auth.mjs',import.meta.url),'utf8');
const env={AUTH_SECRET:'x'.repeat(40),MONGODB_URI:'mongodb://localhost:27017/dblyrics',FIREBASE_PROJECT_ID:'lyricsverse-302a4',FIREBASE_WEB_API_KEY:lyricverseFirebaseConfig.apiKey,FIREBASE_APP_ID:lyricverseFirebaseConfig.appId,FIREBASE_AUTH_DOMAIN:lyricverseFirebaseConfig.authDomain,FIREBASE_MEASUREMENT_ID:lyricverseFirebaseConfig.measurementId};
test('provided Firebase project settings are initialized consistently, including analytics',()=>{
 assert.equal(lyricverseFirebaseConfig.projectId,'lyricsverse-302a4');
 assert.equal(lyricverseFirebaseConfig.authDomain,'lyricsverse-302a4.firebaseapp.com');
 assert.equal(lyricverseFirebaseConfig.measurementId,'G-T67MRBC937');
 assert.ok(validFirebaseConfig(lyricverseFirebaseConfig));
 assert.equal(firebaseConfigured(env),true);
 const exposed=publicFirebaseConfig(env);
 assert.equal(exposed.authReady,true);
 assert.equal(exposed.firebaseConfig.measurementId,lyricverseFirebaseConfig.measurementId);
 assert.equal(exposed.firebaseConfig.apiKey,lyricverseFirebaseConfig.apiKey);
 assert.match(fb,/firebase-analytics\.js/);
 assert.match(fb,/analyticsSDK\.isSupported/);
 assert.match(fb,/analyticsSDK\.getAnalytics\(app\)/);
 assert.match(fb,/appSDK\.initializeApp\(config,'lyricsverse'\)/);
});
test('Firebase backend enforces Mongo session secret and project settings',()=>{
 for(const key of ['AUTH_SECRET','MONGODB_URI','FIREBASE_PROJECT_ID','FIREBASE_WEB_API_KEY','FIREBASE_APP_ID'])
   assert.equal(firebaseConfigured({...env,[key]:''}),false,key);
 assert.equal(publicFirebaseConfig({...env,FIREBASE_PROJECT_ID:'other-project'}).firebaseConfig.projectId,'other-project');
});
test('new Firebase UI replaces legacy email OTP and Google ID widgets',()=>{
 assert.match(src,/firebase-auth-form/);
 assert.match(src,/data-action="firebase-google"/);
 assert.match(src,/firebase-create/);
 assert.match(src,/firebase-login/);
 assert.match(src,/firebase-refresh/);
 assert.match(src,/data-action="logout"/);
 assert.doesNotMatch(src,/id="google-signin"|id="auth-form"|google\.accounts\.id|email\/verify/);
 assert.match(src,/firebaseUser\.emailVerified/);
 assert.match(src,/state\.saved=authUser\.savedSongs\|\|\[\]/);
 assert.match(fb,/sendEmailVerification\(created\.user\)/);
 assert.match(fb,/signInWithPopup/);
});
test('Firebase token verifier rejects wrong shape or forged JWT before fetching certs',async()=>{
 await assert.rejects(()=>verifyFirebaseIdToken('bad',env),/invalid_firebase_token/);
 let calls=0;
 const fake={fetcher:async()=>{calls++;throw Error('unexpected download');},now:()=>1760000000000};
 const head=Buffer.from(JSON.stringify({alg:'none',kid:'bad'})).toString('base64url');
 const claims=Buffer.from(JSON.stringify({iss:'wrong',aud:'bad'})).toString('base64url');
 await assert.rejects(()=>verifyFirebaseIdToken(head+'.'+claims+'.aa',env,fake),/invalid_firebase_token/);
 assert.equal(calls,0);
 assert.match(backend,/createVerify\('RSA-SHA256'\)/);
 assert.match(backend,/securetoken\.google\.com/);
});
test('Firebase session bridge reuses existing Mongo user profile on matching verified email',async()=>{
 const calls=[];
 const existing={_id:{toString:()=> '507f1f77bcf86cd799439011'},email:'listener@example.com',name:'Existing User',savedSongs:['track1']};
 const users={
  createIndex:async()=>{},
  findOne:async()=>existing,
  updateOne:async(query,update)=>{calls.push({query,update});existing.firebaseUid=update.$set.firebaseUid;}
 };
 const sessions={
  createIndex:async()=>{},
  insertOne:async(row)=>{calls.push({session:row});}
 };
 const db={collection:name=>name==='users'?users:sessions};
 const session=await firebaseSignIn('arbitrary-token',env,{
  verify:async()=>({uid:'firebase-uid-123',email:'listener@example.com',name:'New Account'}),
  dbFactory:async()=>db,now:()=>1760000000000
 });
 assert.equal(session.user.name,'Existing User');
 assert.equal(session.user.email,'listener@example.com');
 assert.ok(typeof session.token==='string');
 assert.equal(existing.firebaseUid,'firebase-uid-123');
 assert.deepEqual(existing.savedSongs,['track1']);
 assert.equal(calls.length,2);
 await assert.rejects(()=>firebaseSignIn('token',env,{
   verify:async()=>({uid:'other-firebase-user',email:'listener@example.com'}),
   dbFactory:async()=>db
 }),/firebase_account_conflict/);
});
test('public endpoint exposes only Firebase web config and retires old auth API',async()=>{
 const server=createServer(createHandler({env}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const options={headers:{Origin:'https://lyricsverse.onrender.com'}};
  const config=await fetch(base+'/api/v1/auth/config',options);
  assert.equal(config.status,200);
  const body=(await config.json()).data;
  assert.equal(body.firebaseConfig.projectId,'lyricsverse-302a4');
  assert.equal('googleClientId' in body,false);
  assert.equal('emailEnabled' in body,false);
  assert.equal(JSON.stringify(body).includes(env.AUTH_SECRET),false);
  const old=await fetch(base+'/api/v1/auth/email/request',{method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:'{}'});
  assert.equal(old.status,404);
  const invalid=await fetch(base+'/api/v1/auth/firebase/session',{method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:JSON.stringify({idToken:'invalid'})});
  assert.equal(invalid.status,401);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('Firebase SDK errors provide a user-friendly message',()=>{
 assert.match(describeFirebaseError({code:'auth/unauthorized-domain'}),/temporarily unavailable/);
 assert.match(describeFirebaseError({code:'auth/popup-blocked'}),/pop-ups/);
});

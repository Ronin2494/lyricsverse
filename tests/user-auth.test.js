import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const api=readFileSync(new URL('../api/src/handler.mjs',import.meta.url),'utf8');
const fb=readFileSync(new URL('../api/src/firebase-auth.mjs',import.meta.url),'utf8');
test('Firebase web and server auth modules parse successfully',()=>{
 for(const file of ['../src/app.js','../src/firebase-client.js','../api/src/firebase-auth.mjs','../api/src/handler.mjs'])
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',new URL(file,import.meta.url).pathname]));
});
test('public pages remain accessible and profile uses Firebase',()=>{
 assert.match(app,/if\(route\.page==='profile'&&!authUser\)/);
 assert.match(app,/authConfigChecked=true;render\(\)/);
 assert.match(app,/function authHTML\(\)/);
 assert.match(app,/firebase-auth-form/);
 assert.match(app,/data-action="firebase-google"/);
 assert.doesNotMatch(app,/id="auth-form"|id="google-signin"|google\.accounts\.id/);
});
test('legacy email OTP and Google tokeninfo routes no longer authenticate',()=>{
 assert.match(api,/api\/v1\/auth\/firebase\/session/);
 assert.doesNotMatch(api,/api\/v1\/auth\/email\/request|api\/v1\/auth\/email\/verify/);
 assert.doesNotMatch(api,/googleSignIn|verifyEmailOtp|requestEmailOtp/);
 assert.match(fb,/createSession\(db,user,env,now\)/);
 assert.match(fb,/firebaseUid/);
});
test('mobile profile opens Firebase sign-in, not a placeholder',()=>{
 assert.match(app,/if\(!authUser\)return.*authHTML/);
 assert.match(app,/route\.page==='profile'\?profileHTML\(\)/);
 assert.match(app,/action==='sign-in'\)\{e\.preventDefault\(\);location\.hash='#\/profile'/);
 assert.match(app,/safeStorageRemove\('sessionStorage','lyricverse:session'\)/);
});
test('Firebase account verification keeps profile and favorites',()=>{
 assert.match(app,/firebaseUser\.emailVerified/);
 assert.match(app,/syncFirebaseUser\(firebaseUser,error\)/);
 assert.match(app,/state\.saved=authUser\.savedSongs\|\|\[\]/);
 assert.match(app,/data-action="logout"/);
 assert.match(app,/runFirebaseAction/);
});

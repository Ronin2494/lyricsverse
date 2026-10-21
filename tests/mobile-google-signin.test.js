import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const client=readFileSync(new URL('../src/firebase-client.js',import.meta.url),'utf8');
test('mobile profile renders Firebase sign-in without Google Identity Services',()=>{
 assert.match(app,/if\(!authUser\)return.*authHTML/);
 assert.match(app,/data-action="firebase-google"/);
 assert.match(app,/firebase-auth-form/);
 assert.doesNotMatch(app,/google\.accounts\.id|accounts\.google\.com\/gsi/);
});
test('Firebase Google button supports popup authentication with actionable error recovery',()=>{
 assert.match(client,/signInWithPopup\(auth,new authSDK\.GoogleAuthProvider\(\)\)/);
 assert.match(client,/auth\/popup-blocked/);
 assert.match(client,/auth\/unauthorized-domain/);
 assert.match(app,/authError=describeFirebaseError\(error\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describeFirebaseError} from '../src/firebase-client.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const input=c=>describeFirebaseError({code:c});
test('incorrect credential codes give same safe, actionable response',()=>{
 const codes=['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-login-credentials'];
 for(const code of codes){assert.match(input(code),/Incorrect email or password/);assert.match(input(code),/reset your password/);}
});
test('email, account, rate limiting and network errors are meaningful',()=>{
 const cases={
  'auth/invalid-email':/valid email address/,
  'auth/email-already-in-use':/already uses this email/,
  'auth/weak-password':/stronger password/,
  'auth/too-many-requests':/Too many sign-in attempts/,
  'auth/user-disabled':/account has been disabled/,
  'auth/network-request-failed':/Check your internet/,
  'auth/popup-blocked':/Allow pop-ups/,
  'auth/unauthorized-domain':/temporarily unavailable/,
  'auth/operation-not-allowed':/currently unavailable/,
  'auth/account-exists-with-different-credential':/another sign-in method/
 };
 for(const [code,pattern] of Object.entries(cases))assert.match(input(code),pattern);
});
test('unknown errors do not leak provider names, credentials, or internal error codes',()=>{
 for(const action of ['signin','signup','reset','google']){
  const message=describeFirebaseError({code:'auth/new-internal-problem',message:'private details'},action);
  assert.doesNotMatch(message,/firebase|private details|auth\/new/i);
  assert.match(message,/try again|Check your details/i);
 }
});
test('login UX keeps email without saving or echoing password',()=>{
 assert.match(app,/let authEmailDraft=''/);
 assert.match(app,/authEmailDraft=email/);
 assert.match(app,/value="'\+esc\(authEmailDraft\)\+'/);
 assert.match(app,/describeFirebaseError\(error,action===/);
 assert.match(app,/We could not finish signing you in/);
 assert.doesNotMatch(app,/Continue with Firebase Authentication to save/);
 assert.doesNotMatch(app,/Firebase sign-in could not be completed/);
 assert.match(app,/if\(authSubmitting\)return/);
 assert.match(app,/showFirebaseFormError\(form,address.message,'email'\)/);
 assert.match(app,/JSON.stringify\(\{idToken\}\)/);
});

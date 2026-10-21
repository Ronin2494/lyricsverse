import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
  validateAuthenticationSubmission,validateLoginCredentials,
  validateSignupCredentials,validateEmailAddress,
  MIN_SIGNIN_PASSWORD_LENGTH,MIN_SIGNUP_PASSWORD_LENGTH,
  PASSWORD_RESET_CONFIRMATION,generateSecurePassword
} from '../src/password-security.js';
import {describeFirebaseError} from '../src/firebase-client.js';
import {webcrypto} from 'node:crypto';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const index=app.indexOf('function authHTML(){'),end=app.indexOf('function profileHTML(){',index);
assert.ok(index>=0&&end>index,'auth screen must exist');
const code=app.slice(index,end);
function page(mode){
 const ctx={authMode:mode,authReady:true,authConfig:{projectId:'test'},
  authStatus:'',authConfigError:'',authError:'',authEmailDraft:'',
  esc:v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;')};
 vm.createContext(ctx);
 vm.runInContext(code+'\nthis.rendered = authHTML();',ctx);
 return ctx.rendered;
}
function credentials(mode,email,password,confirmation){
 return validateAuthenticationSubmission({mode,email,password,confirmation});
}
const good='Qh9!Rz4%akT7mP20';

test('SIGN-IN PASSWORD: exact lower boundary 0,1,5,6,7,11,12',()=>{
 assert.equal(MIN_SIGNIN_PASSWORD_LENGTH,6);
 for(const len of [0,1,2,3,4,5]){
  const result=credentials('signin','test@example.com','x'.repeat(len));
  assert.equal(result.valid,false,'length '+len);
  assert.equal(result.field,'password');
  assert.match(result.message,len===0?/Enter your password/:/at least 6 characters/);
 }
 for(const len of [6,7,11,12]){
  const result=credentials('signin','test@example.com','x'.repeat(len));
  assert.equal(result.valid,true,'length '+len);
 }
});
test('SIGN-IN: boundary at 256 / 257, whitespace-only and preexisting weak passwords',()=>{
 assert.equal(validateLoginCredentials('test@example.com','a'.repeat(256)).valid,true);
 assert.match(validateLoginCredentials('test@example.com','a'.repeat(257)).message,/256/);
 assert.equal(validateLoginCredentials('test@example.com','      ').valid,false);
 assert.equal(validateLoginCredentials('test@example.com','123456').valid,true,'old Firebase password allowed');
});
test('SIGN-UP PASSWORD: 6 and 11 fail; 12+ strength required and confirmation must match',()=>{
 assert.equal(MIN_SIGNUP_PASSWORD_LENGTH,12);
 for(const len of [0,5,6,11]){
  const value='Xy3!'+('a'.repeat(Math.max(0,len-4)));
  assert.equal(credentials('signup','test@example.com',value,value).valid,false,'length '+len);
 }
 assert.equal(credentials('signup','test@example.com',good,good).valid,true);
 assert.equal(credentials('signup','test@example.com',good,good+'!').field,'confirm');
 assert.equal(credentials('signup','test@example.com','password123456','password123456').valid,false);
 assert.equal(validateSignupCredentials('test@example.com','a'.repeat(129),'a'.repeat(129)).valid,false);
});
test('EMAIL: empty, missing @, malformed domain, spaces, and valid tagged addresses',()=>{
 const invalid=['','missing-at.example.com','@example.com','user@','user@domain','user@domain..com','us er@example.com'];
 for(const value of invalid){
  assert.equal(credentials('signin',value,'123456').field,'email',value);
  assert.equal(credentials('reset',value).field,'email',value);
 }
 assert.equal(validateEmailAddress(' example+music@domain.co.uk ').email,'example+music@domain.co.uk');
});
test('RESET: requires valid email, never requires or transmits a password',()=>{
 assert.equal(credentials('reset','user@example.com','','').valid,true);
 assert.equal(credentials('reset','user@example.com').email,'user@example.com');
 assert.match(PASSWORD_RESET_CONFIRMATION,/If an account exists/);
 assert.doesNotMatch(PASSWORD_RESET_CONFIRMATION,/Firebase/);
});
test('FORM: login visibly explains six-character minimum and inline errors',()=>{
 const html=page('signin');
 assert.match(html,/Password must be at least 6 characters/);
 assert.match(html,/minlength="6"/);
 assert.match(html,/placeholder="At least 6 characters"/);
 assert.match(html,/id="firebase-form-error" role="alert" aria-live="assertive"/);
 assert.match(html,/data-action="firebase-reset"/);
 assert.match(html,/Forgot password\?/);
 assert.match(html,/data-action="firebase-google"/);
 assert.doesNotMatch(html,/id="firebase-confirm-password"/);
});
test('FORM: signup shows 12-character rule, strength, confirmation, generator',()=>{
 const html=page('signup');
 assert.match(html,/New passwords must be at least 12 characters/);
 assert.match(html,/minlength="12"/);
 assert.match(html,/id="firebase-password-strength"/);
 assert.match(html,/id="firebase-confirm-password"/);
 assert.match(html,/data-action="firebase-generate-password"/);
 assert.doesNotMatch(html,/data-action="firebase-reset"/);
});
test('FORM: password reset is a dedicated accessible email-only form',()=>{
 const html=page('reset');
 assert.match(html,/RESET YOUR PASSWORD/);
 assert.match(html,/id="firebase-auth-form" novalidate/);
 assert.match(html,/type="email"/);
 assert.match(html,/Send reset instructions/);
 assert.match(html,/Back to sign in/);
 assert.doesNotMatch(html,/id="firebase-password"/);
 assert.doesNotMatch(html,/data-action="firebase-google"/);
});
test('SUBMIT: zero-to-five characters block Firebase without a network request',()=>{
 assert.match(app,/validateAuthenticationSubmission\(\{mode:authMode,email,password,confirmation\}\)/);
 assert.match(app,/if\(!result\.valid\)\{showFirebaseFormError\(form,result\.message/);
 assert.match(app,/if\(authSubmitting\)return/);
 assert.match(app,/submit\.disabled=true/);
 assert.match(app,/submit\.textContent='Please wait…'/);
 assert.match(app,/try\{await runFirebaseAction\(/);
 assert.match(app,/finally\{if\(submit\.isConnected\)/);
});
test('RESET RESPONSE: does not reveal whether a given email has an account',()=>{
 assert.match(app,/PASSWORD_RESET_CONFIRMATION/);
 assert.match(app,/action==='firebase-reset'&&\['auth\/user-not-found'/);
 assert.doesNotMatch(app,/window\.prompt\('Enter your account email address'\)/);
});
test('FIREBASE: incorrect credentials, disabled user, too many requests, network fail',()=>{
 const expected={
  'auth/invalid-credential':/Incorrect email or password/,
  'auth/wrong-password':/Incorrect email or password/,
  'auth/user-not-found':/Incorrect email or password/,
  'auth/user-disabled':/disabled/,
  'auth/too-many-requests':/Too many/,
  'auth/network-request-failed':/Check your internet/,
  'auth/email-already-in-use':/already uses this email/
 };
 for(const [key,match] of Object.entries(expected))assert.match(describeFirebaseError({code:key}),match);
});
test('PASSWORD GENERATOR: secure output can register and excludes Math.random',()=>{
 const password=generateSecurePassword({cryptoImpl:webcrypto});
 assert.equal(password.length,20);
 assert.equal(credentials('signup','test@example.com',password,password).valid,true);
 const module=readFileSync(new URL('../src/password-security.js',import.meta.url),'utf8');
 assert.doesNotMatch(module,/Math\.random\(/);
});
test('CSS: inline errors and password rules remain visible on small screens',()=>{
 assert.match(css,/\.lv-firebase-auth \.lv-password-rule/);
 assert.match(css,/\.lv-firebase-auth \.lv-form-error:not\(:empty\)/);
 assert.match(css,/@media\(max-width:650px\)/);
});
test('SECURITY: own backend receives signed identity token, never password',()=>{
 assert.match(app,/JSON\.stringify\(\{idToken\}\)/);
 assert.doesNotMatch(app,/JSON\.stringify\(\{email,password\}\)/);
});

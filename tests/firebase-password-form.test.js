import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateEmailAddress,checkPasswordStrength,validateSignupCredentials,generateSecurePassword} from '../src/password-security.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('email validator rejects malformed addresses and normalizes whitespace',()=>{
 for(const invalid of ['','not an email','no@domain','@example.com','a@b.','a..b@example.com','a@-domain.com','a@domain..com','x'.repeat(65)+'@example.com','john doe@example.com']){
   assert.equal(validateEmailAddress(invalid).valid,false,invalid);
 }
 assert.deepEqual(validateEmailAddress(' alice@example.com '),{valid:true,email:'alice@example.com'});
 assert.deepEqual(validateEmailAddress('p.a+tag@example.co.uk'),{valid:true,email:'p.a+tag@example.co.uk'});
});

test('new passwords enforce strength without breaking existing-user sign-in',()=>{
 for(const value of ['short','123456789012','password123456','aaaaaaaaaaaaa','qwerty1234567890']){
  assert.equal(checkPasswordStrength(value,'alice@example.com').valid,false,value);
 }
 assert.equal(checkPasswordStrength('AliceSecureKey2026!','alice@example.com').valid,false,'Email-based password');
 assert.equal(checkPasswordStrength('Rb8!m_4Z%q2D=K7w').valid,true);
 assert.equal(checkPasswordStrength('frosted river cactus sunrise silent', 'a@example.com').valid,true);
 assert.equal(checkPasswordStrength('x'.repeat(129)).valid,false);
});
test('sign up validates email, password, and confirmation separately',()=>{
 assert.equal(validateSignupCredentials('broken','Rb8!m_4Z%q2D=K7w','Rb8!m_4Z%q2D=K7w').field,'email');
 assert.equal(validateSignupCredentials('alice@example.com','weak','weak').field,'password');
 assert.equal(validateSignupCredentials('alice@example.com','Rb8!m_4Z%q2D=K7w','different').field,'confirm');
 assert.equal(validateSignupCredentials('alice@example.com','Rb8!m_4Z%q2D=K7w','Rb8!m_4Z%q2D=K7w').valid,true);
});
test('generated passwords use Web Crypto and include 4 character groups',()=>{
 const seen=new Set();
 for(let i=0;i<60;i++){
  const value=generateSecurePassword({cryptoImpl:webcrypto});
  assert.equal(value.length,20);
  assert.match(value,/[a-z]/);
  assert.match(value,/[A-Z]/);
  assert.match(value,/[0-9]/);
  assert.match(value,/[^a-zA-Z0-9]/);
  assert.equal(checkPasswordStrength(value).valid,true);
  seen.add(value);
 }
 assert.equal(seen.size,60);
 assert.throws(()=>generateSecurePassword({length:6,cryptoImpl:webcrypto}),/invalid_password_length/);
 assert.throws(()=>generateSecurePassword({cryptoImpl:{}}),/Secure password generation is unavailable/);
});
test('form uses client validation, inline feedback and no password POST to our backend',()=>{
 assert.match(app,/id="firebase-auth-form" novalidate/);
 assert.match(app,/name="confirmPassword"/);
 assert.match(app,/data-action="firebase-generate-password"/);
 assert.match(app,/data-action="firebase-toggle-password"/);
 assert.match(app,/id="firebase-password-strength"/);
 assert.match(app,/validateSignupCredentials\(email,password,confirm\)/);
 assert.match(app,/if\(authSubmitting\)return/);
 assert.match(app,/submit\.disabled=true/);
 assert.match(app,/showFirebaseFormError\(form/);
 assert.match(app,/authMode==='signup'\?'firebase-create':'firebase-login'/);
 assert.match(css,/\.lv-password-meter/);
 assert.match(css,/\.lv-form-error/);
 assert.match(app,/JSON\.stringify\(\{idToken\}\)/);
 assert.doesNotMatch(app,/JSON\.stringify\(\{password\}\)/);
});

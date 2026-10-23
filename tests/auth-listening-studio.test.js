import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/app.js');
const css=read('styles.css');
const beginning=app.indexOf('function authHTML(){');
const ending=app.indexOf('function profileHTML(){',beginning);
assert.ok(beginning>=0&&ending>beginning,'Auth screen must be present');
const authFunction=app.slice(beginning,ending);

function markup(mode,{configured=true,email='',error=''}={}){
 const ctx={
  authMode:mode,authReady:configured,authConfig:configured?{projectId:'test'}:null,
  authConfigError:'',authStatus:'',authError:error,authEmailDraft:email,
  esc:value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')
 };
 vm.createContext(ctx);
 vm.runInContext(authFunction+'\nthis.html = authHTML()',ctx);
 return ctx.html;
}
test('account entry wraps a working Firebase form inside asymmetrical studio composition',()=>{
 const html=markup('signin');
 assert.match(html,/class="auth-gate auth-gate--studio auth-gate--quiet"/);
 assert.match(html,/class="lv-auth-workspace"/);
 assert.match(html,/class="auth-panel lv-firebase-auth"/);
 assert.match(html,/id="firebase-auth-form" novalidate/);
 assert.match(html,/data-action="firebase-google"/);
 assert.match(html,/class="lv-auth-studio"/);
 assert.match(html,/aria-labelledby="lv-auth-studio-title"/);
 assert.match(html,/class="lv-auth-studio-scene" aria-hidden="true"/);
 assert.match(html,/class="lv-auth-studio-bento"/);
 assert.match(html,/href="#\/search"/);
 assert.match(html,/Explore music without signing in/);
 assert.ok(html.indexOf('id="firebase-auth-form"')<html.indexOf('class="lv-auth-studio"'), 'keyboard reaches sign-in before decoration');
});
test('quiet studio keeps the approved music aesthetic without redundant cards',()=>{
 const html=markup('signin');
 assert.match(html,/class="auth-gate auth-gate--studio auth-gate--quiet"/);
 assert.match(html,/class="lv-auth-studio-vinyl"/);
 assert.match(html,/class="lv-auth-studio-discover" href="#\/search"/);
 assert.doesNotMatch(html,/lv-auth-studio-bento|lv-auth-studio-tile/);
 assert.match(css,/\.auth-gate--quiet \.lv-auth-studio\{[\s\S]*?min-height:0/);
 assert.match(css,/@media\(max-width:790px\)\{[\s\S]*?\.auth-gate--quiet \.lv-auth-studio\{display:none/);
});
test('signup, signin, and reset retain distinct accessible controls and validation',()=>{
 const signin=markup('signin');
 assert.match(signin,/Welcome back/);
 assert.match(signin,/Password must be at least 6 characters/);
 assert.match(signin,/minlength="6"/);
 assert.match(signin,/data-action="firebase-reset"/);
 const signup=markup('signup');
 assert.match(signup,/Make your music yours/);
 assert.match(signup,/New passwords must be at least 12 characters/);
 assert.match(signup,/minlength="12"/);
 assert.match(signup,/id="firebase-confirm-password"/);
 assert.match(signup,/data-action="firebase-generate-password"/);
 const reset=markup('reset');
 assert.match(reset,/Reset your password/);
 assert.match(reset,/Send reset instructions/);
 assert.doesNotMatch(reset,/id="firebase-password"/);
 assert.doesNotMatch(reset,/data-action="firebase-google"/);
 assert.match(reset,/class="lv-auth-studio"/);
});
test('unavailable auth displays a helpful message but still provides song exploration',()=>{
 const html=markup('signin',{configured:false});
 assert.match(html,/Sign-in is temporarily unavailable/);
 assert.doesNotMatch(html,/id="firebase-auth-form"/);
 assert.match(html,/href="#\/search"/);
});
test('displayed user email and error content remain escaped',()=>{
 const html=markup('signin',{email:'<script>alert("email")</script>',error:'<img src=x onerror=bad()>'});
 assert.doesNotMatch(html,/<script>alert/);
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;img src=x/);
});
test('studio is responsive, keeps form first and respects keyboard, touch and reduced motion',()=>{
 assert.match(css,/@media \(max-width: 1100px\)/);
 assert.match(css,/@media \(max-width: 790px\)/);
 assert.match(css,/\.lv-firebase-auth \{ order: 0; \}/);
 assert.match(css,/\.lv-auth-studio \{ order: 1; min-height: 0; \}/);
 assert.match(css,/@media \(max-width: 510px\)/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/\.lv-auth-studio-tile-feature:focus-visible/);
 assert.match(css,/\.lv-auth-explore:focus-visible/);
 assert.match(css,/\.lv-auth-studio-scene \{[\s\S]*?pointer-events: none/);
});
test('Firebase and song discovery routing remain untouched',()=>{
 assert.match(app,/async function syncFirebaseUser\(firebaseUser,error\)/);
 assert.match(app,/function updateFirebaseStrength\(form\)/);
 assert.match(app,/validateAuthenticationSubmission\(\{mode:authMode,email,password,confirmation\}\)/);
 assert.match(app,/JSON\.stringify\(\{idToken\}\)/);
 assert.match(app,/function searchPageHTML\(\)/);
 assert.match(app,/function originalReaderHTMLForSong\(song\)/);
 assert.match(app,/function videoResultsHTML\(\)/);
 assert.match(app,/function libraryHTML\(\)/);
});

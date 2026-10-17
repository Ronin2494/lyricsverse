import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('mobile Profile route has Google sign-in container',()=>{
 assert.match(app,/function profileHTML\(\)/);
 assert.match(app,/if\(!authUser\)return .*authHTML\(\)/);
 assert.match(app,/id=\\"google-signin\\"/);
 assert.match(app,/route\.page==='profile'&&!authUser/);
});
test('Google sign-in uses container-aware sizing and supports retry',()=>{
 assert.match(app,/target\.getBoundingClientRect\(\)\.width/);
 assert.match(app,/googleScriptPromise=null;throw error/);
 assert.match(app,/data-action=\\"retry-google\\"/);
 assert.match(app,/action==='retry-google'/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
test('every route main landmark supports skip navigation',()=>{
 const html=read('index.html'),app=read('src/app.js');
 assert.match(html,/class="skip-link" href="#app-main"/);
 assert.match(app,/<main id="app-main" tabindex="-1"/);
 assert.doesNotMatch(app,/<main class=/);
});
test('skip link stays keyboard visible and mobile content cannot overflow',()=>{
 const css=read('styles.css');
 assert.match(css,/\.skip-link:focus-visible\{transform:translateY\(0\)/);
 assert.match(css,/#app-main :is\(input,select,textarea\)\{max-width:100%\}/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

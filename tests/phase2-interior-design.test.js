import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const admin=readFileSync(new URL('../admin.html',import.meta.url),'utf8');
test('phase 2 interior routes retain design hooks',()=>{
 for(const hook of ['neon-search-page','neon-library','neon-profile','neon-reader','neon-original-reader'])assert.ok(app.includes(hook),hook);
});
test('phase 2 discovery and empty-library actions are wired',()=>{
 assert.match(app,/data-discover-genre/);
 assert.match(app,/closest\('\[data-discover-genre\]'\)/);
 assert.match(app,/interior-empty-state/);
 assert.match(app,/href="#\/search"/);
});
test('phase 2 responsive and reduced-motion styles are present',()=>{
 for(const hook of ['interior-profile-stats','interior-reader-kicker','interior-discovery-start','interior-empty-state','neon-original-layout'])assert.ok(css.includes('.'+hook),hook);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('admin studio preserves forms and rights controls',()=>{
 assert.match(admin,/id="lyrics-form"/);
 assert.match(admin,/id="rightsConfirmed"/);
 assert.match(admin,/id="phase2-admin-design"/);
});

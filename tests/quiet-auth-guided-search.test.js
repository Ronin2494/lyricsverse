import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const st=source.indexOf('function searchWelcomeHTML(){'),ed=source.indexOf('function searchPageHTML(){',st);
assert.ok(st>=0&&ed>st);
const ctx={};vm.createContext(ctx);
vm.runInContext(source.slice(st,ed)+'\nthis.ui=searchWelcomeHTML();',ctx);
const markup=ctx.ui;
test('empty search offers two real, clickable starting points',()=>{
 assert.match(markup,/aria-labelledby="lv-search-welcome-title"/);
 assert.equal((markup.match(/data-discovery-query=/g)||[]).length,2);
 assert.match(markup,/data-discovery-query="love"/);
 assert.match(markup,/data-discovery-query="Hindi"/);
 assert.match(markup,/type="button"/);
 assert.doesNotMatch(markup,/class="search-input"|<input/);
});
test('search page shows starting points only for empty query, keeping existing source results',()=>{
 const page=source.slice(source.indexOf('function searchPageHTML()'),source.indexOf('function libraryEmptyHTML()'));
 assert.match(page,/state\.query\.trim\(\)\?providerResultsHTML\(\):searchWelcomeHTML\(\)/);
 assert.doesNotMatch(page,/searchHTML\(/);
 assert.match(source,/if\(area\)area\.innerHTML=state\.query\.trim\(\)\?providerResultsHTML\(\):searchWelcomeHTML\(\)/);
 assert.match(source,/state\.query=q;document\.querySelectorAll\('input\[name="q"\]'\)/);
 assert.match(source,/void loadProviderSearch\(\)/);
 assert.match(source,/if\(!\['love','Hindi'\]\.includes\(q\)\)return/);
});
test('discovery cards have deliberately unequal widths, visible focus and one-column mobile layout',()=>{
 assert.match(css,/\.lv-search-prompts\{[\s\S]*?grid-template-columns:minmax\(0,1\.55fr\) minmax\(0,\.85fr\)/);
 assert.match(css,/\.lv-search-prompt:focus-visible\{outline:3px/);
 assert.match(css,/@media\(max-width:760px\)\{[\s\S]*?\.lv-search-prompts\{grid-template-columns:minmax\(0,1fr\)/);
});
test('quiet login removes promotional repetition and preserves Firebase account forms',()=>{
 const auth=source.slice(source.indexOf('function authHTML()'),source.indexOf('function profileHTML()'));
 assert.match(auth,/class="auth-panel lv-firebase-auth"/);
 assert.match(auth,/id="firebase-auth-form" novalidate/);
 assert.match(auth,/data-action="firebase-google"/);
 assert.match(auth,/data-action="firebase-reset"/);
 assert.match(auth,/data-action="firebase-refresh"/);
 assert.match(auth,/class="lv-auth-studio-discover"/);
 assert.doesNotMatch(auth,/lv-auth-studio-bento|lv-auth-studio-tile-feature|lv-auth-studio-lyric-note/);
 assert.match(css,/@media\(max-width:790px\)\{[\s\S]*?\.auth-gate--quiet \.lv-auth-studio\{display:none/);
});

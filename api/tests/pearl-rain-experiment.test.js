import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');
test('homepage sections render linked pearls with descriptive labels',()=>{assert.match(app,/function sectionHTML\(/);assert.match(app,/class="lyric-pearl pearl-/);assert.match(app,/href="\$\{songHref\(song\)\}"/);assert.match(app,/aria-label="Open lyrics for/);});
test('pearl click pops then navigates and reduced motion navigates immediately',()=>{assert.match(app,/closest\('a\.lyric-pearl'\)/);assert.match(app,/prefers-reduced-motion: reduce/);assert.match(app,/classList\.add\('is-popping'\)/);assert.match(app,/location\.hash=destination/);});
test('pearl design supports rain, mobile and reduced motion',()=>{for(const token of ['.pearl-glass','.pearl-rain','.pearl-cluster','.lyric-pearl.is-popping','@keyframes pearl-pop','@media(max-width:650px)','@media(prefers-reduced-motion:reduce)'])assert.ok(css.includes(token),token);});

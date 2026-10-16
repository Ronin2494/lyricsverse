import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');
test('homepage sections render linked beans with descriptive labels',()=>{assert.match(app,/function sectionHTML\(/);assert.match(app,/class="lyric-bean bean-/);assert.match(app,/href="\$\{songHref\(song\)\}"/);assert.match(app,/aria-label="Open lyrics for/);});
test('bean click cracks then navigates and reduced motion navigates immediately',()=>{assert.match(app,/closest\('a\.lyric-bean'\)/);assert.match(app,/prefers-reduced-motion: reduce/);assert.match(app,/classList\.add\('is-cracking'\)/);assert.match(app,/location\.hash=destination/);});
test('bean design supports rain, mobile and reduced motion',()=>{for(const token of ['.bean-glass','.bean-rain','.bean-cluster','.lyric-bean.is-cracking','@keyframes bean-crack','@media(max-width:650px)','@media(prefers-reduced-motion:reduce)'])assert.ok(css.includes(token),token);});

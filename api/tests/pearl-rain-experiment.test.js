import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');
test('old song cards and saved-heart controls remain in homepage sections',()=>{assert.match(app,/function sectionHTML\(/);assert.match(app,/class="song-grid"/);assert.match(app,/songCardHTML\(song\)/);assert.match(app,/favorite-heart/);});
test('featured carousel replaces ambient pearls without changing existing homepage sections',()=>{assert.match(app,/function floatingPearlsHTML\(songs\)/);assert.match(app,/songs\.slice\(0,4\)/);assert.match(app,/\$\{floatingPearlsHTML\(matching\)\}/);assert.match(app,/class="song-banner-section"/);assert.match(app,/aria-roledescription="carousel"/);assert.match(app,/href="\$\{songHref\(song\)\}"/);assert.doesNotMatch(app,/class="lyric-pearl ambient-pearl/);});
test('rain is transparent, cool-toned and reduced-motion safe',()=>{assert.match(css,/\.ambient-rain\{/);assert.match(css,/radial-gradient\(ellipse 2px 5px/);assert.match(css,/\.homepage-v2 \.ambient-pearls\{[^}]*background:transparent/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);});
test('click pop navigates to existing reader',()=>{assert.match(app,/closest\('a\.lyric-pearl'\)/);assert.match(app,/location\.hash=destination/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');

test('song grids and saved-heart controls remain in homepage sections',()=>{
 assert.match(app,/function sectionHTML\(/);
 assert.match(app,/class="song-grid"/);
 assert.match(app,/songCardHTML\(song\)/);
 assert.match(app,/favorite-heart/);
});

test('compact spotlight replaces the old orb layout without changing adjacent sections',()=>{
 const home=app.slice(app.indexOf('function homeHTML()'),app.indexOf('function songMetaBanner'));
 assert.match(home,/\$\{moodsHTML\(\)\}\$\{featuredSongBannersHTML\(matching\)\}/);
 assert.match(home,/\$\{mixedSongsHTML\(\)\}/);
 assert.match(home,/New & noteworthy/);
 assert.doesNotMatch(home,/floatingPearlsHTML/);
 assert.match(app,/data-banner-track/);
 assert.match(app,/data-banner-slide/);
 assert.match(app,/class="song-banner-link" href="\$\{songHref\(song\)\}"/);
});

test('banner controls and mobile dimensions replace animated rain and floating pearls',()=>{
 assert.match(css,/\.featured-song-carousel \.song-banner-track/);
 assert.match(css,/scroll-snap-type:x mandatory/);
 assert.match(css,/\.featured-song-carousel \.song-banner-link/);
 assert.match(css,/\.featured-song-carousel \.song-banner \{[\s\S]*?min-height:172px/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

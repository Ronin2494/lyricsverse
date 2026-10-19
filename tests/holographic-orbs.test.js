import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const slider=readFileSync(new URL('../src/song-banner-slider.js',import.meta.url),'utf8');

test('featured banners preserve accessible song links and titles',()=>{
 assert.match(app,/function featuredSongBannersHTML/);
 assert.match(app,/role="region" aria-roledescription="carousel"/);
 assert.match(app,/aria-roledescription="slide"/);
 assert.match(app,/aria-label="Open \$\{esc\(song.title\)\} by \$\{esc\(song.artist\)\}"/);
 assert.match(app,/href="\$\{songHref\(song\)\}"/);
});

test('carousel remains usable without motion or external 3D libraries',()=>{
 assert.match(slider,/prefers-reduced-motion: reduce/);
 assert.match(slider,/data-banner-dot/);
 assert.match(slider,/data-banner-step/);
 assert.match(slider,/ArrowRight/);
 assert.match(slider,/stopSongBannerSlider/);
 assert.doesNotMatch(app,/mountMusicOrbs/);
 assert.match(css,/scroll-snap-type:x mandatory/);
});

test('single banner spans full track width and supports touch swipes',()=>{
 assert.match(css,/\.featured-song-carousel \.song-banner \{/);
 assert.match(css,/flex:0 0 100%/);
 assert.match(css,/overscroll-behavior-x:contain/);
 assert.match(css,/-webkit-overflow-scrolling:touch/);
});

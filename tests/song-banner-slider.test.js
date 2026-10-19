import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('homepage replaces holographic song orbs with a featured-song carousel', () => {
  const app = source('src/app.js');
  assert.match(app, /function floatingPearlsHTML\(songs\)/);
  assert.match(app, /class="song-banner-section"/);
  assert.match(app, /aria-roledescription="carousel"/);
  assert.match(app, /class="song-banner-slide"/);
  assert.match(app, /href="\$\{songHref\(song\)\}"/);
  assert.match(app, /class="song-banner-link"/);
  assert.doesNotMatch(app, /class="ambient-pearls holographic-orbs"/);
  assert.doesNotMatch(app, /mountMusicOrbs\(/);
});

test('carousel supports swipe, arrows, accessible labels and position indicators', () => {
  const app = source('src/app.js');
  const css = source('styles.css');
  assert.match(app, /data-banner-step="-1"/);
  assert.match(app, /data-banner-step="1"/);
  assert.match(app, /data-banner-index="\$\{i\}"/);
  assert.match(app, /aria-current/);
  assert.match(app, /scrollTo\(/);
  assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(css, /-webkit-overflow-scrolling: touch/);
});

test('mobile carousel has compact cards and respects reduced motion', () => {
  const css = source('styles.css');
  assert.match(css, /@media \(max-width: 650px\)/);
  assert.match(css, /\.song-banner-slide/);
  assert.match(css, /\.song-banner-link/);
  assert.match(css, /\.song-banner-art/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

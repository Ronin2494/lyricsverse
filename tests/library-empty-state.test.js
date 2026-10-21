import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('src/app.js');
const css = read('styles.css');

const start = source.indexOf('function libraryEmptyHTML()');
const end = source.indexOf('function authHTML()', start);
assert.ok(start >= 0 && end > start, 'library view implementation must be present');
const code = source.slice(start, end);

const uploaded = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Demo Uploaded', artist: 'Demo Artist',
  status: 'published', accessTier: 'free', lyrics: 'Available lyrics'
};
const catalog = { id: 'catalog-track', title: 'Catalog Track', artist: 'Catalog Artist' };

function library({ signedIn = false, saved = [], uploadedSongs = [], songs = [catalog] } = {}) {
  let sectionCalls = 0;
  const scope = {
    publishedSongs: uploadedSongs, allSongs: songs, authUser: signedIn ? {id:'user'} : null,
    state: { saved }, encodeURIComponent,
    songHref: song => '#/lyrics/' + encodeURIComponent(song.id),
    navHTML: () => '<nav>Navigation</nav>',
    bottomNavHTML: () => '<footer>Bottom navigation</footer>',
    sectionHTML: (title, matches) => {
      sectionCalls++;
      return '<section class="saved-song-results">' + title + ':' + matches.length + '</section>';
    }
  };
  vm.createContext(scope);
  vm.runInContext(code + '\nthis.libraryPage = libraryHTML;', scope);
  return { html: scope.libraryPage(), sectionCalls };
}

test('a visitor sees a meaningful empty state with a working sign-in CTA', () => {
  const { html, sectionCalls } = library();
  assert.match(html, /class="lv-library-empty"/);
  assert.match(html, /Every great playlist starts somewhere/);
  assert.match(html, /href="#\/profile">Sign in to save songs/);
  assert.match(html, /href="#\/lyrics\/catalog-track">Explore a song/);
  assert.match(html, /aria-labelledby="lv-library-empty-title"/);
  assert.doesNotMatch(html, /saved-song-results/);
  assert.equal(sectionCalls, 0);
});

test('a signed-in listener gets a discovery CTA without a fake saved-song listing', () => {
  const { html, sectionCalls } = library({ signedIn: true });
  assert.match(html, /A collection worth coming back to/);
  assert.match(html, /href="#\/search">Discover songs/);
  assert.match(html, /Find a song · tap ♡ · see it here/);
  assert.doesNotMatch(html, /href="#\/profile">Sign in/);
  assert.equal(sectionCalls, 0);
});

test('a genuinely published lyrics page is preferred as the sample internal link', () => {
  const { html } = library({ uploadedSongs: [uploaded] });
  assert.match(html, /href="#\/original\/507f1f77bcf86cd799439011">Explore a song/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('unpublished, premium or missing lyrics are not promoted as reader destinations', () => {
  for (const invalid of [
    { ...uploaded, status: 'draft' },
    { ...uploaded, accessTier: 'premium' },
    { ...uploaded, lyrics: '' },
    { ...uploaded, _id: '<script>' }
  ]) {
    const { html } = library({ uploadedSongs: [invalid] });
    assert.match(html, /href="#\/lyrics\/catalog-track">Explore a song/);
    assert.doesNotMatch(html, /href="#\/original\//);
  }
});

test('a populated library retains the normal functional saved-song grid', () => {
  const { html, sectionCalls } = library({ signedIn: true, saved: ['catalog-track'] });
  assert.match(html, /class="saved-song-results">Saved songs:1/);
  assert.doesNotMatch(html, /class="lv-library-empty"/);
  assert.equal(sectionCalls, 1);
});

test('the vinyl bento is decorative, mobile-safe and honors reduced motion', () => {
  assert.match(css, /\.lv-library-empty \{/);
  assert.match(css, /\.lv-library-empty-stage/);
  assert.match(css, /\.lv-library-empty-record/);
  assert.match(css, /@media \(max-width: 650px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.lv-library-empty-stage[\s\S]*?pointer-events: none/);
  assert.match(source, /function floatingPearlsHTML\(songs\)/);
  assert.match(source, /href="\$\{songHref\(song\)\}"/);
  assert.match(source, /function originalReaderHTMLForSong\(song\)/);
});

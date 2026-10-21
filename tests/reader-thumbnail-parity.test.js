import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { readerArtworkSources, nextReaderArtworkSource, isReaderArtworkUrl } from '../src/reader-artwork.js';
import { catalogMatch } from '../src/internal-links.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const app = read('src/app.js');
const colors = ['#132d5b', '#6956ba', '#9fc9e9'];
const catalog = [{
 id: 'patient-zero', title: 'Patient Zero', artist: 'Taylor Swift', cover: colors,
 thumbnailUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'
}];
const published = {
 _id:'6ad675ab8839cd3caef8dd1e', title:'Patient Zero',
 artist:'Taylor Swift', status:'published', accessTier:'free', lyrics:'A line',
 thumbnailUrl: 'https://people.com/artist-photo.webp'
};
const svg = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E';

test('published lyrics pages use explicit uploaded artwork first, then matching featured catalog art',()=>{
 const result=readerArtworkSources(published,{catalog,generatedArtwork:svg});
 assert.equal(result.primary,published.thumbnailUrl);
 assert.equal(result.sources[1],catalog[0].thumbnailUrl);
 assert.equal(result.fallback,svg);
 assert.equal(result.matchId,'patient-zero');
 assert.equal(result.sources.length,3);
});

test('missing uploaded URL inherits the existing discovery image instead of a music-note placeholder',()=>{
 const result=readerArtworkSources({...published,thumbnailUrl:null},{catalog,generatedArtwork:svg});
 assert.equal(result.primary,catalog[0].thumbnailUrl);
 assert.equal(result.fallback,svg);
});

test('previously uploaded compositions without catalog matches still get real album art from the cache',()=>{
 const original={_id:'6acd41e958e2ba38aa365f9e',title:'mylyrics',artist:'Deepak Sharma'};
 const cache=new Map([[original._id,'https://is1-ssl.mzstatic.com/image/thumb/example/300x300bb.jpg']]);
 const matched=readerArtworkSources(original,{catalog,cache,generatedArtwork:svg});
 assert.equal(matched.primary,cache.get(original._id));
 assert.equal(matched.fallback,svg);
 assert.equal(matched.matchId,null);
});

test('any original without an available image gets a generated SVG album cover',()=>{
 const result=readerArtworkSources({title:'Life Goes On',artist:'Baggh-E SMG'},{catalog,generatedArtwork:svg});
 assert.equal(result.primary,svg);
 assert.deepEqual(result.sources,[svg]);
});

test('untrusted or malformed URLs are never installed as image src',()=>{
 for(const invalid of ['javascript:alert(1)','http://insecure.example/img.png','data:text/html,<svg>', 'https://example.com/a" onerror="alert(1)', 'x'.repeat(3001)]){
  assert.equal(isReaderArtworkUrl(invalid),false);
 }
 assert.equal(isReaderArtworkUrl('https://people.com/thmb/example.jpg?width=600&height=400'),true);
});

test('the same remote image failure automatically advances through gallery art to generated SVG',()=>{
 const urls=readerArtworkSources(published,{catalog,generatedArtwork:svg}).sources;
 const img={src:urls[0],dataset:{artworkNext:JSON.stringify(urls.slice(1))}};
 assert.equal(nextReaderArtworkSource(img),true);
 assert.equal(img.src,catalog[0].thumbnailUrl);
 assert.equal(nextReaderArtworkSource(img),true);
 assert.equal(img.src,svg);
 assert.equal(nextReaderArtworkSource(img),false);
 assert.equal(Object.hasOwn(img.dataset,'artworkNext'),false);
});

test('bad fallback data is safely discarded without infinite retries',()=>{
 const img={src:'https://bad.example/broken.webp',dataset:{artworkNext:'[1,2,'}};
 assert.equal(nextReaderArtworkSource(img),false);
 assert.equal(img.src,'https://bad.example/broken.webp');
 assert.equal(Object.hasOwn(img.dataset,'artworkNext'),false);
});

test('thumbnail helper renders catalog image with an encoded fallback chain and alt metadata',()=>{
 const start=app.indexOf('function thumbnailHTML(song,cls)');
 const end=app.indexOf('function originalCompositionsHTML()',start);
 assert.ok(start>=0&&end>start);
 const helper=app.slice(start,end);
 const scope={
  catalogMatch,
  readerArtworkSources,
  allSongs:catalog,
  artworkCache:new Map(),
  generatedSongThumbnail:()=>svg,
  esc:value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
 };
 vm.createContext(scope);
 vm.runInContext(helper+'\nthis.art=thumbnailHTML;',scope);
 const html=scope.art(published,'original-reader-image');
 assert.match(html,/class="original-reader-image"/);
 assert.match(html,/src="https:\/\/people.com\/artist-photo.webp"/);
 assert.match(html,/data-artwork-next=/);
 assert.match(html,/pexels\.com/);
 assert.match(html,/data:image\/svg\+xml/);
 assert.doesNotMatch(html,/original-thumbnail-fallback/);
 const originalHTML=scope.art({title:'mylyrics',artist:'Deepak Sharma'},'original-reader-image');
 assert.match(originalHTML,/src="data:image\/svg\+xml/);
 assert.doesNotMatch(originalHTML,/<span/);
});

test('uploaded song reader, floater, and chart reader preserve the approved artwork layout',()=>{
 assert.match(app,/import \{ readerArtworkSources, nextReaderArtworkSource \} from '\.\/reader-artwork\.js'/);
 assert.match(app,/function originalReaderHTMLForSong\(song\)/);
 assert.match(app,/thumbnailHTML\(song,"original-reader-image"\)/);
 assert.match(app,/thumbnailHTML\(song,"original-floater-icon"\)/);
 assert.match(app,/function songMetaBanner\(song\)/);
 assert.match(app,/coverHTML\(song,'reader-art'\)/);
 assert.match(app,/onerror|addEventListener\('error'/);
 assert.match(app,/nextReaderArtworkSource\(img\)/);
 assert.match(app,/if\(publishedSongs.length\)void enrichArtwork\(publishedSongs/);
 assert.match(app,/artworkCache\.set\(artworkKey,url\)/);
 assert.match(app,/function floatingPearlsHTML\(songs\)/);
 assert.match(app,/href="\$\{songHref\(song\)\}"/);
 const css=read('styles.css');
 assert.match(css,/\.neon-original-cover img\{width:100%;height:auto;display:block;aspect-ratio:1;object-fit:cover\}/);
});

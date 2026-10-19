import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publishedMatch, catalogMatch, internalSongLink, localSongMatches } from '../src/internal-links.js';

const uploaded={
  _id:'6acd41e958e2ba38aa365f9e',title:'Patient Zero',
  artist:'Taylor Swift',status:'published',accessTier:'free',lyrics:'Example uploaded lyrics'
};
const chart={id:'patient-zero',title:'Patient Zero',artist:'Taylor Swift',genre:'Pop'};
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('existing uploaded lyrics override duplicate Trending and Featured song records',()=>{
  assert.equal(publishedMatch(chart,[uploaded]),uploaded);
  assert.equal(internalSongLink(chart,{published:[uploaded],catalog:[chart]}).href,'#/original/6acd41e958e2ba38aa365f9e');
  assert.equal(internalSongLink(chart,{published:[uploaded],catalog:[chart]}).type,'lyrics');
  assert.equal(localSongMatches('Patient Zero',{published:[uploaded],catalog:[chart]}).length,1);
  assert.equal(localSongMatches('Patient Zero',{published:[uploaded],catalog:[chart]})[0].type,'lyrics');
});

test('published-song matching is conservative and does not join different artists or drafts',()=>{
  assert.equal(publishedMatch({...chart,artist:'Another Artist'},[uploaded]),null);
  assert.equal(publishedMatch(chart,[{...uploaded,status:'draft'}]),null);
  assert.equal(publishedMatch(chart,[{...uploaded,lyrics:''}]),null);
  assert.equal(publishedMatch(chart,[{...uploaded,accessTier:'premium'}]),null);
  assert.equal(publishedMatch(chart,[{...uploaded,_id:'invalid'}]),null);
});

test('unmatched uploaded songs still reach internal song details, rather than external pages',()=>{
  assert.equal(catalogMatch(chart,[chart]),chart);
  assert.equal(internalSongLink(chart,{published:[],catalog:[chart]}).href,'#/lyrics/patient-zero');
  assert.equal(internalSongLink({title:'Other',artist:'Someone'},{published:[],catalog:[chart]}),null);
});

test('all song discovery surfaces consume shared resolver with the clean existing design',()=>{
  const app=read('src/app.js');
  assert.match(app,/import \{ internalSongLink, localSongMatches, publishedMatch \} from '\.\/internal-links\.js'/);
  assert.match(app,/const songHref = song => internalSongLink/);
  assert.match(app,/function floatingPearlsHTML\(songs\)/);
  assert.match(app,/function songCardHTML\(song\)/);
  assert.match(app,/function providerResultsHTML\(\)/);
  assert.match(app,/localSongMatches\(q,\{published:publishedSongs,catalog:allSongs\}\)/);
  assert.match(app,/const uploaded=publishedMatch\(song,publishedSongs\)/);
  assert.match(app,/\/api\/v1\/catalog\/songs\?limit=100/);
  assert.match(app,/ensureOriginalSong\(route\.slug\)/);
  assert.match(app,/originalReaderHTMLForSong\(song\)/);
});

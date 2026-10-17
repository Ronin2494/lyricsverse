import test from 'node:test';
import assert from 'node:assert/strict';
import { keyFor, uniqueSongs, getChart, findLyrics, importSongs } from '../scripts/import-top-songs.mjs';

test('Unicode normalization and duplicate markets', () => {
  assert.equal(keyFor('  HÉLLO! ','  A  '), keyFor('hÉllo','a'));
  const rows = uniqueSongs([{title:'Song',artist:'Artist',market:'in',ranking:3},{title:'SONG',artist:'Artist',market:'us',ranking:1}]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].markets,['in','us']);
  assert.equal(rows[0].ranking,1);
});
test('chart feed parsing', async () => {
  const rows = await getChart('in',async () => ({ok:true,json:async () => ({feed:{results:[{id:'1',name:'Test',artistName:'Singer',url:'https://music.apple.com/test'}]}})}));
  assert.equal(rows[0].artist,'Singer');
});
test('lyrics lookup stores reference and not full lyrics', async () => {
  const result = await findLyrics({title:'Test',artist:'Singer'},async () => ({ok:true,json:async () => ({id:123,plainLyrics:'example'})}));
  assert.equal(result.providerId,123);
  assert.equal('plainLyrics' in result,false);
});
test('import never sets lyrics on existing records', async () => {
  const writes = [];
  const db = {collection: () => ({createIndex:async () => {},updateOne:async (...args) => {writes.push(args);return {upsertedCount:0};}})};
  const fetcher = async url => ({ok:true,json:async () => url.includes('apple.com')?{feed:{results:[{name:'One',artistName:'Two',id:'1'}]}}:{id:99,plainLyrics:'not stored'}});
  const result = await importSongs({db,fetcher,markets:['in'],limit:10,pauseMs:0});
  assert.equal(result.updated,1);
  assert.equal(writes[0][1].$set.lyrics,undefined);
  assert.equal(writes[0][1].$setOnInsert.lyrics,null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('search page does not render Wikidata metadata-only cards',()=>{
 const start=src.indexOf('function searchPageHTML()');
 const end=src.indexOf('\nfunction libraryHTML()',start);
 assert.ok(start>=0&&end>start);
 const page=src.slice(start,end);
 assert.ok(page.includes('providerResultsHTML()'));
 assert.ok(!page.includes('realSongCard'));
 assert.ok(!page.includes('Lyrics not yet licensed'));
});

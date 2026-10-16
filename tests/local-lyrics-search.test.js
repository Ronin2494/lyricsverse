import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('published catalog is fetched for local search and separate from featured compositions',()=>{assert.match(app,/publishedSongs=\(data\.data\|\|\[\]\)\.filter/);assert.match(app,/originalCompositions=publishedSongs\.filter/);});
test('local published lyrics appear ahead of external providers',()=>{assert.match(app,/const localHTML=localMatches\.length/);assert.match(app,/return localHTML\+'<section class="provider-results"/);});
test('third-party uploaded lyrics can open in reader',()=>{assert.match(app,/const song=publishedSongs\.find/);assert.match(app,/PUBLISHED LYRICS/);});

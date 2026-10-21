import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const marker='/* Asymmetric discovery desk';
const split=css.indexOf(marker);
assert.ok(split>=0,'asymmetric grid rules are present');
const layout=css.slice(split);
const search=js.slice(js.indexOf('function providerResultsHTML()'),js.indexOf('function searchPageHTML()'));

test('published LyricVerse results retain their own full-width row',()=>{
 assert.match(layout,/\.neon-search-content > \.local-lyrics-results \{\s*grid-column: 1 \/ -1/);
 assert.match(search,/return localHTML\+'<section class="provider-results"/);
});

test('external sources and YouTube results occupy distinct asymmetrical columns',()=>{
 assert.match(layout,/grid-template-columns: minmax\(250px, \.82fr\) minmax\(0, 1\.55fr\)/);
 assert.match(layout,/\.neon-search-content > \.provider-results \{[\s\S]*?grid-column: 1/);
 assert.match(layout,/\.neon-search-content > \.lv-video-section \{[\s\S]*?grid-column: 2/);
 assert.match(search,/videoResultsHTML\(\)/);
});

test('source cards are naturally sized, not forced into a uniform-height grid',()=>{
 assert.match(layout,/\.provider-results \.compact-lyrics-grid \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(layout,/\.provider-results \.compact-lyric-card \{[\s\S]*?height: auto/);
 assert.match(layout,/grid-auto-rows: auto/);
 assert.match(layout,/overflow-wrap: anywhere/);
});

test('video tiles have unequal widths and feature a full-row third result',()=>{
 assert.match(layout,/\.lv-video-grid \{[\s\S]*?grid-template-columns: minmax\(0, 1\.16fr\) minmax\(0, \.84fr\)/);
 assert.match(layout,/\.lv-video-card:nth-child\(3n \+ 3\) \{[\s\S]*?grid-column: 1 \/ -1/);
 assert.match(layout,/\.lv-video-card:nth-child\(3n \+ 3\) > \.lv-video-embed \{[\s\S]*?grid-row: 3/);
});

test('tablet and phone layouts reflow without clipping or equalizing card heights',()=>{
 assert.match(layout,/@media \(max-width: 1080px\)/);
 assert.match(layout,/@media \(max-width: 760px\)/);
 assert.match(layout,/@media \(max-width: 510px\)/);
 assert.match(layout,/grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(layout,/min-width: 0/);
 assert.doesNotMatch(layout,/grid-auto-rows:\s*1fr|grid-template-rows:\s*repeat\([^)]*,\s*1fr\)/);
});

test('click-to-play, YouTube links and external source actions remain unchanged',()=>{
 assert.match(search,/data-lrclib-id/);
 assert.match(search,/Find lyrics ↗/);
 assert.match(js,/data-video-search-id/);
 assert.match(js,/youtube-nocookie\.com\/embed\//);
 assert.match(js,/href="https:\/\/www\.youtube\.com\/watch\?v=/);
});

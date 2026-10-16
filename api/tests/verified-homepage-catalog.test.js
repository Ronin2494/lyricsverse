import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');
test('homepage fetches verified metadata through existing Wikidata endpoint',()=>{assert.match(app,/void loadRealCatalog\(\)/);assert.match(app,/api\/v1\/wikidata\/songs\?language=/);assert.match(app,/function verifiedCatalogHTML\(\)/);assert.match(app,/\$\{verifiedCatalogHTML\(\)\}/);});
test('only usable records are shown and no third-party lyrics are implied licensed',()=>{assert.match(app,/song\.artist!==\x27Artist not listed\x27/);assert.match(app,/song\.lyricsStatus===\x27unavailable\x27/);assert.match(app,/Lyrics require separate permissions/);assert.match(app,/realCatalog\.filter\(/);});
test('verified cards have image fallback and responsive columns',()=>{assert.match(app,/realSongCard\(s\)/);assert.match(app,/data-fallback=/);assert.match(css,/\.homepage-v2 \.verified-catalog \.compact-lyrics-grid\{display:grid/);assert.match(css,/@media\(max-width:520px\)/);});

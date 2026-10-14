import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');
test('song cover uses matched artwork with generated fallback',()=>{const cover=app.slice(app.indexOf('function coverHTML('),app.indexOf('function songCardHTML('));assert.match(cover,/artworkCache\.get\(song\.id\)/);assert.match(cover,/generatedSongThumbnail\(song\)/);assert.match(cover,/class=\\?"song-cover-thumbnail/);assert.match(cover,/loading=\\?"lazy/);assert.match(cover,/onerror=/);});
test('artwork matching checks song title and artist',()=>{assert.match(app,/itunes\.apple\.com\/search/);assert.match(app,/normalized\(x\.trackName\)===normalized\(song\.title\)/);assert.match(app,/normalized\(x\.artistName\)===normalized\(song\.artist\)/);});
test('cover styling maintains image dimensions',()=>{assert.match(css,/\.cover-art \.song-cover-thumbnail\{display:block;width:100%;height:100%;object-fit:cover/);});

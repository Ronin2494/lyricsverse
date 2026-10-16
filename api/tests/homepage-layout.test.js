import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../../styles.css',import.meta.url),'utf8');
test('homepage keeps genre filters independent from full-width song sections',()=>{const home=app.slice(app.indexOf('function homeHTML()'),app.indexOf('function songMetaBanner'));assert.match(home,/class="neon-genre-strip"/);assert.match(home,/\$\{availableMobileGenres\(\)\.map\(chipHTML\)\.join\(''\)\}/);assert.match(home,/\$\{sectionHTML\('Trending now'/);assert.match(home,/\$\{floatingPearlsHTML\(matching\)\}/);assert.match(home,/\$\{mixedSongsHTML\(\)\}/);assert.match(home,/\$\{sectionHTML\('New & noteworthy'/);});
test('responsive song sections use a full-width grid',()=>{assert.match(css,/\.homepage-v2 \.home-song-sections\{display:grid/);assert.match(css,/\.homepage-v2 \.home-song-sections \.song-grid\{display:grid/);assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);});
test('profile displays actual saved song cards',()=>{const profile=app.slice(app.indexOf('function profileHTML()'),app.indexOf('async function authCall'));assert.match(profile,/Saved Songs/);assert.match(profile,/state\.saved\.includes\(song\.id\)/);assert.match(profile,/songCardHTML\(song\)/);});

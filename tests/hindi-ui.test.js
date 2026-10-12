import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const js=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
test('Home and search have language controls with accessible pressed states',()=>{assert.match(js,/data-language/);assert.match(js,/aria-pressed/);assert.match(js,/lyrics-language-bar/);assert.match(js,/search-language-bar/);});
test('Devanagari typography and non-clipped mobile lyric lines are specified',()=>{assert.match(css,/Noto Sans Devanagari/);assert.match(css,/lyrics-panel\[lang="hi"\] \.lyric-line/);assert.match(css,/white-space:normal/);});

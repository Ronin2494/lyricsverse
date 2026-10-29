import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const between=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)+a.length));

test('LRCLIB results do not promise unreadable lyrics',()=>{
 const search=between('function providerResultsHTML(){','function searchWelcomeHTML(){');
 assert.match(search,/Lyrics not published here/);
 assert.doesNotMatch(search,/Read source lyrics/);
 assert.doesNotMatch(search,/data-lrclib-id/);
 assert.match(search,/return localHTML\+webHTML\+/);
 assert.match(search,/No matching lyrics published on LyricVerse yet/);
});
test('footer removes demo claims and misleading links',()=>{
 const footer=between('function footerHTML(){','function infoHTML(){');
 assert.doesNotMatch(footer,/Demo song metadata|data-scroll-to|Watch NPR Music/);
 assert.match(footer,/github\.com\/Ronin2494\/lyricsverse/);
 assert.match(footer,/Lyrics are displayed only where publication rights permit/);
});
test('contact provides verified outbound routes rather than placeholder',()=>{
 const info=between('function infoHTML(){','function homeHTML(){');
 assert.doesNotMatch(info,/Contact details for LyricVerse will appear/);
 assert.match(info,/https:\/\/badbunny\.work/);
 assert.match(info,/github\.com\/Ronin2494\/lyricsverse/);
});
test('ratings distinguish no visitor rating from no ratings at all',()=>{
 const rating=between('function ratingHTML(){','function compactLyricCard(song)');
 assert.match(rating,/ratingSummary\.count\?'Rate your experience':'Be the first to rate'/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app = readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../styles.css',import.meta.url),'utf8');
test('homepage hero makes lyrics intent clear, has a manual pause and actions',()=>{
 for(const phrase of ['Find the words.', 'Feel the music.', 'Find the lyrics you love.', 'pause-rotation', 'Explore lyrics', 'Find your mood']) assert.ok(app.includes(phrase),phrase);
 assert.ok(css.includes('height:520px'), 'larger hero');
});
test('lyrics preview constrained to 2 x 2 grid with four items maximum',()=>{
 assert.ok(app.includes('songs.slice(0,4)'));
 assert.match(css, /\.compact-lyrics-grid\s*\{[^}]*grid-template-columns:repeat\(2/);
});
test('ratings collect actual local feedback rather than inventing review counts',()=>{
 assert.ok(app.includes('lyricverse:user-rating'));
 assert.ok(app.includes('Give your first impression'));
 assert.ok(app.includes('Be the first to rate'));
 assert.equal(app.includes('4.9 out of 5'),false);
});
test('real published videos and useful links appear in sidebar',()=>{
 for(const id of ['y38qQRg3UDI','4iQmPv_dTI0'])assert.ok(app.includes(id));
 for(const selector of ['homepage-sidebar','quick-links','video-row','moods-section','how-section','site-footer','footer-social'])assert.ok(app.includes(selector),selector);
});
test('mobile layout stacks sidebar, displays lyrics in two columns and respects reduced motion',()=>{
 assert.ok(css.includes('.homepage-sidebar{display:flex'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});

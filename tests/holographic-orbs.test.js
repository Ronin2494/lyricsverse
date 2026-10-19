import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/music-orbs.js',import.meta.url),'utf8');
test('featured banner replaces old holographic orbs while keeping accessible song links',()=>{assert.match(app,/function floatingPearlsHTML/);assert.match(app,/class="song-banner-slide"/);assert.match(app,/aria-label="View lyrics for/);assert.match(app,/href="\$\{songHref\(song\)\}"/);assert.doesNotMatch(app,/holographic-orb-link/);assert.doesNotMatch(app,/mountMusicOrbs\(/);});
test('3D scene degrades safely with reduced motion and unavailable WebGL',()=>{assert.match(scene,/prefers-reduced-motion: reduce/);assert.match(scene,/orb-webgl-unavailable/);assert.match(scene,/disposeCurrent\(\)/);assert.match(css,/orb-webgl-unavailable/);});
test('3D orbs use one shared canvas and adaptive pixel ratio',()=>{assert.match(scene,/new THREE.WebGLRenderer/);assert.match(scene,/Math.min\(window.devicePixelRatio/);assert.match(scene,/ResizeObserver/);});

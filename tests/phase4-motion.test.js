import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountMotion, stopMotion, prefersMotion, tiltForPointer } from '../src/motion.js';

const read = file => readFileSync(new URL('../'+file, import.meta.url), 'utf8');

function classList() {
 const classes = new Set();
 return { add: (...values) => values.forEach(v => classes.add(v)),
  remove: (...values) => values.forEach(v => classes.delete(v)),
  contains: value => classes.has(value) };
}

test('card depth follows pointer and clamps out-of-bounds movement', () => {
 const rect = {left:10, top:20, width:200, height:100};
 assert.deepEqual(tiltForPointer(rect,110,70),{x:0,y:0});
 assert.deepEqual(tiltForPointer(rect,210,20),{x:4,y:4});
 assert.deepEqual(tiltForPointer(rect,-999,999),{x:-4,y:-4});
 assert.deepEqual(tiltForPointer({width:0,height:0},10,10),{x:0,y:0});
});

test('reduced-motion preferences disable the whole enhancement', () => {
 const win = {matchMedia: () => ({matches:true,addEventListener(){},removeEventListener(){}})};
 const root = {classList:classList()};
 assert.equal(prefersMotion(win),false);
 mountMotion(root,{win,doc:{}});
 assert.equal(root.classList.contains('motion-enabled'),false);
 stopMotion();
 assert.equal(prefersMotion({matchMedia:()=>({matches:false})}),true);
});

test('scroll reveal progressively upgrades and removes its observers', () => {
 let observer;
 let disconnected=false;
 const section={classList:classList()};
 const root={
  classList:classList(),
  querySelectorAll: () => [section],
  querySelector: () => null
 };
 const win={
  matchMedia: query => ({matches:false,addEventListener(){},removeEventListener(){}}),
  IntersectionObserver: class {
   constructor(callback){this.callback=callback;observer=this;}
   observe(target){this.target=target;}
   unobserve(target){this.unobserved=target;}
   disconnect(){disconnected=true;}
  }
 };
 mountMotion(root,{win,doc:{}});
 assert.equal(root.classList.contains('motion-enabled'),true);
 assert.equal(section.classList.contains('motion-reveal'),true);
 observer.callback([{isIntersecting:true,target:section}]);
 assert.equal(section.classList.contains('is-visible'),true);
 assert.equal(observer.unobserved,section);
 stopMotion();
 assert.equal(disconnected,true);
 assert.equal(section.classList.contains('motion-reveal'),false);
 assert.equal(root.classList.contains('motion-enabled'),false);
});

test('SPA wiring, CSS fallbacks and build include phase 4 motion', () => {
 const app=read('src/app.js');
 const css=read('styles.css');
 const build=read('scripts/build.mjs');
 assert.match(app,/import \{ mountMotion \} from '\.\/motion\.js'/);
 assert.match(app,/mountMotion\(app\)/);
 assert.match(app,/document\.startViewTransition\(update\)/);
 assert.match(app,/prefers-reduced-motion: reduce/);
 assert.match(css,/@media \(prefers-reduced-motion: no-preference\)/);
 assert.match(css,/\.motion-enabled \.motion-reveal/);
 assert.match(css,/\.reading-progress/);
 assert.match(css,/::view-transition-new\(root\)/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(build,/recursive: true/);
});

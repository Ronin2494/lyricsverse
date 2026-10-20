import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { starlightPoints, pointerLight, mountCinematic } from '../src/cinematic.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function classes() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    toggle(value, enabled) { if (enabled) values.add(value); else values.delete(value); },
    contains(value) { return values.has(value); }
  };
}
function element() {
  const children = [];
  const styles = new Map();
  const attributes = new Map();
  return {
    children, attributes, styles, classList: classes(),
    style: {
      setProperty(name, value) { styles.set(name, value); },
      removeProperty(name) { styles.delete(name); }
    },
    appendChild(node) { children.push(node); },
    prepend(node) { children.unshift(node); },
    remove() { this.removed = true; },
    setAttribute(name, value) { attributes.set(name, value); }
  };
}

test('Portfolio-inspired starlight is deterministic, bounded and decorative', () => {
  const first = starlightPoints(28);
  const repeated = starlightPoints(28);
  assert.deepEqual(first, repeated);
  assert.equal(first.length, 28);
  assert.equal(starlightPoints(1000).length, 40);
  assert.equal(starlightPoints(-20).length, 0);
  assert.notDeepEqual(first, starlightPoints(28, 6620));
  assert.ok(first.every(point =>
    Number(point.x) >= 8 && Number(point.x) <= 93 &&
    Number(point.y) >= 5 && Number(point.y) <= 95));
});

test('pointer illumination stays inside card bounds and centers on invalid rects', () => {
  const bounds = { left: 20, top: 30, width: 200, height: 100 };
  assert.deepEqual(pointerLight(bounds, 120, 80), { x: 50, y: 50 });
  assert.deepEqual(pointerLight(bounds, 9999, -500), { x: 100, y: 0 });
  assert.deepEqual(pointerLight(null, 0, 0), { x: 50, y: 50 });
  assert.deepEqual(pointerLight({ width: 0, height: 3 }, 2, 2), { x: 50, y: 50 });
});

test('hero creates low-cost star nodes and pauses them on hidden/offscreen states', () => {
  const hero = element();
  const cosmos = element();
  hero.querySelector = selector => selector === '.neon-hero-cosmos' ? cosmos : null;
  const root = element();
  root.querySelector = selector => selector === '.neon-hero' ? hero : null;
  const listeners = new Map();
  const doc = {
    hidden: false, createElement: () => element(),
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name) { listeners.delete(name); }
  };
  let observer, disconnected = false;
  const win = {
    matchMedia: () => ({ matches: false }),
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe(target) { assert.equal(target, hero); }
      disconnect() { disconnected = true; }
    }
  };
  const cleanup = mountCinematic(root, { win, doc });
  assert.equal(root.classList.contains('lv-cinematic'), true);
  assert.equal(cosmos.children.length, 1);
  assert.equal(cosmos.children[0].children.length, 28);
  assert.equal(cosmos.children[0].attributes.get('aria-hidden'), 'true');
  assert.equal(cosmos.children[0].classList.contains('lv-stardust-playing'), true);
  doc.hidden = true;
  listeners.get('visibilitychange')();
  assert.equal(cosmos.children[0].classList.contains('lv-stardust-playing'), false);
  doc.hidden = false;
  observer.callback([{ isIntersecting: false }]);
  assert.equal(cosmos.children[0].classList.contains('lv-stardust-playing'), false);
  observer.callback([{ isIntersecting: true }]);
  assert.equal(cosmos.children[0].classList.contains('lv-stardust-playing'), true);
  cleanup();
  assert.equal(disconnected, true);
  assert.equal(root.classList.contains('lv-cinematic'), false);
  assert.equal(cosmos.children[0].removed, true);
  assert.equal(listeners.size, 0);
});

test('reduced motion and mobile get static, smaller, pointer-free visuals', () => {
  const hero = element();
  const cosmos = element();
  hero.querySelector = () => cosmos;
  const root = element();
  root.querySelector = () => hero;
  let pointerHandlers = 0;
  root.addEventListener = () => { pointerHandlers++; };
  const doc = { createElement: () => element() };
  const win = {
    matchMedia: q => ({ matches: q.includes('prefers-reduced-motion') || q.includes('max-width') })
  };
  const cleanup = mountCinematic(root, { win, doc });
  assert.equal(cosmos.children[0].children.length, 17);
  assert.equal(cosmos.children[0].classList.contains('lv-stardust-playing'), false);
  assert.equal(pointerHandlers, 0);
  cleanup();
});

test('fine-pointer light is cleaned up with no interference to clicks or links', () => {
  const root = element(), card = element();
  root.querySelector = () => null;
  root.contains = node => node === card;
  const events = new Map();
  root.addEventListener = (name, cb) => events.set(name, cb);
  root.removeEventListener = name => events.delete(name);
  card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  let pending;
  const win = {
    matchMedia: query => ({ matches: query.includes('hover: hover') }),
    requestAnimationFrame: cb => { pending = cb; return 1; },
    cancelAnimationFrame() { pending = null; }
  };
  const cleanup = mountCinematic(root, { win, doc: {} });
  events.get('pointermove')({
    target: { closest: () => card },
    clientX: 90, clientY: 20
  });
  pending();
  assert.equal(card.styles.get('--lv-light-x'), '90%');
  assert.equal(card.styles.get('--lv-light-y'), '20%');
  assert.equal(card.classList.contains('lv-light-follow'), true);
  cleanup();
  assert.equal(card.styles.has('--lv-light-x'), false);
  assert.equal(card.classList.contains('lv-light-follow'), false);
  assert.equal(events.size, 0);
});

test('motion controller mounts cinematic layer; layout and lyrics links remain untouched', () => {
  const motion = read('src/motion.js');
  const css = read('styles.css');
  const app = read('src/app.js');
  assert.match(motion, /import \{ mountCinematic \} from '\.\/cinematic\.js'/);
  assert.match(motion, /cleanups\.push\(mountCinematic\(root, \{ win, doc \}\)\)/);
  assert.match(css, /\.lv-cinematic \.lv-stardust-point/);
  assert.match(css, /pointer-events: none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 767px\), \(pointer: coarse\)/);
  assert.match(app, /function floatingPearlsHTML\(songs\)/);
  assert.match(app, /href="\$\{songHref\(song\)\}"/);
  assert.match(app, /function originalReaderHTMLForSong\(song\)/);
  assert.doesNotMatch(motion, /addEventListener\('wheel'/);
});

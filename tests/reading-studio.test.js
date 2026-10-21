import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clampFocusFont, focusReadingProgress, openFocusReader } from '../src/reader-focus.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function fixture({ native = false, persisted = {} } = {}) {
  const events = new Map();
  const store = new Map(Object.entries(persisted));
  let document;
  function node(tag = 'div') {
    const listeners = new Map();
    const values = new Map();
    const classes = new Set();
    const n = {
      tag, children: [], textContent: '', className: '', disabled: false,
      isConnected: true, open: false, value: 0,
      scrollTop: 0, scrollHeight: 1100, clientHeight: 100,
      classList: {
        add(k) { classes.add(k); },
        remove(k) { classes.delete(k); },
        toggle(k, force) { if (force) classes.add(k); else classes.delete(k); },
        contains(k) { return classes.has(k); }
      },
      style: { setProperty(k,v) { values.set(k,v); }, removeProperty(k) { values.delete(k); }, values },
      addEventListener(k,fn) { listeners.set(k,fn); },
      removeEventListener(k) { listeners.delete(k); },
      dispatch(k,event={}) { return listeners.get(k)?.(event); },
      setAttribute(k,v) { (this.attributes ||= {})[k] = v; },
      appendChild(child) { this.children.push(child); },
      remove() { this.removed = true; this.isConnected = false; },
      focus() { document.activeElement = this; }
    };
    if (tag === 'dialog' && native) {
      n.showModal = function() { n.open = true; };
      n.close = function() { n.open = false; n.dispatch('close'); };
    }
    return n;
  }
  document = {
    body: node('body'),
    createElement: node,
    activeElement: null,
    querySelector: () => null,
    addEventListener(k,fn) { events.set(k,fn); },
    removeEventListener(k) { events.delete(k); }
  };
  const winEvents = new Map();
  const win = {
    localStorage: {
      getItem(k) { return store.get(k) ?? null; },
      setItem(k,v) { store.set(k,String(v)); }
    },
    addEventListener(k,fn) { winEvents.set(k,fn); },
    removeEventListener(k) { winEvents.delete(k); }
  };
  const walk = (root,predicate) => {
    if (predicate(root)) return root;
    for (const child of root.children) {
      const found = walk(child,predicate);
      if (found) return found;
    }
    return null;
  };
  const find = (className) => walk(document.body,n =>
    String(n.className).split(/\s+/).includes(className)
  );
  return { document, win, events, winEvents, store, find };
}

test('Reading Studio defaults to legible typography and clamps zoom safely', () => {
  assert.equal(clampFocusFont(undefined), 22);
  assert.equal(clampFocusFont('not a number'), 22);
  assert.equal(clampFocusFont(-3), 18);
  assert.equal(clampFocusFont(29), 30);
  assert.equal(clampFocusFont(60), 30);
  assert.equal(clampFocusFont(21), 22);
  assert.equal(focusReadingProgress(0, 1100, 100), 0);
  assert.equal(focusReadingProgress(500, 1100, 100), 50);
  assert.equal(focusReadingProgress(1200, 1100, 100), 100);
  assert.equal(focusReadingProgress(0, 100, 100), 100);
});

test('dialog renders untrusted user-uploaded lyrics as text without HTML interpretation', () => {
  const f = fixture();
  const payload = 'Line one\n<img src=x onerror=alert(1)>\n\nLine four';
  const dialog = openFocusReader({
    title: 'Demo <script>alert(1)</script>',
    artist: 'A & B',
    lyrics: payload,
    doc: f.document, win: f.win
  });
  assert.ok(dialog);
  assert.equal(f.find('lv-reader-poem').textContent, payload);
  assert.equal(f.find('lv-reader-stage-heading').children[1].textContent, 'Demo <script>alert(1)</script>');
  assert.equal(f.find('lv-reader-byline').textContent, 'A & B');
  assert.equal(dialog.attributes['aria-modal'], 'true');
  assert.equal(f.find('lv-reader-viewport').tabIndex, 0);
  assert.equal(f.find('lv-reader-close'), f.document.activeElement);
  assert.equal(f.find('lv-reader-progress').value, 0);
});

test('font and theme controls persist without changing lyrics text or the page route', () => {
  const f = fixture({ persisted: {
    'lyricverse:focus-font-size':'24',
    'lyricverse:focus-theme':'paper'
  }});
  const trigger = { isConnected: true, focus() { this.restored = true; } };
  const d = openFocusReader({ title:'Song', artist:'Artist', lyrics:'lyrics here',
    doc:f.document, win:f.win, trigger });
  assert.equal(d.style.values.get('--lv-reader-font-size'), '24px');
  assert.equal(d.classList.contains('lv-reader-paper'), true);
  f.find('lv-reader-type-controls').children[2].dispatch('click');
  assert.equal(f.store.get('lyricverse:focus-font-size'), '26');
  f.find('lv-reader-theme').dispatch('click');
  assert.equal(f.store.get('lyricverse:focus-theme'), 'midnight');
  assert.equal(d.classList.contains('lv-reader-paper'), false);
  const viewport = f.find('lv-reader-viewport');
  viewport.scrollTop = 300;
  viewport.dispatch('scroll');
  assert.equal(f.find('lv-reader-progress').value, 30);
  assert.equal(f.find('lv-reader-progress-value').textContent, '30%');
  f.find('lv-reader-close').dispatch('click');
  assert.equal(d.removed, true);
  assert.equal(trigger.restored, true);
  assert.equal(f.events.size, 0);
  assert.equal(f.winEvents.size, 0);
  assert.equal(f.document.body.classList.contains('lv-reader-fallback-open'), false);
});

test('Escape, hash navigation and close clean up the overlay', () => {
  const f = fixture();
  const d = openFocusReader({ title:'Sample', artist:'Artist', lyrics:'Line', doc:f.document, win:f.win });
  let prevented = false;
  f.events.get('keydown')({ key:'Escape', preventDefault(){prevented=true;} });
  assert.equal(prevented, true);
  assert.equal(d.removed, true);
  const second = openFocusReader({ title:'Sample', artist:'Artist', lyrics:'Line', doc:f.document, win:f.win });
  f.winEvents.get('hashchange')();
  assert.equal(second.removed, true);
});

test('native dialog also restores focus and removes listeners on close', () => {
  const f = fixture({ native: true });
  const trigger = { isConnected:true,focus(){this.restored=true;} };
  const d = openFocusReader({ title:'Song', artist:'Author', lyrics:'Verse',
    doc:f.document,win:f.win,trigger });
  assert.equal(d.open, true);
  f.find('lv-reader-close').dispatch('click');
  assert.equal(d.open, false);
  assert.equal(d.removed, true);
  assert.equal(trigger.restored, true);
  assert.equal(f.events.size, 0);
});

test('no empty or invalid lyrics view is created', () => {
  const f = fixture();
  assert.equal(openFocusReader({title:'Missing',artist:'Someone',lyrics:'   ',doc:f.document,win:f.win}),null);
  assert.equal(f.document.body.children.length,0);
});

test('published lyrics reader exposes Reading Studio without changing lyrics links or carousel', () => {
  const app = read('src/app.js');
  const css = read('styles.css');
  const build = read('scripts/build.mjs');
  assert.match(app, /import \{ openFocusReader \} from '\.\/reader-focus\.js'/);
  assert.match(app, /data-action="focus-lyrics"/);
  assert.match(app, /openFocusReader\(\{title:source\.title,artist:source\.artist,lyrics:source\.lyrics,trigger:button\}\)/);
  assert.match(app, /function originalReaderHTMLForSong\(song\)/);
  assert.match(app, /href="\$\{songHref\(song\)\}"/);
  assert.match(app, /data-action="preview"/);
  assert.match(app, /function initSongBanner\(\)/);
  assert.match(css, /\.lv-reader-dialog::backdrop/);
  assert.match(css, /\.lv-reader-viewport/);
  assert.match(css, /\.lv-reader-paper/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(build, /await cp\(new URL\('\.\.\/src\/'/);
});

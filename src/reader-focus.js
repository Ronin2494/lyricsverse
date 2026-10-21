// An opt-in, distraction-free lyrics reader. Never alters stored lyrics or site routes.
// Native <dialog> provides keyboard focus management; the fallback also supports Escape/Tab.
const FONT_KEY = 'lyricverse:focus-font-size';
const THEME_KEY = 'lyricverse:focus-theme';
const FONT_MIN = 18;
const FONT_MAX = 30;

export function clampFocusFont(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(number / 2) * 2))
    : 22;
}

export function focusReadingProgress(scrollTop, scrollHeight, clientHeight) {
  const remaining = Math.max(0, Number(scrollHeight) - Number(clientHeight));
  return remaining > 0
    ? Math.min(100, Math.max(0, Math.round(Number(scrollTop) * 100 / remaining)))
    : 100;
}

function readPreference(storage, key, fallback) {
  try { return storage?.getItem(key) || fallback; } catch { return fallback; }
}
function writePreference(storage, key, value) {
  try { storage?.setItem(key, String(value)); } catch { /* Private-mode storage is optional. */ }
}

function buildNode(doc, tag, className, content) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function button(doc, label, className, action) {
  const node = buildNode(doc, 'button', className, label);
  node.type = 'button';
  node.setAttribute('aria-label', action);
  return node;
}

export function openFocusReader({ title, artist, lyrics, trigger, doc = document, win = window } = {}) {
  if (!doc?.createElement || !doc.body || typeof lyrics !== 'string' || !lyrics.trim()) return null;

  // One reading surface at a time, including on repeated rapid taps.
  const existing = doc.querySelector?.('.lv-reader-dialog');
  if (existing) {
    if (typeof existing.close === 'function' && existing.open) existing.close();
    else existing.remove();
  }

  const storage = (() => { try { return win.localStorage; } catch { return null; } })();
  let font = clampFocusFont(readPreference(storage, FONT_KEY, '22'));
  let paper = readPreference(storage, THEME_KEY, 'midnight') === 'paper';
  let nativeDialog = false;
  let disposed = false;

  const dialog = buildNode(doc, 'dialog', 'lv-reader-dialog');
  dialog.setAttribute('aria-labelledby', 'lv-reader-dialog-title');
  dialog.setAttribute('aria-describedby', 'lv-reader-dialog-hint');
  dialog.setAttribute('aria-modal', 'true');

  const panel = buildNode(doc, 'div', 'lv-reader-stage');
  const head = buildNode(doc, 'header', 'lv-reader-stage-head');
  const heading = buildNode(doc, 'div', 'lv-reader-stage-heading');
  heading.appendChild(buildNode(doc, 'span', 'lv-reader-kicker', 'LYRICVERSE / READING STUDIO'));
  const titleNode = buildNode(doc, 'h2', '', title || 'Published lyrics');
  titleNode.id = 'lv-reader-dialog-title';
  heading.appendChild(titleNode);
  heading.appendChild(buildNode(doc, 'p', 'lv-reader-byline', artist || ''));
  const close = button(doc, 'Close  ×', 'lv-reader-close', 'Close reading studio');
  head.appendChild(heading);
  head.appendChild(close);

  const bar = buildNode(doc, 'div', 'lv-reader-stage-tools');
  const hint = buildNode(doc, 'p', 'lv-reader-hint', 'A quiet space for the lyrics. Press Escape to return.');
  hint.id = 'lv-reader-dialog-hint';
  const controls = buildNode(doc, 'div', 'lv-reader-type-controls');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Reading preferences');
  const smaller = button(doc, 'A−', 'lv-reader-tool', 'Decrease lyrics text size');
  const size = buildNode(doc, 'output', 'lv-reader-font-size', font + ' px');
  size.setAttribute('aria-live', 'polite');
  size.setAttribute('aria-label', 'Lyrics text size');
  const larger = button(doc, 'A+', 'lv-reader-tool', 'Increase lyrics text size');
  const theme = button(doc, paper ? 'Midnight' : 'Warm paper', 'lv-reader-tool lv-reader-theme', 'Change reading theme');
  controls.appendChild(smaller);
  controls.appendChild(size);
  controls.appendChild(larger);
  controls.appendChild(theme);
  bar.appendChild(hint);
  bar.appendChild(controls);

  const viewport = buildNode(doc, 'section', 'lv-reader-viewport');
  viewport.setAttribute('aria-label', 'Lyrics reading area');
  viewport.tabIndex = 0;
  const sheet = buildNode(doc, 'div', 'lv-reader-sheet');
  // Set text, never innerHTML: artist-uploaded lyrics cannot execute markup.
  const poem = buildNode(doc, 'div', 'lv-reader-poem', lyrics);
  sheet.appendChild(poem);
  viewport.appendChild(sheet);

  const foot = buildNode(doc, 'footer', 'lv-reader-stage-foot');
  const meterLabel = buildNode(doc, 'span', 'lv-reader-progress-label', 'Reading progress');
  const meter = buildNode(doc, 'progress', 'lv-reader-progress');
  meter.max = 100;
  meter.value = 0;
  meter.setAttribute('aria-label', 'Reading progress');
  const percent = buildNode(doc, 'span', 'lv-reader-progress-value', '0%');
  foot.appendChild(meterLabel);
  foot.appendChild(meter);
  foot.appendChild(percent);

  panel.appendChild(head);
  panel.appendChild(bar);
  panel.appendChild(viewport);
  panel.appendChild(foot);
  dialog.appendChild(panel);
  doc.body.appendChild(dialog);

  const syncFont = () => {
    dialog.style.setProperty('--lv-reader-font-size', font + 'px');
    size.textContent = font + ' px';
    smaller.disabled = font <= FONT_MIN;
    larger.disabled = font >= FONT_MAX;
    meter.value = focusReadingProgress(viewport.scrollTop, viewport.scrollHeight, viewport.clientHeight);
  };
  const syncTheme = () => {
    dialog.classList.toggle('lv-reader-paper', paper);
    theme.textContent = paper ? 'Midnight' : 'Warm paper';
    theme.setAttribute('aria-pressed', String(paper));
  };
  const syncProgress = () => {
    const value = focusReadingProgress(viewport.scrollTop, viewport.scrollHeight, viewport.clientHeight);
    meter.value = value;
    percent.textContent = value + '%';
  };

  const onKeydown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
      return;
    }
    if (event.key !== 'Tab' || nativeDialog) return;
    // Old browser fallback: keep focus inside this fullscreen reading surface.
    const focusable = [close, smaller, larger, theme, viewport].filter(node => !node.disabled);
    if (!focusable.length) return;
    const current = doc.activeElement;
    const index = focusable.indexOf(current);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      focusable[focusable.length - 1].focus();
    } else if (!event.shiftKey && (index < 0 || index === focusable.length - 1)) {
      event.preventDefault();
      focusable[0].focus();
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    viewport.removeEventListener('scroll', syncProgress);
    doc.removeEventListener?.('keydown', onKeydown);
    win.removeEventListener?.('hashchange', dismiss);
    doc.body.classList?.remove('lv-reader-fallback-open');
    dialog.remove();
    if (trigger?.isConnected) trigger.focus?.();
  };
  const dismiss = () => {
    if (nativeDialog && dialog.open && typeof dialog.close === 'function') {
      dialog.close();
      // close is an event on native dialog; some test DOMs do not dispatch it.
      return;
    }
    dispose();
  };

  close.addEventListener('click', dismiss);
  smaller.addEventListener('click', () => {
    font = clampFocusFont(font - 2);
    syncFont();
    writePreference(storage, FONT_KEY, font);
  });
  larger.addEventListener('click', () => {
    font = clampFocusFont(font + 2);
    syncFont();
    writePreference(storage, FONT_KEY, font);
  });
  theme.addEventListener('click', () => {
    paper = !paper;
    syncTheme();
    writePreference(storage, THEME_KEY, paper ? 'paper' : 'midnight');
  });
  viewport.addEventListener('scroll', syncProgress, { passive: true });
  dialog.addEventListener('close', dispose, { once: true });
  doc.addEventListener?.('keydown', onKeydown);
  win.addEventListener?.('hashchange', dismiss);

  syncFont();
  syncTheme();
  syncProgress();
  try {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      nativeDialog = true;
    } else {
      dialog.setAttribute('open', '');
      doc.body.classList?.add('lv-reader-fallback-open');
    }
  } catch {
    dialog.setAttribute('open', '');
    doc.body.classList?.add('lv-reader-fallback-open');
  }
  close.focus?.();
  return dialog;
}

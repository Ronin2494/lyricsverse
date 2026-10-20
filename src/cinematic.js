// Decorative cinematic lighting inspired by Portfolio's restrained orbital scene.
// DOM only: keeps every song link, reader, search and mobile gesture unchanged.
const LIGHT_TARGETS = [
  '.song-card', '.mood-card', '.song-banner-slide',
  '.compact-lyric-card', '.neon-reader-hero', '.neon-search-header'
].join(', ');

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function starlightPoints(count = 28, seed = 6619) {
  const points = [];
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = 0; i < Math.min(40, Math.max(0, Math.trunc(count))); i++) {
    points.push({
      x: (8 + random() * 85).toFixed(2),
      y: (5 + random() * 90).toFixed(2),
      size: (0.8 + random() * 1.55).toFixed(2),
      opacity: (0.22 + random() * 0.48).toFixed(2),
      accent: i % 7 === 0,
      twinkle: i % 9 === 0
    });
  }
  return points;
}

export function pointerLight(rect, clientX, clientY) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 50, y: 50 };
  return {
    x: Math.round(clamp((clientX - rect.left) * 100 / rect.width, 0, 100)),
    y: Math.round(clamp((clientY - rect.top) * 100 / rect.height, 0, 100))
  };
}

export function mountCinematic(root, { win = window, doc = document } = {}) {
  if (!root || !win || !doc || typeof win.matchMedia !== 'function') return () => {};
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = win.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hero = root.querySelector?.('.neon-hero');
  const cosmos = hero?.querySelector?.('.neon-hero-cosmos');
  const cleanups = [];

  // Deterministic, capped DOM stars replace a continually rendering canvas.
  if (cosmos && typeof doc.createElement === 'function') {
    const stars = doc.createElement('div');
    stars.className = 'lv-stardust';
    stars.setAttribute('aria-hidden', 'true');
    const mobile = win.matchMedia('(max-width: 650px)').matches;
    for (const point of starlightPoints(mobile ? 17 : 28)) {
      const star = doc.createElement('i');
      star.className = 'lv-stardust-point' +
        (point.accent ? ' lv-stardust-accent' : '') +
        (point.twinkle ? ' lv-stardust-twinkle' : '');
      star.style.setProperty('--lv-star-x', point.x + '%');
      star.style.setProperty('--lv-star-y', point.y + '%');
      star.style.setProperty('--lv-star-size', point.size + 'px');
      star.style.setProperty('--lv-star-opacity', point.opacity);
      stars.appendChild(star);
    }
    cosmos.prepend(stars);
    cleanups.push(() => stars.remove());

    // Stop twinkling when the scene is offscreen or browser tab is hidden.
    let visible = true;
    const updateActivity = () => stars.classList.toggle(
      'lv-stardust-playing', !reduced && visible && !doc.hidden
    );
    let observer;
    if (typeof win.IntersectionObserver === 'function') {
      observer = new win.IntersectionObserver(entries => {
        visible = Boolean(entries[0]?.isIntersecting);
        updateActivity();
      }, { threshold: 0.02 });
      observer.observe(hero);
      cleanups.push(() => observer.disconnect());
    }
    doc.addEventListener?.('visibilitychange', updateActivity);
    cleanups.push(() => doc.removeEventListener?.('visibilitychange', updateActivity));
    updateActivity();
  }

  // Fine-pointer light follows cards; never intercepts navigation or touch.
  if (!reduced && finePointer && typeof win.requestAnimationFrame === 'function' &&
      typeof root.addEventListener === 'function') {
    let frame = 0;
    let latest = null;
    let active = null;
    const clear = element => {
      element?.style?.removeProperty('--lv-light-x');
      element?.style?.removeProperty('--lv-light-y');
      element?.classList?.remove('lv-light-follow');
    };
    const flush = () => {
      frame = 0;
      if (!latest) return;
      const { target, x, y } = latest;
      latest = null;
      if (active && active !== target) clear(active);
      active = target;
      target.style.setProperty('--lv-light-x', x + '%');
      target.style.setProperty('--lv-light-y', y + '%');
      target.classList.add('lv-light-follow');
    };
    const move = event => {
      const target = event.target?.closest?.(LIGHT_TARGETS);
      if (!target || !root.contains?.(target)) {
        if (active) clear(active);
        active = null;
        latest = null;
        return;
      }
      const { x, y } = pointerLight(target.getBoundingClientRect(), event.clientX, event.clientY);
      latest = { target, x, y };
      if (!frame) frame = win.requestAnimationFrame(flush);
    };
    const leave = () => {
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
      latest = null;
      if (active) clear(active);
      active = null;
    };
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      leave();
    });
  }
  return () => {
    for (let index = cleanups.length - 1; index >= 0; index--) cleanups[index]();
  };
}

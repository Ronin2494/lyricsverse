// Progressive motion layer: no runtime dependencies and no hidden content without JS.
let cleanupActive = () => {};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function prefersMotion(win) {
  return Boolean(win && typeof win.matchMedia === 'function' &&
    !win.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

export function tiltForPointer(rect, x, y) {
  if (!rect || !rect.width || !rect.height) return { x: 0, y: 0 };
  const horizontal = clamp((x - rect.left) / rect.width * 2 - 1, -1, 1);
  const vertical = clamp((y - rect.top) / rect.height * 2 - 1, -1, 1);
  return { x: Math.round(-vertical * 40) / 10 || 0, y: Math.round(horizontal * 40) / 10 || 0 };
}

export function stopMotion() {
  cleanupActive();
  cleanupActive = () => {};
}

export function mountMotion(root, { win = window, doc = document } = {}) {
  stopMotion();
  if (!root || !win || typeof win.matchMedia !== 'function') return;
  const cleanups = [];
  const cleanup = () => { for (const dispose of cleanups.reverse()) dispose(); };
  cleanupActive = cleanup;

  // React to OS accessibility changes without reloading or leaving hidden sections.
  const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
  const onPreferenceChange = () => mountMotion(root, { win, doc });
  preference.addEventListener?.('change', onPreferenceChange);
  cleanups.push(() => preference.removeEventListener?.('change', onPreferenceChange));
  if (preference.matches) return;

  root.classList.add('motion-enabled');
  cleanups.push(() => root.classList.remove('motion-enabled'));

  const sectionSelector = [
    '.neon-genre-strip', '.song-section', '.moods-section', '.ambient-pearls',
    '.homepage-hub', '.rating-strip', '.how-section', '.closing-cta',
    '.neon-search-header', '.neon-reader-hero', '.reader-columns',
    '.profile-panel', '.profile-saved-section'
  ].join(',');
  if (typeof win.IntersectionObserver === 'function') {
    const sections = Array.from(root.querySelectorAll(sectionSelector));
    const observer = new win.IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    for (const section of sections) {
      section.classList.add('motion-reveal');
      observer.observe(section);
    }
    cleanups.push(() => {
      observer.disconnect();
      for (const section of sections) section.classList.remove('motion-reveal', 'is-visible');
    });
  }

  const finePointer = win.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    const cards = Array.from(root.querySelectorAll('.song-card, .mood-card, .feature-card'));
    for (const card of cards) {
      const onMove = event => {
        const tilt = tiltForPointer(card.getBoundingClientRect(), event.clientX, event.clientY);
        card.style.setProperty('--motion-tilt-x', tilt.x + 'deg');
        card.style.setProperty('--motion-tilt-y', tilt.y + 'deg');
      };
      const onLeave = () => {
        card.style.removeProperty('--motion-tilt-x');
        card.style.removeProperty('--motion-tilt-y');
      };
      card.classList.add('motion-tilt');
      card.addEventListener('pointermove', onMove, { passive: true });
      card.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
        onLeave();
        card.classList.remove('motion-tilt');
      });
    }

    const hero = root.querySelector('.neon-hero');
    if (hero && typeof win.requestAnimationFrame === 'function') {
      let frame = 0;
      let dx = 0, dy = 0;
      const apply = () => {
        frame = 0;
        hero.style.setProperty('--hero-offset-x', dx + 'px');
        hero.style.setProperty('--hero-offset-y', dy + 'px');
      };
      const onMove = event => {
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        dx = Math.round(clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1) * 13);
        dy = Math.round(clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1) * 10);
        if (!frame) frame = win.requestAnimationFrame(apply);
      };
      const onLeave = () => {
        if (frame) win.cancelAnimationFrame(frame);
        frame = 0;
        hero.style.removeProperty('--hero-offset-x');
        hero.style.removeProperty('--hero-offset-y');
      };
      hero.addEventListener('pointermove', onMove, { passive: true });
      hero.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        hero.removeEventListener('pointermove', onMove);
        hero.removeEventListener('pointerleave', onLeave);
        onLeave();
      });
    }
  }

  // Decorative reader progress: accessible reading order remains untouched.
  const reader = root.querySelector('.neon-reader, .original-reader');
  if (reader && doc?.createElement) {
    const bar = doc.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    reader.prepend(bar);
    const update = () => {
      const distance = (doc.documentElement?.scrollHeight || 0) - (win.innerHeight || 0);
      const amount = distance > 0 ? clamp((win.scrollY || 0) / distance, 0, 1) : 0;
      bar.style.transform = 'scaleX(' + amount + ')';
    };
    win.addEventListener('scroll', update, { passive: true });
    win.addEventListener('resize', update, { passive: true });
    update();
    cleanups.push(() => {
      win.removeEventListener('scroll', update);
      win.removeEventListener('resize', update);
      bar.remove();
    });
  }
}

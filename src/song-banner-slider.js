// A compact, swipe-friendly song slider with native scroll snapping.
// Movement is manual: no timers, autoplay, or dependency on third-party animation code.
let disposeCurrent = () => {};

export function getBannerIndex(scrollLeft, width, count) {
  if (!(count > 0) || !(width > 0)) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(Math.max(0, scrollLeft) / width)));
}

export function stopSongBannerSlider() {
  disposeCurrent();
  disposeCurrent = () => {};
}

export function mountSongBannerSlider(root, win = window) {
  stopSongBannerSlider();
  if (!root) return;

  const track = root.querySelector('[data-banner-track]');
  const slides = Array.from(root.querySelectorAll('[data-banner-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-banner-dot]'));
  const count = root.querySelector('[data-banner-count]');
  const status = root.querySelector('[data-banner-status]');
  if (!track || !slides.length) return;

  const prefersReducedMotion = () => win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let active = -1;
  let frame = null;

  const sync = index => {
    active = Math.min(slides.length - 1, Math.max(0, index));
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
      dot.classList.toggle('is-active', i === active);
    });
    slides.forEach((slide, i) => {
      // Offscreen links are not keyboard-reachable until the slide is selected.
      const link = slide.querySelector('a');
      if (link) link.tabIndex = i === active ? 0 : -1;
    });
    if (count) count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    if (status) status.textContent = 'Featured song ' + (active + 1) + ' of ' + slides.length + ': ' + (slides[active]?.dataset.songTitle || '');
  };

  const goTo = index => {
    const next = Math.min(slides.length - 1, Math.max(0, index));
    sync(next);
    const first = slides[0];
    const offset = slides[next].offsetLeft - first.offsetLeft;
    track.scrollTo({ left: offset, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
  };

  const onClick = event => {
    const step = event.target.closest('[data-banner-step]');
    const dot = event.target.closest('[data-banner-dot]');
    if (step) {
      event.preventDefault();
      goTo((active + Number(step.dataset.bannerStep) + slides.length) % slides.length);
    } else if (dot) {
      event.preventDefault();
      goTo(Number(dot.dataset.bannerDot));
    }
  };

  const onScroll = () => {
    if (frame !== null) return;
    frame = win.requestAnimationFrame(() => {
      frame = null;
      const next = getBannerIndex(track.scrollLeft, track.clientWidth, slides.length);
      if (next !== active) sync(next);
    });
  };

  const onKeydown = event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    goTo(Math.min(slides.length - 1, Math.max(0, active + (event.key === 'ArrowRight' ? 1 : -1))));
  };

  root.addEventListener('click', onClick);
  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('keydown', onKeydown);
  sync(0);

  disposeCurrent = () => {
    root.removeEventListener('click', onClick);
    track.removeEventListener('scroll', onScroll);
    track.removeEventListener('keydown', onKeydown);
    if (frame !== null) win.cancelAnimationFrame(frame);
  };
}

// Map the four evidence pins with responsive decorative red-thread connectors.
(() => {
  const wall = document.querySelector('.creative-wall-grid');
  if (!wall) return;
  const cards = Array.from(wall.querySelectorAll('.creative-wall-card'));
  if (cards.length !== 4) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'evidence-thread-map');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  wall.prepend(svg);
  wall.classList.add('has-thread-map');

  const stamp = document.createElement('span');
  stamp.className = 'evidence-board-stamp';
  stamp.setAttribute('aria-hidden', 'true');
  stamp.textContent = 'CASE FILE 04  //  CREATIVE CONNECTIONS';
  wall.append(stamp);
  const pathEl = (d, className, a, b) => {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', className);
    p.setAttribute('data-from', String(a));
    p.setAttribute('data-to', String(b));
    svg.append(p);
  };
  let queued = false;
  function draw() {
    queued = false;
    const frame = wall.getBoundingClientRect();
    if (!frame.width || !frame.height) return;
    const points = cards.map(card => {
      const r = card.getBoundingClientRect();
      return { x: r.left - frame.left + r.width / 2, y: r.top - frame.top + 8 };
    });
    svg.setAttribute('viewBox', '0 0 ' + frame.width + ' ' + frame.height);
    svg.replaceChildren();
    const compact = window.matchMedia('(max-width: 900px)').matches;
    const links = compact ? [[0,1],[1,2],[2,3]] : [[0,1],[0,2],[0,3]];
    for (const [a,b] of links) {
      const p = points[a], q = points[b];
      const bend = (b % 2 ? 15 : -15);
      const curve = 'M ' + p.x + ' ' + p.y + ' Q ' +
        ((p.x + q.x) / 2 + bend) + ' ' + ((p.y + q.y) / 2 + 21) +
        ' ' + q.x + ' ' + q.y;
      pathEl(curve, 'thread-shadow', a, b);
      pathEl(curve, 'thread-line', a, b);
    }
    points.forEach(p => {
      const pin = document.createElementNS(ns, 'circle');
      pin.setAttribute('cx', String(p.x));
      pin.setAttribute('cy', String(p.y));
      pin.setAttribute('r', '6');
      svg.append(pin);
    });
  }
  function redraw() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(draw);
  }
  cards.forEach((card, i) => {
    card.addEventListener('pointerenter', () => {
      svg.querySelectorAll('.thread-line').forEach(line => {
        const active = i === 0 ||
          Number(line.getAttribute('data-from')) === i ||
          Number(line.getAttribute('data-to')) === i;
        line.classList.toggle('thread-active', active);
      });
    });
    card.addEventListener('pointerleave', () => {
      svg.querySelectorAll('.thread-line').forEach(line => line.classList.remove('thread-active'));
    });
  });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(redraw);
    observer.observe(wall);
  }
  window.addEventListener('resize', redraw, { passive:true });
  window.addEventListener('load', redraw, { once:true });
  redraw();
})();

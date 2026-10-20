/* Public locked gallery. No creator sign-in, uploader, or payment verification code runs in this page. */
(() => {
  'use strict';
  const grid = document.getElementById('member-gallery-grid');
  const status = document.getElementById('member-empty');
  if (!grid || !status) return;
  const galleryEndpoint = 'https://badbunny-membership-api.onrender.com/api/gallery';
  const paymentUrl = 'https://www.paypal.com/ncp/payment/3JZWWYUL6RF4E';
  function makeCard(item) {
    if (!item || typeof item !== 'object') return;
    const video = typeof item.type === 'string' && item.type.startsWith('video/');
    const title = typeof item.title === 'string' ? item.title : 'Private creative drop';
    const description = typeof item.description === 'string' ? item.description : '';
    const card = document.createElement('article');
    card.className = 'member-media-card';
    const stage = document.createElement('div');
    stage.className = 'member-media-stage member-media-locked';
    const lock = document.createElement('span');
    lock.className = 'member-media-lock-label';
    lock.textContent = video ? '🔒 PRIVATE VIDEO' : '🔒 PRIVATE PHOTO';
    stage.append(lock);
    const heading = document.createElement('h4');
    heading.textContent = title;
    const detail = document.createElement('p');
    detail.textContent = description || 'Exclusive media. Content is hidden until access is verified.';
    const pay = document.createElement('a');
    pay.className = 'member-cta member-media-pay';
    pay.textContent = 'PAY WITH PAYPAL ↗';
    pay.href = paymentUrl;
    pay.target = '_blank';
    pay.rel = 'noopener noreferrer';
    pay.setAttribute('aria-label', 'Pay with PayPal for ' + title + ' (one-time payment)');
    const note = document.createElement('span');
    note.className = 'member-pay-note';
    note.textContent = 'One-time payment · Access requires separate verification';
    const actions = document.createElement('div');
    actions.className = 'member-media-tools';
    actions.append(pay, note);
    card.append(stage, heading, detail, actions);
    grid.append(card);
  }
  async function loadGallery() {
    status.textContent = 'Loading gallery…';
    try {
      const response = await fetch(galleryEndpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Gallery unavailable');
      const payload = await response.json();
      const items = Array.isArray(payload.items) ? payload.items : [];
      grid.replaceChildren();
      if (!items.length) {
        status.textContent = 'No photos or videos have been published yet. The gallery will fill as new content is added.';
        return;
      }
      status.textContent = '';
      items.forEach(makeCard);
    } catch {
      status.textContent = 'Gallery items are unavailable at the moment. Please check back shortly.';
    }
  }
  void loadGallery();
})();

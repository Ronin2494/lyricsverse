/* BadBunny membership, CA$10/month. No credentials or premium media are embedded in this page. */
(() => {
  'use strict';
  const apiOrigin = 'https://badbunny-membership-api.onrender.com';
  const root = document.getElementById('membership');
  if (!root) return;
  const byId = id => document.getElementById(id);
  const ids = [
    'member-email-form','member-code-form','member-email-input','member-code-input',
    'member-email-submit','member-code-submit','member-code-change','member-config-note',
    'member-notice','member-logged-in','member-email-display','member-status',
    'member-checkout','member-portal','member-logout','member-refresh',
    'member-gallery','member-empty','member-gallery-grid','member-owner',
    'member-upload-form','member-upload-title','member-upload-description',
    'member-upload-file','member-upload-submit','member-join-link'
  ];
  const ui = Object.fromEntries(ids.map(id => [id, byId(id)]));
  const tokenKey = 'badbunny-member-token';
  let token = '';
  try { token = sessionStorage.getItem(tokenKey) || ''; } catch {}
  let user = null;
  let config = null;
  let pendingEmail = '';

  const setNotice = (message, kind = '') => {
    ui['member-notice'].textContent = message;
    ui['member-notice'].dataset.kind = kind;
  };
  const hide = (element, hidden) => element.classList.toggle('member-hidden', Boolean(hidden));
  const setBusy = (button, busy, label) => {
    button.disabled = busy;
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = label || 'Working…';
    } else if (button.dataset.originalLabel) {
      button.textContent = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
  };
  async function api(path, options = {}) {
    const headers = {...options.headers};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    let response;
    try {
      response = await fetch(apiOrigin + path, {...options, headers, signal: AbortSignal.timeout(45000)});
    } catch {
      throw new Error('Could not reach the membership service. Please try again shortly.');
    }
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.');
    return result;
  }
  function setToken(value) {
    token = value || '';
    try {
      if (token) sessionStorage.setItem(tokenKey, token);
      else sessionStorage.removeItem(tokenKey);
    } catch {}
  }
  function update() {
    const signedIn = Boolean(user);
    const ready = Boolean(config?.authEnabled);
    hide(ui['member-email-form'], signedIn || !ready || Boolean(pendingEmail));
    hide(ui['member-code-form'], signedIn || !ready || !pendingEmail);
    hide(ui['member-logged-in'], !signedIn);
    hide(ui['member-owner'], !signedIn || !user?.admin);
    if (signedIn) {
      ui['member-email-display'].textContent = user.email;
      ui['member-status'].textContent = user.admin ? 'Creator account' : user.hasAccess ? 'Membership active' : 'Not subscribed';
      hide(ui['member-checkout'], true);
      hide(ui['member-portal'], true);
      ui['member-checkout'].disabled = !config?.billingEnabled;
      ui['member-portal'].disabled = !config?.billingEnabled;
    }
    ui['member-email-submit'].disabled = !ready;
    if (!ready) {
      ui['member-config-note'].textContent = config
        ? 'The member platform is being activated. Payments and sign-in are not yet available.'
        : 'Connecting to the membership service…';
    } else if (!config.billingEnabled) {
      ui['member-config-note'].textContent = 'Email sign-in is available. Paid checkout is being activated.';
    } else {
      ui['member-config-note'].textContent = 'Secure email sign-in and recurring billing are available.';
    }
  }
  function clearSession() {
    setToken('');
    user = null;
    pendingEmail = '';
    ui['member-email-input'].value = '';
    ui['member-code-input'].value = '';
    update();
    void loadGallery();
  }
  async function refreshAccount() {
    if (!token) return;
    try {
      const result = await api('/api/me');
      user = result.user;
      update();
      await loadGallery();
    } catch (err) {
      clearSession();
      setNotice(err.message, 'error');
    }
  }
  async function loadConfig() {
    try {
      config = await api('/api/config');
      update();
      if (token && config.authEnabled) await refreshAccount();
      const query = new URLSearchParams(location.search);
      if (query.get('membership') === 'success') {
        setNotice('Checkout completed. Your access will activate once payment is confirmed. Use Refresh access below.', 'success');
      }
    } catch {
      config = null;
      update();
      ui['member-config-note'].textContent = 'Membership service is starting. Please check back soon.';
    }
  }
  async function loadGallery() {
    ui['member-empty'].textContent = 'Loading exclusive content…';
    try {
      const result = await api(user?.hasAccess ? '/api/media' : '/api/gallery');
      ui['member-gallery-grid'].replaceChildren();
      const items = result.items || [];
      if (!items.length) {
        ui['member-empty'].textContent = 'The private archive is ready. New photos and videos will appear here when the creator publishes them.';
        return;
      }
      ui['member-empty'].textContent = '';
      items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'member-media-card';
        const stage = document.createElement('div');
        stage.className = 'member-media-stage';
        const placeholder = document.createElement('span');
        placeholder.textContent = item.type.startsWith('video/') ? 'PRIVATE VIDEO' : 'PRIVATE PHOTO';
        placeholder.className = 'member-status';
        stage.append(placeholder);
        const heading = document.createElement('h4');
        heading.textContent = item.title;
        const desc = document.createElement('p');
        desc.textContent = item.description || 'Exclusive for Creative Access subscribers.';
        const tools = document.createElement('div');
        tools.className = 'member-media-tools';
        const loadButton = document.createElement('button');
        loadButton.className = 'member-secondary';
        loadButton.type = 'button';
        loadButton.textContent = 'View ' + (item.type.startsWith('video/') ? 'video' : 'photo');
        loadButton.addEventListener('click', async () => {
          setBusy(loadButton, true, 'Loading…');
          try {
            const ticket = await api('/api/media/' + encodeURIComponent(item.id) + '/ticket', {method:'POST'});
            const media = document.createElement(item.type.startsWith('video/') ? 'video' : 'img');
            if (media.tagName === 'VIDEO') {
              media.controls = true;
              media.playsInline = true;
              media.preload = 'metadata';
              media.setAttribute('controlsList','nodownload');
            } else {
              media.alt = item.title;
              media.loading = 'lazy';
            }
            media.referrerPolicy = 'no-referrer';
            media.src = ticket.url;
            stage.replaceChildren(media);
            loadButton.textContent = 'Refresh access';
          } catch (err) {
            setNotice(err.message, 'error');
            loadButton.textContent = 'Try again';
          } finally {
            loadButton.disabled = false;
            delete loadButton.dataset.originalLabel;
          }
        });
        if (user?.hasAccess) tools.append(loadButton);
        const payButton = document.createElement('a');
        payButton.className = 'member-cta member-media-pay';
        payButton.href = 'https://www.paypal.com/ncp/payment/3JZWWYUL6RF4E';
        payButton.target = '_blank';
        payButton.rel = 'noopener noreferrer';
        payButton.textContent = 'PAY WITH PAYPAL ↗';
        payButton.setAttribute('aria-label','Pay for ' + item.title + ' through PayPal (one-time payment)');
        tools.append(payButton);
        if (user?.admin) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'member-action';
          remove.textContent = 'Remove';
          remove.addEventListener('click', async () => {
            if (!confirm('Permanently delete "' + item.title + '"?')) return;
            setBusy(remove, true, 'Removing…');
            try {
              await api('/api/admin/media/' + encodeURIComponent(item.id), {method:'DELETE'});
              setNotice('Media removed from the private archive.', 'success');
              await loadGallery();
            } catch (err) {
              setNotice(err.message, 'error');
              setBusy(remove, false);
            }
          });
          tools.append(remove);
        }
        card.append(stage,heading,desc,tools);
        ui['member-gallery-grid'].append(card);
      });
    } catch (err) {
      ui['member-empty'].textContent = 'Unable to load the private archive right now.';
      setNotice(err.message, 'error');
    }
  }

  ui['member-email-form'].addEventListener('submit', async event => {
    event.preventDefault();
    const email = ui['member-email-input'].value.trim().toLowerCase();
    if (!email) return;
    setBusy(ui['member-email-submit'], true, 'Sending…');
    try {
      await api('/api/auth/request',{method:'POST',body:JSON.stringify({email})});
      pendingEmail = email;
      update();
      ui['member-code-input'].focus();
      setNotice('A six-digit code has been sent to ' + email + '.', 'success');
    } catch (err) { setNotice(err.message,'error'); }
    finally { setBusy(ui['member-email-submit'],false); }
  });
  ui['member-code-change'].addEventListener('click', () => {
    pendingEmail = '';
    ui['member-code-input'].value = '';
    update();
    ui['member-email-input'].focus();
  });
  ui['member-code-form'].addEventListener('submit',async event=>{
    event.preventDefault();
    setBusy(ui['member-code-submit'],true,'Verifying…');
    try {
      const answer = await api('/api/auth/verify',{method:'POST',body:JSON.stringify({email:pendingEmail,code:ui['member-code-input'].value.trim()})});
      setToken(answer.token);
      user=answer.user;
      pendingEmail='';
      ui['member-code-input'].value='';
      update();
      setNotice(user.admin ? 'Welcome to your creator studio.' : user.hasAccess ? 'Welcome back! Your private archive is unlocked.' : 'Email verified. Subscribe for CA$10 per month to unlock the private archive.','success');
      if(user.hasAccess) await loadGallery();
    } catch(err){setNotice(err.message,'error');}
    finally{setBusy(ui['member-code-submit'],false);}
  });
  ui['member-checkout'].addEventListener('click',async()=>{
    if(!config?.billingEnabled){setNotice('Checkout is not enabled yet. Please check back soon.','error');return;}
    setBusy(ui['member-checkout'],true,'Opening secure checkout…');
    try {
      const result=await api('/api/billing/checkout',{method:'POST'});
      if(!result.url || !result.url.startsWith('https://checkout.stripe.com/'))throw new Error('Checkout is temporarily unavailable.');
      location.assign(result.url);
    } catch(err){setNotice(err.message,'error');setBusy(ui['member-checkout'],false);}
  });
  ui['member-portal'].addEventListener('click',async()=>{
    setBusy(ui['member-portal'],true,'Opening billing…');
    try {
      const result=await api('/api/billing/portal',{method:'POST'});
      if(!result.url || !result.url.startsWith('https://billing.stripe.com/'))throw new Error('Billing settings are temporarily unavailable.');
      location.assign(result.url);
    } catch(err){setNotice(err.message,'error');setBusy(ui['member-portal'],false);}
  });
  ui['member-logout'].addEventListener('click',async()=>{
    try {await api('/api/auth/logout',{method:'POST'});}catch {}
    clearSession();
    setNotice('Signed out.','success');
  });
  ui['member-refresh'].addEventListener('click',async()=>{
    setBusy(ui['member-refresh'],true,'Refreshing…');
    await refreshAccount();
    setBusy(ui['member-refresh'],false);
  });
  ui['member-join-link'].addEventListener('click',()=>{
    if(!config?.authEnabled) {
      setNotice('Membership checkout will open once account verification and billing are configured.','error');
    } else if (!user) ui['member-email-input'].focus();
    else if(!user.hasAccess) ui['member-gallery'].scrollIntoView({behavior:'smooth',block:'start'});
    else ui['member-gallery'].scrollIntoView({behavior:'smooth',block:'start'});
  });
  ui['member-upload-form'].addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(!user?.admin)return;
    const file=ui['member-upload-file'].files?.[0];
    if(!file){setNotice('Choose an image or video.','error');return;}
    if(file.size>100*1024*1024){setNotice('File size must not exceed 100 MB.','error');return;}
    setBusy(ui['member-upload-submit'],true,'Uploading…');
    const body=new FormData();
    body.set('title',ui['member-upload-title'].value);
    body.set('description',ui['member-upload-description'].value);
    body.set('file',file);
    try {
      await api('/api/admin/upload',{method:'POST',body});
      ui['member-upload-form'].reset();
      setNotice('Published privately for your subscribers.','success');
      await loadGallery();
    }catch(err){setNotice(err.message,'error');}
    finally{setBusy(ui['member-upload-submit'],false);}
  });
  update();
  loadGallery();
  loadConfig();
})();

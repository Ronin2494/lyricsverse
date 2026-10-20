/* Creator-only publisher. This file is not loaded by the public gallery. All permissions are checked again by the API. */
(() => {
  'use strict';
  const API = 'https://badbunny-membership-api.onrender.com';
  const DEFAULT_PAYPAL = 'https://www.paypal.com/ncp/payment/3JZWWYUL6RF4E';
  const STORAGE_KEY = 'badbunny-studio-token';
  const fields = [
    'status-banner','auth-panel','email-form','email','request-code','code-form','code-destination',
    'code','verify-code','change-email','auth-notice','workspace','creator-email','sign-out',
    'upload-form','media-file','preview','file-summary','media-title','media-description',
    'media-price','media-paypal','media-type','publish-button','upload-notice','progress-wrap',
    'upload-progress','reload-media','media-count','library-notice','media-list','edit-panel',
    'edit-id','edit-form','edit-title-input','edit-description','edit-price','edit-paypal',
    'save-edit','edit-notice','close-edit'
  ];
  const ui = Object.fromEntries(fields.map(id => [id, document.getElementById(id)]));
  if (!ui['auth-panel']) return;
  let token = '';
  try { token = sessionStorage.getItem(STORAGE_KEY) || ''; } catch {}
  let creator = null;
  let pendingEmail = '';
  let fileObjectURL = null;
  let uploads = [];
  const money = cents => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(cents/100);
  const show = (element,visible) => { element.hidden = !visible; };
  const notice = (element,message,kind='') => {
    element.textContent = message;
    element.dataset.kind = kind;
  };
  const busy = (element,enabled,label='Working…') => {
    element.disabled = enabled;
    if(enabled) {
      element.dataset.savedLabel = element.textContent;
      element.textContent = label;
    } else if(element.dataset.savedLabel) {
      element.textContent = element.dataset.savedLabel;
      delete element.dataset.savedLabel;
    }
  };
  const authHeader = () => token ? {Authorization:'Bearer '+token} : {};
  function saveToken(value) {
    token = value || '';
    try {
      if(token) sessionStorage.setItem(STORAGE_KEY,token);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  async function call(path,options={}) {
    let response;
    try {
      const headers = {Accept:'application/json',...authHeader(),...options.headers};
      if(options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
      response = await fetch(API+path,{
        ...options,headers,
        signal:AbortSignal.timeout(30000)
      });
    } catch { throw new Error('Cannot connect to the creator service. Check its Render deployment and try again.'); }
    const result = (response.headers.get('content-type')||'').includes('application/json') ? await response.json() : {};
    if(!response.ok) throw new Error(result.error || 'Request failed. Please try again.');
    return result;
  }
  function resetPreview() {
    if(fileObjectURL) URL.revokeObjectURL(fileObjectURL);
    fileObjectURL=null;
    ui['preview'].replaceChildren();
    show(ui['preview'],false);
    ui['media-type'].textContent='SELECT MEDIA';
    ui['file-summary'].textContent='Select your media to preview it here before publishing.';
  }
  function renderFilePreview() {
    resetPreview();
    const file=ui['media-file'].files?.[0];
    if(!file)return;
    const isVideo=file.type.startsWith('video/');
    if(!file.type.startsWith('image/')&&!isVideo) {
      notice(ui['upload-notice'],'Choose a supported photo or video file.','error');
      return;
    }
    if(file.size>100*1024*1024) {
      notice(ui['upload-notice'],'The file exceeds the 100 MB limit.','error');
      return;
    }
    fileObjectURL=URL.createObjectURL(file);
    const media=document.createElement(isVideo?'video':'img');
    media.src=fileObjectURL;
    if(isVideo) {
      media.controls=true;
      media.playsInline=true;
      media.preload='metadata';
    } else media.alt='Local preview for '+file.name;
    ui['preview'].append(media);
    show(ui['preview'],true);
    ui['media-type'].textContent=isVideo?'VIDEO':'PHOTO';
    ui['file-summary'].textContent=file.name+' · '+(file.size/(1024*1024)).toFixed(1)+' MB';
    notice(ui['upload-notice'],'');
  }
  function openWorkspace(user){
    creator=user;
    show(ui['auth-panel'],false);
    show(ui['workspace'],true);
    ui['creator-email'].textContent='✦ VERIFIED CREATOR · '+user.email;
    notice(ui['status-banner'],'Creator access verified. Your uploads publish to the public locked gallery.','success');
    void loadLibrary();
  }
  function closeWorkspace(){
    creator=null;
    saveToken('');
    pendingEmail='';
    show(ui['workspace'],false);
    show(ui['auth-panel'],true);
    show(ui['email-form'],true);
    show(ui['code-form'],false);
    ui['code'].value='';
    uploads=[];
    ui['media-list'].replaceChildren();
  }
  async function restoreSession(){
    if(!token)return;
    try{
      const result=await call('/api/me');
      if(!result.user?.admin)throw new Error('This account is not authorized as the creator.');
      openWorkspace(result.user);
    }catch{
      closeWorkspace();
    }
  }
  async function init(){
    try{
      const config=await call('/api/config');
      if(!config.authEnabled){
        notice(ui['status-banner'],'The uploader page is deployed. To publish real files, configure the membership API with MongoDB, SESSION_SECRET, ADMIN_EMAIL and verified Resend email settings in Render.','error');
        ui['request-code'].disabled=true;
        return;
      }
      notice(ui['status-banner'],'Creator login is available. Sign in using the authorized email address.','success');
      await restoreSession();
    }catch(err){
      notice(ui['status-banner'],err.message,'error');
      ui['request-code'].disabled=true;
    }
  }
  ui['email-form'].addEventListener('submit',async event=>{
    event.preventDefault();
    const email=ui['email'].value.trim().toLowerCase();
    if(!email)return;
    busy(ui['request-code'],true,'SENDING…');
    try{
      await call('/api/auth/request',{method:'POST',body:JSON.stringify({email})});
      pendingEmail=email;
      ui['code-destination'].textContent='Code sent to '+email+'. Expires in 10 minutes.';
      show(ui['email-form'],false);
      show(ui['code-form'],true);
      ui['code'].focus();
      notice(ui['auth-notice'],'Check your email for the six-digit code.','success');
    }catch(err){notice(ui['auth-notice'],err.message,'error');}
    finally{busy(ui['request-code'],false);}
  });
  ui['change-email'].addEventListener('click',()=>{
    pendingEmail='';
    show(ui['email-form'],true);
    show(ui['code-form'],false);
    ui['code'].value='';
    notice(ui['auth-notice'],'');
  });
  ui['code-form'].addEventListener('submit',async event=>{
    event.preventDefault();
    busy(ui['verify-code'],true,'VERIFYING…');
    try{
      const result=await call('/api/auth/verify',{method:'POST',body:JSON.stringify({email:pendingEmail,code:ui['code'].value.trim()})});
      if(!result.user?.admin){
        notice(ui['auth-notice'],'This email is verified but is not authorized to manage creator uploads. Use the email configured as ADMIN_EMAIL.','error');
        return;
      }
      saveToken(result.token);
      pendingEmail='';
      ui['code'].value='';
      openWorkspace(result.user);
    }catch(err){notice(ui['auth-notice'],err.message,'error');}
    finally{busy(ui['verify-code'],false);}
  });
  ui['sign-out'].addEventListener('click',async()=>{
    try{await call('/api/auth/logout',{method:'POST'});}catch{}
    closeWorkspace();
    notice(ui['status-banner'],'Signed out of Creator Studio.','success');
  });
  ui['media-file'].addEventListener('change',renderFilePreview);
  function validPrice(value){
    const amount=Number(value);
    return Number.isFinite(amount)&&amount>=1&&amount<=1000&&Math.round(amount*100)===amount*100?amount.toFixed(2):null;
  }
  function checkLinkForPrice(price,link){
    const paypal=/^https:\/\/www[.]paypal[.]com\/ncp\/payment\/[A-Za-z0-9]+\/?$/;
    if(!paypal.test(link))return 'Enter a PayPal payment link in the format https://www.paypal.com/ncp/payment/...';
    if(price!=='10.00'&&link===DEFAULT_PAYPAL)return 'For a custom price, paste a separate PayPal payment link set to that exact amount. The default link cannot adjust the amount automatically.';
    return '';
  }
  function uploadMedia(formData,onProgress) {
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();
      xhr.open('POST',API+'/api/admin/upload');
      xhr.setRequestHeader('Authorization','Bearer '+token);
      xhr.setRequestHeader('Accept','application/json');
      xhr.timeout=180000;
      xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));};
      xhr.onload=()=>{
        let result={};
        try{result=JSON.parse(xhr.responseText);}catch{}
        if(xhr.status>=200&&xhr.status<300)resolve(result);
        else reject(new Error(result.error||'Upload failed. Please try again.'));
      };
      xhr.onerror=()=>reject(new Error('Upload connection failed.'));
      xhr.ontimeout=()=>reject(new Error('Upload timed out. Try a smaller file or check the service.'));
      xhr.send(formData);
    });
  }
  ui['upload-form'].addEventListener('submit',async event=>{
    event.preventDefault();
    if(!creator?.admin)return;
    const file=ui['media-file'].files?.[0];
    if(!file){notice(ui['upload-notice'],'Choose a photo or video first.','error');return;}
    if(file.size>100*1024*1024){notice(ui['upload-notice'],'File exceeds the 100 MB limit.','error');return;}
    const price=validPrice(ui['media-price'].value);
    if(!price){notice(ui['upload-notice'],'Set a valid CAD price between 1.00 and 1000.00 with two decimal places.','error');return;}
    const paypalUrl=ui['media-paypal'].value.trim();
    const linkError=checkLinkForPrice(price,paypalUrl);
    if(linkError){notice(ui['upload-notice'],linkError,'error');return;}
    const body=new FormData();
    body.set('file',file);
    body.set('title',ui['media-title'].value.trim());
    body.set('description',ui['media-description'].value.trim());
    body.set('price',price);
    body.set('paypalUrl',paypalUrl);
    busy(ui['publish-button'],true,'PUBLISHING…');
    show(ui['progress-wrap'],true);
    ui['upload-progress'].value=0;
    notice(ui['upload-notice'],'Uploading '+file.name+'…');
    try{
      await uploadMedia(body,p=>ui['upload-progress'].value=p);
      ui['upload-form'].reset();
      ui['media-price'].value='10.00';
      ui['media-paypal'].value=DEFAULT_PAYPAL;
      resetPreview();
      notice(ui['upload-notice'],'Published! Your item and price now appear in the public gallery.','success');
      notice(ui['status-banner'],'Latest upload published. Check the public gallery to review the locked card.','success');
      await loadLibrary();
    }catch(err){notice(ui['upload-notice'],err.message,'error');}
    finally{busy(ui['publish-button'],false);show(ui['progress-wrap'],false);}
  });
  const tag=(name,className,text)=>{
    const node=document.createElement(name);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  async function previewItem(item,target,trigger) {
    busy(trigger,true,'LOADING…');
    try{
      const ticket=await call('/api/media/'+encodeURIComponent(item.id)+'/ticket',{method:'POST'});
      if(typeof ticket.url!=='string'||!ticket.url.startsWith(API+'/api/media/'))throw new Error('Media preview was unavailable.');
      target.replaceChildren();
      const isVideo=item.type?.startsWith('video/');
      const media=document.createElement(isVideo?'video':'img');
      media.src=ticket.url;
      media.referrerPolicy='no-referrer';
      if(isVideo){media.controls=true;media.playsInline=true;media.preload='metadata';}
      else media.alt=item.title;
      target.append(media);
      show(target,true);
    }catch(err){notice(ui['library-notice'],err.message,'error');}
    finally{busy(trigger,false);}
  }
  function openEditor(item){
    ui['edit-id'].value=item.id;
    ui['edit-title-input'].value=item.title||'';
    ui['edit-description'].value=item.description||'';
    ui['edit-price'].value=((item.priceCents||1000)/100).toFixed(2);
    ui['edit-paypal'].value=item.paypalUrl||DEFAULT_PAYPAL;
    notice(ui['edit-notice'],'');
    show(ui['edit-panel'],true);
    ui['edit-panel'].scrollIntoView({behavior:'smooth',block:'start'});
    ui['edit-title-input'].focus({preventScroll:true});
  }
  function renderLibrary(items){
    ui['media-list'].replaceChildren();
    ui['media-count'].textContent=String(items.length);
    if(!items.length){
      notice(ui['library-notice'],'No media published yet. Upload your first image or video above.');
      return;
    }
    notice(ui['library-notice'],'You have '+items.length+' published gallery item'+(items.length===1?'':'s')+'.');
    items.forEach(item=>{
      const isVideo=item.type?.startsWith('video/');
      const row=tag('article','media-row');
      const symbol=tag('div','media-symbol',isVideo?'▶':'▣');
      symbol.setAttribute('aria-hidden','true');
      const body=tag('div','media-details');
      body.append(tag('h3','',item.title||'Untitled'),tag('span','media-price',money(item.priceCents||1000)+' CAD'));
      if(item.description)body.append(tag('p','',item.description));
      body.append(tag('p','',isVideo?'VIDEO · LOCKED':'PHOTO · LOCKED'));
      const actions=tag('div','media-actions');
      const edit=tag('button','button quiet','EDIT PRICE / DETAILS');
      edit.type='button';
      edit.addEventListener('click',()=>openEditor(item));
      const view=tag('button','button quiet','PREVIEW');
      view.type='button';
      const preview=tag('div','item-preview');
      show(preview,false);
      view.addEventListener('click',()=>void previewItem(item,preview,view));
      const remove=tag('button','button quiet','DELETE');
      remove.type='button';
      remove.addEventListener('click',async()=>{
        if(!confirm('Permanently delete "'+item.title+'" from the gallery?'))return;
        busy(remove,true,'DELETING…');
        try{
          await call('/api/admin/media/'+encodeURIComponent(item.id),{method:'DELETE'});
          notice(ui['status-banner'],'Media removed from the public gallery.','success');
          if(ui['edit-id'].value===item.id)show(ui['edit-panel'],false);
          await loadLibrary();
        }catch(err){notice(ui['library-notice'],err.message,'error');busy(remove,false);}
      });
      actions.append(edit,view,remove);
      body.append(actions,preview);
      row.append(symbol,body);
      ui['media-list'].append(row);
    });
  }
  async function loadLibrary(){
    if(!creator?.admin)return;
    try{
      const result=await call('/api/media');
      uploads=Array.isArray(result.items)?result.items:[];
      renderLibrary(uploads);
    }catch(err){notice(ui['library-notice'],err.message,'error');}
  }
  ui['reload-media'].addEventListener('click',()=>void loadLibrary());
  ui['close-edit'].addEventListener('click',()=>show(ui['edit-panel'],false));
  ui['edit-form'].addEventListener('submit',async event=>{
    event.preventDefault();
    if(!creator?.admin)return;
    const price=validPrice(ui['edit-price'].value);
    if(!price){notice(ui['edit-notice'],'Enter a valid price with two decimals.','error');return;}
    const paypalUrl=ui['edit-paypal'].value.trim();
    const linkError=checkLinkForPrice(price,paypalUrl);
    if(linkError){notice(ui['edit-notice'],linkError,'error');return;}
    busy(ui['save-edit'],true,'SAVING…');
    try{
      await call('/api/admin/media/'+encodeURIComponent(ui['edit-id'].value),{
        method:'PATCH',
        body:JSON.stringify({
          title:ui['edit-title-input'].value.trim(),
          description:ui['edit-description'].value.trim(),
          price,paypalUrl
        })
      });
      show(ui['edit-panel'],false);
      notice(ui['status-banner'],'Price and item details updated in your gallery.','success');
      await loadLibrary();
    }catch(err){notice(ui['edit-notice'],err.message,'error');}
    finally{busy(ui['save-edit'],false);}
  });
  void init();
})();
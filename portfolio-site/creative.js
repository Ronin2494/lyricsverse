// Creative Library: progressive enhancement. Profile links always work without JavaScript.
// Individual verified video posts are configured in creative-posts.json (no API key).
(()=>{
  const host=document.getElementById('creative');
  if(!host)return;
  const grid=host.querySelector('#creative-grid');
  const filters=[...host.querySelectorAll('.creative-filters button')];
  const counter=host.querySelector('#creative-count');
  const validCategories=new Set(['video','music','dance','writing']);
  let current='all';
  const noun=n=>String(n).padStart(2,'0')+(n===1?' COLLECTION':' COLLECTIONS');

  function refresh(){
    let visible=0;
    const cards=[...grid.querySelectorAll('.creative-card')];
    cards.forEach(card=>{
      const allowed=(card.dataset.category||'').split(/\s+/);
      const show=current==='all'||allowed.includes(current);
      card.hidden=!show;
      if(show)visible++;
    });
    counter.textContent=noun(visible);
  }
  filters.forEach(button=>button.addEventListener('click',()=>{
    current=button.dataset.filter;
    filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    refresh();
  }));
  refresh();

  function readVideo(raw){
    if(!raw||typeof raw!=='object'||typeof raw.url!=='string'||typeof raw.title!=='string'||!raw.title.trim())return null;
    let url;
    try{url=new URL(raw.url)}catch{return null}
    if(url.protocol!=='https:')return null;
    const host=url.hostname.toLowerCase().replace(/^www\./,'');
    const path=url.pathname;
    let kind='',id='',embed='';
    if(host==='youtube.com'||host==='m.youtube.com'||host==='youtu.be'){
      id=host==='youtu.be'?path.split('/')[1]:(path.startsWith('/shorts/')?path.split('/')[2]:url.searchParams.get('v'));
      if(!/^[a-zA-Z0-9_-]{11}$/.test(id||''))return null;
      kind='youtube';embed='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1';
    }else if(host==='instagram.com' && /^\/(reel|p)\/[a-zA-Z0-9_-]+\/?/.test(path)){
      const found=path.match(/^\/(reel|p)\/([a-zA-Z0-9_-]+)/);
      kind='instagram';id=found[2];embed='https://www.instagram.com/'+found[1]+'/'+id+'/embed/';
    }else if(host==='vimeo.com' && /^\/\d+\/?$/.test(path)){
      kind='vimeo';id=path.split('/')[1];embed='https://player.vimeo.com/video/'+id+'?autoplay=1';
    }else if(host==='tiktok.com' && /\/video\/\d+/.test(path)){
      const found=path.match(/\/video\/(\d+)/);
      kind='tiktok';id=found[1];embed='https://www.tiktok.com/embed/v2/'+id;
    }else return null;
    const cat=typeof raw.category==='string'&&validCategories.has(raw.category)?raw.category:'video';
    return {kind,id,embed,cat,url:url.href,title:raw.title.trim().slice(0,110),
      description:typeof raw.description==='string'?raw.description.slice(0,250):'',
      creator:typeof raw.creator==='string'?raw.creator.slice(0,55):''};
  }
  function element(tag,cls,text){
    const e=document.createElement(tag); if(cls)e.className=cls;if(text)e.textContent=text;return e;
  }
  const player=document.createElement('dialog');
  player.className='creative-player';
  player.setAttribute('aria-label','Video player');
  const playerBar=element('div','creative-player-bar');
  const playerTitle=element('strong','','Video');
  const close=element('button','creative-player-close','Close ×'); close.type='button';
  const frame=element('div','creative-player-frame');
  const orig=element('a','creative-player-original','Open original ↗');
  orig.target='_blank';orig.rel='noopener noreferrer';
  playerBar.append(playerTitle,close);player.append(playerBar,frame,orig);
  host.append(player);
  const dismiss=()=>player.close();
  close.addEventListener('click',dismiss);
  player.addEventListener('click',event=>{if(event.target===player)dismiss()});
  player.addEventListener('close',()=>frame.replaceChildren());

  function showVideo(item){
    frame.replaceChildren();
    const iframe=document.createElement('iframe');
    iframe.src=item.embed;
    iframe.title=item.title;
    iframe.loading='eager';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;
    frame.append(iframe);
    playerTitle.textContent=item.title;
    orig.href=item.url;
    if(typeof player.showModal==='function')player.showModal();
    else window.open(item.url,'_blank','noopener,noreferrer');
  }

  function makeCard(item,index){
    const card=element('article','creative-card creative-video creative-'+item.kind);
    card.dataset.category='video '+item.cat;
    const art=element('div','creative-art');
    art.setAttribute('aria-hidden','true');
    if(item.kind==='youtube')art.style.backgroundImage='linear-gradient(0deg, #080e23dd, transparent),url("https://i.ytimg.com/vi/'+item.id+'/hqdefault.jpg")';
    const preview=element('button','creative-video-launch','▶');
    preview.type='button';preview.setAttribute('aria-label','Play '+item.title);
    preview.addEventListener('click',()=>showVideo(item));
    const top=element('div','creative-top');
    top.append(element('span','',String(index+7).padStart(2,'0')+' / '+item.kind.toUpperCase()+' VIDEO'),element('span','creative-external','↗'));
    const copy=element('div','creative-copy');
    copy.append(element('h3','',item.title));
    if(item.description)copy.append(element('p','',item.description));
    if(item.creator)copy.append(element('small','creative-video-by','By '+item.creator));
    const link=element('a','creative-action','OPEN ORIGINAL ↗');
    link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';
    copy.append(link);card.append(art,top,preview,copy);
    return card;
  }

  fetch('creative-posts.json',{cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .then(manifest=>{
      if(!manifest||!Array.isArray(manifest.items))return;
      manifest.items.slice(0,24).forEach((raw,index)=>{
        const item=readVideo(raw);
        if(item)grid.append(makeCard(item,index));
      });
      refresh();
    })
    .catch(()=>{/* Keep verified profile collection cards working offline. */});
})();
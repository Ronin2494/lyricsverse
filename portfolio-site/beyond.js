/* Beyond the Screen: all content is rendered as text, not injected HTML. */
(()=>{
  'use strict';
  const buttons=[...document.querySelectorAll('#beyond-grid [data-interest]')];
  const panel=document.getElementById('beyond-detail');
  const body=document.getElementById('beyond-detail-content');
  const close=document.getElementById('beyond-close');
  if(!buttons.length||!panel||!body||!close)return;
  const API='https://badbunny-membership-api.onrender.com';
  const HEADINGS={
    music:['01 / RHYTHM','A life in sound.','Original compositions and singing performances from my channels.'],
    movement:['02 / MOVEMENT','Every step counts.','Two simple markers of how I moved today.'],
    presence:['03 / PRESENCE','Space to be still.','Meditation and mindfulness sessions, shared when published.'],
    questions:['04 / CURIOSITY','Questions in motion.','Questions I have chosen to share from my notes.']
  };
  let active=null;
  let records=[];
  let catalog=[];
  const make=(tag,cls,txt)=>{
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(txt!==undefined)e.textContent=String(txt);
    return e;
  };
  const append=(root,...nodes)=>{nodes.forEach(n=>root.append(n));return root;};
  const heading=(label)=>make('h4','beyond-section-title',label);
  const empty=(label)=>make('p','beyond-empty',label);
  const editor=()=>{
    const link=make('a','beyond-editor-link','EDIT MY COLLECTION ↗');
    link.href='creative-editor.html';
    link.setAttribute('aria-label','Open the private creative editor to manage compositions, videos, questions and activity');
    return link;
  };
  const validMediaURL=url=>{
    try{
      const u=new URL(url);
      if(u.protocol!=='https:')return null;
      const host=u.hostname.toLowerCase();
      if(['www.youtube.com','youtube.com','m.youtube.com'].includes(host)){
        return u.pathname==='/watch'||u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/live/')?u.href:null;
      }
      if(host==='youtu.be')return u.pathname.length>2?u.href:null;
      if(['instagram.com','www.instagram.com'].includes(host)){
        return /^\/(reel|p|tv)\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname)?u.href:null;
      }
      return null;
    }catch{return null;}
  };
  const mediaCard=item=>{
    const url=validMediaURL(item.url);
    if(!url)return null;
    const a=make('a','beyond-media-link');
    a.href=url;a.target='_blank';a.rel='noopener noreferrer';
    const service=new URL(url).hostname.includes('instagram')?'INSTAGRAM':'YOUTUBE';
    const visual=make('div','beyond-media-thumb');
    visual.setAttribute('aria-hidden','true');
    visual.textContent=service;
    append(a,visual,make('span','beyond-media-meta',service+' · WATCH VIDEO ↗'),
      make('strong','',item.title||'Untitled performance'));
    return a;
  };
  function renderMusic(){
    const wrap=make('div','');
    const compositions=records.filter(r=>r.kind==='composition');
    const originals=make('div','beyond-subsection');
    originals.append(heading('ORIGINAL COMPOSITIONS'));
    if(compositions.length){
      const grid=make('div','beyond-compositions');
      compositions.forEach(r=>{
        const card=make('article','beyond-composition');
        append(card,make('span','beyond-media-meta','ORIGINAL WRITING'),
          make('strong','',r.title),make('p','',r.body));
        grid.append(card);
      });
      originals.append(grid);
    }else originals.append(empty('My composition shelf is ready. I can publish original lyrics, poems and writing from the private editor.'));
    wrap.append(originals);
    const gallery=make('div','beyond-subsection');
    gallery.append(heading('SINGING & PERFORMANCE'));
    const known=catalog.filter(x=>x.category==='music');
    const custom=records.filter(x=>x.kind==='music');
    const seen=new Set();
    const media=[...custom,...known].filter(x=>{
      const url=validMediaURL(x.url);
      if(!url||seen.has(url))return false;
      seen.add(url);return true;
    });
    if(media.length){
      const grid=make('div','beyond-media-grid');
      media.forEach(r=>{const card=mediaCard(r);if(card)grid.append(card);});
      gallery.append(grid);
    }else gallery.append(empty('Verified singing videos will appear here when available.'));
    wrap.append(gallery,editor());
    return wrap;
  }
  const todayKey=()=>{
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return [p.year,p.month,p.day].join('-');
  };
  function renderMovement(){
    const wrap=make('div','');
    const today=todayKey();
    const entry=records.find(x=>x.kind==='activity'&&x.date===today);
    const grid=make('div','beyond-activity-grid');
    const data=[
      ['01 / DAILY STEPS',entry?new Intl.NumberFormat('en-CA').format(entry.steps):'—',
        entry?'STEPS · WALKING & MOVEMENT':'No steps recorded for today'],
      ['02 / ACTIVE CALORIES',entry?new Intl.NumberFormat('en-CA').format(entry.activeCalories):'—',
        entry?'KCAL · ACTIVE ENERGY':'No active calories recorded for today']
    ];
    data.forEach(d=>{
      const card=make('div','beyond-activity-card');
      append(card,make('span','beyond-activity-caption',d[0]),
        make('strong','beyond-activity-value',d[1]),
        make('span','beyond-activity-foot',d[2]));
      grid.append(card);
    });
    wrap.append(grid,make('p','beyond-activity-date',
      'TODAY · '+today+' · TORONTO TIME · '+(entry?'RECORDED ACTIVITY':'AWAITING AN ENTRY')));
    wrap.append(editor());
    return wrap;
  }
  function renderPresence(){
    const wrap=make('div','');
    wrap.append(heading('MEDITATION VIDEOS'));
    const clips=records.filter(r=>r.kind==='meditation').filter(r=>validMediaURL(r.url));
    if(clips.length){
      const grid=make('div','beyond-media-grid');
      clips.forEach(r=>{const card=mediaCard(r);if(card)grid.append(card);});
      wrap.append(grid);
    }else wrap.append(empty('No meditation videos have been published yet. I can add verified YouTube and Instagram sessions from the private editor.'));
    wrap.append(editor());
    return wrap;
  }
  function renderQuestions(){
    const wrap=make('div','');
    const questions=records.filter(r=>r.kind==='question');
    if(!questions.length){
      wrap.append(empty('I have not published any questions from my notes yet. They will form a living word cloud as I add them.'));
    }else{
      const cloud=make('div','beyond-cloud');
      cloud.setAttribute('aria-label','Questions selected from my notes');
      const selected=make('p','beyond-selected-question','Select a question in the cloud to read it here.');
      selected.setAttribute('aria-live','polite');
      questions.forEach(q=>{
        const word=make('button','beyond-cloud-word',q.title);
        word.type='button';
        word.addEventListener('click',()=>{
          selected.textContent=q.body||q.title;
        });
        cloud.append(word);
      });
      wrap.append(cloud,selected);
    }
    wrap.append(editor());
    return wrap;
  }
  const renderers={music:renderMusic,movement:renderMovement,presence:renderPresence,questions:renderQuestions};
  function open(kind,shouldFocus=true){
    if(!renderers[kind])return;
    active=kind;
    const h=HEADINGS[kind];
    document.getElementById('beyond-detail-index').textContent=h[0];
    document.getElementById('beyond-detail-title').textContent=h[1];
    document.getElementById('beyond-detail-description').textContent=h[2];
    panel.dataset.active=kind;
    body.replaceChildren(renderers[kind]());
    panel.hidden=false;
    buttons.forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.interest===kind)));
    if(shouldFocus){
      panel.focus({preventScroll:true});
      panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }
  }
  const dismiss=()=>{
    const back=buttons.find(b=>b.dataset.interest===active);
    panel.hidden=true;active=null;delete panel.dataset.active;
    buttons.forEach(b=>b.setAttribute('aria-expanded','false'));
    if(back)back.focus({preventScroll:true});
  };
  buttons.forEach(b=>b.addEventListener('click',()=>{
    if(active===b.dataset.interest) dismiss();
    else open(b.dataset.interest);
  }));
  close.addEventListener('click',dismiss);
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss();});

  async function load(){
    const [saved,posts]=await Promise.allSettled([
      fetch(API+'/api/creative',{headers:{Accept:'application/json'}}).then(r=>{
        if(!r.ok)throw Error('Creative data is unavailable');
        return r.json();
      }),
      fetch('creative-posts.json').then(r=>{if(!r.ok)throw Error('Media list unavailable');return r.json();})
    ]);
    records=saved.status==='fulfilled'&&Array.isArray(saved.value.items)?saved.value.items:[];
    catalog=posts.status==='fulfilled'&&Array.isArray(posts.value.items)?posts.value.items:[];
    if(active)open(active,false);
  }
  void load();
})();

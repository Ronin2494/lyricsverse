import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getBannerIndex, mountSongBannerSlider, stopSongBannerSlider} from '../src/song-banner-slider.js';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');

function element(dataset={}){
 const attributes={}, listeners=new Map(), classes=new Set();
 return {
  dataset, attributes, listeners, tabIndex:0, textContent:'',
  classList:{
   add(value){classes.add(value);},
   remove(value){classes.delete(value);},
   toggle(value,on){if(on)classes.add(value);else classes.delete(value);},
   contains(value){return classes.has(value);}
  },
  setAttribute(key,value){attributes[key]=value;},
  addEventListener(type,callback){listeners.set(type,callback);},
  removeEventListener(type){listeners.delete(type);},
  querySelector(){return null;},
  closest(){return null;}
 };
}

test('snap indicator stays in bounds across viewport sizes',()=>{
 assert.equal(getBannerIndex(0,400,4),0);
 assert.equal(getBannerIndex(400,400,4),1);
 assert.equal(getBannerIndex(799,400,4),2);
 assert.equal(getBannerIndex(99999,300,4),3);
 assert.equal(getBannerIndex(-20,300,4),0);
 assert.equal(getBannerIndex(100,0,4),0);
 assert.equal(getBannerIndex(100,400,0),0);
});

test('carousel navigation updates links, dots and slide announcements',()=>{
 const track=element(), slides=Array.from({length:4},(_,i)=>{
  const slide=element({songTitle:'Song '+i});
  slide.offsetLeft=i*300;
  const link=element();slide.querySelector=()=>link;slide.link=link;
  return slide;
 }), dots=slides.map((_,i)=>element({bannerDot:String(i)}));
 track.clientWidth=300;track.scrollLeft=0;
 track.scrollTo=({left})=>{track.scrollLeft=left;};
 const counter=element(), status=element();
 const root=element();
 root.querySelector=key=>({
  '[data-banner-track]':track,'[data-banner-count]':counter,'[data-banner-status]':status
 })[key]||null;
 root.querySelectorAll=key=>({
  '[data-banner-slide]':slides,'[data-banner-dot]':dots
 })[key]||[];
 const win={matchMedia:()=>({matches:true}),requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){}};
 mountSongBannerSlider(root,win);
 assert.equal(counter.textContent,'01 / 04');
 assert.equal(dots[0].attributes['aria-current'],'true');
 assert.equal(slides[0].link.tabIndex,0);
 assert.equal(slides[1].link.tabIndex,-1);
 const next=element({bannerStep:'1'});
 root.listeners.get('click')({target:{closest:key=>key==='[data-banner-step]'?next:null},preventDefault(){}});
 assert.equal(track.scrollLeft,300);
 assert.equal(counter.textContent,'02 / 04');
 assert.equal(dots[1].attributes['aria-current'],'true');
 assert.equal(slides[1].link.tabIndex,0);
 assert.equal(slides[0].link.tabIndex,-1);
 assert.match(status.textContent,/Featured song 2 of 4: Song 1/);
 track.listeners.get('keydown')({key:'ArrowRight',preventDefault(){}});
 assert.equal(track.scrollLeft,600);
 const first=element({bannerDot:'0'});
 root.listeners.get('click')({target:{closest:key=>key==='[data-banner-dot]'?first:null},preventDefault(){}});
 assert.equal(track.scrollLeft,0);
 stopSongBannerSlider();
 assert.equal(root.listeners.size,0);
 assert.equal(track.listeners.size,0);
});

test('homepage replaces the orb field with semantic, compact song banners',()=>{
 const app=read('src/app.js'),css=read('styles.css');
 assert.match(app,/function featuredSongBannersHTML\(songs\)/);
 assert.match(app,/featuredSongBannersHTML\(matching\)/);
 assert.match(app,/data-banner-track/);
 assert.match(app,/data-banner-slide/);
 assert.match(app,/data-banner-dot/);
 assert.match(app,/class="song-banner-link"/);
 assert.match(app,/songHref\(song\)/);
 assert.match(app,/mountSongBannerSlider\(document\.querySelector\('\.featured-song-carousel'\)\)/);
 assert.doesNotMatch(app,/floatingPearlsHTML|mountMusicOrbs|holographic-orbs/);
 assert.match(css,/\.featured-song-carousel \.song-banner-track/);
 assert.match(css,/scroll-snap-type:x mandatory/);
 assert.match(css,/\.featured-song-carousel \.song-banner-link/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

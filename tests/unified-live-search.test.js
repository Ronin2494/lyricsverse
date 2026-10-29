import test from 'node:test';
import assert from 'node:assert/strict';
import { searchYouTubeVideos, parseYouTubeVideoResults, youtubeSearchLink } from '../api/src/video-search.mjs';
import { publishedLyricsTextMatches } from '../src/internal-links.js';
import { createHandler } from '../api/src/handler.mjs';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const uploaded={_id:'507f1f77bcf86cd799439011',title:'Song',artist:'Singer',status:'published',accessTier:'free',lyrics:'The world is brighter when you sing'};
const ytItem=(id,title='Example Music',channelTitle='Music Official')=>({id:{videoId:id},snippet:{title,channelTitle}});
test('YouTube results only retain verified safe video IDs, human titles, and deduplicate',()=>{
 const items=[ytItem('ABC123xyz09'),ytItem('ABC123xyz09'),ytItem('bad"><script>'),ytItem('0123456789_','Second Song','Official Channel'),{id:{videoId:'good1234567'},snippet:{title:'',channelTitle:'Empty'}}];
 const result=parseYouTubeVideoResults(items);
 assert.equal(result.length,2);
 assert.equal(result[0].videoId,'ABC123xyz09');
 assert.equal(result[0].thumbnail,'https://i.ytimg.com/vi/ABC123xyz09/hqdefault.jpg');
 assert.equal(result[1].watchUrl,'https://www.youtube.com/watch?v=0123456789_');
});
test('Video search validates query and requires backend key; never leaks credentials',async()=>{
 assert.equal((await searchYouTubeVideos('x',{apiKey:'anything'})).status,'query_too_short');
 const result=await searchYouTubeVideos('sample song search',{apiKey:''});
 assert.equal(result.status,'not_configured');
 assert.deepEqual(result.videos,[]);
 assert.ok(result.searchUrl.startsWith('https://www.youtube.com/results?'));
 assert.match(youtubeSearchLink('artist + title'),/artist%20%2B%20title/);
});
test('Video searches use official embeddable YouTube API and cache repeated queries',async()=>{
 let count=0;
 let queried='';
 const key='EXAMPLE_TEST_KEY';
 const fetcher=async url=>{count++;queried=url;return {ok:true,json:async()=>({items:[ytItem('ABC123xyz09')]})};};
 const opts={apiKey:key,fetcher,clock:()=>Date.parse('2026-10-21T14:00:00Z')};
 const first=await searchYouTubeVideos('my original unusual song lookup',opts);
 const second=await searchYouTubeVideos('MY ORIGINAL UNUSUAL SONG LOOKUP',opts);
 assert.equal(count,1);
 assert.equal(first.status,'ok');
 assert.deepEqual(first,second);
 assert.equal(first.videos.length,1);
 assert.match(queried,/videoEmbeddable=true/);
 assert.match(queried,/type=video/);
 assert.match(queried,/safeSearch=moderate/);
 assert.match(queried,/key=EXAMPLE_TEST_KEY/);
 assert.ok(!JSON.stringify(first).includes(key));
});
test('YouTube API unavailability uses source link instead of fake video cards',async()=>{
 const q='this will be unavailable 691';
 const result=await searchYouTubeVideos(q,{apiKey:'KEY',fetcher:async()=>({ok:false,status:503}),clock:()=>Date.parse('2026-10-21T15:00:00Z')});
 assert.equal(result.status,'unavailable');
 assert.equal(result.videos.length,0);
 assert.match(result.searchUrl,/youtube.com\/results/);
});
test('Published lyrics can match words in lyrics without exposing draft or premium tracks',()=>{
 assert.equal(publishedLyricsTextMatches('world brighter',[uploaded]).length,1);
 assert.equal(publishedLyricsTextMatches('WORLD brighter',[uploaded])[0].href,'#/original/507f1f77bcf86cd799439011');
 for(const bad of [{...uploaded,status:'draft'},{...uploaded,accessTier:'premium'},{...uploaded,_id:'INVALID'},{...uploaded,lyrics:''}]){
  assert.equal(publishedLyricsTextMatches('world',[bad]).length,0);
 }
 assert.equal(publishedLyricsTextMatches('unknown',[uploaded]).length,0);
});
test('Shared search supports a single input, live debouncing, existing lyrics sources and video cards',()=>{
 assert.match(app,/href="#\/search">Search<\/a>/);
 assert.match(app,/function startLiveMusicSearch\(\)/);
 assert.match(app,/setTimeout\(\(\)=>\{void loadProviderSearch\(\);\},450\)/);
 assert.match(app,/api\/v1\/providers\/discovery\/search\?q=/);
 assert.match(app,/api\/v1\/media\/videos\/search\?q=/);
 assert.match(app,/publishedLyricsTextMatches\(q,publishedSongs\)/);
 assert.match(app,/function videoResultsHTML\(\)/);
 assert.match(app,/youtube-nocookie\.com\/embed\//);
 assert.match(app,/data-video-search-id/);
 assert.match(app,/videoStatus==='not_configured'/);
 assert.match(app,/const localHTML='<section class="local-lyrics-results"/);
 assert.match(app,/return localHTML\+'<section class="provider-results"/);
 assert.match(css,/\.lv-video-grid/);
 assert.match(css,/@media \(max-width:650px\)/);
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(app,/function floatingPearlsHTML\(songs\)/);
});
test('Server endpoint validates query and returns unavailable status without YouTube key',async()=>{
 const handler=createHandler({env:{CORS_ORIGIN:'https://lyricsverse.onrender.com'},checkDb:async()=>({available:true})});
 async function call(url){
  const response={status:0,headers:{},text:'',
   writeHead(code,headers){this.status=code;this.headers=headers;},
   end(value){this.text=value||'';}};
  await handler({url,method:'GET',headers:{}},response);
  return response;
 }
 const invalid=await call('/api/v1/media/videos/search?q=x');
 assert.equal(invalid.status,400);
 const okay=await call('/api/v1/media/videos/search?q=popular%20music');
 assert.equal(okay.status,200);
 const output=JSON.parse(okay.text);
 assert.equal(output.data.status,'not_configured');
 assert.equal(output.data.videos.length,0);
 assert.equal(okay.headers['Cache-Control'],'no-store');
});

test('Search sources follow the required local, web, other provider, video priority',()=>{
 const section=app.slice(app.indexOf('function providerResultsHTML(){'),app.indexOf('function searchWelcomeHTML(){'));
 assert.ok(section.includes('return localHTML+webHTML+'), 'web search must appear immediately after local results');
 assert.ok(section.indexOf('return localHTML+webHTML+')<section.lastIndexOf('videoResultsHTML()'), 'videos must render last');
 assert.match(section,/providerSongs\.find\(song=>song\.provider==='Web lyrics search'/);
 assert.match(section,/const webUrl=webResult\?\.url\|\|/, 'web search must work when provider has no result');
 assert.match(section,/providerError\?'<p>Additional providers are temporarily unavailable/, 'provider failure must not remove the web section');
 assert.match(section,/\['LRCLIB','Genius'\]/, 'other providers must be isolated from web search');
 assert.match(section,/No matching lyrics published on LyricVerse yet/, 'local empty state must be explicit');
});

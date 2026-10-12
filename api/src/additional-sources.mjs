const agent='LyricVerse/1.0 (https://lyricsverse.onrender.com)';
const cache=new Map();
const validUrl=url=>typeof url==='string'&&/^https:\/\//.test(url);
const providers=[
 {name:'LRCLIB',url:q=>'https://lrclib.net/api/search?q='+encodeURIComponent(q),map:body=>Array.isArray(body)?body.filter(r=>r.plainLyrics||r.syncedLyrics).map(r=>({title:r.trackName,artist:r.artistName,url:'https://lrclib.net/',hasLyrics:true})):[]},
 {name:'Genius',url:q=>'https://genius.com/api/search/song?q='+encodeURIComponent(q),map:body=>(body.response?.sections?.flatMap(s=>s.hits||[])||body.response?.hits||[]).map(h=>({title:h.result?.title,artist:h.result?.primary_artist?.name,url:h.result?.url}))}
];
export async function searchAdditionalSources(query,fetcher=fetch){
 const q=String(query||'').trim();if(q.length<2||q.length>120)return [];
 const key=q.toLocaleLowerCase(),hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.data;
 const results=await Promise.all(providers.map(async provider=>{try{
  const response=await fetcher(provider.url(q),{headers:{'User-Agent':agent,Accept:'application/json'},signal:AbortSignal.timeout(4500)});
  if(!response.ok)return null;const items=provider.map(await response.json());
  const terms=q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const ranked=items.filter(x=>x.title&&x.artist&&validUrl(x.url)&&terms.every(t=>(String(x.title)+' '+String(x.artist)).toLocaleLowerCase().includes(t))).sort((a,b)=>{
   const score=x=>terms.reduce((n,t)=>n+(String(x.title)+' '+String(x.artist)).toLocaleLowerCase().includes(t),0);
   return score(b)-score(a);
  });
  return ranked.length?{provider:provider.name,...ranked[0]}:null;
 }catch{return null;}}));
 const data=results.filter(Boolean);cache.set(key,{expires:Date.now()+300000,data});if(cache.size>100)cache.delete(cache.keys().next().value);return data;
}

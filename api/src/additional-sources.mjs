const agent='LyricVerse/1.0 (https://lyricsverse.onrender.com)';
export async function searchAdditionalSources(query,fetcher=fetch){
 const q=String(query||'').trim();if(q.length<2||q.length>120)return [];
 const sources=[
  {name:'MusicBrainz',url:'https://musicbrainz.org/ws/2/recording/?query='+encodeURIComponent(q)+'&fmt=json&limit=5',map:body=>(body.recordings||[]).map(r=>({title:r.title,artist:(r['artist-credit']||[]).map(a=>a.name||a.artist?.name||'').join(''),url:/^[0-9a-f-]{36}$/i.test(r.id||'')?'https://musicbrainz.org/recording/'+r.id:null}))},
  {name:'Apple Music',url:'https://itunes.apple.com/search?term='+encodeURIComponent(q)+'&entity=song&limit=5',map:body=>(body.results||[]).map(r=>({title:r.trackName,artist:r.artistName,url:r.trackViewUrl}))}
 ];
 const results=await Promise.all(sources.map(async s=>{try{const response=await fetcher(s.url,{headers:{'User-Agent':agent,Accept:'application/json'},signal:AbortSignal.timeout(4500)});if(!response.ok)return null;const body=await response.json();const items=s.map(body);const item=items.find(x=>x.title&&x.artist&&typeof x.url==='string'&&x.url.startsWith('https://'));return item?{provider:s.name,...item}:null;}catch{return null;}}));return results.filter(Boolean);
}

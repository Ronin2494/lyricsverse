const cache=new Map();
export async function searchLrclib(query, fetcher=fetch){
 const q=String(query||'').trim();if(q.length<2||q.length>120)return [];
 const key=q.toLocaleLowerCase();const hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.data;
 const url='https://lrclib.net/api/search?q='+encodeURIComponent(q);
 const response=await fetcher(url,{headers:{'User-Agent':'LyricVerse/1.0 (https://lyricsverse.onrender.com)','Accept':'application/json'},signal:AbortSignal.timeout(4500)});
 if(!response.ok)throw new Error('lrclib_unavailable');
 const rows=await response.json();if(!Array.isArray(rows))throw new Error('lrclib_invalid_response');
 const seen=new Set();const data=rows.slice(0,20).flatMap(r=>{
  const title=String(r.trackName||'').trim(),artist=String(r.artistName||'').trim();
  if(!title||!artist||!Number.isSafeInteger(r.id)||r.id<1)return [];
  const dedup=(title+'|'+artist).toLocaleLowerCase();if(seen.has(dedup))return [];seen.add(dedup);
  return [{id:'lrclib-'+r.id,title,artist,album:String(r.albumName||''),source:'https://lrclib.net/api/get/'+r.id,provider:'lrclib',hasLyrics:!!(r.plainLyrics||r.syncedLyrics),lyricsLicensed:false}];
 });
 cache.set(key,{expires:Date.now()+300000,data});if(cache.size>100)cache.delete(cache.keys().next().value);
 return data;
}

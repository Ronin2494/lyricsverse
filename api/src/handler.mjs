import { searchLrclib } from './lrclib.mjs';
import {saveRating,getRatingSummary} from './ratings.mjs';
import { adminAuthStatus, createAdminLyrics, listAdminLyrics } from './admin.mjs';
import { listPublishedSongs, getPublishedSong } from './repository.mjs';
import { getWikidataSongs } from './wikidata.mjs';
import { getAllSongs, getGenres, getLanguages, getLyrics, getSong, searchSongs } from './catalog.mjs';

export function jsonResponse(res, status, data, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  });
  res.end(JSON.stringify(data));
}
function allowedOrigin(req, env) {
  const origin = req.headers.origin;
  const allowed = new Set(['https://lyricsverse.onrender.com',env.CORS_ORIGIN, 'http://localhost:4173', 'http://127.0.0.1:4173'].filter(Boolean));
  if (!origin) return env.CORS_ORIGIN || 'https://lyricsverse.onrender.com';
  return allowed.has(origin) ? origin : null;
}
export function createHandler({ env = process.env, fetchCatalog = getWikidataSongs, listCatalog = listPublishedSongs, getCatalogSong = getPublishedSong, checkDb = async () => ({ available: false, reason: 'not_configured' }) } = {}) {
  return async (req, res) => {
    const origin = allowedOrigin(req, env);
    if (!origin) return jsonResponse(res, 403, { error: 'origin_not_allowed' }, 'null');
    if (req.method === 'OPTIONS') return jsonResponse(res, 204, null, origin);
    if (!['GET','HEAD','POST'].includes(req.method)) return jsonResponse(res, 405, { error: 'method_not_allowed' }, origin);
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return jsonResponse(res, 400, { error: 'invalid_url' }, origin); }
    try {
      if (url.pathname === '/api/v1/admin/session') {
        if(req.method!=='GET') return jsonResponse(res,405,{error:'method_not_allowed'},origin);
        const auth=adminAuthStatus(req,env);
        if(auth==='not_configured') return jsonResponse(res,503,{error:'admin_key_not_configured'},origin);
        if(auth!=='ok') return jsonResponse(res,401,{error:'invalid_admin_key'},origin);
        return jsonResponse(res,200,{authenticated:true},origin);
      }
      if (url.pathname === '/api/v1/admin/lyrics') {
        const auth=adminAuthStatus(req,env);
        if(auth==='not_configured') return jsonResponse(res,503,{error:'admin_key_not_configured'},origin);
        if(auth!=='ok') return jsonResponse(res,401,{error:'invalid_admin_key'},origin);
        if(req.method==='GET') {try{return jsonResponse(res,200,{data:await listAdminLyrics()},origin);}catch(e){console.error('Admin list failed:',e?.message);return jsonResponse(res,503,{error:'database_unavailable'},origin);}}
        if(req.method!=='POST') return jsonResponse(res,405,{error:'method_not_allowed'},origin);
        const length=Number(req.headers['content-length']||0);
        if(length>75000) return jsonResponse(res,413,{error:'payload_too_large'},origin);
        let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>75000)return jsonResponse(res,413,{error:'payload_too_large'},origin);}
        let body;try{body=JSON.parse(raw);}catch{return jsonResponse(res,400,{error:'invalid_json'},origin);}
        try{return jsonResponse(res,201,{data:await createAdminLyrics(body)},origin);}catch(e){const validation=['invalid_payload','required_fields_missing','invalid_language','invalid_status','invalid_access_tier'];if(!validation.includes(e.message)){console.error('Admin save failed:',e?.message);return jsonResponse(res,503,{error:'database_write_failed'},origin);}return jsonResponse(res,400,{error:e.message},origin);}
      }
      if (url.pathname === '/api/v1/ratings') {
        if (req.method === 'GET') {
          try { return jsonResponse(res,200,{data:await getRatingSummary()},origin); }
          catch { return jsonResponse(res,503,{error:'database_unavailable'},origin); }
        }
        if (req.method !== 'POST') return jsonResponse(res,405,{error:'method_not_allowed'},origin);
        let raw='';
        for await (const chunk of req) { raw+=chunk; if(raw.length>1024) return jsonResponse(res,413,{error:'payload_too_large'},origin); }
        let body;
        try { body=JSON.parse(raw); } catch { return jsonResponse(res,400,{error:'invalid_json'},origin); }
        if (!body || !Number.isInteger(body.rating) || body.rating<1 || body.rating>5 || typeof body.visitorId!=='string' || !/^[a-f0-9-]{36}$/.test(body.visitorId))
          return jsonResponse(res,400,{error:'invalid_rating_payload'},origin);
        try { await saveRating(body); return jsonResponse(res,200,{data:await getRatingSummary()},origin); }
        catch { return jsonResponse(res,503,{error:'database_unavailable'},origin); }
      }
      if(req.method==='POST') return jsonResponse(res,405,{error:'method_not_allowed'},origin);
      if (url.pathname === '/health') {
        const db = await checkDb();
        return jsonResponse(res, 200, { service: 'lyricsverse-api', status: 'ok', database: db.available ? 'connected' : 'not_connected', catalog: 'original_demo', ...(!db.available ? { detail: db.reason } : {}) }, origin);
      }
      if (url.pathname === '/api/v1/wikidata/songs') { const language=url.searchParams.get('language')||'en'; if(!['en','hi','pa'].includes(language))return jsonResponse(res,400,{error:'unsupported_language'},origin); try {const data=await fetchCatalog(language);return jsonResponse(res,200,{data,total:data.length,source:'wikidata',lyricsLicensed:false},origin);}catch{return jsonResponse(res,503,{error:'catalog_temporarily_unavailable',data:[]},origin);} }
      if (url.pathname === '/api/v1/catalog/songs') {
        const language = url.searchParams.get('language') || '';
        if (language && !['en','hi','pa'].includes(language)) return jsonResponse(res,400,{error:'unsupported_language'},origin);
        const limit = Number(url.searchParams.get('limit') || 24);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) return jsonResponse(res,400,{error:'invalid_limit'},origin);
        try { const data = await listCatalog({ language, limit }); return jsonResponse(res,200,{data,total:data.length,source:'mongodb'},origin); }
        catch { return jsonResponse(res,503,{error:'database_unavailable'},origin); }
      }
      const catalogMatch = url.pathname.match(/^\/api\/v1\/catalog\/songs\/([a-f0-9]{24})$/i);
      if (catalogMatch) {
        try { const song = await getCatalogSong(catalogMatch[1]); return song ? jsonResponse(res,200,{data:song},origin) : jsonResponse(res,404,{error:'song_not_found'},origin); }
        catch { return jsonResponse(res,503,{error:'database_unavailable'},origin); }
      }
      if (url.pathname === '/api/v1/languages') return jsonResponse(res, 200, { data: getLanguages() }, origin);
      if (url.pathname === '/api/v1/genres') {
        const language = url.searchParams.get('language') || 'en';
        if (!['en','hi'].includes(language)) return jsonResponse(res, 400, { error: 'unsupported_language' }, origin);
        return jsonResponse(res, 200, { data: getGenres(language) }, origin);
      }
      if (url.pathname === '/api/v1/songs') {
        const language = url.searchParams.get('language') || '';
        if (language && !['en','hi'].includes(language)) return jsonResponse(res, 400, { error: 'unsupported_language' }, origin);
        const songs = getAllSongs().filter(s => !language || s.language === language);
        return jsonResponse(res, 200, { data: songs, total: songs.length }, origin);
      }
      if (url.pathname === '/api/v1/providers/lrclib/search') {
        const q=(url.searchParams.get('q')||'').trim();
        if(q.length<2||q.length>120)return jsonResponse(res,400,{error:'invalid_query'},origin);
        try{const data=await searchLrclib(q);return jsonResponse(res,200,{data,total:data.length,source:'lrclib',lyricsLicensed:false},origin);}
        catch{return jsonResponse(res,503,{error:'provider_unavailable',data:[]},origin);}
      }
      if (url.pathname === '/api/v1/search') {
        const q = url.searchParams.get('q') ?? '';
        if (q.length > 120) return jsonResponse(res, 400, { error: 'query_too_long' }, origin);
        const language = url.searchParams.get('language') || '';
        if (language && !['en','hi'].includes(language)) return jsonResponse(res, 400, { error: 'unsupported_language' }, origin);
        return jsonResponse(res, 200, { data: searchSongs(q, language), query: q, language: language || 'all' }, origin);
      }
      const match = url.pathname.match(/^\/api\/v1\/songs\/([a-z0-9-]{1,80})$/);
      if (match) {
        const s = getSong(match[1]);
        return s ? jsonResponse(res, 200, { data: s }, origin) : jsonResponse(res, 404, { error: 'song_not_found' }, origin);
      }
      const lm = url.pathname.match(/^\/api\/v1\/lyrics\/([a-z0-9-]{1,80})$/);
      if (lm) {
        const track = getSong(lm[1]);
        return track ? jsonResponse(res, 200, { data: getLyrics(lm[1]) }, origin) : jsonResponse(res, 404, { error: 'song_not_found' }, origin);
      }
      return jsonResponse(res, 404, { error: 'not_found' }, origin);
    } catch (error) {
      console.error('Request failed:', error?.message || 'unknown error');
      return jsonResponse(res, 500, { error: 'internal_error' }, origin);
    }
  };
}

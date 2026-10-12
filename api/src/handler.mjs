import { getAllSongs, getGenres, getLanguages, getLyrics, getSong, searchSongs } from './catalog.mjs';

export function jsonResponse(res, status, data, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  });
  res.end(JSON.stringify(data));
}
function allowedOrigin(req, env) {
  const origin = req.headers.origin;
  const allowed = new Set([env.CORS_ORIGIN, 'http://localhost:4173', 'http://127.0.0.1:4173'].filter(Boolean));
  if (!origin) return env.CORS_ORIGIN || 'https://lyricsverse.onrender.com';
  return allowed.has(origin) ? origin : null;
}
export function createHandler({ env = process.env, checkDb = async () => ({ available: false, reason: 'not_configured' }) } = {}) {
  return async (req, res) => {
    const origin = allowedOrigin(req, env);
    if (!origin) return jsonResponse(res, 403, { error: 'origin_not_allowed' }, 'null');
    if (req.method === 'OPTIONS') return jsonResponse(res, 204, null, origin);
    if (req.method !== 'GET' && req.method !== 'HEAD') return jsonResponse(res, 405, { error: 'method_not_allowed' }, origin);
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return jsonResponse(res, 400, { error: 'invalid_url' }, origin); }
    try {
      if (url.pathname === '/health') {
        const db = await checkDb();
        return jsonResponse(res, 200, { service: 'lyricsverse-api', status: 'ok', database: db.available ? 'connected' : 'not_connected', catalog: 'original_demo', ...(!db.available ? { detail: db.reason } : {}) }, origin);
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

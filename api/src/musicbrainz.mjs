const cache = new Map();
export async function searchMusicBrainz(query, fetcher = fetch) {
  const q = String(query || '').trim();
  if (q.length < 2 || q.length > 120) return [];
  const cached = cache.get(q.toLowerCase());
  if (cached && cached.expires > Date.now()) return cached.data;
  const url = 'https://musicbrainz.org/ws/2/recording/?query=' + encodeURIComponent(q) + '&fmt=json&limit=15';
  const response = await fetcher(url, { headers: { 'User-Agent': 'LyricVerse/1.0 (https://lyricsverse.onrender.com)', Accept: 'application/json' }, signal: AbortSignal.timeout(4500) });
  if (!response.ok) throw new Error('musicbrainz_unavailable');
  const body = await response.json();
  const seen = new Set();
  const data = (body.recordings || []).flatMap(r => {
    const title = String(r.title || '').trim();
    const artist = String((r['artist-credit'] || []).map(x => x.name || x.artist?.name || '').join('')).trim();
    if (!title || !artist || !/^[0-9a-f-]{36}$/i.test(r.id || '')) return [];
    const key = (title + '|' + artist).toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: r.id, title, artist, source: 'https://musicbrainz.org/recording/' + r.id, provider: 'musicbrainz', lyricsLicensed: false }];
  });
  cache.set(q.toLowerCase(), { expires: Date.now() + 300000, data });
  if (cache.size > 100) cache.delete(cache.keys().next().value);
  return data;
}

import { MongoClient } from 'mongodb';

export const MARKETS = ['us','gb','ca','in','au','nz','ie','za','ng','gh','ke','mx','es','ar','cl','co','br','pt','fr','de','it','nl','se','no','dk','fi','pl','tr','ae','sa','eg','jp','kr','tw','hk','sg','my','id','ph','th','vn'];
export const LIMIT = Number(process.env.SONG_IMPORT_LIMIT || 2000);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const clean = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, ' ').trim();
export const keyFor = (title, artist) => clean(title) + '::' + clean(artist);
export const uniqueSongs = items => {
  const map = new Map();
  for (const item of items) {
    if (!item.title || !item.artist) continue;
    const key = keyFor(item.title, item.artist);
    if (!map.has(key)) map.set(key, { ...item, catalogKey: key, markets: [item.market] });
    else {
      const old = map.get(key);
      if (!old.markets.includes(item.market)) old.markets.push(item.market);
      old.ranking = Math.min(old.ranking, item.ranking);
    }
  }
  return [...map.values()].sort((a,b) => a.ranking-b.ranking || b.markets.length-a.markets.length);
};
export async function json(url, { fetcher = fetch, retries = 3 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetcher(url, { headers: { 'User-Agent': 'LyricVerseCatalogImporter/1.0 (+https://lyricsverse.onrender.com)' }, signal: AbortSignal.timeout(12000) });
      if ((r.status === 429 || r.status >= 500) && attempt < retries) {
        await delay(Math.min(8000, 500 * 2 ** attempt)); continue;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return await r.json();
    } catch (e) {
      if (attempt === retries) throw e;
      await delay(Math.min(8000, 500 * 2 ** attempt));
    }
  }
}
export async function getChart(market, fetcher = fetch) {
  const url = 'https://rss.marketingtools.apple.com/api/v2/' + market + '/music/most-played/100/songs.json';
  const data = await json(url, { fetcher });
  return (data.feed?.results || []).map((r,i) => ({
    title: r.name, artist: r.artistName, album: r.collectionName || '',
    artwork: r.artworkUrl100 || '', sourceUrl: r.url || '',
    appleId: r.id || '', market, ranking: i+1, chartSource: 'Apple Music RSS'
  }));
}
export async function findLyrics(song, fetcher = fetch) {
  const q = new URLSearchParams({ track_name: song.title, artist_name: song.artist });
  try {
    const result = await json('https://lrclib.net/api/get?' + q, { fetcher, retries: 1 });
    if (!result || (!result.plainLyrics && !result.syncedLyrics)) return { status: 'not_found' };
    // LRCLIB discovery does not itself establish public re-publication/storage rights.
    return { status: 'found_external', provider: 'LRCLIB', providerId: result.id,
      url: 'https://lrclib.net/api/get/' + encodeURIComponent(result.id),
      hasSyncedLyrics: Boolean(result.syncedLyrics) };
  } catch { return { status: 'not_found' }; }
}
export async function importSongs({ db, fetcher = fetch, markets = MARKETS, limit = LIMIT, pauseMs = 250, logger = console } = {}) {
  if (!db) throw new Error('Database required');
  const collection = db.collection(process.env.SONG_COLLECTION || 'songs');
  await collection.createIndex({ catalogKey: 1 }, { unique: true, partialFilterExpression: { catalogKey: { $type: 'string' } } });
  const discovered = []; const failures = [];
  for (const market of markets) {
    try { discovered.push(...await getChart(market, fetcher)); }
    catch(e) { failures.push({ market, error: e.message }); logger.error('Chart fetch failed:', market, e.message); }
    if (pauseMs) await delay(pauseMs);
  }
  const songs = uniqueSongs(discovered).slice(0, limit);
  let inserted = 0, updated = 0, lyricsMatched = 0, errors = 0;
  for (const song of songs) {
    try {
      const now = new Date();
      const lyricsSource = await findLyrics(song, fetcher);
      if (lyricsSource.status === 'found_external') lyricsMatched++;
      // Only update importer-owned metadata. Never replace a human's lyrics, own-composition,
      // favorites, ratings, or other authored fields.
      const { catalogKey, ...metadata } = song;
      const res = await collection.updateOne(
        { catalogKey },
        { $setOnInsert: { catalogKey, createdAt: now, origin: 'chart-import', lyrics: null },
          $set: { ...metadata, lyricsSource, chartUpdatedAt: now, updatedAt: now } },
        { upsert: true });
      if (res.upsertedCount) inserted++; else updated++;
    } catch (e) { errors++; logger.error('Song ingest failed:', song.title, e.message); }
    if (pauseMs) await delay(pauseMs);
  }
  return { requested: limit, discovered: discovered.length, unique: uniqueSongs(discovered).length,
    processed: songs.length, inserted, updated, lyricsMatched, errors, failures };
}
export async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || 'lyricsdb');
    const summary = await importSongs({ db });
    console.log(JSON.stringify(summary));
    if (summary.processed === 0 || summary.errors) process.exitCode = 1;
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  main().catch(e => { console.error(e); process.exitCode = 1; });
}

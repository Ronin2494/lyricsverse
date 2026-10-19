import { readFile } from 'node:fs/promises';
import { getDatabase } from './mongo.mjs';

export const BILLBOARD_CHART_URL = 'https://www.billboard.com/charts/hot-100/';
export const BILLBOARD_DATA_URL = 'https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/recent.json';
const SNAPSHOT_URL = new URL('../../public/assets/billboard-hot100-top5.json', import.meta.url);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + 'T00:00:00Z'));

export function normalizeHot100Chart(input) {
  if (!input || !validDate(input.date)) throw new Error('invalid_chart_date');
  const raw = Array.isArray(input.songs) ? input.songs : input.data;
  if (!Array.isArray(raw) || raw.length < 5) throw new Error('incomplete_chart');
  const songs = raw.map(song => ({
    rank: Number(song.rank ?? song.this_week),
    title: song.title ?? song.song,
    artist: song.artist,
    lastWeek: song.lastWeek ?? song.last_week ?? null
  })).filter(song => Number.isInteger(song.rank) && song.rank >= 1 && song.rank <= 5)
    .sort((a, b) => a.rank - b.rank);
  if (songs.length !== 5 || songs.some((song, i) =>
    song.rank !== i + 1 || typeof song.title !== 'string' || !song.title.trim() ||
    song.title.length > 200 || typeof song.artist !== 'string' || !song.artist.trim() ||
    song.artist.length > 200)) throw new Error('incomplete_chart');
  return {
    chart: 'Billboard Hot 100',
    date: input.date,
    sourceUrl: BILLBOARD_CHART_URL,
    songs: songs.map(song => ({
      rank: song.rank, title: song.title.trim(), artist: song.artist.trim(),
      lastWeek: Number.isInteger(song.lastWeek) && song.lastWeek > 0 ? song.lastWeek : null
    }))
  };
}

export function createHot100Loader({
  fetcher = fetch,
  readSnapshot = () => readFile(SNAPSHOT_URL, 'utf8').then(JSON.parse),
  clock = Date.now,
  cacheMs = 6 * 60 * 60 * 1000
} = {}) {
  let cache = null;
  return async () => {
    if (cache && cache.expires > clock()) return cache.chart;
    const snapshot = normalizeHot100Chart(await readSnapshot());
    let chart = snapshot;
    try {
      const response = await fetcher(BILLBOARD_DATA_URL, {
        signal: AbortSignal.timeout(5500),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('chart_fetch_failed');
      const recent = normalizeHot100Chart(await response.json());
      if (recent.date >= snapshot.date && Date.parse(recent.date) <= clock() + 7 * 86400000) {
        chart = recent;
      }
    } catch {
      // Continue to serve a last-known-good dated snapshot.
    }
    cache = { chart, expires: clock() + cacheMs };
    return chart;
  };
}
export const loadHot100Chart = createHot100Loader();

export const normalizeChartText = value => String(value || '')
  .normalize('NFKD').toLocaleLowerCase('en').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(featuring|feat|ft|with|and)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

function matchingSong(chartEntry, published) {
  const titleKey = normalizeChartText(chartEntry.title);
  const artistKey = normalizeChartText(chartEntry.artist);
  return published.find(song =>
    normalizeChartText(song.title) === titleKey &&
    normalizeChartText(song.artist) === artistKey);
}

export async function withPublishedLyrics(chart, { dbFactory = getDatabase } = {}) {
  const db = await dbFactory();
  const titlePattern = chart.songs.map(song => new RegExp(
    '^' + song.title.replace(/[\^$.*+?()[\]{}|\\]/g, '\\$&') + '$', 'i'
  ));
  const published = await db.collection('songs').find({
    status: 'published',
    title: { $in: titlePattern },
    lyrics: { $type: 'string', $ne: '' },
    $or: [{ accessTier: 'free' }, { accessTier: { $exists: false } }]
  }, { projection: {
    _id: 1, title: 1, artist: 1, thumbnailUrl: 1, accessTier: 1
  } }).toArray();
  const songs = chart.songs.map(entry => {
    const match = matchingSong(entry, published);
    return {
      ...entry,
      lyricsAvailable: Boolean(match),
      ...(match ? { songId: String(match._id),
        ...(typeof match.thumbnailUrl === 'string' && /^https:\/\/[^\s]+$/.test(match.thumbnailUrl) ?
          { thumbnailUrl: match.thumbnailUrl } : {}) } : {})
    };
  });
  return { ...chart, lyricsCheck: 'ok', songs, missingCount: songs.filter(song => !song.lyricsAvailable).length };
}

export function chartWithoutAvailability(chart) {
  return { ...chart, lyricsCheck: 'unavailable',
    songs: chart.songs.map(song => ({ ...song, lyricsAvailable: false, lyricsStatus: 'unknown' })),
    missingCount: null };
}

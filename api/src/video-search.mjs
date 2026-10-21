// Server-only YouTube search. Credentials never reach the browser.
// Cache and a conservative request budget protect the project's limited search quota.
const cache = new Map();
const MAX_CACHE = 120;
const CACHE_MS = 20 * 60 * 1000;
const MAX_DAILY_SEARCHES = 65;
let daily = { date: '', count: 0 };

const validVideoId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
const plain = value => typeof value === 'string' ? value.trim().slice(0, 200) : '';
export const youtubeSearchLink = query =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent(String(query || '').trim() + ' music');

export function parseYouTubeVideoResults(items = []) {
  const seen = new Set();
  const videos = [];
  for (const item of Array.isArray(items) ? items : []) {
    const id = typeof item?.id === 'string' ? item.id : item?.id?.videoId;
    if (!validVideoId(id) || seen.has(id)) continue;
    const title = plain(item?.snippet?.title);
    const channel = plain(item?.snippet?.channelTitle);
    if (!title || !channel) continue;
    seen.add(id);
    videos.push({
      videoId: id,
      title,
      channel,
      thumbnail: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
      watchUrl: 'https://www.youtube.com/watch?v=' + id
    });
    if (videos.length >= 6) break;
  }
  return videos;
}

export async function searchYouTubeVideos(query, {
  apiKey = process.env.YOUTUBE_API_KEY,
  fetcher = fetch,
  clock = Date.now
} = {}) {
  const q = String(query || '').trim().replace(/\s+/g, ' ');
  const searchUrl = youtubeSearchLink(q);
  if (q.length < 3 || q.length > 120) return { videos: [], status: 'query_too_short', searchUrl };
  if (!apiKey) return { videos: [], status: 'not_configured', searchUrl };

  const key = q.toLocaleLowerCase();
  const now = clock();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value;
  if (hit) cache.delete(key);
  const date = new Date(now).toISOString().slice(0, 10);
  if (date !== daily.date) daily = { date, count: 0 };
  if (daily.count >= MAX_DAILY_SEARCHES) return { videos: [], status: 'quota_limited', searchUrl };
  daily.count++;

  const params = new URLSearchParams({
    part: 'snippet', type: 'video', videoEmbeddable: 'true',
    maxResults: '6', safeSearch: 'moderate', q: q + ' music'
  });
  params.set('key', apiKey);
  let value;
  try {
    const response = await fetcher('https://www.googleapis.com/youtube/v3/search?' + params, {
      signal: AbortSignal.timeout(5500)
    });
    if (!response.ok) {
      return { videos: [], status: response.status === 403 ? 'quota_limited' : 'unavailable', searchUrl };
    }
    const data = await response.json();
    value = { videos: parseYouTubeVideoResults(data.items), status: 'ok', searchUrl };
  } catch {
    return { videos: [], status: 'unavailable', searchUrl };
  }
  cache.set(key, { expires: now + CACHE_MS, value });
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  return value;
}

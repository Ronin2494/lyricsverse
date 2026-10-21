// Keep reader thumbnails consistent with discovery-card imagery.
// External sources may reject embedding, so always finish at a local generated SVG.
import { catalogMatch } from './internal-links.js';

export function isReaderArtworkUrl(value) {
  if (typeof value !== 'string' || value.length > 3000) return false;
  if (value.startsWith('data:image/svg+xml;charset=utf-8,')) return true;
  return /^https:\/\/[^\s<>"']+$/i.test(value);
}

export function readerArtworkSources(song, { catalog = [], cache = null, generatedArtwork = '' } = {}) {
  const related = catalogMatch(song, catalog);
  const cachedSong = cache?.get?.(String(song?._id || song?.id || ''));
  const cachedCatalog = related?.id ? cache?.get?.(related.id) : null;
  // Explicit uploaded image first; then the very same editorial image as the
  // homepage catalog card, with iTunes album art for originals if available.
  const candidates = [
    song?.thumbnailUrl,
    song?.artworkUrl,
    related?.thumbnailUrl,
    related?.artworkUrl,
    cachedSong,
    cachedCatalog,
    generatedArtwork
  ].filter(isReaderArtworkUrl);
  const sources = [...new Set(candidates)];
  return { sources, primary: sources[0] || '', fallback: sources[sources.length - 1] || '', matchId: related?.id || null };
}

export function nextReaderArtworkSource(image) {
  if (!image?.dataset || !image.dataset.artworkNext) return false;
  let remaining;
  try { remaining = JSON.parse(image.dataset.artworkNext); } catch { remaining = []; }
  if (!Array.isArray(remaining)) remaining = [];
  const next = remaining.shift();
  if (!isReaderArtworkUrl(next)) {
    delete image.dataset.artworkNext;
    return false;
  }
  if (remaining.length) image.dataset.artworkNext = JSON.stringify(remaining);
  else delete image.dataset.artworkNext;
  image.src = next;
  return true;
}

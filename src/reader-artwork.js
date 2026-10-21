// Keep the song reader's artwork in sync with the discovery cards.
// Uploaded cover URLs take priority; when an external host blocks embedding,
// fall back to the matching catalog image and finally stable generated artwork.
import { catalogMatch } from './internal-links.js';

export function isReaderArtworkUrl(value) {
  if (typeof value !== 'string' || value.length > 2500) return false;
  if (value.startsWith('data:image/svg+xml;charset=utf-8,')) return true;
  return /^https:\/\/[^\s<>"']+$/i.test(value);
}

export function readerArtworkSources(song, { catalog = [], cache = null, generatedArtwork = '' } = {}) {
  const related = catalogMatch(song, catalog);
  const fromCache = related?.id && cache?.get ? cache.get(related.id) : null;
  const candidates = [
    song?.thumbnailUrl,
    song?.artworkUrl,
    related?.thumbnailUrl,
    related?.artworkUrl,
    fromCache
  ].filter(isReaderArtworkUrl);
  const unique = [...new Set(candidates)];
  const generated = isReaderArtworkUrl(generatedArtwork) ? generatedArtwork : '';
  // A verified local SVG is always the last fallback, never a broken image icon.
  const fallback = generated || unique[unique.length - 1] || '';
  return {
    primary: unique[0] || fallback,
    alternate: unique.find(item => item !== unique[0] && item !== fallback) ||
      (unique.length > 1 && unique[1] !== fallback ? unique[1] : ''),
    fallback,
    matchId: related?.id || null
  };
}

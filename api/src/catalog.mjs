// Fictional demonstration metadata sourced from the approved Figma design.
// This catalog intentionally contains no third-party copyrighted lyrics.
import { allSongs, genresDesktop, originalDemoLyrics } from '../../src/catalog.js';

export function getAllSongs() {
  return allSongs.map(({ id, title, artist, album, genre, year, cover }) => ({ id, title, artist, album: album || null, genre: genre || null, year: year || null, cover }));
}
export function searchSongs(query) {
  if (typeof query !== 'string' || query.length > 120) return [];
  const q = query.trim().toLocaleLowerCase('en');
  return getAllSongs().filter(s => [s.title, s.artist, s.album, s.genre].filter(Boolean).some(f => f.toLocaleLowerCase('en').includes(q)));
}
export function getSong(id) {
  return getAllSongs().find(s => s.id === id) || null;
}
export function getGenres() { return [...genresDesktop]; }
export function getLyrics(id) {
  if (id !== 'after-the-rain') return { status: 'unavailable', sections: [], source: null };
  return { status: 'original_demo_only', sections: originalDemoLyrics, source: 'LyricVerse original fictional prototype' };
}

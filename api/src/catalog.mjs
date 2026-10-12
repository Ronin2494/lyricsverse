// Fictional demonstration metadata sourced from the approved Figma design.
// This catalog intentionally contains no third-party copyrighted lyrics.
import { allSongs, genresDesktop, genresHindi, originalDemoLyrics, hindiDemoLyrics } from '../../src/catalog.js';

export function getAllSongs() {
  return allSongs.map(({ id, title, artist, album, genre, year, cover, language }) => ({ id, title, artist, album: album || null, genre: genre || null, year: year || null, cover, language: language || 'en' }));
}
export function searchSongs(query, language = '') {
  if (typeof query !== 'string' || query.length > 120) return [];
  const q = query.trim().toLocaleLowerCase('en');
  return allSongs.filter(s => (!language || (s.language || 'en') === language) && [s.title, s.artist, s.album, s.genre, ...(s.aliases || [])].filter(Boolean).some(f => f.normalize('NFC').toLocaleLowerCase().includes(q))).map(({ id, title, artist, album, genre, year, cover, language }) => ({ id, title, artist, album: album || null, genre: genre || null, year: year || null, cover, language: language || 'en' }));
}
export function getSong(id) {
  return getAllSongs().find(s => s.id === id) || null;
}
export function getGenres(language = 'en') { return language === 'hi' ? [...genresHindi] : [...genresDesktop]; }
export function getLanguages() { return [{ code: 'en', name: 'English', nativeName: 'English' }, { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }]; }
export function getLyrics(id) {
  if (hindiDemoLyrics[id]) return { status: 'original_demo_only', language: 'hi', sections: hindiDemoLyrics[id], source: 'LyricVerse original Hindi fictional prototype' };
  if (id !== 'after-the-rain') return { status: 'unavailable', sections: [], source: null };
  return { status: 'original_demo_only', language: 'en', sections: originalDemoLyrics, source: 'LyricVerse original fictional prototype' };
}

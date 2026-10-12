import { ObjectId } from 'mongodb';
import { getDatabase } from './mongo.mjs';

const LANGUAGES = new Set(['en', 'hi', 'pa']);
const SOURCES = new Set(['wikidata', 'original', 'licensed']);
const STATUSES = new Set(['draft', 'published', 'hidden']);
const invalid = (message) => Object.assign(new Error(message), { statusCode: 400 });
export function validateSong(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('invalid_song');
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 200) throw invalid('invalid_title');
  if (!LANGUAGES.has(input.language)) throw invalid('invalid_language');
  if (!SOURCES.has(input.source)) throw invalid('invalid_source');
  if (input.status !== undefined && !STATUSES.has(input.status)) throw invalid('invalid_status');
  if (!Array.isArray(input.artistNames) || input.artistNames.length > 20 || !input.artistNames.every(x => typeof x === 'string' && x.length <= 120)) throw invalid('invalid_artists');
  if (input.source === 'wikidata' && !/^Q[1-9][0-9]*$/.test(input.externalId || '')) throw invalid('invalid_external_id');
  const rights = input.rights || {};
  if (rights.lyricsDisplayAuthorized === true && !rights.proofReference) throw invalid('missing_lyrics_rights_proof');
  if (rights.audioDistributionAuthorized === true && !rights.proofReference) throw invalid('missing_audio_rights_proof');
  return { title: input.title.trim(), language: input.language, source: input.source, externalId: input.externalId || null, artistNames: input.artistNames, status: input.status || 'draft', rights: { lyricsDisplayAuthorized: rights.lyricsDisplayAuthorized === true, audioDistributionAuthorized: rights.audioDistributionAuthorized === true, proofReference: rights.proofReference || null }, createdAt: new Date(), updatedAt: new Date() };
}
export async function listPublishedSongs({ language, limit = 24 } = {}) {
  if (language && !/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$/.test(language)) throw invalid('invalid_language');
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 24));
  const db = await getDatabase();
  const query = { status: 'published', ...(language ? { language } : {}) };
  return db.collection('songs').find(query, { projection: { rights: 0 } }).sort({ updatedAt: -1 }).limit(safeLimit).toArray();
}
export async function getPublishedSong(id) {
  if (!ObjectId.isValid(id)) throw invalid('invalid_song_id');
  const db = await getDatabase();
  return db.collection('songs').findOne({ _id: new ObjectId(id), status: 'published' }, { projection: { rights: 0 } });
}
export async function checkCollections() {
  const db = await getDatabase();
  const names = await db.listCollections({}, { nameOnly: true }).toArray();
  const actual = new Set(names.map(x => x.name));
  return ['songs','original_lyrics','users','subscriptions','audio_assets'].map(name => ({ name, exists: actual.has(name) }));
}

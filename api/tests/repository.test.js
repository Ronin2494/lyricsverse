import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSong } from '../src/repository.mjs';

const song = {title:'A real original',language:'hi',source:'original',artistNames:['Artist']};
test('valid original songs default to draft and deny rights',()=>{const x=validateSong(song);assert.equal(x.status,'draft');assert.equal(x.rights.lyricsDisplayAuthorized,false);assert.equal(x.rights.audioDistributionAuthorized,false);});
test('reject unsupported languages and malformed artist lists',()=>{assert.throws(()=>validateSong({...song,language:'xx'}),/invalid_language/);assert.throws(()=>validateSong({...song,artistNames:'artist'}),/invalid_artists/);});
test('reject unproven licensed content',()=>{assert.throws(()=>validateSong({...song,rights:{lyricsDisplayAuthorized:true}}),/missing_lyrics_rights_proof/);assert.throws(()=>validateSong({...song,rights:{audioDistributionAuthorized:true}}),/missing_audio_rights_proof/);});
test('Wikidata records require an external Q identifier',()=>{assert.throws(()=>validateSong({...song,source:'wikidata'}),/invalid_external_id/);assert.equal(validateSong({...song,source:'wikidata',externalId:'Q42'}).externalId,'Q42');});

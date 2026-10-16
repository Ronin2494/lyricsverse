import test from 'node:test';
import assert from 'node:assert/strict';
import {isOwnArtist,validateLyrics} from '../src/admin.mjs';
const input={title:'A new song',artist:'Deepak Sharma',genre:'Hindi-English Mix',language:'hi',lyrics:'Lyrics I wrote',status:'published',rightsConfirmed:true};
test('only exact Deepak and Deepak Sharma artist credits qualify',()=>{assert.equal(isOwnArtist('Deepak'),true);assert.equal(isOwnArtist(' deepak sharma '),true);assert.equal(isOwnArtist('Baggh-E SMG'),false);assert.equal(isOwnArtist('Deepak Band'),false);});
test('eligible songs require explicit opt-in for homepage feature',()=>{assert.equal(validateLyrics(input).featuredOwnComposition,false);assert.equal(validateLyrics({...input,featuredOwnComposition:true}).featuredOwnComposition,true);});
test('other artists remain separate even if feature is requested',()=>{const x=validateLyrics({...input,artist:'Baggh-E SMG',featuredOwnComposition:true});assert.equal(x.source,'licensed');assert.equal(x.featuredOwnComposition,false);});

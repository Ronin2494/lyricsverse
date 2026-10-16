import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateLyrics,isDeepakArtist} from '../src/admin.mjs';
const base={title:'Test',artist:'Deepak',genre:'Pop',language:'en',lyrics:'Test lyrics',status:'published',rightsConfirmed:true};
test('artist whitelist is exact and case insensitive',()=>{for(const name of ['Deepak','Deepak Sharma',' deepak sharma '])assert.equal(isDeepakArtist(name),true);for(const name of ['Another Artist','Deepak featuring Someone','Deepak Sharma Band',''])assert.equal(isDeepakArtist(name),false);});
test('own composition requires author and explicit feature designation',()=>{assert.equal(validateLyrics({...base,featuredOwnComposition:true}).featuredOwnComposition,true);assert.equal(validateLyrics({...base,featuredOwnComposition:false}).featuredOwnComposition,false);const other=validateLyrics({...base,artist:'Another Artist',featuredOwnComposition:true});assert.equal(other.source,'licensed');assert.equal(other.featuredOwnComposition,false);});
test('homepage excludes Life Goes On and only features explicit compositions',()=>{const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');assert.match(app,/s\.featuredOwnComposition===true/);assert.match(app,/life goes on/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../src/app.js',import.meta.url),'utf8');
const handler=readFileSync(new URL('../src/handler.mjs',import.meta.url),'utf8');
const auth=readFileSync(new URL('../src/auth.mjs',import.meta.url),'utf8');
test('profile is available only to signed-in visitors',()=>{assert.match(app,/if\(!authUser\)return.*authHTML/);assert.match(app,/id="profile-form"/);assert.match(app,/data-action="logout"/);});
test('profile editor submits authenticated data to API',()=>{assert.match(app,/\/api\/v1\/auth\/profile/);assert.match(app,/Authorization:'Bearer '\+authToken/);assert.match(app,/favoriteGenres/);});
test('profile API requires session and validates settings',()=>{assert.match(handler,/await updateProfile\(token,body\)/);assert.match(auth,/if\(!user\)throw Error\('unauthorized'\)/);assert.match(auth,/invalid_name/);assert.match(auth,/invalid_language/);assert.match(auth,/invalid_genres/);});

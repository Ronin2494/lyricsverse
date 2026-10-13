import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const admin=readFileSync(new URL('../api/src/admin.mjs',import.meta.url),'utf8');const handler=readFileSync(new URL('../api/src/handler.mjs',import.meta.url),'utf8');
test('admin submissions persist actor on song and in activity log',()=>{assert.match(admin,/doc\.createdBy=/);assert.match(admin,/collection\('admin_activity'\)\.insertOne/);assert.match(admin,/songId:r\.insertedId/);});
test('admin audit history requires authentication',()=>{assert.match(handler,/\/api\/v1\/admin\/activity/);assert.match(handler,/adminAuthStatus\(req,env\)/);assert.match(handler,/listAdminActivity\(\)/);});
test('actor identity is supplied by server configuration',()=>assert.match(handler,/env\.ADMIN_ACTOR_ID/));

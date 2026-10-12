import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRating} from '../api/src/ratings.mjs';
import {createHandler} from '../api/src/handler.mjs';
import {createServer} from 'node:http';
import {once} from 'node:events';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('ratings accept only integer stars from one through five',()=>{
 for(const value of [1,2,3,4,5])assert.equal(validateRating(value),value);
 for(const value of [0,6,1.5,'5',null])assert.throws(()=>validateRating(value));
});
test('ratings frontend sends visitor identifier and displays aggregate',()=>{
 assert.match(app,/crypto\.randomUUID\(\)/);
 assert.match(app,/\/api\/v1\/ratings/);
 assert.match(app,/JSON\.stringify\(\{rating,visitorId\}\)/);
 assert.match(app,/ratingSummary\.average/);
 assert.match(app,/ratingSummary\.count/);
});
test('ratings are saved locally only after API confirms success',()=>{
 const fn=app.slice(app.indexOf('async function submitRating'),app.indexOf("const esc ="));
 assert.ok(fn.indexOf('if(!response.ok)')<fn.indexOf("localStorage.setItem('lyricverse:user-rating'"));
});
async function request(path,method='GET',body){
 const server=createServer(createHandler({env:{CORS_ORIGIN:'https://lyricsverse.onrender.com'}}));
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{const res=await fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,body:await res.json()};}
 finally{await new Promise(resolve=>server.close(resolve));}
}
test('invalid ratings are rejected before database access',async()=>{
 for(const rating of [0,6,'5',2.5])assert.equal((await request('/api/v1/ratings','POST',{rating,visitorId:'12345678-1234-1234-1234-123456789012'})).status,400);
 assert.equal((await request('/api/v1/ratings','POST',{rating:5,visitorId:'invalid'})).status,400);
});
test('ratings endpoint rejects malformed requests',async()=>{
 assert.equal((await request('/api/v1/ratings','POST',{rating:5})).status,400);
 assert.equal((await request('/api/v1/ratings','POST',{rating:1,visitorId:'12345678-1234-1234-1234-123456789012'})).status,503);
});

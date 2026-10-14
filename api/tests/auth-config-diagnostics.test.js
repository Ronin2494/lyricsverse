import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHandler} from '../src/handler.mjs';
const client='test-client.apps.googleusercontent.com';
const base={GOOGLE_CLIENT_ID:client,AUTH_SECRET:'x'.repeat(40),MONGODB_URI:'mongodb://localhost:27017/test'};
async function config(env){
 const server=createServer(createHandler({env}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/auth/config',{headers:{Origin:'https://lyricsverse.onrender.com'}});
  assert.equal(res.status,200);
  return (await res.json()).data;
 }finally{await new Promise(resolve=>server.close(resolve));}
}
test('Google-only setup is ready without email provider',async()=>{
 const data=await config(base);
 assert.equal(data.googleClientId,client);
 assert.equal(data.emailEnabled,false);
 assert.equal(data.authReady,true);
});
test('Missing auth secret disables Google sign-in',async()=>{
 const data=await config({...base,AUTH_SECRET:''});
 assert.equal(data.googleClientId,null);
 assert.equal(data.authReady,false);
});
test('Missing database URI disables sign-in',async()=>{
 const data=await config({...base,MONGODB_URI:''});
 assert.equal(data.googleClientId,null);
 assert.equal(data.authReady,false);
});
test('Email-only setup is ready without Google',async()=>{
 const data=await config({...base,GOOGLE_CLIENT_ID:'',RESEND_API_KEY:'test',AUTH_FROM_EMAIL:'login@example.com'});
 assert.equal(data.emailEnabled,true);
 assert.equal(data.authReady,true);
});
test('No configured provider disables sign-in',async()=>{
 const data=await config({...base,GOOGLE_CLIENT_ID:''});
 assert.equal(data.emailEnabled,false);
 assert.equal(data.authReady,false);
});

import { createVerify } from 'node:crypto';
import { getDatabase } from './mongo.mjs';
import { createSession, validEmail } from './auth.mjs';

const CERTS_URL='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const certCache=new Map();
const decode=value=>JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
export function firebaseConfigured(env=process.env){
  return Boolean(/^[a-z0-9][a-z0-9-]{4,70}$/i.test(String(env.FIREBASE_PROJECT_ID||''))&&
    typeof env.FIREBASE_WEB_API_KEY==='string'&&env.FIREBASE_WEB_API_KEY.length>=15&&
    typeof env.FIREBASE_APP_ID==='string'&&env.FIREBASE_APP_ID.length>=10&&
    (env.MONGODB_URI||env.MONGO_DB_URI));
}
export function publicFirebaseConfig(env=process.env){
  if(!firebaseConfigured(env))return {firebaseConfig:null,authReady:false};
  return {firebaseConfig:{
    apiKey:env.FIREBASE_WEB_API_KEY,
    authDomain:env.FIREBASE_AUTH_DOMAIN||env.FIREBASE_PROJECT_ID+'.firebaseapp.com',
    projectId:env.FIREBASE_PROJECT_ID,
    appId:env.FIREBASE_APP_ID
  },authReady:true};
}
async function publicKeys(fetcher,now){
  const cached=certCache.get('google');
  if(cached&&cached.expires>now)return cached.certs;
  const res=await fetcher(CERTS_URL,{signal:AbortSignal.timeout(6500)});
  if(!res.ok)throw Error('firebase_certificates_unavailable');
  const certs=await res.json();
  if(!certs||typeof certs!=='object'||Object.keys(certs).length===0)throw Error('firebase_certificates_unavailable');
  const header=res.headers?.get?.('cache-control')||'';
  const maxAge=Number(/max-age=(\d+)/i.exec(header)?.[1]||'1800');
  certCache.set('google',{certs,expires:now+Math.max(60,Math.min(3600,maxAge))*1000});
  return certs;
}
export async function verifyFirebaseIdToken(idToken,env=process.env,{fetcher=fetch,now=Date.now}={}){
  if(!firebaseConfigured(env))throw Error('auth_not_configured');
  if(typeof idToken!=='string'||idToken.length<40||idToken.length>12000)throw Error('invalid_firebase_token');
  const segments=idToken.split('.');
  if(segments.length!==3||segments.some(s=>!s||!/^[A-Za-z0-9_-]+$/.test(s)))throw Error('invalid_firebase_token');
  let header,claims;
  try{header=decode(segments[0]);claims=decode(segments[1]);}
  catch{throw Error('invalid_firebase_token');}
  if(header?.alg!=='RS256'||typeof header.kid!=='string'||!/^[a-z0-9_-]{8,256}$/i.test(header.kid))
    throw Error('invalid_firebase_token');
  const seconds=Math.floor(now()/1000);
  const project=env.FIREBASE_PROJECT_ID;
  if(claims?.aud!==project||claims.iss!=='https://securetoken.google.com/'+project||
    typeof claims.sub!=='string'||!claims.sub||claims.sub.length>128||
    !Number.isInteger(claims.exp)||claims.exp<=seconds||
    !Number.isInteger(claims.iat)||claims.iat>seconds||
    !Number.isInteger(claims.auth_time)||claims.auth_time>seconds||
    claims.iat<0||claims.auth_time<0||
    claims.email_verified!==true||!validEmail(claims.email))
    throw Error('invalid_firebase_token');
  const keys=await publicKeys(fetcher,now());
  const cert=keys[header.kid];
  if(typeof cert!=='string'||!(cert.includes('BEGIN CERTIFICATE')||cert.includes('BEGIN PUBLIC KEY')))throw Error('invalid_firebase_token');
  try{
    const verifier=createVerify('RSA-SHA256');
    verifier.update(segments[0]+'.'+segments[1]);
    verifier.end();
    if(!verifier.verify(cert,Buffer.from(segments[2],'base64url')))throw Error('invalid_firebase_token');
  }catch{throw Error('invalid_firebase_token');}
  return {uid:claims.sub,email:validEmail(claims.email),name:String(claims.name||'').slice(0,120)};
}
// Firebase handles credentials and identity; existing MongoDB profiles/favorites
// are retained by linking a previously verified email to its Firebase UID.
export async function firebaseSignIn(idToken,env=process.env,{dbFactory=getDatabase,verify=verifyFirebaseIdToken,now=Date.now}={}){
  const identity=await verify(idToken,env);
  const db=await dbFactory(),users=db.collection('users');
  await users.createIndex({email:1},{unique:true});
  await users.createIndex({firebaseUid:1},{unique:true,partialFilterExpression:{firebaseUid:{$type:'string'}}});
  const current=await users.findOne({email:identity.email});
  if(current?.firebaseUid&&current.firebaseUid!==identity.uid)throw Error('firebase_account_conflict');
  const timestamp=new Date(now());
  if(current){
    await users.updateOne({_id:current._id,firebaseUid:{$in:[null,identity.uid]}},{$set:{firebaseUid:identity.uid,emailVerified:true,lastLoginAt:timestamp}});
  }else{
    await users.updateOne({email:identity.email},{$setOnInsert:{
      email:identity.email,createdAt:timestamp,name:identity.name||null
    },$set:{firebaseUid:identity.uid,emailVerified:true,lastLoginAt:timestamp}},{upsert:true});
  }
  const user=await users.findOne({email:identity.email});
  if(!user||user.firebaseUid!==identity.uid)throw Error('firebase_account_conflict');
  return createSession(db,user,env,now);
}

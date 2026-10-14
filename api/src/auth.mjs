import {randomInt,randomBytes,createHmac,timingSafeEqual,createHash} from 'node:crypto';
import {getDatabase} from './mongo.mjs';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const validEmail=value=>typeof value==='string'&&value.length<=254&&emailPattern.test(value.trim())?value.trim().toLowerCase():null;
const digest=(secret,value)=>createHmac('sha256',secret).update(value).digest('hex');
const secret=env=>String(env.AUTH_SECRET||'');
export function authConfigured(env=process.env){return secret(env).length>=32;}
export async function requestEmailOtp(email,env=process.env,{dbFactory=getDatabase,send=fetch,now=Date.now}={}){
 const address=validEmail(email);if(!address)throw Error('invalid_email');
 if(!authConfigured(env)||!env.RESEND_API_KEY||!env.AUTH_FROM_EMAIL)throw Error('auth_not_configured');
 const db=await dbFactory(),codes=db.collection('email_verifications'),time=new Date(now());
 await codes.createIndex({expiresAt:1},{expireAfterSeconds:0});
 const recent=await codes.findOne({email:address,createdAt:{$gt:new Date(time.getTime()-60000)}});
 if(recent)throw Error('rate_limited');
 const code=String(randomInt(0,1000000)).padStart(6,'0');
 const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.AUTH_FROM_EMAIL,to:[address],subject:'Your LyricVerse verification code',text:'Your LyricVerse verification code is '+code+'. It expires in 10 minutes. If you did not request this, ignore this email.'}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('email_delivery_failed');
 await codes.deleteMany({email:address});
 await codes.insertOne({email:address,codeHash:digest(secret(env),address+':'+code),attempts:0,createdAt:time,expiresAt:new Date(time.getTime()+600000)});
 return {sent:true};
}
async function createSession(db,user,env,now=Date.now){
 const token=randomBytes(32).toString('base64url');
 await db.collection('user_sessions').createIndex({expiresAt:1},{expireAfterSeconds:0});
 await db.collection('user_sessions').insertOne({userId:user._id,tokenHash:createHash('sha256').update(token).digest('hex'),createdAt:new Date(now()),expiresAt:new Date(now()+7*86400000)});
 return {token,user:{id:String(user._id),email:user.email,name:user.name||null}};
}
export async function verifyEmailOtp(email,code,env=process.env,{dbFactory=getDatabase,now=Date.now}={}){
 const address=validEmail(email);if(!address||!/^[0-9]{6}$/.test(String(code)))throw Error('invalid_code');
 if(!authConfigured(env))throw Error('auth_not_configured');
 const db=await dbFactory(),coll=db.collection('email_verifications');
 const entry=await coll.findOne({email:address});
 if(!entry||entry.expiresAt.getTime()<=now()||entry.attempts>=5)throw Error('invalid_or_expired_code');
 await coll.updateOne({_id:entry._id},{$inc:{attempts:1}});
 const a=Buffer.from(entry.codeHash,'hex'),b=Buffer.from(digest(secret(env),address+':'+code),'hex');
 if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('invalid_or_expired_code');
 await coll.deleteOne({_id:entry._id});
 const users=db.collection('users');await users.createIndex({email:1},{unique:true});
 await users.updateOne({email:address},{$setOnInsert:{email:address,createdAt:new Date(now())},$set:{emailVerified:true,lastLoginAt:new Date(now())}},{upsert:true});
 return createSession(db,await users.findOne({email:address}),env,now);
}
export async function googleSignIn(idToken,env=process.env,{dbFactory=getDatabase,fetcher=fetch,now=Date.now}={}){
 if(!env.GOOGLE_CLIENT_ID||!authConfigured(env))throw Error('auth_not_configured');
 if(typeof idToken!=='string'||idToken.length>8192)throw Error('invalid_google_token');
 const response=await fetcher('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(idToken),{signal:AbortSignal.timeout(7000)});
 if(!response.ok)throw Error('invalid_google_token');
 const claims=await response.json();
 if(claims.aud!==env.GOOGLE_CLIENT_ID||!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||claims.email_verified!== 'true'||!claims.sub||Number(claims.exp)*1000<=now())throw Error('invalid_google_token');
 const email=validEmail(claims.email);if(!email)throw Error('invalid_google_token');
 const db=await dbFactory(),users=db.collection('users');await users.createIndex({email:1},{unique:true});
 await users.updateOne({email},{$setOnInsert:{email,createdAt:new Date(now())},$set:{emailVerified:true,googleSub:String(claims.sub),name:String(claims.name||'').slice(0,120),lastLoginAt:new Date(now())}},{upsert:true});
 return createSession(db,await users.findOne({email}),env,now);
}
export async function currentUser(token,{dbFactory=getDatabase,now=Date.now}={}){
 if(typeof token!=='string'||token.length>200)return null;
 const db=await dbFactory(),hash=createHash('sha256').update(token).digest('hex');
 const session=await db.collection('user_sessions').findOne({tokenHash:hash,expiresAt:{$gt:new Date(now())}});
 if(!session)return null;
 const user=await db.collection('users').findOne({_id:session.userId});
 return user?{id:String(user._id),email:user.email,name:user.name||null,preferredLanguage:user.preferredLanguage||'en',favoriteGenres:user.favoriteGenres||[]}:null;
}
export async function logout(token,{dbFactory=getDatabase}={}){if(typeof token!=='string'||token.length>200)return;const db=await dbFactory();await db.collection('user_sessions').deleteOne({tokenHash:createHash('sha256').update(token).digest('hex')});}

export async function updateProfile(token,updates,{dbFactory=getDatabase,now=Date.now}={}){
 const user=await currentUser(token,{dbFactory,now});if(!user)throw Error('unauthorized');
 if(!updates||typeof updates!=='object'||Array.isArray(updates))throw Error('invalid_profile');
 const name=updates.name,language=updates.preferredLanguage,genres=updates.favoriteGenres;
 if(typeof name!=='string'||name.trim().length<1||name.trim().length>80)throw Error('invalid_name');
 if(!['en','hi'].includes(language))throw Error('invalid_language');
 if(!Array.isArray(genres)||genres.length>10||genres.some(g=>typeof g!=='string'||g.length>40||!['Pop','Rock','Hip-Hop','R&B','Indie','Bollywood','Classical','Electronic','Other'].includes(g)))throw Error('invalid_genres');
 const db=await dbFactory();const {ObjectId}=await import('mongodb');await db.collection('users').updateOne({_id:new ObjectId(user.id)},{$set:{name:name.trim(),preferredLanguage:language,favoriteGenres:[...new Set(genres)],updatedAt:new Date(now())}});
 return currentUser(token,{dbFactory,now});
}

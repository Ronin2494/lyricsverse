import { getDatabase } from './mongo.mjs';
import { timingSafeEqual, createHash } from 'node:crypto';
const clean = (v,max=200) => typeof v==='string' ? v.trim().slice(0,max) : '';
export function adminAuthStatus(req, env=process.env) {
  const secret=typeof env.ADMIN_API_KEY==='string'?env.ADMIN_API_KEY.trim():'';
  if(!secret || secret.length<24) return 'not_configured';
  const token=(req.headers.authorization||'').replace(/^Bearer /i,'');
  if(!token) return 'invalid';
  const a=createHash('sha256').update(token).digest(),b=createHash('sha256').update(secret).digest();
  return timingSafeEqual(a,b) ? 'ok' : 'invalid';
}
export function authorized(req,env=process.env){return adminAuthStatus(req,env)==='ok';}
export function validateLyrics(input) {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw Error('invalid_payload');
  const title=clean(input.title),artist=clean(input.artist),genre=clean(input.genre,100),language=clean(input.language,64),lyrics=clean(input.lyrics,50000);
  if(!title || !artist || !genre || !language || !lyrics) throw Error('required_fields_missing');
  if(!/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$/.test(language)) throw Error('invalid_language');
  if(!['draft','published'].includes(input.status)) throw Error('invalid_status');
  return {title,artist,genre,language,lyrics,status:input.status,source:'original',rights:{lyricsDisplayAuthorized:input.rightsConfirmed===true,proofReference:clean(input.rightsReference,500)||null},createdAt:new Date(),updatedAt:new Date()};
}
export async function createAdminLyrics(input){const doc=validateLyrics(input);const db=await getDatabase();const r=await db.collection('songs').insertOne(doc);return {id:String(r.insertedId),status:doc.status};}
export async function listAdminLyrics(){const db=await getDatabase();const docs=await db.collection('songs').find({source:'original'},{projection:{lyrics:0,rights:0}}).sort({createdAt:-1}).limit(100).toArray();return docs.map(d=>({...d,_id:String(d._id)}));}

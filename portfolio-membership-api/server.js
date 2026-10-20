import express from 'express';
import Busboy from 'busboy';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { pipeline } from 'node:stream/promises';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 10000);
const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'https://badbunny.work,https://www.badbunny.work,https://deepak-portfolio-819w.onrender.com').split(',').map(s => s.trim()));
const SECRET = process.env.SESSION_SECRET || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const FIREBASE_PROJECT_ID = (process.env.FIREBASE_PROJECT_ID || '').trim();
const authConfigured = Boolean(process.env.MONGODB_URI && SECRET.length >= 32 && ADMIN_EMAIL && /^[a-z0-9-]{6,40}$/.test(FIREBASE_PROJECT_ID));
// The public Google Secure Token JWK set verifies Firebase ID tokens by signature.
// No service-account key is needed on Render. Firebase login links are sent client-side.
const firebaseKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const MAX_UPLOAD = 100 * 1024 * 1024;
const DEFAULT_PAYPAL_URL = 'https://www.paypal.com/ncp/payment/3JZWWYUL6RF4E';
function parsePrice(raw){
  const normalized=String(raw ?? '');
  if(!/^(?:[1-9][0-9]{0,3}|0)[.][0-9]{2}$/.test(normalized)) return null;
  const cents=Math.round(Number(normalized)*100);
  return Number.isSafeInteger(cents)&&cents>=100&&cents<=100000?cents:null;
}
function paypalLink(raw){
  const value=String(raw||DEFAULT_PAYPAL_URL).trim();
  try{
    const url=new URL(value);
    if(url.protocol!=='https:'||url.hostname!=='www.paypal.com'||!/^\/ncp\/payment\/[A-Za-z0-9]+\/?$/.test(url.pathname)||url.search||url.hash)return null;
    return url.href;
  }catch{return null;}
}
let dbStatus = 'connecting', users, bucket, files;
const sign = value => createHmac('sha256', SECRET).update(value).digest('hex');
const same = (a, b) => { const x = Buffer.from(a || ''); const y = Buffer.from(b || ''); return x.length === y.length && timingSafeEqual(x,y); };
const text = (v, max) => typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0,max) : '';
const isAdmin = user => Boolean(ADMIN_EMAIL && user?.email === ADMIN_EMAIL);
const hasAccess = user => isAdmin(user);
const profile = user => ({ email:user.email, admin:isAdmin(user), hasAccess:hasAccess(user) });
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);

app.use((req,res,next) => {
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','X-Frame-Options':'DENY'});
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.set({'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,DELETE,PATCH,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'});
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin && !allowedOrigins.has(origin) ? 403 : 204);
  if (origin && !allowedOrigins.has(origin)) return res.status(403).json({error:'Origin not permitted.'});
  next();
});

app.use(express.json({limit:'64kb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'portfolio-membership',database:dbStatus}));
app.get('/api/config',(_req,res)=>res.json({currency:'CAD',paymentMode:'paypal-payment-links',authProvider:'firebase-email-link',firebaseProjectId:FIREBASE_PROJECT_ID,authEnabled:authConfigured&&dbStatus==='connected',uploadsEnabled:authConfigured&&dbStatus==='connected',paymentVerificationEnabled:false}));
function ready(_req,res,next){if(!authConfigured || dbStatus!=='connected') return res.status(503).json({error:'Membership setup is in progress.'});next();}
async function authorized(req,res,next){
  const header=req.get('authorization') || '';
  const match=/^Bearer ([A-Za-z0-9_-]+[.][A-Za-z0-9_-]+[.][A-Za-z0-9_-]+)$/.exec(header);
  if(!match||match[1].length>10000)return res.status(401).json({error:'Sign in to Creator Studio using your email link.'});
  try{
    const {payload}=await jwtVerify(match[1],firebaseKeys,{
      issuer:'https://securetoken.google.com/'+FIREBASE_PROJECT_ID,
      audience:FIREBASE_PROJECT_ID,algorithms:['RS256'],clockTolerance:5
    });
    const now=Math.floor(Date.now()/1000);
    const email=typeof payload.email==='string'?payload.email.trim().toLowerCase():'';
    if(payload.email_verified!==true||!email||email!==ADMIN_EMAIL||!payload.sub||typeof payload.sub!=='string'){
      return res.status(403).json({error:'Only the verified creator email can access this studio.'});
    }
    if(!Number.isInteger(payload.iat)||payload.iat>now+5||
       !Number.isInteger(payload.auth_time)||payload.auth_time>now+5){
      return res.status(401).json({error:'Invalid or expired Firebase sign-in.'});
    }
    await users.updateOne({email},{$set:{firebaseUid:payload.sub,verifiedAt:new Date()},$setOnInsert:{createdAt:new Date()}},{upsert:true});
    req.user=await users.findOne({email});
    if(!req.user)return res.status(401).json({error:'Creator session unavailable.'});
    next();
  }catch(error){
    if(error?.code==='ERR_JWKS_TIMEOUT'||error?.code==='ERR_JWKS_NO_MATCHING_KEY'){
      console.warn('Firebase token verification:',error.code);
    }
    res.status(401).json({error:'Firebase sign-in expired or could not be verified. Please sign in again.'});
  }
}
function adminOnly(req,res,next){if(!isAdmin(req.user))return res.status(403).json({error:'Owner access only.'});next();}

app.get('/api/me',ready,asyncRoute(authorized),(req,res)=>res.json({user:profile(req.user)}));

// Public catalog exposes only safe labels, never media bytes or download URLs.
app.get('/api/gallery',asyncRoute(async(_req,res)=>{
  if(dbStatus!=='connected')return res.json({items:[],pending:true});
  const docs=await files.find({'metadata.published':true}).project({contentType:1,metadata:1,uploadDate:1}).sort({uploadDate:-1}).limit(100).toArray();
  res.json({items:docs.map(f=>({id:f._id.toHexString(),title:f.metadata?.title||'Untitled',description:f.metadata?.description||'',priceCents:Number.isInteger(f.metadata?.priceCents)?f.metadata.priceCents:1000,currency:'CAD',paypalUrl:paypalLink(f.metadata?.paypalUrl)||DEFAULT_PAYPAL_URL,type:f.contentType||'application/octet-stream'}))});
}));
app.get('/api/media',ready,asyncRoute(authorized),adminOnly,asyncRoute(async(_req,res)=>{
  const docs=await files.find({'metadata.published':true}).project({filename:1,contentType:1,length:1,metadata:1,uploadDate:1}).sort({uploadDate:-1}).limit(100).toArray();
  res.json({items:docs.map(f=>({id:f._id.toHexString(),title:f.metadata?.title||'Untitled',description:f.metadata?.description||'',priceCents:Number.isInteger(f.metadata?.priceCents)?f.metadata.priceCents:1000,currency:'CAD',paypalUrl:paypalLink(f.metadata?.paypalUrl)||DEFAULT_PAYPAL_URL,type:f.contentType||'application/octet-stream',uploadedAt:f.uploadDate}))});
}));
const mediaSign=(id,user,exp)=>sign(id+':'+user+':'+exp);
app.post('/api/media/:id/ticket',ready,asyncRoute(authorized),adminOnly,asyncRoute(async(req,res)=>{
  if(!ObjectId.isValid(req.params.id))return res.sendStatus(404);
  const file=await files.findOne({_id:new ObjectId(req.params.id),'metadata.published':true});
  if(!file)return res.sendStatus(404);
  const user=req.user._id.toHexString(),expires=Date.now()+600000;
  const ticket=user+'.'+expires+'.'+mediaSign(req.params.id,user,expires);
  res.json({url:req.protocol+'://'+req.get('host')+'/api/media/'+req.params.id+'/file?ticket='+encodeURIComponent(ticket)});
}));
app.get('/api/media/:id/file',ready,asyncRoute(async(req,res)=>{
  const id=req.params.id;
  if(!ObjectId.isValid(id))return res.sendStatus(404);
  const [uid,expRaw,signature]=String(req.query.ticket||'').split('.');
  const exp=Number(expRaw);
  if(!ObjectId.isValid(uid||'')||!Number.isSafeInteger(exp)||exp<Date.now()||exp>Date.now()+610000||!same(signature,mediaSign(id,uid,exp)))return res.sendStatus(401);
  const [user,file]=await Promise.all([users.findOne({_id:new ObjectId(uid)}),files.findOne({_id:new ObjectId(id),'metadata.published':true})]);
  if(!hasAccess(user))return res.sendStatus(403);
  if(!file)return res.sendStatus(404);
  const length=file.length,range=req.headers.range;
  let start=0,end=length-1;
  if(range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!m||(!m[1]&&!m[2])){res.set('Content-Range','bytes */'+length);return res.sendStatus(416);}
    if(!m[1]){const size=Number(m[2]);if(!Number.isSafeInteger(size)||size<=0)return res.sendStatus(416);start=Math.max(0,length-size);}
    else {start=Number(m[1]);if(m[2])end=Number(m[2]);}
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=length||end<start){res.set('Content-Range','bytes */'+length);return res.sendStatus(416);}
    end=Math.min(end,length-1);
    res.status(206).set('Content-Range','bytes '+start+'-'+end+'/'+length);
  }
  res.set({'Content-Type':file.contentType||'application/octet-stream','Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Content-Disposition':'inline','Cross-Origin-Resource-Policy':'cross-origin'});
  bucket.openDownloadStream(file._id,{start,end:end+1}).on('error',e=>{console.error('Media stream error',e.message);res.destroy(e);}).pipe(res);
}));

app.post('/api/admin/upload',ready,asyncRoute(authorized),adminOnly,asyncRoute(async(req,res)=>{
  if(!String(req.headers['content-type']||'').startsWith('multipart/form-data;'))return res.status(415).json({error:'Choose a file.'});
  const form=Busboy({headers:req.headers,limits:{fileSize:MAX_UPLOAD,files:1,fields:5,fieldSize:1000}});
  const fields={};
  let uploadId=null,uploadTask=null,error=null,count=0;
  form.on('field',(name,value)=>{fields[name]=value;});
  form.on('file',(_name,stream,info)=>{
    count++;
    const mime=info.mimeType.toLowerCase();
    if(!['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'].includes(mime)){error='Unsupported file type.';stream.resume();return;}
    const out=bucket.openUploadStream(text(info.filename,120)||'upload',{contentType:mime,metadata:{published:false}});
    uploadId=out.id;
    stream.on('limit',()=>{error='File exceeds 100 MB.';stream.unpipe(out);stream.resume();out.destroy(new Error('Too large'));});
    uploadTask=pipeline(stream,out).catch(e=>{error=error||e.message;});
  });
  form.on('filesLimit',()=>{error='One file at a time.';});
  const done=new Promise((resolve,reject)=>{form.on('finish',resolve);form.on('error',reject);});
  req.pipe(form);
  await done;
  if(uploadTask)await uploadTask;
  if(error||!uploadId||count!==1){
    if(uploadId)await bucket.delete(uploadId).catch(()=>{});
    return res.status(400).json({error:error||'No file provided.'});
  }
  const title=text(fields.title,100);
  const priceRaw=String(fields.price||'');
  const priceCents=parsePrice(priceRaw);
  const checkoutUrl=paypalLink(fields.paypalUrl);
  if(!Number.isSafeInteger(priceCents)||priceCents<100||priceCents>100000){await bucket.delete(uploadId);return res.status(400).json({error:'Enter a price between CA$1.00 and CA$1000.00.'});}
  if(!title){await bucket.delete(uploadId);return res.status(400).json({error:'A title is required.'});}
  if(!checkoutUrl){await bucket.delete(uploadId);return res.status(400).json({error:'Enter a valid https://www.paypal.com/ncp/payment/... payment link.'});}
  await files.updateOne({_id:uploadId},{$set:{metadata:{title,description:text(fields.description,500),priceCents,paypalUrl:checkoutUrl,published:true,uploadedBy:req.user._id.toHexString()}}});
  res.status(201).json({ok:true,id:uploadId.toHexString()});
}));
app.patch('/api/admin/media/:id',ready,asyncRoute(authorized),adminOnly,asyncRoute(async(req,res)=>{
  if(!ObjectId.isValid(req.params.id))return res.sendStatus(404);
  const title=text(req.body?.title,100),description=text(req.body?.description,500);
  const priceCents=parsePrice(req.body?.price);
  const checkoutUrl=paypalLink(req.body?.paypalUrl);
  if(!title)return res.status(400).json({error:'A title is required.'});
  if(priceCents===null)return res.status(400).json({error:'Enter a price from CA$1.00 to CA$1000.00, with two decimals.'});
  if(!checkoutUrl)return res.status(400).json({error:'Enter a valid PayPal payment link.'});
  const changed=await files.updateOne({_id:new ObjectId(req.params.id),'metadata.published':true},{$set:{
    'metadata.title':title,'metadata.description':description,'metadata.priceCents':priceCents,'metadata.paypalUrl':checkoutUrl
  }});
  if(!changed.matchedCount)return res.sendStatus(404);
  res.json({ok:true});
}));
app.delete('/api/admin/media/:id',ready,asyncRoute(authorized),adminOnly,asyncRoute(async(req,res)=>{
  if(!ObjectId.isValid(req.params.id))return res.sendStatus(404);
  const id=new ObjectId(req.params.id);
  if(!await files.findOne({_id:id}))return res.sendStatus(404);
  await bucket.delete(id);
  res.json({ok:true});
}));

app.use((err,_req,res,_next)=>{console.error('Membership API failed:',err?.message);if(!res.headersSent)res.status(500).json({error:'Request failed. Try again.'});});

async function connectDatabase(){
  if(!process.env.MONGODB_URI){dbStatus='not-configured';return;}
  try{
    const connection=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:7000,maxPoolSize:10});
    await connection.connect();
    const db=connection.db(process.env.MONGODB_DB||'badbunny_membership');
    users=db.collection('members');
    bucket=new GridFSBucket(db,{bucketName:'media'});files=db.collection('media.files');
    await Promise.all([
      users.createIndex({email:1},{unique:true})
    ]);
    dbStatus='connected';
  }catch(e){dbStatus='unavailable';console.error('MongoDB setup:',e.message);}
}
app.listen(PORT,'0.0.0.0',()=>console.log('Membership API listening:',PORT));
await connectDatabase();

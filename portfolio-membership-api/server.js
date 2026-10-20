import express from 'express';
import Busboy from 'busboy';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 10000);
const SITE_URL = process.env.SITE_URL || 'https://badbunny.work';
const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'https://badbunny.work,https://www.badbunny.work,https://deepak-portfolio-819w.onrender.com').split(',').map(s => s.trim()));
const SECRET = process.env.SESSION_SECRET || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const authConfigured = Boolean(process.env.MONGODB_URI && SECRET.length >= 32 && process.env.RESEND_API_KEY && process.env.MAIL_FROM);
const billingConfigured = Boolean(stripe && process.env.STRIPE_WEBHOOK_SECRET && authConfigured);
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
const verificationRates = new Map();
function limitEmailRequests(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = verificationRates.get(ip);
  if (!entry || entry.until < now) {
    entry = { count: 0, until: now + 15 * 60 * 1000 };
    verificationRates.set(ip, entry);
  }
  if (entry.count >= 10) return res.status(429).json({ error: 'Too many sign-in requests. Try again in 15 minutes.' });
  entry.count++;
  if (verificationRates.size > 2000) {
    for (const [address, item] of verificationRates) {
      if (item.until < now) verificationRates.delete(address);
    }
  }
  next();
}
let dbStatus = 'connecting', users, codes, sessions, bucket, files;
const digest = v => createHash('sha256').update(v).digest('hex');
const sign = v => createHmac('sha256', SECRET).update(v).digest('hex');
const same = (a, b) => { const x = Buffer.from(a || ''); const y = Buffer.from(b || ''); return x.length === y.length && timingSafeEqual(x,y); };
const text = (v, max) => typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0,max) : '';
const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 250;
const isAdmin = user => Boolean(ADMIN_EMAIL && user?.email === ADMIN_EMAIL);
const hasAccess = user => isAdmin(user) || ['active','trialing'].includes(user?.subscriptionStatus);
const profile = user => ({ email:user.email, admin:isAdmin(user), status:user.subscriptionStatus || 'none', hasAccess:hasAccess(user), hasBillingAccount:Boolean(user.stripeCustomerId) });
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

// The webhook must receive raw, unmodified JSON.
app.post('/api/billing/webhook',express.raw({type:'application/json',limit:'1mb'}),asyncRoute(async(req,res)=>{
  if (!billingConfigured || !users) return res.status(503).send('Billing unavailable.');
  let event;
  try { event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return res.status(400).send('Invalid signature.'); }
  const record=event.data.object;
  if (event.type==='checkout.session.completed' && record.mode==='subscription' && ObjectId.isValid(record.client_reference_id || '')) {
    const userId=new ObjectId(record.client_reference_id);
    await users.updateOne({_id:userId},{$set:{stripeCustomerId:String(record.customer),stripeSubscriptionId:String(record.subscription)}});
    if(record.subscription) await syncSubscription(await stripe.subscriptions.retrieve(record.subscription));
  }
  if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)) await syncSubscription(record);
  res.json({received:true});
}));
async function syncSubscription(sub){
  if(!sub?.id) return;
  const patch={stripeCustomerId:String(sub.customer),stripeSubscriptionId:sub.id,subscriptionStatus:sub.status || 'none',subscriptionUpdatedAt:new Date()};
  let result=await users.updateOne({stripeCustomerId:String(sub.customer)},{$set:patch});
  if(!result.matchedCount && ObjectId.isValid(sub.metadata?.userId || '')) await users.updateOne({_id:new ObjectId(sub.metadata.userId)},{$set:patch});
}
app.use(express.json({limit:'64kb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'portfolio-membership',database:dbStatus}));
app.get('/api/config',(_req,res)=>res.json({currency:'CAD',amount:1000,interval:'month',authEnabled:authConfigured&&dbStatus==='connected',billingEnabled:billingConfigured&&dbStatus==='connected'}));
function ready(_req,res,next){if(!authConfigured || dbStatus!=='connected') return res.status(503).json({error:'Membership setup is in progress.'});next();}
async function authorized(req,res,next){
  const header=req.get('authorization') || '';
  if(!/^Bearer [a-f0-9]{64}$/.test(header))return res.status(401).json({error:'Please sign in.'});
  const tokenHash=digest(header.slice(7));
  const session=await sessions.findOne({tokenHash,expiresAt:{$gt:new Date()}});
  if(!session)return res.status(401).json({error:'Your session expired. Please sign in again.'});
  const user=await users.findOne({_id:session.userId});
  if(!user)return res.sendStatus(401);
  req.user=user;req.sessionHash=tokenHash;next();
}
function adminOnly(req,res,next){if(!isAdmin(req.user))return res.status(403).json({error:'Owner access only.'});next();}
function subscriberOnly(req,res,next){if(!hasAccess(req.user))return res.status(403).json({error:'An active membership is required.'});next();}

app.post('/api/auth/request',ready,limitEmailRequests,asyncRoute(async(req,res)=>{
  const email=text(req.body?.email,250).toLowerCase();
  if(!validEmail(email))return res.status(400).json({error:'Enter a valid email address.'});
  const existing=await codes.findOne({email});
  if(existing?.nextAllowedAt>new Date())return res.status(429).json({error:'Wait a minute before requesting another code.'});
  const otp=String(randomInt(0,1000000)).padStart(6,'0');
  const hash=sign(email+':'+otp);
  await codes.updateOne({email},{$set:{email,codeHash:hash,expiresAt:new Date(Date.now()+600000),nextAllowedAt:new Date(Date.now()+60000),attempts:0}},{upsert:true});
  let delivered=false;
  try{
    const result=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{'Authorization':'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.MAIL_FROM,to:[email],subject:'Your BadBunny sign-in code',text:'Your sign-in code: '+otp+'. Expires in 10 minutes. If you did not request it, ignore this email.'}),
      signal:AbortSignal.timeout(12000)
    });
    delivered=result.ok;
  }catch {}
  if(!delivered){
    await codes.deleteOne({email,codeHash:hash});
    return res.status(503).json({error:'Email delivery is unavailable. Please try again.'});
  }
  res.json({ok:true});
}));
app.post('/api/auth/verify',ready,asyncRoute(async(req,res)=>{
  const email=text(req.body?.email,250).toLowerCase(),code=text(req.body?.code,10);
  if(!validEmail(email)||!/^\d{6}$/.test(code))return res.status(400).json({error:'Enter a valid email and six-digit code.'});
  const record=await codes.findOne({email,expiresAt:{$gt:new Date()}});
  if(!record||record.attempts>=5)return res.status(401).json({error:'Invalid or expired code.'});
  if(!same(record.codeHash,sign(email+':'+code))){
    await codes.updateOne({_id:record._id},{$inc:{attempts:1}});
    return res.status(401).json({error:'Invalid or expired code.'});
  }
  const consumed=await codes.deleteOne({_id:record._id,attempts:{$lt:5},codeHash:record.codeHash});
  if(!consumed.deletedCount)return res.sendStatus(401);
  await users.updateOne({email},{$setOnInsert:{createdAt:new Date(),subscriptionStatus:'none'},$set:{verifiedAt:new Date()}},{upsert:true});
  const user=await users.findOne({email});
  const token=randomBytes(32).toString('hex');
  await sessions.insertOne({userId:user._id,tokenHash:digest(token),expiresAt:new Date(Date.now()+30*86400000),createdAt:new Date()});
  res.json({token,user:profile(user)});
}));
app.get('/api/me',ready,asyncRoute(authorized),(req,res)=>res.json({user:profile(req.user)}));
app.post('/api/auth/logout',ready,asyncRoute(authorized),asyncRoute(async(req,res)=>{await sessions.deleteOne({tokenHash:req.sessionHash});res.json({ok:true});}));

app.post('/api/billing/checkout',ready,asyncRoute(authorized),asyncRoute(async(req,res)=>{
  if(!billingConfigured)return res.status(503).json({error:'Payments are not configured yet.'});
  if(hasAccess(req.user))return res.status(409).json({error:'Your membership is active.'});
  const id=req.user._id.toHexString();
  const session=await stripe.checkout.sessions.create({
    mode:'subscription',client_reference_id:id,
    success_url:SITE_URL+'/?membership=success#membership',
    cancel_url:SITE_URL+'/#membership',
    customer:req.user.stripeCustomerId||undefined,
    customer_email:req.user.stripeCustomerId?undefined:req.user.email,
    line_items:[{quantity:1,price_data:{currency:'cad',unit_amount:1000,recurring:{interval:'month'},product_data:{name:'BadBunny Creative Access',description:'Exclusive creator photos and videos. Cancel anytime.'}}}],
    subscription_data:{metadata:{userId:id}},metadata:{userId:id}
  },{idempotencyKey:'membership-'+id+'-'+Math.floor(Date.now()/60000)});
  res.json({url:session.url});
}));
app.post('/api/billing/portal',ready,asyncRoute(authorized),asyncRoute(async(req,res)=>{
  if(!billingConfigured)return res.status(503).json({error:'Payments are not configured yet.'});
  if(!req.user.stripeCustomerId)return res.sendStatus(404);
  const portal=await stripe.billingPortal.sessions.create({customer:req.user.stripeCustomerId,return_url:SITE_URL+'/#membership'});
  res.json({url:portal.url});
}));

// Public catalog exposes only safe labels, never media bytes or download URLs.
app.get('/api/gallery',asyncRoute(async(_req,res)=>{
  if(dbStatus!=='connected')return res.json({items:[],pending:true});
  const docs=await files.find({'metadata.published':true}).project({contentType:1,metadata:1,uploadDate:1}).sort({uploadDate:-1}).limit(100).toArray();
  res.json({items:docs.map(f=>({id:f._id.toHexString(),title:f.metadata?.title||'Untitled',description:f.metadata?.description||'',priceCents:Number.isInteger(f.metadata?.priceCents)?f.metadata.priceCents:1000,currency:'CAD',paypalUrl:paypalLink(f.metadata?.paypalUrl)||DEFAULT_PAYPAL_URL,type:f.contentType||'application/octet-stream'}))});
}));
app.get('/api/media',ready,asyncRoute(authorized),subscriberOnly,asyncRoute(async(_req,res)=>{
  const docs=await files.find({'metadata.published':true}).project({filename:1,contentType:1,length:1,metadata:1,uploadDate:1}).sort({uploadDate:-1}).limit(100).toArray();
  res.json({items:docs.map(f=>({id:f._id.toHexString(),title:f.metadata?.title||'Untitled',description:f.metadata?.description||'',priceCents:Number.isInteger(f.metadata?.priceCents)?f.metadata.priceCents:1000,currency:'CAD',paypalUrl:paypalLink(f.metadata?.paypalUrl)||DEFAULT_PAYPAL_URL,type:f.contentType||'application/octet-stream',uploadedAt:f.uploadDate}))});
}));
const mediaSign=(id,user,exp)=>sign(id+':'+user+':'+exp);
app.post('/api/media/:id/ticket',ready,asyncRoute(authorized),subscriberOnly,asyncRoute(async(req,res)=>{
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
    users=db.collection('members');codes=db.collection('login_codes');sessions=db.collection('sessions');
    bucket=new GridFSBucket(db,{bucketName:'media'});files=db.collection('media.files');
    await Promise.all([
      users.createIndex({email:1},{unique:true}),users.createIndex({stripeCustomerId:1},{sparse:true}),
      codes.createIndex({email:1},{unique:true}),codes.createIndex({expiresAt:1},{expireAfterSeconds:0}),
      sessions.createIndex({tokenHash:1},{unique:true}),sessions.createIndex({expiresAt:1},{expireAfterSeconds:0})
    ]);
    dbStatus='connected';
  }catch(e){dbStatus='unavailable';console.error('MongoDB setup:',e.message);}
}
app.listen(PORT,'0.0.0.0',()=>console.log('Membership API listening:',PORT));
await connectDatabase();

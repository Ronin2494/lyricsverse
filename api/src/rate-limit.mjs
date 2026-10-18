// In-memory per-instance protection for expensive public routes and authentication.
export function createRateLimiter({now=Date.now,windowMs=60000,maxKeys=10000}={}){
 const buckets=new Map();
 return function check(key,limit){
  const t=now();
  if(buckets.size>maxKeys)for(const [k,v] of buckets){if(v.expires<=t)buckets.delete(k);if(buckets.size<=maxKeys)break;}
  if(buckets.size>maxKeys)buckets.delete(buckets.keys().next().value);
  let b=buckets.get(key);
  if(!b||b.expires<=t){b={count:0,expires:t+windowMs};buckets.set(key,b);}
  b.count++;
  return {allowed:b.count<=limit,retryAfter:Math.max(1,Math.ceil((b.expires-t)/1000))};
 };
}
export function rateLimitFor(method,path){
 if(method==='POST'&&path.startsWith('/api/v1/auth/'))return 10;
 if(method==='POST'&&path.startsWith('/api/v1/admin/'))return 30;
 if(method==='POST')return 60;
 if(path.startsWith('/api/v1/providers/')||path==='/api/v1/media/youtube-preview')return 40;
 if(path.startsWith('/api/v1/search'))return 90;
 return 180;
}

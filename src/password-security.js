// Pure client-side password guidance. Firebase remains the credential authority.
// Do not log, persist or transmit passwords to LyricVerse's own API.
export const MIN_SIGNUP_PASSWORD_LENGTH=12;
export const MAX_SIGNUP_PASSWORD_LENGTH=128;
const LOWER='abcdefghjkmnpqrstuvwxyz';
const UPPER='ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS='23456789';
const SYMBOLS='!@#$%&*_-+=?';
const GROUPS=[LOWER,UPPER,DIGITS,SYMBOLS];
const COMMON=/^(?:password|passw0rd|qwerty|welcome|letmein|admin|iloveyou|123456|abcdef|firebase|lyricsverse)(?:[\d!@#$%^&*_-]*)$/i;

export function validateEmailAddress(value){
  const email=String(value??'').trim();
  if(!email||email.length>254||/\s/.test(email))return {valid:false,message:'Enter a valid email address.'};
  const at=email.indexOf('@'),lastDot=email.lastIndexOf('.');
  const local=email.slice(0,at),domain=email.slice(at+1);
  if(at<1||at>64||lastDot<=at+1||lastDot>=email.length-2||
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)||
      local.startsWith('.')||local.endsWith('.')||local.includes('..')||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(domain)||
      domain.split('.').some(label=>label.startsWith('-')||label.endsWith('-')))
    return {valid:false,message:'Enter a valid email address.'};
  return {valid:true,email};
}

export function checkPasswordStrength(value,email=''){
  const password=String(value??'');
  const length=Array.from(password).length;
  const classes=[/[a-z]/.test(password),/[A-Z]/.test(password),/[0-9]/.test(password),/[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;
  const emailLocal=String(email||'').split('@')[0].toLowerCase();
  const predictable=COMMON.test(password)||/^(.)\1+$/u.test(password)||
    (emailLocal.length>=4&&password.toLowerCase().includes(emailLocal))||
    /^(?:[a-z]+\d{2,}|\d{12,})$/i.test(password)&&/^(?:password|qwerty|welcome|admin|123456)/i.test(password);
  let score=0;
  if(length>=MIN_SIGNUP_PASSWORD_LENGTH)score++;
  if(length>=16)score++;
  if(classes>=3)score++;
  if(length>=20&&classes>=2)score++;
  if(predictable)score=0;
  const valid=length>=MIN_SIGNUP_PASSWORD_LENGTH&&length<=MAX_SIGNUP_PASSWORD_LENGTH&&!predictable&&(classes>=3||length>=20);
  let message='';
  if(length<MIN_SIGNUP_PASSWORD_LENGTH)message='Use at least 12 characters.';
  else if(length>MAX_SIGNUP_PASSWORD_LENGTH)message='Use no more than 128 characters.';
  else if(predictable)message='Avoid common, repeated, or email-based passwords.';
  else if(classes<3&&length<20)message='Add a mix of letters, numbers and symbols, or use a longer passphrase.';
  return {valid,score:Math.min(4,score),label:score<=1?'Weak':score===2?'Fair':score===3?'Good':'Strong',message,length};
}

export function validateSignupCredentials(email,password,confirmation){
  const address=validateEmailAddress(email);
  if(!address.valid)return {valid:false,field:'email',message:address.message};
  const result=checkPasswordStrength(password,address.email);
  if(!result.valid)return {valid:false,field:'password',message:result.message};
  if(password!==confirmation)return {valid:false,field:'confirm',message:'Passwords do not match.'};
  return {valid:true,email:address.email};
}

// Sample uniformly from Web Crypto. No Math.random fallback for credentials.
// Rejection sampling avoids modulo bias; groups guarantee useful complexity.
function cryptoIndex(n,cryptoImpl){
  if(!cryptoImpl?.getRandomValues)throw Error('Secure password generation is unavailable in this browser.');
  const domain=0x100000000,limit=Math.floor(domain/n)*n;
  const bytes=new Uint32Array(1);
  let draw;
  do{cryptoImpl.getRandomValues(bytes);draw=bytes[0];}while(draw>=limit);
  return draw%n;
}
export function generateSecurePassword({length=20,cryptoImpl=globalThis.crypto}={}){
  if(!Number.isInteger(length)||length<16||length>MAX_SIGNUP_PASSWORD_LENGTH)throw Error('invalid_password_length');
  const all=GROUPS.join('');
  const letters=GROUPS.map(chars=>chars[cryptoIndex(chars.length,cryptoImpl)]);
  for(let i=letters.length;i<length;i++)letters.push(all[cryptoIndex(all.length,cryptoImpl)]);
  for(let i=letters.length-1;i>0;i--){
    const j=cryptoIndex(i+1,cryptoImpl);
    [letters[i],letters[j]]=[letters[j],letters[i]];
  }
  return letters.join('');
}


// Existing Firebase email/password users may have older, six-character
// passwords. Do not impose the stronger *registration* policy at login.
export const MIN_SIGNIN_PASSWORD_LENGTH=6;
export const MAX_SIGNIN_PASSWORD_LENGTH=256;

export function validateLoginCredentials(email,password){
  const address=validateEmailAddress(email);
  if(!address.valid)return {valid:false,field:'email',message:address.message};
  if(typeof password!=='string'||password.length===0||!password.trim())
    return {valid:false,field:'password',message:'Enter your password.'};
  if(password.length<MIN_SIGNIN_PASSWORD_LENGTH)
    return {valid:false,field:'password',message:'Password must be at least 6 characters.'};
  if(password.length>MAX_SIGNIN_PASSWORD_LENGTH)
    return {valid:false,field:'password',message:'Password cannot exceed 256 characters.'};
  return {valid:true,email:address.email};
}

export const PASSWORD_RESET_CONFIRMATION=
  'If an account exists with this email, you will receive password reset instructions.';

export function validateAuthenticationSubmission({mode='signin',email='',password='',confirmation=''}={}){
  if(mode==='reset'){
    const address=validateEmailAddress(email);
    return address.valid?{valid:true,email:address.email}:
      {valid:false,field:'email',message:address.message};
  }
  if(mode==='signup')return validateSignupCredentials(email,password,confirmation);
  return validateLoginCredentials(email,password);
}

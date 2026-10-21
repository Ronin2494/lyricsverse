// Firebase Auth is loaded only when the backend advertises an explicitly
// configured LyricVerse Firebase web app. No service-account secrets in JS.
import { lyricverseFirebaseConfig } from './firebase-config.js';
const VERSION='12.19.0';
let clientPromise=null,unsubscribe=null;
export function describeFirebaseError(error,action='signin'){
  const code=String(error?.code||'');
  const invalidCredentials='Incorrect email or password. Check your details and try again, or reset your password.';
  const messages={
    'auth/invalid-credential':invalidCredentials,
    'auth/wrong-password':invalidCredentials,
    'auth/user-not-found':invalidCredentials,
    'auth/invalid-login-credentials':invalidCredentials,
    'auth/invalid-password':invalidCredentials,
    'auth/invalid-email':'Enter a valid email address.',
    'auth/missing-email':'Enter your email address.',
    'auth/missing-password':'Enter your password.',
    'auth/email-already-in-use':'An account already uses this email. Sign in or reset your password.',
    'auth/weak-password':'Choose a stronger password. Try the secure password generator.',
    'auth/too-many-requests':'Too many sign-in attempts. Try again later or reset your password.',
    'auth/user-disabled':'This account has been disabled. Please contact support.',
    'auth/network-request-failed':'Connection problem. Check your internet and try again.',
    'auth/popup-closed-by-user':'Sign-in was cancelled. Try again when you are ready.',
    'auth/cancelled-popup-request':'The previous sign-in window was cancelled. Please try again.',
    'auth/popup-blocked':'Your browser blocked the sign-in window. Allow pop-ups and try again.',
    'auth/unauthorized-domain':'Google sign-in is temporarily unavailable on this website. Please try again later.',
    'auth/operation-not-allowed':'This sign-in method is currently unavailable. Please use another method.',
    'auth/account-exists-with-different-credential':'This email already uses another sign-in method. Try that method.',
    'auth/requires-recent-login':'For security, please sign in again and retry.',
    'auth/invalid-api-key':'Sign-in is temporarily unavailable. Please try again later.',
    'auth/app-not-authorized':'Sign-in is temporarily unavailable. Please try again later.',
    'auth/internal-error':'We could not complete sign-in right now. Please try again later.'
  };
  if(messages[code])return messages[code];
  if(error?.message==='firebase_not_configured')return 'Sign-in is temporarily unavailable. Please try again later.';
  if(action==='signup')return 'We could not create your account. Check your details and try again.';
  if(action==='reset')return 'We could not send the reset email. Check your address and try again.';
  if(action==='google')return 'Google sign-in could not be completed. Please try again.';
  return 'We could not sign you in. Check your details or try again later.';
}
export function validFirebaseConfig(config){
 return Boolean(config&&typeof config==='object'&&
  /^AIza[\w-]{20,}$/.test(String(config.apiKey||''))&&
  /^[a-z0-9][a-z0-9-]{4,70}$/i.test(String(config.projectId||''))&&
  /^[a-z0-9.-]+\.firebaseapp\.com$/i.test(String(config.authDomain||''))&&
  typeof config.appId==='string'&&config.appId.length>=10);
}
export async function loadFirebaseClient(config=lyricverseFirebaseConfig){
 if(!validFirebaseConfig(config)||config.projectId!==lyricverseFirebaseConfig.projectId||config.appId!==lyricverseFirebaseConfig.appId)throw Error('firebase_not_configured');
 if(!clientPromise)clientPromise=Promise.all([
   import('https://www.gstatic.com/firebasejs/'+VERSION+'/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/'+VERSION+'/firebase-auth.js')
 ]).then(([appSDK,authSDK])=>{
   const app=appSDK.initializeApp(config,'lyricsverse');
   const auth=authSDK.getAuth(app);
   // Analytics is nonessential: unsupported browsers or blocked tracking may
   // never interrupt authentication or the public lyrics experience.
   if(config.measurementId && typeof window!=='undefined'){
     void import('https://www.gstatic.com/firebasejs/'+VERSION+'/firebase-analytics.js')
       .then(async analyticsSDK=>{
         if(await analyticsSDK.isSupported())analyticsSDK.getAnalytics(app);
       }).catch(()=>{});
   }
   return {auth,authSDK};
 }).catch(error=>{clientPromise=null;throw error;});
 return clientPromise;
}
export async function observeFirebaseUser(config,onChange){
 const {auth,authSDK}=await loadFirebaseClient(config);
 unsubscribe?.();
 unsubscribe=authSDK.onAuthStateChanged(auth,user=>{void onChange(user);},error=>{void onChange(null,error);});
 return ()=>{unsubscribe?.();unsubscribe=null;};
}
export async function signInFirebaseGoogle(config){
 const {auth,authSDK}=await loadFirebaseClient(config);
 return authSDK.signInWithPopup(auth,new authSDK.GoogleAuthProvider());
}
export async function signInFirebaseEmail(config,email,password){
 const {auth,authSDK}=await loadFirebaseClient(config);
 return authSDK.signInWithEmailAndPassword(auth,email,password);
}
export async function createFirebaseEmailAccount(config,email,password){
 const {auth,authSDK}=await loadFirebaseClient(config);
 const created=await authSDK.createUserWithEmailAndPassword(auth,email,password);
 await authSDK.sendEmailVerification(created.user);
 return created;
}
export async function resetFirebasePassword(config,email){
 const {auth,authSDK}=await loadFirebaseClient(config);
 await authSDK.sendPasswordResetEmail(auth,email);
}
export async function refreshFirebaseIdentity(config){
 const {auth}=await loadFirebaseClient(config);
 if(!auth.currentUser)return null;
 await auth.currentUser.reload();
 await auth.currentUser.getIdToken(true);
 return auth.currentUser;
}
export async function signOutFirebase(config){
 const {auth,authSDK}=await loadFirebaseClient(config);
 return authSDK.signOut(auth);
}

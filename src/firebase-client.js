// Firebase Auth is loaded only when the backend advertises an explicitly
// configured LyricVerse Firebase web app. No service-account secrets in JS.
const VERSION='12.19.0';
let clientPromise=null,unsubscribe=null;
export function describeFirebaseError(error){
  const code=String(error?.code||'');
  const messages={
    'auth/popup-closed-by-user':'Sign-in was cancelled.',
    'auth/popup-blocked':'Your browser blocked the sign-in window. Allow pop-ups for LyricVerse and try again.',
    'auth/unauthorized-domain':'LyricVerse must be added to Firebase Authentication authorized domains.',
    'auth/invalid-credential':'Email or password was not accepted.',
    'auth/wrong-password':'Email or password was not accepted.',
    'auth/user-not-found':'Email or password was not accepted.',
    'auth/email-already-in-use':'This email is already registered. Sign in instead.',
    'auth/weak-password':'Choose a stronger password (at least six characters).',
    'auth/invalid-email':'Enter a valid email address.',
    'auth/too-many-requests':'Too many attempts. Try again later.',
    'auth/network-request-failed':'A network error interrupted sign-in. Try again.',
    'auth/operation-not-allowed':'Enable this sign-in provider in Firebase Authentication.'
  };
  return messages[code]||'Firebase sign-in could not be completed. Please try again.';
}
export function validFirebaseConfig(config){
 return Boolean(config&&typeof config==='object'&&
  /^AIza[\w-]{20,}$/.test(String(config.apiKey||''))&&
  /^[a-z0-9][a-z0-9-]{4,70}$/i.test(String(config.projectId||''))&&
  /^https?:\/\//.test('https://'+String(config.authDomain||''))&&
  /^[a-z0-9.-]+\.firebaseapp\.com$/i.test(String(config.authDomain||''))&&
  typeof config.appId==='string'&&config.appId.length>=10);
}
export async function loadFirebaseClient(config){
 if(!validFirebaseConfig(config))throw Error('firebase_not_configured');
 if(!clientPromise)clientPromise=Promise.all([
   import('https://www.gstatic.com/firebasejs/'+VERSION+'/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/'+VERSION+'/firebase-auth.js')
 ]).then(([appSDK,authSDK])=>{
   const app=appSDK.initializeApp(config,'lyricsverse');
   const auth=authSDK.getAuth(app);
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
export async function signOutFirebase(config){
 const {auth,authSDK}=await loadFirebaseClient(config);
 return authSDK.signOut(auth);
}

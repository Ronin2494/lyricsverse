import { createAdminClient, adminErrorMessage } from './admin-client.js';

const $ = id => document.getElementById(id);
const client = createAdminClient();
const login = $('login');
const editor = $('editor');
const notice = $('notice');
const keyField = $('key');
const loginButton = login.querySelector('button[type="submit"]');

function showError(prefix, error) {
  notice.textContent = prefix + adminErrorMessage(error?.message);
}
async function request(method='GET', body, path='/api/v1/admin/lyrics') {
  return client.request(method, body, path);
}
login.addEventListener('submit', async event => {
  event.preventDefault();
  if (loginButton.disabled) return;
  client.setKey(keyField.value);
  if (!client.hasKey()) {
    notice.textContent = 'Enter the admin access key.';
    return;
  }
  loginButton.disabled = true;
  loginButton.textContent = 'Checking key…';
  notice.textContent = 'Connecting to the admin API…';
  try {
    await request('GET', undefined, '/api/v1/admin/session');
    editor.hidden = false;
    login.hidden = true;
    keyField.value = '';
    notice.textContent = '';
    await refresh();
  } catch (error) {
    client.clearKey();
    editor.hidden = true;
    login.hidden = false;
    showError('Admin login failed: ', error);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Unlock editor';
  }
});
$('logout').addEventListener('click', () => {
  client.clearKey();
  editor.hidden = true;
  login.hidden = false;
  keyField.value = '';
  notice.textContent = 'Editor locked.';
});
$('toggle-key').addEventListener('click', () => {
  const revealed = keyField.type === 'password';
  keyField.type = revealed ? 'text' : 'password';
  $('toggle-key').textContent = revealed ? 'Hide key' : 'Show key';
  $('toggle-key').setAttribute('aria-pressed', String(revealed));
});
keyField.addEventListener('input', () => {
  if (!editor.hidden) return;
  notice.textContent = '';
});
async function refresh(){try{const data=await request();$('items').replaceChildren(...data.data.map(s=>{const li=document.createElement('li');li.textContent=`${s.title} — ${s.artist} · ${s.language} · ${s.genre} · ${s.accessTier||'free'} · ${s.status}`;return li;}));$('notice').textContent='';}catch(e){$('notice').textContent='Unable to load lyrics: '+adminErrorMessage(e.message);}}
$('lyrics-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const body=Object.fromEntries(new FormData(f));body.rightsConfirmed=$('rightsConfirmed').checked;body.featuredOwnComposition=!$('featuredOwnComposition').disabled&&$('featuredOwnComposition').checked;try{await request('POST',body);$('notice').textContent='Lyrics saved successfully.';f.reset();updateOwnCompositionOption();await refresh();$('notice').textContent='Lyrics saved successfully.';}catch(err){$('notice').textContent='Save failed: '+adminErrorMessage(err.message);}});

const artistField=document.querySelector('#lyrics-form [name="artist"]');
function updateOwnCompositionOption(){const eligible=/^(deepak|deepak sharma)$/i.test(artistField.value.trim());const checkbox=$('featuredOwnComposition');checkbox.disabled=!eligible;if(!eligible)checkbox.checked=false;$('feature-hint').textContent=eligible?'Optional: check to display this song in the homepage Own Composition floater.':'Only songs credited to Deepak or Deepak Sharma can be featured as Own Composition.';}
artistField.addEventListener('input',updateOwnCompositionOption);
updateOwnCompositionOption();

/* The demo names and illustrations are taken from the approved Figma mockup.
   The original sample lyrics exist only to validate layout. No external song lyrics
   should be added without explicit, confirmed display rights. */
export const topSongs = [
  { id: 'chasing-lights', title: 'Chasing Lights', artist: 'Aurora Lane', cover: ['#652A9B','#DC4F96','#F9B775'], genre: 'Pop' },
  { id: 'midnight-drive', title: 'Midnight Drive', artist: 'Solar Tide', cover: ['#0F276B','#7142B8','#20BCE6'], genre: 'Electronic' },
  { id: 'falling-better', title: 'Falling Better', artist: 'Nova Vale', cover: ['#113F9F','#7550D9','#56D7E8'], genre: 'Rock' },
  { id: 'urban-hearts', title: 'Urban Hearts', artist: 'City Renegade', cover: ['#49237F','#CF388D','#EF9D86'], genre: 'Hip-Hop' },
  { id: 'golden-hours', title: 'Golden Hours', artist: 'The Weekenders', cover: ['#60358E','#E65C83','#FFA95B'], genre: 'Indie' }
];
export const newSongs = [
  { id: 'echoes-of-you', title: 'Echoes of You', artist: 'Luna River', cover: ['#4C1C90','#D04FCE','#EAA4EB'], genre: 'Pop' },
  { id: 'breathe-again', title: 'Breathe Again', artist: 'Kai Horizon', cover: ['#204AAB','#54A5D7','#AFD8F7'], genre: 'R&B' },
  { id: 'stardust', title: 'Stardust', artist: 'The Velvets', cover: ['#121D6B','#594FCA','#B267F1'], genre: 'K-Pop' },
  { id: 'same-sky', title: 'Same Sky', artist: 'Orion Falls', cover: ['#123E88','#48C5E2','#C1DAFC'], genre: 'Electronic' },
  { id: 'better-days', title: 'Better Days', artist: 'Milo West', cover: ['#6729A1','#DA5F9A','#FFB07E'], genre: 'Hip-Hop' }
];
export const readerSong = { id:'after-the-rain', title:'After the Rain', artist:'Nova Vale', album:'Horizon', year:'2026', genre:'Pop', cover:['#30266E','#AC4FA5','#F1A28C'] };
// Original, fictional Hindi demonstration songs. No commercial lyrics are reproduced.
export const hindiSongs = [
  { id:'sitaron-ki-baat', title:'सितारों की बात', artist:'आर्या वर्मा', aliases:['Sitaron Ki Baat','Arya Verma'], language:'hi', genre:'Hindi Pop', cover:['#4C1C90','#D04FCE','#EAA4EB'] },
  { id:'baarish-ke-baad', title:'बारिश के बाद', artist:'सागर मेहरा', aliases:['Baarish Ke Baad','Sagar Mehra'], language:'hi', genre:'Acoustic', cover:['#204AAB','#54A5D7','#AFD8F7'] },
  { id:'nayi-raah', title:'नई राह', artist:'नैना रॉय', aliases:['Nayi Raah','Naina Roy'], language:'hi', genre:'Hindi Indie', cover:['#121D6B','#594FCA','#B267F1'] },
  { id:'dil-ki-dhun', title:'दिल की धुन', artist:'कबीर आनंद', aliases:['Dil Ki Dhun','Kabir Anand'], language:'hi', genre:'Hindi Pop', cover:['#6729A1','#DA5F9A','#FFB07E'] }
];
export const hindiDemoLyrics = {
  'sitaron-ki-baat': [
    { section:'[अंतरा 1]', lines:['रात के पन्नों पर रोशनी लिखी','खामोश हवाओं ने कहानी कही','दूर कहीं एक सपना मुस्कुराया','दिल ने धीरे से रास्ता बनाया'] },
    { section:'[मुखड़ा]', lines:['सितारों की बात सुनते चलें','नए आसमान को छूते चलें','हर कदम एक नई शुरुआत','साथ रहे ये प्यारी रात'] }
  ],
  'baarish-ke-baad': [
    { section:'[अंतरा 1]', lines:['खिड़की पे ठहरी थीं बूंदें कई','हर बूंद में छुपी थी बात नई','भीगी हुई राहों में सूरज खिला','मन को अपना नया घर मिला'] },
    { section:'[मुखड़ा]', lines:['बारिश के बाद मुस्काता सवेरा','चल पड़ा फिर से ये दिल मेरा','बादल गए तो रंग लौट आए','कितने नए सपने साथ ले आए'] }
  ],
  'nayi-raah': [
    { section:'[अंतरा 1]', lines:['कुछ अनकहे से सवाल लिए','हम चल पड़े हैं खयाल लिए','मुड़ती सड़क ने इतना कहा','मंज़िल से पहले सफ़र है यहाँ'] },
    { section:'[मुखड़ा]', lines:['नई राहें हमें बुलाएँ','अपने कदम सुर में मिलाएँ','आज की धूप से सीखेंगे हम','कल के रंग फिर बनाएँ'] }
  ],
  'dil-ki-dhun': [
    { section:'[अंतरा 1]', lines:['हल्की हवा जब गीत सुनाए','मन के आँगन में फूल खिलाए','छोटी खुशी को थाम के रखना','हर पल को अपना नाम ही देना'] },
    { section:'[मुखड़ा]', lines:['दिल की धुन पर चलना है','खुद से फिर से मिलना है','हर सुबह की पहली किरण में','थोड़ा और खिलना है'] }
  ]
};
export const allSongs = [readerSong, ...topSongs, ...newSongs, ...hindiSongs];
export const genresHindi = ['All','Hindi Pop','Hindi Indie','Acoustic'];
export const genresDesktop = ['All','Pop','Rock','Hip-Hop','R&B','Indie','Electronic','K-Pop'];
export const genresMobile = ['All','Pop','Rock','R&B'];
export const originalDemoLyrics = [
  { section:'[Verse 1]', lines:[
    'The city holds its breath tonight',
    'Neon spills across the street',
    'I leave the windows open wide',
    'For every sound I want to keep'
  ] },
  { section:'[Chorus]', lines:[
    'And after the rain, the sky is clear',
    'All of the things I held too near',
    'Fall into place, and disappear',
    'I find a little light in here'
  ] },
  { section:'[Verse 2]', lines:[
    'The morning writes a softer line',
    'Across the windows of the train',
    'I take the long road home tonight',
    'And let the quiet speak again'
  ] }
];
export function findSongs(query){
  const q=String(query ?? '').trim().normalize('NFC').toLocaleLowerCase();
  return !q ? [] : allSongs.filter(s=>[s.title,s.artist,s.genre,s.album,...(s.aliases||[])].filter(Boolean).some(k=>k.normalize('NFC').toLocaleLowerCase().includes(q)));
}

// One source of truth for song links across Trending, Featured and Search.
// Always use an actual published lyrics record before falling back to song details.
export function normalizeSongText(value) {
  return String(value || '')
    .normalize('NFKD').toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\b(featuring|feat\.?|ft\.?|with)\b/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
}

function sameArtist(first, second) {
  const left = normalizeSongText(first);
  const right = normalizeSongText(second);
  if (!left || !right) return false;
  return left === right;
}

export function publishedMatch(song, published = []) {
  if (!song || !song.title || !song.artist) return null;
  const title = normalizeSongText(song.title);
  return published.find(entry =>
    entry?.status === 'published' &&
    (entry.accessTier || 'free') === 'free' &&
    typeof entry.lyrics === 'string' && entry.lyrics.trim() &&
    /^[a-f0-9]{24}$/i.test(String(entry._id || '')) &&
    normalizeSongText(entry.title) === title &&
    sameArtist(entry.artist, song.artist)
  ) || null;
}

export function catalogMatch(song, catalog = []) {
  if (!song || !song.title || !song.artist) return null;
  const title = normalizeSongText(song.title);
  return catalog.find(entry =>
    entry?.id && normalizeSongText(entry.title) === title &&
    sameArtist(entry.artist, song.artist)
  ) || null;
}

export function internalSongLink(song, { published = [], catalog = [] } = {}) {
  const uploaded = publishedMatch(song, published);
  if (uploaded) return {
    href: '#/original/' + encodeURIComponent(String(uploaded._id)),
    type: 'lyrics',
    song: uploaded
  };
  const found = catalogMatch(song, catalog);
  if (found) return {
    href: '#/lyrics/' + encodeURIComponent(String(found.id)),
    type: 'details',
    song: found
  };
  return null;
}

export function localSongMatches(query, { published = [], catalog = [] } = {}) {
  const words = normalizeSongText(query).split(' ').filter(Boolean);
  if (!words.length) return [];
  const ranked = [];
  const keys = new Set();
  // Published records win over static chart metadata.
  const candidates = [
    ...published.filter(x => x?.status === 'published' &&
      (x.accessTier || 'free') === 'free' && typeof x.lyrics === 'string' &&
      x.lyrics.trim() && /^[a-f0-9]{24}$/i.test(String(x._id || ''))),
    ...catalog
  ];
  for (const song of candidates) {
    const title = normalizeSongText(song.title);
    const artist = normalizeSongText(song.artist);
    if (!title || !artist) continue;
    if (!words.every(word => (title + ' ' + artist).includes(word))) continue;
    const id = title + '\u0000' + artist;
    if (keys.has(id)) continue;
    const resolved = internalSongLink(song, { published, catalog });
    if (!resolved) continue;
    keys.add(id);
    ranked.push({
      ...resolved,
      title: song.title, artist: song.artist,
      exact: title === normalizeSongText(query)
    });
  }
  return ranked.sort((a,b) =>
    Number(b.exact) - Number(a.exact) ||
    Number(b.type === 'lyrics') - Number(a.type === 'lyrics')
  );
}


// Search the text of lyrics the user has actually published on LyricVerse.
// Return only song references; do not surface private drafts or unlicensed previews.
export function publishedLyricsTextMatches(query, published = []) {
 const words=String(query||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 if(words.join('').length<2)return [];
 return published.filter(song=>{
   if(song?.status!=='published'||(song.accessTier||'free')!=='free'||
      typeof song.lyrics!=='string'||!song.lyrics.trim()||
      !/^[a-f0-9]{24}$/i.test(String(song._id||'')))return false;
   const text=song.lyrics.toLocaleLowerCase().replace(/\s+/g,' ');
   return words.every(term=>text.includes(term));
 }).slice(0,12).map(song=>({
   type:'lyrics', href:'#/original/'+encodeURIComponent(String(song._id)),
   title:song.title, artist:song.artist, inLyrics:true
 }));
}

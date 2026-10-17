# Automated multilingual Top 2,000 ingestion

Runs independently of the website and API server. No changes to existing routes or design.

## Run
From repository root:

```bash
npm --prefix api install
MONGODB_URI='mongodb+srv://...' MONGODB_DATABASE=lyricsverse node api/scripts/import-top-songs.mjs
node --test api/tests/import-top-songs.test.js
```

Configure a Render Cron Job using the same repository, root directory `api`,
build command `npm install`, command `node scripts/import-top-songs.mjs`,
and schedule `0 5 * * *` (UTC). Set `MONGODB_URI`, `MONGODB_DB=lyricsdb`,
optional `SONG_IMPORT_LIMIT=2000`, `SONG_COLLECTION=songs`.
Do not expose database credentials in git.

## Sources and limitations
Apple Music public RSS feeds across 41 markets discover internationally diverse
popular songs, including Indian and regional music. The importer deduplicates title
and artist combinations; actual count can fall below 2,000 if fewer distinct songs
are returned or a feed fails. This is chart discovery, not a license to publish lyrics.
LRCLIB is used for lookup only; the importer records its reference and does not copy
plain or timed lyrics. Provide rights-cleared lyrics through a separately licensed workflow.
Existing song text, compositions, ratings, and user-entered fields are preserved.
Never use this task to bypass paywalls or anti-bot systems.

The importer reports failed markets, per-song errors, newly inserted records,
updated records, and external lyrics matches. Run at off-peak hours and monitor logs.

Imported songs have language='und' (unknown) until reliable per-track language metadata is supplied. They are accessible in the all-language catalog view; language-specific filters exclude unknowns. Existing API endpoints return only published records. The initial dataset may contain fewer than 2,000 unique tracks; check the run summary before claiming completion.

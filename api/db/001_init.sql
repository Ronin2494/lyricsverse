-- Future licensed catalog storage. Apply using psql with an authorized DATABASE_URL.
-- Only ingest lyrics when the license expressly permits storage and display.
BEGIN;
CREATE TABLE IF NOT EXISTS artists (
 id BIGSERIAL PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS albums (
 id BIGSERIAL PRIMARY KEY,
 artist_id BIGINT NOT NULL REFERENCES artists(id),
 slug TEXT NOT NULL,
 title TEXT NOT NULL,
 release_year SMALLINT,
 UNIQUE(artist_id, slug)
);
CREATE TABLE IF NOT EXISTS songs (
 id BIGSERIAL PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL,
 artist_id BIGINT NOT NULL REFERENCES artists(id),
 album_id BIGINT REFERENCES albums(id),
 genre TEXT,
 release_year SMALLINT,
 artwork_url TEXT,
 licensed_lyrics_provider TEXT,
 provider_song_id TEXT,
 visibility TEXT NOT NULL DEFAULT 'metadata_only'
   CHECK (visibility IN ('metadata_only', 'licensed_display')),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lyrics_rights (
 song_id BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
 provider TEXT NOT NULL,
 license_reference TEXT NOT NULL,
 territory TEXT NOT NULL,
 valid_from TIMESTAMPTZ NOT NULL,
 valid_until TIMESTAMPTZ,
 can_display BOOLEAN NOT NULL DEFAULT false,
 can_store BOOLEAN NOT NULL DEFAULT false,
 PRIMARY KEY(song_id, provider, territory)
);
CREATE TABLE IF NOT EXISTS app_users (
 id UUID PRIMARY KEY,
 provider_subject TEXT UNIQUE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_favorites (
 user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 song_id BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, song_id)
);
CREATE INDEX IF NOT EXISTS songs_artist_id_idx ON songs(artist_id);
CREATE INDEX IF NOT EXISTS songs_genre_idx ON songs(genre);
CREATE INDEX IF NOT EXISTS songs_title_lower_idx ON songs ((lower(title)));
COMMIT;

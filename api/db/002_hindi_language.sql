-- Prepare the licensed song catalog for Hindi and Devanagari metadata.
-- This migration adds metadata only, not copyrighted lyrics.
BEGIN;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS language_code VARCHAR(8) NOT NULL DEFAULT 'en' CHECK (language_code IN ('en', 'hi'));
CREATE TABLE IF NOT EXISTS song_aliases (
 id BIGSERIAL PRIMARY KEY,
 song_id BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
 alias_text TEXT NOT NULL,
 script_code VARCHAR(12),
 UNIQUE (song_id, alias_text)
);
CREATE INDEX IF NOT EXISTS songs_language_code_idx ON songs(language_code);
CREATE INDEX IF NOT EXISTS song_aliases_alias_lower_idx ON song_aliases ((lower(alias_text)));
COMMIT;

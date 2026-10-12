# LyricVerse MongoDB schema v1

Database: `lyricsverse` on existing Atlas Cluster0. All collections use MongoDB ObjectId `_id`, UTC timestamps `createdAt`/`updatedAt`, and application-side validation until MongoDB validators are deployed.

## songs
`source` enum: wikidata, original, licensed; `externalId` string for Wikidata Q ID; `title` string; `artistNames` string[]; `language` enum en, hi, pa; `status` enum draft, published, hidden; `releaseDate` optional date; `genre` optional string; `rights` object with `lyricsDisplayAuthorized` boolean (default false), `audioDistributionAuthorized` boolean (default false), `rightsHolderId` optional user ID, `proofReference` optional private reference. **No unlicensed lyrics in this collection.**

## original_lyrics
`songId` ObjectId references songs; `ownerUserId` ObjectId references users; `version` positive integer; `language` enum en, hi, pa; `sections` array of {type, lines:string[]}; `status` enum draft, published, removed; `rightsAttestation` {confirmed:boolean, confirmedAt:date, statementVersion:string}; `publishedAt` optional date. Server must verify ownership and rights before publication.

## users
`emailNormalized` lowercase string; `authProvider` enum oauth, passwordless; `providerSubject` string; `role` enum listener, creator, admin; `status` enum active, suspended, deleted; `createdAt`, `updatedAt`. Never store plaintext passwords or payment card data.

## subscriptions
`userId` ObjectId references users; `provider` enum stripe, other; `providerCustomerId` string; `providerSubscriptionId` string; `status` enum incomplete, trialing, active, past_due, canceled, unpaid; `currentPeriodEnd` date; `lastWebhookEventId` string. **Only verified payment webhooks may update entitlement state.**

## audio_assets
`songId` ObjectId references songs; `ownerUserId` ObjectId references users; `objectKey` private object-storage key; `mimeType` audio/*; `sizeBytes` nonnegative number; `visibility` enum preview, subscriber, private; `processingStatus` enum pending, ready, failed; `durationSeconds` optional number; `rightsVerified` boolean. No public permanent full-audio URLs. Backend checks authorization and issues short-lived signed URLs.

## Indexes created in Atlas
- songs: `song_source_id` (source, externalId); `language_visibility` (language, status)
- original_lyrics: `song_version` (songId, version desc)
- users: `user_email` (emailNormalized)
- subscriptions: `subscriber_status` (userId, status)
- audio_assets: `audio_song_visibility` (songId, visibility)

## Next migration requirements
Add unique indexes on `users.emailNormalized`, `songs(source,externalId)` (partial for external IDs), `subscriptions.providerSubscriptionId`, and `original_lyrics(songId,version)`. Add MongoDB collection validators and an auditable migration runner. The currently created indexes are **not unique**. Configure secure MongoDB connection via Render secret `MONGODB_URI`; do not commit credentials. Replace PostgreSQL health check only after a verified MongoDB connection.

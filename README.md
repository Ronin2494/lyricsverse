# LyricVerse — music discovery website and catalog API

Design reference: https://www.figma.com/design/5pzyFO15tcqDbkUnbKTEuj

Homepage redesign frames: desktop `12:94`, mobile `13:247`. Current designs are editable Figma layers, not flat screenshots.

## Website

- Homepage v0.3 is an explicitly requested redesign; lyrics reader retains its locked Figma mockups. See `FIGMA_LOCK.md`.
- `npm test` runs design, catalog, and API tests.
- `npm run build` copies the locked static site into `dist/` for CDN hosting.
- `npm run dev` previews it at http://localhost:4173.
- Render static hosting: repository root, build command `npm run build`, publish directory `dist`.

## Backend

- `api/` provides a separate Node.js service. Render web service build command `npm --prefix api install --omit=dev` and start command `npm --prefix api start`.
- Routes: `GET /health`, `GET /api/v1/songs`, `GET /api/v1/songs/:id`, `GET /api/v1/genres`, `GET /api/v1/search?q=...`, `GET /api/v1/lyrics/:id`.
- Set `CORS_ORIGIN=https://lyricsverse.onrender.com` on the API service.
- Add the PostgreSQL `DATABASE_URL` to the backend through Render's linked database settings. Without it, the API serves demonstration catalog data, and `/health` explicitly reports `database: not_connected`.
- Database migration: `api/db/001_init.sql` is a schema definition; apply through a secure deployment migration step when the database connection is available. The catalog currently remains demo data until a licensed lyrics provider is connected.
- Do not store copyrighted lyrics until licensed to do so. Save actions remain browser-local until real authentication is built.

## Design Lock

See `FIGMA_LOCK.md`. The four approved Figma views must not change without approval. All live data integration must preserve the initial mockup layout.

## Homepage v0.3

- A full-width, larger hero with rotating website-intent headline, accessible pause and CTA controls.
- 2-column × 2-row song discovery grid, useful sidebar and two linked NPR Music videos.
- Rating stars save the individual visitor selection in local storage; no aggregate scores are claimed.
- Mood discovery, product-explanation sections and full footer.
- Public social icons are share/watch links, not fictional LyricVerse social accounts.

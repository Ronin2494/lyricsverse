# LyricVerse — Homepage 3D Design Tokens

> Proposed holographic constellation treatment (PR #39). The original Figma reader and typography constraints remain locked; see `FIGMA_LOCK.md`.

## Core palette

| Token | Value | Role |
|---|---|---|
| `surface.canvas` | `#090f22` | Primary page background |
| `surface.panel` | `#111a30` | Cards and panels |
| `surface.elevated` | `#17223d` | Raised elements |
| `text.primary` | `#f8fafc` | Readable text |
| `accent.violet` | `#a17aff` | Primary actions |
| `accent.cyan` | `#64e6e7` | Secondary accents |
| `light.orbCyan` | `#60e7ff` | 3D lighting only |
| `light.orbViolet` | `#9271ff` | 3D lighting only |
| `light.ringViolet` | `#a69aff` | Orbital rings only |

## Component: Holographic Music Orb

- Four linked songs maximum; source is the existing catalog selection.
- DOM overlay: title, artist, visible keyboard focus and a full clickable target.
- Single Three.js scene: transparent canvas, shared sphere geometry, physically based glass, narrow ring, ambient fill, two point lights.
- Desktop: four-column constellation; mobile: two-column constellation.
- Motion: restrained slow rotation; no aggressive parallax or flashing.
- Safety and performance: reduced-motion mode, WebGL fallback, no postprocessing, bounded pixel ratio, cleanup on rerender.
- Must not interfere with hero CTAs, search, original-composition floater or song-card grid.

## Quality gates

1. Desktop and mobile screenshots reviewed at 1440px and 390px.
2. Accessibility: focus visibility, readable labels, no text contrast regressions.
3. Performance: verify laptop and mobile GPU behavior, fallback when WebGL/CDN unavailable.
4. CI tests and production build pass before merge.
5. Figma reader layouts remain unchanged.

## Source of truth

- Design contract: `FIGMA_LOCK.md`
- CSS implementation: `styles.css`
- WebGL implementation: `src/music-orbs.js`
- Homepage integration: `src/app.js`

## Approved design: Neon Music Universe (October 16, 2026)

**Approval:** User approved the desktop/mobile concept covering homepage, search, lyrics, artists, profiles and admin. The implementation must preserve existing functionality. Concept-only features (playlists, comments, following, streaming, analytics) are not implemented without separate backend requirements.

### Sitewide design tokens
- `background` #050a20; `surface` #0d1634; `raised` #15234a; `foreground` #f8faff.
- `violet` #bf74ff; `cyan` #69e5ff; `pink` #fa70e6; `blue` #48bfff; `purple` #8956ff.
- Cards use navy translucent layers, subtle blue-violet borders, restrained glass blur and low-opacity glows.
- Buttons use pink-violet-cyan highlights; search fields are high-contrast light surfaces; headings use an editorial, tight-tracking scale.

### Pages and responsive rules
- Homepage: neon vinyl hero, high-contrast functional search, genre chips, holographic music constellation, trending/mood discovery and footer.
- Search: focused query input, visible separation between uploaded LyricVerse songs and third-party discovery, accessible result cards.
- Lyrics: prioritise readability and lyric attribution, no animated text backgrounds or unlicensed content.
- Profile/favorites: consistent panel, form, and saved-song treatment; do not invent playlist/following functionality.
- Admin: same surfaces, buttons, inputs and accessibility focus states as the public site.
- Desktop: rich atmospheric compositions; mobile: reduced artwork intensity, compact cards and bottom navigation.

### Engineering and QA
- Implement using existing semantic HTML and CSS; retain all routes, authentication, search and API behavior.
- Prefer existing lightweight 3D hero/orb assets; avoid adding heavy WebGL canvases to reader/profile pages.
- Test `npm run check`, inspect actual desktop and mobile screenshots, and validate contrast, keyboard focus and reduced-motion behavior.
- Mockup visuals are design direction, not evidence that fictional counters, copyrighted lyrics, music streaming or artist-following features exist.
- This phase is the initial sitewide visual pass; pixel-accurate implementation and cross-device browser QA remain acceptance criteria.

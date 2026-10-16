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

## Sitewide immersive redesign — October 16, 2026

The user expanded the scope from one orb component to the **entire LyricVerse site**. The following rules apply to all routes, including homepage, search, reader, profile, favorites and admin.

- **Surface hierarchy:** Deep-space canvas `#070b1c`, layered navy translucent panels, luminous edges and softly shaded depth. Keep readable foreground contrast and existing semantic HTML.
- **Components:** Glass studio cards, gradient primary CTAs, pill-shaped actions, subtle elevation on hover, luminous search focus rings and restrained atmospheric textures.
- **Typography:** Strong editorial headings with slightly tighter tracking; never reduce readability for lyrics, metadata or form fields.
- **Motion:** Soft hover elevation and gradual lighting shifts; no forced scroll effects or distracting reader animations. Honor reduced-motion.
- **Layout:** Consistent radius, borders, spacing, shadows and focus states on desktop and mobile. No content reordering that breaks song navigation or account workflows.
- **Scope and status:** The CSS foundation and admin styling are the **first implementation pass**, not a claim that all pages have been fully redesigned or visually accepted. Follow up with per-page composition and browser QA.
- **Implementation:** `styles.css` for shared route styling; `admin.html` for standalone editor. No API or search behavior changes.

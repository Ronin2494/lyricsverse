# LyricVerse visual specification

Source Figma: https://www.figma.com/design/5pzyFO15tcqDbkUnbKTEuj

## Homepage v0.3 — explicitly authorized redesign (October 12, 2026)

- Enlarge the hero; convey purpose in clear rotating text, primary/secondary CTA and functional search.
- Use layered 3-D vinyl and lyric-sheet artwork with existing violet/cyan design tokens.
- Provide a five-star visitor feedback UI without fabricating public reviews or aggregate ratings.
- Limit the homepage lyrics preview to a two-column/two-row grid (four cards total).
- Place compact verified YouTube content and useful links in the right desktop sidebar.
- Include mood discovery, product explanation, call-to-action and full footer with social icons.
- Mobile: same 2 x 2 lyrics grid with the sidebar stacked below; keyboard-visible focus, accessible rotator pause, reduced motion.

## Unchanged / still design-locked

- Song reader screens: Figma `5:127` and `5:280`.
- Brand colors, typography, album artwork and licensed-lyrics policies.
- Figma homepage refresh should remain the approval reference for future code edits.

## Figma Homepage V2 Screens (October 12, 2026)

- Desktop redesign: Figma node `12:94` — 1440px, editable hero / carousel intent / 3D vinyl / 2×2 lyrics / videos / links / moods / footer.
- Mobile redesign: Figma node `13:247` — 390px, stacked 2×2 lyrics / videos / links / moods / footer.
- Original Figma frames remain preserved. The revised frontend homepage is the matching implementation target.
- Match the mockup using native DOM and assets; do not embed full mockup screenshots in the site.

## Approved feature extension — Hindi language

Language selection is a requested functional addition. It uses the existing violet surface styles, rounds, and spacing. English remains the initial mode. Hindi demo titles and lyrics use Noto Sans Devanagari; the existing English layout, artwork, and Figma-approved reader geometry remain locked. No third-party copyrighted lyrics are copied.

## Homepage 3D aesthetic extension — holographic music constellation (October 16, 2026)

**Status:** Proposed in PR #39, pending visual acceptance. This section authorizes the specific 3D component redesign; it does not unlock unrelated Figma screens.

- **Creative direction:** A premium music observatory, with restrained studio glass, optical depth, luminous cyan/violet reflections and finely drawn orbit rings. Avoid cartoon bubbles, droplets, excessive bloom or generic flat gradients.
- **Color tokens:** Preserve the locked brand surfaces `#090f22`, `#111a30`, `#17223d`, foreground `#f8fafc`, violet `#a17aff` and cyan `#64e6e7`. Supplementary orb light colors are `#60e7ff`, `#9271ff`, and `#a69aff` only for illumination; do not substitute them for accessible text tokens.
- **Geometry:** Four linked glass orbs, one per displayed song. Sphere material uses physically based transmission, low roughness, a clear coat, subtle internal emissive tint and narrow orbital rings. Do not place lyrics inside WebGL or bake song metadata into textures.
- **Scene:** One transparent Three.js canvas with two colored point lights and ambient fill. DOM links remain above the canvas, retain semantic song names and keyboard focus, and stay clickable.
- **Motion:** Slow orbital rotation and damped position tracking; avoid aggressive spinning, flashes and scroll hijacking. Pause animation when offscreen; honor `prefers-reduced-motion`.
- **Performance:** Pixel ratio at most 1.5, shared meshes/materials, no postprocessing, dispose WebGL resources on rerender, and degrade gracefully if the CDN or WebGL is unavailable.
- **Responsive behavior:** Four columns on desktop, two columns on mobile. Never obstruct navigation, search, primary CTAs, or song cards.
- **Visual acceptance:** Inspect actual browser screenshots at 1440px and 390px, check contrast, keyboard navigation, mobile readability and WebGL fallback before deployment.
- **Design authority:** This specification is the implementation brief; existing Figma homepage frames remain historical references until a revised editable Figma design is explicitly approved. The reader frames remain locked.

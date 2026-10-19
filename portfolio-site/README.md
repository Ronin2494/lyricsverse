# Deepak Sharma — Portfolio

One-page, static portfolio featuring an interactive scroll-controlled 3D cosmic gateway, responsive bento cards, creative interests, and verified project links.

## Run locally

No build step or API keys are needed. Run a static web server:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. A network connection is needed to load Three.js and optional Google Fonts. If Three.js is unavailable or motion is reduced, the portal uses a lightweight Canvas 2D fallback / static styling; site content remains accessible.

## Deploy

On Render, choose **Static Site**, publish path `.` and build command `echo 'Static portfolio ready'`. The current temporary deployment is isolated in a `portfolio-site` branch of an existing repository until a dedicated portfolio repository is available. Other branches are unchanged.

## Tech

Semantic HTML, CSS, native JavaScript, Three.js from pinned CDN, procedural particle geometry, scroll-eased camera animation, IntersectionObserver, reduced-motion and touch support. No analytics, trackers or user data collected.

## Links / content

All URLs are in `index.html`. Update content in place. Production statuses and available public endpoints were checked against Render in October 2026. TaskMail and Espionaaj are deliberately marked as in progress, not live products.
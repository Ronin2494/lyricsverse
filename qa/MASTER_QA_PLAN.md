# LyricVerse Website QA Master Test Plan
Audit date: 2026-10-23. Baseline: deployed Render `11acbd09681f46583e3b199c223d09b41884ad07` and GitHub master.
Method: BrowserStack [Website QA Testing](https://www.browserstack.com/guide/how-to-perform-website-qa-testing) and TestGrid [Website Testing](https://testgrid.io/blog/website-testing/): functional, usability, compatibility, responsive, accessibility, performance, security, reliability and regression.

## Execution status semantics
- **UNIT**: assertions on production functions/source and mocked API behavior; no actual browser rendering.
- **BROWSER-MOCK**: headless Chromium renders real frontend, while *all* Firebase SDK, backend APIs and external hosts are intercepted. Validates actual DOM, clicks, responsive layout and WCAG with axe-core, **not** live account/provider success.
- **PRODUCTION-READ**: inspection of public deployment metadata, Render server logs and read-only production endpoints; no writes.
- **MANUAL / NOT VERIFIED**: requires a real-browser session, dedicated authorized Firebase test users, cross-browser cloud devices, real providers or licensed publishing.
- **BLOCKED**: known limitation stops complete validation. No test marked passed until the relevant test method runs.

## Test matrix (requirements, cases and expected outcomes)

| ID | Area | Scenario | Expected result | Method |
|---|---|---|---|---|
| NAV-01 | Routes | Direct homepage | Hero and discovery content appear, no login overlay | BROWSER-MOCK |
| NAV-02 | Routes | Desktop Sign in | Navigates to `#/profile` and shows login when signed out | BROWSER-MOCK |
| NAV-03 | Routes | Mobile Profile | Bottom tab opens profile | MANUAL |
| NAV-04 | Routes | Desktop/mobile Search | Search route opens from navigation | BROWSER-MOCK |
| NAV-05 | Routes | Unknown hash route | Predictably falls back to home, no crash | UNIT |
| NAV-06 | Routes | Back/forward/hash deep-link | Browser history and route state remain synchronized | MANUAL |
| NAV-07 | Routes | Mobile menu open/close | Toggle and navigation keyboard accessible | MANUAL |
| NAV-08 | Navigation | Skip link | Focus skips directly to main content | UNIT + MANUAL |
| HOME-01 | Hero | Primary CTA | Opens unified search | BROWSER-MOCK |
| HOME-02 | Hero | Headline rotator | Advances/pauses and honors reduced motion | UNIT |
| HOME-03 | Hero | Genre buttons | Filter visible songs and update selection state | UNIT |
| HOME-04 | Hero | English/Hindi/Punjabi | Content switches; Devanagari headings remain readable | UNIT + BROWSER-MOCK |
| HOME-05 | Music | Four featured song cards | Valid internal lyrics/song hrefs, no 404/placeholder | UNIT |
| HOME-06 | Music | Favorite heart signed out | Requests sign-in, no fabricated saved state | UNIT + MANUAL |
| HOME-07 | Music | Mood discovery links | Clickable, predictable matching sections | UNIT |
| HOME-08 | Music | Featured YouTube | Links have valid IDs and noreferrer/noopener | UNIT |
| HOME-09 | Music | Holographic scene | Canvas fallback, no interaction obstruction | UNIT |
| HOME-10 | Feedback | Star rating 1–5 | Selection, accessible button state and no double count | UNIT + BROWSER-MOCK |
| HOME-11 | Feedback | 5xx rating request | User receives understandable error, state not misrepresented | MANUAL |
| SEARCH-01 | Search | One search control on mobile | Only one visible search input on search page | BROWSER-MOCK |
| SEARCH-02 | Search | Search by song, artist, phrase, language | Relevant matching results with correct links | UNIT |
| SEARCH-03 | Search | Search by lyrics text | Published full-text entries searchable | UNIT |
| SEARCH-04 | Search | 0/1/120/121 chars | Safe validation; no empty requests | UNIT |
| SEARCH-05 | Search | Rapid typing/debounce | No stale results; avoid duplicate API calls | UNIT |
| SEARCH-06 | Search | External API timeout | Visible fallback and no broken blank state | UNIT |
| SEARCH-07 | Search | LRCLIB/Genius/Web source | Attribution, links and licenses distinguished | UNIT |
| SEARCH-08 | Search | Videos | Valid YouTube IDs and click-to-load privacy-safe embed | UNIT |
| SEARCH-09 | Search | Provider unavailable | Retry/fallback and readable statuses | UNIT |
| SEARCH-10 | Search | Asymmetric bento | External sources, videos, full-width local results are properly arranged | UNIT + BROWSER-MOCK |
| SONG-01 | Reader | Song card navigation | Reads internal lyrics route without crash | BROWSER-MOCK |
| SONG-02 | Reader | Original song | Published title/artist/lyrics from server; correct fallback when missing | UNIT |
| SONG-03 | Reader | Licensed lyrics gating | Does not assert demo/unlicensed lyrics are published | UNIT |
| SONG-04 | Reader | Cover image unavailable | Local graphic, not broken image | UNIT |
| SONG-05 | Reader | Reading Studio | Opens/closes; font controls, progress, theme and keyboard escape | UNIT + MANUAL |
| SONG-06 | Reader | Mobile reader | No horizontal overflow; readable text controls | BROWSER-MOCK |
| SONG-07 | Reader | YouTube preview | Valid video/URL fallback; playback buttons work | UNIT |
| SONG-08 | Reader | Tabs Lyrics/About/Meaning/Translations | Buttons switch content or clearly identify unavailable translation | UNIT |
| USER-01 | Authentication | Email validation | Empty, invalid, missing domain, whitespace rejected | UNIT + BROWSER-MOCK |
| USER-02 | Authentication | Sign-in password 0–5 chars | Inline minimum-six error, **no** provider request | UNIT + BROWSER-MOCK |
| USER-03 | Authentication | Sign-in existing 6-char password | Client forwards to Firebase (legacy users supported) | UNIT |
| USER-04 | Authentication | Register weak under-12 password | Strong-password guidance and rejection | UNIT |
| USER-05 | Authentication | Password confirmation mismatch | Inline error and focus | UNIT |
| USER-06 | Authentication | 20-char secure password generator | Uses cryptographic randomness and passes policy | UNIT + BROWSER-MOCK |
| USER-07 | Authentication | Wrong email or password | No account enumeration; actionable error | UNIT + BROWSER-MOCK |
| USER-08 | Authentication | Google popup blocked/closed | Recoverable message | UNIT |
| USER-09 | Authentication | Google real popup and authorized domain | Actual Google login succeeds | MANUAL / NOT VERIFIED |
| USER-10 | Authentication | Firebase email existing valid account | Real login succeeds, receives ID token | MANUAL / NOT VERIFIED |
| USER-11 | Authentication | Firebase sign-up & email verification | Email delivered, verified user can log in | MANUAL / NOT VERIFIED |
| USER-12 | Authentication | Forgotten password | Valid email-only request; no account disclosure | UNIT + BROWSER-MOCK |
| USER-13 | Authentication | Rate limiting/disabled account | Actionable errors, no secret disclosures | UNIT |
| USER-14 | Authentication | Double-click submit | Exactly one request with loading indicator | UNIT |
| USER-15 | Authentication | Password secrecy | Password never submitted to LyricVerse API | UNIT |
| USER-16 | Authentication | Token validation | Reject forged, expired, wrong issuer/audience | UNIT |
| USER-17 | Authentication | User profile bridge | Existing profile retained after Firebase migration | UNIT |
| USER-18 | Authentication | Session logout/reload | Unauthorized API requests rejected and UI clears | UNIT + MANUAL |
| LIB-01 | Library | Anonymous user | Helpful sign-in call to action; no fake favorites | BROWSER-MOCK |
| LIB-02 | Library | Signed-in empty | Discover recommendations, no phantom song cards | UNIT |
| LIB-03 | Library | Save and unsave songs | Idempotent MongoDB favorites update and accurate UI | UNIT / MANUAL |
| LIB-04 | Library | API failures | Save rollback and accessible error toast | UNIT |
| PROFILE-01 | Profile | Load signed-in settings | Name and preferred language load correctly | UNIT |
| PROFILE-02 | Profile | Update display name | Validates, persists only authorized changes | UNIT / MANUAL |
| PROFILE-03 | Profile | Update favorite genres | Saves and reopens selected genres | UNIT / MANUAL |
| ADMIN-01 | Admin | Unauthenticated write | 401/403, never accepts anonymous admin actions | UNIT |
| ADMIN-02 | Admin | Create/edit lyrics | Validate title, status, language, access tier | UNIT / MANUAL |
| ADMIN-03 | Admin | Logs | Admin change recorded and private activity protected | UNIT |
| API-01 | API | Health and database availability | Accurate status; never falsely claims connected | PRODUCTION-READ |
| API-02 | API | Content security | CORS allowlist and method validation | UNIT |
| API-03 | API | Input boundaries | Oversized JSON, invalid genre/language/query safely rejected | UNIT |
| API-04 | API | External provider outages | Safe 503/fallback and no leaked credentials | UNIT |
| API-05 | API | Video provider quota exhaustion | Visible alternate link, no invented results | UNIT |
| API-06 | API | Ratings | 1–5 allowed, malformed UUID rejected, repeat visitor not double-counted | UNIT |
| AX-01 | Accessibility | WCAG 2.1 AA axe scan | No unreviewed high-impact failures | BROWSER-MOCK |
| AX-02 | Accessibility | Keyboard-only navigation | Controls reachable; focus visible; no traps | MANUAL |
| AX-03 | Accessibility | 200%/400% browser zoom | No clipping or lost functionality | MANUAL |
| AX-04 | Accessibility | Screen reader | Labels and live validation status announced | MANUAL |
| AX-05 | Accessibility | Reduced motion | Hero/scroll animations honor OS preference | UNIT |
| VIEW-01 | Responsive | 1440px desktop and 390px mobile | No missing content, overlapping interactive elements or horizontal clipping | BROWSER-MOCK |
| VIEW-02 | Responsive | 320px, 375px, 768px, 1024px, 1920px | Reflow, inputs, dialogs, navigation correct | MANUAL |
| PERF-01 | Performance | Document paint/load (fixture) | Capture timings without substituting for real-user metrics | BROWSER-MOCK |
| PERF-02 | Performance | Production WebPageTest | Public URL network trace with real assets + LCP/CLS/INP if available | MANUAL / NOT VERIFIED |
| PERF-03 | Performance | Slow 3G and 4G | Graceful loading, no indefinite spinners | MANUAL |
| PERF-04 | Performance | Browser cache | Correct static asset invalidation after deploy | UNIT |
| COMPAT-01 | Compatibility | Chromium | End-to-end route and interaction smoke | BROWSER-MOCK |
| COMPAT-02 | Compatibility | Firefox, WebKit, iOS Safari, Android Chrome | Cross-browser/device matrix | MANUAL / NOT VERIFIED |
| SEC-01 | Security | No Firebase Admin secrets in published JS | Web config only; backend verifies tokens | UNIT |
| SEC-02 | Security | External links | noopener/noreferrer & safe URLs | UNIT |
| SEC-03 | Security | Display escaping | HTML/attribute escaping for user-supplied values | UNIT |
| SEC-04 | Security | XSS/CSP/headers | Browser headers / CSP / injection regression | MANUAL |
| RELEASE-01 | Release | Pull request quality gate | Tests and build must be green before merge | PRODUCTION-READ |
| RELEASE-02 | Release | Render frontend & API | Both services live on same merged commit | PRODUCTION-READ |
| RELEASE-03 | Release | Server errors after deploy | Inspect error / 5xx logs | PRODUCTION-READ |

## Current audit limitations
1. The runner's local network cannot resolve the live Render hostname; Render-connected deployment/log sources provide operational evidence only, not browser proof of production behavior.
2. A green unit-test CI run is **not** browser, Firefox/Safari, accessibility or production LCP verification.
3. Firebase live flows need disposable authorized test accounts; neither live account signup nor ratings/admin writes are performed on actual production.
4. The linked Catchpoint result is a public result page, not a newly measured LyricVerse report. It cannot be attributed to LyricVerse without matching test URL, run ID, date and metrics.
5. Manual/browser violations must be triaged in separate documented defects; do not mark them PASS by omission.

## Required release gate
- `npm test`, `npm run build` pass.
- Chromium desktop/mobile browser QA passes.
- Axe WCAG violations are captured and evaluated, never silently ignored.
- Production read-only health, auth readiness and Render deployment checked.
- Known regressions are fixed in a separate PR with tests; retest before declaring ready for public launch.

## Runbook
- `npm ci` (repo has no root lockfile; fallback: `npm install --no-audit --no-fund`)
- `npm --prefix api install --no-audit --no-fund`
- `npm test && npm run build`
- `npm install --no-save --no-package-lock --ignore-scripts playwright@1.56.1 axe-core@4.10.3`
- `npx playwright install chromium --with-deps`
- `node qa/browser-smoke.mjs`
- Upload `qa-results/report.json` and browser screenshots from the CI run.

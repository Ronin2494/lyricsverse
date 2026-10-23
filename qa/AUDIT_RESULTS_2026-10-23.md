# LyricVerse QA Execution Record — 2026-10-23

## Scope and evidence
Test base: `qa/full-site-audit-20261023`, PR #84.
The existing GitHub quality gate executed **257 tests, 257 passed, 0 failed**, and generated the production static build.
New GitHub Actions `Browser and accessibility QA`: **12 browser journeys passed, 0 failed**. Chromium tested viewports **1440 × 900** and **390 × 844**, with the real `dist` frontend and isolated/mock Firebase and API responses.
The browser run uploaded `qa-results/report.json` and screenshots for inspection in the GitHub Actions artifact **lyricverse-browser-qa**.

### Verified automated checks
| Area | Evidence | Result |
|---|---|---|
| Homepage and ratings controls | Browser screenshot, song cards, hero, 5 rating buttons at both sizes | PASS |
| Unified search | Search route, single visible input, live typeahead UI at both sizes | PASS |
| Anonymous library | Empty state and sign-in CTA on both sizes | PASS |
| Song reader | Click first song, hash route, accessible reader on both sizes | PASS |
| Sign-in validation | 3-character password gives explicit six-character minimum, no provider call in fixture | PASS |
| Sign-in provider failure | Mocked Firebase rejects credentials, readable error shown | PASS |
| Registration | Confirm password, strength controls and generated password | PASS |
| Forgot password | Reset screen opens, contains email-only form, safe confirmation | PASS |
| JavaScript exceptions | No uncaught browser exceptions in exercised flows | PASS |
| WCAG 2.1 AA automated rules | axe-core on 8 rendered page states | PASS: no reported violations |
| Viewport scroll containment | Document width equals viewport on 8 page states | PASS |
| Unit/API integration suite | GitHub Quality Gate | PASS: 257/257 |
| Production build | GitHub Quality Gate | PASS |
| Prior production deployment | Render frontend + API on `11acbd0` before the new QA PR merge | PASS / observed |
| New QA code production deployment | Not yet claimed in this report until PR merge and Render verification | PENDING |

### Confirmed defects corrected on this branch
1. **Forgot-password action never opened reset form.** The shared handler intercepted `firebase-reset` before the route-switch branch. Removed it from that handler; browser clicks now pass.
2. **Search suggestion text contrast 1.05:1** against dark background. Fixed using light, accessible text colors. Browser axe audit rerun reports no WCAG 2.1 AA violations in both viewports.
3. **Mobile reader actions and lyrics container extended beyond viewport.** Changed reader controls to wrap, used safe widths, added responsive song-grid containment. Chromium verifies no document-level horizontal scrolling at 390px.

### Cautions / not fully tested
- Render's live deployment status and zero error logs alone do not prove production login success or actual customer-side JS correctness.
- Real Google OAuth popup, live Firebase email verification and password reset delivery, MongoDB profile edits and favorites persistence are **not** exercised by mocked browser flows.
- Desktop/mobile Chromium are not Firefox, Safari, a real iOS/Android device, or 320px/200%-zoom accessibility checks.
- Axe success is **not** equivalent to fully human-tested WCAG conformance or VoiceOver/TalkBack certification.
- Several decorative hero/orbit/song-slider child elements are geometrically outside their containers. They are intentionally clipped and do not cause document scroll in tested viewports; review screenshots before treating them as design defects.
- Catchpoint link supplied by product owner refers to an external public result URL. **No new LyricVerse production WebPageTest measurement (LCP/CLS/INP) was recorded**; do not invent performance scores. Local browser timing metrics are only fixture timings.
- Production public endpoint fetching from this test environment failed (hostname not accessible), so API reachability cannot be confirmed independently from Render deployment status and application tests.

### Final release determination
**QA automation upgraded and green; product-wide end-to-end release certification is NOT YET COMPLETE.**
Before asserting all functionality is production-ready: authorize a disposable Firebase test account and cross-browser test matrix, run production read-only health and authenticated smoke checks, get WebPageTest test run for the *real* LyricVerse production URL, and review QA artifact screenshots.

### Source guidance
- https://www.browserstack.com/guide/how-to-perform-website-qa-testing
- https://testgrid.io/blog/website-testing/
- https://www.catchpoint.com/webpagetest/

# BadBunny Creative Access — CA$10/month

Production frontend: https://badbunny.work/#membership
Render fallback: https://deepak-portfolio-819w.onrender.com/#membership
Membership API: https://badbunny-membership-api.onrender.com
Render API dashboard: https://dashboard.render.com/web/srv-dbbc8te7bikc7381a000
Source branch: `portfolio-site` in `Ronin2494/lyricsverse`.

## Features delivered

- Public "SUBSCRIBE · CA$10" navigation and premium subscription landing section.
- Email one-time-code sign-in; private session tokens (SHA-256 hashes stored in MongoDB).
- Stripe Checkout for **CA$10 every month**, secure signed subscription webhooks, and Stripe billing portal for cancellation and card updates.
- Owner-only upload form for JPG, PNG, WebP, GIF, MP4, WebM and MOV, capped at 100 MB per file.
- MongoDB GridFS-backed private photo/video library with authenticated listing and ten-minute media access tickets.
- Subscription access is granted **only after Stripe confirms an active or trialing subscription**. Successful checkout redirects alone do not grant access.
- No paywall can be bypassed by editing HTML: authorizations occur in the API.

## Required configuration (Render → badbunny-membership-api → Environment)

Set the variables in [the Render API dashboard](https://dashboard.render.com/web/srv-dbbc8te7bikc7381a000). **Never put their values in GitHub or ChatGPT messages.**

| Variable | Use |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas URI for an existing database user; enable access from Render's outbound network in Atlas. |
| `MONGODB_DB` | Optional, defaults to `badbunny_membership`. |
| `SESSION_SECRET` | A random high-entropy secret, at least 32 characters long. Generate privately with a password manager, `openssl rand -hex 32`, or equivalent. |
| `ADMIN_EMAIL` | **Your verified personal email address** — this exact email signs in to the creator uploader (case-insensitive). |
| `RESEND_API_KEY` | Server-side API key from Resend. |
| `MAIL_FROM` | A sender verified in Resend, e.g. `BadBunny <members@badbunny.work>`. Verify sending domain and DNS records first. |
| `STRIPE_SECRET_KEY` | Stripe secret API key. Use test credentials during testing; use live keys for accepting real payments. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the Stripe webhook endpoint below. |
| `SITE_URL` | `https://badbunny.work` (already the default). |
| `CORS_ORIGINS` | Defaults to `https://badbunny.work,https://www.badbunny.work,https://deepak-portfolio-819w.onrender.com`. |

### Stripe setup

1. Create/activate a Stripe account in the country of your registered business or individual account. Complete required identity and banking verification.
2. In Stripe **Developers → Webhooks**, register the endpoint:
   `https://badbunny-membership-api.onrender.com/api/billing/webhook`
3. Subscribe it to exactly these relevant events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy that webhook endpoint's signing secret to `STRIPE_WEBHOOK_SECRET` in Render. Test and live mode have different keys/secrets.
5. Enable the **Stripe customer portal** (payment-method management and cancellation) in Stripe.
6. Subscription amount is defined server-side as `currency: 'cad', unit_amount: 1000, recurring: { interval: 'month' }`. The browser does not control billing amounts.

### Email and MongoDB setup

- Verify `badbunny.work` as a sending domain in Resend and set `MAIL_FROM` to an address authorized by that domain.
- Create a dedicated Atlas database user with access only to the membership database where practical. Do not reuse admin/root credentials.
- In Atlas network access, allow Render egress using the narrowest available configuration; if your Render plan does not have static outbound IPs, evaluate Atlas network rules carefully.
- Set `ADMIN_EMAIL` to the email you actually control. Authentication of that address via Resend one-time codes is required before the owner upload interface appears.

### Launch checklist

1. Verify `GET /api/health` returns `database: connected`.
2. Verify `GET /api/config` returns `authEnabled: true` and `billingEnabled: true` when ready.
3. Sign in with `ADMIN_EMAIL`; verify creator upload controls appear.
4. Upload a small test photo/video. Check it is absent from the public page and unauthenticated media API.
5. With a **different test email**, complete a Stripe test-mode checkout. Verify the signed webhook activates private access.
6. Check the Stripe billing portal, subscription cancellation, email verification limits, and media ticket expiry.
7. Swap to verified **live** Stripe credentials and live webhook secret, perform a small real payment/cancellation check, then announce subscriptions.

Until these external credentials are configured, the API and public page remain available, but paid checkout is **safely disabled**. The site does not claim that a payment was accepted.

## Operational notes

- Photo/video files are stored inside MongoDB GridFS, **not in the GitHub repository** or Render's ephemeral disk.
- The initial uploader restricts individual files to 100 MB. For an extensive video library, move to an encrypted/private object store and CDN with expiring URLs before scaling.
- Media URLs are short-lived bearer-style links, not DRM. Subscribers could capture media they legitimately watch; no web paywall can prevent screen recording.
- Emails are verified with six-digit codes expiring after 10 minutes, with per-email and per-client rate limits.
- Session token persists in the browser tab's session storage and is removed when the user signs out.
- Reactivation/expiry follows Stripe subscription webhooks. If webhooks are misconfigured, newly paid access can remain locked; monitor webhook delivery.

## Maintenance

```bash
npm --prefix portfolio-membership-api install
npm --prefix portfolio-membership-api run check
npm --prefix portfolio-membership-api start
```

Static frontend lives in `portfolio-site/index.html`, `portfolio-site/membership.css`, and `portfolio-site/membership.js`. The API is in `portfolio-membership-api/server.js`. The API and static site both auto-deploy from the `portfolio-site` branch.

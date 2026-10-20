# BadBunny Private Media Gallery and Creator Studio

## Live links

- **Separate creator uploader**: https://badbunny.work/studio.html
- **Public locked gallery**: https://badbunny.work/#membership
- **API service**: https://badbunny-membership-api.onrender.com
- **API Render dashboard**: https://dashboard.render.com/web/srv-dbbc8te7bikc7381a000
- **Repository**: https://github.com/Ronin2494/lyricsverse/tree/portfolio-site

The public website intentionally contains **no creator login or uploader**. Creator Studio is an unlisted separate page. URL secrecy is not authorization: every write request is verified again in the backend.

## Studio functionality

1. Sign in with a one-time email verification code delivered through Resend. Only the exact `ADMIN_EMAIL` account is accepted.
2. Choose a JPEG, PNG, WebP, GIF, MP4, WebM, or MOV (max 100 MB). A local preview displays the selected file.
3. Set a title, optional description, and **per-file price in CAD (CA$1–CA$1,000)**.
4. Set a PayPal Payment Link for that **specific item's price**. Default link: https://www.paypal.com/ncp/payment/3JZWWYUL6RF4E. A custom price cannot reuse the default link through the studio form.
5. Upload; the backend stores the original privately in MongoDB GridFS with title, description, price in cents, link, and publish state.
6. Public `GET /api/gallery` returns metadata only (no private files, previews, or signed URLs). The site renders a locked media card showing its **price and matching PayPal payment link**.
7. In Creator Studio, list published items, preview securely with time-limited signed tickets, edit title/description/price/link, or delete media.

## Required Render environment setup

Visit the [API service's Environment tab](https://dashboard.render.com/web/srv-dbbc8te7bikc7381a000) and add:

| Name | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas driver connection string with a DB user allowed to read/write the database. |
| `MONGODB_DB` | `badbunny_membership` |
| `SESSION_SECRET` | Random secret of at least 32 characters used for signed private preview tickets and OTP hashes. |
| `ADMIN_EMAIL` | Your exact creator email; only this identity can sign in and upload/edit/delete. |
| `RESEND_API_KEY` | API key from Resend for sending six-digit OTP emails. |
| `MAIL_FROM` | Sender address on a verified Resend sending domain (e.g. `BadBunny <members@badbunny.work>`). |
| `CORS_ORIGINS` | `https://badbunny.work,https://www.badbunny.work,https://deepak-portfolio-819w.onrender.com` |

Create a database and user in MongoDB Atlas, configure its network allowlist for the Render backend, and verify the email sending domain in Resend. Save secrets **only** in Render. Trigger a deploy only if Render doesn't do so automatically.

The studio HTML/CSS/JS and the API can be deployed before these credentials exist, but **login, publishing, and media previews will remain unavailable until MongoDB and Resend are ready**. The studio displays its configuration status.

## Payment correctness and limitations

A PayPal `/ncp/payment/...` Payment Link is a **one-time payment link**. Its amount is configured at PayPal; showing a price on our card cannot set/change the actual checkout price.

- Set a **matching PayPal link** when publishing a product with a different price.
- The public card explicitly notes that PayPal controls the amount charged and that access needs verification.
- A redirect to PayPal or completion of the payment link **does not automatically unlock or release the original files**. Automated per-item fulfillment requires a PayPal merchant API/webhook integration with verified order details and item-level entitlements, which is not configured. Do not advertise instant access until that is implemented.
- Stripe code and credentials have been removed from this creator-focused backend.

## Security

- Public catalog never returns image/video bytes or private GridFS identifiers beyond opaque IDs.
- File upload, edit, deletion, private listing, and media ticket generation all require a valid session and server-side creator identity.
- File retrieval checks the ticket HMAC/expiration and creator authorization.
- File types and file sizes are server constrained; MongoDB GridFS media is not public.
- OTPs expire after 10 minutes, with attempt and request limits; 30-day hashed sessions live in MongoDB.
- The uploader page uses `noindex,nofollow` but relies on server authentication, not obscurity.

## Smoke test after environment configuration

1. Open https://badbunny.work/studio.html from your phone.
2. Enter the `ADMIN_EMAIL` and the received six-digit code.
3. Choose a small image or video, add a title, CA$10.00 and the correctly configured PayPal link; publish.
4. Open https://badbunny.work/#membership in a separate tab. Confirm the locked card, title, type, price and button.
5. Edit the price and update the PayPal link in Studio. Refresh the gallery, confirm both change.
6. Preview the original from Studio; verify that opening its file URL without a signed ticket fails.
7. Delete the test upload; verify it disappears from the public gallery.
8. Test invalid prices, unsupported file types, oversize files, unauthenticated uploads and unauthorized accounts.

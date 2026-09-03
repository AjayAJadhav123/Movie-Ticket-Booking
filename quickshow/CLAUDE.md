# QuickShow – Security Rules for AI Coding Agents

> Drop this file in the project root. Every AI tool (Claude, Cursor, Copilot, etc.) working on this
> codebase **must follow every rule below**. No exceptions, no asking twice.
>
> Stack: Node.js / Express (server) · React / Vite (client) · MongoDB / Mongoose · JWT Auth ·
> Cashfree + Stripe payments · Socket.IO · Inngest background jobs · Render + Vercel deployment.

---

## 1 · Secrets and Environment Variables

**RULE: No secret ever appears in client-side code or in a git commit.**

- All secrets live in `.env` files only. `.env` is already in `.gitignore` — keep it there.
- `server/.env` holds: `MONGODB_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `TMDB_API_KEY`, `INNGEST_EVENT_KEY`,
  `INNGEST_SIGNING_KEY`, `CLERK_JWT_KEY`.
- **None of the above keys may appear in `client/` code**, webpack output, or API responses.
- Vite / frontend: only `VITE_*` prefixed variables belong in the client bundle. They must **never**
  be secret keys — only public identifiers (e.g. public Cashfree mode string).
- Access backend secrets via `process.env.VAR_NAME` only. Never interpolate them into strings
  returned in HTTP responses or logged to the console.
- When adding a new integration, add the variable name (with an empty value) to `server/.env.example`
  and `client/.env.example` immediately.
- If a value is intentionally public (e.g. Stripe publishable key, Cashfree mode), add an explicit
  comment: `// PUBLIC KEY — intentionally exposed`.

```js
// ✅ Correct
const cashfree = new Cashfree(CFEnvironment.SANDBOX, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY);

// ❌ Never
const cashfree = new Cashfree(1, 'CFxxxxxx', 'cfsk_ma_test_...');
```

---

## 2 · Rate Limiting

**RULE: Every public-facing Express route must be covered by a rate limiter.**

The project already uses `express-rate-limit`. Maintain and extend these limits:

| Route group | Limit | Window |
|---|---|---|
| Auth (`/api/user/login`, `/register`, `/forgot-password`, OTP) | 15 req | 15 min |
| Booking / Payment (`/api/booking/*`) | 20 req | 15 min |
| AI chat (`/api/ai/*`) | 10 req | 1 min |
| General API | 100 req | 15 min |
| File / image uploads | 5 req | 1 min |

- Return `429` with `Retry-After` header — already configured via `standardHeaders: true`.
- Never silently swallow `429` in the frontend. Show a user-readable toast/message.
- When adding a new route file, import and apply the appropriate limiter from the start.

```js
// Adding a new route — always apply a limiter
import rateLimit from 'express-rate-limit';
const uploadLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
router.post('/upload', uploadLimiter, requireAuth, handleUpload);
```

---

## 3 · Input Validation and Sanitization

**RULE: Validate and sanitize all user input on the server before any DB write or downstream call.**

- The project does not yet use Zod or Joi systematically — add schema validation when writing new
  controller functions.
- For MongoDB / Mongoose: always use Mongoose schema types (type, required, maxlength, enum). Never
  build raw query strings from user input.
- Sanitize string fields before storing: trim whitespace, enforce `maxlength`.
- Validate that ObjectIds are valid Mongo IDs before calling `findById()`.
- File uploads: validate MIME type and extension server-side. Never trust `req.file.mimetype` alone —
  use a magic-byte library such as `file-type`.
- Reject invalid input with `400 Bad Request`. Include a clear field-level error message for the
  client but never expose internal error details.

```js
// ✅ Safe: Mongoose ObjectId check before query
import mongoose from 'mongoose';
if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
const doc = await Model.findById(req.params.id);
```

---

## 4 · Authentication and Authorization

**RULE: Verify both identity and ownership on every protected request.**

The project uses custom JWT (`jsonwebtoken`) + bcrypt. Rules:

- Passwords: bcrypt with **minimum cost 12**. Never store plain-text or MD5/SHA1 hashes.
- JWTs:
  - Signed with `process.env.JWT_SECRET` (must be ≥ 32 random characters — enforce at startup).
  - Short expiry: user tokens `24h`, admin tokens `8h`. Refresh token support should use httpOnly cookies.
  - Verify token version (`decoded.tokenVersion === user.tokenVersion`) to support forced logout —
    already implemented; do not remove this check.
- Every protected route must use `requireAuthMiddleware` from `server/middleware/auth.js`.
- Admin routes must additionally check `req.isAdminToken === true`. Never rely solely on a body/query
  field claiming admin status.
- Ownership checks: always confirm the resource belongs to `req.userId`. The ObjectId fix
  (`booking.userId.toString() !== req.userId`) is in place — maintain this pattern everywhere.
- Account lockout after 5 consecutive failed logins — add if not already present in `authController`.

```js
// ✅ Check identity AND ownership
const booking = await Booking.findById(bookingId);
if (!booking) return res.status(404).json({ message: 'Not found' });
if (booking.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
```

---

## 5 · Database Security (MongoDB / Mongoose)

**RULE: All DB access goes through Mongoose models. No raw query string construction.**

- Never interpolate user input into query objects directly. Use typed schema fields.
- Dangerous operators (`$where`, `$function`, JavaScript execution) are forbidden unless absolutely
  required and independently reviewed.
- Sanitize inputs that reach `.find()` or `.aggregate()` to prevent NoSQL injection (`{ $gt: '' }`
  style attacks).
- The MongoDB Atlas user should only have `readWrite` on the application database — not `atlasAdmin`.
- Never return raw Mongoose error objects to the client — they expose field names and schema info.
- Use `.lean()` for read-only queries to improve performance and to prevent accidental mutation.
- Index fields used in frequent queries (`userId`, `showId`, `status`, `cashfreeOrderId`).

```js
// ✅ Safe: Mongoose typed query
const bookings = await Booking.find({ userId: req.userId, status: 'confirmed' }).lean();

// ❌ Never: user input as operator key
const bookings = await Booking.find({ userId: req.body.filter }); // could be { $gt: '' }
```

---

## 6 · CORS Configuration

**RULE: No wildcard CORS in production. Explicit origin allowlist only.**

Current allowlist lives in `server/server.js`. Rules:

- Allowlist includes: `https://quickshow-eight.vercel.app`, `http://localhost:5173`,
  `http://localhost:3000`, and `http://localhost:5001`.
- When adding a new deployment domain, add it to the allowlist — not by widening the pattern.
- `credentials: true` is required (auth cookies / headers). Do not remove.
- Preflight `OPTIONS` requests are handled by the cors middleware — do not bypass with a blanket
  `app.options('*', ...)`.

---

## 7 · HTTP Security Headers (Helmet)

**RULE: Helmet is already applied in `server.js`. Do not remove or loosen its config.**

Current directives include:

- `Content-Security-Policy` scoped to known CDNs (Cashfree, TMDB, Google Fonts, Socket.IO CDN).
- `X-Frame-Options: DENY` (clickjacking protection).
- `X-Content-Type-Options: nosniff`.
- `Strict-Transport-Security` (HSTS).
- `X-Powered-By` removed.

When adding a new external resource (CDN, API domain, iframe), update the `contentSecurityPolicy`
directives in Helmet's config rather than removing CSP entirely.

---

## 8 · File Upload Security

**RULE: Server-side validation of type, size, and name is mandatory for all uploads.**

- Validate MIME type using magic bytes (`file-type` npm package), not just the `Content-Type` header.
- Enforce size limits: **5 MB** for images, **25 MB** for documents.
- Rename uploaded files to a UUID (`crypto.randomUUID()`). Never use `req.file.originalname` as the
  stored filename.
- Store files in a cloud bucket (S3 / Cloudinary / GCS). Never serve user uploads from the Express
  static middleware.
- Never grant executable permissions to upload directories.

---

## 9 · Error Handling and Logging

**RULE: Generic messages to the client. Full context server-side.**

- API responses to the client must never contain stack traces, Mongoose error objects, raw SQL errors,
  or internal variable names.
- Use correct status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found,
  `429` rate limited, `500` unhandled server error.
- Every `catch` block must log: timestamp, route, sanitized input summary, error message, and user ID
  if available.
- Cashfree / Stripe errors: log the full upstream error server-side. Return only a sanitized
  `message` field to the client. The error-masking bug (returning 500 for Cashfree 401) has been
  fixed — do not re-introduce generic masking that hides the root cause.
- Set up a Sentry / Logtail / Datadog integration in production for persistent error tracking.

```js
// ✅ Correct error response pattern
catch (err) {
  console.error('[createCashfreeOrder]', { userId: req.userId, err: err.message });
  const status = err.response?.status || 500;
  return res.status(status).json({ success: false, message: err.response?.data?.message || 'Payment error' });
}
```

---

## 10 · Dependency Security

**RULE: Audit dependencies after every `npm install`. Pin versions in production.**

- Run `npm audit` in both `server/` and `client/` after installing packages. Fix `high` and
  `critical` issues before merging.
- Do not install packages that have had no security updates in ≥ 2 years.
- Use exact versions (`"express": "4.19.2"`) in production `package.json` files, not ranges.
- Review `postinstall` / `preinstall` scripts in new packages before accepting them.
- Known dependency note: `cashfree-pg` v6.0.4 defaults `XApiVersion` to `2026-01-01` which the
  Sandbox rejects — the fix (`cashfree.XApiVersion = "2023-08-01"`) must be preserved.

---

## 11 · XSS Prevention

**RULE: Never render dynamic user content as raw HTML.**

- React's JSX escapes output by default — do not bypass this with `dangerouslySetInnerHTML`.
- If rich text from a user or LLM must be rendered as HTML, sanitize it with `DOMPurify` first.
- Do not use `eval()`, `new Function()`, or `innerHTML` with dynamic content anywhere in `client/`.
- Avoid inline `<script>` tags in JSX. Move JavaScript to module files to enable CSP enforcement.
- LLM / AI responses rendered in `AIChat.jsx` must be treated as untrusted — sanitize before display.

```js
// ✅ Safe: let React escape
<p>{userGeneratedContent}</p>

// ✅ Safe: sanitize before dangerouslySetInnerHTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(llmOutput) }} />

// ❌ Never
<div dangerouslySetInnerHTML={{ __html: llmOutput }} />
```

---

## 12 · Payment and Booking Security (Cashfree + Stripe)

**RULE: Never trust client-supplied payment amounts or status. Always verify server-side.**

QuickShow-specific payment rules:

- The booking amount is always calculated **server-side** from the show's database price, never from
  `req.body.amount`.
- After Cashfree checkout, the `/api/booking/verify-cashfree-payment` endpoint must call the Cashfree
  API to confirm `payment_status === 'SUCCESS'` before marking a booking `confirmed`. Do not skip
  this step.
- Cashfree `return_url` and `notify_url` must point to the backend's own domain, not a user-supplied
  URL.
- Stripe webhook events must be verified with `stripe.webhooks.constructEvent()` using
  `STRIPE_WEBHOOK_SECRET`. Never trust unverified webhook payloads.
- Seat locks released on payment failure must go through the unlock endpoint — do not skip cleanup.
- Do not expose `paymentSessionId`, `orderId`, or payment credentials in frontend error messages or
  console logs.
- Cashfree environment must be consistent: `SANDBOX` ↔ sandbox credentials ↔ sandbox SDK mode.
  `PRODUCTION` ↔ production credentials. Mismatches cause authentication failures.

---

## 13 · AI / LLM-Specific Rules (AIChat + ai-service)

**RULE: Treat LLM inputs and outputs as untrusted data.**

- The `OPENAI_API_KEY` (or equivalent) lives in `ai-service/.env` only. It must never appear in
  client-side code or be proxied to the browser.
- All LLM API calls go through the `ai-service` backend. The browser calls `/api/ai/*`, never the
  LLM provider directly.
- Set `max_tokens` on every LLM call. Failing to do so exposes the app to runaway cost attacks.
- Sanitize user messages before passing to the LLM (strip prompt injection patterns where possible).
- Validate and sanitize LLM output before rendering in `AIChat.jsx`. Generated HTML is an XSS vector.
- Log token usage per user per session. Implement per-user token budgets to cap daily spend.

---

## Pre-Deploy Gate (Run before every production deploy)

```
[ ] server/.env is NOT committed to git (`git status` shows no .env files)
[ ] All secrets are set in Render environment variables (not hardcoded)
[ ] All secrets are set in Vercel environment variables
[ ] NODE_ENV=production on the server
[ ] Debug logging / verbose console.log statements removed or gated behind NODE_ENV check
[ ] MongoDB Atlas IP allowlist does not include 0.0.0.0/0 (open to the world)
[ ] HTTPS enforced end-to-end (Render + Vercel both force HTTPS by default — verify)
[ ] Rate limiting is active on all /api/* routes
[ ] CORS allowlist contains only the production Vercel domain + no wildcards
[ ] Cashfree environment = PRODUCTION with production credentials (not sandbox)
[ ] Stripe is in live mode with live keys (not test)
[ ] npm audit shows 0 high/critical vulnerabilities in both server/ and client/
[ ] Unused test routes / scripts removed from server/routes/
```

---

## Quick Reference

| Area | Rule | Project-Specific Note |
|---|---|---|
| **Secrets** | `.env` only. Never in `client/`. | `CASHFREE_SECRET_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY` are backend-only |
| **Rate Limiting** | Auth: 15/15min. API: 100/15min. AI: 10/1min. | `authRoutes.js` already has limiter — extend to new routes |
| **Input Validation** | Mongoose schema + ObjectId check on every param | `mongoose.isValidObjectId()` before `findById()` |
| **Auth** | bcrypt ≥ cost 12. JWT ≥ 32-char secret. Short expiry. | Check `tokenVersion` — do not remove |
| **Ownership** | `.toString()` comparison on ObjectIds | Fixed in `getBookingById` — maintain the pattern |
| **DB** | Mongoose models only. No raw string queries. | Use `.lean()` for read-only |
| **CORS** | Explicit origin allowlist. No `*` in prod. | Allowlist in `server.js` |
| **Headers** | Helmet already applied. Do not loosen CSP. | Add new CDN domains to CSP rather than removing it |
| **Uploads** | MIME + size + UUID rename. Cloud storage only. | Never `express.static()` user uploads |
| **Errors** | Generic to client. Full context in server logs. | Do not re-introduce 500 masking over Cashfree errors |
| **Deps** | `npm audit` after every install. Exact versions in prod. | `cashfree.XApiVersion = "2023-08-01"` must stay |
| **XSS** | No `dangerouslySetInnerHTML` without DOMPurify. | Apply to AI chat output rendering |
| **Payments** | Server-side amount calculation. Verify after checkout. | `verifyCashfreePayment` endpoint is mandatory — never skip |
| **LLM** | Server-side key. `max_tokens` always set. Sanitize output. | Route all LLM calls through `ai-service` |
| **Deploy** | Run the 12-point gate above before every ship. | Switch Cashfree env + Stripe to live mode |

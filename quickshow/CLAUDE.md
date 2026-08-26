# QuickShow — Security & Code Standards

> Drop this file in the project root. Every AI tool and every developer working on this codebase must follow these rules without exception. No shortcuts, no "just for now" bypasses.

---

## Stack Reference

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (`VITE_` prefix for public env vars) |
| Backend | Node.js + Express |
| Database | MongoDB via Mongoose |
| Auth | Custom JWT (`authController.js`) + bcryptjs |
| Payments | Cashfree |
| AI | OpenAI (`aiController.js`) |
| Email | Resend / Nodemailer (`emailService.js`) |

---

## 1. Secrets & Environment Variables

**RULE: No secret ever touches frontend code or version control.**

- All API keys, tokens, DB URIs, and private configs live in `.env` (server) or `client/.env` only.
- `.env`, `.env.local`, `.env.*.local` are in `.gitignore` — verify before every push.
- Frontend (Vite): only `VITE_`-prefixed variables go in `client/.env`. These must NEVER be secret keys.
  - OK: `VITE_BACKEND_URL` — safe, it is a URL
  - OK: `VITE_CLERK_PUBLISHABLE_KEY` — safe, it is a public key (document intent with a comment)
  - OK: `VITE_STRIPE_PUBLIC_KEY` — safe, it is a public key (document intent)
  - NEVER: `VITE_OPENAI_API_KEY` — all OpenAI calls go through the backend only.
  - NEVER: `VITE_CASHFREE_SECRET_KEY`
- `VITE_TMDB_API_KEY` in the client .env is a known risk. Proxy all TMDB calls through the backend and remove this key from the client.
- Backend secrets are accessed via `process.env.VAR_NAME` only and are NEVER returned in API responses.
- `.env.example` (already present) must stay in sync with all new variables — with empty values only.

---

## 2. Rate Limiting

**RULE: Every public-facing endpoint has rate limiting. No exceptions.**

The project already uses `express-rate-limit` in `adminAuthRoutes.js`. Apply the same pattern everywhere:

| Endpoint Type | Limit |
|---|---|
| Auth (login, register, OTP, forgot-password) | 5 req / 15 min per IP |
| General API | 60 req / min per IP |
| AI / LLM proxy (`/api/ai/*`) | 10 req / min per user |
| File uploads (if added) | 5 req / min per IP |

- Always return `429 Too Many Requests` with a `Retry-After` header.
- Never swallow rate limit errors on the frontend — show a clear user-facing message.

---

## 3. Input Validation & Sanitization

**RULE: Validate and sanitize everything on the server. Client-side validation is UX only.**

- Use a schema validation library for all incoming request bodies. Recommended: Zod or Joi.
- Validate: data type, string length limits, required fields, allowed enum values, email format.
- Sanitize all string inputs before storing or displaying them.
- Use Mongoose (already in use) — never interpolate user input into raw MongoDB queries.
- For any future file uploads: validate MIME type, file extension, AND file size server-side.
- Reject invalid input with `400 Bad Request` and log the attempt server-side.

---

## 4. Authentication & Authorization

**RULE: Verify identity AND permission on every protected request.**

- Passwords use bcryptjs (already in use). Minimum salt rounds: 12. Never store plain text.
- JWTs are signed with `process.env.JWT_SECRET` (minimum 32 characters). Already in `authController.js`.
- JWT expiry: user tokens 7d (current), admin tokens 24h (current). Consider shortening user tokens to 1d.
- Refresh tokens not yet implemented. If added: store in httpOnly cookies, NEVER in localStorage.
- `requireAuthMiddleware` + `requireAdminMiddleware` chain must be applied to ALL admin routes.
- Always check both authentication (is this a valid user?) AND authorization (does this user own this resource?).
- Add explicit ownership check: `if (resource.userId.toString() !== req.userId) return 403`

---

## 5. Database Security

**RULE: Always use Mongoose models and methods. Never concatenate user input into queries.**

- Mongoose is in use — keep it that way for all database operations.
- Never use ``, raw `eval`, or string-interpolated queries.
- Sanitize inputs before passing to Mongoose.
- Select only the fields you need. Avoid returning entire documents when a subset is enough.
- Never return raw database errors to the client — they leak schema information.
- MongoDB URI contains credentials — lives in `process.env.MONGODB_URI` only, never in source.

---

## 6. CORS Configuration

**RULE: Never use wildcard CORS in production.**

- Explicitly whitelist only the domains that need access using `process.env.FRONTEND_URL`.
- Restrict allowed HTTP methods to only what each route needs.
- Never: `app.use(cors({ origin: '*' }))` in production.

---

## 7. HTTP Security Headers

**RULE: Always keep helmet active. Never disable it to fix a loading error.**

The project uses `helmet` in `server.js` (confirmed). Keep this configuration active.
Required headers: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security, Referrer-Policy: strict-origin-when-cross-origin.

Any new third-party CDN added to the frontend must be added to the CSP — never disable CSP to fix a console error.

---

## 8. File Upload Security

**RULE: Validate, rename, and store uploads safely. (Applies when file uploads are added.)**

This project does not currently have file uploads. When added:
- Validate MIME type by reading file headers (magic bytes), not just Content-Type.
- Size limits: 5MB for images, 25MB for documents.
- Store in cloud bucket (S3, GCS, or Cloudinary) — never in local filesystem or web root.
- Rename uploaded files to a UUID. Never use the original filename.
- Never serve user-uploaded files with executable permissions.

---

## 9. Error Handling & Logging

**RULE: Never return internal error details to the client.**

- Return generic messages: "Something went wrong" or "Server error".
- Log full error details server-side with context: timestamp, route, req.userId if available.
- Use correct HTTP status codes:
  - 400 — bad input / validation failure
  - 401 — not authenticated
  - 403 — authenticated but not authorized
  - 404 — resource not found
  - 429 — rate limited
  - 500 — unexpected server error
- Never return 500 for a validation failure.
- Never expose: error.message, error.stack, database field names, or query details in API responses.

---

## 10. Dependency Security

**RULE: Run npm audit after every install and before every deploy.**

- Run `npm audit` on both `client/` and `server/` after installing packages.
- Fix all high and critical severity issues before shipping.
- Do not install packages that have not been updated in 2+ years for security-relevant functionality.
- Never delete `package-lock.json`.

---

## 11. XSS Prevention

**RULE: Never render dynamic user content as raw HTML.**

- No `dangerouslySetInnerHTML` in React unless content is sanitized with DOMPurify first.
- No `eval()`, `new Function()`, or `innerHTML` assignments with dynamic user content.
- No inline `<script>` tags — move all JS to external files to allow CSP enforcement.
- The AI assistant chat responses must be rendered as plain text or sanitized with DOMPurify — never rendered raw as HTML.

---

## 12. AI / LLM-Specific Rules (OpenAI)

**RULE: Treat LLM inputs and outputs as untrusted. Protect the token budget.**

- NEVER call OpenAI directly from the frontend. All LLM calls go through `/api/ai/*` backend endpoints.
- `OPENAI_API_KEY` must NEVER appear in any VITE_ variable or client code.
- Sanitize user input before passing to the LLM to prevent prompt injection.
- `max_tokens` is already set to 1000 in `aiController.js`. Do not remove this limit.
- Log token usage per user (prompt + completion tokens) to detect abuse early.
- Implement per-user token budgets or session-based rate limits to prevent cost attacks.
- Validate and sanitize LLM output before rendering in the UI — AI-generated HTML is an XSS risk.

---

## 13. Pre-Deploy Checklist

Run through this before EVERY deploy. Takes 2 minutes.

- [ ] .env files are NOT committed to git (`git status` check)
- [ ] All secrets are set in the hosting platform env config (Render, Vercel)
- [ ] `NODE_ENV=production` is set on the server
- [ ] Debug logging and verbose error output are disabled in production
- [ ] MongoDB is NOT publicly exposed (IP allowlist configured in Atlas)
- [ ] HTTPS is enforced on all endpoints
- [ ] Rate limiting is active on all public auth endpoints
- [ ] CORS is restricted to the production frontend URL only
- [ ] Helmet is active and CSP is not disabled
- [ ] `npm audit` run on both client and server — no high/critical issues open
- [ ] No hardcoded API keys, tokens, or secrets in any source file
- [ ] Admin routes all use `requireAuthMiddleware` + `requireAdminMiddleware`
- [ ] AI endpoints have per-user rate limiting active
- [ ] Unused or test API routes are removed or protected
- [ ] `VITE_TMDB_API_KEY` proxied through backend (or acknowledged risk documented)

---

## Quick Reference

| Area | Rule | Status in QuickShow |
|---|---|---|
| Secrets | Keys in `.env` only. Never in frontend code | `VITE_TMDB_API_KEY` is a known gap |
| Rate Limiting | 5 req/15 min auth; 60 req/min general | `express-rate-limit` installed — expand coverage |
| Input Validation | Server-side schema validation required | Add Zod to all route handlers |
| Auth | bcrypt min cost 12; JWT short expiry | bcryptjs in use; admin tokens 24h OK |
| DB Security | Mongoose only. No raw queries | Mongoose in use |
| CORS | No wildcard in production | Set `FRONTEND_URL` env var explicitly |
| HTTP Headers | CSP, HSTS, X-Frame-Options: DENY | helmet in use — never disable |
| File Uploads | MIME + extension + UUID rename | Not yet implemented — follow rules when added |
| Error Handling | Generic messages to client; full logs server-side | Partially done — audit new controllers |
| Dependencies | `npm audit` after every install | Run before every PR merge |
| XSS | No `dangerouslySetInnerHTML`, no `eval()` | Currently clean |
| AI / LLM | Sanitize input; server-side key; token budgets | `max_tokens` set; add per-user logging |
| Deploy Gate | Run checklist before every ship | See Section 13 |

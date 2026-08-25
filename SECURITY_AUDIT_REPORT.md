# QuickShow - Security & Deployment Audit Report
## Date: August 23, 2026

---

## CRITICAL FINDINGS (MUST FIX BEFORE PRODUCTION)

### 1. 🔴 CRITICAL: Cashfree Webhook NOT Signed - Payment Can Be Forged
**Status:** HIGH SEVERITY  
**File:** `quickshow/server/controllers/bookingController.js`  
**Issue:** `handleCashfreeWebhook()` does NOT verify webhook signature. Attacker can forge payment success events.
```javascript
// Current Code - NO SIGNATURE VERIFICATION
export const handleCashfreeWebhook = async (req, res) => {
  try {
    const event = req.body;  // ❌ No signature verification!
    if (event.type === 'PAYMENT_SUCCESS' || event.type === 'PAYMENT_FAILED') {
      // Directly marks booking as confirmed without verifying signature
```
**Risk:** Attacker sends fake webhook → booking confirmed without payment → FREE TICKETS  
**Fix:** Verify Cashfree webhook signature using HMAC-SHA256

---

### 2. 🔴 CRITICAL: `/api/booking/create-cashfree-order` Has NO Authentication
**Status:** HIGH SEVERITY  
**File:** `quickshow/server/routes/bookingRoutes.js` (Line 24)
```javascript
router.post('/create-cashfree-order', 
  // ❌ COMMENT: requireAuthMiddleware,  // TEMP BYPASS - Line says
  createCashfreeOrder
);
```
**Issue:** Auth middleware is COMMENTED OUT. Unauthenticated users can create bookings.
**Risk:** Anyone can create bookings for any show without login → refund fraud  
**Fix:** Remove bypass, add `requireAuthMiddleware`

---

### 3. 🔴 CRITICAL: Admin Session NOT Properly Isolated from Public Session
**Status:** HIGH SEVERITY  
**File:** `quickshow/client/src/pages/admin/AdminLogin.jsx` (Lines 44-46)
```javascript
if (data.success && data.adminToken) {
  localStorage.setItem('adminToken', data.adminToken);
  await signOut(); // Destroy Clerk session to isolate public session
```
**Issue:** While `signOut()` is called, there's no guarantee about timing. A race condition during logout could leave admin token accessible to public operations.
**Risk:** Admin token could be used by normal user code in edge cases  
**Fix:** Strict session isolation + clear admin-only middleware verification

---

### 4. 🔴 CRITICAL: CORS Allows ALL Origins in Production Comment
**Status:** HIGH SEVERITY  
**File:** `quickshow/server/server.js` (Lines 33-44, 67-85)
```javascript
cors: {
  origin: function (origin, callback) {
    const allowedOrigins = [...];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // ❌ ALLOW ALL ORIGINS - "for now"
    }
  },
```
**Risk:** Any malicious frontend can make requests to API. Credentials can be leaked.
**Fix:** Enforce strict whitelist in production

---

### 5. 🔴 CRITICAL: No Rate Limiting on Payment Endpoints
**Status:** HIGH SEVERITY  
**File:** `quickshow/server/routes/bookingRoutes.js`
```javascript
router.post('/create-cashfree-order', createCashfreeOrder); // ❌ NO RATE LIMIT
router.post('/verify-cashfree-payment', requireAuthMiddleware, verifyCashfreePayment); // ❌ NO RATE LIMIT
```
**Risk:** Brute force attacks on payment endpoints. Spam booking attempts.
**Fix:** Add rate limiting (10 requests/hour per user on create-order)

---

### 6. 🔴 CRITICAL: No Input Validation on Seat Numbers
**Status:** MEDIUM-HIGH SEVERITY  
**File:** `quickshow/server/controllers/bookingController.js`
**Issue:** Seats array is not validated. User can send malicious data.
```javascript
const { showId, seats } = req.body;  // ❌ No validation
// Only checks if array and non-empty
if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
```
**Risk:** SQL injection via seat numbers, NoSQL injection, malformed data  
**Fix:** Validate seat format: `[A1, A2, ...]` - letter + number

---

### 7. 🔴 CRITICAL: Admin JWT Fallback Secret is Hardcoded
**Status:** HIGH SEVERITY  
**File:** `quickshow/server/middleware/auth.js` (Line 45)
```javascript
const secret = process.env.JWT_SECRET || 'fallback_dev_admin_secret_998877';  // ❌ Hardcoded fallback!
```
**Risk:** In production, if `JWT_SECRET` not set, the fallback is publicly known. Anyone can forge admin tokens.
**Fix:** Throw error if `JWT_SECRET` not set; don't provide fallback

---

## HIGH SEVERITY ISSUES

### 8. 🟠 Missing Helmet Security Headers
**Status:** HIGH  
**Issue:** No X-Frame-Options, X-Content-Type-Options, CSP, HSTS headers
**Files Affected:** `quickshow/server/server.js`
**Risk:** XSS, clickjacking, header injection attacks
**Fix:** Install & configure Helmet middleware

---

### 9. 🟠 No Webhook Signature Verification for Stripe
**Status:** HIGH  
**File:** `quickshow/server/controllers/bookingController.js` - `handleStripeWebhook()`
**Issue:** While Stripe webhook signature IS verified (line 307), need to confirm it's using `req.rawBody`
**Status:** ✅ Actually OK - verified on line 307 with `stripe.webhooks.constructEvent()`

---

### 10. 🟠 MongoDB Connection String Exposed in .env
**Status:** HIGH  
**File:** `quickshow/server/.env`
```
MONGODB_URI=mongodb://aj386092_db_user:Ajay_1234@...
```
**Risk:** Database credentials in versioned file. If `.env` leaked, database compromised.
**Note:** .gitignore should protect this, but need to verify

---

### 11. 🟠 Production Credentials in Frontend .env
**Status:** HIGH  
**File:** `quickshow/client/.env`
```
VITE_CLERK_PUBLISHABLE_KEY=...
```
**Issue:** Public credentials are fine (publishable), but ensure NO secret keys
**Status:** ✅ Looks OK - only publishable keys

---

### 12. 🟠 Socket.IO Connection NOT Authenticated
**Status:** MEDIUM-HIGH  
**File:** `quickshow/server/server.js` (Lines 159-178)
```javascript
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);  // ❌ No auth check
  socket.on('join:show', (showId) => {
```
**Risk:** Unauthenticated users can join show rooms, see seat locks, and manipulate real-time data
**Fix:** Verify auth token on Socket.IO connection

---

### 13. 🟠 Seat-Lock Race Condition (Socket.IO)
**Status:** MEDIUM-HIGH  
**Issue:** Two users can simultaneously lock same seats via Socket.IO before database updates
**File:** `quickshow/client/src/pages/SeatLayout.jsx` + `quickshow/server/server.js`
**Risk:** Double-booking due to race condition
**Fix:** Use atomic MongoDB operations with transactions; add server-side lock timeout

---

## MEDIUM SEVERITY ISSUES

### 14. 🟡 No Request Body Size Limit
**Status:** MEDIUM  
**File:** `quickshow/server/server.js` (Line 54)
```javascript
app.use(express.json({...}));  // ❌ No limit specified
```
**Risk:** DoS via large payload attacks
**Fix:** Add `limit: '10kb'`

---

### 15. 🟡 Error Messages Leak Information
**Status:** MEDIUM  
**Files:** Throughout controllers
```javascript
return res.status(500).json({
  success: false,
  message: error.message  // ❌ Can leak system info
});
```
**Risk:** Information disclosure on 500 errors
**Fix:** Log full error; return generic message to client

---

### 16. 🟡 No CSRF Protection
**Status:** MEDIUM  
**Issue:** No CSRF tokens on state-changing operations
**Risk:** Cross-site request forgery if user visits malicious site while logged in
**Fix:** Implement CSRF token on POST/PUT/DELETE endpoints

---

### 17. 🟡 Missing Authorization on Some Admin Endpoints
**Status:** MEDIUM  
**Issue:** Some analytics endpoints might missing admin check
**File:** `quickshow/server/routes/analyticsRoutes.js`
**Fix:** Verify all admin routes have `requireAdminMiddleware`

---

### 18. 🟡 Booking Ownership Verification Incomplete
**Status:** MEDIUM  
**File:** `quickshow/server/controllers/bookingController.js` - `getBookingById()`
```javascript
if (booking.userId !== userId) {  // ✅ Good - ownership verified
  return res.status(403).json(...);
}
```
**Status:** ✅ Actually OK - properly verified

---

## LOW/MEDIUM SEVERITY ISSUES

### 19. 🟡 Production Logging Exposes Debug Info
**Status:** MEDIUM  
**File:** `quickshow/server/middleware/auth.js` (Lines 11-37)
```javascript
console.log('[JWT PAYLOAD DEBUG] iss:', payload.iss);  // ❌ Debug logs in production
```
**Risk:** Sensitive JWT claims logged to production logs
**Fix:** Disable debug logging in production

---

### 20. 🟡 No Input Sanitization for Movie/Show Titles
**Status:** MEDIUM  
**Issue:** User-provided text stored directly
**Fix:** Sanitize HTML/script tags

---

### 21. 🟡 No Dependency Vulnerability Scan
**Status:** MEDIUM  
**Fix:** Run `npm audit` before production

---

### 22. 🟡 Admin-Only Routes Not Protected Everywhere
**Status:** MEDIUM  
**Issue:** Need to verify all admin routes properly check `requireAdminMiddleware`

---

## DEPLOYMENT ISSUES

### 23. 🟡 Vercel Frontend Config Not Complete
**Status:** MEDIUM  
**File:** `quickshow/client/vercel.json`
```json
{
  "rewrites": [{
    "source": "/api/(.*)",
    "destination": "https://movie-ticket-booking-o9ga.onrender.com/api/$1"
  }]
}
```
**Issue:** Backend URL hardcoded. Won't work for different environments (staging/prod)
**Fix:** Use env variables: `$REACT_APP_BACKEND_URL`

---

### 24. 🟡 No Render Backend Configuration
**Status:** MEDIUM  
**Issue:** No `render.yaml` for backend deployment
**Missing:** Environment variable setup, health check configuration

---

### 25. 🟡 MongoDB Atlas Network Access
**Status:** MEDIUM  
**Issue:** Need to verify IP whitelist is properly configured
**Fix:** Ensure only Render backend IP is whitelisted

---

## VERIFICATION CHECKLIST

- [✅] Clerk JWT verification implemented
- [✅] Admin token isolation (mostly)
- [❌] Cashfree webhook signature verification
- [❌] Payment endpoint authentication
- [❌] CORS whitelist enforcement
- [❌] Rate limiting on payment endpoints
- [❌] Input validation on seats
- [❌] Helmet security headers
- [❌] Socket.IO authentication
- [❌] Request size limit
- [❌] Error message sanitization

---

## PRODUCTION READINESS: CURRENT STATUS

**🔴 NOT PRODUCTION READY**

**Blockers:**
1. Cashfree webhook signature NOT verified → Payment can be faked
2. Payment creation endpoint has NO authentication → Unauthenticated booking creation
3. CORS allows all origins → Credentials exposure
4. No rate limiting on payment endpoints → Brute force vulnerability
5. JWT secret hardcoded fallback → Admin token forgery possible
6. Socket.IO NOT authenticated → Unauthorized seat manipulation
7. Race condition on seat locking → Double booking possible
8. No security headers (Helmet) → XSS/clickjacking risk


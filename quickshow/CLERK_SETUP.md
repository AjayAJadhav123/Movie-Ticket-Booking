# Clerk Authentication Setup Guide

## Overview
This guide shows how to configure Clerk authentication for QuickShow. Clerk provides email, phone, OAuth, and multi-session support out of the box.

---

## Step 1: Create a Clerk Account

1. Go to https://clerk.com
2. Click "Create Account"
3. Sign up with email or GitHub
4. Complete the onboarding

---

## Step 2: Create an Application

1. In Clerk Dashboard, click "Create Application"
2. Choose authentication methods:
   - ✅ Email Address
   - ✅ Phone Number
   - ✅ Google (for OAuth)
   - ✅ Microsoft (optional)
3. Click "Create"
4. Wait for the application to be created

---

## Step 3: Get Your API Keys

### Location: Clerk Dashboard → API Keys

You need **TWO keys**:

#### Key 1: CLERK_SECRET_KEY (Backend)
1. In Clerk Dashboard, click "API Keys" in left sidebar
2. Find "Secret Keys" section
3. Copy the key starting with `sk_test_` or `sk_live_`
4. **Do NOT share this key**

#### Key 2: CLERK_PUBLISHABLE_KEY (Frontend)
1. In the same "API Keys" page
2. Find "Publishable Keys" section
3. Copy the key starting with `pk_test_` or `pk_live_`
4. **OK to share in frontend code**

---

## Step 4: Get Your Webhook Secret

### Location: Clerk Dashboard → Webhooks

1. In Clerk Dashboard, click "Webhooks" in left sidebar
2. Click "Add Endpoint"
3. Enter endpoint URL: `http://localhost:5000/api/user/webhooks`
4. Select events to listen for:
   - ✅ user.created
   - ✅ user.updated
   - ✅ user.deleted
5. Click "Create"
6. Copy the "Signing Secret" (starts with `whsec_`)
7. This is your **CLERK_WEBHOOK_SECRET**

---

## Step 5: Update Environment Variables

### Backend Configuration

Edit `quickshow/server/.env`:

```env
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
CLERK_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_KEY_HERE
```

**Replace** `sk_test_YOUR_ACTUAL_KEY_HERE` with the actual **CLERK_SECRET_KEY** from step 3.

**Replace** `whsec_YOUR_ACTUAL_KEY_HERE` with the actual **CLERK_WEBHOOK_SECRET** from step 4.

### Frontend Configuration

Edit `quickshow/client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

**Replace** `pk_test_YOUR_ACTUAL_KEY_HERE` with the actual **CLERK_PUBLISHABLE_KEY** from step 3.

---

## Step 6: Configure Frontend and Backend URLs

### For Local Development

In Clerk Dashboard → Settings → Domains:

1. Add "Allowed redirect URLs":
   - `http://localhost:5173`
   - `http://localhost:5173/sign-in`
   - `http://localhost:5173/sign-up`

2. Allowed CORS origins:
   - `http://localhost:5173`

---

## Step 7: Enable Authentication Methods

In Clerk Dashboard → User & Authentication → Email, Phone, etc.

### Email Authentication
1. Click "Email Address"
2. Ensure "Verification link" or "Verification code" is selected
3. ✅ Enabled

### Phone Authentication
1. Click "Phone Number"
2. Enable SMS or WhatsApp
3. ✅ Enabled

### Google OAuth
1. Click "Google"
2. If prompted, add Google OAuth credentials:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add to Clerk
3. ✅ Enabled

---

## Step 8: Restart Both Servers

### Backend
```bash
cd quickshow/server
# Restart Node process (or close and re-run)
node server.js
```

### Frontend
```bash
cd quickshow/client
# Restart Vite dev server (or close and re-run)
npm run dev
```

---

## Verification Checklist

After configuration:

- [ ] Backend server starts without Clerk errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Sign In page accessible at http://localhost:5173/sign-in
- [ ] Sign Up page accessible at http://localhost:5173/sign-up
- [ ] Can create account with email
- [ ] Can sign in with email
- [ ] User profile visible after sign in
- [ ] Sign out works
- [ ] New user synced to MongoDB (`users` collection)
- [ ] Health endpoint shows `"clerk": "configured"`

---

## Testing Authentication Flow

### Test 1: Email Signup
1. Open http://localhost:5173/sign-up
2. Enter email, password
3. Verify email (check your inbox or use test mode)
4. Sign up successful
5. Check MongoDB: New user should appear in `users` collection

### Test 2: Email Signin
1. Open http://localhost:5173/sign-in
2. Enter email and password
3. Sign in successful
4. Redirected to home page with user menu

### Test 3: Protected Routes
1. Sign in first
2. Access `/my-bookings` - should load
3. Access `/favorites` - should load
4. Access `/admin/dashboard` - shows error (not admin yet)
5. Sign out
6. Access `/my-bookings` - redirects to sign in

### Test 4: User Webhook
1. Sign up new user
2. Check MongoDB `users` collection
3. New document should exist with clerkId, name, email, image

### Test 5: Multi-Session Support
1. Open browser dev tools → Application → Cookies
2. Look for `__session` cookie (Clerk's session cookie)
3. Sign in from multiple tabs - all tabs show signed-in state
4. Sign out from one tab - all tabs become signed out
5. ✅ Multi-session working

---

## Frontend Features Enabled

When Clerk is configured:

### Sign In/Sign Up Pages
- ✅ Email signup with password
- ✅ Email signin
- ✅ Phone OTP
- ✅ Google OAuth button
- ✅ Password reset
- ✅ Email verification

### User Profile
- ✅ User menu in Navbar
- ✅ View profile
- ✅ Sign out
- ✅ Manage security

### Protected Features
- ✅ `/my-bookings` - User's ticket bookings
- ✅ `/favorites` - User's favorite movies
- ✅ `/seat-layout/:showId` - Seat booking (requires signin)
- ✅ `/admin/dashboard` - Admin panel (requires admin role)

---

## Backend Features Enabled

When Clerk is configured:

### API Protection
- ✅ `GET /api/user/me` - Get current user (requires auth)
- ✅ `GET /api/user/favorites` - Get favorites (requires auth)
- ✅ `POST /api/user/add-favorite` - Add favorite (requires auth)
- ✅ `POST /api/user/remove-favorite` - Remove favorite (requires auth)
- ✅ `POST /api/booking/create-stripe-session` - Booking (requires auth)
- ✅ `GET /api/booking/user-bookings` - User bookings (requires auth)

### Admin API Protection
- ✅ `POST /api/movie/add` - Add movie (requires admin)
- ✅ `DELETE /api/movie/:id` - Delete movie (requires admin)
- ✅ `POST /api/show/add` - Create show (requires admin)
- ✅ `DELETE /api/show/:id` - Delete show (requires admin)
- ✅ `GET /api/booking/admin-bookings` - All bookings (requires admin)
- ✅ `GET /api/booking/admin-stats` - Dashboard stats (requires admin)

### User Webhook & Sync
- ✅ `POST /api/user/webhooks` - Clerk sends user events
- ✅ MongoDB user created when signup happens
- ✅ MongoDB user updated when profile changes
- ✅ MongoDB user deleted when account deleted

---

## Admin Setup

To give yourself admin access:

### Option 1: Via Clerk Dashboard
1. Go to Clerk Dashboard → Users
2. Click on your user
3. Scroll to "Metadata" section
4. Edit "Public Metadata"
5. Add: `{"isAdmin": true}`
6. Save
7. Refresh browser
8. Now have admin access

### Option 2: Via MongoDB (Direct)
```javascript
db.users.updateOne(
  { clerkId: "your_clerk_id" },
  { $set: { isAdmin: true } }
)
```

---

## Troubleshooting

### "Clerk API error: Invalid API key"
**Issue**: Wrong or expired API key
**Fix**: Check keys in Clerk Dashboard → API Keys → Copy them again

### "Webhook verification failed"
**Issue**: Wrong webhook secret or webhook endpoint not configured
**Fix**: 
1. Check CLERK_WEBHOOK_SECRET matches exactly
2. Ensure webhook endpoint is: `http://localhost:5000/api/user/webhooks`

### "User not syncing to MongoDB"
**Issue**: Webhook not firing or database not connected
**Fix**:
1. Check MongoDB is running and connected (health endpoint shows `mongodb: configured`)
2. In Clerk Dashboard, test webhook by sending test event
3. Check backend logs for webhook errors

### "Sign in redirects to blank page"
**Issue**: Clerk component loading but config missing
**Fix**: Ensure VITE_CLERK_PUBLISHABLE_KEY is set and server restarted

### "Can't see Clerk UI components"
**Issue**: ClerkProvider not wrapping app
**Fix**: Verify VITE_CLERK_PUBLISHABLE_KEY is set (otherwise fallback UI shows)

---

## Production Setup (Later)

When deploying to production:

### Environment Variables
1. Get "live" keys from Clerk (not "test")
2. Set in Render backend:
   - `CLERK_SECRET_KEY=sk_live_xxxxx`
   - `CLERK_WEBHOOK_SECRET=whsec_xxxxx`
3. Set in Vercel frontend:
   - `VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx`

### Webhook URL
Update Clerk Dashboard → Webhooks:
- Change from `http://localhost:5000/api/user/webhooks`
- To: `https://your-render-backend.com/api/user/webhooks`

### Allowed Domains
In Clerk Dashboard → Settings → Domains:
- Add your production URL: `https://your-vercel-domain.com`

---

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| Email/Password | ✅ Ready | Configured by default |
| Phone OTP | ✅ Ready | Configured by default |
| Google OAuth | ✅ Ready | Configured by default |
| Multi-Session | ✅ Ready | Automatic |
| Webhooks | ✅ Ready | MongoDB sync enabled |
| Admin Authorization | ✅ Ready | Metadata-based |
| Protected Routes | ✅ Ready | Frontend & backend |

**Clerk authentication is fully integrated and ready to use!**

---

## Next Steps

1. ✅ Get API keys from Clerk Dashboard
2. ✅ Add keys to .env files
3. ✅ Restart backend and frontend
4. ✅ Test authentication
5. ⏭️  Configure Stripe for payments (optional)
6. ⏭️  Configure TMDB for movie import (optional)

# Clerk Webhook Setup & Configuration Guide

**Date**: August 16, 2026  
**Status**: Ready for webhook configuration

---

## ✅ Webhook Route Verification

### Exact Webhook Details

| Property | Value |
|----------|-------|
| **Webhook Route** | `POST /api/user/webhooks` |
| **Full Path** | `/api/user/webhooks` |
| **Mount Point** | `/api/user` (from server.js line 47) |
| **HTTP Method** | POST |
| **Authentication** | None (public route, Svix signature verified) |
| **Signature Library** | Svix (using `@svix/svix`) |
| **Environment Variable** | `CLERK_WEBHOOK_SECRET` |
| **Verification** | Svix HMAC signature verification ✅ |

### Code Verification

✅ Route defined in: `server/routes/userRoutes.js:11`
```javascript
router.post('/webhooks', handleClerkWebhook);
```

✅ Handler implemented in: `server/controllers/userController.js:1-75`
```javascript
export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const wh = new Webhook(WEBHOOK_SECRET);
  evt = wh.verify(payload, headers);
  // Handles: user.created, user.updated, user.deleted
}
```

✅ Mounted in: `server/server.js:47`
```javascript
app.use('/api/user', userRoutes);
```

✅ Public access: Route is NOT behind `requireAuthMiddleware`

---

## Step 1: Install ngrok (Local Tunnel)

ngrok creates a secure public HTTPS URL that tunnels to your local http://localhost:5000

### Option A: Download from Website (Recommended)
1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract and add to PATH (or run from the folder)

### Option B: Install via Package Manager (Windows)
```bash
# Using Chocolatey
choco install ngrok

# Using scoop
scoop install ngrok
```

### Option C: Direct Download
1. Download: https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip
2. Extract the folder
3. Open PowerShell in that folder
4. Run: `./ngrok.exe http 5000`

---

## Step 2: Start ngrok Tunnel

Open a **new PowerShell/CMD window** and run:

```bash
ngrok.exe http 5000
```

You should see output like:
```
ngrok                                       (Ctrl+C to quit)

Session Status                online
Account                       [your-account]
Version                        3.x.x
Region                         us (United States)
Latency                         47ms
Web Interface                  http://127.0.0.1:4040

Forwarding                     https://xxxx-xxx-xxx-xxxx.ngrok-free.app -> http://localhost:5000
Forwarding                     http://xxxx-xxx-xxx-xxxx.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL** (first Forwarding line):
```
https://xxxx-xxx-xxx-xxxx.ngrok-free.app
```

**Keep this terminal open** while testing webhooks.

---

## Step 3: Configure Clerk Webhook

### Navigate to Clerk Dashboard

1. Go to: https://dashboard.clerk.com
2. Select your application
3. Navigate to **API & Keys**
4. Find **Webhooks** section
5. Click **"+ Add Endpoint"**

### Add Webhook Endpoint

Fill in the form:

**Endpoint URL:**
```
https://xxxx-xxx-xxx-xxxx.ngrok-free.app/api/user/webhooks
```
(Replace `xxxx-xxx-xxx-xxxx.ngrok-free.app` with your actual ngrok URL)

**Subscribe to Events:**
- ✅ Check `user.created`
- ✅ Check `user.updated`
- ✅ Check `user.deleted`

**Click "Create"**

### Get Webhook Secret

After creating, Clerk will show:
- **Signing Secret**: `whsec_...` (copy this)
- **Webhook ID**: `wh_...` (for reference)

Copy the **Signing Secret** exactly.

---

## Step 4: Configure Backend Environment

Update `server/.env`:

```env
# Existing config
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/quickshow
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173

# Add this line with the webhook secret from Clerk
CLERK_WEBHOOK_SECRET=whsec_xxxxxx_paste_your_secret_here
```

⚠️ **IMPORTANT**: 
- Paste the EXACT secret from Clerk Dashboard
- Do NOT create a new variable name
- Use `CLERK_WEBHOOK_SECRET` (already implemented)
- Do NOT use `CLERK_WEBHOOK_SIGNING_SECRET`

---

## Step 5: Restart Backend

Stop and restart the backend to load the new environment variable:

```bash
# Stop current process
Ctrl+C

# Start backend again
node server.js
```

Expected output:
```
✅ QuickShow server running on port 5000
🚀 Environment: development
✅ MongoDB Connected: localhost
```

If you see webhook errors, check:
- ✅ `CLERK_WEBHOOK_SECRET` is in `.env`
- ✅ Backend restarted (old process stopped)
- ✅ ngrok tunnel is still running

---

## Step 6: Test Webhook

### Test 1: Create Test User

1. Open http://localhost:5173/sign-up
2. Sign up with test credentials:
   ```
   Email: webhook-test@example.com
   Password: TestPassword123!
   ```
3. Complete signup

### Monitor Backend Logs

Watch the terminal running `node server.js`:

**Success (you should see):**
```
✅ User created: user_xxx
POST /api/user/webhooks 200
```

**Error (if you see):**
```
Webhook verification failed
Error processing webhook
```

If you see errors, check:
- ngrok URL matches Clerk webhook URL
- `CLERK_WEBHOOK_SECRET` is correct
- Backend restarted after adding secret
- Webhook events are subscribed (`user.created`, etc.)

### Test 2: Verify MongoDB User

1. Open MongoDB Compass or use MongoDB CLI
2. Connect to: `mongodb://localhost:27017`
3. Navigate to: `quickshow` → `users`
4. Should see new user with:
   ```json
   {
     "clerkId": "user_xxx",
     "name": "webhook-test@example.com",
     "email": "webhook-test@example.com",
     "image": null,
     "favorites": [],
     "createdAt": "2024-08-16...",
     "updatedAt": "2024-08-16..."
   }
   ```

---

## Webhook Event Types

### user.created
Triggered when: New user signs up or is created
Syncs to MongoDB: Creates new user document

### user.updated
Triggered when: User updates profile, email, name, etc.
Syncs to MongoDB: Updates existing user document

### user.deleted
Triggered when: User is deleted from Clerk
Syncs to MongoDB: Deletes user document

---

## Troubleshooting

### Issue: "Webhook verification failed"
**Cause**: Webhook secret doesn't match
**Solution**:
1. Copy webhook secret again from Clerk Dashboard
2. Update `CLERK_WEBHOOK_SECRET` in `.env`
3. Restart backend: `Ctrl+C` then `node server.js`

### Issue: ngrok URL shows "Connection refused"
**Cause**: Backend not running on port 5000
**Solution**:
1. Verify backend running: `node server.js` in server folder
2. Check port 5000: `netstat -ano | findstr :5000`
3. Restart ngrok: `ngrok.exe http 5000`

### Issue: "Webhook not triggered after signup"
**Cause**: Webhook endpoint not configured in Clerk
**Solution**:
1. Check Clerk Dashboard → Webhooks
2. Verify endpoint URL is correct
3. Verify events subscribed (user.created, user.updated, user.deleted)
4. Test webhook using Clerk's "Test Endpoint" button

### Issue: User not appearing in MongoDB
**Cause**: Webhook processed but MongoDB save failed
**Solution**:
1. Check backend logs for errors
2. Verify MongoDB connection: `http://localhost:5000/health`
3. Check MongoDB has `quickshow` database with `users` collection

### Issue: "Port 5000 already in use"
**Cause**: Another process using port 5000
**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID 1234 /F
```

---

## Webhook Testing Checklist

- [ ] ngrok installed and running
- [ ] ngrok shows HTTPS URL
- [ ] Backend running on port 5000
- [ ] `CLERK_WEBHOOK_SECRET` added to `server/.env`
- [ ] Backend restarted after adding secret
- [ ] Webhook endpoint created in Clerk Dashboard
- [ ] Webhook URL matches ngrok URL
- [ ] Events subscribed: user.created, user.updated, user.deleted
- [ ] Test user created via sign-up
- [ ] Backend logs show "✅ User created"
- [ ] User appears in MongoDB with clerkId
- [ ] User profile update syncs to MongoDB
- [ ] No errors in backend terminal

---

## Local Development Architecture

```
┌─────────────────────────────────────────┐
│  Clerk Dashboard (Cloud)               │
│  - Webhook configuration                │
│  - User management                      │
└──────────────┬──────────────────────────┘
               │ HTTPS Webhook
               │ (from Clerk → ngrok)
               ▼
┌─────────────────────────────────────────┐
│  ngrok Tunnel (Local)                   │
│  https://xxxx-xxxx.ngrok-free.app      │
└──────────────┬──────────────────────────┘
               │ HTTPS → HTTP
               │ (tunnel to localhost)
               ▼
┌─────────────────────────────────────────┐
│  Backend (Local - port 5000)            │
│  POST /api/user/webhooks                │
│  - Receives webhook                     │
│  - Verifies Svix signature              │
│  - Syncs user to MongoDB                │
└──────────────┬──────────────────────────┘
               │ MongoDB operations
               ▼
┌─────────────────────────────────────────┐
│  MongoDB (Local - port 27017)           │
│  - users collection                     │
│  - User data synced from Clerk          │
└─────────────────────────────────────────┘
```

---

## Current Configuration Summary

### ✅ Backend
- Route: `POST /api/user/webhooks`
- Environment Variable: `CLERK_WEBHOOK_SECRET`
- Verification: Svix HMAC signature
- Handler: Supports user.created, user.updated, user.deleted

### ✅ Database
- MongoDB: localhost:27017
- Database: quickshow
- Collection: users (ready for sync)

### ⏳ Local Tunnel (Next Step)
- ngrok: Not yet installed
- Status: Ready to install

### ⏳ Clerk Webhook (Next Step)
- Status: Ready to configure
- URL: Will be `https://[ngrok-url]/api/user/webhooks`

---

## Quick Reference

**Webhook Route**: `POST /api/user/webhooks`

**Environment Variable**: `CLERK_WEBHOOK_SECRET`

**ngrok Command**: `ngrok.exe http 5000`

**Clerk Dashboard**: https://dashboard.clerk.com → API & Keys → Webhooks

**Test Endpoint**: http://localhost:5173/sign-up

**Verify Sync**: MongoDB Compass → quickshow → users

---

## Next Actions

1. ✅ **Download ngrok** from https://ngrok.com/download
2. ✅ **Extract ngrok** and add to PATH
3. ✅ **Run ngrok**: `ngrok.exe http 5000`
4. ✅ **Copy ngrok URL** (the HTTPS one)
5. ✅ **Go to Clerk Dashboard** and add webhook endpoint
6. ✅ **Configure endpoint URL**: `https://[ngrok-url]/api/user/webhooks`
7. ✅ **Subscribe to events**: user.created, user.updated, user.deleted
8. ✅ **Copy webhook secret** from Clerk
9. ✅ **Update server/.env**: Add `CLERK_WEBHOOK_SECRET`
10. ✅ **Restart backend**: `node server.js`
11. ✅ **Test signup**: Create user at http://localhost:5173/sign-up
12. ✅ **Verify MongoDB**: Check users collection for synced user

---

**Status**: Ready to configure webhook  
**Last Updated**: August 16, 2026  
**Next Step**: Install ngrok and start tunnel

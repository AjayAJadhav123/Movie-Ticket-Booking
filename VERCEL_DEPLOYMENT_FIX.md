# Vercel Deployment - Admin Routes Fix

## Problem: Admin routes redirect to home page on production

This happens because:
1. Vercel needs proper routing configuration for React Router (SPA)
2. Environment variables might not be set correctly

---

## Fix 1: Update vercel.json (Already Done)

I've updated your `vercel.json` to use `routes` instead of `rewrites`.

---

## Fix 2: Set Environment Variables in Vercel Dashboard

### Go to Vercel Dashboard:

1. Visit: https://vercel.com/dashboard
2. Select your project: `movie-ticket-booking`
3. Go to: **Settings** → **Environment Variables**

### Add these variables:

**For Production:**

```
Name: VITE_BACKEND_URL
Value: https://movie-ticket-booking-09ga.onrender.com
Environment: Production
```

```
Name: VITE_CLERK_PUBLISHABLE_KEY
Value: pk_test_... (your Clerk publishable key)
Environment: Production
```

```
Name: VITE_STRIPE_PUBLIC_KEY  
Value: pk_test_... (your Stripe public key)
Environment: Production
```

**Important**: Copy the values from your local `.env` file:
- Open: `quickshow/client/.env`
- Copy the actual values (not the variable names)

---

## Fix 3: Redeploy

After setting environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **3 dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. OR push a new commit to GitHub (auto-deploys)

---

## Fix 4: Make Yourself Admin in Production Database

Your production backend uses a **production MongoDB**. You need to make yourself admin there too!

### Option A: Use Production Backend Script

If you have SSH access to Render:
```bash
# SSH into Render
node scripts/set-admin.js <YOUR_CLERK_ID>
```

### Option B: Use MongoDB Atlas Directly

1. Go to: https://cloud.mongodb.com
2. Navigate to your cluster
3. Click **Collections**
4. Find the `users` collection
5. Find your user document (by email or clerkId)
6. Click **Edit Document**
7. Add or update field:
   ```json
   {
     "isAdmin": true
   }
   ```
8. Click **Update**

### Option C: Run Script Against Production DB (Easiest)

Update your local `server/.env` temporarily:

```bash
# Backup your current MONGODB_URI
cp server/.env server/.env.backup

# Edit server/.env and change MONGODB_URI to production MongoDB
# Then run:
cd quickshow/server
node scripts/set-admin.js <YOUR_CLERK_ID>

# Restore your local .env
mv server/.env.backup server/.env
```

---

## Fix 5: Verify Environment Variables Loaded

After deployment, check if env vars are loaded:

### Test in Browser Console:

1. Open: https://movie-ticket-booking-tan.vercel.app
2. Press F12 (Console)
3. Type:
   ```javascript
   console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
   ```

**Expected**: Should show `https://movie-ticket-booking-09ga.onrender.com`

**If undefined**: Environment variables not set properly in Vercel

---

## Fix 6: Check Backend CORS

Your production backend must allow the Vercel frontend:

In Render dashboard (backend service):
1. Go to **Environment** tab
2. Verify `FRONTEND_URL` is set to:
   ```
   https://movie-ticket-booking-tan.vercel.app
   ```

---

## Complete Deployment Checklist

### Frontend (Vercel):
- [ ] `vercel.json` configured with routes (done)
- [ ] Environment variables set in Vercel dashboard
  - [ ] `VITE_BACKEND_URL`
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY`
  - [ ] `VITE_STRIPE_PUBLIC_KEY`
- [ ] Redeployed after adding env vars

### Backend (Render):
- [ ] `FRONTEND_URL` set to Vercel URL
- [ ] `CORS_ORIGINS` includes Vercel URL
- [ ] Backend is running and accessible

### Database (MongoDB):
- [ ] Your user exists in production database
- [ ] Your user has `isAdmin: true` field
- [ ] Can verify via MongoDB Atlas web interface

### Testing:
- [ ] Visit: https://movie-ticket-booking-tan.vercel.app
- [ ] Sign in at home page
- [ ] Visit: https://movie-ticket-booking-tan.vercel.app/admin
- [ ] Sign in again at admin page
- [ ] Should redirect to: /admin/dashboard

---

## Quick Test Commands

### Test 1: Check if site loads
```bash
curl https://movie-ticket-booking-tan.vercel.app
```

### Test 2: Check backend connectivity
```bash
curl https://movie-ticket-booking-09ga.onrender.com/health
```

### Test 3: Check admin endpoint
```bash
# Replace TOKEN with your Clerk JWT token
curl -H "Authorization: Bearer TOKEN" \
  https://movie-ticket-booking-09ga.onrender.com/api/user/check-admin
```

---

## After Fixing, Test This Flow:

1. **Go to**: https://movie-ticket-booking-tan.vercel.app
2. **Sign in** (top-right corner)
3. **Copy your user ID** from console or profile
4. **Make yourself admin** (via MongoDB Atlas or script)
5. **Go to**: https://movie-ticket-booking-tan.vercel.app/admin
6. **Sign in again**
7. **Should see**: Admin Dashboard

---

## Common Issues

### Issue: "VITE_BACKEND_URL is undefined"
**Cause**: Environment variables not set in Vercel
**Fix**: Add them in Vercel dashboard → Settings → Environment Variables → Redeploy

### Issue: "Network Error" or "Failed to fetch"
**Cause**: Backend not allowing Vercel frontend (CORS)
**Fix**: In Render, set `FRONTEND_URL=https://movie-ticket-booking-tan.vercel.app`

### Issue: "Admin access required"
**Cause**: Not marked as admin in production database
**Fix**: Use MongoDB Atlas to set `isAdmin: true` on your user

### Issue: Routes still redirect to home
**Cause**: Vercel routing not updated
**Fix**: 
1. Commit and push the new `vercel.json`
2. Wait for auto-deploy
3. Or manually trigger redeploy in Vercel

---

## Files to Commit

Commit and push these changes:

```bash
git add quickshow/client/vercel.json
git add quickshow/client/src/App.jsx  # (with debug logs)
git commit -m "Fix Vercel routing and add admin debug logs"
git push origin main
```

Vercel will auto-deploy!

---

## Need More Help?

1. Share your browser console logs (F12)
2. Check Vercel deployment logs
3. Check Render backend logs
4. Verify environment variables in both platforms

The debug logs in App.jsx will show you exactly where it's failing!

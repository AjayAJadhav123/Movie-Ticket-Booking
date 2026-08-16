# Clerk Authentication - Testing Guide

## Quick Start Testing

### 1. Open Frontend
```
http://localhost:5173
```
You should see:
- ✅ QuickShow homepage
- ✅ Navbar with authentication options
- ✅ UserButton (if logged in) or Sign In/Sign Up buttons

---

## Test Scenarios

### Test 1: Public Pages (No Login Required)
All these should work WITHOUT signing in:

1. **Home Page**
   - Navigate to `http://localhost:5173`
   - Should show movie listings
   - ✅ Expected: Loads successfully

2. **All Movies**
   - Navigate to `http://localhost:5173/movies`
   - Should show list of movies
   - ✅ Expected: Loads successfully (empty if no movies added)

3. **Movie Details**
   - Navigate to `http://localhost:5173/movie/123` (any movie ID)
   - ✅ Expected: Movie detail page or empty state

---

### Test 2: Authentication Routes

#### Sign Up
1. Navigate to `http://localhost:5173/sign-up`
2. You should see:
   - ✅ Clerk SignUp component
   - ✅ Email field
   - ✅ Password field
   - ✅ "Already have an account? Sign in" link
   - ✅ "Continue with Google" button (if OAuth configured)

3. Fill in form:
   ```
   Email: testuser@example.com
   Password: TestPassword123!
   ```

4. Click "Continue" or "Sign Up"

5. After signup:
   - ✅ Redirect to home page
   - ✅ Navbar should show UserButton with your email
   - ✅ Protected routes should become accessible

#### Sign In
1. Navigate to `http://localhost:5173/sign-in`
2. You should see:
   - ✅ Clerk SignIn component
   - ✅ Email field
   - ✅ Password field
   - ✅ "Don't have an account? Sign up" link

3. Enter credentials from signup test

4. Click "Continue"

5. After signin:
   - ✅ Redirect to home page
   - ✅ UserButton shows your email

---

### Test 3: Protected Routes (Login Required)

Try accessing these WITHOUT being signed in:

1. **My Bookings**
   - Navigate to `http://localhost:5173/my-bookings`
   - ✅ Expected: Redirect to sign-in page

2. **Favorites**
   - Navigate to `http://localhost:5173/favorites`
   - ✅ Expected: Redirect to sign-in page

3. **Seat Layout**
   - Navigate to `http://localhost:5173/seat-layout/anyid`
   - ✅ Expected: Redirect to sign-in page

Then **sign in** and try again:
- ✅ Expected: Pages now load (empty state if no data)

---

### Test 4: Admin Routes (Admin-Only)

Try accessing these WITHOUT being admin:

1. **Admin Dashboard**
   - Navigate to `http://localhost:5173/admin/dashboard`
   - ✅ Expected: Redirect to home (or sign-in if not logged in)

2. **Add Shows**
   - Navigate to `http://localhost:5173/admin/add-shows`
   - ✅ Expected: Redirect to home

3. **List Shows**
   - Navigate to `http://localhost:5173/admin/list-shows`
   - ✅ Expected: Redirect to home

**To test as admin**:
- Sign up with test account
- Go to Clerk Dashboard
- Find your test user
- Set `isAdmin: true` in metadata
- Refresh page
- Admin routes should now be accessible

---

### Test 5: UserButton & Sessions

1. **Sign In**
   - Sign up/sign in with test account
   - Navbar should show UserButton

2. **Click UserButton**
   - Should show dropdown with:
     - Your email
     - "Manage account"
     - "Sign out"

3. **Click "Sign out"**
   - Should redirect to home
   - UserButton should disappear
   - Protected routes should redirect to sign-in

4. **Multi-Session Support**
   - Open two browser tabs
   - Sign in as different users in each tab
   - Switch tabs - each should show correct user
   - ✅ Expected: Clerk handles multi-session automatically

---

### Test 6: API Authentication

#### Public Endpoint (No Auth Required)
```bash
curl http://localhost:5000/api/movie/list
# ✅ Expected: 200 OK, returns {"success": true, "data": [...]}
```

#### Protected Endpoint (Auth Required)
```bash
# Without auth header
curl http://localhost:5000/api/user/profile
# ❌ Expected: 401 Unauthorized

# With Clerk session (automatic from frontend)
# Navigate to frontend, then endpoints called from browser will have auth
```

---

### Test 7: Backend Health Check
```bash
curl http://localhost:5000/health
```

Response should show:
```json
{
  "success": true,
  "message": "Server is running",
  "mongodb": "configured",
  "clerk": "configured"
}
```

✅ All should be "configured"

---

### Test 8: MongoDB User Sync (After Webhook Configuration)

Once webhook is configured:

1. **Create User via UI**
   - Sign up new user at `http://localhost:5173/sign-up`
   - After signup, check MongoDB:
   ```
   db.users.find({email: "testuser@example.com"})
   ```
   - ✅ Expected: User exists with clerkId, name, email

2. **Update User Profile**
   - Click UserButton → "Manage account"
   - Update name or profile picture in Clerk
   - Check MongoDB again
   - ✅ Expected: Changes synced to MongoDB

3. **Delete User**
   - Go to Clerk Dashboard
   - Delete your test user
   - Check MongoDB
   - ✅ Expected: User removed from database

---

## Troubleshooting

### Issue: "Clerk keys missing" error
**Solution**: Check that both .env files have:
- Backend: `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY`

### Issue: Sign-up/Sign-in page blank
**Solution**: 
- Check browser console for errors
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is valid
- Restart frontend: `npm run dev`

### Issue: Protected routes not redirecting
**Solution**:
- Check that ClerkProvider wraps app
- Verify ProtectedRoute component is used
- Check useUser() hook returns correct data

### Issue: Webhook not syncing to MongoDB
**Solution**:
- Webhook not yet configured (intentional)
- Next step: Configure webhook secret in Clerk Dashboard
- Add endpoint: `http://localhost:5000/api/user/webhook`

---

## Expected Test Results

### ✅ All Should Pass
- [ ] Public pages load without login
- [ ] Sign-up form visible and works
- [ ] Sign-in form visible and works
- [ ] Protected routes redirect to sign-in when logged out
- [ ] Protected routes accessible when logged in
- [ ] UserButton shows correct user
- [ ] Sign out works correctly
- [ ] Admin routes redirect when not admin
- [ ] Health endpoint returns "configured" for all services

### ⏳ Will Pass After Webhook Setup
- [ ] Signup creates user in MongoDB
- [ ] User updates sync to MongoDB
- [ ] User deletion syncs to MongoDB

---

## Next: Webhook Configuration

When ready to test MongoDB sync, configure webhook:

1. Go to https://dashboard.clerk.com
2. Select your application
3. API & Keys → Webhooks
4. Add Endpoint:
   - **URL**: `http://localhost:5000/api/user/webhook`
   - **Events**: `user.created`, `user.updated`, `user.deleted`
   - Click "Create"
5. Copy the **Webhook Secret** (whsec_...)
6. Update `CLERK_WEBHOOK_SECRET` in `server/.env`
7. Restart backend: `Ctrl+C` then `node server.js`
8. Test by creating new user via signup form
9. Check MongoDB: `db.users.find()`

---

**Quick Links**:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health: http://localhost:5000/health
- Clerk Dashboard: https://dashboard.clerk.com
